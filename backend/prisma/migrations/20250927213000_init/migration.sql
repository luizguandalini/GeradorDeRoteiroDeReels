-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GENERAL');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('CREDENTIALS', 'GOOGLE');

-- CreateTable
CREATE TABLE "topicos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temas" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "topicoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" SERIAL NOT NULL,
    "chave" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'GENERAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "provider" "AuthProvider" NOT NULL DEFAULT 'CREDENTIALS',
    "providerId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topicos_nome_key" ON "topicos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_chave_key" ON "configuracoes"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_providerId_key" ON "users"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- AddForeignKey
ALTER TABLE "temas" ADD CONSTRAINT "temas_topicoId_fkey" FOREIGN KEY ("topicoId") REFERENCES "topicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

