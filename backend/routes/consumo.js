import express from "express";
import axios from "axios";
import { getConfig } from "../config/configManager.js";

const router = express.Router();

/**
 * Formata valores monetários para exibição mais legível
 * @param {number} value - Valor em USD
 * @returns {object} Objeto com valor formatado e valor original
 */
function formatCurrency(value) {
  const numValue = parseFloat(value) || 0;
  
  // Valor legível (dólares e centavos)
  const dollars = Math.floor(numValue);
  const cents = Math.round((numValue - dollars) * 100);
  const readable = `$${dollars}.${cents.toString().padStart(2, '0')}`;
  
  // Valor completo original
  const complete = `$${numValue.toFixed(6)}`;
  
  return {
    readable,
    complete,
    raw: numValue
  };
}

/**
 * Consulta saldo e uso da OpenRouter
 */
async function consultarOpenRouterSaldo() {
  try {
    const apiKey = await getConfig('OPENROUTER_API_KEY', 'OPENROUTER_API_KEY');
    
    if (!apiKey) {
      return {
        error: "OPENROUTER_API_KEY não configurada",
        service: "OpenRouter"
      };
    }

    const url = "https://openrouter.ai/api/v1/key";
    const headers = { "Authorization": `Bearer ${apiKey}` };
    
    const response = await axios.get(url, { headers });
    
    if (response.status !== 200) {
      return {
        error: `Erro ao consultar OpenRouter: ${response.status}`,
        service: "OpenRouter"
      };
    }

    const data = response.data.data || {};
    
    return {
      service: "OpenRouter",
      usage: formatCurrency(data.usage || 0),
      limit: data.limit ? formatCurrency(data.limit) : null,
      limitRemaining: data.limit_remaining ? formatCurrency(data.limit_remaining) : null,
      hasLimit: data.limit !== null && data.limit !== undefined,
      success: true
    };
    
  } catch (error) {
    console.error("Erro ao consultar OpenRouter:", error.message);
    return {
      error: `Erro ao consultar OpenRouter: ${error.message}`,
      service: "OpenRouter"
    };
  }
}

/**
 * Consulta saldo e uso da ElevenLabs
 */
async function consultarElevenLabsSaldo() {
  try {
    const apiKey = await getConfig('ELEVEN_API_KEY', 'ELEVEN_API_KEY');
    
    if (!apiKey) {
      return {
        error: "ELEVEN_API_KEY não configurada",
        service: "ElevenLabs"
      };
    }

    const url = "https://api.elevenlabs.io/v1/user/subscription";
    const headers = { "xi-api-key": apiKey };
    
    const response = await axios.get(url, { headers });
    
    if (response.status !== 200) {
      return {
        error: `Erro ao consultar ElevenLabs: ${response.status}`,
        service: "ElevenLabs"
      };
    }

    const data = response.data;
    const characterLimit = data.character_limit || 0;
    const characterCount = data.character_count || 0;
    const remaining = Math.max(0, characterLimit - characterCount);
    
    return {
      service: "ElevenLabs",
      tier: data.tier || "Desconhecido",
      characterLimit: characterLimit.toLocaleString(),
      characterCount: characterCount.toLocaleString(),
      characterRemaining: remaining.toLocaleString(),
      success: true
    };
    
  } catch (error) {
    console.error("Erro ao consultar ElevenLabs:", error.message);
    return {
      error: `Erro ao consultar ElevenLabs: ${error.message}`,
      service: "ElevenLabs"
    };
  }
}

/**
 * GET /api/consumo
 * Retorna informações de consumo dos serviços OpenRouter e ElevenLabs
 */
router.get("/", async (req, res) => {
  try {
    // Executa as consultas em paralelo para melhor performance
    const [openRouterData, elevenLabsData] = await Promise.all([
      consultarOpenRouterSaldo(),
      consultarElevenLabsSaldo()
    ]);

    res.json({
      success: true,
      data: {
        openRouter: openRouterData,
        elevenLabs: elevenLabsData
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Erro ao consultar consumo dos serviços:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao consultar consumo dos serviços",
      timestamp: new Date().toISOString()
    });
  }
});

export default router;