import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('shaka_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('shaka_token') || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const refreshTimerRef = useRef(null);
  const refreshAccessTokenRef = useRef(null);
  const refreshPromiseRef = useRef(null);

  const applyAuthHeader = useCallback((accessToken) => {
    if (accessToken) {
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, []);

  const clearScheduledRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const setSession = useCallback((accessToken, userData) => {
    setToken(accessToken);
    setUser(userData);
    applyAuthHeader(accessToken);
    
    // Persistir no localStorage
    try {
      if (accessToken) {
        localStorage.setItem('shaka_token', accessToken);
      } else {
        localStorage.removeItem('shaka_token');
      }
      
      if (userData) {
        localStorage.setItem('shaka_user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('shaka_user');
      }
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  }, [applyAuthHeader]);

  const clearSession = useCallback(() => {
    clearScheduledRefresh();
    setToken(null);
    setUser(null);
    applyAuthHeader(null);
    
    // Limpar localStorage
    try {
      localStorage.removeItem('shaka_token');
      localStorage.removeItem('shaka_user');
    } catch (error) {
      console.error('Erro ao limpar dados do localStorage:', error);
    }
  }, [applyAuthHeader, clearScheduledRefresh]);

  const scheduleTokenRefresh = useCallback((expiresInSeconds) => {
    clearScheduledRefresh();

    const expiresAsNumber = typeof expiresInSeconds === 'number' ? expiresInSeconds : parseInt(expiresInSeconds, 10);

    if (!expiresAsNumber || Number.isNaN(expiresAsNumber)) {
      return;
    }

    const preRefreshOffsetSeconds = 60;
    const delay = Math.max((expiresAsNumber - preRefreshOffsetSeconds) * 1000, 5000);

    refreshTimerRef.current = setTimeout(() => {
      if (refreshAccessTokenRef.current) {
        refreshAccessTokenRef.current().catch((error) => {
          console.error('Falha ao renovar token automaticamente:', error);
        });
      }
    }, delay);
  }, [clearScheduledRefresh]);

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await axios.post('/api/auth/refresh', null, {
        __isRefreshRequest: true,
        __skipAuthRefresh: true
      });

      const { token: newToken, user: userData, expiresIn } = response.data;

      if (!newToken || !userData) {
        throw new Error('Resposta inválida ao renovar token');
      }

      setSession(newToken, userData);
      scheduleTokenRefresh(expiresIn);

      return { token: newToken, user: userData };
    } catch (error) {
      // Limpar a sessão apenas se o erro for de autenticação (ex: 401, 403)
      if (error.response && [401, 403].includes(error.response.status)) {
        clearSession();
      }
      // Para outros erros (ex: rede), o erro é lançado mas a sessão local é mantida
      throw error;
    }
  }, [setSession, scheduleTokenRefresh, clearSession]);

  useEffect(() => {
    refreshAccessTokenRef.current = refreshAccessToken;
  }, [refreshAccessToken]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Se já temos token salvo, tentar validar/renovar
        if (token) {
          await refreshAccessToken();
        }
      } catch {
        // Se falhar, limpar sessão
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    return () => {
      clearScheduledRefresh();
    };
  }, [clearScheduledRefresh]);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      if (config.__isRefreshRequest) {
        delete config.__isRefreshRequest;
        return config;
      }

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { response, config } = error;

        if (!config || config.__skipAuthRefresh) {
          return Promise.reject(error);
        }

        if (response?.status !== 401 || config._retry) {
          return Promise.reject(error);
        }

        config._retry = true;

        if (!refreshPromiseRef.current) {
          refreshPromiseRef.current = refreshAccessToken().finally(() => {
            refreshPromiseRef.current = null;
          });
        }

        try {
          const refreshResult = await refreshPromiseRef.current;
          if (!refreshResult?.token) {
            return Promise.reject(error);
          }

          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${refreshResult.token}`
          };

          return axios(config);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token, refreshAccessToken]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password }, { __skipAuthRefresh: true });

      const { token: newToken, user: userData, expiresIn } = response.data;
      setSession(newToken, userData);
      scheduleTokenRefresh(expiresIn);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Erro no login'
      };
    }
  }, [setSession, scheduleTokenRefresh]);

  const loginWithGoogle = useCallback(async (credential) => {
    try {
      const response = await axios.post('/api/auth/google', { token: credential }, { __skipAuthRefresh: true });

      const { token: newToken, user: userData, expiresIn } = response.data;
      setSession(newToken, userData);
      scheduleTokenRefresh(expiresIn);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Erro no login com Google:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Não foi possível autenticar com Google'
      };
    }
  }, [setSession, scheduleTokenRefresh]);

  const register = useCallback(async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData, { __skipAuthRefresh: true });
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Erro no registro:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Erro no registro'
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout', null, { __skipAuthRefresh: true });
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateUser = useCallback((updater) => {
    setUser((prevUser) => {
      let newUser;
      if (typeof updater === "function") {
        newUser = updater(prevUser);
      } else if (!prevUser) {
        newUser = updater ?? null;
      } else if (!updater) {
        newUser = prevUser;
      } else {
        newUser = {
          ...prevUser,
          ...updater,
        };
      }
      
      // Persistir no localStorage
      try {
        if (newUser) {
          localStorage.setItem('shaka_user', JSON.stringify(newUser));
        } else {
          localStorage.removeItem('shaka_user');
        }
      } catch (error) {
        console.error('Erro ao salvar usuário atualizado no localStorage:', error);
      }
      
      return newUser;
    });
  }, []);

  const isAdmin = useCallback(() => user?.role === 'ADMIN', [user]);

  const isAuthenticated = useCallback(() => Boolean(user && token), [user, token]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    isAdmin,
    isAuthenticated,
    refreshAccessToken,
    updateUser
  }), [user, token, loading, login, loginWithGoogle, register, logout, isAdmin, isAuthenticated, refreshAccessToken, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



