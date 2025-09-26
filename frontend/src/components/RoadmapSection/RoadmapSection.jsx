import React from 'react';
import './RoadmapSection.css';

const RoadmapSection = ({ 
  selectedTopico, 
  temas = [], 
  selectedTema, 
  roteiro = [],
  narracoesGeradas
}) => {
  return (
    <div className="roadmap-container">
      <h2>Roadmap de Criação</h2>
      <div className="roadmap-steps">
        <div
          className={`roadmap-step ${
            selectedTopico ? "completed" : "active"
          }`}
        >
          <span className="roadmap-number">1</span>
          <span className="roadmap-text">Selecionar Tópico</span>
        </div>
        <div className="roadmap-arrow"></div>

        <div
          className={`roadmap-step ${
            selectedTema
              ? "completed"
              : selectedTopico && temas && temas.length > 0
              ? "active"
              : ""
          }`}
        >
          <span className="roadmap-number">2</span>
          <span className="roadmap-text">Escolher Sugestão</span>
        </div>
        <div className="roadmap-arrow"></div>

        <div
          className={`roadmap-step ${
            roteiro && roteiro.length > 0 ? "completed" : selectedTema ? "active" : ""
          }`}
        >
          <span className="roadmap-number">3</span>
          <span className="roadmap-text">Editar Roteiro</span>
        </div>
        <div className="roadmap-arrow"></div>

        <div className={`roadmap-step ${narracoesGeradas ? "completed" : roteiro && roteiro.length > 0 ? "active" : ""}`}>
          <span className="roadmap-number">4</span>
          <span className="roadmap-text">Gerar Narrações</span>
        </div>
      </div>
    </div>
  );
};

export default RoadmapSection;