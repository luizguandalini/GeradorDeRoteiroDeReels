import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se requer privilégios de admin
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="access-denied">
        <h2>Acesso Negado</h2>
        <p>Você não tem permissão para acessar esta página.</p>
        <p>Esta área é restrita a administradores.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;