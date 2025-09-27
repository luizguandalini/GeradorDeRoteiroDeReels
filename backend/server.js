import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import temasRoutes from "./routes/temas.js";
import roteiroRoutes from "./routes/roteiro.js";
import narracoesRoutes from "./routes/narracoes.js";
import audiosRoutes from "./routes/audios.js";
import topicosRoutes from "./routes/topicos.js";
import configuracoesRoutes from "./routes/configuracoes.js";
import { getMockMode, setMockMode } from "./config/mockConfig.js";
import prisma from "./config/database.js";
import { getConfig, initializeDefaultConfigs } from "./config/configManager.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Rota para controlar o modo mock
app.get("/api/config/mock", (req, res) => {
  res.json({ mockMode: getMockMode() });
});

app.post("/api/config/mock", (req, res) => {
  const { mockMode } = req.body;
  setMockMode(mockMode);
  res.json({ mockMode: getMockMode() });
});

// Rotas
app.use("/api/temas", temasRoutes);
app.use("/api/roteiro", roteiroRoutes);
app.use("/api/narracoes", narracoesRoutes);
app.use("/api/audios", audiosRoutes);
app.use("/api/topicos", topicosRoutes);
app.use("/api/configuracoes", configuracoesRoutes);

// Teste de conexão com o banco
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "OK", database: "Connected" });
  } catch (error) {
    res.status(500).json({ status: "Error", database: "Disconnected" });
  }
});

// Inicialização do servidor
async function startServer() {
  try {
    // Inicializa as configurações padrão
    await initializeDefaultConfigs();
    console.log('✅ Configurações padrão inicializadas');

    // Usa a porta do .env diretamente
    const PORT = process.env.PORT || 5000;
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 Modo mock: ${getMockMode() ? 'Ativado' : 'Desativado'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Inicia o servidor
startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Desconectando do banco de dados...');
  await prisma.$disconnect();
  process.exit(0);
});
