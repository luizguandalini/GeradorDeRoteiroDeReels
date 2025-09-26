import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";
import PlanilhaForm from "./components/PlanilhaForm/PlanilhaForm";
import TemasList from "./components/TemasList/TemasList";
import Roteiro from "./components/Roteiro/Roteiro";
import AudiosCard from "./components/AudiosCard/AudiosCard";

// Ícones
import {
  FaTable,
  FaLightbulb,
  FaRobot,
  FaClock,
  FaFilm,
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
      <div className="roadmap-container">
        <h2>Roadmap de Criação</h2>
        <div className="roadmap-steps">
          <div
            className={`roadmap-step ${
              valores.length > 0 ? "completed" : "active"
            }`}
          >
            <span className="roadmap-number">1</span>
            <span className="roadmap-text">Buscar Planilha</span>
          </div>
          <div className="roadmap-arrow"></div>

          <div
            className={`roadmap-step ${
              selectedValor && temas.length > 0
                ? "completed"
                : valores.length > 0 && !selectedTema
                ? "active"
                : ""
            }`}
          >
            <span className="roadmap-number">2</span>
            <span className="roadmap-text">Selecionar Tópico</span>
          </div>
          <div className="roadmap-arrow"></div>

          <div
            className={`roadmap-step ${
              selectedTema
                ? "completed"
                : temas.length > 0 && !selectedTema
                ? "active"
                : ""
            }`}
          >
            <span className="roadmap-number">3</span>
            <span className="roadmap-text">Escolher Sugestão</span>
          </div>
          <div className="roadmap-arrow"></div>

          <div
            className={`roadmap-step ${
              roteiro.length > 0 ? "completed" : selectedTema ? "active" : ""
            }`}
          >
            <span className="roadmap-number">4</span>
            <span className="roadmap-text">Editar Roteiro</span>
          </div>
          <div className="roadmap-arrow"></div>

          <div className={`roadmap-step ${roteiro.length > 0 ? "active" : ""}`}>
            <span className="roadmap-number">5</span>
            <span className="roadmap-text">Gerar Narrações</span>
          </div>
        </div>
      </div>

      <div className="card">
        <PlanilhaForm onSubmit={getPlanilha} />
      </div>

      <div className="card scrollable">
        <h2>
          <FaTable style={{ marginRight: "8px" }} />
          Tópicos da Planilha
        </h2>
        <ul>
          {valores.map((v, i) => (
            <li
              key={i}
              onClick={() => getTemas(v)}
              className={selectedValor === v ? "selected" : ""}
            >
              {v}
            </li>
          ))}
        </ul>
      </div>

      <div className="card scrollable">
        <h2>
          <FaLightbulb style={{ marginRight: "8px", color: "#fbc531" }} />
          <FaRobot style={{ marginRight: "8px", color: "#00a8ff" }} />
          Sugestões da IA
        </h2>
        <ul>
          {temas.map((t, i) => (
            <li
              key={i}
              onClick={() => getRoteiro(t)}
              className={selectedTema === t ? "selected" : ""}
            >
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>
          <FaClock style={{ marginRight: "8px", color: "#9c88ff" }} />
          Duração do Vídeo (segundos)
        </h2>
        <input
          type="number"
          value={duracao}
          onChange={(e) => setDuracao(e.target.value)}
          min="30"
          className="duracao-input"
        />
      </div>

      <div className="card">
        <h2>
          <FaFilm style={{ marginRight: "8px", color: "#e84118" }} />
          Roteiro
        </h2>
        <Roteiro roteiro={roteiro} />
      </div>

      <div className="card">
        <h2>
          <FaFilm style={{ marginRight: "8px", color: "#e84118" }} />
          Narrações
        </h2>
        <AudiosCard roteiro={roteiro} />
      </div>

      {loading && <LoadingSpinner />}
    </div>
  );
}

export default App;
