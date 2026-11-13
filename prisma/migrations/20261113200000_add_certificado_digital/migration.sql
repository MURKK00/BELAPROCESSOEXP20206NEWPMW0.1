-- Migração aditiva e idempotente para o módulo Certificados Digitais A1 (.pfx/.p12)

CREATE TABLE IF NOT EXISTS "CertificadoDigital" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "titular" TEXT NOT NULL,
    "emissor" TEXT NOT NULL,
    "validadeInicio" TIMESTAMP(3) NOT NULL,
    "validadeFim" TIMESTAMP(3) NOT NULL,
    "finalidade" TEXT NOT NULL,
    "arquivoCriptografado" TEXT NOT NULL,
    "senhaCriptografada" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificadoDigital_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CertificadoDigital_documento_finalidade_ativo_idx"
    ON "CertificadoDigital"("documento", "finalidade", "ativo");

CREATE INDEX IF NOT EXISTS "CertificadoDigital_validadeFim_idx"
    ON "CertificadoDigital"("validadeFim");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'CertificadoDigital_criadoPorId_fkey'
    ) THEN
        ALTER TABLE "CertificadoDigital"
            ADD CONSTRAINT "CertificadoDigital_criadoPorId_fkey"
            FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Ajuste aditivo no AuditLog para registrar ações de Certificados sem vínculo obrigatório a Processo
ALTER TABLE "AuditLog" ALTER COLUMN "processoId" DROP NOT NULL;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "certificadoId" TEXT;
CREATE INDEX IF NOT EXISTS "AuditLog_certificadoId_criadoEm_idx"
    ON "AuditLog"("certificadoId", "criadoEm");
