import express from "express";
import { PrismaClient } from "@prisma/client";
import { SUPPORTED_LANGUAGES } from "../config/language.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// Constantes para limites de caracteres
const MAX_EMAIL_LENGTH = 254; // RFC 5321 padrão para email
const MAX_PASSWORD_LENGTH = 128; // Limite razoável para senhas
const MAX_NAME_LENGTH = 100; // Limite para nomes de usuário
const MAX_QUOTA_DIGITS = 6; // Limite de dígitos para quotas (ex.: até 999999)

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Função para validar limites de entrada
const validateInputLimits = (data) => {
  const errors = [];
  
  if (data.email && data.email.length > MAX_EMAIL_LENGTH) {
    errors.push(`Email deve ter no máximo ${MAX_EMAIL_LENGTH} caracteres`);
  }
  
  if (data.password && data.password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres`);
  }
  
  if (data.name && data.name.length > MAX_NAME_LENGTH) {
    errors.push(`Nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres`);
  }
  
  return errors;
};

// Validar limites para quotas (número de dígitos e valores não negativos)
const validateQuotaLimits = (data) => {
  const errors = [];
  const checkField = (value, label) => {
    if (value === undefined || value === null) return;
    const num = parseInt(value, 10);
    if (Number.isNaN(num)) {
      errors.push(`${label} deve ser um número inteiro`);
      return;
    }
    if (num < 0) {
      errors.push(`${label} não pode ser negativo`);
    }
    const digits = Math.abs(num).toString().length;
    if (digits > MAX_QUOTA_DIGITS) {
      errors.push(`${label} deve ter no máximo ${MAX_QUOTA_DIGITS} dígitos`);
    }
  };
  checkField(data.quotaTemas, 'quotaTemas');
  checkField(data.quotaRoteiros, 'quotaRoteiros');
  checkField(data.quotaNarracoes, 'quotaNarracoes');
  checkField(data.quotaTemasCarrossel, 'quotaTemasCarrossel');
  checkField(data.quotaCarrossel, 'quotaCarrossel');
  return errors;
};

const buildResponseUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  provider: user.provider,
  language: user.language,
  active: user.active,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  // Incluir quotas para exibição/admin
  quotaTemas: user.quotaTemas ?? 0,
  quotaRoteiros: user.quotaRoteiros ?? 0,
  quotaNarracoes: user.quotaNarracoes ?? 0,
  quotaTemasCarrossel: user.quotaTemasCarrossel ?? 0,
  quotaCarrossel: user.quotaCarrossel ?? 0
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
          quotaTemas: true,
          quotaRoteiros: true,
          quotaNarracoes: true,
          quotaTemasCarrossel: true,
          quotaCarrossel: true,
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
        provider: 'CREDENTIALS',
        // Quotas sempre iniciam em zero
        quotaTemas: 0,
        quotaRoteiros: 0,
        quotaNarracoes: 0,
        quotaTemasCarrossel: 0,
        quotaCarrossel: 0
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
        updatedAt: true,
        quotaTemas: true,
        quotaRoteiros: true,
        quotaNarracoes: true,
        quotaTemasCarrossel: true,
        quotaCarrossel: true
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

// POST /api/users/admin - Criar usuário (ADMIN ONLY)
router.post("/admin", requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role = 'GENERAL', active = true, language = 'pt-BR' } = req.body;

    // Validar limites de caracteres
    const validationErrors = validateInputLimits({ email, password, name });
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }

    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nome, email e senha são obrigatórios" });
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
    const { name, email, password, role, active, language, quotaTemas, quotaRoteiros, quotaNarracoes, quotaTemasCarrossel, quotaCarrossel } = req.body;
    const userId = parseInt(id);

    // Validar limites de caracteres
    const validationErrors = validateInputLimits({ email, password, name });
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }

    // Validar limites de quotas
    const quotaErrors = validateQuotaLimits({ quotaTemas, quotaRoteiros, quotaNarracoes, quotaTemasCarrossel, quotaCarrossel });
    if (quotaErrors.length > 0) {
      return res.status(400).json({ error: quotaErrors.join(', ') });
    }

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
    // Atualizar quotas se fornecidas
    if (quotaTemas !== undefined) updateData.quotaTemas = Math.max(0, parseInt(quotaTemas, 10) || 0);
    if (quotaRoteiros !== undefined) updateData.quotaRoteiros = Math.max(0, parseInt(quotaRoteiros, 10) || 0);
    if (quotaNarracoes !== undefined) updateData.quotaNarracoes = Math.max(0, parseInt(quotaNarracoes, 10) || 0);
    if (quotaTemasCarrossel !== undefined) updateData.quotaTemasCarrossel = Math.max(0, parseInt(quotaTemasCarrossel, 10) || 0);
    if (quotaCarrossel !== undefined) updateData.quotaCarrossel = Math.max(0, parseInt(quotaCarrossel, 10) || 0);

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
        updatedAt: true,
        quotaTemas: true,
        quotaRoteiros: true,
        quotaNarracoes: true,
        quotaTemasCarrossel: true,
        quotaCarrossel: true
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

// PATCH /api/users/admin/:id/quotas - Atualizar apenas quotas (ADMIN ONLY)
router.patch("/admin/:id/quotas", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    if (!userId) {
      return res.status(400).json({ error: "ID de usuário inválido" });
    }

    const { quotaTemas, quotaRoteiros, quotaNarracoes, quotaTemasCarrossel, quotaCarrossel } = req.body;

    // Validar limites de quotas
    const quotaErrors = validateQuotaLimits({ quotaTemas, quotaRoteiros, quotaNarracoes, quotaTemasCarrossel, quotaCarrossel });
    if (quotaErrors.length > 0) {
      return res.status(400).json({ error: quotaErrors.join(', ') });
    }

    // Garantir que o usuário existe
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const updateData = {};
    if (quotaTemas !== undefined) updateData.quotaTemas = Math.max(0, parseInt(quotaTemas, 10) || 0);
    if (quotaRoteiros !== undefined) updateData.quotaRoteiros = Math.max(0, parseInt(quotaRoteiros, 10) || 0);
    if (quotaNarracoes !== undefined) updateData.quotaNarracoes = Math.max(0, parseInt(quotaNarracoes, 10) || 0);
    if (quotaTemasCarrossel !== undefined) updateData.quotaTemasCarrossel = Math.max(0, parseInt(quotaTemasCarrossel, 10) || 0);
    if (quotaCarrossel !== undefined) updateData.quotaCarrossel = Math.max(0, parseInt(quotaCarrossel, 10) || 0);

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
        updatedAt: true,
        quotaTemas: true,
        quotaRoteiros: true,
        quotaNarracoes: true,
        quotaTemasCarrossel: true,
        quotaCarrossel: true
      }
    });

    res.json({
      message: "Quotas atualizadas com sucesso",
      user: buildResponseUser(updatedUser)
    });
  } catch (error) {
    console.error("Erro ao atualizar quotas:", error);
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
        quotaTemas: true,
        quotaRoteiros: true,
        quotaNarracoes: true,
        quotaTemasCarrossel: true,
        quotaCarrossel: true,
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

