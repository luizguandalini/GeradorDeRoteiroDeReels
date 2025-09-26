import React from 'react';
import { FaFilm } from 'react-icons/fa';
import Roteiro from '../Roteiro/Roteiro';
import './ScriptSection.css';

const ScriptSection = ({ roteiro, onNarracoesGeradas }) => {
  return (
    <div className="card">
      <h2>
        <FaFilm style={{ marginRight: "8px", color: "#e84118" }} />
        Roteiro
      </h2>
      <Roteiro roteiro={roteiro} onNarracoesGeradas={onNarracoesGeradas} />
    </div>
  );
};

export default ScriptSection;