import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import temasRoutes from "./routes/temas.js";
import roteiroRoutes from "./routes/roteiro.js";
import narracoesRoutes from "./routes/narracoes.js";
import audiosRoutes from "./routes/audios.js";
import topicosRoutes from "./routes/topicos.js";
import configuracaoRoutes from "./routes/configuracoes.js";
import consumoRoutes from "./routes/consumo.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import temasCarrosselRoutes from "./routes/temasCarrossel.js";
import carrosselRoutes from "./routes/carrossel.js";
import { authenticateToken, requireAdmin } from "./middleware/auth.js";
import { getMockMode, setMockMode } from "./config/mockConfig.js";
import prisma from "./config/database.js";
import { getConfig, initializeDefaultConfigs } from "./config/configManager.js";
import { setupSocketIO } from "./services/socketService.js";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.set("trust proxy", 1);
}

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Configurar Socket.IO
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Setup do Socket.IO com autenticação
setupSocketIO(io);

// Adicionar io ao req para uso nas rotas
app.use((req, res, next) => {
  req.io = io;
  // Log apenas para rotas de API relevantes
  if (
    req.path.includes("/api/temas") ||
    req.path.includes("/api/roteiro") ||
    req.path.includes("/api/carrossel")
  ) {
    console.log(`🔗 Middleware: req.io anexado para ${req.method} ${req.path}`);
  }
  next();
});

// Rotas de autenticaÃ§Ã£o (pÃºblicas)
app.use("/api/auth", authRoutes);

// Rota para controlar o modo mock (apenas admin)
app.get("/api/config/mock", authenticateToken, requireAdmin, (req, res) => {
  res.json({ mockMode: getMockMode() });
});

app.post("/api/config/mock", authenticateToken, requireAdmin, (req, res) => {
  const { mockMode } = req.body;
  setMockMode(mockMode);
  res.json({ mockMode: getMockMode() });
});

// Rotas protegidas (requerem autenticação)
app.use("/api/temas", authenticateToken, temasRoutes);
app.use("/api/roteiro", authenticateToken, roteiroRoutes);
app.use("/api/narracoes", authenticateToken, narracoesRoutes);
app.use("/api/audios", authenticateToken, audiosRoutes);
app.use("/api/users", authenticateToken, usersRoutes);
app.use("/api/topicos", authenticateToken, topicosRoutes);
app.use("/api/temas-carrossel", authenticateToken, temasCarrosselRoutes);
app.use("/api/carrossel", authenticateToken, carrosselRoutes);

// Rotas de configurações (apenas admin)
app.use(
  "/api/configuracoes",
  authenticateToken,
  requireAdmin,
  configuracaoRoutes
);

// Rota de consumo dos serviços (apenas admin)
app.use("/api/consumo", authenticateToken, requireAdmin, consumoRoutes);

// Teste de conexÃ£o com o banco
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "OK", database: "Connected" });
  } catch (error) {
    res.status(500).json({ status: "Error", database: "Disconnected" });
  }
});

// InicializaÃ§Ã£o do servidor
async function startServer() {
  try {
    // Inicializa as configuraÃ§Ãµes padrÃ£o
    await initializeDefaultConfigs();
    console.log("âœ… ConfiguraÃ§Ãµes padrÃ£o inicializadas");

    // Usa a porta do .env diretamente
    const PORT = process.env.PORT || 5000;

    httpServer.listen(PORT, () => {
      console.log(`ðŸš€ Servidor rodando na porta ${PORT}`);
      console.log(
        `ðŸ"Š Modo mock: ${getMockMode() ? "Ativado" : "Desativado"}`
      );
      console.log(`ðŸ"Œ WebSocket habilitado`);
    });
  } catch (error) {
    console.error("âŒ Erro ao inicializar servidor:", error);
    process.exit(1);
  }
}

// Inicia o servidor quando nÃ£o estiver em modo de teste
if (process.env.NODE_ENV !== "test") {
  startServer();
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("ðŸ”„ Desconectando do banco de dados...");
  await prisma.$disconnect();
  process.exit(0);
});

export { app, startServer, httpServer, io };
export default app;
