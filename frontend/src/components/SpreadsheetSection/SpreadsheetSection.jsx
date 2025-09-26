import React from 'react';
import { FaTable } from 'react-icons/fa';
import './SpreadsheetSection.css';

const SpreadsheetSection = ({ 
  valores, 
  selectedValor, 
  onSelectTopic 
}) => {
  return (
    <div className="card scrollable">
      <h2>
        <FaTable style={{ marginRight: "8px" }} />
        Tópicos da Planilha
      </h2>
      <ul>
        {valores.map((v, i) => (
          <li
            key={i}
            onClick={() => onSelectTopic(v)}
            className={selectedValor === v ? "selected" : ""}
          >
            {v}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SpreadsheetSection;