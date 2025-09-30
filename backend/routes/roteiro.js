import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import chalk from "chalk";
import { getMockMode } from "../config/mockConfig.js";
import { roteiroMock, roteiroMockEn } from "../config/mockData.js";
import { getConfig } from "../config/configManager.js";
import prisma from "../config/database.js";
import {
  normalizeLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from "../config/language.js";

dotenv.config();
const router = express.Router();

// GET - Buscar último roteiro do usuário
router.get("/", async (req, res) => {
  try {
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para roteiro");
      return res.json(roteiroMock);
    }

    const ultimoRoteiro = await prisma.userRoteiro.findFirst({
      where: {
        userId: req.user.id,
        ativo: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!ultimoRoteiro) {
      return res.json({ roteiro: [] });
    }

    const conteudo = JSON.parse(ultimoRoteiro.conteudo);
    res.json({ ...conteudo, id: ultimoRoteiro.id });
  } catch (error) {
    console.error("❌ Erro ao buscar roteiro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST - Criar novo roteiro

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
    
    // Validar tema (deve ter no máximo 500 caracteres)
    if (!tema || typeof tema !== 'string') {
      const errorMessage = effectiveLanguage === 'en' 
        ? 'Theme is required and must be a string'
        : 'Tema é obrigatório e deve ser um texto';
      return res.status(400).json({ error: errorMessage });
    }
    
    if (tema.length > 500) {
      const errorMessage = effectiveLanguage === 'en' 
        ? 'Theme must not exceed 500 characters'
        : 'O tema não pode exceder 500 caracteres';
      return res.status(400).json({ error: errorMessage });
    }
    
    // Validar duração (deve ser um número inteiro entre 30 e 120)
    const duracaoInt = parseInt(duracao, 10);
    if (!duracao || isNaN(duracaoInt) || duracaoInt < 30 || duracaoInt > 120) {
      const errorMessage = effectiveLanguage === 'en' 
        ? 'Duration must be between 30 and 120 seconds'
        : 'A duração deve estar entre 30 e 120 segundos';
      return res.status(400).json({ error: errorMessage });
    }

    console.log("Requisição recebida com dados:", {
      tema,
      duracao,
      language: effectiveLanguage,
    });

    const modelName = await getConfig("MODEL_NAME", null, "MODEL_NAME");
    const promptKey =
      LANGUAGE_PROMPT_KEYS[effectiveLanguage] ||
      LANGUAGE_PROMPT_KEYS[DEFAULT_LANGUAGE];
    let promptRoteiro = await getConfig(promptKey, null, promptKey);

    if (!promptRoteiro && effectiveLanguage !== DEFAULT_LANGUAGE) {
      const fallbackKey = LANGUAGE_PROMPT_KEYS[DEFAULT_LANGUAGE];
      promptRoteiro = await getConfig(fallbackKey, null, fallbackKey);
    }

    if (!promptRoteiro) {
      return res.status(500).json({ error: "Prompt não configurado" });
    }

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
      
      // Validar limites de caracteres
      if (parsed.roteiro && Array.isArray(parsed.roteiro)) {
        let totalNarracoes = 0;
        let totalImagens = 0;
        
        for (const item of parsed.roteiro) {
          // Validar que nenhum combo tenha campos vazios
          if (!item.narracao || !item.narracao.trim()) {
            const errorMessage = effectiveLanguage === 'en' 
              ? 'All narration fields must be filled'
              : 'Todos os campos de narração devem ser preenchidos';
            return res.status(400).json({ error: errorMessage });
          }
          
          if (!item.imagem || !item.imagem.trim()) {
            const errorMessage = effectiveLanguage === 'en' 
              ? 'All image/video description fields must be filled'
              : 'Todos os campos de descrição de imagem/vídeo devem ser preenchidos';
            return res.status(400).json({ error: errorMessage });
          }
          
          totalNarracoes += item.narracao.length;
          totalImagens += item.imagem.length;
        }
        
        if (totalNarracoes > 2000) {
          const errorMessage = effectiveLanguage === 'en' 
            ? `Total narration characters (${totalNarracoes}) exceeds the limit of 2000 characters`
            : `Total de caracteres das narrações (${totalNarracoes}) excede o limite de 2000 caracteres`;
          return res.status(400).json({ error: errorMessage });
        }
        
        if (totalImagens > 2000) {
          const errorMessage = effectiveLanguage === 'en' 
            ? `Total image/video description characters (${totalImagens}) exceeds the limit of 2000 characters`
            : `Total de caracteres das descrições de imagem/vídeo (${totalImagens}) excede o limite de 2000 caracteres`;
          return res.status(400).json({ error: errorMessage });
        }
      }
      
      // Deletar roteiros antigos do usuário
      await prisma.userRoteiro.updateMany({
        where: {
          userId: req.user.id,
          ativo: true
        },
        data: { ativo: false }
      });
      console.log("Roteiros antigos desativados");

      // Salvar novo roteiro no banco
      const novoRoteiro = await prisma.userRoteiro.create({
        data: {
          tema,
          duracao: parseInt(duracao),
          conteudo: JSON.stringify(parsed),
          userId: req.user.id,
          ativo: true
        }
      });
      console.log("Novo roteiro salvo no banco");
      
      res.json({ ...parsed, language: effectiveLanguage, id: novoRoteiro.id });
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

// PUT - Atualizar roteiro existente
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { roteiro } = req.body;
    
    // Determinar idioma efetivo para mensagens de erro
    const effectiveLanguage = normalizeLanguage(req.user?.language);
    
    // Verificar se o roteiro pertence ao usuário
    const roteiroExistente = await prisma.userRoteiro.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.id,
        ativo: true
      }
    });
    
    if (!roteiroExistente) {
      const errorMessage = effectiveLanguage === 'en' 
        ? 'Script not found'
        : 'Roteiro não encontrado';
      return res.status(404).json({ error: errorMessage });
    }
    
    // Validar limites de caracteres
    if (roteiro && Array.isArray(roteiro)) {
      let totalNarracoes = 0;
      let totalImagens = 0;
      
      for (const item of roteiro) {
        // Validar que nenhum combo tenha campos vazios
        if (!item.narracao || !item.narracao.trim()) {
          const errorMessage = effectiveLanguage === 'en' 
            ? 'All narration fields must be filled'
            : 'Todos os campos de narração devem ser preenchidos';
          return res.status(400).json({ error: errorMessage });
        }
        
        if (!item.imagem || !item.imagem.trim()) {
          const errorMessage = effectiveLanguage === 'en' 
            ? 'All image/video description fields must be filled'
            : 'Todos os campos de descrição de imagem/vídeo devem ser preenchidos';
          return res.status(400).json({ error: errorMessage });
        }
        
        totalNarracoes += item.narracao.length;
        totalImagens += item.imagem.length;
      }
      
      if (totalNarracoes > 2000) {
        const errorMessage = effectiveLanguage === 'en' 
          ? `Total narration characters (${totalNarracoes}) exceeds the limit of 2000 characters`
          : `Total de caracteres das narrações (${totalNarracoes}) excede o limite de 2000 caracteres`;
        return res.status(400).json({ error: errorMessage });
      }
      
      if (totalImagens > 2000) {
        const errorMessage = effectiveLanguage === 'en' 
          ? `Total image/video description characters (${totalImagens}) exceeds the limit of 2000 characters`
          : `Total de caracteres das descrições de imagem/vídeo (${totalImagens}) excede o limite de 2000 caracteres`;
        return res.status(400).json({ error: errorMessage });
      }
    }
    
    // Atualizar o roteiro no banco
    const roteiroAtualizado = await prisma.userRoteiro.update({
      where: { id: parseInt(id) },
      data: {
        conteudo: JSON.stringify({ roteiro })
      }
    });
    
    console.log("Roteiro atualizado com sucesso");
    res.json({ roteiro, id: roteiroAtualizado.id });
    
  } catch (error) {
    console.error("❌ Erro ao atualizar roteiro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
