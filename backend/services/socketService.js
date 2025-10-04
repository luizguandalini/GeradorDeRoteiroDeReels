import jwt from "jsonwebtoken";
import prisma from "../config/database.js";

// Store para mapear userId -> socketId
const userSockets = new Map();

/**
 * Configuração do Socket.IO com autenticação JWT
 */
export function setupSocketIO(io) {
  // Middleware de autenticação para Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      console.log("🔐 Tentativa de autenticação WebSocket");
      console.log(
        "Token recebido:",
        token ? token.substring(0, 20) + "..." : "nenhum"
      );

      if (!token) {
        console.error("❌ Token não fornecido");
        return next(new Error("Token não fornecido"));
      }

      // Verificar token JWT
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token JWT válido para usuário ID:", decoded.userId);
      } catch (jwtError) {
        console.error("❌ Token JWT inválido:", jwtError.message);
        return next(new Error("Token inválido"));
      }

      // Buscar usuário no banco
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          language: true,
        },
      });

      if (!user) {
        console.error("❌ Usuário não encontrado no banco:", decoded.id);
        return next(new Error("Usuário não encontrado"));
      }

      console.log("✅ Usuário autenticado:", user.email);

      // Adicionar dados do usuário ao socket
      socket.userId = user.id;
      socket.user = user;

      next();
    } catch (error) {
      console.error("❌ Erro na autenticação do socket:", error.message);
      next(new Error("Autenticação falhou"));
    }
  });

  // Evento de conexão
  io.on("connection", (socket) => {
    console.log(`✅ Cliente conectado: ${socket.id} (User: ${socket.userId})`);

    // Mapear usuário -> socket
    userSockets.set(socket.userId, socket.id);

    // Entrar na sala do próprio usuário
    socket.join(`user:${socket.userId}`);

    // Evento de desconexão
    socket.on("disconnect", () => {
      console.log(
        `❌ Cliente desconectado: ${socket.id} (User: ${socket.userId})`
      );
      userSockets.delete(socket.userId);
    });

    // Evento para teste de conexão
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });
  });

  console.log("✅ Socket.IO configurado com sucesso");
}

/**
 * Emitir evento para um usuário específico
 */
export function emitToUser(io, userId, event, data) {
  console.log(`📡 Emitindo evento "${event}" para sala user:${userId}`);
  console.log("Dados:", JSON.stringify(data).substring(0, 100) + "...");
  io.to(`user:${userId}`).emit(event, data);
  console.log(`✅ Evento "${event}" emitido!`);
}

/**
 * Emitir evento de sugestões de temas
 */
export function emitTemasSuggestions(io, userId, data) {
  emitToUser(io, userId, "temas:suggestions", data);
}

/**
 * Emitir evento de roteiro gerado
 */
export function emitRoteiroGenerated(io, userId, data) {
  emitToUser(io, userId, "roteiro:generated", data);
}

/**
 * Emitir evento de progresso do roteiro
 */
export function emitRoteiroProgress(io, userId, data) {
  emitToUser(io, userId, "roteiro:progress", data);
}

/**
 * Emitir evento de sugestões de temas de carrossel
 */
export function emitTemasCarrosselSuggestions(io, userId, data) {
  emitToUser(io, userId, "temasCarrossel:suggestions", data);
}

/**
 * Emitir evento de carrossel gerado
 */
export function emitCarrosselGenerated(io, userId, data) {
  emitToUser(io, userId, "carrossel:generated", data);
}

/**
 * Emitir evento de progresso do carrossel
 */
export function emitCarrosselProgress(io, userId, data) {
  emitToUser(io, userId, "carrossel:progress", data);
}

/**
 * Emitir evento de áudio gerado
 */
export function emitAudioGenerated(io, userId, data) {
  emitToUser(io, userId, "audio:generated", data);
}

/**
 * Emitir evento de progresso do áudio
 */
export function emitAudioProgress(io, userId, data) {
  emitToUser(io, userId, "audio:progress", data);
}

/**
 * Emitir evento de erro
 */
export function emitError(io, userId, data) {
  emitToUser(io, userId, "error", data);
}

export default {
  setupSocketIO,
  emitToUser,
  emitTemasSuggestions,
  emitRoteiroGenerated,
  emitRoteiroProgress,
  emitTemasCarrosselSuggestions,
  emitCarrosselGenerated,
  emitCarrosselProgress,
  emitAudioGenerated,
  emitAudioProgress,
  emitError,
};
