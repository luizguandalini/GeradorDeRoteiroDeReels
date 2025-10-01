import express from "express";
import { PrismaClient } from "@prisma/client";
import { SUPPORTED_LANGUAGES } from "../config/language.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

const buildResponseUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  provider: user.provider,
  language: user.language,
  active: user.active,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

// Função para deletar arquivos de áudio do usuário
const deleteUserAudioFiles = async (userId) => {
  try {
    const audioPath = path.join(process.cwd(), "audios", `user_${userId}`);
    if (fs.existsSync(audioPath)) {
      fs.rmSync(audioPath, { recursive: true, force: true });
      console.log(`🗑️ Pasta de áudios do usuário ${userId} deletada: ${audioPath}`);
    }
  } catch (error) {
    console.error(`Erro ao deletar arquivos de áudio do usuário ${userId}:`, error);
  }
};

// ROTAS ADMIN - Gerenciamento de usuários

// GET /api/users/admin/list - Listar usuários com paginação e filtros (ADMIN ONLY)
router.get("/admin/list", requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      role = "", 
      active = "" 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role && role !== 'all') {
      where.role = role;
    }
    
    if (active && active !== 'all') {
      where.active = active === 'true';
    }

    // Buscar usuários com paginação
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          provider: true,
          language: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              narracoes: true,
              roteiros: true,
              topicos: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      users: users.map(user => ({
        ...buildResponseUser(user),
        stats: user._count
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/users/admin/create - Criar novo usuário (ADMIN ONLY)
router.post("/admin/create", requireAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validações
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: "Nome, email e senha são obrigatórios" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: "A senha deve ter pelo menos 6 caracteres" 
      });
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: "Email já está em uso" 
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'GENERAL', // Sempre usuário normal
        provider: 'CREDENTIALS'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        language: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      message: "Usuário criado com sucesso",
      user: buildResponseUser(newUser)
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// PUT /api/users/admin/:id - Editar usuário (ADMIN ONLY)
router.put("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, active, language } = req.body;
    const userId = parseInt(id);

    if (!userId) {
      return res.status(400).json({ error: "ID de usuário inválido" });
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Preparar dados para atualização
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Verificar se email já está em uso por outro usuário
      const emailInUse = await prisma.user.findFirst({
        where: { 
          email,
          id: { not: userId }
        }
      });
      
      if (emailInUse) {
        return res.status(400).json({ error: "Email já está em uso" });
      }
      updateData.email = email;
    }
    if (password !== undefined && password.length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ 
          error: "A senha deve ter pelo menos 6 caracteres" 
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (role !== undefined) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    if (language !== undefined && SUPPORTED_LANGUAGES.includes(language)) {
      updateData.language = language;
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        language: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: "Usuário atualizado com sucesso",
      user: buildResponseUser(updatedUser)
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// DELETE /api/users/admin/:id - Deletar usuário e todos os dados relacionados (ADMIN ONLY)
router.delete("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (!userId) {
      return res.status(400).json({ error: "ID de usuário inválido" });
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Não permitir que admin delete a si mesmo
    if (userId === req.user.id) {
      return res.status(400).json({ 
        error: "Você não pode deletar sua própria conta" 
      });
    }

    // Deletar arquivos de áudio do usuário
    await deleteUserAudioFiles(userId);

    // Deletar usuário (cascade vai deletar todos os dados relacionados)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      message: "Usuário e todos os dados relacionados foram deletados com sucesso"
    });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/users/admin/:id - Obter detalhes de um usuário específico (ADMIN ONLY)
router.get("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (!userId) {
      return res.status(400).json({ error: "ID de usuário inválido" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        language: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            narracoes: true,
            roteiros: true,
            topicos: true,
            configuracoes: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({
      user: {
        ...buildResponseUser(user),
        stats: user._count
      }
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA EXISTENTE - Atualizar idioma do usuário logado

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

