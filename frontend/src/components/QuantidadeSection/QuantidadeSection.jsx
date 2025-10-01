import React from 'react';
import { FaImages } from 'react-icons/fa';
import { useTranslation } from '../../contexts/LanguageContext';
import './QuantidadeSection.css';

const QuantidadeSection = ({
  quantidade,
  onQuantidadeChange
}) => {
  const { t } = useTranslation();

  const quantidadeOptions = [
    { value: 2, key: 'slides_2' },
    { value: 3, key: 'slides_3' },
    { value: 4, key: 'slides_4' },
    { value: 5, key: 'slides_5' },
    { value: 6, key: 'slides_6' },
    { value: 7, key: 'slides_7' },
    { value: 8, key: 'slides_8' }
  ];

  const formatSlides = (num) => {
    return num === 1 ? `${num} slide` : `${num} slides`;
  };

  return (
    <div className="card">
      <h2>
        <FaImages style={{ marginRight: "8px", color: "#e74c3c" }} />
        {t('quantidade.title')}
      </h2>
      <p className="quantidade-note">
        {t('quantidade.note')}
      </p>
      <div className="quantidade-options">
        {quantidadeOptions.map((option) => (
          <button
            key={option.value}
            className={`quantidade-option ${parseInt(quantidade) === option.value ? 'selected' : ''}`}
            onClick={() => onQuantidadeChange(option.value.toString())}
          >
            <span className="quantidade-number">{option.value}</span>
            <span className="quantidade-formatted">({formatSlides(option.value)})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuantidadeSection;