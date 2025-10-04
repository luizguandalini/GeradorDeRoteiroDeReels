/**
 * Logger helper - só mostra logs em ambiente de desenvolvimento
 */

const isDevelopment =
  import.meta.env.DEV || import.meta.env.MODE === "development";

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  error: (...args) => {
    // Erros sempre são mostrados, mas sem dados sensíveis
    console.error(...args);
  },

  debug: (...args) => {
    if (isDevelopment) {
      console.log("[DEBUG]", ...args);
    }
  },

  // Para logs que nunca devem ir para produção (tokens, dados sensíveis)
  sensitive: (...args) => {
    if (isDevelopment) {
      console.log("[SENSITIVE]", ...args);
    }
  },
};

export default logger;
