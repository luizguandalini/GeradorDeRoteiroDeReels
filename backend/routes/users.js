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
    const normalizedLanguage = SUPPORTED_LANGUAGES.includes(requestedLanguage)
      ? requestedLanguage
      : null;

    if (!normalizedLanguage) {
      return res.status(400).json({ error: "Idioma inválido" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { language: normalizedLanguage },
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
    console.error("Erro ao atualizar idioma do usuário:", error);
    return res.status(500).json({ error: "Erro ao atualizar idioma" });
  }
});

export default router;

