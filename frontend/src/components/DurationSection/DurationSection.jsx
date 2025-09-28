import React from 'react';
import { FaClock } from 'react-icons/fa';
import { useTranslation } from '../../contexts/LanguageContext';
import './DurationSection.css';

const DurationSection = ({
  duracao,
  onDurationChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="card">
      <h2>
        <FaClock style={{ marginRight: "8px", color: "#9c88ff" }} />
        {t('duration.title')}
      </h2>
      <input
        type="number"
        value={duracao}
        onChange={(e) => onDurationChange(e.target.value)}
        min="30"
        className="duracao-input"
      />
    </div>
  );
};

export default DurationSection;
