-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "senhaHash" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "primeiroAcesso" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "papeis" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "imagem" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Usuario_username_key') THEN
    CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Usuario_cpf_key') THEN
    CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario"("cpf");
  END IF;
END $$;
