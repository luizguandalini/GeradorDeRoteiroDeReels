-- Remove registros antigos vinculados ao login Apple
DELETE FROM "users" WHERE "provider" = 'APPLE';

-- Recria enum AuthProvider sem suporte a Apple
ALTER TYPE "AuthProvider" RENAME TO "AuthProvider_old";

CREATE TYPE "AuthProvider" AS ENUM ('CREDENTIALS', 'GOOGLE');

ALTER TABLE "users"
  ALTER COLUMN "provider" DROP DEFAULT,
  ALTER COLUMN "provider" TYPE "AuthProvider" USING ("provider"::text::"AuthProvider"),
  ALTER COLUMN "provider" SET DEFAULT 'CREDENTIALS';

DROP TYPE "AuthProvider_old";
