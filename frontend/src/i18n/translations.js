export const DEFAULT_LANGUAGE = "en";
export const FALLBACK_LANGUAGE = "en";

const translations = {
  en: {
    common: {
      appName: "Shaka",
      languageSelector: "Select language",
      languages: {
        en: "English",
        pt: "Portuguese (Brazil)",
        "pt-BR": "Portuguese (Brazil)",
      },
      messages: {
        languageUpdateError:
          "We couldn't update your language preference. Please try again.",
      },
    },
    app: {
      notifications: {
        mockModeEnabled: "Simulation mode enabled.",
        mockModeDisabled: "Real mode enabled.",
      },
      errors: {
        mockModeChange: "Unable to change the operating mode.",
        loadTopics: "Unable to load AI suggestions.",
        durationRequired: "Please provide the video duration in seconds.",
        durationTooShort: "The minimum duration is 30 seconds.",
        generateScript: "Unable to generate the script.",
      },
    },
    login: {
      header: {
        title: "Shaka",
        subtitle: "Sign in to continue",
      },
      fields: {
        emailPlaceholder: "Email",
        passwordPlaceholder: "Password",
      },
      actions: {
        submit: "Sign in",
        submitting: "Signing in...",
        continueWith: "Or continue with",
      },
      aria: {
        showPassword: "Show password",
        hidePassword: "Hide password",
      },
      validation: {
        emailRequired: "Email is required",
        emailInvalid: "Enter a valid email",
        passwordRequired: "Password is required",
      },
      feedback: {
        googleCredentialMissing:
          "We couldn't get Google credentials. Please try again.",
        googleLoginSuccess: "You're in with Google!",
        googleLoadError: "We couldn't load the Google button.",
        loginSuccess: "Signed in successfully!",
        invalidCredentials:
          "Invalid credentials. Check your information and try again.",
        emailNotFound: "We couldn't find an account with that email.",
        passwordIncorrect: "Incorrect password.",
        connectionError: "Connection error",
        connectionErrorDetailed:
          "Connection error. Check your internet connection and try again.",
      },
      footer: {
        tagline: "Your script in seconds ",
        credit: "Built by Luiz Guandalini ",
      },
    },
    duration: {
      title: "Video Duration (seconds)",
    },
    theme: {
      title: "AI Suggestions",
    },
    script: {
      title: "Script",
    },
    narration: {
      title: "Narrations",
    },
    topicsSection: {
      title: "Manage Topics",
      actions: {
        new: "New Topic",
        update: "Update",
        create: "Create",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
      },
      form: {
        placeholder: "Topic name",
      },
      search: {
        placeholder: "Search topics...",
      },
      messages: {
        loadError: "Unable to load topics.",
        nameRequired: "Topic name is required.",
        updateSuccess: "Topic updated successfully!",
        createSuccess: "Topic created successfully!",
        saveError: "Unable to save the topic.",
        deleteConfirm: 'Are you sure you want to delete the topic "{{name}}"?',
        deleteSuccess: "Topic deleted successfully!",
        deleteError: "Unable to delete the topic.",
      },
      state: {
        loading: "Loading...",
        emptySearch: "No topics found.",
        emptyDefault: "No topics registered.",
      },
      pagination: {
        previous: "Previous",
        next: "Next",
        page: "Page {{current}} of {{total}}",
      },
    },
    audios: {
      confirmDelete: "Are you sure you want to delete the narration?",
      messages: {
        deleteSimulation: "Narration deleted (simulation)!",
        deleteSuccess: "Narration deleted!",
        deleteError: "Failed to delete narration.",
        modeError: "Unable to verify the current mode.",
        downloadSimulation: "Simulated download started!",
        downloadStarted: "Download started!",
        downloadError: "Failed to download narration.",
        empty: "No narrations found.",
        processing: "Processing...",
      },
      actions: {
        confirmDelete: "Yes, delete",
        cancel: "Cancel",
        deleteAll: "Delete Narration",
        downloadAll: "Download Narration",
      },
    },
    roadmap: {
      title: "Creation Roadmap",
      steps: {
        selectTopic: "Select Topic",
        chooseSuggestion: "Choose Suggestion",
        editScript: "Edit Script",
        generateNarrations: "Generate Narrations",
      },
    },
    sidebar: {
      header: {
        menu: "Menu",
      },
      greetings: {
        morning: "Good morning",
        afternoon: "Good afternoon",
        evening: "Good evening",
        night: "Good night",
      },
      titles: {
        adminNickname: "Boss",
        defaultUser: "User",
      },
      menu: {
        home: "Home",
        settings: "System Settings",
        consumption: "Service Usage",
      },
      actions: {
        expand: "Expand sidebar",
        collapse: "Collapse sidebar",
        logout: "Sign out",
        switchToLight: "Switch to light mode",
        switchToDark: "Switch to dark mode",
        lightMode: "Light Mode",
        darkMode: "Dark Mode",
        enableMockMode: "Switch to simulation mode",
        enableRealMode: "Switch to real mode",
        mockMode: "Simulation Mode",
        realMode: "Real Mode",
      },
      status: {
        simulation: "SIMULATION",
        real: "REAL",
      },
    },
    consumption: {
      title: "Service Usage",
      services: {
        openRouter: "OpenRouter",
        elevenLabs: "ElevenLabs",
      },
      labels: {
        usage: "Usage so far",
        limit: "Total limit",
        remaining: "Remaining",
        plan: "Current plan",
        characters: "Characters",
        charactersUsed: "Characters used",
        charactersRemaining: "Characters remaining",
        charactersLimit: "Characters per month",
        readable: "Readable format",
        complete: "Complete format",
      },
      messages: {
        loading: "Loading usage information...",
        error: "Error loading usage information",
        noLimit: "No limit associated (probably pay-as-you-go plan)",
        payAsYouGo: "Balance works as post-paid billing",
        keyNotConfigured: "API key not configured",
      },
      actions: {
        refresh: "Refresh",
      },
    },
  },
  "pt-BR": {
    common: {
      appName: "Shaka",
      languageSelector: "Selecionar idioma",
      languages: {
        en: "Inglês",
        pt: "Português (Brasil)",
        "pt-BR": "Português (Brasil)",
      },
      messages: {
        languageUpdateError:
          "Não foi possível atualizar sua preferência de idioma. Tente novamente.",
      },
    },
    app: {
      notifications: {
        mockModeEnabled: "Modo simulação ativado.",
        mockModeDisabled: "Modo real ativado.",
      },
      errors: {
        mockModeChange: "Não foi possível alterar o modo de operação.",
        loadTopics: "Não foi possível carregar as sugestões da IA.",
        durationRequired: "Informe a duração do vídeo em segundos.",
        durationTooShort: "A duração mínima é de 30 segundos.",
        generateScript: "Não foi possível gerar o roteiro.",
      },
    },
    login: {
      header: {
        title: "Shaka",
        subtitle: "Faça login para continuar",
      },
      fields: {
        emailPlaceholder: "Email",
        passwordPlaceholder: "Senha",
      },
      actions: {
        submit: "Entrar",
        submitting: "Entrando...",
        continueWith: "Ou continue com",
      },
      aria: {
        showPassword: "Mostrar senha",
        hidePassword: "Ocultar senha",
      },
      validation: {
        emailRequired: "Email é obrigatório",
        emailInvalid: "Informe um email válido",
        passwordRequired: "Senha é obrigatória",
      },
      feedback: {
        googleCredentialMissing:
          "Não foi possível obter as credenciais do Google. Tente novamente.",
        googleLoginSuccess: "Login com Google realizado com sucesso!",
        googleLoadError: "Não foi possível carregar o botão do Google.",
        loginSuccess: "Login realizado com sucesso!",
        invalidCredentials:
          "Credenciais inválidas. Verifique as informações e tente novamente.",
        emailNotFound: "Não encontramos uma conta com esse email.",
        passwordIncorrect: "Senha incorreta.",
        connectionError: "Erro de conexão",
        connectionErrorDetailed:
          "Erro de conexão. Verifique sua internet e tente novamente.",
      },
      footer: {
        tagline: "Seu roteiro em segundos",
        credit: "Desenvolvido por Luiz Guandalini",
      },
    },
    duration: {
      title: "Duração do Vídeo (segundos)",
    },
    theme: {
      title: "Sugestões da IA",
    },
    script: {
      title: "Roteiro",
    },
    narration: {
      title: "Narrações",
    },
    topicsSection: {
      title: "Gerenciar Tópicos",
      actions: {
        new: "Novo Tópico",
        update: "Atualizar",
        create: "Criar",
        cancel: "Cancelar",
        edit: "Editar",
        delete: "Excluir",
      },
      form: {
        placeholder: "Nome do tópico",
      },
      search: {
        placeholder: "Buscar tópicos...",
      },
      messages: {
        loadError: "Erro ao carregar tópicos",
        nameRequired: "Nome do tópico é obrigatório",
        updateSuccess: "Tópico atualizado com sucesso!",
        createSuccess: "Tópico criado com sucesso!",
        saveError: "Erro ao salvar tópico",
        deleteConfirm: 'Tem certeza que deseja excluir o tópico "{{name}}"?',
        deleteSuccess: "Tópico excluído com sucesso!",
        deleteError: "Erro ao excluir tópico",
      },
      state: {
        loading: "Carregando...",
        emptySearch: "Nenhum tópico encontrado",
        emptyDefault: "Nenhum tópico cadastrado",
      },
      pagination: {
        previous: "Anterior",
        next: "Próxima",
        page: "Página {{current}} de {{total}}",
      },
    },
    audios: {
      confirmDelete: "Tem certeza que deseja excluir a narração?",
      messages: {
        deleteSimulation: "Narração deletada (simulação)!",
        deleteSuccess: "Narração deletada!",
        deleteError: "Falha ao deletar narração",
        modeError: "Erro ao verificar modo de operação",
        downloadSimulation: "Download simulado iniciado!",
        downloadStarted: "Download iniciado!",
        downloadError: "Falha ao baixar narração",
        empty: "Nenhuma narração encontrada.",
        processing: "Processando...",
      },
      actions: {
        confirmDelete: "Sim, excluir",
        cancel: "Cancelar",
        deleteAll: "Deletar Narração",
        downloadAll: "Baixar Narração",
      },
    },
    roadmap: {
      title: "Roadmap de Criação",
      steps: {
        selectTopic: "Selecionar Tópico",
        chooseSuggestion: "Escolher Sugestão",
        editScript: "Editar Roteiro",
        generateNarrations: "Gerar Narrações",
      },
    },
    sidebar: {
      header: {
        menu: "Menu",
      },
      greetings: {
        morning: "Bom dia",
        afternoon: "Boa tarde",
        evening: "Boa noite",
        night: "Boa madrugada",
      },
      titles: {
        adminNickname: "Patrão",
        defaultUser: "Usuário",
      },
      menu: {
        home: "Página Inicial",
        settings: "Configurações do Sistema",
        consumption: "Consumo dos Serviços",
      },
      actions: {
        expand: "Expandir sidebar",
        collapse: "Recolher sidebar",
        logout: "Sair",
        switchToLight: "Ir para o modo claro",
        switchToDark: "Ir para o modo escuro",
        lightMode: "Modo Claro",
        darkMode: "Modo Escuro",
        enableMockMode: "Ativar modo simulação",
        enableRealMode: "Ativar modo real",
        mockMode: "Modo Simulação",
        realMode: "Modo Real",
      },
      status: {
        simulation: "SIMULAÇÃO",
        real: "REAL",
      },
    },
    consumption: {
      title: "Consumo dos Serviços",
      services: {
        openRouter: "OpenRouter",
        elevenLabs: "ElevenLabs",
      },
      labels: {
        usage: "Uso até agora",
        limit: "Limite total",
        remaining: "Restante",
        plan: "Plano atual",
        characters: "Caracteres",
        charactersUsed: "Caracteres usados",
        charactersRemaining: "Caracteres restantes",
        charactersLimit: "Caracteres por mês",
        readable: "Formato legível",
        complete: "Formato completo",
      },
      messages: {
        loading: "Carregando informações de consumo...",
        error: "Erro ao carregar informações de consumo",
        noLimit: "Nenhum limite associado (provavelmente plano pay-as-you-go)",
        payAsYouGo: "Saldo funciona como cobrança pós-paga",
        keyNotConfigured: "Chave da API não configurada",
      },
      actions: {
        refresh: "Atualizar",
      },
    },
  },
};

const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, segment) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, segment)) {
      return acc[segment];
    }
    return undefined;
  }, obj);
};

const applyVariables = (template, variables = {}) => {
  if (typeof template !== "string") {
    return template;
  }

  return Object.keys(variables).reduce((acc, key) => {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    return acc.replace(pattern, variables[key]);
  }, template);
};

export const translate = (language, key, variables) => {
  if (!key) {
    return "";
  }

  const normalize = (value) => (typeof value === "string" ? value : "");

  const primary = getNestedValue(translations[language], key);
  if (primary !== undefined) {
    return applyVariables(primary, variables);
  }

  const fallback = getNestedValue(translations[FALLBACK_LANGUAGE], key);
  if (fallback !== undefined) {
    return applyVariables(fallback, variables);
  }

  console.warn(
    `Missing translation for key '${key}' in language '${language}'`
  );
  return normalize(key);
};

export const getTranslationsFor = (language) =>
  translations[language] || translations[FALLBACK_LANGUAGE];

export default translations;
