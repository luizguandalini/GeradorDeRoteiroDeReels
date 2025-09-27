import React from 'react';
import './RoadmapSection.css';

const RoadmapSection = ({ 
  selectedTopico, 
  temas = [], 
  selectedTema, 
  roteiro = [],
  narracoesGeradas
}) => {
  // Definir o estado de cada etapa baseado na sequência correta
  const step1Completed = selectedTopico;
  const step2Completed = step1Completed && selectedTema;
  const step3Completed = step2Completed && roteiro && roteiro.length > 0;
  const step4Completed = step3Completed && narracoesGeradas;

  return (
    <div className="roadmap-container">
      <h2>Roadmap de Criação</h2>
      <div className="roadmap-steps">
        <div
          className={`roadmap-step ${
            step1Completed ? "completed" : "active"
          }`}
        >
          <span className="roadmap-number">1</span>
          <span className="roadmap-text">Selecionar Tópico</span>
        </div>
        <div className="roadmap-arrow"></div>

        <div
          className={`roadmap-step ${
            step2Completed
              ? "completed"
              : step1Completed && temas && temas.length > 0
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
            step3Completed ? "completed" : step2Completed ? "active" : ""
          }`}
        >
          <span className="roadmap-number">3</span>
          <span className="roadmap-text">Editar Roteiro</span>
        </div>
        <div className="roadmap-arrow"></div>

        <div className={`roadmap-step ${
          step4Completed ? "completed" : step3Completed ? "active" : ""
        }`}>
          <span className="roadmap-number">4</span>
          <span className="roadmap-text">Gerar Narrações</span>
        </div>
      </div>
    </div>
  );
};

export default RoadmapSection;