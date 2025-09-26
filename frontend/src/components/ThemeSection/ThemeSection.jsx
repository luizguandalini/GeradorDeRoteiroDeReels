import React from 'react';
import { FaLightbulb, FaRobot } from 'react-icons/fa';
import './ThemeSection.css';

const ThemeSection = ({ 
  temas, 
  selectedTema, 
  onSelectTheme 
}) => {
  return (
    <div className="card scrollable">
      <h2>
        <FaLightbulb style={{ marginRight: "8px", color: "#fbc531" }} />
        <FaRobot style={{ marginRight: "8px", color: "#00a8ff" }} />
        Sugestões da IA
      </h2>
      <ul>
        {temas.map((t, i) => (
          <li
            key={i}
            onClick={() => onSelectTheme(t)}
            className={selectedTema === t ? "selected" : ""}
          >
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ThemeSection;