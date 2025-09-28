import React from "react";
import { useTranslation } from "../../contexts/LanguageContext";
import "./LanguageSwitch.css";

const FlagIcon = ({ code }) => {
  switch (code) {
    case "en":
      return (
        <svg
          className="flag-icon"
          viewBox="0 0 64 48"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <rect width="64" height="48" fill="#b22234" />
          <rect y="6" width="64" height="6" fill="#ffffff" />
          <rect y="18" width="64" height="6" fill="#ffffff" />
          <rect y="30" width="64" height="6" fill="#ffffff" />
          <rect y="42" width="64" height="6" fill="#ffffff" />
          <rect width="28" height="24" fill="#3c3b6e" />
          <g fill="#ffffff">
            {[...Array(30)].map((_, index) => {
              const row = Math.floor(index / 6);
              const col = index % 6;
              const offsetY = row * 4 + 4;
              const offsetX = col * 4 + ((row % 2) * 2) + 4;
              return (
                <circle key={`${row}-${col}`} cx={offsetX} cy={offsetY} r="0.9" />
              );
            })}
          </g>
        </svg>
      );
    case "pt-BR":
      return (
        <svg
          className="flag-icon"
          viewBox="0 0 64 48"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <rect width="64" height="48" fill="#009c3b" />
          <polygon points="32,8 56,24 32,40 8,24" fill="#ffdf00" />
          <circle cx="32" cy="24" r="9" fill="#002776" />
          <path
            d="M23 22.5a12.5 12.5 0 0 1 18 0"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
};


const LanguageSwitch = ({ value, onChange, disabled = false, showLabels = true, size = "md", className = "" }) => {
  const { t } = useTranslation();

  const options = [
    { code: "en", name: t("common.languages.en"), shortLabel: "EN" },
    { code: "pt-BR", name: t("common.languages.pt"), shortLabel: "PT" },
  ];

  const handleSelect = (code) => {
    if (disabled || code === value) {
      return;
    }

    if (onChange) {
      onChange(code);
    }
  };

  return (
    <div
      className={`language-switch size-${size} ${showLabels ? "" : "compact"} ${disabled ? "is-disabled" : ""} ${className}`.trim()}
      role="group"
      aria-label={t("common.languageSelector")}
    >
      {options.map((option) => (
        <button
          key={option.code}
          type="button"
          className={`language-option ${value === option.code ? "active" : ""}`.trim()}
          onClick={() => handleSelect(option.code)}
          disabled={disabled}
          aria-pressed={value === option.code}
        >
          <span className="language-flag" aria-hidden="true">
            <FlagIcon code={option.code} />
          </span>
          {showLabels && <span className="language-label">{option.name}</span>}
          {!showLabels && <span className="language-label" aria-hidden="true">{option.shortLabel}</span>}
        </button>
      ))}
    </div>
  );
};


export default LanguageSwitch;

