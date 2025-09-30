import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaDatabase, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { useTranslation } from "../../contexts/LanguageContext";
import "./TopicosSection.css";

const TopicosSection = ({ selectedTopico, onSelectTopic, toastConfig }) => {
  const { t } = useTranslation();
  const [topicos, setTopicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTopico, setEditingTopico] = useState(null);
  const [formData, setFormData] = useState({ nome: "" });

  useEffect(() => {
    loadTopicos();
  }, []);

  const loadTopicos = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/topicos");
      setTopicos(response.data.topicos);
    } catch (error) {
      toast.error(t("topicsSection.messages.loadError"), toastConfig);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.nome.trim()) {
      toast.error(t("topicsSection.messages.nameRequired"), toastConfig);
      return;
    }

    // Validação adicional para limite de caracteres
    if (formData.nome.length > 500) {
      toast.error("Nome do tópico não pode ter mais de 500 caracteres", toastConfig);
      return;
    }

    try {
      setLoading(true);
      if (editingTopico) {
        await axios.put(`/api/topicos/${editingTopico.id}`, formData);
        toast.success(t("topicsSection.messages.updateSuccess"), toastConfig);
      } else {
        await axios.post("/api/topicos", formData);
        toast.success(t("topicsSection.messages.createSuccess"), toastConfig);
      }
      await loadTopicos();
      cancelForm();
    } catch (error) {
      toast.error(t("topicsSection.messages.saveError"), toastConfig);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (topico) => {
    setEditingTopico(topico);
    setFormData({ nome: topico.nome });
    setShowForm(true);
  };

  const handleDelete = async (topico) => {
    if (
      window.confirm(
        t("topicsSection.messages.deleteConfirm", { name: topico.nome })
      )
    ) {
      try {
        setLoading(true);
        await axios.delete(`/api/topicos/${topico.id}`);
        toast.success(t("topicsSection.messages.deleteSuccess"), toastConfig);
        await loadTopicos();
        if (selectedTopico?.id === topico.id) {
          onSelectTopic(null);
        }
      } catch (error) {
        toast.error(t("topicsSection.messages.deleteError"), toastConfig);
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const cancelForm = () => {
    setFormData({ nome: "" });
    setShowForm(false);
    setEditingTopico(null);
  };

  return (
    <div className="card scrollable">
      <div className="topicos-header">
        <h2>
          <FaDatabase style={{ marginRight: "8px" }} />
          {t("topicsSection.title")}
        </h2>
        <button
          className="btn-add-topico"
          onClick={() => setShowForm(!showForm)}
          disabled={loading || topicos.length >= 5}
        >
          <FaPlus style={{ marginRight: "5px" }} />
          {t("topicsSection.actions.new")}
        </button>
      </div>

      {showForm && (
        <div className="topico-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                placeholder={t("topicsSection.form.placeholder")}
                value={formData.nome}
                onChange={(event) =>
                  setFormData({ ...formData, nome: event.target.value })
                }
                className="form-input"
                maxLength={500}
                required
              />
              <div className="character-count">
                {formData.nome.length}/500 caracteres
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={loading}>
                {editingTopico
                  ? t("topicsSection.actions.update")
                  : t("topicsSection.actions.create")}
              </button>
              <button type="button" className="btn-cancel" onClick={cancelForm}>
                {t("topicsSection.actions.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="topicos-list">
        {loading ? (
          <div className="loading-message">
            {t("topicsSection.state.loading")}
          </div>
        ) : topicos.length === 0 ? (
          <div className="empty-message">
            {t("topicsSection.state.emptyDefault")}
          </div>
        ) : (
          <ul>
            {topicos.map((topico) => (
              <li
                key={topico.id}
                className={selectedTopico?.id === topico.id ? "selected" : ""}
              >
                <div
                  className="topico-content"
                  onClick={() => onSelectTopic(topico)}
                >
                  <div className="topico-name">{topico.nome}</div>
                </div>
                <div className="topico-actions">
                  <button
                    className="btn-edit"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEdit(topico);
                    }}
                    title={t("topicsSection.actions.edit")}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn-delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(topico);
                    }}
                    title={t("topicsSection.actions.delete")}
                  >
                    <FaTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TopicosSection;
