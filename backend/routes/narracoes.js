import express from "express";
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import "dotenv/config";
import { getMockMode } from "../config/mockConfig.js";
import { narracoesMock } from "../config/mockData.js";
import { getConfig } from "../config/configManager.js";
import { authenticateToken } from "../middleware/auth.js";
import prisma from "../config/database.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Aplicar middleware de autenticação
router.use(authenticateToken);

const pastaSaida = path.join(__dirname, "../audios");

if (!fs.existsSync(pastaSaida)) {
  fs.mkdirSync(pastaSaida);
  console.log("📁 Pasta 'audios' criada automaticamente.");
}

// Função para criar pasta única do usuário
function criarPastaUsuario(userId) {
  const pastaUsuario = path.join(pastaSaida, `user_${userId}`);
  if (!fs.existsSync(pastaUsuario)) {
    fs.mkdirSync(pastaUsuario, { recursive: true });
    console.log(`📁 Pasta do usuário ${userId} criada: ${pastaUsuario}`);
  }
  return pastaUsuario;
}

function gerarSilencio() {
  const silencePath = path.join(pastaSaida, "silence.mp3");
  if (fs.existsSync(silencePath)) return silencePath;

  const silenceBase64 =
    "SUQzAwAAAAAAQ1RTU0ZMT0FUIElOUE9TVAAACAAAAAEAAABJbmZvAAAASAAAACAAAAA...";

  fs.writeFileSync(silencePath, Buffer.from(silenceBase64, "base64"));
  console.log("🔇 Arquivo silence.mp3 criado.");
  return silencePath;
}

async function gerarAudio(texto, nomeArquivo, voiceId, modelId, apiKey, pastaDestino) {
  const URL = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  
  const response = await axios.post(
    URL,
    {
      text: texto,
      model_id: modelId,
      voice_settings: {
        stability: 0.3,
        similarity_boost: 0.85,
        use_speaker_boost: true,
      },
      voice_speed: 0.9,
    },
    {
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      responseType: "arraybuffer",
    }
  );

  const outputPath = path.join(pastaDestino, nomeArquivo);
  fs.writeFileSync(outputPath, Buffer.from(response.data));
  return outputPath;
}

// GET - Listar narrações do usuário
router.get("/", async (req, res) => {
  try {
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para listar narrações");
      return res.json(narracoesMock);
    }

    const narracoes = await prisma.userNarracao.findMany({
      where: {
        userId: req.user.id,
        ativo: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(narracoes);
  } catch (error) {
    console.error("❌ Erro ao listar narrações:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST - Criar nova narração
router.post("/", async (req, res) => {
  try {
    // Verificar se está no modo mock
    if (getMockMode()) {
      console.log("🔶 Usando dados mock para narrações");
      return res.json(narracoesMock);
    }
    
    const { narracoes, titulo } = req.body;
    console.log("📩 Requisição recebida:", narracoes);

    if (!narracoes) {
      return res.status(400).json({ error: "Campo 'narracoes' é obrigatório" });
    }

    // Criar pasta única para o usuário
    const pastaUsuario = criarPastaUsuario(req.user.id);

    // Deletar áudios existentes antes de gerar novos
    if (fs.existsSync(pastaUsuario)) {
      const files = fs.readdirSync(pastaUsuario);
      files.forEach((file) => {
        if (file.endsWith('.mp3') && file !== 'silence.mp3') {
          fs.unlinkSync(path.join(pastaUsuario, file));
        }
      });
      console.log("🗑️ Áudios existentes deletados");
    }

    // Marcar narrações antigas como inativas no banco
    await prisma.userNarracao.updateMany({
      where: {
        userId: req.user.id,
        ativo: true
      },
      data: { ativo: false }
    });

    // Buscar configurações do usuário
    const userConfigs = await prisma.userConfiguracao.findMany({
      where: {
        userId: req.user.id,
        chave: {
          in: ['ELEVEN_API_KEY', 'VOICE_ID', 'ELEVEN_MODEL_ID']
        }
      }
    });

    const configMap = {};
    userConfigs.forEach(config => {
      configMap[config.chave] = config.valor;
    });

    const elevenApiKey = configMap['ELEVEN_API_KEY'] || await getConfig('ELEVEN_API_KEY', req.user.id, 'ELEVEN_API_KEY');
    const voiceId = configMap['VOICE_ID'] || await getConfig('VOICE_ID', req.user.id, 'VOICE_ID');
    const elevenModelId = configMap['ELEVEN_MODEL_ID'] || await getConfig('ELEVEN_MODEL_ID', req.user.id, 'ELEVEN_MODEL_ID');

    if (!elevenApiKey || !voiceId || !elevenModelId) {
      return res.status(500).json({ 
        error: "Configurações do ElevenLabs não encontradas. Verifique ELEVEN_API_KEY, VOICE_ID e ELEVEN_MODEL_ID." 
      });
    }

    const arquivosGerados = [];
    const buffers = [];
    const timestamp = Date.now();

    for (const [nome, texto] of Object.entries(narracoes)) {
      const nomeArquivo = `${nome.replace(/\s+/g, "_")}_${timestamp}.mp3`;
      console.log(`🎙️ Gerando: ${nomeArquivo}`);
      const caminho = await gerarAudio(texto, nomeArquivo, voiceId, elevenModelId, elevenApiKey, pastaUsuario);

      const buffer = fs.readFileSync(caminho);
      buffers.push(buffer);
      arquivosGerados.push(caminho);

      if (Object.keys(narracoes).pop() !== nome) {
        const silencePath = gerarSilencio();
        buffers.push(fs.readFileSync(silencePath));
      }
    }

    const audioFinal = path.join(pastaUsuario, `final_${timestamp}.mp3`);
    fs.writeFileSync(audioFinal, Buffer.concat(buffers));

    // Deletar arquivos temporários (manter apenas o final)
    arquivosGerados.forEach((arquivo) => {
      if (fs.existsSync(arquivo)) {
        fs.unlinkSync(arquivo);
        console.log(`🗑️ Arquivo temporário deletado: ${path.basename(arquivo)}`);
      }
    });

    // Salvar informações da narração no banco
    const narracao = await prisma.userNarracao.create({
      data: {
        nome: titulo || `Narração ${new Date().toLocaleString()}`,
        texto: typeof narracoes === 'object' ? JSON.stringify(narracoes) : String(narracoes),
        audioPath: path.relative(pastaSaida, audioFinal),
        userId: req.user.id
      }
    });

    console.log("✅ Áudio final gerado:", audioFinal);
    console.log("💾 Narração salva no banco:", narracao.id);

    res.json({
      id: narracao.id,
      mensagem: "Áudios gerados com sucesso!",
      final: path.basename(audioFinal),
      audioPath: narracao.audioPath
    });
  } catch (error) {
    console.error("❌ Erro na rota /narracoes:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Soft delete de narração
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const narracao = await prisma.userNarracao.update({
      where: {
        id: parseInt(id),
        userId: req.user.id
      },
      data: { ativo: false }
    });

    res.json({ message: "Narração removida com sucesso" });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Narração não encontrada" });
    }
    console.error("❌ Erro ao remover narração:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
