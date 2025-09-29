import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticação a todas as rotas
router.use(authenticateToken);

// GET - Listar configurações do usuário
router.get('/', async (req, res) => {
  try {
    const configuracoes = await prisma.userConfiguracao.findMany({
      where: { 
        userId: req.user.id,
        ativo: true 
      },
      orderBy: { categoria: 'asc' }
    });
    res.json(configuracoes);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET - Buscar configuração do usuário por chave
router.get('/:chave', async (req, res) => {
  try {
    const { chave } = req.params;
    const configuracao = await prisma.userConfiguracao.findFirst({
      where: { 
        chave,
        userId: req.user.id
      }
    });
    
    if (!configuracao) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    
    res.json(configuracao);
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Criar nova configuração para o usuário
router.post('/', async (req, res) => {
  try {
    const { chave, valor, nome, descricao, categoria } = req.body;
    
    if (!chave || !valor || !nome || !descricao || !categoria) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    const configuracao = await prisma.userConfiguracao.create({
      data: {
        chave,
        valor,
        nome,
        descricao,
        categoria,
        userId: req.user.id
      }
    });
    
    res.status(201).json(configuracao);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Chave já existe para este usuário' });
    }
    console.error('Erro ao criar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT - Criar ou atualizar configuração por chave (upsert)
router.put('/duration-preference', async (req, res) => {
  try {
    const { chave, valor, nome, descricao, categoria } = req.body;
    
    // Verificar se a configuração já existe
    const existingConfig = await prisma.userConfiguracao.findFirst({
      where: { 
        chave,
        userId: req.user.id
      }
    });
    
    let configuracao;
    
    if (existingConfig) {
      // Atualizar configuração existente
      configuracao = await prisma.userConfiguracao.update({
        where: { 
          id: existingConfig.id
        },
        data: {
          valor,
          ...(nome && { nome }),
          ...(descricao && { descricao }),
          ...(categoria && { categoria })
        }
      });
    } else {
      // Criar nova configuração
      configuracao = await prisma.userConfiguracao.create({
        data: {
          chave,
          valor,
          nome: nome || 'Configuração',
          descricao: descricao || '',
          categoria: categoria || 'geral',
          userId: req.user.id,
          ativo: true
        }
      });
    }
    
    res.json(configuracao);
  } catch (error) {
    console.error('Erro ao salvar configuração de duração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT - Atualizar configuração do usuário por ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { chave, valor, nome, descricao, categoria, ativo } = req.body;
    
    const configuracao = await prisma.userConfiguracao.update({
      where: { 
        id: parseInt(id),
        userId: req.user.id
      },
      data: {
        ...(chave && { chave }),
        ...(valor && { valor }),
        ...(nome && { nome }),
        ...(descricao && { descricao }),
        ...(categoria && { categoria }),
        ...(ativo !== undefined && { ativo })
      }
    });
    
    res.json(configuracao);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Chave já existe para este usuário' });
    }
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Desativar configuração do usuário (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const configuracao = await prisma.userConfiguracao.update({
      where: { 
        id: parseInt(id),
        userId: req.user.id
      },
      data: { ativo: false }
    });
    
    res.json({ message: 'Configuração desativada com sucesso' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    console.error('Erro ao desativar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Inicializar configurações padrão do .env
router.post('/inicializar', async (req, res) => {
  try {
    const configuracoesDefault = [
      {
        chave: 'OPENROUTER_API_KEY',
        valor: process.env.OPENROUTER_API_KEY || '',
        nome: 'Chave API OpenRouter',
        descricao: 'Chave de autenticação para acessar a API da OpenRouter',
        categoria: 'API'
      },
      {
        chave: 'MODEL_NAME',
        valor: process.env.MODEL_NAME || '',
        nome: 'Nome do Modelo IA',
        descricao: 'Modelo de IA a ser usado na OpenRouter para geração de conteúdo',
        categoria: 'IA'
      },
      {
        chave: 'PROMPT_TEMAS',
        valor: process.env.PROMPT_TEMAS || '',
        nome: 'Prompt para Temas',
        descricao: 'Template de prompt usado para sugerir temas baseados em tópicos',
        categoria: 'Prompts'
      },
      {
        chave: 'PROMPT_ROTEIRO',
        valor: process.env.PROMPT_ROTEIRO || '',
        nome: 'Prompt para Roteiro',
        descricao: 'Template de prompt usado para criar roteiros de Reels',
        categoria: 'Prompts'
      },
      {
        chave: 'ELEVEN_API_KEY',
        valor: process.env.ELEVEN_API_KEY || '',
        nome: 'Chave API ElevenLabs',
        descricao: 'Chave de autenticação para acessar a API da ElevenLabs',
        categoria: 'API'
      },
      {
        chave: 'VOICE_ID',
        valor: process.env.VOICE_ID || '',
        nome: 'ID da Voz',
        descricao: 'Identificador da voz a ser usada na ElevenLabs para síntese de fala',
        categoria: 'Audio'
      },
      {
        chave: 'ELEVEN_MODEL_ID',
        valor: process.env.ELEVEN_MODEL_ID || '',
        nome: 'Modelo ElevenLabs',
        descricao: 'Modelo de IA da ElevenLabs usado para síntese de voz',
        categoria: 'Audio'
      }
    ];

    const configuracoesCriadas = [];
    
    for (const config of configuracoesDefault) {
      try {
        const configuracao = await prisma.configuracao.create({
          data: config
        });
        configuracoesCriadas.push(configuracao);
      } catch (error) {
        if (error.code === 'P2002') {
          // Configuração já existe, pula
          continue;
        }
        throw error;
      }
    }
    
    res.json({
      message: 'Configurações inicializadas com sucesso',
      configuracoes: configuracoesCriadas
    });
  } catch (error) {
    console.error('Erro ao inicializar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;