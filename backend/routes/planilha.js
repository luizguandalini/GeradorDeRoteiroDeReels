import express from "express";
import axios from "axios";
import { getMockMode } from "../config/mockConfig.js";
import { planilhaMock } from "../config/mockData.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para planilha");
      return res.json(planilhaMock);
    }

    const { url } = req.body;
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return res.status(400).json({ error: "URL inválida" });

    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    const response = await axios.get(csvUrl);
    const linhas = response.data
      .split("\n")
      .map((l) => l.split(",")[0].trim())
      .slice(1)
      .filter((v) => v.length > 0);

    res.json({ valores: linhas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
