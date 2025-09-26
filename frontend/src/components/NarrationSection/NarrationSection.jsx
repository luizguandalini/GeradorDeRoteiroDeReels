import React from 'react';
import { FaFilm } from 'react-icons/fa';
import AudiosCard from '../AudiosCard/AudiosCard';
import './NarrationSection.css';

const NarrationSection = ({ roteiro }) => {
  return (
    <div className="card">
      <h2>
        <FaFilm style={{ marginRight: "8px", color: "#e84118" }} />
        Narrações
      </h2>
      <AudiosCard roteiro={roteiro} />
    </div>
  );
};

export default NarrationSection;