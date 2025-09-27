import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Login from "./components/Login/Login";
import Header from "./components/Header/Header";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";
import Sidebar from "./components/Sidebar/Sidebar";
import Home from "./pages/Home/Home";
import Configuracoes from "./pages/Configuracoes/Configuracoes";

// Importar logo
import logoReels from "../reels-express.png";

function App() {
  return (
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
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  // Estados principais
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

  // Configuração personalizada para o toast
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
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.body.classList.add("dark");
    }

    // Verificar o estado atual do modo mock
    checkMockMode();
  }, []);

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
      await axios.post("http://localhost:5000/api/config/mock", {
        mockMode: newMockMode,
      });
      setMockMode(newMockMode);
      toast.info(
        `Modo ${newMockMode ? "simulação" : "real"} ativado`,
        toastConfig
      );
    } catch (error) {
      toast.error("Erro ao alterar o modo de operação", toastConfig);
      console.error(error);
    }
  };

  const checkMockMode = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/config/mock");
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
      
      const res = await axios.post("http://localhost:5000/api/temas", {
        topicoId: topico.id,
      });
      setTemas(res.data.temas);
    } catch {
      toast.error("Erro ao carregar temas da IA", toastConfig);
    } finally {
      setLoading(false);
    }
  };

  const getRoteiro = async (tema) => {
    const duracaoInt = parseInt(duracao);

    if (!duracao || duracaoInt <= 0) {
      toast.warn("Informe a duração do vídeo em segundos", toastConfig);
      return;
    }

    if (duracaoInt < 30) {
      toast.warn("A duração mínima é de 30 segundos", toastConfig);
      return;
    }

    try {
      setLoading(true);
      setSelectedTema(tema);
      setNarracoesGeradas(false); // Reset narrações quando seleciona novo tema
      const res = await axios.post("http://localhost:5000/api/roteiro", {
        tema,
        duracao,
      });
      setRoteiro(res.data.roteiro);
    } catch {
      toast.error("Erro ao gerar roteiro", toastConfig);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-theme' : ''}`}>
      <Sidebar 
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        mockMode={mockMode}
        toggleMockMode={toggleMockMode}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header />

        <ToastContainer position="top-right" autoClose={3000} />

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
        </Routes>

        {loading && <LoadingSpinner />}
      </div>
    </div>
  );
}

export default App;
