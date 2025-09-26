import express from "express";
import prisma from "../config/database.js";

const router = express.Router();

// GET /api/topicos - Listar tópicos com paginação
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const where = {
      ativo: true,
      ...(search && {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [topicos, total] = await Promise.all([
      prisma.topico.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.topico.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      topicos,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("❌ Erro ao buscar tópicos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/topicos/:id - Buscar tópico por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const topico = await prisma.topico.findUnique({
      where: { id: parseInt(id) }
    });

    if (!topico) {
      return res.status(404).json({ error: "Tópico não encontrado" });
    }

    res.json(topico);
  } catch (error) {
    console.error("❌ Erro ao buscar tópico:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/topicos - Criar novo tópico
router.post("/", async (req, res) => {
  try {
    const { nome, descricao } = req.body;

    if (!nome) {
      return res.status(400).json({ error: "Nome do tópico é obrigatório" });
    }

    const topico = await prisma.topico.create({
      data: {
        nome: nome.trim(),
        descricao: descricao?.trim()
      }
    });

    console.log("✅ Tópico criado:", topico.nome);
    res.status(201).json(topico);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Já existe um tópico com este nome" });
    }
    console.error("❌ Erro ao criar tópico:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// PUT /api/topicos/:id - Atualizar tópico
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, ativo } = req.body;

    const topico = await prisma.topico.update({
      where: { id: parseInt(id) },
      data: {
        ...(nome && { nome: nome.trim() }),
        ...(descricao !== undefined && { descricao: descricao?.trim() }),
        ...(ativo !== undefined && { ativo })
      }
    });

    console.log("✅ Tópico atualizado:", topico.nome);
    res.json(topico);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Tópico não encontrado" });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Já existe um tópico com este nome" });
    }
    console.error("❌ Erro ao atualizar tópico:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// DELETE /api/topicos/:id - Deletar tópico (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const topico = await prisma.topico.update({
      where: { id: parseInt(id) },
      data: { ativo: false }
    });

    console.log("✅ Tópico desativado:", topico.nome);
    res.json({ message: "Tópico desativado com sucesso" });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Tópico não encontrado" });
    }
    console.error("❌ Erro ao desativar tópico:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;