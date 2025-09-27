-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('CREDENTIALS', 'GOOGLE', 'APPLE');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "provider" "AuthProvider" NOT NULL DEFAULT 'CREDENTIALS',
  ADD COLUMN "providerId" TEXT,
  ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_providerId_key" ON "users"("providerId");
