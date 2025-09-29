import express from "express";
import prisma from "../config/database.js";
import { getMockMode } from "../config/mockConfig.js";
import { topicosMock } from "../config/mockData.js";

const router = express.Router();

// GET /api/topicos - Listar todos os tópicos
router.get("/", async (req, res) => {
  try {
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para tópicos");
      return res.json({
        topicos: topicosMock.topicos
      });
    }

    const topicos = await prisma.topico.findMany({
      where: { ativo: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      topicos
    });
  } catch (error) {
    console.error("❌ Erro ao buscar tópicos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/topicos/:id - Buscar tópico por ID
router.get("/:id", async (req, res) => {
  try {
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para buscar tópico por ID");
      const { id } = req.params;
      const topico = topicosMock.topicos.find(t => t.id === parseInt(id));
      
      if (!topico) {
        return res.status(404).json({ error: "Tópico não encontrado" });
      }
      
      return res.json(topico);
    }

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
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para criar tópico");
      const { nome } = req.body;
      
      if (!nome) {
        return res.status(400).json({ error: "Nome do tópico é obrigatório" });
      }
      
      // Simular criação de tópico
      const novoTopico = {
        id: Math.max(...topicosMock.topicos.map(t => t.id)) + 1,
        nome: nome.trim(),
        ativo: true,
        createdAt: new Date().toISOString()
      };
      
      return res.status(201).json(novoTopico);
    }
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
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para atualizar tópico");
      const { id } = req.params;
      const { nome, ativo } = req.body;
      
      const topico = topicosMock.topicos.find(t => t.id === parseInt(id));
      
      if (!topico) {
        return res.status(404).json({ error: "Tópico não encontrado" });
      }
      
      // Simular atualização
      const topicoAtualizado = {
        ...topico,
        ...(nome && { nome: nome.trim() }),
        ...(ativo !== undefined && { ativo })
      };
      
      return res.json(topicoAtualizado);
    }

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
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para deletar tópico");
      const { id } = req.params;
      
      const topico = topicosMock.topicos.find(t => t.id === parseInt(id));
      
      if (!topico) {
        return res.status(404).json({ error: "Tópico não encontrado" });
      }
      
      return res.json({ message: "Tópico desativado com sucesso (simulação)" });
    }
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