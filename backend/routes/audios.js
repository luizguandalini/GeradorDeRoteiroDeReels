import express from "express";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { getMockMode } from "../config/mockConfig.js";
import { audiosMock } from "../config/mockData.js";
import { execSync } from "child_process";
import { authenticateToken } from "../middleware/auth.js";
import prisma from "../config/database.js";

const router = express.Router();

// Aplicar middleware de autenticação
router.use(authenticateToken);

const pastaAudios = path.join(process.cwd(), "audios");

// Cache para evitar recálculos desnecessários
let audioCache = new Map();
let lastCacheUpdate = new Map();
const CACHE_DURATION = 2000; // 2 segundos

function getAudioInfo(userId) {
  const now = Date.now();
  
  // Verificar se o cache ainda é válido para este usuário
  if (audioCache.has(userId) && (now - (lastCacheUpdate.get(userId) || 0)) < CACHE_DURATION) {
    return audioCache.get(userId);
  }

  const pastaUsuario = path.join(pastaAudios, `user_${userId}`);
  
  if (!fs.existsSync(pastaUsuario)) {
    const result = { audios: [] };
    audioCache.set(userId, result);
    lastCacheUpdate.set(userId, now);
    return result;
  }

  const files = fs
    .readdirSync(pastaUsuario)
    .filter(
      (f) => f.endsWith(".mp3") && f !== "silence.mp3"
    );
  
  // Ordenar os arquivos numericamente
  files.sort((a, b) => {
    // Caso especial para o arquivo "final.mp3"
    if (a.includes("final_")) return 1; // Coloca arquivos "final_" por último
    if (b.includes("final_")) return -1;
    
    // Extrai números dos nomes dos arquivos para ordenação numérica
    const numA = parseInt(a.match(/\d+/)?.[0] || "0");
    const numB = parseInt(b.match(/\d+/)?.[0] || "0");
    return numA - numB;
  });
  
  // Adicionar informações de duração para cada arquivo
  const audiosInfo = files.map(file => {
    try {
      const filePath = path.join(pastaUsuario, file);
      const fileStats = fs.statSync(filePath);
      const fileSizeKB = Math.round(fileStats.size / 1024);
      
      // Tentar obter a duração usando ffprobe se disponível
      let duracao = "";
      try {
        // Comando para obter a duração em segundos
        const output = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`).toString().trim();
        const seconds = parseFloat(output);
        // Subtraindo 1 segundo para corresponder ao tempo do VLC
        const adjustedSeconds = Math.max(0, seconds - 1);
        duracao = adjustedSeconds < 60 ? `${Math.round(adjustedSeconds)}s` : `${Math.floor(adjustedSeconds/60)}m${Math.round(adjustedSeconds%60)}s`;
      } catch (e) {
        console.log("Não foi possível obter a duração do áudio:", e.message);
      }
      
      return {
        nome: file,
        caminho: `/audios/user_${userId}/${file}`,
        tamanho: `${fileSizeKB} KB`,
        duracao: duracao
      };
    } catch (e) {
      console.error(`Erro ao processar arquivo ${file}:`, e);
      return file; // Fallback para o comportamento original
    }
  });

  const result = { audios: audiosInfo };
  audioCache.set(userId, result);
  lastCacheUpdate.set(userId, now);
  return result;
}

// Função para invalidar o cache quando há mudanças
function invalidateCache(userId) {
  if (userId) {
    audioCache.delete(userId);
    lastCacheUpdate.delete(userId);
  } else {
    audioCache.clear();
    lastCacheUpdate.clear();
  }
}

router.get("/", (req, res) => {
  try {
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para áudios");
      return res.json(audiosMock);
    }

    // Forçar atualização se solicitado
    if (req.query.force === 'true') {
      invalidateCache(req.user.id);
    }

    const result = getAudioInfo(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/", (req, res) => {
  try {
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para deleção de áudios");
      // Invalidar cache mesmo no modo mock
      invalidateCache(req.user.id);
      return res.json({
        mensagem: "Simulação: Todos os áudios foram deletados",
      });
    }

    const pastaUsuario = path.join(pastaAudios, `user_${req.user.id}`);

    if (!fs.existsSync(pastaUsuario)) {
      return res.json({ mensagem: "Nenhum áudio para deletar" });
    }

    const files = fs.readdirSync(pastaUsuario);
    files.forEach((f) => {
      if (f !== "silence.mp3") {
        fs.unlinkSync(path.join(pastaUsuario, f));
      }
    });

    // Invalidar cache após deleção
    invalidateCache(req.user.id);

    res.json({
      mensagem: "Todos os áudios foram deletados (exceto silence.mp3)",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/download", (req, res) => {
  try {
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para download de áudios");
      return res.status(404).json({
        error: "Download não disponível no modo mock",
      });
    }

    const pastaUsuario = path.join(pastaAudios, `user_${req.user.id}`);

    if (!fs.existsSync(pastaUsuario)) {
      return res.status(404).json({ error: "Nenhum áudio encontrado" });
    }

    const files = fs.readdirSync(pastaUsuario);
    const audioFiles = files.filter((f) => f.endsWith(".mp3"));

    if (audioFiles.length === 0) {
      return res.status(404).json({ error: "Nenhum áudio encontrado" });
    }

    const zip = new AdmZip();

    audioFiles.forEach((file) => {
      const filePath = path.join(pastaUsuario, file);
      zip.addLocalFile(filePath);
    });

    const zipBuffer = zip.toBuffer();

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=audios.zip",
      "Content-Length": zipBuffer.length,
    });

    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
