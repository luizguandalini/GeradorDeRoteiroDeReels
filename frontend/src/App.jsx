import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";
import PlanilhaForm from "./components/PlanilhaForm/PlanilhaForm";
import RoadmapSection from "./components/RoadmapSection/RoadmapSection";
import SpreadsheetSection from "./components/SpreadsheetSection/SpreadsheetSection";
import ThemeSection from "./components/ThemeSection/ThemeSection";
import DurationSection from "./components/DurationSection/DurationSection";
import ScriptSection from "./components/ScriptSection/ScriptSection";
import NarrationSection from "./components/NarrationSection/NarrationSection";

// Ícones
import {
  FaCode,
} from "react-icons/fa";

// Logo personalizada
import logoReels from "../reels-express.png";

function App() {
  const [valores, setValores] = useState([]);
  const [temas, setTemas] = useState([]);
  const [roteiro, setRoteiro] = useState([]);
  const [duracao, setDuracao] = useState("90");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [selectedValor, setSelectedValor] = useState(null);
  const [selectedTema, setSelectedTema] = useState(null);

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

  const getPlanilha = async (url) => {
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/planilha", {
        url,
      });
      setValores(res.data.valores);
      setSelectedValor(null);
      setSelectedTema(null);
      setTemas([]);
      setRoteiro([]);
    } catch {
      toast.error("Erro ao carregar planilha", toastConfig);
    } finally {
      setLoading(false);
    }
  };

  const getTemas = async (topico) => {
    try {
      setLoading(true);
      setSelectedValor(topico);
      setSelectedTema(null);
      setRoteiro([]);
      const res = await axios.post("http://localhost:5000/api/temas", {
        topico,
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
    <div className="app-container">
      {/* Toggle fixo no canto superior direito */}
      <div className="theme-toggle-container">
        <label className="switch">
          <input type="checkbox" checked={darkMode} onChange={toggleTheme} />
          <span className="slider"></span>
        </label>
      </div>

      {/* Toggle para modo mock */}
      <div className="mock-toggle-container">
        <label className="switch">
          <input type="checkbox" checked={mockMode} onChange={toggleMockMode} />
          <span className="slider mock-slider"></span>
        </label>
        <span className="mock-label">
          <FaCode style={{ marginRight: "5px" }} />
          Modo {mockMode ? "Simulação" : "Real"}
        </span>
      </div>

      <header className="app-header">
        <img
          src={logoReels}
          alt="Reels Express"
          style={{ marginRight: "12px", height: "100px" }}
        />
      </header>

      <ToastContainer position="top-right" autoClose={3000} />

      {/* Roadmap de passos */}
      <RoadmapSection 
        valores={valores}
        selectedValor={selectedValor}
        temas={temas}
        selectedTema={selectedTema}
        roteiro={roteiro}
      />

      <div className="card">
        <PlanilhaForm onSubmit={getPlanilha} />
      </div>

      <SpreadsheetSection 
        valores={valores}
        selectedValor={selectedValor}
        onSelectTopic={getTemas}
      />

      <ThemeSection 
        temas={temas}
        selectedTema={selectedTema}
        onSelectTheme={getRoteiro}
      />

      <DurationSection 
        duracao={duracao}
        onDurationChange={setDuracao}
      />

      <ScriptSection roteiro={roteiro} />

      <NarrationSection roteiro={roteiro} />

      {loading && <LoadingSpinner />}
    </div>
  );
}

export default App;
