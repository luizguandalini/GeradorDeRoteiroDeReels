import React from "react";
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
  toastConfig,
}) => {
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
        onNarracoesGeradas={onNarracoesGeradas}
      />

      <NarrationSection roteiro={roteiro} />
    </div>
  );
};

export default Home;
