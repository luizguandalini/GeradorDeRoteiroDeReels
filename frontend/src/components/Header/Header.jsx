import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSettingsClick = () => {
    if (isAdmin()) {
      navigate('/configuracoes');
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">Shaka</h1>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <FiUser className="user-icon" />
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">
                {user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
              </span>
            </div>
          </div>
          
          {isAdmin() && (
            <button 
              className="header-button settings-button"
              onClick={handleSettingsClick}
              title="Configurações"
            >
              <FiSettings />
            </button>
          )}
          
          <button 
            className="header-button logout-button"
            onClick={handleLogout}
            title="Sair"
          >
            <FiLogOut />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;