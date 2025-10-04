import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import { LanguageProvider, useTranslation } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import {
  initializeSocket,
  disconnectSocket,
  onTemasSuggestions,
  offTemasSuggestions,
  onRoteiroGenerated,
  offRoteiroGenerated,
  onTemasCarrosselSuggestions,
  offTemasCarrosselSuggestions,
  onCarrosselGenerated,
  offCarrosselGenerated,
} from "./services/socket";
import logger from "./utils/logger";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Login from "./components/Login/Login";
import Header from "./components/Header/Header";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";
import Sidebar from "./components/Sidebar/Sidebar";
import Landing from "./pages/Landing/Landing";
import RoteiroDeReels from "./pages/Home/Home";
import Carrossel from "./pages/Carrossel/Carrossel";
import Configuracoes from "./pages/Configuracoes/Configuracoes";
import Consumo from "./pages/Consumo/Consumo";
import GerenciamentoUsuarios from "./pages/GerenciamentoUsuarios/GerenciamentoUsuarios";

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
  const { user, token } = useAuth();
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

  // Estados para carrossel
  const [temasCarrossel, setTemasCarrossel] = useState([]);
  const [selectedTemaCarrossel, setSelectedTemaCarrossel] = useState("");
  const [carrossel, setCarrossel] = useState([]);
  const [carrosselId, setCarrosselId] = useState(null);
  const [quantidade, setQuantidade] = useState(8); // Padrão 8 slides

  // Inicializar WebSocket e configurar listeners quando usuário estiver autenticado
  useEffect(() => {
    // Debug: Verificar estado de autenticação
    logger.sensitive("🔍 Verificando autenticação para WebSocket:");
    logger.sensitive(
      "  Token:",
      token ? `${token.substring(0, 20)}...` : "❌ AUSENTE"
    );
    logger.debug("  User:", user ? "✅ Presente" : "❌ AUSENTE");
    logger.sensitive("  User.email:", user?.email ? user.email : "❌ AUSENTE");

    // Só inicializar se temos token e usuário válidos
    if (!token || !user || !user.email) {
      logger.warn(
        "⚠️ WebSocket NÃO será inicializado - faltam dados de autenticação"
      );
      return;
    }

    logger.debug("🔌 Inicializando WebSocket para usuário:", user.email);
    logger.sensitive("🔑 Token disponível:", token.substring(0, 20) + "...");

    const socket = initializeSocket(token);

    if (!socket) {
      console.error("❌ Falha ao inicializar socket");
      return;
    }

    // Expor função de debug globalmente (APENAS EM DESENVOLVIMENTO)
    if (import.meta.env.DEV) {
      window.__shakaDebug = () => {
        logger.sensitive("=== 🔍 SHAKA DEBUG ===");
        logger.sensitive("Token:", token);
        logger.sensitive("User:", user);
        logger.debug("Socket:", socket);
        logger.debug("Socket conectado?", socket?.connected);
        logger.debug("Socket ID:", socket?.id);
        logger.sensitive("===================");
      };
    }

    // Aguardar conexão antes de registrar listeners
    const setupListeners = () => {
      logger.debug("📡 Configurando listeners WebSocket...");

      // Listener para sugestões de temas (roteiro-de-reels)
      onTemasSuggestions((data) => {
        logger.debug("📥 Sugestões de temas recebidas via WebSocket:", data);
        if (data.temas && Array.isArray(data.temas)) {
          setTemas(data.temas);
          toast.success("Sugestões de temas carregadas!", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      });

      // Listener para roteiro gerado
      onRoteiroGenerated((data) => {
        logger.debug("📥 Roteiro gerado recebido via WebSocket:", data);
        if (data.roteiro && Array.isArray(data.roteiro)) {
          setRoteiro(data.roteiro);
          if (data.id) {
            window.currentRoteiroId = data.id;
          }
          toast.success("Roteiro gerado com sucesso!", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      });

      // Listener para sugestões de temas de carrossel
      onTemasCarrosselSuggestions((data) => {
        logger.debug(
          "📥 Sugestões de temas de carrossel recebidas via WebSocket:",
          data
        );
        if (data.temas && Array.isArray(data.temas)) {
          setTemasCarrossel(data.temas);
          toast.success("Sugestões de carrossel carregadas!", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      });

      // Listener para carrossel gerado
      onCarrosselGenerated((data) => {
        logger.debug("📥 Carrossel gerado recebido via WebSocket:", data);
        if (data.carrossel && Array.isArray(data.carrossel)) {
          setCarrossel(data.carrossel);
          if (data.id) {
            setCarrosselId(data.id);
          }
          toast.success("Carrossel gerado com sucesso!", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      });
    };

    // Se já está conectado, configurar listeners imediatamente
    if (socket.connected) {
      setupListeners();
    } else {
      // Caso contrário, aguardar o evento de conexão
      socket.once("connect", setupListeners);
    }

    // Cleanup: desconectar e remover listeners
    return () => {
      logger.debug("🔌 Limpando WebSocket e listeners...");
      offTemasSuggestions();
      offRoteiroGenerated();
      offTemasCarrosselSuggestions();
      offCarrosselGenerated();
      disconnectSocket();
    };
  }, [token, user]);

  // Função para salvar quantidade preferida do usuário
  const saveQuantidadePreference = async (newQuantidade) => {
    if (user?.role === "admin") {
      // Para usuários admin, salvar no banco de dados
      try {
        await axios.put("/api/configuracoes/quantidade-preference", {
          chave: "PREFERRED_QUANTIDADE",
          valor: newQuantidade.toString(),
          nome: "Quantidade Preferida de Slides",
          descricao:
            "Quantidade preferida do usuário para geração de carrosseis",
          categoria: "preferencias",
        });
      } catch (error) {
        console.error("Erro ao salvar quantidade preferida:", error);
      }
    } else {
      // Para usuários comuns, salvar no localStorage
      try {
        localStorage.setItem("preferredQuantidade", newQuantidade.toString());
      } catch (error) {
        console.error("Erro ao salvar quantidade no localStorage:", error);
      }
    }
  };

  // Função para carregar quantidade preferida do usuário
  const loadQuantidadePreference = async () => {
    if (user?.role === "admin") {
      // Para usuários admin, carregar do banco de dados
      try {
        const response = await axios.get(
          "/api/configuracoes/PREFERRED_QUANTIDADE"
        );
        if (response.data && response.data.valor) {
          const savedQuantidade = parseInt(response.data.valor, 10);
          if (savedQuantidade >= 2 && savedQuantidade <= 8) {
            setQuantidade(savedQuantidade);
          }
        }
      } catch (error) {
        // Se não encontrar a configuração, mantém o padrão (8)
        console.log("Quantidade preferida não encontrada, usando padrão");
      }
    } else {
      // Para usuários comuns, carregar do localStorage
      try {
        const savedQuantidade = localStorage.getItem("preferredQuantidade");
        if (savedQuantidade) {
          const quantidade = parseInt(savedQuantidade, 10);
          if (quantidade >= 2 && quantidade <= 8) {
            setQuantidade(quantidade);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar quantidade do localStorage:", error);
      }
    }
  };
  const saveDurationPreference = async (newDuration) => {
    if (user?.role === "admin") {
      // Para usuários admin, salvar no banco de dados
      try {
        await axios.put("/api/configuracoes/duration-preference", {
          chave: "PREFERRED_DURATION",
          valor: newDuration.toString(),
          nome: "Duração Preferida do Vídeo",
          descricao: "Duração preferida do usuário para geração de vídeos",
          categoria: "preferencias",
        });
      } catch (error) {
        console.error("Erro ao salvar duração preferida:", error);
      }
    } else {
      // Para usuários comuns, salvar no localStorage
      try {
        localStorage.setItem("preferredDuration", newDuration.toString());
      } catch (error) {
        console.error("Erro ao salvar duração no localStorage:", error);
      }
    }
  };

  // Função para carregar duração preferida do usuário
  const loadDurationPreference = async () => {
    if (user?.role === "admin") {
      // Para usuários admin, carregar do banco de dados
      try {
        const response = await axios.get(
          "/api/configuracoes/PREFERRED_DURATION"
        );
        if (response.data && response.data.valor) {
          const savedDuration = parseInt(response.data.valor, 10);
          if (savedDuration >= 30 && savedDuration <= 120) {
            setDuracao(savedDuration);
          }
        }
      } catch (error) {
        // Se não encontrar a configuração, mantém o padrão (30)
        console.log("Duração preferida não encontrada, usando padrão");
      }
    } else {
      // Para usuários comuns, carregar do localStorage
      try {
        const savedDuration = localStorage.getItem("preferredDuration");
        if (savedDuration) {
          const duration = parseInt(savedDuration, 10);
          if (duration >= 30 && duration <= 120) {
            setDuracao(duration);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar duração do localStorage:", error);
      }
    }
  };

  // Função personalizada para alterar duração que também salva a preferência
  const handleDurationChange = async (newDuration) => {
    setDuracao(newDuration);
    await saveDurationPreference(newDuration);
  };

  // Função para carregar últimas sugestões e roteiro
  const loadLastData = async () => {
    try {
      // Carregar último roteiro
      const roteiroResponse = await axios.get("/api/roteiro");
      if (
        roteiroResponse.data &&
        roteiroResponse.data.roteiro &&
        roteiroResponse.data.roteiro.length > 0
      ) {
        setRoteiro(roteiroResponse.data.roteiro);
        // Salvar o ID do roteiro para futuras atualizações
        if (roteiroResponse.data.id) {
          window.currentRoteiroId = roteiroResponse.data.id;
        }
      }

      // Carregar último carrossel
      try {
        const carrosselResponse = await axios.get("/api/carrossel");
        if (
          carrosselResponse.data &&
          carrosselResponse.data.carrossel &&
          carrosselResponse.data.carrossel.length > 0
        ) {
          setCarrossel(carrosselResponse.data.carrossel);
          const returnedId =
            carrosselResponse.data && carrosselResponse.data.id
              ? carrosselResponse.data.id
              : null;
          setCarrosselId(returnedId);
        } else {
          setCarrosselId(null);
        }
      } catch (error) {
        setCarrosselId(null);
        console.log("Nenhum carrossel anterior encontrado");
      }

      // Carregar últimos tópicos e temas
      try {
        const topicosResponse = await axios.get("/api/topicos");
        if (
          topicosResponse.data &&
          topicosResponse.data.topicos &&
          topicosResponse.data.topicos.length > 0
        ) {
          const ultimoTopico = topicosResponse.data.topicos[0]; // Pegar o primeiro (mais recente)
          setSelectedTopico(ultimoTopico);

          // Carregar temas do último tópico
          try {
            const temasResponse = await axios.get(
              `/api/temas/${ultimoTopico.id}`
            );
            if (
              temasResponse.data &&
              temasResponse.data.temas &&
              temasResponse.data.temas.length > 0
            ) {
              setTemas(temasResponse.data.temas);
            }
          } catch (error) {
            console.log("Nenhum tema anterior encontrado para este tópico");
          }

          // Carregar temas de carrossel do último tópico
          try {
            const temasCarrosselResponse = await axios.get(
              `/api/temas-carrossel/${ultimoTopico.id}`
            );
            if (
              temasCarrosselResponse.data &&
              temasCarrosselResponse.data.temas &&
              temasCarrosselResponse.data.temas.length > 0
            ) {
              setTemasCarrossel(temasCarrosselResponse.data.temas);
            }
          } catch (error) {
            console.log(
              "Nenhum tema de carrossel anterior encontrado para este tópico"
            );
          }
        }
      } catch (error) {
        console.log("Nenhum tópico encontrado");
      }
    } catch (error) {
      console.log("Nenhum roteiro anterior encontrado");
    }
  };

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

    if (user?.role === "admin") {
      checkMockMode();
    }

    // Carregar duração preferida do usuário
    if (user) {
      loadDurationPreference();
      loadQuantidadePreference();
      loadLastData();
    }
  }, [user]);

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
      // Limpar estados relacionados ao conteúdo para forçar a recarga
      setSelectedTopico("");
      setTemas([]);
      setSelectedTema("");
      setRoteiro([]);
      toast.info(
        t(
          newMockMode
            ? "app.notifications.mockModeEnabled"
            : "app.notifications.mockModeDisabled"
        ),
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
    // Se topico for null, apenas limpar os estados relacionados
    if (!topico) {
      setSelectedTopico(null);
      setTemas([]);
      setSelectedTema(null);
      setRoteiro([]);
      setNarracoesGeradas(false);
      return;
    }

    try {
      setSelectedTopico(topico);
      setSelectedTema(null);
      setRoteiro([]);
      setNarracoesGeradas(false);

      // Dados chegam via WebSocket em tempo real
      await axios.post("/api/temas", {
        topicoId: topico.id,
        language: language,
      });
    } catch {
      toast.error(t("app.errors.loadTopics"), toastConfig);
    }
  };

  const handleSuggestionsGenerated = (newTemas, topico) => {
    setTemas(newTemas);
    setSelectedTopico(topico);
    setSelectedTema(null);
    setRoteiro([]);
    setNarracoesGeradas(false);
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

    // Validar limite de caracteres do tema (500 caracteres)
    if (!tema || typeof tema !== "string") {
      toast.error(t("app.errors.themeRequired"), toastConfig);
      return;
    }

    if (tema.length > 500) {
      toast.error(t("app.errors.themeTooLong"), toastConfig);
      return;
    }

    try {
      setSelectedTema(tema);
      setNarracoesGeradas(false);

      // Dados chegam via WebSocket em tempo real
      await axios.post("/api/roteiro", {
        tema,
        duracao,
        language: language,
      });
    } catch {
      toast.error(t("app.errors.generateScript"), toastConfig);
    }
  };

  // Função para salvar roteiro editado
  const saveRoteiro = async (editedRoteiro, roteiroId) => {
    try {
      if (!roteiroId) {
        toast.error("ID do roteiro não encontrado", toastConfig);
        return false;
      }

      const roteiroFormatted = editedRoteiro.map((step) => ({
        narracao: step.nar || "",
        imagem: step.img || "",
      }));

      await axios.put(`/api/roteiro/${roteiroId}`, {
        roteiro: roteiroFormatted,
      });

      setRoteiro(roteiroFormatted);
      toast.success("Roteiro salvo com sucesso!", toastConfig);
      return true;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error, toastConfig);
      } else {
        toast.error("Erro ao salvar roteiro", toastConfig);
      }
      return false;
    }
  };

  // Funções para carrossel
  const getTemasCarrossel = async (topico) => {
    // Se topico for null, apenas limpar os estados relacionados
    if (!topico) {
      setSelectedTopico(null);
      setTemasCarrossel([]);
      setSelectedTemaCarrossel(null);
      // Importante: não limpar o carrossel aqui para preservar os textos dos slides
      // quando o tópico selecionado é deletado na rota de carrossel.
      return;
    }

    try {
      setSelectedTopico(topico);
      setSelectedTemaCarrossel(null);
      setCarrossel([]);
      setCarrosselId(null);

      // Dados chegam via WebSocket em tempo real
      await axios.post("/api/temas-carrossel", {
        topicoId: topico.id,
        language: language,
      });
    } catch {
      toast.error(t("app.errors.loadTopics"), toastConfig);
    }
  };

  const handleSuggestionsCarrosselGenerated = (newTemas, topico) => {
    setTemasCarrossel(newTemas);
    setSelectedTopico(topico);
    setSelectedTemaCarrossel(null);
    setCarrossel([]);
    setCarrosselId(null);
  };

  const getCarrossel = async (tema) => {
    const quantidadeInt = parseInt(quantidade, 10);

    if (!quantidade || quantidadeInt <= 0) {
      toast.warn(t("app.errors.quantidadeRequired"), toastConfig);
      return;
    }

    if (quantidadeInt < 2) {
      toast.warn(t("app.errors.quantidadeTooShort"), toastConfig);
      return;
    }

    if (quantidadeInt > 8) {
      toast.warn(t("app.errors.quantidadeTooLong"), toastConfig);
      return;
    }

    // Validar limite de caracteres do tema (500 caracteres)
    if (!tema || typeof tema !== "string") {
      toast.error(t("app.errors.themeRequired"), toastConfig);
      return;
    }

    if (tema.length > 500) {
      toast.error(t("app.errors.themeTooLong"), toastConfig);
      return;
    }

    try {
      setSelectedTemaCarrossel(tema);

      // Dados chegam via WebSocket em tempo real
      await axios.post("/api/carrossel", {
        tema,
        quantidade,
        language: language,
      });
    } catch {
      toast.error(t("app.errors.generateCarrossel"), toastConfig);
    }
  };

  const saveCarrossel = async (novoCarrossel) => {
    if (!carrosselId) {
      const error = new Error("ID do carrossel não definido");
      console.error("Erro ao salvar carrossel: ID do carrossel não definido.");
      throw error;
    }

    try {
      const response = await axios.put(`/api/carrossel/${carrosselId}`, {
        carrossel: novoCarrossel,
      });

      const updatedCarrossel =
        response && response.data && Array.isArray(response.data.carrossel)
          ? response.data.carrossel
          : novoCarrossel;
      setCarrossel(updatedCarrossel);

      if (response && response.data && response.data.id) {
        setCarrosselId(response.data.id);
      }

      return response && response.data ? response.data : null;
    } catch (error) {
      console.error("Erro ao salvar carrossel:", error);
      throw error;
    }
  };

  // Função personalizada para alterar quantidade que também salva a preferência
  const handleQuantidadeChange = async (newQuantidade) => {
    setQuantidade(newQuantidade);
    await saveQuantidadePreference(newQuantidade);
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
          <Route path="/" element={<Landing />} />
          <Route
            path="/roteiro-de-reels"
            element={
              <RoteiroDeReels
                selectedTopico={selectedTopico}
                temas={temas}
                selectedTema={selectedTema}
                roteiro={roteiro}
                narracoesGeradas={narracoesGeradas}
                duracao={duracao}
                onSelectTopic={getTemas}
                onSelectTheme={getRoteiro}
                onDurationChange={handleDurationChange}
                onNarracoesGeradas={setNarracoesGeradas}
                onSaveRoteiro={saveRoteiro}
                onSuggestionsGenerated={handleSuggestionsGenerated}
                toastConfig={toastConfig}
              />
            }
          />
          <Route
            path="/carrossel"
            element={
              <Carrossel
                selectedTopico={selectedTopico}
                temasCarrossel={temasCarrossel}
                selectedTemaCarrossel={selectedTemaCarrossel}
                carrossel={carrossel}
                quantidade={quantidade}
                onSelectTopic={getTemasCarrossel}
                onSelectTheme={getCarrossel}
                onQuantidadeChange={handleQuantidadeChange}
                onSaveCarrossel={saveCarrossel}
                onSuggestionsGenerated={handleSuggestionsCarrosselGenerated}
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
            path="/usuarios"
            element={
              <ProtectedRoute requireAdmin={true}>
                <GerenciamentoUsuarios />
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
