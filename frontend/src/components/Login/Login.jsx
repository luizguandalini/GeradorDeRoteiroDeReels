import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LanguageSwitch from "../LanguageSwitch/LanguageSwitch";
import { useTranslation, useLanguage } from "../../contexts/LanguageContext";
import "./Login.css";

const toastStyles = {
  success: {
    style: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "#ffffff",
      fontWeight: "500",
    },
  },
  error: {
    style: {
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      color: "#ffffff",
      fontWeight: "500",
    },
  },
};

const normalizeMessage = (message) => {
  if (!message) {
    return "";
  }
  return typeof message === "string" ? message : String(message);
};

const Login = () => {
  const { login, loginWithGoogle, updateUser } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { isValidLanguage } = useLanguage(); // Importar função de validação
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasLanguageOverride, setHasLanguageOverride] = useState(false);
  const googleButtonRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const showSuccessToast = useCallback(
    (message) => {
      toast.success(message, toastStyles.success);
    },
    []
  );

  const showErrorToast = useCallback(
    (message) => {
      toast.error(message, toastStyles.error);
    },
    []
  );

  const handleLanguageSelect = useCallback(
    (nextLanguage) => {
      if (nextLanguage === language) {
        return;
      }

      setHasLanguageOverride(true);
      setLanguage(nextLanguage);
    },
    [language, setLanguage]
  );

  const persistLanguagePreference = useCallback(async (targetLanguage) => {
    // Validar idioma antes de enviar para o backend
    if (!isValidLanguage(targetLanguage)) {
      console.error(`Idioma inválido: ${targetLanguage}`);
      throw new Error("Idioma inválido");
    }
    
    const response = await axios.patch("/api/users/language", { language: targetLanguage });
    return response?.data?.user;
  }, [isValidLanguage]);

  const finalizeLanguagePreference = useCallback(
    async (userData) => {
      try {
        if (hasLanguageOverride || !userData?.language) {
          const desiredLanguage = language;

          if (userData?.language !== desiredLanguage) {
            const updatedUser = await persistLanguagePreference(desiredLanguage);
            if (updatedUser) {
              updateUser(updatedUser);
            } else if (userData) {
              updateUser((current) => (current ? { ...current, language: desiredLanguage } : current));
            }
          } else {
            updateUser((current) => (current ? { ...current, language: desiredLanguage } : current));
          }

          setLanguage(desiredLanguage);
        } else if (userData?.language) {
          setLanguage(userData.language);
          updateUser(userData);
        }
      } catch (error) {
        console.error("Erro ao persistir preferencia de idioma:", error);
        if (userData?.language) {
          setLanguage(userData.language);
          updateUser(userData);
        }
        showErrorToast(t("common.messages.languageUpdateError"));
      } finally {
        setHasLanguageOverride(false);
      }
    },
    [hasLanguageOverride, language, persistLanguagePreference, setLanguage, updateUser, showErrorToast, t]
  );

  const handleGoogleCredential = useCallback(
    async (response) => {
      if (!response?.credential) {
        showErrorToast(t("login.feedback.googleCredentialMissing"));
        return;
      }

      setIsLoading(true);

      const result = await loginWithGoogle(response.credential);

      if (result.success) {
        await finalizeLanguagePreference(result.user);
        showSuccessToast(t("login.feedback.googleLoginSuccess"));
        navigate("/");
      } else {
        const message = normalizeMessage(result.error) || t("login.feedback.invalidCredentials");
        setErrors({ general: message });
        showErrorToast(message);
      }

      setIsLoading(false);
    },
    [finalizeLanguagePreference, loginWithGoogle, navigate, showErrorToast, showSuccessToast, t]
  );

  useEffect(() => {
    if (!googleClientId || googleReady) {
      return undefined;
    }

    let attempts = 0;
    const maxAttempts = 30;
    let intervalId = null;

    const tryInitialize = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
          ux_mode: "popup",
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          width: 320,
        });

        setGoogleReady(true);
        return true;
      }
      return false;
    };

    if (!tryInitialize()) {
      intervalId = setInterval(() => {
        attempts += 1;
        if (tryInitialize()) {
          clearInterval(intervalId);
        } else if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          console.error("Google Sign-In script did not initialize.");
          showErrorToast(t("login.feedback.googleLoadError"));
        }
      }, 200);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [googleClientId, googleReady, handleGoogleCredential, showErrorToast, t]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (errors.general) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.general;
        return next;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});

    const validationErrors = {};

    if (!formData.email.trim()) {
      validationErrors.email = t("login.validation.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      validationErrors.email = t("login.validation.emailInvalid");
    }

    if (!formData.password.trim()) {
      validationErrors.password = t("login.validation.passwordRequired");
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        await finalizeLanguagePreference(result.user);
        showSuccessToast(t("login.feedback.loginSuccess"));
        navigate("/");
      } else {
        const rawMessage = normalizeMessage(result.error);
        const normalized = rawMessage.toLowerCase();

        if (normalized.includes("email")) {
          const message = t("login.feedback.emailNotFound");
          setErrors({ email: message });
          showErrorToast(message);
        } else if (normalized.includes("senha") || normalized.includes("password")) {
          const message = t("login.feedback.passwordIncorrect");
          setErrors({ password: message });
          showErrorToast(message);
        } else {
          const message = rawMessage || t("login.feedback.invalidCredentials");
          setErrors({ general: message });
          showErrorToast(message);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      const message = t("login.feedback.connectionErrorDetailed");
      setErrors({ general: message });
      showErrorToast(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-language">
          <LanguageSwitch
            value={language}
            onChange={handleLanguageSelect}
            disabled={isLoading}
            size="sm"
          />
        </div>

        <div className="login-header">
          <h1>{t("login.header.title")}</h1>
          <p>{t("login.header.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errors.general && (
            <div className="error-message">
              <svg className="error-icon" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder={t("login.fields.emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
              required
              autoComplete="email"
            />
            {errors.email && (
              <div className="error-message">
                <svg className="error-icon" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t("login.fields.passwordPlaceholder")}
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "error" : ""}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? t("login.aria.hidePassword") : t("login.aria.showPassword")}
              >
                {showPassword ? (
                  <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M1 1l22 22"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <div className="error-message">
                <svg className="error-icon" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.password}
              </div>
            )}
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? t("login.actions.submitting") : t("login.actions.submit")}
          </button>
        </form>

        {googleClientId && (
          <div className="divider">
            <span></span>
            <p>{t("login.actions.continueWith")}</p>
            <span></span>
          </div>
        )}

        <div className="social-login">
          {googleClientId && (
            <div
              className="google-button"
              ref={googleButtonRef}
              aria-disabled={!googleReady}
            ></div>
          )}
        </div>

        <div className="login-footer">
          <p>{t("login.footer.tagline")}</p>
          <a
            href="https://www.linkedin.com/in/luizguandalini/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("login.footer.credit")}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;