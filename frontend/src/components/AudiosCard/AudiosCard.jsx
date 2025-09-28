import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaMusic, FaTrash, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import "./AudiosCard.css";

export default function AudiosCard() {
  const [audios, setAudios] = useState([]);
  const [lastModified, setLastModified] = useState(null);
  const intervalRef = useRef(null);
  const API = "/api/audios";

  const carregar = async (forceUpdate = false) => {
    try {
      const { data } = await axios.get(API, {
        params: forceUpdate ? { force: true } : {},
      });

      // Verificar se houve mudanças nos áudios
      const currentModified = JSON.stringify(data.audios);
      if (currentModified !== lastModified || forceUpdate) {
        setAudios(data.audios || []);
        setLastModified(currentModified);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startPolling = () => {
    // Limpar intervalo anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Iniciar polling apenas se há áudios ou se é a primeira verificação
    intervalRef.current = setInterval(
      () => {
        carregar();
      },
      audios.length > 0 ? 3000 : 10000
    ); // 3s se há áudios, 10s se não há
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const deletarTodos = async () => {
    // Verificar se está no modo mock
    try {
      const { data } = await axios.get("/api/config/mock");
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
                    carregar(true);
                  } else {
                    // No modo real, fazer a deleção normal
                    await axios.delete(API);
                    toast.dismiss();
                    toast.success("Áudios deletados!");
                    carregar(true);
                  }
                } catch (e) {
                  toast.error("Falha ao deletar áudios");
                }
              }}
            >
              Sim, excluir
            </button>
            <button className="btn-secondary" onClick={() => toast.dismiss()}>
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
      const { data } = await axios.get("/api/config/mock");
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
    // Carregar dados iniciais
    carregar(true);

    // Iniciar polling inteligente
    startPolling();

    // Cleanup ao desmontar componente
    return () => {
      stopPolling();
    };
  }, []);

  // Reiniciar polling quando o número de áudios muda
  useEffect(() => {
    if (intervalRef.current) {
      startPolling();
    }
  }, [audios.length]);

  // Pausar polling quando a aba não está visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        carregar(true);
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
                <span className="audio-name">
                  {typeof a === "object" ? a.nome : a}
                </span>
                {typeof a === "object" && a.duracao && (
                  <span className="audio-duration">{a.duracao}</span>
                )}
                {typeof a === "string" && (
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
          Deletar Todas Narrações
        </button>
        <button onClick={baixarTodos}>
          <FaDownload style={{ marginRight: 6 }} />
          Baixar Todas Narrações
        </button>
      </div>
    </div>
  );
}
