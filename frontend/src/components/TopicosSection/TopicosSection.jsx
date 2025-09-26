import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDatabase, FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './TopicosSection.css';

const TopicosSection = ({ 
  selectedTopico, 
  onSelectTopic,
  toastConfig 
}) => {
  const [topicos, setTopicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTopico, setEditingTopico] = useState(null);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  useEffect(() => {
    loadTopicos();
  }, [searchTerm]);

  const loadTopicos = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/topicos', {
        params: {
          page,
          limit: 10,
          search: searchTerm
        }
      });
      setTopicos(response.data.topicos);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Erro ao carregar tópicos', toastConfig);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.warn('Nome do tópico é obrigatório', toastConfig);
      return;
    }

    try {
      setLoading(true);
      if (editingTopico) {
        await axios.put(`http://localhost:5000/api/topicos/${editingTopico.id}`, formData);
        toast.success('Tópico atualizado com sucesso!', toastConfig);
      } else {
        await axios.post('http://localhost:5000/api/topicos', formData);
        toast.success('Tópico criado com sucesso!', toastConfig);
      }
      
      setFormData({ nome: '', descricao: '' });
      setShowForm(false);
      setEditingTopico(null);
      loadTopicos();
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao salvar tópico';
      toast.error(message, toastConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (topico) => {
    setEditingTopico(topico);
    setFormData({ nome: topico.nome, descricao: topico.descricao || '' });
    setShowForm(true);
  };

  const handleDelete = async (topico) => {
    if (!window.confirm(`Tem certeza que deseja excluir o tópico "${topico.nome}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/topicos/${topico.id}`);
      toast.success('Tópico excluído com sucesso!', toastConfig);
      loadTopicos();
    } catch (error) {
      toast.error('Erro ao excluir tópico', toastConfig);
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    setFormData({ nome: '', descricao: '' });
    setShowForm(false);
    setEditingTopico(null);
  };

  return (
    <div className="card scrollable">
      <div className="topicos-header">
        <h2>
          <FaDatabase style={{ marginRight: "8px" }} />
          Gerenciar Tópicos
        </h2>
        <button 
          className="btn-add-topico"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          <FaPlus style={{ marginRight: "5px" }} />
          Novo Tópico
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="topico-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Nome do tópico"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Descrição (opcional)"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="form-textarea"
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={loading}>
                {editingTopico ? 'Atualizar' : 'Criar'}
              </button>
              <button type="button" className="btn-cancel" onClick={cancelForm}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Busca */}
      <div className="search-container">
        <div className="search-input-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar tópicos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Lista de tópicos */}
      <div className="topicos-list">
        {loading ? (
          <div className="loading-message">Carregando...</div>
        ) : topicos.length === 0 ? (
          <div className="empty-message">
            {searchTerm ? 'Nenhum tópico encontrado' : 'Nenhum tópico cadastrado'}
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
                  {topico.descricao && (
                    <div className="topico-description">{topico.descricao}</div>
                  )}
                </div>
                <div className="topico-actions">
                  <button
                    className="btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(topico);
                    }}
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(topico);
                    }}
                    title="Excluir"
                  >
                    <FaTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => loadTopicos(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev || loading}
            className="btn-page"
          >
            Anterior
          </button>
          <span className="page-info">
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>
          <button
            onClick={() => loadTopicos(pagination.currentPage + 1)}
            disabled={!pagination.hasNext || loading}
            className="btn-page"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};

export default TopicosSection;