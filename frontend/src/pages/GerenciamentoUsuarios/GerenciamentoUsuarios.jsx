import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useTranslation } from '../../contexts/LanguageContext';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import UserModal from '../../components/UserModal/UserModal';
import './GerenciamentoUsuarios.css';

const GerenciamentoUsuarios = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    active: 'all'
  });

  // Modais
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Carregar usuários
  const loadUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: filters.search,
        role: filters.role,
        active: filters.active
      });

      const response = await axios.get(`/api/users/admin/list?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Efeito para carregar usuários quando filtros mudam
  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  // Aplicar filtros
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Paginação
  const handlePageChange = (page) => {
    loadUsers(page);
  };

  // Abrir modal de criação
  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalAction('create');
    setShowUserModal(true);
  };

  // Abrir modal de edição
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setModalAction('edit');
    setShowUserModal(true);
  };

  // Abrir modal de confirmação para deletar
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setModalAction('delete');
    setShowConfirmModal(true);
  };

  // Confirmar deleção
  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/users/admin/${selectedUser.id}`);
      toast.success('Usuário deletado com sucesso');
      setShowConfirmModal(false);
      loadUsers(pagination.currentPage);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error(error.response?.data?.error || 'Erro ao deletar usuário');
    }
  };

  // Salvar usuário (criar ou editar)
  const handleSaveUser = async (userData) => {
    try {
      if (modalAction === 'create') {
        await axios.post('/api/users/admin/create', userData);
        toast.success('Usuário criado com sucesso');
      } else {
        // Separar atualização de perfil e quotas
        const { quotaTemas, quotaRoteiros, quotaNarracoes, quotaTemasCarrossel, quotaCarrossel, name, email, password, role, active, language, __profileChanged, __quotasChanged, __quotasOnly } = userData;

        const profilePayload = { name, email, role, active, language };
        // Enviar senha apenas se fornecida
        if (password && password.length > 0) {
          profilePayload.password = password;
        }

        const toNum = (v) => {
          const n = Number(v);
          return Number.isNaN(n) ? 0 : n;
        };
        const quotaPayload = { 
          quotaTemas: toNum(quotaTemas), 
          quotaRoteiros: toNum(quotaRoteiros), 
          quotaNarracoes: toNum(quotaNarracoes), 
          quotaTemasCarrossel: toNum(quotaTemasCarrossel), 
          quotaCarrossel: toNum(quotaCarrossel) 
        };

        // Detectar mudanças comparando com o usuário selecionado
        const profileChanged = (__profileChanged !== undefined)
          ? __profileChanged
          : (
            (name !== selectedUser.name) ||
            (email !== selectedUser.email) ||
            (role !== selectedUser.role) ||
            (active !== selectedUser.active) ||
            (language !== selectedUser.language) ||
            (password && password.length > 0)
          );
        const quotasChanged = (__quotasChanged !== undefined)
          ? __quotasChanged
          : (
            (toNum(quotaTemas) !== toNum(selectedUser.quotaTemas)) ||
            (toNum(quotaRoteiros) !== toNum(selectedUser.quotaRoteiros)) ||
            (toNum(quotaNarracoes) !== toNum(selectedUser.quotaNarracoes)) ||
            (toNum(quotaTemasCarrossel) !== toNum(selectedUser.quotaTemasCarrossel)) ||
            (toNum(quotaCarrossel) !== toNum(selectedUser.quotaCarrossel))
          );

        if (profileChanged && !__quotasOnly) {
          await axios.put(`/api/users/admin/${selectedUser.id}`, profilePayload);
        }
        if (quotasChanged) {
          await axios.patch(`/api/users/admin/${selectedUser.id}/quotas`, quotaPayload);
        }

        if (!profileChanged && !quotasChanged) {
          toast.info('Nenhuma alteração detectada');
        } else {
          toast.success('Usuário atualizado com sucesso');
        }
      }
      setShowUserModal(false);
      loadUsers(pagination.currentPage);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar usuário');
    }
  };

  // Formatar data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Traduzir role
  const translateRole = (role) => {
    return role === 'ADMIN' ? 'Administrador' : 'Usuário';
  };

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>Gerenciamento de Usuários</h1>
        <button className="btn btn-primary" onClick={handleCreateUser}>
          <FaPlus /> Novo Usuário
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="all">Todos os tipos</option>
            <option value="ADMIN">Administradores</option>
            <option value="GENERAL">Usuários</option>
          </select>

          <select
            value={filters.active}
            onChange={(e) => handleFilterChange('active', e.target.value)}
          >
            <option value="all">Todos os status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>
      </div>

      {/* Tabela de usuários */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Estatísticas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                      {translateRole(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                      {user.active ? (
                        <>
                          <FaEye /> Ativo
                        </>
                      ) : (
                        <>
                          <FaEyeSlash /> Inativo
                        </>
                      )}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="stats">
                      <span>Áudios: {user.stats?.narracoes || 0}</span>
                      <span>Roteiros: {user.stats?.roteiros || 0}</span>
                      <span>Tópicos: {user.stats?.topicos || 0}</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-edit"
                        onClick={() => handleEditUser(user)}
                        title="Editar usuário"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDeleteUser(user)}
                        title="Deletar usuário"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {users.length === 0 && !loading && (
          <div className="empty-state">
            <p>Nenhum usuário encontrado</p>
          </div>
        )}
      </div>

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            disabled={!pagination.hasPrev}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            Anterior
          </button>

          <div className="page-info">
            Página {pagination.currentPage} de {pagination.totalPages}
            <span className="total-count">
              ({pagination.totalUsers} usuários)
            </span>
          </div>

          <button
            className="btn btn-secondary"
            disabled={!pagination.hasNext}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal de confirmação */}
      {showConfirmModal && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmDelete}
          title="Confirmar Deleção"
          message={
            <div>
              <p>Tem certeza que deseja deletar o usuário <strong>{selectedUser?.name}</strong>?</p>
              <p className="warning-text">
                ⚠️ Esta ação irá deletar permanentemente:
              </p>
              <ul className="warning-list">
                <li>Todos os dados do usuário</li>
                <li>Todos os áudios gerados</li>
                <li>Todos os roteiros criados</li>
                <li>Todas as configurações personalizadas</li>
                <li>A pasta de arquivos do usuário</li>
              </ul>
              <p className="warning-text">Esta ação não pode ser desfeita!</p>
            </div>
          }
          confirmText="Deletar"
          cancelText="Cancelar"
          type="danger"
        />
      )}

      {/* Modal de usuário */}
      {showUserModal && (
        <UserModal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          onSave={handleSaveUser}
          user={selectedUser}
          mode={modalAction}
        />
      )}
    </div>
  );
};

export default GerenciamentoUsuarios;