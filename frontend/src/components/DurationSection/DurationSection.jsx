import React from 'react';
import { FaClock } from 'react-icons/fa';
import './DurationSection.css';

const DurationSection = ({ 
  duracao, 
  onDurationChange 
}) => {
  return (
    <div className="card">
      <h2>
        <FaClock style={{ marginRight: "8px", color: "#9c88ff" }} />
        Duração do Vídeo (segundos)
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