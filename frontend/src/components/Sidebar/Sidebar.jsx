import React, { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCog,
  FaCode,
  FaMoon,
  FaSun,
  FaChevronLeft,
  FaChevronRight,
  FaChartBar,
  FaUsers,
  FaImages,
} from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";
import LanguageSwitch from "../LanguageSwitch/LanguageSwitch";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation, useLanguage } from "../../contexts/LanguageContext";
import "./Sidebar.css";

const Sidebar = ({
  darkMode,
  toggleTheme,
  mockMode,
  toggleMockMode,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { user, updateUser, logout, isAdmin } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { isValidLanguage } = useLanguage(); // Importar função de validação
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLanguageChange = useCallback(
    async (nextLanguage) => {
      // Validar idioma antes de enviar para o backend
      if (!isValidLanguage(nextLanguage)) {
        console.error(`Idioma inválido: ${nextLanguage}`);
        toast.error(t("common.messages.languageUpdateError"));
        return;
      }

      const previousLanguage = language;
      setLanguage(nextLanguage);
      setIsUpdatingLanguage(true);

      try {
        const response = await axios.patch("/api/users/language", {
          language: nextLanguage,
        });
        if (response?.data?.user) {
          updateUser(response.data.user);
        } else {
          updateUser((current) =>
            current ? { ...current, language: nextLanguage } : current
          );
        }
      } catch (error) {
        console.error("Erro ao atualizar idioma:", error);
        setLanguage(previousLanguage);
        updateUser((current) =>
          current ? { ...current, language: previousLanguage } : current
        );
        toast.error(t("common.messages.languageUpdateError"));
      } finally {
        setIsUpdatingLanguage(false);
      }
    },
    [language, setLanguage, updateUser, t, isValidLanguage]
  );

  const getGreetingDetails = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return { salutationKey: "sidebar.greetings.morning", emoji: "" };
    }

    if (hour >= 12 && hour < 18) {
      return { salutationKey: "sidebar.greetings.afternoon", emoji: "" };
    }

    if (hour >= 18 && hour < 24) {
      return { salutationKey: "sidebar.greetings.evening", emoji: "" };
    }

    return { salutationKey: "sidebar.greetings.night", emoji: "" };
  };

  const { salutationKey, emoji } = getGreetingDetails();
  const admin = isAdmin();
  const displayName = admin
    ? t("sidebar.titles.adminNickname")
    : user?.name || t("sidebar.titles.defaultUser");
  const greetingMessage = `${t(salutationKey)} ${displayName} ${emoji}`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    {
      path: "/",
      icon: FaHome,
      labelKey: "sidebar.menu.home",
      id: "home",
    },
    {
      path: "/carrossel",
      icon: FaImages,
      labelKey: "sidebar.menu.carrossel",
      id: "carrossel",
    },
    {
      path: "/configuracoes",
      icon: FaCog,
      labelKey: "sidebar.menu.settings",
      id: "config",
      adminOnly: true,
    },
    {
      path: "/usuarios",
      icon: FaUsers,
      labelKey: "sidebar.menu.users",
      id: "users",
      adminOnly: true,
    },
    {
      path: "/consumo",
      icon: FaChartBar,
      labelKey: "sidebar.menu.consumption",
      id: "consumption",
      adminOnly: true,
    },
  ];

  return (
    <div
      className={`sidebar ${isCollapsed ? "collapsed" : ""} ${
        darkMode ? "dark-theme" : ""
      }`}
    >
      <div className="sidebar-header">
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={
            isCollapsed
              ? t("sidebar.actions.expand")
              : t("sidebar.actions.collapse")
          }
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
        {!isCollapsed && (
          <h3 className="sidebar-title">{t("sidebar.header.menu")}</h3>
        )}
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems
            .filter((item) => !item.adminOnly || admin)
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.id} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive ? "active" : ""}`}
                    title={isCollapsed ? t(item.labelKey) : ""}
                  >
                    <Icon className="nav-icon" />
                    {!isCollapsed && (
                      <span className="nav-label">{t(item.labelKey)}</span>
                    )}
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      <div className="sidebar-controls">
        <div className="control-item language-control">
          <LanguageSwitch
            value={language}
            onChange={handleLanguageChange}
            disabled={isUpdatingLanguage}
            showLabels={!isCollapsed}
            size={isCollapsed ? "sm" : "md"}
            className="sidebar-language-switch"
          />
        </div>

        {!isCollapsed && (
          <div className="sidebar-greeting">
            <span className="greeting-text">{greetingMessage}</span>
          </div>
        )}

        <div className="control-item">
          <button
            className="control-button logout-control"
            onClick={handleLogout}
            title={t("sidebar.actions.logout")}
          >
            <FiLogOut className="control-icon" />
            {!isCollapsed && (
              <span className="control-label">
                {t("sidebar.actions.logout")}
              </span>
            )}
          </button>
        </div>

        <div className="control-item">
          <button
            className="control-button"
            onClick={toggleTheme}
            title={
              darkMode
                ? t("sidebar.actions.switchToLight")
                : t("sidebar.actions.switchToDark")
            }
          >
            {darkMode ? (
              <FaSun className="control-icon" />
            ) : (
              <FaMoon className="control-icon" />
            )}
            {!isCollapsed && (
              <span className="control-label">
                {darkMode
                  ? t("sidebar.actions.lightMode")
                  : t("sidebar.actions.darkMode")}
              </span>
            )}
          </button>
        </div>

        {isAdmin() && (
          <div className="control-item">
            <button
              className="control-button"
              onClick={toggleMockMode}
              title={
                mockMode
                  ? t("sidebar.actions.enableRealMode")
                  : t("sidebar.actions.enableMockMode")
              }
            >
              <FaCode className="control-icon" />
              {!isCollapsed && (
                <span className="control-label">
                  {mockMode
                    ? t("sidebar.actions.realMode")
                    : t("sidebar.actions.mockMode")}
                </span>
              )}
            </button>
            {!isCollapsed && (
              <div className="mode-indicator">
                <span className={`mode-badge ${mockMode ? "mock" : "real"}`}>
                  {mockMode
                    ? t("sidebar.status.simulation")
                    : t("sidebar.status.real")}
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


