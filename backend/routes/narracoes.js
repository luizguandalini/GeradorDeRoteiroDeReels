import express from "express";
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import "dotenv/config";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_ID = process.env.VOICE_ID;
const MODEL_ID = process.env.ELEVEN_MODEL_ID;

const URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

const pastaSaida = path.join(__dirname, "../audios");

if (!fs.existsSync(pastaSaida)) {
  fs.mkdirSync(pastaSaida);
  console.log("📁 Pasta 'audios' criada automaticamente.");
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

async function gerarAudio(texto, nomeArquivo) {
  const response = await axios.post(
    URL,
    {
      text: texto,
      model_id: MODEL_ID,
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
        "xi-api-key": API_KEY,
      },
      responseType: "arraybuffer",
    }
  );

  const outputPath = path.join(pastaSaida, nomeArquivo);
  fs.writeFileSync(outputPath, Buffer.from(response.data));
  return outputPath;
}

router.post("/", async (req, res) => {
  try {
    const { narracoes } = req.body;
    console.log("📩 Requisição recebida:", narracoes);

    if (!narracoes) {
      return res.status(400).json({ error: "Campo 'narracoes' é obrigatório" });
    }

    const arquivosGerados = [];
    const buffers = [];

    for (const [nome, texto] of Object.entries(narracoes)) {
      const nomeArquivo = `${nome.replace(/\s+/g, "_")}.mp3`;
      console.log(`🎙️ Gerando: ${nomeArquivo}`);
      const caminho = await gerarAudio(texto, nomeArquivo);

      const buffer = fs.readFileSync(caminho);
      buffers.push(buffer);
      arquivosGerados.push(caminho);

      if (Object.keys(narracoes).pop() !== nome) {
        const silencePath = gerarSilencio();
        buffers.push(fs.readFileSync(silencePath));
      }
    }

    const audioFinal = path.join(pastaSaida, "final.mp3");
    fs.writeFileSync(audioFinal, Buffer.concat(buffers));

    console.log("✅ Áudio final gerado:", audioFinal);

    res.json({
      mensagem: "Áudios gerados com sucesso!",
      arquivos: arquivosGerados.map((f) => path.basename(f)),
      final: path.basename(audioFinal),
    });
  } catch (error) {
    console.error("❌ Erro na rota /narracoes:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
