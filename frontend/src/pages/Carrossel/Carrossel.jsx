import React, { useState } from "react";
import RoadmapSection from "../../components/RoadmapSection/RoadmapSection";
import TopicosSection from "../../components/TopicosSection/TopicosSection";
import ThemeCarrosselSection from "../../components/ThemeCarrosselSection/ThemeCarrosselSection";
import QuantidadeSection from "../../components/QuantidadeSection/QuantidadeSection";
import CarrosselSection from "../../components/CarrosselSection/CarrosselSection";
import "./Carrossel.css";

const Carrossel = ({
  selectedTopico,
  temasCarrossel,
  selectedTemaCarrossel,
  carrossel,
  quantidade,
  onSelectTopic,
  onSelectTheme,
  onQuantidadeChange,
  onSaveCarrossel,
  onSuggestionsGenerated,
  toastConfig,
}) => {
  return (
    <div className="carrossel-container">
      {/* Roadmap de passos */}
      <RoadmapSection
        selectedTopico={selectedTopico}
        temas={temasCarrossel}
        selectedTema={selectedTemaCarrossel}
        roteiro={carrossel}
        isCarrossel={true}
      />

      {/* Seção de Tópicos */}
      <TopicosSection
        selectedTopico={selectedTopico}
        onSelectTopic={onSelectTopic}
        onSuggestionsGenerated={onSuggestionsGenerated}
        toastConfig={toastConfig}
        isCarrossel={true}
      />

      {/* Seção de Quantidade de Slides - Sempre visível */}
      <QuantidadeSection
        quantidade={quantidade}
        onQuantidadeChange={onQuantidadeChange}
      />

      {/* Seção de Temas de Carrossel */}
      {selectedTopico && (
        <ThemeCarrosselSection
          selectedTopico={selectedTopico}
          temas={temasCarrossel}
          selectedTema={selectedTemaCarrossel}
          onSelectTheme={onSelectTheme}
          toastConfig={toastConfig}
        />
      )}

      {/* Seção do Carrossel */}
      {carrossel && carrossel.length > 0 && (
        <CarrosselSection
          carrossel={carrossel}
          onSaveCarrossel={onSaveCarrossel}
          toastConfig={toastConfig}
        />
      )}
    </div>
  );
};

export default Carrossel;