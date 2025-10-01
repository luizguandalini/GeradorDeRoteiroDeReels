import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const novoPrompt = `Crie um carrossel de {quantidade} slides sobre o tema "{tema}". Cada slide deve conter um título chamativo e um parágrafo explicativo. Para o campo "imagem", forneça APENAS uma descrição textual detalhada do que deve aparecer na imagem, sem URLs, sem links, sem nomes de arquivos. Exemplo: "Foto de um jogador de futebol chutando a bola em direção ao gol" ou "Imagem mostrando uma pessoa estudando com livros na mesa". IMPORTANTE: O texto deve estar pronto para ser usado diretamente em redes sociais, com linguagem envolvente e acessível. Use frases curtas e impactantes. Retorne um array "carrossel" onde cada item tem: "titulo", "paragrafo" e "imagem" (sendo imagem APENAS uma descrição textual do que mostrar).`;

try {
  // Atualizar configurações globais
  const globalUpdate = await prisma.configuracao.updateMany({
    where: { chave: 'PROMPT_CARROSSEL' },
    data: { valor: novoPrompt }
  });

  // Atualizar configurações de usuários
  const userUpdate = await prisma.userConfiguracao.updateMany({
    where: { chave: 'PROMPT_CARROSSEL' },
    data: { valor: novoPrompt }
  });

  console.log(`Prompt PROMPT_CARROSSEL atualizado!`);
  console.log(`Configurações globais atualizadas: ${globalUpdate.count}`);
  console.log(`Configurações de usuários atualizadas: ${userUpdate.count}`);
} catch (error) {
  console.error('Erro ao atualizar prompt:', error);
} finally {
  await prisma.$disconnect();
}