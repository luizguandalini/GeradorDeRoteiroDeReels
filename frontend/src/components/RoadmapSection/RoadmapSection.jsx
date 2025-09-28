import React from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import './RoadmapSection.css';

const RoadmapSection = ({
  selectedTopico,
  temas = [],
  selectedTema,
  roteiro = [],
  narracoesGeradas,
}) => {
  const { t } = useTranslation();

  const step1Completed = Boolean(selectedTopico);
  const step2Completed = step1Completed && Boolean(selectedTema);
  const step3Completed = step2Completed && roteiro && roteiro.length > 0;
  const step4Completed = step3Completed && narracoesGeradas;

  return (
    <div className="roadmap-container">
      <h2>{t('roadmap.title')}</h2>
      <div className="roadmap-steps">
        <div className={`roadmap-step ${step1Completed ? 'completed' : 'active'}`}>
          <span className="roadmap-number">1</span>
          <span className="roadmap-text">{t('roadmap.steps.selectTopic')}</span>
        </div>
        <div className="roadmap-arrow"></div>

        <div
          className={`roadmap-step ${
            step2Completed
              ? 'completed'
              : step1Completed && temas && temas.length > 0
              ? 'active'
              : ''
          }`}
        >
          <span className="roadmap-number">2</span>
          <span className="roadmap-text">{t('roadmap.steps.chooseSuggestion')}</span>
        </div>
        <div className="roadmap-arrow"></div>

        <div className={`roadmap-step ${step3Completed ? 'completed' : step2Completed ? 'active' : ''}`}>
          <span className="roadmap-number">3</span>
          <span className="roadmap-text">{t('roadmap.steps.editScript')}</span>
        </div>
        <div className="roadmap-arrow"></div>

        <div className={`roadmap-step ${step4Completed ? 'completed' : step3Completed ? 'active' : ''}`}>
          <span className="roadmap-number">4</span>
          <span className="roadmap-text">{t('roadmap.steps.generateNarrations')}</span>
        </div>
      </div>
    </div>
  );
};

export default RoadmapSection;
