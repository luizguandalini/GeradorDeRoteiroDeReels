export const SUPPORTED_LANGUAGES = ["pt-BR", "en"];
export const DEFAULT_LANGUAGE = "pt-BR";

export const normalizeLanguage = (value) => {
  if (!value) {
    return DEFAULT_LANGUAGE;
  }

  const normalized = value.trim();
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : DEFAULT_LANGUAGE;
};
