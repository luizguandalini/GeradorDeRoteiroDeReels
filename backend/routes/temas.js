import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { topico } = req.body;

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

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      body,
      { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } }
    );

    const conteudo = response.data.choices[0].message.content;
    res.json(JSON.parse(conteudo));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
