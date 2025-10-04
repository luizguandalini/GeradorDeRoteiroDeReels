import { useState, useEffect, useRef } from "react";
import {
  FaFilePdf,
  FaPlay,
  FaCopy,
  FaEdit,
  FaSave,
  FaTimes,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import axios from "axios";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import "./Roteiro.css";

function Roteiro({
  roteiro,
  onSaveRoteiro,
  onNarracoesGeradas,
  onAudioGenerated,
}) {
  const [texto, setTexto] = useState("");
  const [editingSteps, setEditingSteps] = useState([]); // Array de objetos com os passos editáveis
  const [editingField, setEditingField] = useState(null); // { stepIndex, field: 'nar' | 'img' }
  const [tempValue, setTempValue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addPosition, setAddPosition] = useState(1);
  const [newComboData, setNewComboData] = useState({
    narracao: "",
    imagem: "",
  });

  useEffect(() => {
    if (Array.isArray(roteiro) && roteiro.length > 0) {
      const steps = roteiro.map((r, i) => ({
        nar: r.narracao || "",
        img: r.imagem || "",
      }));
      setEditingSteps(steps);

      // Manter compatibilidade com o texto original
      const linhas = roteiro.flatMap((r, i) => {
        const out = [];
        if (r.narracao) out.push(`Narração ${i + 1}: ${r.narracao}`);
        if (r.imagem) out.push(`Imagem/Vídeo ${i + 1}: ${r.imagem}`);
        return out;
      });
      setTexto(linhas.join("\n"));
    }
  }, [roteiro]);

  // Função para calcular total de caracteres
  const getTotalCharacters = (field) => {
    return editingSteps.reduce((total, step) => {
      return total + (step[field] ? step[field].length : 0);
    }, 0);
  };

  // Função para validar limites de caracteres
  const validateCharacterLimit = (newValue, stepIndex, field) => {
    const currentSteps = [...editingSteps];
    const oldValue = currentSteps[stepIndex][field] || "";
    currentSteps[stepIndex][field] = newValue;

    const totalChars = currentSteps.reduce((total, step) => {
      return total + (step[field] ? step[field].length : 0);
    }, 0);

    return totalChars <= 2000;
  };

  // Função para iniciar edição
  const startEditing = (stepIndex, field) => {
    const currentValue = editingSteps[stepIndex][field] || "";
    setEditingField({ stepIndex, field });
    setTempValue(currentValue);
  };

  // Função para salvar edição
  const saveEdit = async () => {
    if (!editingField) return;

    const { stepIndex, field } = editingField;

    // Validar limite de caracteres
    if (!validateCharacterLimit(tempValue, stepIndex, field)) {
      const fieldName = field === "nar" ? "narrações" : "imagens/vídeos";
      toast.error(`Limite de 2000 caracteres excedido para ${fieldName}!`);
      return;
    }

    const newSteps = [...editingSteps];
    newSteps[stepIndex][field] = tempValue;
    setEditingSteps(newSteps);

    // Atualizar texto para manter compatibilidade
    updateTextoFromSteps(newSteps);

    // Salvar no backend
    if (onSaveRoteiro) {
      const success = await onSaveRoteiro(newSteps, window.currentRoteiroId);
      if (success) {
        setEditingField(null);
        setTempValue("");
        toast.success("Alteração salva com sucesso!");
      }
    } else {
      // Fallback: apenas limpar edição
      setEditingField(null);
      setTempValue("");
      toast.success("Alteração salva com sucesso!");
    }
  };

  // Função para cancelar edição
  const cancelEdit = () => {
    setEditingField(null);
    setTempValue("");
  };

  // Função para remover combo
  const removeStep = async (stepIndex) => {
    if (
      window.confirm(`Tem certeza que deseja remover o combo ${stepIndex + 1}?`)
    ) {
      const newSteps = editingSteps.filter((_, index) => index !== stepIndex);
      setEditingSteps(newSteps);
      updateTextoFromSteps(newSteps);

      // Salvar no backend
      if (onSaveRoteiro) {
        await onSaveRoteiro(newSteps, window.currentRoteiroId);
      }

      toast.success("Combo removido com sucesso!");
    }
  };

  // Função para adicionar combo
  const addStep = async () => {
    // Validar se os campos obrigatórios estão preenchidos
    if (!newComboData.narracao.trim() || !newComboData.imagem.trim()) {
      alert(
        "É obrigatório preencher tanto a narração quanto a descrição da imagem/vídeo."
      );
      return;
    }

    const position = parseInt(addPosition) - 1;

    const newCombo = {
      nar: newComboData.narracao.trim(),
      img: newComboData.imagem.trim(),
    };

    // Inserir o novo combo na posição especificada
    const newSteps = [...editingSteps];
    newSteps.splice(position, 0, newCombo);

    // Renumerar todos os combos
    const renumberedSteps = newSteps.map((step, index) => ({
      ...step,
      numero: index + 1,
    }));

    setEditingSteps(renumberedSteps);
    updateTextoFromSteps(renumberedSteps);
    setShowAddForm(false);
    setAddPosition(1);
    setNewComboData({ narracao: "", imagem: "" });

    // Salvar no backend
    if (onSaveRoteiro) {
      await onSaveRoteiro(renumberedSteps, window.currentRoteiroId);
    }

    toast.success(`Combo adicionado na posição ${addPosition}!`);
  };

  // Função para atualizar texto a partir dos steps
  const updateTextoFromSteps = (steps) => {
    const linhas = steps.flatMap((step, i) => {
      const out = [];
      if (step.nar) out.push(`Narração ${i + 1}: ${step.nar}`);
      if (step.img) out.push(`Imagem/Vídeo ${i + 1}: ${step.img}`);
      return out;
    });
    setTexto(linhas.join("\n"));
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
    return editingSteps.filter((step) => step.nar || step.img);
  };

  const gerarVoz = async () => {
    if (editingSteps.length === 0) return;
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
      await axios.post("/api/narracoes", { narracoes });
      toast.success("Voz gerada com sucesso! Verifique a aba de Narrações.");

      if (onNarracoesGeradas) {
        onNarracoesGeradas(true);
      }
      if (onAudioGenerated) {
        onAudioGenerated();
      }
    } catch (error) {
      console.error("Erro ao verificar/gerar narração:", error);
      toast.error(
        "Saldo de Geração de Narrações Insuficiente, Recarregue Para Continuar"
      );
    }
  };

  const baixarPDF = () => {
    if (editingSteps.length === 0) return;

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

  const renderEditableSteps = () => {
    if (editingSteps.length === 0) {
      return <div className="default-text">Nenhum roteiro disponível</div>;
    }

    return editingSteps.map((step, i) => (
      <div key={i} className="step">
        <div className="step-badge">{i + 1}</div>

        <div className="step-actions">
          <button
            className="btn-remove-step"
            onClick={() => removeStep(i)}
            title="Remover combo"
          >
            <FaTrash />
          </button>
        </div>

        {/* Narração */}
        <div className="step-row">
          <span className="label label-nar">Narração {i + 1}:</span>
          {editingField?.stepIndex === i && editingField?.field === "nar" ? (
            <div className="edit-container">
              <textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="edit-textarea"
                placeholder="Digite a narração..."
                autoFocus
              />
              <div className="edit-actions">
                <button className="btn-save" onClick={saveEdit}>
                  <FaSave /> Salvar
                </button>
                <button className="btn-cancel" onClick={cancelEdit}>
                  <FaTimes /> Cancelar
                </button>
              </div>
              <div className="char-counter">
                {getTotalCharacters("nar") -
                  (step.nar?.length || 0) +
                  tempValue.length}
                /2000 caracteres (narrações)
              </div>
            </div>
          ) : (
            <div className="editable-content">
              <span className="row-content">
                {step.nar || "Clique para adicionar narração"}
              </span>
              <button
                className="btn-edit"
                onClick={() => startEditing(i, "nar")}
                title="Editar narração"
              >
                <FaEdit />
              </button>
            </div>
          )}
        </div>

        {/* Imagem/Vídeo */}
        <div className="step-row">
          <span className="label label-img">Imagem/Vídeo {i + 1}:</span>
          {editingField?.stepIndex === i && editingField?.field === "img" ? (
            <div className="edit-container">
              <textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="edit-textarea"
                placeholder="Digite a descrição da imagem/vídeo..."
                autoFocus
              />
              <div className="edit-actions">
                <button className="btn-save" onClick={saveEdit}>
                  <FaSave /> Salvar
                </button>
                <button className="btn-cancel" onClick={cancelEdit}>
                  <FaTimes /> Cancelar
                </button>
              </div>
              <div className="char-counter">
                {getTotalCharacters("img") -
                  (step.img?.length || 0) +
                  tempValue.length}
                /2000 caracteres (imagens/vídeos)
              </div>
            </div>
          ) : (
            <div className="editable-content">
              <span className="row-content">
                {step.img || "Clique para adicionar descrição da imagem/vídeo"}
              </span>
              <button
                className="btn-edit"
                onClick={() => startEditing(i, "img")}
                title="Editar imagem/vídeo"
              >
                <FaEdit />
              </button>
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <>
      {/* Contadores de caracteres */}
      <div className="character-counters">
        <div className="counter">
          <span>Narrações: {getTotalCharacters("nar")}/2000 caracteres</span>
        </div>
        <div className="counter">
          <span>
            Imagens/Vídeos: {getTotalCharacters("img")}/2000 caracteres
          </span>
        </div>
      </div>

      {/* Botão para adicionar combo */}
      <div className="add-combo-section">
        {!showAddForm ? (
          <button
            className="btn-add-combo"
            onClick={() => setShowAddForm(true)}
          >
            <FaPlus /> Adicionar Combo Narração/Imagem
          </button>
        ) : (
          <div className="add-form">
            <label>
              Posição:
              <input
                type="number"
                min="1"
                max={editingSteps.length + 1}
                value={addPosition}
                onChange={(e) => setAddPosition(e.target.value)}
              />
            </label>

            <label>
              Narração: *
              <textarea
                value={newComboData.narracao}
                onChange={(e) =>
                  setNewComboData((prev) => ({
                    ...prev,
                    narracao: e.target.value,
                  }))
                }
                placeholder="Digite a narração (obrigatório)..."
                className="add-form-textarea"
                required
              />
              <div className="char-counter-small">
                {newComboData.narracao.length}/2000 caracteres
              </div>
            </label>

            <label>
              Imagem/Vídeo: *
              <textarea
                value={newComboData.imagem}
                onChange={(e) =>
                  setNewComboData((prev) => ({
                    ...prev,
                    imagem: e.target.value,
                  }))
                }
                placeholder="Digite a descrição da imagem/vídeo (obrigatório)..."
                className="add-form-textarea"
                required
              />
              <div className="char-counter-small">
                {newComboData.imagem.length}/2000 caracteres
              </div>
            </label>

            <div className="add-form-actions">
              <button
                className="btn-save"
                onClick={addStep}
                disabled={
                  !newComboData.narracao.trim() || !newComboData.imagem.trim()
                }
              >
                <FaPlus /> Adicionar
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowAddForm(false);
                  setNewComboData({ narracao: "", imagem: "" });
                  setAddPosition(1);
                }}
              >
                <FaTimes /> Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LISTA (rolável) - Agora editável */}
      <div className="editor-container">
        <div className="roteiro-display">{renderEditableSteps()}</div>
      </div>

      {/* AÇÕES (fora do container) */}
      {editingSteps.length > 0 && (
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
