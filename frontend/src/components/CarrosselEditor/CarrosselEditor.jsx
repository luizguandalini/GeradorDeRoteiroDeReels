import { useState, useEffect } from "react";
import {
  FaFilePdf,
  FaCopy,
  FaEdit,
  FaSave,
  FaTimes,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import "./CarrosselEditor.css";

const CHARACTER_LIMITS = {
  titulo: 1000,
  paragrafo: 3000,
  imagem: 2000,
};

const FIELD_LABELS = {
  titulo: "titulos",
  paragrafo: "paragrafos",
  imagem: "descricoes de imagem",
};

function CarrosselEditor({ carrossel, onSaveCarrossel }) {
  const [texto, setTexto] = useState("");
  const [editingSlides, setEditingSlides] = useState([]); // Array de objetos com os slides editáveis
  const [editingField, setEditingField] = useState(null); // { slideIndex, field: 'titulo' | 'paragrafo' | 'imagem' }
  const [tempValue, setTempValue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addPosition, setAddPosition] = useState(1);
  const [newSlideData, setNewSlideData] = useState({
    titulo: "",
    paragrafo: "",
    imagem: "",
  });
  const buildTextoFromSlides = (slidesArray) => {
    if (!Array.isArray(slidesArray) || slidesArray.length === 0) {
      return "";
    }

    const linesText = slidesArray.flatMap((slide, index) => {
      const items = [];
      if (slide.titulo) items.push(`Titulo ${index + 1}: ${slide.titulo}`);
      if (slide.paragrafo)
        items.push(`Paragrafo ${index + 1}: ${slide.paragrafo}`);
      if (slide.imagem) items.push(`Imagem ${index + 1}: ${slide.imagem}`);
      return items;
    });

    return linesText.join("\n");
  };

  useEffect(() => {
    if (Array.isArray(carrossel) && carrossel.length > 0) {
      const slides = carrossel.map((slide) => ({
        titulo: slide.titulo || "",
        paragrafo: slide.paragrafo || "",
        imagem: slide.imagem || "",
      }));
      setEditingSlides(slides);
      setTexto(buildTextoFromSlides(slides));
    } else {
      setEditingSlides([]);
      setTexto("");
    }
  }, [carrossel]);

  // Função para calcular total de caracteres
  const getTotalCharacters = (field) => {
    return editingSlides.reduce((total, slide) => {
      return total + (slide[field] ? slide[field].length : 0);
    }, 0);
  };

  const computeEditedTotal = (field, originalLength) => {
    return getTotalCharacters(field) - originalLength + tempValue.length;
  };

  const validateCharacterLimit = (newValue, slideIndex, field) => {
    const currentSlides = [...editingSlides];
    currentSlides[slideIndex][field] = newValue;

    const totalChars = currentSlides.reduce((total, slide) => {
      return total + (slide[field] ? slide[field].length : 0);
    }, 0);

    if (totalChars > CHARACTER_LIMITS[field]) {
      toast.error(
        `Limite de ${CHARACTER_LIMITS[field]} caracteres excedido para ${FIELD_LABELS[field]}. Total atual: ${totalChars}`
      );
      return false;
    }

    return true;
  };

  const persistSlides = async (
    slidesForSave,
    { successMessage = "Carrossel salvo com sucesso!" } = {}
  ) => {
    const sanitizedSlides = slidesForSave.map((slide) => ({
      titulo: slide.titulo || "",
      paragrafo: slide.paragrafo || "",
      imagem: slide.imagem || "",
    }));

    setEditingSlides(sanitizedSlides);
    setTexto(buildTextoFromSlides(sanitizedSlides));

    try {
      await onSaveCarrossel(sanitizedSlides);
      if (successMessage) {
        toast.success(successMessage);
      }
      return true;
    } catch (error) {
      console.error("Erro ao salvar carrossel:", error);
      toast.error("Erro ao salvar carrossel");
      return false;
    }
  };

  // Função para iniciar edição
  const startEditing = (slideIndex, field) => {
    setEditingField({ slideIndex, field });
    setTempValue(editingSlides[slideIndex][field] || "");
  };

  // Função para salvar edição
  const saveEdit = async () => {
    if (!editingField) {
      return;
    }

    const { slideIndex, field } = editingField;

    if (!validateCharacterLimit(tempValue, slideIndex, field)) {
      return;
    }

    const updatedSlides = editingSlides.map((slide, index) =>
      index === slideIndex ? { ...slide, [field]: tempValue } : { ...slide }
    );

    const saved = await persistSlides(updatedSlides, {
      successMessage: "Slide salvo com sucesso!",
    });

    if (!saved) {
      return;
    }

    setEditingField(null);
    setTempValue("");
  };

  // Função para cancelar edição
  const cancelEdit = () => {
    setEditingField(null);
    setTempValue("");
  };

  // Função para deletar slide
  const deleteSlide = async (slideIndex) => {
    if (editingSlides.length <= 2) {
      toast.error("Nao e possivel deletar. Minimo de 2 slides necessario.");
      return;
    }

    const updatedSlides = editingSlides
      .filter((_, index) => index !== slideIndex)
      .map((slide) => ({ ...slide }));

    const saved = await persistSlides(updatedSlides, {
      successMessage: "Slide removido com sucesso!",
    });

    if (!saved) {
      return;
    }

    if (editingField) {
      setEditingField(null);
      setTempValue("");
    }
  };

  // Função para adicionar novo slide
  const addNewSlide = async () => {
    if (editingSlides.length >= 8) {
      toast.error("Maximo de 8 slides permitido.");
      return;
    }

    if (
      !newSlideData.titulo.trim() ||
      !newSlideData.paragrafo.trim() ||
      !newSlideData.imagem.trim()
    ) {
      toast.error("Todos os campos sao obrigatorios.");
      return;
    }

    const newSlides = editingSlides.map((slide) => ({ ...slide }));
    newSlides.splice(addPosition - 1, 0, { ...newSlideData });

    const saved = await persistSlides(newSlides, {
      successMessage: "Slide adicionado com sucesso!",
    });

    if (!saved) {
      return;
    }

    setNewSlideData({ titulo: "", paragrafo: "", imagem: "" });
    setShowAddForm(false);
    setAddPosition(1);
  };

  // Função para copiar texto
  const copyToClipboard = () => {
    navigator.clipboard.writeText(texto);
    toast.success("Carrossel copiado para a área de transferência!");
  };

  // Função para gerar PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    doc.setFontSize(16);
    doc.text("Carrossel Gerado", 20, yPosition);
    yPosition += 20;

    editingSlides.forEach((slide, index) => {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(`Slide ${index + 1}:`, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.text(`Título: ${slide.titulo}`, 20, yPosition);
      yPosition += 10;

      const paragrafLines = doc.splitTextToSize(slide.paragrafo, 170);
      doc.text(`Parágrafo:`, 20, yPosition);
      yPosition += 7;
      doc.text(paragrafLines, 20, yPosition);
      yPosition += paragrafLines.length * 7 + 5;

      const imagemLines = doc.splitTextToSize(slide.imagem, 170);
      doc.text(`Imagem:`, 20, yPosition);
      yPosition += 7;
      doc.text(imagemLines, 20, yPosition);
      yPosition += imagemLines.length * 7 + 15;
    });

    doc.save("carrossel.pdf");
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="carrossel-editor">
      <div className="carrossel-actions">
        <button onClick={copyToClipboard} className="btn-action btn-copy">
          <FaCopy /> Copiar Roteiro
        </button>
        <button onClick={generatePDF} className="btn-action btn-download">
          <FaFilePdf /> Baixar Roteiro do Carrossel em PDF
        </button>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-action btn-add"
          disabled={editingSlides.length >= 8}
        >
          <FaPlus /> Adicionar Roteiro de Slide Manualmente
        </button>
      </div>

      {/* Formulário para adicionar novo slide */}
      {showAddForm && (
        <div className="add-slide-form">
          <h4>Adicionar Novo Slide</h4>
          <div className="form-group">
            <label>Posição:</label>
            <select
              value={addPosition}
              onChange={(e) => setAddPosition(parseInt(e.target.value))}
            >
              {Array.from({ length: editingSlides.length + 1 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Posição {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Título:</label>
            <input
              type="text"
              value={newSlideData.titulo}
              onChange={(e) =>
                setNewSlideData({ ...newSlideData, titulo: e.target.value })
              }
              placeholder="Digite o título do slide"
            />
          </div>
          <div className="form-group">
            <label>Parágrafo:</label>
            <textarea
              value={newSlideData.paragrafo}
              onChange={(e) =>
                setNewSlideData({ ...newSlideData, paragrafo: e.target.value })
              }
              placeholder="Digite o parágrafo do slide"
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Descrição da Imagem:</label>
            <textarea
              value={newSlideData.imagem}
              onChange={(e) =>
                setNewSlideData({ ...newSlideData, imagem: e.target.value })
              }
              placeholder="Digite a descrição da imagem"
              rows="2"
            />
          </div>
          <div className="form-actions">
            <button onClick={addNewSlide} className="btn-confirm">
              Adicionar
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="btn-cancel"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de slides editáveis */}
      <div className="slides-list">
        {editingSlides.map((slide, slideIndex) => (
          <div key={slideIndex} className="slide-item">
            <div className="slide-header">
              <h4>Slide {slideIndex + 1}</h4>
              <button
                onClick={() => deleteSlide(slideIndex)}
                className="btn-delete"
                disabled={editingSlides.length <= 2}
              >
                <FaTrash />
              </button>
            </div>

            {/* Título */}
            <div className="field-group">
              <label>Título:</label>
              {editingField?.slideIndex === slideIndex &&
              editingField?.field === "titulo" ? (
                <div className="edit-field">
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button onClick={saveEdit} className="btn-save-field">
                      <FaSave />
                    </button>
                    <button onClick={cancelEdit} className="btn-cancel-field">
                      <FaTimes />
                    </button>
                  </div>
                  <div className="char-counter">
                    {computeEditedTotal("titulo", slide.titulo.length)}/
                    {CHARACTER_LIMITS.titulo} caracteres ({FIELD_LABELS.titulo})
                  </div>
                </div>
              ) : (
                <div
                  className="field-display"
                  onClick={() => startEditing(slideIndex, "titulo")}
                >
                  <span>{slide.titulo || "Clique para editar"}</span>
                  <FaEdit className="edit-icon" />
                </div>
              )}
            </div>

            {/* Parágrafo */}
            <div className="field-group">
              <label>Parágrafo:</label>
              {editingField?.slideIndex === slideIndex &&
              editingField?.field === "paragrafo" ? (
                <div className="edit-field">
                  <textarea
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    rows="3"
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button onClick={saveEdit} className="btn-save-field">
                      <FaSave />
                    </button>
                    <button onClick={cancelEdit} className="btn-cancel-field">
                      <FaTimes />
                    </button>
                  </div>
                  <div className="char-counter">
                    {computeEditedTotal("paragrafo", slide.paragrafo.length)}/
                    {CHARACTER_LIMITS.paragrafo} caracteres (
                    {FIELD_LABELS.paragrafo})
                  </div>
                </div>
              ) : (
                <div
                  className="field-display"
                  onClick={() => startEditing(slideIndex, "paragrafo")}
                >
                  <span>{slide.paragrafo || "Clique para editar"}</span>
                  <FaEdit className="edit-icon" />
                </div>
              )}
            </div>

            {/* Imagem */}
            <div className="field-group">
              <label>Descrição da Imagem:</label>
              {editingField?.slideIndex === slideIndex &&
              editingField?.field === "imagem" ? (
                <div className="edit-field">
                  <textarea
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    rows="2"
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button onClick={saveEdit} className="btn-save-field">
                      <FaSave />
                    </button>
                    <button onClick={cancelEdit} className="btn-cancel-field">
                      <FaTimes />
                    </button>
                  </div>
                  <div className="char-counter">
                    {computeEditedTotal("imagem", slide.imagem.length)}/
                    {CHARACTER_LIMITS.imagem} caracteres ({FIELD_LABELS.imagem})
                  </div>
                </div>
              ) : (
                <div
                  className="field-display"
                  onClick={() => startEditing(slideIndex, "imagem")}
                >
                  <span>{slide.imagem || "Clique para editar"}</span>
                  <FaEdit className="edit-icon" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Estatísticas de caracteres */}
      <div className="character-stats">
        <div className="stat-item">
          <span>
            Total Títulos: {getTotalCharacters("titulo")}/
            {CHARACTER_LIMITS.titulo}
          </span>
        </div>
        <div className="stat-item">
          <span>
            Total Parágrafos: {getTotalCharacters("paragrafo")}/
            {CHARACTER_LIMITS.paragrafo}
          </span>
        </div>
        <div className="stat-item">
          <span>
            Total Imagens: {getTotalCharacters("imagem")}/
            {CHARACTER_LIMITS.imagem}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CarrosselEditor;
