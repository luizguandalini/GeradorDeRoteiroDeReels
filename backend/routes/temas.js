import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { getMockMode } from "../config/mockConfig.js";
import { temasMock } from "../config/mockData.js";
import prisma from "../config/database.js";
import { getConfig } from "../config/configManager.js";

dotenv.config();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para temas");
      return res.json(temasMock);
    }

    const { topicoId } = req.body;
    console.log("📩 Requisição recebida com tópico ID:", topicoId);

    // Buscar o tópico no banco de dados
    const topico = await prisma.topico.findUnique({
      where: { id: parseInt(topicoId) }
    });

    if (!topico) {
      return res.status(404).json({ error: "Tópico não encontrado" });
    }

    // Buscar configurações do banco
    const modelName = await getConfig('MODEL_NAME', 'MODEL_NAME');
    const promptTemas = await getConfig('PROMPT_TEMAS', 'PROMPT_TEMAS');
    const openrouterApiKey = await getConfig('OPENROUTER_API_KEY', 'OPENROUTER_API_KEY');

    if (!openrouterApiKey) {
      return res.status(500).json({ error: "Chave da API OpenRouter não configurada" });
    }

    const body = {
      model: modelName,
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
        { role: "user", content: `${promptTemas} ${topico.nome}` },
      ],
    };

    console.log("📤 Enviando requisição para OpenRouter...");
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      body,
      { headers: { Authorization: `Bearer ${openrouterApiKey}` } }
    );

    console.log("✅ Resposta recebida do OpenRouter");
    const conteudo = response.data.choices[0].message.content;
    console.log("📦 Conteúdo retornado:", conteudo);

    const parsed = JSON.parse(conteudo);
    console.log("📑 Conteúdo parseado:", parsed);

    // Salvar os temas no banco de dados
    const temasCreated = await Promise.all(
      parsed.temas.map(tema => 
        prisma.tema.create({
          data: {
            titulo: tema,
            topicoId: topico.id
          }
        })
      )
    );

    console.log("💾 Temas salvos no banco de dados");
    res.json({ 
      temas: temasCreated.map(t => t.titulo), 
      topico: topico.nome 
    });
  } catch (error) {
    console.error("❌ Erro na rota /:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
