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

  const deletarTodos = () => {
    toast.info(
      <div>
        <p>Tem certeza que deseja excluir todos os áudios?</p>
        <div className="confirm-actions">
          <button
            className="btn-danger"
            onClick={async () => {
              try {
                await axios.delete(API);
                toast.dismiss();
                toast.success("Áudios deletados!");
                carregar();
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
  };

  const baixarTodos = () => {
    window.open(`${API}/download`, "_blank");
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
                {a}
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
