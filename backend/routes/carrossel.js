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

// GET - Buscar último carrossel do usuário
router.get("/", async (req, res) => {
  try {
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para carrossel");
      return res.json(roteiroMock);
    }

    const ultimoCarrossel = await prisma.userCarrossel.findFirst({
      where: {
        userId: req.user.id,
        ativo: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!ultimoCarrossel) {
      return res.json({ carrossel: [] });
    }

    const conteudo = JSON.parse(ultimoCarrossel.conteudo);
    res.json({ ...conteudo, id: ultimoCarrossel.id });
  } catch (error) {
    console.error("❌ Erro ao buscar carrossel:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST - Criar novo carrossel

const LANGUAGE_PROMPT_KEYS = {
  en: "PROMPT_CARROSSEL_EN",
  "pt-BR": "PROMPT_CARROSSEL",
};

const SYSTEM_MESSAGES = {
  en: "Respond in pure JSON. Do not use markdown or code blocks.",
  "pt-BR":
    "Responda em JSON puro válido. Não use markdown ou blocos de código.",
};

router.post("/", async (req, res) => {
  try {
    if (getMockMode()) {
      console.log("Usando dados mock para carrossel");
      const languageForMock = normalizeLanguage(
        req.body.language || req.user?.language
      );
      return res.json(languageForMock === "en" ? roteiroMockEn : roteiroMock);
    }

    const { tema, quantidade, language: languageFromBody } = req.body;
    
    // Validar language - deve ser exatamente 'pt-BR' ou 'en'
    const requestedLanguage =
      typeof languageFromBody === "string" ? languageFromBody.trim() : null;
    if (requestedLanguage && !SUPPORTED_LANGUAGES.includes(requestedLanguage)) {
      return res.status(400).json({ 
        error: "Invalid language parameter. Only 'pt-BR' and 'en' are supported." 
      });
    }
    
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
    
    // Validar quantidade (deve ser um número inteiro entre 2 e 8)
    const quantidadeInt = parseInt(quantidade, 10);
    if (!quantidade || isNaN(quantidadeInt) || quantidadeInt < 2 || quantidadeInt > 8) {
      const errorMessage = effectiveLanguage === 'en' 
        ? 'Number of slides must be between 2 and 8'
        : 'A quantidade de slides deve estar entre 2 e 8';
      return res.status(400).json({ error: errorMessage });
    }

    console.log("Requisição recebida com dados:", {
      tema,
      quantidade,
      language: effectiveLanguage,
    });

    const modelName = await getConfig("MODEL_NAME", null, "MODEL_NAME");
    const promptKey =
      LANGUAGE_PROMPT_KEYS[effectiveLanguage] ||
      LANGUAGE_PROMPT_KEYS[DEFAULT_LANGUAGE];
    let promptCarrossel = await getConfig(promptKey, null, promptKey);

    if (!promptCarrossel && effectiveLanguage !== DEFAULT_LANGUAGE) {
      const fallbackKey = LANGUAGE_PROMPT_KEYS[DEFAULT_LANGUAGE];
      promptCarrossel = await getConfig(fallbackKey, null, fallbackKey);
    }

    if (!promptCarrossel) {
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

    const prompt = promptCarrossel
      .replace("{quantidade}", quantidade)
      .replace("{tema}", tema);
    console.log("Prompt gerado:", prompt);

    const systemMessage =
      SYSTEM_MESSAGES[effectiveLanguage] || SYSTEM_MESSAGES[DEFAULT_LANGUAGE];

    let body = {
      model: modelName,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "carrossel_schema",
          schema: {
            type: "object",
            properties: {
              carrossel: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    titulo: { type: "string" },
                    paragrafo: { type: "string" },
                    imagem: { type: "string" },
                  },
                  required: ["titulo", "paragrafo", "imagem"],
                  additionalProperties: false,
                },
              },
            },
            required: ["carrossel"],
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
    console.log(chalk.cyan.bold("\n🚀 OPENROUTER REQUEST - CARROSSEL"));
    console.log(chalk.yellow("📋 System Message:"));
    console.log(chalk.white(systemMessage));
    console.log(chalk.yellow("💬 User Prompt:"));
    console.log(chalk.white(prompt));
    console.log(chalk.blue("🌐 Language:"), chalk.green(effectiveLanguage));
    console.log(chalk.blue("🤖 Model:"), chalk.green(modelName));
    console.log(chalk.blue("🎬 Tema:"), chalk.green(tema));
    console.log(chalk.blue("📊 Quantidade:"), chalk.green(quantidade + " slides"));
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
        console.error("Erro na rota /carrossel (primeira tentativa):", {
          status: err.response.status,
          data: err.response.data,
          metadata: err.response.data?.error?.metadata,
        });
      }

      console.log("Tentando fallback com response_format: 'json'...");
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
      if (parsed.carrossel && Array.isArray(parsed.carrossel)) {
        let totalTitulos = 0;
        let totalParagrafos = 0;
        let totalImagens = 0;
        
        for (const item of parsed.carrossel) {
          // Validar que nenhum slide tenha campos vazios
          if (!item.titulo || !item.titulo.trim()) {
            const errorMessage = effectiveLanguage === 'en' 
              ? 'All title fields must be filled'
              : 'Todos os campos de título devem ser preenchidos';
            return res.status(400).json({ error: errorMessage });
          }
          
          if (!item.paragrafo || !item.paragrafo.trim()) {
            const errorMessage = effectiveLanguage === 'en' 
              ? 'All paragraph fields must be filled'
              : 'Todos os campos de parágrafo devem ser preenchidos';
            return res.status(400).json({ error: errorMessage });
          }
          
          if (!item.imagem || !item.imagem.trim()) {
            const errorMessage = effectiveLanguage === 'en' 
              ? 'All image description fields must be filled'
              : 'Todos os campos de descrição de imagem devem ser preenchidos';
            return res.status(400).json({ error: errorMessage });
          }
          
          totalTitulos += item.titulo.length;
          totalParagrafos += item.paragrafo.length;
          totalImagens += item.imagem.length;
        }
        
        if (totalTitulos > 1000) {
          const errorMessage = effectiveLanguage === 'en' 
            ? `Total title characters (${totalTitulos}) exceeds the limit of 1000 characters`
            : `Total de caracteres dos títulos (${totalTitulos}) excede o limite de 1000 caracteres`;
          return res.status(400).json({ error: errorMessage });
        }
        
        if (totalParagrafos > 3000) {
          const errorMessage = effectiveLanguage === 'en' 
            ? `Total paragraph characters (${totalParagrafos}) exceeds the limit of 3000 characters`
            : `Total de caracteres dos parágrafos (${totalParagrafos}) excede o limite de 3000 caracteres`;
          return res.status(400).json({ error: errorMessage });
        }
        
        if (totalImagens > 2000) {
          const errorMessage = effectiveLanguage === 'en' 
            ? `Total image description characters (${totalImagens}) exceeds the limit of 2000 characters`
            : `Total de caracteres das descrições de imagem (${totalImagens}) excede o limite de 2000 caracteres`;
          return res.status(400).json({ error: errorMessage });
        }
      }
      
      // Deletar carrosseis antigos do usuário
      await prisma.userCarrossel.updateMany({
        where: {
          userId: req.user.id,
          ativo: true
        },
        data: { ativo: false }
      });
      console.log("Carrosseis antigos desativados");

      // Salvar novo carrossel no banco
      const novoCarrossel = await prisma.userCarrossel.create({
        data: {
          tema,
          quantidade: parseInt(quantidade),
          conteudo: JSON.stringify(parsed),
          userId: req.user.id,
          ativo: true
        }
      });
      console.log("Novo carrossel salvo no banco");
      
      res.json({ ...parsed, language: effectiveLanguage, id: novoCarrossel.id });
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse do JSON:", parseError.message);
      res.status(500).json({
        error: "Falha ao interpretar resposta do modelo",
        raw: conteudo,
      });
    }
  } catch (error) {
    if (error.response) {
      console.error("❌ Erro final na rota /carrossel:", {
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

// PUT - Atualizar carrossel existente
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { carrossel } = req.body;
    
    // Determinar idioma efetivo para mensagens de erro
    const effectiveLanguage = normalizeLanguage(req.user?.language);
    
    // Verificar se o carrossel pertence ao usuário
    const carrosselExistente = await prisma.userCarrossel.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.id,
        ativo: true
      }
    });
    
    if (!carrosselExistente) {
      const errorMessage = effectiveLanguage === 'en' 
        ? 'Carousel not found'
        : 'Carrossel não encontrado';
      return res.status(404).json({ error: errorMessage });
    }
    
    // Validar limites de caracteres
    if (carrossel && Array.isArray(carrossel)) {
      let totalTitulos = 0;
      let totalParagrafos = 0;
      let totalImagens = 0;
      
      for (const item of carrossel) {
        // Validar que nenhum slide tenha campos vazios
        if (!item.titulo || !item.titulo.trim()) {
          const errorMessage = effectiveLanguage === 'en' 
            ? 'All title fields must be filled'
            : 'Todos os campos de título devem ser preenchidos';
          return res.status(400).json({ error: errorMessage });
        }
        
        if (!item.paragrafo || !item.paragrafo.trim()) {
          const errorMessage = effectiveLanguage === 'en' 
            ? 'All paragraph fields must be filled'
            : 'Todos os campos de parágrafo devem ser preenchidos';
          return res.status(400).json({ error: errorMessage });
        }
        
        if (!item.imagem || !item.imagem.trim()) {
          const errorMessage = effectiveLanguage === 'en' 
            ? 'All image description fields must be filled'
            : 'Todos os campos de descrição de imagem devem ser preenchidos';
          return res.status(400).json({ error: errorMessage });
        }
        
        totalTitulos += item.titulo.length;
        totalParagrafos += item.paragrafo.length;
        totalImagens += item.imagem.length;
      }
      
      if (totalTitulos > 1000) {
        const errorMessage = effectiveLanguage === 'en' 
          ? `Total title characters (${totalTitulos}) exceeds the limit of 1000 characters`
          : `Total de caracteres dos títulos (${totalTitulos}) excede o limite de 1000 caracteres`;
        return res.status(400).json({ error: errorMessage });
      }
      
      if (totalParagrafos > 3000) {
        const errorMessage = effectiveLanguage === 'en' 
          ? `Total paragraph characters (${totalParagrafos}) exceeds the limit of 3000 characters`
          : `Total de caracteres dos parágrafos (${totalParagrafos}) excede o limite de 3000 caracteres`;
        return res.status(400).json({ error: errorMessage });
      }
      
      if (totalImagens > 2000) {
        const errorMessage = effectiveLanguage === 'en' 
          ? `Total image description characters (${totalImagens}) exceeds the limit of 2000 characters`
          : `Total de caracteres das descrições de imagem (${totalImagens}) excede o limite de 2000 caracteres`;
        return res.status(400).json({ error: errorMessage });
      }
    }
    
    // Atualizar o carrossel no banco
    const carrosselAtualizado = await prisma.userCarrossel.update({
      where: { id: parseInt(id) },
      data: {
        conteudo: JSON.stringify({ carrossel })
      }
    });
    
    console.log("Carrossel atualizado com sucesso");
    res.json({ carrossel, id: carrosselAtualizado.id });
    
  } catch (error) {
    console.error("❌ Erro ao atualizar carrossel:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;