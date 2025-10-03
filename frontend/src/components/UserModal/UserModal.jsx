import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';
import './UserModal.css';

const UserModal = ({
  isOpen,
  onClose,
  onSave,
  user,
  mode // 'create' ou 'edit'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'GENERAL',
    active: true,
    language: 'pt-BR',
    // Quotas
    quotaTemas: 0,
    quotaRoteiros: 0,
    quotaNarracoes: 0,
    quotaTemasCarrossel: 0,
    quotaCarrossel: 0
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Preencher formulário quando modal abrir
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
          role: user.role || 'GENERAL',
          active: user.active !== undefined ? user.active : true,
          language: user.language || 'pt-BR',
          quotaTemas: user.quotaTemas ?? 0,
          quotaRoteiros: user.quotaRoteiros ?? 0,
          quotaNarracoes: user.quotaNarracoes ?? 0,
          quotaTemasCarrossel: user.quotaTemasCarrossel ?? 0,
          quotaCarrossel: user.quotaCarrossel ?? 0
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'GENERAL',
          active: true,
          language: 'pt-BR',
          quotaTemas: 0,
          quotaRoteiros: 0,
          quotaNarracoes: 0,
          quotaTemasCarrossel: 0,
          quotaCarrossel: 0
        });
      }
      setErrors({});
      setShowPassword(false);
    }
  }, [isOpen, mode, user]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (mode === 'create' && !formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Preparar dados para envio
    const dataToSend = { ...formData };
    
    // Se estiver editando e senha estiver vazia, não enviar senha
    if (mode === 'edit' && !dataToSend.password) {
      delete dataToSend.password;
    }

    onSave(dataToSend);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getTitle = () => {
    return mode === 'create' ? 'Criar Novo Usuário' : 'Editar Usuário';
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="user-modal">
        <div className="modal-header">
          <div className="modal-title-container">
            <FaUser className="modal-icon" />
            <h3 className="modal-title">{getTitle()}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
        <div className="form-grid">
            {/* Nome */}
            <div className="form-group">
              <label htmlFor="name">Nome *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'error' : ''}
                placeholder="Digite o nome completo"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
                placeholder="Digite o email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Senha */}
            <div className="form-group">
              <label htmlFor="password">
                Senha {mode === 'create' ? '*' : '(deixe vazio para manter atual)'}
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={errors.password ? 'error' : ''}
                  placeholder={mode === 'create' ? 'Digite a senha' : 'Nova senha (opcional)'}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* Tipo de usuário */}
            <div className="form-group">
              <label htmlFor="role">Tipo de Usuário</label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
              >
                <option value="GENERAL">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            {/* Idioma */}
            <div className="form-group">
              <label htmlFor="language">Idioma</label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Status */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                Usuário ativo
              </label>
              <small className="help-text">
                Usuários inativos não conseguem fazer login no sistema
              </small>
            </div>

            {/* Quotas */}
            <div className="form-group">
              <label>Créditos disponíveis</label>
              <div className="quota-grid">
                <div className="quota-field">
                  <label htmlFor="quotaTemas">Temas</label>
                  <input
                    type="number"
                    id="quotaTemas"
                    value={formData.quotaTemas}
                    onChange={(e) => handleInputChange('quotaTemas', parseInt(e.target.value || '0', 10))}
                    min="0"
                  />
                </div>
                <div className="quota-field">
                  <label htmlFor="quotaRoteiros">Roteiros</label>
                  <input
                    type="number"
                    id="quotaRoteiros"
                    value={formData.quotaRoteiros}
                    onChange={(e) => handleInputChange('quotaRoteiros', parseInt(e.target.value || '0', 10))}
                    min="0"
                  />
                </div>
                <div className="quota-field">
                  <label htmlFor="quotaNarracoes">Narrações</label>
                  <input
                    type="number"
                    id="quotaNarracoes"
                    value={formData.quotaNarracoes}
                    onChange={(e) => handleInputChange('quotaNarracoes', parseInt(e.target.value || '0', 10))}
                    min="0"
                  />
                </div>
                <div className="quota-field">
                  <label htmlFor="quotaTemasCarrossel">Temas Carrossel</label>
                  <input
                    type="number"
                    id="quotaTemasCarrossel"
                    value={formData.quotaTemasCarrossel}
                    onChange={(e) => handleInputChange('quotaTemasCarrossel', parseInt(e.target.value || '0', 10))}
                    min="0"
                  />
                </div>
                <div className="quota-field">
                  <label htmlFor="quotaCarrossel">Carrossel</label>
                  <input
                    type="number"
                    id="quotaCarrossel"
                    value={formData.quotaCarrossel}
                    onChange={(e) => handleInputChange('quotaCarrossel', parseInt(e.target.value || '0', 10))}
                    min="0"
                  />
                </div>
              </div>
              <small className="help-text">Por padrão novos usuários começam com 0.</small>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;