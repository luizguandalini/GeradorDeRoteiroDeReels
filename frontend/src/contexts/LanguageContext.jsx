import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { DEFAULT_LANGUAGE, translate } from "../i18n/translations";

const LanguageContext = createContext(null);

const LOCAL_STORAGE_KEY = "preferredLanguage";

// Idiomas suportados - deve corresponder ao backend
const SUPPORTED_LANGUAGES = ["pt-BR", "en"];

// Função para validar se o idioma é suportado
const isValidLanguage = (language) => {
  return SUPPORTED_LANGUAGES.includes(language);
};

const safeGetStoredLanguage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to access localStorage for language preference:", error);
    return null;
  }
};

const safePersistLanguage = (language) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, language);
  } catch (error) {
    console.warn("Unable to persist language preference:", error);
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const storedLanguage = safeGetStoredLanguage();
    // Validar idioma armazenado, usar padrão se inválido
    return isValidLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
  });
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  useEffect(() => {
    if (!isBootstrapped) {
      setIsBootstrapped(true);
    }
  }, [isBootstrapped]);

  const setLanguage = useCallback((nextLanguage, options = {}) => {
    // Validar idioma antes de definir
    if (!isValidLanguage(nextLanguage)) {
      console.warn(`Idioma inválido: ${nextLanguage}. Usando idioma padrão: ${DEFAULT_LANGUAGE}`);
      nextLanguage = DEFAULT_LANGUAGE;
    }
    
    const normalizedLanguage = nextLanguage || DEFAULT_LANGUAGE;
    setLanguageState(normalizedLanguage);

    if (options.persistLocalStorage !== false) {
      safePersistLanguage(normalizedLanguage);
    }
  }, []);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key, variables) => translate(language, key, variables),
    isBootstrapped,
    isValidLanguage, // Exportar função de validação
    supportedLanguages: SUPPORTED_LANGUAGES // Exportar idiomas suportados
  }), [language, setLanguage, isBootstrapped]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const useTranslation = () => {
  const { t, language, setLanguage } = useLanguage();
  return { t, language, setLanguage };
};
