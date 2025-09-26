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
              Sim, excluir
            </button>
            <button
              className="btn-secondary"
              onClick={() => toast.dismiss()}
            >
              Cancelar
            </button>
          </div>
        </div>,
        { autoClose: false }
      );
    } catch (e) {
      toast.error("Erro ao verificar modo de operação");
    }
  };

  const baixarTodos = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/config/mock");
      const isMockMode = data.mockMode;
      
      if (isMockMode) {
        toast.success("Download simulado iniciado!");
      } else {
        // Aqui seria a lógica real de download
        toast.success("Download iniciado!");
      }
    } catch (e) {
      toast.error("Falha ao baixar áudios");
    }
  };

  useEffect(() => {
    carregar();
    // Atualizar a cada 5 segundos
    const id = setInterval(() => {
      carregar();
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="audio-card">
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
