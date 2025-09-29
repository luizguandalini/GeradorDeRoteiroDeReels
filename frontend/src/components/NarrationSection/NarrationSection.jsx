import React from 'react';
import { FaFilm } from 'react-icons/fa';
import AudiosCard from '../AudiosCard/AudiosCard';
import { useTranslation } from '../../contexts/LanguageContext';
import './NarrationSection.css';

const NarrationSection = ({ roteiro, onAudioStateChange }) => {
  const { t } = useTranslation();

  return (
    <div className="card">
      <h2>
        <FaFilm style={{ marginRight: "8px", color: "#e84118" }} />
        {t('narration.title')}
      </h2>
      <AudiosCard 
        onAudioGenerated={() => onAudioStateChange && onAudioStateChange(true)}
        onAudioDeleted={() => onAudioStateChange && onAudioStateChange(false)}
      />
    </div>
  );
};

export default NarrationSection;
