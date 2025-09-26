// Configuração para o modo mock
let useMockMode = false;

export const setMockMode = (mode) => {
  useMockMode = mode;
};

export const getMockMode = () => {
  return useMockMode;
};