import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCog, FaPlus, FaEdit, FaTrash, FaSearch, FaSave, FaTimes, FaDatabase } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './ConfiguracoesSection.css';

const ConfiguracoesSection = ({ toastConfig }) => {
  const [configuracoes, setConfiguracoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    chave: '',
    valor: '',
    nome: '',
    descricao: '',
    categoria: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categorias = ['API', 'IA', 'Prompts', 'Audio', 'Geral'];

  useEffect(() => {
    loadConfiguracoes();
  }, []);

  const loadConfiguracoes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/configuracoes');
      setConfiguracoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações', toastConfig);
    } finally {
      setLoading(false);
    }
  };

  const inicializarConfiguracoes = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/configuracoes/inicializar');
      toast.success('Configurações inicializadas com sucesso!', toastConfig);
      loadConfiguracoes();
    } catch (error) {
      console.error('Erro ao inicializar configurações:', error);
      toast.error('Erro ao inicializar configurações', toastConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.chave || !formData.valor || !formData.nome || !formData.descricao || !formData.categoria) {
      toast.error('Todos os campos são obrigatórios', toastConfig);
      return;
    }

    try {
      setLoading(true);
      
      if (editingConfig) {
        await axios.put(`http://localhost:5000/api/configuracoes/${editingConfig.id}`, formData);
        toast.success('Configuração atualizada com sucesso!', toastConfig);
      } else {
        await axios.post('http://localhost:5000/api/configuracoes', formData);
        toast.success('Configuração criada com sucesso!', toastConfig);
      }
      
      resetForm();
      loadConfiguracoes();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao salvar configuração';
      toast.error(errorMessage, toastConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      chave: config.chave,
      valor: config.valor,
      nome: config.nome,
      descricao: config.descricao,
      categoria: config.categoria
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja desativar esta configuração?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/configuracoes/${id}`);
      toast.success('Configuração desativada com sucesso!', toastConfig);
      loadConfiguracoes();
    } catch (error) {
      console.error('Erro ao desativar configuração:', error);
      toast.error('Erro ao desativar configuração', toastConfig);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      chave: '',
      valor: '',
      nome: '',
      descricao: '',
      categoria: ''
    });
    setEditingConfig(null);
    setShowForm(false);
  };

  const filteredConfiguracoes = configuracoes.filter(config => {
    const matchesSearch = config.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.chave.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || config.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const configsPorCategoria = filteredConfiguracoes.reduce((acc, config) => {
    if (!acc[config.categoria]) {
      acc[config.categoria] = [];
    }
    acc[config.categoria].push(config);
    return acc;
  }, {});

  return (
    <div className="configuracoes-section">
      <div className="section-header">
        <div className="header-left">
          <FaCog className="section-icon" />
          <h2>Configurações do Sistema</h2>
        </div>
        <div className="header-actions">
          <button 
            className="btn-inicializar"
            onClick={inicializarConfiguracoes}
            disabled={loading}
          >
            <FaDatabase />
            Inicializar do .env
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
            disabled={loading}
          >
            <FaPlus />
            Nova Configuração
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar configurações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-filter"
        >
          <option value="">Todas as categorias</option>
          {categorias.map(categoria => (
            <option key={categoria} value={categoria}>{categoria}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <div className="form-header">
              <h3>{editingConfig ? 'Editar Configuração' : 'Nova Configuração'}</h3>
              <button className="btn-close" onClick={resetForm}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="config-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Chave *</label>
                  <input
                    type="text"
                    value={formData.chave}
                    onChange={(e) => setFormData({...formData, chave: e.target.value})}
                    placeholder="Ex: OPENROUTER_API_KEY"
                    disabled={editingConfig}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Categoria *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Nome descritivo da configuração"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descrição *</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descrição detalhada do que esta configuração faz"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Valor *</label>
                <textarea
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  placeholder="Valor da configuração"
                  rows="2"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  <FaTimes />
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  <FaSave />
                  {editingConfig ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="configuracoes-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando configurações...</p>
          </div>
        ) : (
          <div className="configuracoes-grid">
            {Object.keys(configsPorCategoria).map(categoria => (
              <div key={categoria} className="categoria-section">
                <h3 className="categoria-title">{categoria}</h3>
                <div className="configs-list">
                  {configsPorCategoria[categoria].map(config => (
                    <div key={config.id} className="config-card">
                      <div className="config-header">
                        <div className="config-info">
                          <h4>{config.nome}</h4>
                          <span className="config-key">{config.chave}</span>
                        </div>
                        <div className="config-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(config)}
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(config.id)}
                            title="Desativar"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      
                      <p className="config-description">{config.descricao}</p>
                      
                      <div className="config-value">
                        <label>Valor:</label>
                        <div className="value-display">
                          {config.valor.length > 100 
                            ? `${config.valor.substring(0, 100)}...` 
                            : config.valor
                          }
                        </div>
                      </div>
                      
                      <div className="config-meta">
                        <span>Atualizado: {new Date(config.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredConfiguracoes.length === 0 && (
          <div className="empty-state">
            <FaCog className="empty-icon" />
            <h3>Nenhuma configuração encontrada</h3>
            <p>
              {configuracoes.length === 0 
                ? 'Clique em "Inicializar do .env" para importar as configurações ou crie uma nova configuração.'
                : 'Tente ajustar os filtros de busca.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfiguracoesSection;