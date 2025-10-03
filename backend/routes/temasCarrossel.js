import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import chalk from "chalk";
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

// GET - Buscar últimos temas de carrossel do usuário para um tópico
router.get("/:topicoId", async (req, res) => {
  try {
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para temas de carrossel");
      return res.json(temasMock);
    }

    const { topicoId } = req.params;
    
    const topico = await prisma.userTopico.findFirst({
      where: { 
        id: parseInt(topicoId, 10),
        userId: req.user.id
      },
    });

    if (!topico) {
      return res.status(404).json({ error: "Tópico não encontrado" });
    }

    const temas = await prisma.userTemaCarrossel.findMany({
      where: {
        userTopicoId: topico.id,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      temas: temas.map(t => t.titulo),
      topico: topico.nome,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar temas de carrossel:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST - Criar novos temas de carrossel

const LANGUAGE_PROMPT_KEYS = {
  en: "PROMPT_TEMAS_CARROSSEL_EN",
  "pt-BR": "PROMPT_TEMAS_CARROSSEL",
};

const SYSTEM_MESSAGES = {
  en: "Always respond with valid JSON.",
  "pt-BR": "Responda sempre em JSON válido.",
};

router.post("/", async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    if (!getMockMode() && !isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { quotaTemasCarrossel: true }
      });
      if (!user || user.quotaTemasCarrossel <= 0) {
        return res.status(403).json({ error: "Limite de geração de temas de carrossel atingido" });
      }
    }
    const requestedLanguageRaw =
      typeof req.body.language === "string" ? req.body.language.trim() : null;
    
    // Validar language - deve ser exatamente 'pt-BR' ou 'en'
    if (requestedLanguageRaw && !SUPPORTED_LANGUAGES.includes(requestedLanguageRaw)) {
      return res.status(400).json({ 
        error: "Invalid language parameter. Only 'pt-BR' and 'en' are supported." 
      });
    }
    
    const requestedLanguage = SUPPORTED_LANGUAGES.includes(requestedLanguageRaw)
      ? requestedLanguageRaw
      : null;
    const userLanguage = normalizeLanguage(req.user?.language);
    const language = requestedLanguage || userLanguage;

    if (getMockMode()) {
      console.log("Usando dados mock para temas de carrossel");
      return res.json(language === "en" ? temasMockEn : temasMock);
    }

    const { topicoId } = req.body;
    console.log(
      "Requisição recebida com tópico ID:",
      topicoId,
      "idioma:",
      language
    );

    // Validar se topicoId foi fornecido
    if (!topicoId) {
      return res.status(400).json({ error: "ID do tópico é obrigatório" });
    }

    const topicoIdInt = parseInt(topicoId, 10);
    if (isNaN(topicoIdInt)) {
      return res.status(400).json({ error: "ID do tópico deve ser um número válido" });
    }

    const topico = await prisma.userTopico.findFirst({
      where: { 
        id: topicoIdInt,
        userId: req.user.id
      },
    });

    if (!topico) {
      return res.status(404).json({ error: "Tópico não encontrado" });
    }

    const promptKey =
      LANGUAGE_PROMPT_KEYS[language] || LANGUAGE_PROMPT_KEYS[DEFAULT_LANGUAGE];
    let promptTemas = await getConfig(promptKey, null, promptKey);

    if (!promptTemas && language !== DEFAULT_LANGUAGE) {
      const fallbackKey = LANGUAGE_PROMPT_KEYS[DEFAULT_LANGUAGE];
      promptTemas = await getConfig(fallbackKey, null, fallbackKey);
    }

    if (!promptTemas) {
      return res.status(500).json({ error: "Prompt não configurado" });
    }

    const modelName = await getConfig("MODEL_NAME", null, "MODEL_NAME");
    const openrouterApiKey = await getConfig(
      "OPENROUTER_API_KEY",
      null,
      "OPENROUTER_API_KEY"
    );

    if (!openrouterApiKey) {
      return res
        .status(500)
        .json({ error: "Chave da API OpenRouter não configurada" });
    }

    const systemMessage =
      SYSTEM_MESSAGES[language] || SYSTEM_MESSAGES[DEFAULT_LANGUAGE];

    const userPrompt = `${promptTemas} ${topico.nome}`;

    const body = {
      model: modelName,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "temas_carrossel_schema",
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
        { role: "user", content: userPrompt },
      ],
    };

    // Log colorido do prompt enviado para OpenRouter
    console.log(chalk.cyan.bold("\n🚀 OPENROUTER REQUEST - TEMAS CARROSSEL"));
    console.log(chalk.yellow("📋 System Message:"));
    console.log(chalk.white(systemMessage));
    console.log(chalk.yellow("💬 User Prompt:"));
    console.log(chalk.white(userPrompt));
    console.log(chalk.blue("🌐 Language:"), chalk.green(language));
    console.log(chalk.blue("🤖 Model:"), chalk.green(modelName));
    console.log(chalk.cyan("─".repeat(60)));

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

    // Deletar todos os temas de carrossel antigos do usuário para este tópico
    await prisma.userTemaCarrossel.deleteMany({
      where: {
        userTopicoId: topico.id,
      },
    });
    console.log("Temas de carrossel antigos deletados");

    const temasCreated = await Promise.all(
      parsed.temas.map((tema) =>
        prisma.userTemaCarrossel.create({
          data: {
            titulo: tema,
            userTopicoId: topico.id,
          },
        })
      )
    );

    console.log("Temas de carrossel salvos no banco de dados");

    // Decrementar crédito apenas em cenário feliz
    if (!getMockMode() && !isAdmin) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { quotaTemasCarrossel: { decrement: 1 } }
      });
    }

    res.json({
      temas: temasCreated.map((t) => t.titulo),
      topico: topico.nome,
      language,
    });
  } catch (error) {
    console.error("❌ Erro na rota /temas-carrossel:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;