import express from "express";
import fs from "fs";
import path from "path";
import archiver from "archiver";

const router = express.Router();
const pastaAudios = path.join(process.cwd(), "audios");

router.get("/", (req, res) => {
  try {
    if (!fs.existsSync(pastaAudios)) return res.json({ audios: [] });

    const files = fs
      .readdirSync(pastaAudios)
      .filter(
        (f) => f.endsWith(".mp3") && f !== "silence.mp3" && f !== "final.mp3"
      );

    res.json({ audios: files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/", (req, res) => {
  try {
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
