import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaCog, 
  FaCode, 
  FaMoon, 
  FaSun, 
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = ({ 
  darkMode, 
  toggleTheme, 
  mockMode, 
  toggleMockMode,
  isCollapsed,
  setIsCollapsed 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const getGreetingDetails = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return { salutation: 'Bom dia', emoji: '🌞' };
    }

    if (hour >= 12 && hour < 18) {
      return { salutation: 'Boa tarde', emoji: '🌇' };
    }

    if (hour >= 18 && hour < 24) {
      return { salutation: 'Boa noite', emoji: '🌙' };
    }

    return { salutation: 'Boa madrugada', emoji: '🌌' };
  };

  const { salutation, emoji } = getGreetingDetails();
  const admin = isAdmin();
  const displayName = admin ? 'Patrão' : user?.name || 'Usuário';
  const greetingMessage = `${salutation} ${displayName} ${emoji}`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    {
      path: '/',
      icon: FaHome,
      label: 'Página Inicial',
      id: 'home'
    },
    {
      path: '/configuracoes',
      icon: FaCog,
      label: 'Configurações do Sistema',
      id: 'config',
      adminOnly: true
    }
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${darkMode ? 'dark-theme' : ''}`}>
      {/* Header da Sidebar */}
      <div className="sidebar-header">
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
        {!isCollapsed && (
          <h3 className="sidebar-title">Menu</h3>
        )}
      </div>

      {/* Navegação */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems
            .filter(item => !item.adminOnly || admin)
            .map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.id} className="nav-item">
                <Link 
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className="nav-icon" />
                  {!isCollapsed && (
                    <span className="nav-label">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Controles de Modo */}
      <div className="sidebar-controls">
        {!isCollapsed && (
          <div className="sidebar-greeting">
            <span className="greeting-text">{greetingMessage}</span>
          </div>
        )}

        {/* Logout Button */}
        <div className="control-item">
          <button 
            className="control-button logout-control"
            onClick={handleLogout}
            title="Sair"
          >
            <FiLogOut className="control-icon" />
            {!isCollapsed && (
              <span className="control-label">Sair</span>
            )}
          </button>
        </div>

        {/* Toggle Dark/Light Mode */}
        <div className="control-item">
          <button 
            className="control-button"
            onClick={toggleTheme}
            title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            {darkMode ? <FaSun className="control-icon" /> : <FaMoon className="control-icon" />}
            {!isCollapsed && (
              <span className="control-label">
                {darkMode ? 'Modo Claro' : 'Modo Escuro'}
              </span>
            )}
          </button>
        </div>

        {/* Toggle Mock/Real Mode - Only for Admins */}
        {isAdmin() && (
          <div className="control-item">
            <button 
              className="control-button"
              onClick={toggleMockMode}
              title={mockMode ? 'Modo Real' : 'Modo Simulação'}
            >
              <FaCode className="control-icon" />
              {!isCollapsed && (
                <span className="control-label">
                  {mockMode ? 'Modo Real' : 'Modo Simulação'}
                </span>
              )}
            </button>
            {!isCollapsed && (
              <div className="mode-indicator">
                <span className={`mode-badge ${mockMode ? 'mock' : 'real'}`}>
                  {mockMode ? 'SIMULAÇÃO' : 'REAL'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
