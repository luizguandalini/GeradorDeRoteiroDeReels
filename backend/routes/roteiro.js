import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { tema, duracao } = req.body;
    console.log("📩 Requisição recebida com dados:", { tema, duracao });

    const prompt = process.env.PROMPT_ROTEIRO.replace(
      "{duracao}",
      duracao
    ).replace("{tema}", tema);
    console.log("📝 Prompt gerado:", prompt);

    // Corpo principal com json_schema
    let body = {
      model: process.env.MODEL_NAME,
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
                  additionalProperties: false, // 🔑 exigido pelo provider
                },
              },
            },
            required: ["roteiro"],
            additionalProperties: false, // 🔑 idem no nível raiz
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "Responda em JSON puro válido. Não use markdown ou blocos de código.",
        },
        { role: "user", content: prompt },
      ],
    };

    console.log("📤 Enviando requisição para OpenRouter...");
    let response;
    try {
      response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        body,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
        }
      );
    } catch (err) {
      // Se falhar, loga detalhes completos
      if (err.response) {
        console.error("❌ Erro na rota / (primeira tentativa):", {
          status: err.response.status,
          data: err.response.data,
          metadata: err.response.data?.error?.metadata,
        });
      }

      // Fallback para response_format simples
      console.log("⚠️ Tentando fallback com response_format: 'json'...");
      body = {
        ...body,
        response_format: "json",
      };
      response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        body,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
        }
      );
    }

    console.log("✅ Resposta recebida do OpenRouter");
    let conteudo = response.data.choices[0].message.content;
    console.log("📦 Conteúdo retornado:", conteudo);

    // limpa blocos de markdown caso venham (```json ... ```)
    conteudo = conteudo
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(conteudo);
      console.log("📑 Conteúdo parseado:", parsed);
      res.json(parsed);
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse do JSON:", parseError.message);
      res
        .status(500)
        .json({
          error: "Falha ao interpretar resposta do modelo",
          raw: conteudo,
        });
    }
  } catch (error) {
    if (error.response) {
      console.error("❌ Erro final na rota /:", {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data,
        metadata: error.response.data?.error?.metadata,
      });
    } else if (error.request) {
      console.error("❌ Nenhuma resposta recebida:", error.request);
    } else {
      console.error("❌ Erro na configuração da requisição:", error.message);
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
