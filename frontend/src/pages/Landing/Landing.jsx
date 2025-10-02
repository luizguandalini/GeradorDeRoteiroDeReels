import React from "react";
import { useTranslation } from "../../contexts/LanguageContext";
import "./Landing.css";

const Landing = () => {
  const { t } = useTranslation();

  return (
    <div className="landing-container">
      <h1>{t("landing.title")}</h1>
      <p>{t("landing.description")}</p>
    </div>
  );
};

export default Landing;
