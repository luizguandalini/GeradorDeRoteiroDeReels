import React from 'react';
import ConfiguracoesSection from '../../components/ConfiguracoesSection/ConfiguracoesSection';
import './Configuracoes.css';

const Configuracoes = ({ toastConfig }) => {
  return (
    <div className="configuracoes-page">
      <div className="page-header">
        <h1 className="page-title">Configurações do Sistema</h1>
        <p className="page-description">
          Gerencie as configurações da aplicação
        </p>
      </div>
      
      <div className="page-content">
        <ConfiguracoesSection toastConfig={toastConfig} />
      </div>
    </div>
  );
};

export default Configuracoes;