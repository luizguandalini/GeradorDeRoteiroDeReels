import React from 'react';
import { FaFilm } from 'react-icons/fa';
import Roteiro from '../Roteiro/Roteiro';
import './ScriptSection.css';

const ScriptSection = ({ roteiro }) => {
  return (
    <div className="card">
      <h2>
        <FaFilm style={{ marginRight: "8px", color: "#e84118" }} />
        Roteiro
      </h2>
      <Roteiro roteiro={roteiro} />
    </div>
  );
};

export default ScriptSection;