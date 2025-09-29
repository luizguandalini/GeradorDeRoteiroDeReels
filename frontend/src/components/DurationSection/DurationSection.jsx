import React from 'react';
import { FaClock } from 'react-icons/fa';
import { useTranslation } from '../../contexts/LanguageContext';
import './DurationSection.css';

const DurationSection = ({
  duracao,
  onDurationChange
}) => {
  const { t } = useTranslation();

  const durationOptions = [
    { value: 30, key: 'duration_30s' },
    { value: 60, key: 'duration_60s' },
    { value: 90, key: 'duration_90s' },
    { value: 120, key: 'duration_120s' }
  ];

  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds % 60 === 0) {
      return `${seconds / 60}m`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  return (
    <div className="card">
      <h2>
        <FaClock style={{ marginRight: "8px", color: "#9c88ff" }} />
        {t('duration.title')}
      </h2>
      <p className="duration-estimate-note">
        {t('duration.estimateNote')}
      </p>
      <div className="duration-options">
        {durationOptions.map((option) => (
          <button
            key={option.value}
            className={`duration-option ${parseInt(duracao) === option.value ? 'selected' : ''}`}
            onClick={() => onDurationChange(option.value.toString())}
          >
            <span className="duration-seconds">{option.value}s</span>
            <span className="duration-formatted">({formatDuration(option.value)})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DurationSection;
