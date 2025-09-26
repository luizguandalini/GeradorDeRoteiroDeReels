import { useEffect, useState } from "react";
import axios from "axios";
import { FaMusic, FaTrash, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import "./AudiosCard.css";

export default function AudiosCard() {
  const [audios, setAudios] = useState([]);
  const API = "http://localhost:5000/api/audios";

  const carregar = async () => {
    try {
      const { data } = await axios.get(API);
      setAudios(data.audios || []);
    } catch (e) {
      console.error(e);
    }
  };

  const deletarTodos = async () => {
    // Verificar se está no modo mock
    try {
      const { data } = await axios.get("http://localhost:5000/api/config/mock");
      const isMockMode = data.mockMode;
      
      toast.info(
        <div>
          <p>Tem certeza que deseja excluir todos os áudios?</p>
          <div className="confirm-actions">
            <button
              className="btn-danger"
              onClick={async () => {
                try {
                  if (isMockMode) {
                    // No modo mock, apenas simular a deleção
                    toast.dismiss();
                    toast.success("Áudios deletados (simulação)!");
                    carregar();
                  } else {
                    // No modo real, fazer a deleção normal
                    await axios.delete(API);
                    toast.dismiss();
                    toast.success("Áudios deletados!");
                    carregar();
                  }
                } catch (e) {
                  toast.error("Falha ao deletar áudios");
                }
              }}
            >
              Deletar
            </button>
            <button className="btn-neutral" onClick={() => toast.dismiss()}>
              Cancelar
            </button>
          </div>
        </div>,
        { autoClose: false }
      );
    } catch (e) {
      console.error("Erro ao verificar modo mock:", e);
      toast.error("Erro ao preparar deleção");
    }
  };

  const baixarTodos = async () => {
    try {
      // Verificar se está no modo mock antes de fazer o download
      const { data } = await axios.get("http://localhost:5000/api/config/mock");
      const isMockMode = data.mockMode;
      
      if (isMockMode) {
        // No modo mock, criar um arquivo de texto simulado para download
        const blob = new Blob(
          ["Este é um arquivo simulado no modo mock. Em um ambiente real, este seria um arquivo ZIP com os áudios gerados."], 
          { type: "text/plain" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "audios_simulados.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.info("Download simulado no modo mock");
      } else {
        // No modo real, fazer o download normal
        window.open(`${API}/download`, "_blank");
      }
    } catch (e) {
      console.error("Erro ao verificar modo mock:", e);
      toast.error("Erro ao fazer download");
    }
  };

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card">
      <h2>
        <FaMusic style={{ marginRight: 8, color: "#8e44ad" }} />
        Narrações Geradas
      </h2>

      {/* LISTA rolável */}
      <div className="audios-container">
        {audios.length === 0 ? (
          <p style={{ margin: "6px 0 14px" }}>Nenhum áudio encontrado.</p>
        ) : (
          <ul className="audios-list">
            {audios.map((a, i) => (
              <li key={i} className="audio-item">
                <span className="audio-name">{typeof a === 'object' ? a.nome : a}</span>
                {typeof a === 'object' && a.duracao && (
                  <span className="audio-duration">{a.duracao}</span>
                )}
                {typeof a === 'string' && (
                  <span className="audio-duration">Calculando...</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* BARRA de ações fora da área rolável (não rola com a lista) */}
      <div className="audios-actions-fixed">
        <button className="btn-danger" onClick={deletarTodos}>
          <FaTrash style={{ marginRight: 6 }} />
          Deletar todos
        </button>
        <button onClick={baixarTodos}>
          <FaDownload style={{ marginRight: 6 }} />
          Baixar todos
        </button>
      </div>
    </div>
  );
}
