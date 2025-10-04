import { io } from "socket.io-client";
import logger from "../utils/logger";

let socket = null;

/**
 * Inicializar conexão WebSocket
 */
export const initializeSocket = (token) => {
  // Se já existe um socket, desconectar antes de criar um novo
  if (socket) {
    if (socket.connected) {
      logger.debug("Socket já está conectado");
      return socket;
    }
    // Desconectar socket anterior se existir mas não estiver conectado
    socket.disconnect();
    socket = null;
  }

  if (!token) {
    logger.warn("Token não fornecido para WebSocket");
    return null;
  }

  // URL do servidor (usar variável de ambiente ou padrão)
  const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  logger.sensitive(
    "🔌 Criando conexão WebSocket com token:",
    token.substring(0, 20) + "..."
  );

  socket = io(SERVER_URL, {
    auth: {
      token: token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    autoConnect: true,
  });

  socket.on("connect", () => {
    logger.debug("✅ WebSocket conectado:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    logger.debug("❌ WebSocket desconectado:", reason);
  });

  socket.on("connect_error", (error) => {
    logger.error("❌ Erro na conexão WebSocket:", error.message);
  });

  socket.on("error", (error) => {
    logger.error("❌ Erro no WebSocket:", error);
  });

  // Expor globalmente para debug (APENAS EM DESENVOLVIMENTO)
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    window.__shakaSocket = socket;
    window.__shakaSocketIO = io;
    logger.debug("🔍 Socket exposto globalmente em window.__shakaSocket");
    logger.debug("🔍 io exposto globalmente em window.__shakaSocketIO");
  }

  return socket;
};

/**
 * Desconectar WebSocket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("WebSocket desconectado");
  }
};

/**
 * Obter instância do socket
 */
export const getSocket = () => {
  return socket;
};

/**
 * Ouvir evento de sugestões de temas
 */
export const onTemasSuggestions = (callback) => {
  if (!socket) {
    // Socket será inicializado em breve, não é necessário aviso
    return;
  }
  socket.on("temas:suggestions", callback);
};

/**
 * Remover listener de sugestões de temas
 */
export const offTemasSuggestions = () => {
  if (!socket) return;
  socket.off("temas:suggestions");
};

/**
 * Ouvir evento de roteiro gerado
 */
export const onRoteiroGenerated = (callback) => {
  if (!socket) {
    // Socket será inicializado em breve, não é necessário aviso
    return;
  }
  socket.on("roteiro:generated", callback);
};

/**
 * Remover listener de roteiro gerado
 */
export const offRoteiroGenerated = () => {
  if (!socket) return;
  socket.off("roteiro:generated");
};

/**
 * Ouvir evento de progresso do roteiro
 */
export const onRoteiroProgress = (callback) => {
  if (!socket) {
    // Socket será inicializado em breve, não é necessário aviso
    return;
  }
  socket.on("roteiro:progress", callback);
};

/**
 * Remover listener de progresso do roteiro
 */
export const offRoteiroProgress = () => {
  if (!socket) return;
  socket.off("roteiro:progress");
};

/**
 * Ouvir evento de sugestões de temas de carrossel
 */
export const onTemasCarrosselSuggestions = (callback) => {
  if (!socket) {
    // Socket será inicializado em breve, não é necessário aviso
    return;
  }
  socket.on("temasCarrossel:suggestions", callback);
};

/**
 * Remover listener de sugestões de temas de carrossel
 */
export const offTemasCarrosselSuggestions = () => {
  if (!socket) return;
  socket.off("temasCarrossel:suggestions");
};

/**
 * Ouvir evento de carrossel gerado
 */
export const onCarrosselGenerated = (callback) => {
  if (!socket) {
    // Socket será inicializado em breve, não é necessário aviso
    return;
  }
  socket.on("carrossel:generated", callback);
};

/**
 * Remover listener de carrossel gerado
 */
export const offCarrosselGenerated = () => {
  if (!socket) return;
  socket.off("carrossel:generated");
};

/**
 * Ouvir evento de progresso do carrossel
 */
export const onCarrosselProgress = (callback) => {
  if (!socket) {
    // Socket será inicializado em breve, não é necessário aviso
    return;
  }
  socket.on("carrossel:progress", callback);
};

/**
 * Remover listener de progresso do carrossel
 */
export const offCarrosselProgress = () => {
  if (!socket) return;
  socket.off("carrossel:progress");
};

/**
 * Ouvir evento de áudio gerado
 */
export const onAudioGenerated = (callback) => {
  if (!socket) {
    // Socket será inicializado em breve, não é necessário aviso
    return;
  }
  socket.on("audio:generated", callback);
};

/**
 * Remover listener de áudio gerado
 */
export const offAudioGenerated = () => {
  if (!socket) return;
  socket.off("audio:generated");
};

/**
 * Ouvir evento de progresso do áudio
 */
export const onAudioProgress = (callback) => {
  if (!socket) {
    // Socket será inicializado em breve, não é necessário aviso
    return;
  }
  socket.on("audio:progress", callback);
};

/**
 * Remover listener de progresso do áudio
 */
export const offAudioProgress = () => {
  if (!socket) return;
  socket.off("audio:progress");
};

export default {
  initializeSocket,
  disconnectSocket,
  getSocket,
  onTemasSuggestions,
  offTemasSuggestions,
  onRoteiroGenerated,
  offRoteiroGenerated,
  onRoteiroProgress,
  offRoteiroProgress,
  onTemasCarrosselSuggestions,
  offTemasCarrosselSuggestions,
  onCarrosselGenerated,
  offCarrosselGenerated,
  onCarrosselProgress,
  offCarrosselProgress,
  onAudioGenerated,
  offAudioGenerated,
  onAudioProgress,
  offAudioProgress,
};
