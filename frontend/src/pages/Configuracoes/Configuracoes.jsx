import React from 'react';
import ConfiguracoesSection from '../../components/ConfiguracoesSection/ConfiguracoesSection';
import './Configuracoes.css';

const Configuracoes = ({ toastConfig }) => {
  return (
    <div className="configuracoes-page">
      <div className="page-content">
        <ConfiguracoesSection toastConfig={toastConfig} />
      </div>
    </div>
  );
};

export default Configuracoes;