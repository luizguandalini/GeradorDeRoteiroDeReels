import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Configurações padrão com valores fake
const configuracoesDefault = [
  {
    chave: 'OPENROUTER_API_KEY',
    nome: 'Chave API OpenRouter',
    descricao: 'Chave de autenticação para acessar a API da OpenRouter',
    categoria: 'API',
    valorDefault: 'sk-or-v1-SUBSTITUA_PELA_SUA_CHAVE_REAL'
  },
  {
    chave: 'MODEL_NAME',
    nome: 'Nome do Modelo IA',
    descricao: 'Modelo de IA a ser usado na OpenRouter para geração de conteúdo',
    categoria: 'IA',
    valorDefault: 'openai/gpt-4-mini-SUBSTITUA_PELO_MODELO_REAL'
  },
  {
    chave: 'PROMPT_TEMAS',
    nome: 'Prompt para Temas',
    descricao: 'Template de prompt usado para sugerir temas baseados em tópicos',
    categoria: 'Prompts',
    valorDefault: 'SUBSTITUA_PELO_SEU_PROMPT_DE_TEMAS'
  },
  {
    chave: 'PROMPT_ROTEIRO',
    nome: 'Prompt para Roteiro',
    descricao: 'Template de prompt usado para criar roteiros de Reels',
    categoria: 'Prompts',
    valorDefault: 'SUBSTITUA_PELO_SEU_PROMPT_DE_ROTEIRO'
  },
  {
    chave: 'ELEVEN_API_KEY',
    nome: 'Chave API ElevenLabs',
    descricao: 'Chave de autenticação para acessar a API da ElevenLabs',
    categoria: 'API',
    valorDefault: 'sk_SUBSTITUA_PELA_SUA_CHAVE_ELEVENLABS'
  },
  {
    chave: 'VOICE_ID',
    nome: 'ID da Voz',
    descricao: 'Identificador da voz a ser usada na ElevenLabs para síntese de fala',
    categoria: 'Audio',
    valorDefault: 'SUBSTITUA_PELO_ID_DA_VOZ'
  },
  {
    chave: 'ELEVEN_MODEL_ID',
    nome: 'Modelo ElevenLabs',
    descricao: 'Modelo de IA da ElevenLabs usado para síntese de voz',
    categoria: 'Audio',
    valorDefault: 'eleven_flash_v2_5_SUBSTITUA_PELO_MODELO'
  }
];

// Função para inicializar configurações padrão
async function inicializarConfiguracoesPadrao() {
  for (const config of configuracoesDefault) {
    try {
      // Verifica se a configuração já existe
      const existente = await prisma.configuracao.findUnique({
        where: { chave: config.chave }
      });

      if (!existente) {
        // Cria a configuração
        const configuracao = await prisma.configuracao.create({
          data: {
            chave: config.chave,
            nome: config.nome,
            descricao: config.descricao,
            categoria: config.categoria
          }
        });

        // Cria o valor padrão
        await prisma.configuracaoValor.create({
          data: {
            valor: config.valorDefault,
            ativo: true,
            configuracaoId: configuracao.id
          }
        });
      }
    } catch (error) {
      console.error(`Erro ao inicializar configuração ${config.chave}:`, error);
    }
  }
}

// Inicializar configurações na primeira execução
inicializarConfiguracoesPadrao();

// GET - Listar todas as configurações com seus valores
router.get('/', async (req, res) => {
  try {
    const configuracoes = await prisma.configuracao.findMany({
      where: { ativo: true },
      include: {
        valores: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { categoria: 'asc' }
    });
    res.json(configuracoes);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET - Buscar configuração por chave com valores
router.get('/:chave', async (req, res) => {
  try {
    const { chave } = req.params;
    const configuracao = await prisma.configuracao.findUnique({
      where: { chave },
      include: {
        valores: {
          orderBy: { createdAt: 'desc' }
        }
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

// GET - Obter valor ativo de uma configuração
router.get('/:chave/valor-ativo', async (req, res) => {
  try {
    const { chave } = req.params;
    const configuracao = await prisma.configuracao.findUnique({
      where: { chave },
      include: {
        valores: {
          where: { ativo: true }
        }
      }
    });
    
    if (!configuracao) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    const valorAtivo = configuracao.valores[0];
    if (!valorAtivo) {
      return res.status(404).json({ error: 'Nenhum valor ativo encontrado' });
    }
    
    res.json({ valor: valorAtivo.valor });
  } catch (error) {
    console.error('Erro ao buscar valor ativo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Adicionar novo valor para uma configuração
router.post('/:chave/valores', async (req, res) => {
  try {
    const { chave } = req.params;
    const { valor, ativar = false } = req.body;
    
    if (!valor) {
      return res.status(400).json({ error: 'Valor é obrigatório' });
    }

    const configuracao = await prisma.configuracao.findUnique({
      where: { chave }
    });

    if (!configuracao) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    // Se ativar for true, desativa todos os outros valores
    if (ativar) {
      await prisma.configuracaoValor.updateMany({
        where: { configuracaoId: configuracao.id },
        data: { ativo: false }
      });
    }

    const novoValor = await prisma.configuracaoValor.create({
      data: {
        valor,
        ativo: ativar,
        configuracaoId: configuracao.id
      }
    });
    
    res.status(201).json(novoValor);
  } catch (error) {
    console.error('Erro ao adicionar valor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT - Ativar um valor específico
router.put('/valores/:valorId/ativar', async (req, res) => {
  try {
    const { valorId } = req.params;
    
    const valor = await prisma.configuracaoValor.findUnique({
      where: { id: parseInt(valorId) },
      include: { configuracao: true }
    });

    if (!valor) {
      return res.status(404).json({ error: 'Valor não encontrado' });
    }

    // Desativa todos os valores da configuração
    await prisma.configuracaoValor.updateMany({
      where: { configuracaoId: valor.configuracaoId },
      data: { ativo: false }
    });

    // Ativa o valor selecionado
    const valorAtivado = await prisma.configuracaoValor.update({
      where: { id: parseInt(valorId) },
      data: { ativo: true }
    });
    
    res.json(valorAtivado);
  } catch (error) {
    console.error('Erro ao ativar valor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT - Atualizar configuração (apenas metadados)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, categoria, ativo } = req.body;
    
    const configuracao = await prisma.configuracao.update({
      where: { id: parseInt(id) },
      data: {
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
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Remover um valor específico
router.delete('/valores/:valorId', async (req, res) => {
  try {
    const { valorId } = req.params;
    
    const valor = await prisma.configuracaoValor.findUnique({
      where: { id: parseInt(valorId) }
    });

    if (!valor) {
      return res.status(404).json({ error: 'Valor não encontrado' });
    }

    await prisma.configuracaoValor.delete({
      where: { id: parseInt(valorId) }
    });
    
    res.json({ message: 'Valor removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover valor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Desativar configuração (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const configuracao = await prisma.configuracao.update({
      where: { id: parseInt(id) },
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

export default router;