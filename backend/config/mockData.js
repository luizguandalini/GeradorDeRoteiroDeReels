// Dados mock para todas as APIs

// Mock para a API de planilha
export const planilhaMock = {
  valores: [
    "Dicas de produtividade",
    "Receitas rápidas",
    "Exercícios em casa",
    "Tecnologia para iniciantes",
    "Dicas de viagem"
  ]
};

// Mock para a API de temas
export const temasMock = {
  temas: [
    "Como organizar sua rotina diária",
    "Aplicativos essenciais para produtividade",
    "Técnica Pomodoro explicada",
    "Dicas para reuniões eficientes",
    "Como evitar procrastinação"
  ]
};

// Mock para a API de roteiro
export const roteiroMock = {
  roteiro: [
    {
      narracao: "Você já se sentiu sobrecarregado com tantas tarefas para fazer? Neste vídeo vamos te mostrar como organizar sua rotina de forma eficiente.",
      imagem: "Pessoa estressada com muitas notas adesivas e tarefas pendentes."
    },
    {
      narracao: "O primeiro passo é listar todas as suas tarefas em um único lugar. Pode ser um aplicativo ou um caderno físico.",
      imagem: "Mão escrevendo em um caderno ou usando um aplicativo de lista de tarefas no celular."
    },
    {
      narracao: "Em seguida, classifique suas tarefas por prioridade. O que precisa ser feito hoje? O que pode esperar até amanhã?",
      imagem: "Lista de tarefas com códigos de cores indicando diferentes níveis de prioridade."
    },
    {
      narracao: "Reserve blocos de tempo específicos para cada tarefa importante. Isso ajuda a manter o foco e evitar distrações.",
      imagem: "Calendário ou agenda com blocos de tempo coloridos para diferentes atividades."
    },
    {
      narracao: "Não se esqueça de incluir pausas na sua programação. Elas são essenciais para manter a produtividade ao longo do dia.",
      imagem: "Pessoa relaxando, tomando café ou fazendo um breve exercício de alongamento."
    },
    {
      narracao: "Por fim, revise sua rotina regularmente e ajuste conforme necessário. O que funciona hoje pode não funcionar amanhã.",
      imagem: "Pessoa analisando um calendário ou lista de tarefas e fazendo ajustes."
    }
  ]
};

// Mock para a API de narrações (retorna caminhos de arquivos de áudio)
export const narracoesMock = {
  caminhos: [
    "/audios/narracao_mock_1.mp3",
    "/audios/narracao_mock_2.mp3",
    "/audios/narracao_mock_3.mp3",
    "/audios/narracao_mock_4.mp3",
    "/audios/narracao_mock_5.mp3",
    "/audios/narracao_mock_6.mp3"
  ]
};

// Mock para a API de áudios (lista de arquivos)
export const audiosMock = {
  audios: [
    {
      nome: "narracao_mock_1.mp3",
      caminho: "/audios/narracao_mock_1.mp3",
      tamanho: "256 KB",
      duracao: "15s"
    },
    {
      nome: "narracao_mock_2.mp3",
      caminho: "/audios/narracao_mock_2.mp3",
      tamanho: "312 KB",
      duracao: "18s"
    },
    {
      nome: "narracao_mock_3.mp3",
      caminho: "/audios/narracao_mock_3.mp3",
      tamanho: "278 KB",
      duracao: "16s"
    }
  ]
};