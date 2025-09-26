import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import planilhaRoutes from "./routes/planilha.js";
import temasRoutes from "./routes/temas.js";
import roteiroRoutes from "./routes/roteiro.js";
import narracoesRoutes from "./routes/narracoes.js";
import audiosRoutes from "./routes/audios.js";
import { getMockMode, setMockMode } from "./config/mockConfig.js";

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

app.use("/api/planilha", planilhaRoutes);
app.use("/api/temas", temasRoutes);
app.use("/api/roteiro", roteiroRoutes);
app.use("/api/narracoes", narracoesRoutes);
app.use("/api/audios", audiosRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend rodando na porta ${PORT}`));
