import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { getMockMode } from "../config/mockConfig.js";
import { temasMock, temasMockEn } from "../config/mockData.js";
import prisma from "../config/database.js";
import { getConfig } from "../config/configManager.js";
import {
  normalizeLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from "../config/language.js";

dotenv.config();
const router = express.Router();

const LANGUAGE_PROMPT_KEYS = {
  en: "PROMPT_TEMAS_EN",
  "pt-BR": "PROMPT_TEMAS",
};

const SYSTEM_MESSAGES = {
  en: "Always respond with valid JSON.",
  "pt-BR": "Responda sempre em JSON válido.",
};

router.post("/", async (req, res) => {
  try {
    const requestedLanguageRaw =
      typeof req.body.language === "string" ? req.body.language.trim() : null;
    const requestedLanguage = SUPPORTED_LANGUAGES.includes(requestedLanguageRaw)
      ? requestedLanguageRaw
      : null;
    const userLanguage = normalizeLanguage(req.user?.language);
    const language = requestedLanguage || userLanguage;

    if (getMockMode()) {
      console.log("Usando dados mock para temas");
      return res.json(language === "en" ? temasMockEn : temasMock);
    }

    const { topicoId } = req.body;
    console.log(
      "Requisição recebida com tópico ID:",
      topicoId,
      "idioma:",
      language
    );

    const topico = await prisma.topico.findUnique({
      where: { id: parseInt(topicoId, 10) },
    });

    if (!topico) {
      return res.status(404).json({ error: "Tópico não encontrado" });
    }

    const promptKey =
      LANGUAGE_PROMPT_KEYS[language] || LANGUAGE_PROMPT_KEYS[DEFAULT_LANGUAGE];
    let promptTemas = await getConfig(promptKey, promptKey);

    if (!promptTemas && language !== DEFAULT_LANGUAGE) {
      const fallbackKey = LANGUAGE_PROMPT_KEYS[DEFAULT_LANGUAGE];
      promptTemas = await getConfig(fallbackKey, fallbackKey);
    }

    if (!promptTemas) {
      return res.status(500).json({ error: "Prompt não configurado" });
    }

    const modelName = await getConfig("MODEL_NAME", "MODEL_NAME");
    const openrouterApiKey = await getConfig(
      "OPENROUTER_API_KEY",
      "OPENROUTER_API_KEY"
    );

    if (!openrouterApiKey) {
      return res
        .status(500)
        .json({ error: "Chave da API OpenRouter não configurada" });
    }

    const systemMessage =
      SYSTEM_MESSAGES[language] || SYSTEM_MESSAGES[DEFAULT_LANGUAGE];

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
        { role: "system", content: systemMessage },
        { role: "user", content: `${promptTemas} ${topico.nome}` },
      ],
    };

    console.log("Enviando requisição para OpenRouter...");
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      body,
      { headers: { Authorization: `Bearer ${openrouterApiKey}` } }
    );

    console.log("Resposta recebida do OpenRouter");
    const conteudo = response.data.choices[0].message.content;
    console.log("Conteúdo retornado:", conteudo);

    const parsed = JSON.parse(conteudo);
    console.log("Conteúdo parseado:", parsed);

    const temasCreated = await Promise.all(
      parsed.temas.map((tema) =>
        prisma.tema.create({
          data: {
            titulo: tema,
            topicoId: topico.id,
          },
        })
      )
    );

    console.log("Temas salvos no banco de dados");
    res.json({
      temas: temasCreated.map((t) => t.titulo),
      topico: topico.nome,
      language,
    });
  } catch (error) {
    console.error("? Erro na rota /temas:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
