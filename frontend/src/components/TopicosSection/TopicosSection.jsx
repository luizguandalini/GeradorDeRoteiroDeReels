import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDatabase, FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useTranslation } from '../../contexts/LanguageContext';
import './TopicosSection.css';

const TopicosSection = ({
  selectedTopico,
  onSelectTopic,
  toastConfig
}) => {
  const { t } = useTranslation();
  const [topicos, setTopicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTopico, setEditingTopico] = useState(null);
  const [formData, setFormData] = useState({ nome: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  useEffect(() => {
    loadTopicos();
  }, [searchTerm]);

  const loadTopicos = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/topicos', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
        },
      });
      setTopicos(response.data.topicos);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(t('topicsSection.messages.loadError'), toastConfig);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.nome.trim()) {
      toast.warn(t('topicsSection.messages.nameRequired'), toastConfig);
      return;
    }

    try {
      setLoading(true);
      if (editingTopico) {
        await axios.put(`/api/topicos/${editingTopico.id}`, formData);
        toast.success(t('topicsSection.messages.updateSuccess'), toastConfig);
      } else {
        await axios.post('/api/topicos', formData);
        toast.success(t('topicsSection.messages.createSuccess'), toastConfig);
      }

      setFormData({ nome: '' });
      setShowForm(false);
      setEditingTopico(null);
      loadTopicos();
    } catch (error) {
      const message = error.response?.data?.error || t('topicsSection.messages.saveError');
      toast.error(message, toastConfig);
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
    const confirmation = window.confirm(
      t('topicsSection.messages.deleteConfirm', { name: topico.nome })
    );

    if (!confirmation) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/topicos/${topico.id}`);
      toast.success(t('topicsSection.messages.deleteSuccess'), toastConfig);
      loadTopicos();
    } catch (error) {
      toast.error(t('topicsSection.messages.deleteError'), toastConfig);
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    setFormData({ nome: '' });
    setShowForm(false);
    setEditingTopico(null);
  };

  return (
    <div className="card scrollable">
      <div className="topicos-header">
        <h2>
          <FaDatabase style={{ marginRight: '8px' }} />
          {t('topicsSection.title')}
        </h2>
        <button
          className="btn-add-topico"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          <FaPlus style={{ marginRight: '5px' }} />
          {t('topicsSection.actions.new')}
        </button>
      </div>

      {showForm && (
        <div className="topico-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                placeholder={t('topicsSection.form.placeholder')}
                value={formData.nome}
                onChange={(event) => setFormData({ ...formData, nome: event.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={loading}>
                {editingTopico ? t('topicsSection.actions.update') : t('topicsSection.actions.create')}
              </button>
              <button type="button" className="btn-cancel" onClick={cancelForm}>
                {t('topicsSection.actions.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="search-container">
        <div className="search-input-container">
          <input
            type="text"
            placeholder={t('topicsSection.search.placeholder')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="search-input"
          />
          <FaSearch className="search-icon" />
        </div>
      </div>

      <div className="topicos-list">
        {loading ? (
          <div className="loading-message">{t('topicsSection.state.loading')}</div>
        ) : topicos.length === 0 ? (
          <div className="empty-message">
            {searchTerm
              ? t('topicsSection.state.emptySearch')
              : t('topicsSection.state.emptyDefault')}
          </div>
        ) : (
          <ul>
            {topicos.map((topico) => (
              <li
                key={topico.id}
                className={selectedTopico?.id === topico.id ? 'selected' : ''}
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
                    title={t('topicsSection.actions.edit')}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn-delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(topico);
                    }}
                    title={t('topicsSection.actions.delete')}
                  >
                    <FaTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => loadTopicos(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev || loading}
            className="btn-page"
          >
            {t('topicsSection.pagination.previous')}
          </button>
          <span className="page-info">
            {t('topicsSection.pagination.page', {
              current: pagination.currentPage,
              total: pagination.totalPages,
            })}
          </span>
          <button
            onClick={() => loadTopicos(pagination.currentPage + 1)}
            disabled={!pagination.hasNext || loading}
            className="btn-page"
          >
            {t('topicsSection.pagination.next')}
          </button>
        </div>
      )}
    </div>
  );
};

export default TopicosSection;
