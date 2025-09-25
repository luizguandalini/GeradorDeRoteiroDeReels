import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import "./PlanilhaForm.css";

function PlanilhaForm({ onSubmit }) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="planilha-form">
      <input
        type="text"
        placeholder="URL da planilha"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="planilha-input"
      />
      <button type="submit" className="botao-buscar">
        <FaSearch />
        Buscar tópicos da planilha
      </button>
    </form>
  );
}

export default PlanilhaForm;
