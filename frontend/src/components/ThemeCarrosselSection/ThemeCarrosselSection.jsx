import React from 'react';
import { FaLightbulb, FaRobot, FaImages } from 'react-icons/fa';
import { useTranslation } from '../../contexts/LanguageContext';
import './ThemeCarrosselSection.css';

const ThemeCarrosselSection = ({
  temas,
  selectedTema,
  onSelectTheme
}) => {
  const { t } = useTranslation();

  return (
    <div className="card scrollable theme-carrossel-section">
      <h2>
        <FaLightbulb style={{ marginRight: "8px", color: "#fbc531" }} />
        <FaRobot style={{ marginRight: "8px", color: "#00a8ff" }} />
        <FaImages style={{ marginRight: "8px", color: "#e74c3c" }} />
        {t('themeCarrossel.title')}
      </h2>
      <ul>
        {temas.map((tTema, index) => (
          <li
            key={index}
            onClick={() => onSelectTheme(tTema)}
            className={selectedTema === tTema ? "selected" : ""}
          >
            {tTema}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ThemeCarrosselSection;