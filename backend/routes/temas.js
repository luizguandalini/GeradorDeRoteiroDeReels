import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { getMockMode } from "../config/mockConfig.js";
import { temasMock } from "../config/mockData.js";

dotenv.config();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para temas");
      return res.json(temasMock);
    }

    const { topico } = req.body;
    console.log("📩 Requisição recebida com tópico:", topico);

    const body = {
      model: process.env.MODEL_NAME,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "temas_schema",
          schema: {
            type: "object",
            properties: {
              temas: { type: "array", items: { type: "string" } },
            },
            required: ["temas"],
          },
        },
      },
      messages: [
        { role: "system", content: "Responda sempre em JSON válido" },
        { role: "user", content: `${process.env.PROMPT_TEMAS} ${topico}` },
      ],
    };

    console.log("📤 Enviando requisição para OpenRouter...");
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      body,
      { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } }
    );

    console.log("✅ Resposta recebida do OpenRouter");
    const conteudo = response.data.choices[0].message.content;
    console.log("📦 Conteúdo retornado:", conteudo);

    const parsed = JSON.parse(conteudo);
    console.log("📑 Conteúdo parseado:", parsed);

    res.json(parsed);
  } catch (error) {
    console.error("❌ Erro na rota /:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
