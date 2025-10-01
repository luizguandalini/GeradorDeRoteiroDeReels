import React from 'react';
import { FaImages } from 'react-icons/fa';
import CarrosselEditor from '../CarrosselEditor/CarrosselEditor';
import { useTranslation } from '../../contexts/LanguageContext';
import './CarrosselSection.css';

const CarrosselSection = ({ carrossel, onSaveCarrossel }) => {
  const { t } = useTranslation();

  return (
    <div className="card">
      <h2>
        <FaImages style={{ marginRight: "8px", color: "#e74c3c" }} />
        {t('carrossel.title')}
      </h2>
      <CarrosselEditor carrossel={carrossel} onSaveCarrossel={onSaveCarrossel} />
    </div>
  );
};

export default CarrosselSection;