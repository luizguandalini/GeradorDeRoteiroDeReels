import express from "express";
import { PrismaClient } from "@prisma/client";
import { SUPPORTED_LANGUAGES } from "../config/language.js";

const router = express.Router();
const prisma = new PrismaClient();

const buildResponseUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  provider: user.provider,
  language: user.language
});

router.patch("/language", async (req, res) => {
  try {
    const { language } = req.body;
    const requestedLanguage = typeof language === "string" ? language.trim() : "";
    
    // Validar language - deve ser exatamente 'pt-BR' ou 'en'
    if (!requestedLanguage || !SUPPORTED_LANGUAGES.includes(requestedLanguage)) {
      return res.status(400).json({ 
        error: "Invalid language parameter. Only 'pt-BR' and 'en' are supported." 
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { language: requestedLanguage },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        language: true
      }
    });

    if (req.user) {
      req.user.language = updatedUser.language;
    }

    return res.json({
      message: "Idioma atualizado com sucesso",
      user: buildResponseUser(updatedUser)
    });
  } catch (error) {
    console.error("Erro ao atualizar idioma do usu�rio:", error);
    return res.status(500).json({ error: "Erro ao atualizar idioma" });
  }
});

export default router;

