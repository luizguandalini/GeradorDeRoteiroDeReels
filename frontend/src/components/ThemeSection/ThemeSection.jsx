import React from 'react';
import { FaLightbulb, FaRobot } from 'react-icons/fa';
import { useTranslation } from '../../contexts/LanguageContext';
import './ThemeSection.css';

const ThemeSection = ({
  temas,
  selectedTema,
  onSelectTheme
}) => {
  const { t } = useTranslation();

  return (
    <div className="card scrollable theme-section">
      <h2>
        <FaLightbulb style={{ marginRight: "8px", color: "#fbc531" }} />
        <FaRobot style={{ marginRight: "8px", color: "#00a8ff" }} />
        {t('theme.title')}
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

export default ThemeSection;
