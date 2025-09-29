import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { FaTrash, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import { useTranslation } from "../../contexts/LanguageContext";
import "./AudiosCard.css";

export default function AudiosCard({ onAudioGenerated, onAudioDeleted }) {
  const { t } = useTranslation();
  const [audios, setAudios] = useState([]);
  const [lastModified, setLastModified] = useState(null);
  const intervalRef = useRef(null);
  const API = "/api/audios";

  const carregar = useCallback(async (forceUpdate = false) => {
    try {
      const { data } = await axios.get(API, {
        params: forceUpdate ? { force: true } : {},
      });

      const currentModified = JSON.stringify(data.audios);
      if (currentModified !== lastModified || forceUpdate) {
        setAudios(data.audios || []);
        setLastModified(currentModified);
        
        // Notificar quando áudio é gerado ou removido
        if (onAudioGenerated && data.audios && data.audios.length > 0) {
          onAudioGenerated();
        }
        if (onAudioDeleted && (!data.audios || data.audios.length === 0)) {
          onAudioDeleted();
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, [API, lastModified, onAudioGenerated, onAudioDeleted]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Só fazer polling se há áudios sendo processados
    if (audios.length > 0 && audios.some(audio => typeof audio === "string")) {
      intervalRef.current = setInterval(() => {
        carregar();
      }, 3000);
    }
  }, [audios, carregar]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const deletarTodos = async () => {
    try {
      const { data } = await axios.get("/api/config/mock");
      const isMockMode = data.mockMode;

      toast.info(
        <div>
          <p>{t("audios.confirmDelete")}</p>
          <div className="confirm-actions">
            <button
              className="btn-danger"
              onClick={async () => {
                try {
                  if (isMockMode) {
                    toast.dismiss();
                    toast.success(t("audios.messages.deleteSimulation"));
                    carregar(true);
                  } else {
                    await axios.delete(API);
                    toast.dismiss();
                    toast.success(t("audios.messages.deleteSuccess"));
                    carregar(true);
                    if (onAudioDeleted) onAudioDeleted(); // Notificar que áudio foi deletado
                  }
                } catch (error) {
                  toast.error(t("audios.messages.deleteError"));
                }
              }}
            >
              {t("audios.actions.confirmDelete")}
            </button>
            <button className="btn-secondary" onClick={() => toast.dismiss()}>
              {t("audios.actions.cancel")}
            </button>
          </div>
        </div>,
        { autoClose: false }
      );
    } catch (error) {
      toast.error(t("audios.messages.modeError"));
    }
  };

  const baixarTodos = async () => {
    try {
      const { data } = await axios.get("/api/config/mock");
      const isMockMode = data.mockMode;

      if (isMockMode) {
        toast.success(t("audios.messages.downloadSimulation"));
      } else {
        // Fazer o download real do arquivo MP3
        const response = await axios.get("/api/audios/download", {
          responseType: 'blob'
        });
        
        // Criar um link temporário para download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Extrair nome do arquivo do header Content-Disposition se disponível
        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'narracao.mp3';
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch) {
            fileName = fileNameMatch[1];
          }
        }
        
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success(t("audios.messages.downloadStarted"));
      }
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error(t("audios.messages.downloadError"));
    }
  };

  useEffect(() => {
    carregar(true);
    startPolling();

    return () => {
      stopPolling();
    };
  }, [carregar, startPolling, stopPolling]);

  useEffect(() => {
    if (intervalRef.current) {
      startPolling();
    }
  }, [audios.length, startPolling]);

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
  }, [carregar, startPolling, stopPolling]);

  return (
    <div className="audio-card">
      <div className="audios-container">
        {audios.length === 0 ? (
          <p style={{ margin: "6px 0 14px" }}>{t("audios.messages.empty")}</p>
        ) : (
          <ul className="audios-list">
            {audios.map((audio, index) => (
              <li key={index} className="audio-item">
                <span className="audio-name">
                  {typeof audio === "object" ? audio.nome : audio}
                </span>
                {typeof audio === "object" && audio.duracao && (
                  <span className="audio-duration">{audio.duracao}</span>
                )}
                {typeof audio === "string" && (
                  <span className="audio-duration">{t("audios.messages.processing")}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="audios-actions-fixed">
        <button className="btn-danger" onClick={deletarTodos}>
          <FaTrash style={{ marginRight: 6 }} />
          {t("audios.actions.deleteAll")}
        </button>
        <button onClick={baixarTodos}>
          <FaDownload style={{ marginRight: 6 }} />
          {t("audios.actions.downloadAll")}
        </button>
      </div>
    </div>
  );
}
