import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCog, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaCheck, FaCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './ConfiguracoesSection.css';

const ConfiguracoesSection = ({ toastConfig }) => {
  const [configuracoes, setConfiguracoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showValueForm, setShowValueForm] = useState(null);
  const [newValue, setNewValue] = useState('');
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

  const addValue = async (chave) => {
    if (!newValue.trim()) {
      toast.error('Valor não pode estar vazio', toastConfig);
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/configuracoes/${chave}/valores`, {
        valor: newValue,
        ativar: false
      });
      
      toast.success('Valor adicionado com sucesso!', toastConfig);
      setNewValue('');
      setShowValueForm(null);
      loadConfiguracoes();
    } catch (error) {
      console.error('Erro ao adicionar valor:', error);
      toast.error('Erro ao adicionar valor', toastConfig);
    }
  };

  const activateValue = async (valorId) => {
    try {
      await axios.put(`http://localhost:5000/api/configuracoes/valores/${valorId}/ativar`);
      toast.success('Valor ativado com sucesso!', toastConfig);
      loadConfiguracoes();
    } catch (error) {
      console.error('Erro ao ativar valor:', error);
      toast.error('Erro ao ativar valor', toastConfig);
    }
  };

  const deleteValue = async (valorId) => {
    if (!window.confirm('Tem certeza que deseja remover este valor?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/configuracoes/valores/${valorId}`);
      toast.success('Valor removido com sucesso!', toastConfig);
      loadConfiguracoes();
    } catch (error) {
      console.error('Erro ao remover valor:', error);
      toast.error('Erro ao remover valor', toastConfig);
    }
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
      </div>

      <div className="filters-section">
        <div className="search-container">
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

      <div className="configuracoes-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando configurações...</p>
          </div>
        ) : (
          <div className="configuracoes-grid">
            {Object.keys(configsPorCategoria).length === 0 ? (
              <div className="loading-container">
                <p>Nenhuma configuração encontrada</p>
              </div>
            ) : (
              Object.entries(configsPorCategoria).map(([categoria, configs]) => (
                <div key={categoria} className="categoria-section">
                  <h3 className="categoria-title">{categoria}</h3>
                  <div className="configs-list">
                    {configs.map(config => (
                      <div key={config.id} className="config-card">
                        <div className="config-header">
                          <div className="config-info">
                            <h4>{config.nome}</h4>
                            <span className="config-key">{config.chave}</span>
                          </div>
                        </div>
                        
                        <div className="config-description">
                          {config.descricao}
                        </div>

                        <div className="config-values">
                          <div className="values-header">
                            <label>Valores:</label>
                            <button
                              className="btn-add-value"
                              onClick={() => setShowValueForm(config.chave)}
                              title="Adicionar novo valor"
                            >
                              <FaPlus />
                            </button>
                          </div>

                          {showValueForm === config.chave && (
                            <div className="value-form">
                              <div className="value-input-group">
                                <input
                                  type="text"
                                  value={newValue}
                                  onChange={(e) => setNewValue(e.target.value)}
                                  placeholder="Digite o novo valor..."
                                  className="value-input"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      addValue(config.chave);
                                    }
                                  }}
                                />
                                <div className="value-actions">
                                  <button
                                    className="btn-save-value"
                                    onClick={() => addValue(config.chave)}
                                  >
                                    <FaSave />
                                  </button>
                                  <button
                                    className="btn-cancel-value"
                                    onClick={() => {
                                      setShowValueForm(null);
                                      setNewValue('');
                                    }}
                                  >
                                    <FaTimes />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="values-list">
                            {config.valores && config.valores.length > 0 ? (
                              config.valores.map(valor => (
                                <div key={valor.id} className={`value-item ${valor.ativo ? 'active' : ''}`}>
                                  <div className="value-content">
                                    <div className="value-status">
                                      {valor.ativo ? (
                                        <FaCheck className="status-icon active" />
                                      ) : (
                                        <FaCircle className="status-icon inactive" />
                                      )}
                                    </div>
                                    <div className="value-text">
                                      {valor.valor}
                                    </div>
                                  </div>
                                  <div className="value-actions">
                                    {!valor.ativo && (
                                      <button
                                        className="btn-activate"
                                        onClick={() => activateValue(valor.id)}
                                        title="Ativar este valor"
                                      >
                                        Ativar
                                      </button>
                                    )}
                                    <button
                                      className="btn-delete-value"
                                      onClick={() => deleteValue(valor.id)}
                                      title="Remover valor"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="no-values">
                                Nenhum valor configurado
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfiguracoesSection;