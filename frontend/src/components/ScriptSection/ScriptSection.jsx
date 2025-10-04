import React from "react";
import { FaFilm } from "react-icons/fa";
import Roteiro from "../Roteiro/Roteiro";
import { useTranslation } from "../../contexts/LanguageContext";
import "./ScriptSection.css";

const ScriptSection = ({
  roteiro,
  onSaveRoteiro,
  onNarracoesGeradas,
  onAudioGenerated,
}) => {
  const { t } = useTranslation();

  return (
    <div className="card">
      <h2>
        <FaFilm style={{ marginRight: "8px", color: "#e84118" }} />
        {t("script.title")}
      </h2>
      <Roteiro
        roteiro={roteiro}
        onSaveRoteiro={onSaveRoteiro}
        onNarracoesGeradas={onNarracoesGeradas}
        onAudioGenerated={onAudioGenerated}
      />
    </div>
  );
};

export default ScriptSection;
