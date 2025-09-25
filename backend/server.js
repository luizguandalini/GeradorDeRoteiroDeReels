import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import planilhaRoutes from "./routes/planilha.js";
import temasRoutes from "./routes/temas.js";
import roteiroRoutes from "./routes/roteiro.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/planilha", planilhaRoutes);
app.use("/api/temas", temasRoutes);
app.use("/api/roteiro", roteiroRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend rodando na porta ${PORT}`));
