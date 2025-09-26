import express from "express";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import { getMockMode } from "../config/mockConfig.js";
import { audiosMock } from "../config/mockData.js";
import { execSync } from "child_process";

const router = express.Router();
const pastaAudios = path.join(process.cwd(), "audios");

router.get("/", (req, res) => {
  try {
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para áudios");
      return res.json(audiosMock);
    }

    if (!fs.existsSync(pastaAudios)) return res.json({ audios: [] });

    const files = fs
      .readdirSync(pastaAudios)
      .filter(
        (f) => f.endsWith(".mp3") && f !== "silence.mp3"
      );
    
    // Ordenar os arquivos numericamente
    files.sort((a, b) => {
      // Caso especial para o arquivo "final.mp3"
      if (a === "final.mp3") return 1; // Coloca "final.mp3" por último
      if (b === "final.mp3") return -1;
      
      // Extrai números dos nomes dos arquivos para ordenação numérica
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });
    
    // Adicionar informações de duração para cada arquivo
    const audiosInfo = files.map(file => {
      try {
        const filePath = path.join(pastaAudios, file);
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
          caminho: `/audios/${file}`,
          tamanho: `${fileSizeKB} KB`,
          duracao: duracao
        };
      } catch (e) {
        console.error(`Erro ao processar arquivo ${file}:`, e);
        return file; // Fallback para o comportamento original
      }
    });

    res.json({ audios: audiosInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/", (req, res) => {
  try {
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para deleção de áudios");
      return res.json({
        mensagem: "Simulação: Todos os áudios foram deletados",
      });
    }

    if (!fs.existsSync(pastaAudios))
      return res.json({ mensagem: "Nenhum áudio para deletar" });

    const files = fs.readdirSync(pastaAudios);
    files.forEach((f) => {
      if (f !== "silence.mp3") {
        fs.unlinkSync(path.join(pastaAudios, f));
      }
    });

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
      
      // Criar um arquivo zip simulado
      const zipName = "audios_mock.zip";
      res.attachment(zipName);
      
      // Criar um arquivo zip vazio para simular o download
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(res);
      
      // Adicionar um arquivo de texto explicativo
      archive.append('Este é um arquivo ZIP simulado no modo mock.\nEm um ambiente real, este arquivo conteria os áudios gerados.', 
                    { name: 'README_MOCK_MODE.txt' });
      
      archive.finalize();
      return;
    }

    const zipName = "audios.zip";
    res.attachment(zipName);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    const files = fs
      .readdirSync(pastaAudios)
      .filter((f) => f !== "silence.mp3");
    files.forEach((f) => {
      archive.file(path.join(pastaAudios, f), { name: f });
    });

    archive.finalize();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
