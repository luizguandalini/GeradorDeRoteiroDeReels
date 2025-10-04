import React, { useState } from "react";
import RoadmapSection from "../../components/RoadmapSection/RoadmapSection";
import TopicosSection from "../../components/TopicosSection/TopicosSection";
import ThemeSection from "../../components/ThemeSection/ThemeSection";
import DurationSection from "../../components/DurationSection/DurationSection";
import ScriptSection from "../../components/ScriptSection/ScriptSection";
import NarrationSection from "../../components/NarrationSection/NarrationSection";
import "./Home.css";

const Home = ({
  selectedTopico,
  temas,
  selectedTema,
  roteiro,
  narracoesGeradas,
  duracao,
  onSelectTopic,
  onSelectTheme,
  onDurationChange,
  onNarracoesGeradas,
  onSaveRoteiro,
  onSuggestionsGenerated,
  toastConfig,
}) => {
  const [shouldRefreshAudio, setShouldRefreshAudio] = useState(false);

  const handleAudioGenerated = () => {
    setShouldRefreshAudio(true);
  };

  const handleAudioRefreshComplete = () => {
    setShouldRefreshAudio(false);
  };

  return (
    <div className="home-container">
      {/* Roadmap de passos */}
      <RoadmapSection
        selectedTopico={selectedTopico}
        temas={temas}
        selectedTema={selectedTema}
        roteiro={roteiro}
        narracoesGeradas={narracoesGeradas}
      />

      <TopicosSection
        selectedTopico={selectedTopico}
        onSelectTopic={onSelectTopic}
        onSuggestionsGenerated={onSuggestionsGenerated}
        toastConfig={toastConfig}
      />

      <DurationSection duracao={duracao} onDurationChange={onDurationChange} />

      <ThemeSection
        temas={temas}
        selectedTema={selectedTema}
        onSelectTheme={onSelectTheme}
      />

      <ScriptSection
        roteiro={roteiro}
        onSaveRoteiro={onSaveRoteiro}
        onNarracoesGeradas={onNarracoesGeradas}
      />
      <NarrationSection
        roteiro={roteiro}
        narracoesGeradas={narracoesGeradas}
        onNarracoesGeradas={onNarracoesGeradas}
        toastConfig={toastConfig}
      />
    </div>
  );
};

export default Home;
