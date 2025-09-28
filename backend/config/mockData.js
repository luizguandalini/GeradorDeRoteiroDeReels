// Dados mock para todas as APIs

// Mock para a API de tópicos
export const topicosMock = {
  topicos: [
    { id: 1, nome: "Dicas de produtividade", ativo: true, createdAt: "2024-01-15T10:00:00Z" },
    { id: 2, nome: "Receitas rápidas", ativo: true, createdAt: "2024-01-14T15:30:00Z" },
    { id: 3, nome: "Exercícios em casa", ativo: true, createdAt: "2024-01-13T09:15:00Z" },
    { id: 4, nome: "Tecnologia para iniciantes", ativo: true, createdAt: "2024-01-12T14:45:00Z" },
    { id: 5, nome: "Dicas de viagem", ativo: true, createdAt: "2024-01-11T11:20:00Z" },
    { id: 6, nome: "Organização pessoal", ativo: true, createdAt: "2024-01-10T16:00:00Z" },
    { id: 7, nome: "Economia doméstica", ativo: true, createdAt: "2024-01-09T13:30:00Z" },
    { id: 8, nome: "Saúde e bem-estar", ativo: true, createdAt: "2024-01-08T08:45:00Z" }
  ],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 8,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false
  }
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

export const temasMockEn = {
  temas: [
    "How to organize your daily routine",
    "Essential productivity apps",
    "Pomodoro technique explained",
    "Tips for effective meetings",
    "How to avoid procrastination"
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

export const roteiroMockEn = {
  roteiro: [
    {
      narracao: "Have you ever felt overwhelmed by too many tasks? In this video we show how to organize your routine effectively.",
      imagem: "Person stressed with sticky notes and pending tasks."
    },
    {
      narracao: "Start by listing everything you need to do in one place. It can be an app or a notebook.",
      imagem: "Hand writing in a notebook or using a to-do app on the phone."
    },
    {
      narracao: "Then prioritize your activities. What must be done today? What can wait until tomorrow?",
      imagem: "Task list with color codes indicating priority levels."
    },
    {
      narracao: "Block specific time slots for important tasks. This keeps focus and avoids distractions.",
      imagem: "Calendar with colored time blocks for different activities."
    },
    {
      narracao: "Do not forget to schedule breaks. They are essential to maintain productivity throughout the day.",
      imagem: "Person relaxing with coffee or stretching briefly."
    },
    {
      narracao: "Review your routine regularly and adjust when needed. What works today might not work tomorrow.",
      imagem: "Person reviewing a calendar or task list and making adjustments."
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





