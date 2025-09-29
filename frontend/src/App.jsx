import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import { LanguageProvider, useTranslation } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Login from "./components/Login/Login";
import Header from "./components/Header/Header";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";
import Sidebar from "./components/Sidebar/Sidebar";
import Home from "./pages/Home/Home";
import Configuracoes from "./pages/Configuracoes/Configuracoes";
import Consumo from "./pages/Consumo/Consumo";

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
            draggable
            theme="colored"
            toastStyle={{
              backgroundColor: "#ffffff",
              color: "#262626",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              border: "1px solid #e6e6e6",
            }}
            progressStyle={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

function AppContent() {
  const { t, setLanguage, language } = useTranslation();
  const { user } = useAuth();
  const [selectedTopico, setSelectedTopico] = useState("");
  const [temas, setTemas] = useState([]);
  const [selectedTema, setSelectedTema] = useState("");
  const [roteiro, setRoteiro] = useState([]);
  const [duracao, setDuracao] = useState(30);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [narracoesGeradas, setNarracoesGeradas] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toastConfig = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    style: {
      background: darkMode ? "#262626" : "#ffffff",
      color: darkMode ? "#ffffff" : "#262626",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      border: darkMode ? "1px solid #444" : "1px solid #e6e6e6",
    },
    theme: "colored",
    toastStyle: {
      backgroundColor: darkMode ? "#262626" : "#ffffff",
      color: darkMode ? "#ffffff" : "#262626",
    },
    progressStyle: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.body.classList.add("dark");
    }

    checkMockMode();
  }, []);

  useEffect(() => {
    if (user?.language) {
      setLanguage(user.language);
    }
  }, [user?.language, setLanguage]);

  const toggleTheme = () => {
    if (darkMode) {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  };

  const toggleMockMode = async () => {
    try {
      const newMockMode = !mockMode;
      await axios.post("/api/config/mock", {
        mockMode: newMockMode,
      });
      setMockMode(newMockMode);
      toast.info(
        t(newMockMode ? "app.notifications.mockModeEnabled" : "app.notifications.mockModeDisabled"),
        toastConfig
      );
    } catch (error) {
      toast.error(t("app.errors.mockModeChange"), toastConfig);
      console.error(error);
    }
  };

  const checkMockMode = async () => {
    try {
      const response = await axios.get("/api/config/mock");
      setMockMode(response.data.mockMode);
    } catch (error) {
      console.error("Erro ao verificar o modo mock:", error);
    }
  };

  const getTemas = async (topico) => {
    try {
      setLoading(true);
      setSelectedTopico(topico);
      setSelectedTema(null);
      setRoteiro([]);
      setNarracoesGeradas(false);

      const res = await axios.post("/api/temas", {
        topicoId: topico.id,
        language: language,
      });
      setTemas(res.data.temas);
    } catch {
      toast.error(t("app.errors.loadTopics"), toastConfig);
    } finally {
      setLoading(false);
    }
  };

  const getRoteiro = async (tema) => {
    const duracaoInt = parseInt(duracao, 10);

    if (!duracao || duracaoInt <= 0) {
      toast.warn(t("app.errors.durationRequired"), toastConfig);
      return;
    }

    if (duracaoInt < 30) {
      toast.warn(t("app.errors.durationTooShort"), toastConfig);
      return;
    }

    try {
      setLoading(true);
      setSelectedTema(tema);
      setNarracoesGeradas(false);
      const res = await axios.post("/api/roteiro", {
        tema,
        duracao,
        language: language,
      });
      setRoteiro(res.data.roteiro);
    } catch {
      toast.error(t("app.errors.generateScript"), toastConfig);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app-container ${darkMode ? "dark-theme" : ""}`}>
      <Sidebar
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        mockMode={mockMode}
        toggleMockMode={toggleMockMode}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className={`main-content ${isCollapsed ? "sidebar-collapsed" : ""}`}>
        <Header />

        <Routes>
          <Route
            path="/"
            element={
              <Home
                selectedTopico={selectedTopico}
                temas={temas}
                selectedTema={selectedTema}
                roteiro={roteiro}
                narracoesGeradas={narracoesGeradas}
                duracao={duracao}
                onSelectTopic={getTemas}
                onSelectTheme={getRoteiro}
                onDurationChange={setDuracao}
                onNarracoesGeradas={setNarracoesGeradas}
                toastConfig={toastConfig}
              />
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Configuracoes toastConfig={toastConfig} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consumo"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Consumo />
              </ProtectedRoute>
            }
          />
        </Routes>

        {loading && <LoadingSpinner />}
      </div>
    </div>
  );
}

export default App;
