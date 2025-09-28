import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import chalk from "chalk";
import { getMockMode } from "../config/mockConfig.js";
import { roteiroMock, roteiroMockEn } from "../config/mockData.js";
import { getConfig } from "../config/configManager.js";
import {
  normalizeLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from "../config/language.js";

dotenv.config();
const router = express.Router();

const LANGUAGE_PROMPT_KEYS = {
  en: "PROMPT_ROTEIRO_EN",
  "pt-BR": "PROMPT_ROTEIRO",
};

const SYSTEM_MESSAGES = {
  en: "Respond in pure JSON. Do not use markdown or code blocks.",
  "pt-BR":
    "Responda em JSON puro válido. Não use markdown ou blocos de código.",
};

router.post("/", async (req, res) => {
  try {
    if (getMockMode()) {
      console.log("Usando dados mock para roteiro");
      const languageForMock = normalizeLanguage(
        req.body.language || req.user?.language
      );
      return res.json(languageForMock === "en" ? roteiroMockEn : roteiroMock);
    }

    const { tema, duracao, language: languageFromBody } = req.body;
    const requestedLanguage =
      typeof languageFromBody === "string" ? languageFromBody.trim() : null;
    const effectiveLanguage = SUPPORTED_LANGUAGES.includes(requestedLanguage)
      ? requestedLanguage
      : normalizeLanguage(req.user?.language);

    console.log("Requisição recebida com dados:", {
      tema,
      duracao,
      language: effectiveLanguage,
    });

    const modelName = await getConfig("MODEL_NAME", "MODEL_NAME");
    const promptKey =
      LANGUAGE_PROMPT_KEYS[effectiveLanguage] ||
      LANGUAGE_PROMPT_KEYS[DEFAULT_LANGUAGE];
    let promptRoteiro = await getConfig(promptKey, promptKey);

    if (!promptRoteiro && effectiveLanguage !== DEFAULT_LANGUAGE) {
      const fallbackKey = LANGUAGE_PROMPT_KEYS[DEFAULT_LANGUAGE];
      promptRoteiro = await getConfig(fallbackKey, fallbackKey);
    }

    if (!promptRoteiro) {
      return res.status(500).json({ error: "Prompt não configurado" });
    }

    const openrouterApiKey = await getConfig(
      "OPENROUTER_API_KEY",
      "OPENROUTER_API_KEY"
    );

    if (!openrouterApiKey) {
      return res
        .status(500)
        .json({ error: "Chave da API OpenRouter não configurada" });
    }

    const prompt = promptRoteiro
      .replace("{duracao}", duracao)
      .replace("{tema}", tema);
    console.log("Prompt gerado:", prompt);

    const systemMessage =
      SYSTEM_MESSAGES[effectiveLanguage] || SYSTEM_MESSAGES[DEFAULT_LANGUAGE];

    let body = {
      model: modelName,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "roteiro_schema",
          schema: {
            type: "object",
            properties: {
              roteiro: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    narracao: { type: "string" },
                    imagem: { type: "string" },
                  },
                  required: ["narracao", "imagem"],
                  additionalProperties: false,
                },
              },
            },
            required: ["roteiro"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        { role: "user", content: prompt },
      ],
    };

    // Log colorido do prompt enviado para OpenRouter
    console.log(chalk.cyan.bold("\n🚀 OPENROUTER REQUEST - ROTEIRO"));
    console.log(chalk.yellow("📋 System Message:"));
    console.log(chalk.white(systemMessage));
    console.log(chalk.yellow("💬 User Prompt:"));
    console.log(chalk.white(prompt));
    console.log(chalk.blue("🌐 Language:"), chalk.green(effectiveLanguage));
    console.log(chalk.blue("🤖 Model:"), chalk.green(modelName));
    console.log(chalk.blue("🎬 Tema:"), chalk.green(tema));
    console.log(chalk.blue("⏱️ Duração:"), chalk.green(duracao + "s"));
    console.log(chalk.cyan("─".repeat(60)));

    console.log("Enviando requisição para OpenRouter...");
    let response;
    try {
      response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        body,
        {
          headers: {
            Authorization: `Bearer ${openrouterApiKey}`,
          },
        }
      );
    } catch (err) {
      if (err.response) {
        console.error("Erro na rota /roteiro (primeira tentativa):", {
          status: err.response.status,
          data: err.response.data,
          metadata: err.response.data?.error?.metadata,
        });
      }

      console.log("entando fallback com response_format: 'json'...");
      body = {
        ...body,
        response_format: "json",
      };
      response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        body,
        {
          headers: {
            Authorization: `Bearer ${openrouterApiKey}`,
          },
        }
      );
    }

    console.log("Resposta recebida do OpenRouter");
    let conteudo = response.data.choices[0].message.content;
    console.log("Conteúdo retornado:", conteudo);

    conteudo = conteudo
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(conteudo);
      console.log("Conteúdo parseado:", parsed);
      res.json({ ...parsed, language: effectiveLanguage });
    } catch (parseError) {
      console.error("? Erro ao fazer parse do JSON:", parseError.message);
      res.status(500).json({
        error: "Falha ao interpretar resposta do modelo",
        raw: conteudo,
      });
    }
  } catch (error) {
    if (error.response) {
      console.error("? Erro final na rota /roteiro:", {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data,
        metadata: error.response.data?.error?.metadata,
      });
    } else if (error.request) {
      console.error("Nenhuma resposta recebida:", error.request);
    } else {
      console.error("Erro na configuração da requisição:", error.message);
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
