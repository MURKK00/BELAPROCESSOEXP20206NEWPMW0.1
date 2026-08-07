-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('COMERCIAL', 'ADMINISTRATIVO', 'FINANCEIRO', 'DIRETORIA', 'ADMIN', 'CLIENTE_PORTAL');

-- CreateEnum
CREATE TYPE "TipoParceiro" AS ENUM ('GERENCIADORA_RISCO', 'AGENTE_DESPACHANTE', 'AGENTE_BOOKING', 'INSPETORIA', 'SURVEY_FUMIGACAO', 'TRANSPORTADORA', 'SEGURADORA', 'BANCO', 'TRANSPORTADORA_INTL', 'OUTRO');

-- CreateEnum
CREATE TYPE "Fase" AS ENUM ('COMERCIAL', 'PRODUTOR_VENDEDOR', 'ADMINISTRATIVO', 'INDUSTRIA_BENEFICIAMENTO', 'BOOKING_TRANSPORTE', 'CARREGAMENTO', 'CARREGAMENTO_REDEX', 'DOCUMENTACAO_EXPORTACAO', 'TERMINAL_PORTO', 'FECHAMENTO_BANCARIO');

-- CreateEnum
CREATE TYPE "StatusEtapa" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'BLOQUEADA', 'NAO_APLICAVEL');

-- CreateEnum
CREATE TYPE "NivelAutomacao" AS ENUM ('MANUAL', 'N8N_SIMPLES', 'API_RPA_FASE2');

-- CreateEnum
CREATE TYPE "CategoriaDocumento" AS ENUM ('COMERCIAL', 'ADMINISTRATIVO', 'PRODUCAO_INDUSTRIA', 'BOOKING_TRANSPORTE', 'REDEX_CARREGAMENTO', 'DOCUMENTACAO_EXPORTACAO', 'FECHAMENTO_BANCARIO');

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('RASCUNHO', 'APROVADO', 'ENVIADO_CLIENTE', 'ARQUIVADO', 'REPROVADO');

-- CreateEnum
CREATE TYPE "CategoriaCusto" AS ENUM ('COMPRA_MATERIA_PRIMA', 'BENEFICIAMENTO', 'FRETE_TERRESTRE', 'FRETE_MARITIMO', 'TARIFA_ARMADOR_PORTO', 'ESTUFAGEM_REDEX', 'COMISSAO_INTERMEDIACAO', 'OUTROS');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "papel" "Papel" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parceiro" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoParceiro" NOT NULL,
    "contato" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Parceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtapaTemplate" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "fase" "Fase" NOT NULL,
    "etapa" TEXT NOT NULL,
    "raiaResponsavel" TEXT NOT NULL,
    "parceiroId" TEXT,
    "canal" TEXT,
    "gatilho" TEXT,
    "entrada" TEXT,
    "saida" TEXT,
    "ehDecisao" BOOLEAN NOT NULL DEFAULT false,
    "automacaoSugerida" "NivelAutomacao" NOT NULL DEFAULT 'MANUAL',
    "geraDocumento" BOOLEAN NOT NULL DEFAULT false,
    "tipoDocumentoId" TEXT,

    CONSTRAINT "EtapaTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessoEtapa" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "etapaTemplateId" TEXT NOT NULL,
    "status" "StatusEtapa" NOT NULL DEFAULT 'PENDENTE',
    "responsavelId" TEXT,
    "observacao" TEXT,
    "iniciadoEm" TIMESTAMP(3),
    "concluidoEm" TIMESTAMP(3),

    CONSTRAINT "ProcessoEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Processo" (
    "id" TEXT NOT NULL,
    "numeroProcesso" TEXT NOT NULL,
    "clienteFinal" TEXT NOT NULL,
    "traderIntermedio" TEXT,
    "produto" TEXT NOT NULL,
    "volumeKg" DECIMAL(14,3) NOT NULL,
    "incoterm" TEXT NOT NULL,
    "portoDestino" TEXT NOT NULL,
    "redex" TEXT,
    "valorDeclaradoUsd" DECIMAL(14,2),
    "bookingNumero" TEXT,
    "navio" TEXT,
    "deadlineEmbarque" TIMESTAMP(3),
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "statusCache" TEXT,

    CONSTRAINT "Processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoDocumento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "CategoriaDocumento" NOT NULL,
    "obrigatorioNoPacoteFinal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TipoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "tipoDocumentoId" TEXT NOT NULL,
    "etapaOrigemId" TEXT,
    "parceiroEmissorId" TEXT,
    "nomeArquivo" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "status" "StatusDocumento" NOT NULL DEFAULT 'RASCUNHO',
    "uploadedById" TEXT NOT NULL,
    "uploadedEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Financeiro" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "precoUsd" DECIMAL(12,2) NOT NULL,
    "ptax" DECIMAL(8,4) NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Financeiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustoItem" (
    "id" TEXT NOT NULL,
    "financeiroId" TEXT NOT NULL,
    "categoria" "CategoriaCusto" NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "atualizadoPorId" TEXT NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "detalhe" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processado" BOOLEAN NOT NULL DEFAULT false,
    "erro" TEXT,
    "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EtapaTemplate_numero_key" ON "EtapaTemplate"("numero");

-- CreateIndex
CREATE INDEX "ProcessoEtapa_processoId_status_idx" ON "ProcessoEtapa"("processoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessoEtapa_processoId_etapaTemplateId_key" ON "ProcessoEtapa"("processoId", "etapaTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "Processo_numeroProcesso_key" ON "Processo"("numeroProcesso");

-- CreateIndex
CREATE INDEX "Processo_deadlineEmbarque_idx" ON "Processo"("deadlineEmbarque");

-- CreateIndex
CREATE INDEX "Processo_statusCache_idx" ON "Processo"("statusCache");

-- CreateIndex
CREATE UNIQUE INDEX "TipoDocumento_nome_key" ON "TipoDocumento"("nome");

-- CreateIndex
CREATE INDEX "Documento_processoId_tipoDocumentoId_idx" ON "Documento"("processoId", "tipoDocumentoId");

-- CreateIndex
CREATE UNIQUE INDEX "Financeiro_processoId_key" ON "Financeiro"("processoId");

-- CreateIndex
CREATE UNIQUE INDEX "CustoItem_financeiroId_categoria_key" ON "CustoItem"("financeiroId", "categoria");

-- CreateIndex
CREATE INDEX "ChatMessage_processoId_criadoEm_idx" ON "ChatMessage"("processoId", "criadoEm");

-- CreateIndex
CREATE INDEX "AuditLog_processoId_criadoEm_idx" ON "AuditLog"("processoId", "criadoEm");

-- AddForeignKey
ALTER TABLE "EtapaTemplate" ADD CONSTRAINT "EtapaTemplate_parceiroId_fkey" FOREIGN KEY ("parceiroId") REFERENCES "Parceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaTemplate" ADD CONSTRAINT "EtapaTemplate_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "TipoDocumento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoEtapa" ADD CONSTRAINT "ProcessoEtapa_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoEtapa" ADD CONSTRAINT "ProcessoEtapa_etapaTemplateId_fkey" FOREIGN KEY ("etapaTemplateId") REFERENCES "EtapaTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoEtapa" ADD CONSTRAINT "ProcessoEtapa_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Processo" ADD CONSTRAINT "Processo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "TipoDocumento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_etapaOrigemId_fkey" FOREIGN KEY ("etapaOrigemId") REFERENCES "ProcessoEtapa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_parceiroEmissorId_fkey" FOREIGN KEY ("parceiroEmissorId") REFERENCES "Parceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Financeiro" ADD CONSTRAINT "Financeiro_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustoItem" ADD CONSTRAINT "CustoItem_financeiroId_fkey" FOREIGN KEY ("financeiroId") REFERENCES "Financeiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustoItem" ADD CONSTRAINT "CustoItem_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
