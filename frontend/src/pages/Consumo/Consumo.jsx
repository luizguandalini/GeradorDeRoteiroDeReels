import React, { useState, useEffect } from "react";
import { FaSync, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "../../contexts/LanguageContext";
import "./Consumo.css";

const Consumo = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConsumptionData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await axios.get("/api/consumo");
      
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error("Resposta inválida do servidor");
      }

      if (showRefreshToast) {
        toast.success("Informações atualizadas com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao carregar dados de consumo:", err);
      setError(err.response?.data?.error || err.message || "Erro desconhecido");
      
      if (showRefreshToast) {
        toast.error(t("consumption.messages.error"));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConsumptionData();
  }, []);

  const handleRefresh = () => {
    fetchConsumptionData(true);
  };

  const formatCurrency = (currencyData) => {
    if (!currencyData) return "N/A";
    return {
      readable: currencyData.readable || "N/A",
      complete: currencyData.complete || "N/A"
    };
  };

  const ServiceCard = ({ title, children, status = "success" }) => (
    <div className={`service-card ${status}`}>
      <div className="service-header">
        <h3 className="service-title">{title}</h3>
        <div className={`service-status ${status}`}>
          {status === "success" && <FaCheckCircle />}
          {status === "error" && <FaExclamationTriangle />}
        </div>
      </div>
      <div className="service-content">
        {children}
      </div>
    </div>
  );

  const DataRow = ({ label, value, subtitle = null }) => (
    <div className="data-row">
      <span className="data-label">{label}:</span>
      <div className="data-value">
        <span className="primary-value">{value}</span>
        {subtitle && <span className="subtitle-value">{subtitle}</span>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="consumo-container">
        <div className="consumo-header">
          <h1 className="consumo-title">{t("consumption.title")}</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>{t("consumption.messages.loading")}</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="consumo-container">
        <div className="consumo-header">
          <h1 className="consumo-title">{t("consumption.title")}</h1>
          <button 
            className="refresh-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSync className={refreshing ? "spinning" : ""} />
            {t("consumption.actions.refresh")}
          </button>
        </div>
        <div className="error-state">
          <FaExclamationTriangle className="error-icon" />
          <h3>{t("consumption.messages.error")}</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="consumo-container">
      <div className="consumo-header">
        <h1 className="consumo-title">{t("consumption.title")}</h1>
        <button 
          className="refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FaSync className={refreshing ? "spinning" : ""} />
          {t("consumption.actions.refresh")}
        </button>
      </div>

      <div className="services-grid">
        {/* OpenRouter Card */}
        <ServiceCard 
          title={t("consumption.services.openRouter")}
          status={data?.openRouter?.success ? "success" : "error"}
        >
          {data?.openRouter?.error ? (
            <div className="error-content">
              <p>{data.openRouter.error}</p>
            </div>
          ) : (
            <>
              <DataRow
                label={t("consumption.labels.usage")}
                value={formatCurrency(data?.openRouter?.usage).readable}
                subtitle={`${t("consumption.labels.complete")}: ${formatCurrency(data?.openRouter?.usage).complete}`}
              />
              
              {data?.openRouter?.hasLimit ? (
                <>
                  <DataRow
                    label={t("consumption.labels.limit")}
                    value={formatCurrency(data?.openRouter?.limit).readable}
                    subtitle={`${t("consumption.labels.complete")}: ${formatCurrency(data?.openRouter?.limit).complete}`}
                  />
                  <DataRow
                    label={t("consumption.labels.remaining")}
                    value={formatCurrency(data?.openRouter?.limitRemaining).readable}
                    subtitle={`${t("consumption.labels.complete")}: ${formatCurrency(data?.openRouter?.limitRemaining).complete}`}
                  />
                </>
              ) : (
                <div className="info-message">
                  <p>{t("consumption.messages.noLimit")}</p>
                  <p>{t("consumption.messages.payAsYouGo")}</p>
                </div>
              )}
            </>
          )}
        </ServiceCard>

        {/* ElevenLabs Card */}
        <ServiceCard 
          title={t("consumption.services.elevenLabs")}
          status={data?.elevenLabs?.success ? "success" : "error"}
        >
          {data?.elevenLabs?.error ? (
            <div className="error-content">
              <p>{data.elevenLabs.error}</p>
            </div>
          ) : (
            <>
              <DataRow
                label={t("consumption.labels.plan")}
                value={data?.elevenLabs?.tier || "N/A"}
              />
              <DataRow
                label={t("consumption.labels.charactersLimit")}
                value={data?.elevenLabs?.characterLimit || "0"}
              />
              <DataRow
                label={t("consumption.labels.charactersUsed")}
                value={data?.elevenLabs?.characterCount || "0"}
              />
              <DataRow
                label={t("consumption.labels.charactersRemaining")}
                value={data?.elevenLabs?.characterRemaining || "0"}
              />
            </>
          )}
        </ServiceCard>
      </div>

      {data && (
        <div className="last-updated">
          <p>
            Última atualização: {new Date(data.timestamp || Date.now()).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default Consumo;