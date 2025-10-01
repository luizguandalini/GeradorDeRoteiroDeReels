import React from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import './RoadmapSection.css';

const RoadmapSection = ({
  selectedTopico,
  temas = [],
  selectedTema,
  roteiro = [],
  narracoesGeradas,
  isCarrossel = false,
}) => {
  const { t } = useTranslation();

  const step1Completed = Boolean(selectedTopico);
  const step2Completed = step1Completed && Boolean(selectedTema);
  const step3Completed = step2Completed && roteiro && roteiro.length > 0;
  const step4Completed = step3Completed && (isCarrossel ? true : narracoesGeradas);

  // Definir os passos baseado no tipo (carrossel ou roteiro)
  const steps = isCarrossel ? [
    { key: 'selectTopic', translationKey: 'roadmap.steps.selectTopic' },
    { key: 'chooseSuggestion', translationKey: 'roadmap.steps.chooseSuggestion' },
    { key: 'editCarrossel', translationKey: 'roadmap.steps.editCarrossel' },
    { key: 'downloadPDF', translationKey: 'roadmap.steps.downloadPDF' }
  ] : [
    { key: 'selectTopic', translationKey: 'roadmap.steps.selectTopic' },
    { key: 'chooseSuggestion', translationKey: 'roadmap.steps.chooseSuggestion' },
    { key: 'editScript', translationKey: 'roadmap.steps.editScript' },
    { key: 'generateNarrations', translationKey: 'roadmap.steps.generateNarrations' }
  ];

  const getStepStatus = (stepIndex) => {
    switch (stepIndex) {
      case 0: return step1Completed ? 'completed' : 'active';
      case 1: return step2Completed ? 'completed' : (step1Completed && temas && temas.length > 0) ? 'active' : '';
      case 2: return step3Completed ? 'completed' : step2Completed ? 'active' : '';
      case 3: return step4Completed ? 'completed' : step3Completed ? 'active' : '';
      default: return '';
    }
  };

  return (
    <div className="roadmap-container">
      <h2>{t('roadmap.title')}</h2>
      <div className="roadmap-steps">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className={`roadmap-step ${getStepStatus(index)}`}>
              <span className="roadmap-number">{index + 1}</span>
              <span className="roadmap-text">{t(step.translationKey)}</span>
            </div>
            {index < steps.length - 1 && <div className="roadmap-arrow"></div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default RoadmapSection;
