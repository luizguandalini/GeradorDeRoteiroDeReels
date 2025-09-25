import express from "express";
import axios from "axios";

const router = express.Router();

// Lê valores da coluna A de uma planilha pública
router.post("/", async (req, res) => {
  try {
    const { url } = req.body;
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return res.status(400).json({ error: "URL inválida" });

    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    const response = await axios.get(csvUrl);
    const linhas = response.data
      .split("\n")
      .map((l) => l.split(",")[0])
      .filter(Boolean);

    res.json({ valores: linhas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
