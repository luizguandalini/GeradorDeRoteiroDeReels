import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Carrega variáveis do .env para fallback
dotenv.config();

const prisma = new PrismaClient();

// Cache das configurações para evitar consultas desnecessárias
let configCache = new Map();
let cacheExpiry = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Busca uma configuração específica do banco de dados
 * @param {string} chave - A chave da configuração
 * @param {number} userId - ID do usuário (opcional, para configurações globais use null)
 * @param {string} fallbackEnvKey - Chave do .env para fallback (opcional)
 * @returns {Promise<string|null>} O valor da configuração
 */
export async function getConfig(chave, userId = null, fallbackEnvKey = null) {
  try {
    const cacheKey = userId ? `${userId}:${chave}` : chave;
    
    // Verifica se o cache ainda é válido
    if (cacheExpiry && Date.now() < cacheExpiry && configCache.has(cacheKey)) {
      return configCache.get(cacheKey);
    }

    let config = null;
    
    // Se userId for fornecido, busca configuração específica do usuário
    if (userId) {
      config = await prisma.userConfiguracao.findFirst({
        where: {
          chave: chave,
          userId: userId,
          ativo: true
        }
      });
    }
    
    // Se não encontrou configuração do usuário ou userId não foi fornecido, busca configuração global
    if (!config) {
      config = await prisma.configuracao.findFirst({
        where: {
          chave: chave,
          ativo: true
        }
      });
    }

    let valor = null;
    
    if (config && config.valor) {
      valor = config.valor;
    } else if (fallbackEnvKey && process.env[fallbackEnvKey]) {
      // Fallback para .env se não encontrar no banco
      valor = process.env[fallbackEnvKey];
      console.warn(`Configuração '${chave}' não encontrada no banco, usando fallback do .env: ${fallbackEnvKey}`);
    } else if (process.env[chave]) {
      // Tenta usar a própria chave como variável de ambiente
      valor = process.env[chave];
      console.warn(`Configuração '${chave}' não encontrada no banco, usando fallback do .env com a mesma chave`);
    }

    // Atualiza o cache
    if (valor !== null) {
      configCache.set(cacheKey, valor);
      cacheExpiry = Date.now() + CACHE_DURATION;
    }

    return valor;
  } catch (error) {
    console.error(`Erro ao buscar configuração '${chave}':`, error);
    
    // Em caso de erro, tenta o fallback
    if (fallbackEnvKey && process.env[fallbackEnvKey]) {
      return process.env[fallbackEnvKey];
    } else if (process.env[chave]) {
      return process.env[chave];
    }
    
    return null;
  }
}

/**
 * Busca múltiplas configurações de uma vez
 * @param {Array<{chave: string, fallbackEnvKey?: string}>} configs - Array de configurações para buscar
 * @returns {Promise<Object>} Objeto com as configurações
 */
export async function getConfigs(configs) {
  const result = {};
  
  for (const config of configs) {
    const valor = await getConfig(config.chave, config.fallbackEnvKey);
    result[config.chave] = valor;
  }
  
  return result;
}

/**
 * Limpa o cache de configurações
 */
export function clearConfigCache() {
  configCache.clear();
  cacheExpiry = null;
}

/**
 * Inicializa as configurações padrão no banco se não existirem
 */
export async function initializeDefaultConfigs() {
  try {
    const defaultConfigs = [
      {
        chave: 'OPENROUTER_API_KEY',
        valor: process.env.OPENROUTER_API_KEY || '',
        nome: 'Chave API OpenRouter',
        descricao: 'Chave de API para acessar os serviços do OpenRouter',
        categoria: 'api'
      },
      {
        chave: 'MODEL_NAME',
        valor: process.env.MODEL_NAME || 'anthropic/claude-3.5-sonnet',
        nome: 'Nome do Modelo IA',
        descricao: 'Nome do modelo de IA a ser usado para geração de conteúdo',
        categoria: 'ia'
      },
      {
        chave: 'PROMPT_TEMAS',
        valor: process.env.PROMPT_TEMAS || 'Gere 5 temas interessantes sobre o tópico fornecido.',
        nome: 'Prompt para Temas',
        descricao: 'Prompt usado para gerar temas baseados em um tópico',
        categoria: 'prompts'
      },
      {
        chave: 'PROMPT_ROTEIRO',
        valor: process.env.PROMPT_ROTEIRO || 'Crie um roteiro detalhado para o tema fornecido.',
        nome: 'Prompt para Roteiro',
        descricao: 'Prompt usado para gerar roteiros baseados em um tema',
        categoria: 'prompts'
      },
      {
        chave: 'PROMPT_TEMAS_EN',
        valor: process.env.PROMPT_TEMAS_EN || 'Generate 5 engaging topics about the provided subject.',
        nome: 'Prompt for Topics (English)',
        descricao: 'Prompt used to generate topics in English based on a subject',
        categoria: 'prompts'
      },
      {
        chave: 'PROMPT_ROTEIRO_EN',
        valor: process.env.PROMPT_ROTEIRO_EN || 'Create a detailed script in English for the provided theme. Duration: {duracao} seconds. Theme: {tema}. Return an array under the "roteiro" key with narration and imagery suggestions.',
        nome: 'Prompt for Script (English)',
        descricao: 'Prompt used to generate scripts in English based on a theme',
        categoria: 'prompts'
      },
      {
        chave: 'ELEVEN_API_KEY',
        valor: process.env.ELEVEN_API_KEY || '',
        nome: 'Chave API ElevenLabs',
        descricao: 'Chave de API para acessar os serviços de síntese de voz do ElevenLabs',
        categoria: 'api'
      },
      {
        chave: 'VOICE_ID',
        valor: process.env.VOICE_ID || '',
        nome: 'ID da Voz',
        descricao: 'Identificador da voz a ser usada na síntese de áudio',
        categoria: 'audio'
      },
      {
        chave: 'ELEVEN_MODEL_ID',
        valor: process.env.ELEVEN_MODEL_ID || 'eleven_multilingual_v2',
        nome: 'ID do Modelo ElevenLabs',
        descricao: 'Identificador do modelo de síntese de voz do ElevenLabs',
        categoria: 'audio'
      }
    ];

    // Primeiro, cria as configurações globais se não existirem
    for (const config of defaultConfigs) {
      const existing = await prisma.configuracao.findFirst({
        where: { chave: config.chave }
      });

      if (!existing) {
        await prisma.configuracao.create({
          data: config
        });
        console.log(`Configuração global criada: ${config.chave}`);
      }
    }

    // Depois, cria configurações específicas para todos os usuários existentes
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    for (const user of users) {
      for (const config of defaultConfigs) {
        const existingUserConfig = await prisma.userConfiguracao.findFirst({
          where: { 
            chave: config.chave,
            userId: user.id
          }
        });

        if (!existingUserConfig) {
          await prisma.userConfiguracao.create({
            data: {
              ...config,
              userId: user.id
            }
          });
          console.log(`Configuração do usuário ${user.id} criada: ${config.chave}`);
        }
      }
    }

    console.log('Inicialização das configurações padrão concluída');
  } catch (error) {
    console.error('Erro ao inicializar configurações padrão:', error);
  }
}

export default {
  getConfig,
  getConfigs,
  clearConfigCache,
  initializeDefaultConfigs
};






