import { useState, useEffect, useRef } from "react";
import { FaFilePdf, FaPlay, FaCopy } from "react-icons/fa";
import axios from "axios";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import "./Roteiro.css";

function Roteiro({ roteiro, onNarracoesGeradas }) {
  const [texto, setTexto] = useState("");
  const editorRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(roteiro) && roteiro.length > 0) {
      const linhas = roteiro.flatMap((r, i) => {
        const out = [];
        if (r.narracao) out.push(`Narração ${i + 1}: ${r.narracao}`);
        if (r.imagem) out.push(`Imagem/Vídeo ${i + 1}: ${r.imagem}`);
        return out;
      });
      setTexto(linhas.join("\n"));
    }
  }, [roteiro]);

  const handleInput = () => {
    setTexto(editorRef.current.innerText);
  };

  const copiarRoteiro = () => {
    if (!texto.trim()) return;
    navigator.clipboard
      .writeText(texto)
      .then(() => {
        toast.success("Roteiro copiado para a área de transferência!");
      })
      .catch(() => {
        toast.error("Erro ao copiar o roteiro");
      });
  };

  const parseSteps = () => {
    const lines = texto
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const steps = [];
    let current = null;

    lines.forEach((line) => {
      const low = line.toLowerCase();
      if (low.startsWith("narração")) {
        const content = line.split(":").slice(1).join(":").trim();
        current = { nar: content, img: null };
        steps.push(current);
      } else if (low.startsWith("imagem") || low.startsWith("vídeo")) {
        const content = line.split(":").slice(1).join(":").trim();
        if (!current) {
          current = { nar: null, img: content };
          steps.push(current);
        } else {
          current.img = content;
        }
      }
    });
    return steps;
  };

  const gerarVoz = async () => {
    if (!texto.trim()) return;
    const steps = parseSteps();
    const narracoes = {};
    let idx = 1;
    steps.forEach((s) => {
      if (s.nar) narracoes[`Narracao ${idx++}`] = s.nar;
    });
    if (Object.keys(narracoes).length === 0) {
      toast.error("Nenhuma narração encontrada no roteiro.");
      return;
    }

    try {
      // Verificar se já existe uma narração ativa
      const response = await axios.get("/api/narracoes");
      const narracoesExistentes = response.data;
      
      if (narracoesExistentes && narracoesExistentes.length > 0) {
        // Mostrar alerta se já existe narração
        toast.info(
          <div>
            <p>⚠️ Você já possui uma narração existente.</p>
            <p>É recomendado baixar o áudio atual antes de gerar um novo, pois o áudio existente será deletado.</p>
            <div className="confirm-actions">
              <button
                className="btn-danger"
                onClick={async () => {
                  try {
                    await axios.post("/api/narracoes", { narracoes });
                    toast.dismiss();
                    toast.success("Voz gerada com sucesso! Verifique a aba de Narrações.");
                    if (onNarracoesGeradas) {
                      onNarracoesGeradas(true);
                    }
                  } catch {
                    toast.error("Erro ao gerar voz");
                  }
                }}
              >
                Continuar mesmo assim
              </button>
              <button className="btn-secondary" onClick={() => toast.dismiss()}>
                Cancelar
              </button>
            </div>
          </div>,
          { autoClose: false }
        );
      } else {
        // Gerar diretamente se não há narração existente
        await axios.post("/api/narracoes", { narracoes });
        toast.success("Voz gerada com sucesso! Verifique a aba de Narrações.");
        if (onNarracoesGeradas) {
          onNarracoesGeradas(true);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar/gerar narração:", error);
      toast.error("Erro ao gerar voz");
    }
  };

  const baixarPDF = () => {
    if (!texto.trim()) return;

    const steps = parseSteps();
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;
    const lineGap = 6;
    const blockGap = 14;
    let y = margin;

    const fontSize = 12;
    const lineHeight = fontSize * 1.5;

    const newPageIfNeeded = (needed) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    steps.forEach((step, i) => {
      newPageIfNeeded(32);
      doc.setFillColor(129, 52, 175);
      doc.circle(margin - 16, y + 6, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(String(i + 1), margin - 16, y + 10, { align: "center" });

      if (step.nar) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        doc.setTextColor(214, 40, 40);
        doc.text("Narração:", margin, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        const lines = doc.splitTextToSize(step.nar, usableWidth);
        newPageIfNeeded(lines.length * lineHeight + lineGap);
        y += lineHeight;
        lines.forEach((ln) => {
          doc.text(ln, margin, y);
          y += lineHeight;
        });
        y += lineGap;
      }

      if (step.img) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        doc.setTextColor(29, 126, 214);
        doc.text("Imagem/Vídeo:", margin, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        const lines = doc.splitTextToSize(step.img, usableWidth);
        newPageIfNeeded(lines.length * lineHeight + blockGap);
        y += lineHeight;
        lines.forEach((ln) => {
          doc.text(ln, margin, y);
          y += lineHeight;
        });
        y += blockGap;
      } else {
        y += blockGap;
      }

      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    });

    doc.save("roteiro.pdf");
  };

  const renderStyled = () => {
    const steps = parseSteps();
    if (steps.length === 0 && texto.trim()) {
      return texto.split("\n").map((l, i) => (
        <div key={i} className="default-text">
          {l}
        </div>
      ));
    }

    return steps.map((s, i) => (
      <div key={i} className="step">
        <div className="step-badge">{i + 1}</div>

        {s.nar && (
          <div className="step-row">
            <span className="label label-nar">Narração {i + 1}:</span>
            <span className="row-content">{s.nar}</span>
          </div>
        )}

        {s.img && (
          <div className="step-row">
            <span className="label label-img">Imagem/Vídeo {i + 1}:</span>
            <span className="row-content">{s.img}</span>
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      {/* LISTA (rolável) */}
      <div className="editor-container">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="roteiro-editor"
          onInput={handleInput}
        >
          {renderStyled()}
        </div>
      </div>

      {/* AÇÕES (fora do container) — não possui linha/borda */}
      {texto.trim() && (
        <div className="audio-actions-fixed">
          <button
            onClick={copiarRoteiro}
            style={{ background: "#e1306c", color: "#fff" }}
          >
            <FaCopy /> Copiar Roteiro
          </button>
          <button
            onClick={gerarVoz}
            style={{ background: "#e84118", color: "#fff" }}
          >
            <FaPlay /> Gerar Narrações
          </button>
          <button
            onClick={baixarPDF}
            style={{ background: "#8e44ad", color: "#fff" }}
          >
            <FaFilePdf /> Baixar Roteiro em PDF
          </button>
        </div>
      )}
    </>
  );
}

export default Roteiro;
