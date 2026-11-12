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
CREATE TYPE "StatusNegociacao" AS ENUM ('PENDENTE', 'EM_NEGOCIACAO', 'EM_EXECUCAO', 'EMBARCADO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CategoriaDocumento" AS ENUM ('COMERCIAL', 'ADMINISTRATIVO', 'PRODUCAO_INDUSTRIA', 'BOOKING_TRANSPORTE', 'REDEX_CARREGAMENTO', 'DOCUMENTACAO_EXPORTACAO', 'FECHAMENTO_BANCARIO', 'ETIQUETA', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('RASCUNHO', 'APROVADO', 'ENVIADO_CLIENTE', 'ARQUIVADO', 'REPROVADO');

-- CreateEnum
CREATE TYPE "CategoriaCusto" AS ENUM ('COMPRA_MATERIA_PRIMA', 'ESTUFAGEM_REDEX', 'COMISSAO_INTERMEDIACAO', 'OUTROS', 'COMPRA', 'BENEFICIAMENTO', 'SACARIA', 'FRETE_TERRESTRE', 'FRETE_MARITIMO', 'TARIFA_ARMADOR_PORTO', 'SERVICO_ESTUFF', 'COMISSAO', 'OUTROS_CUSTOS');

-- CreateEnum
CREATE TYPE "EtapaNotaFiscal" AS ENUM ('ETAPA_1_ENTRADA_INDUSTRIA', 'ETAPA_2_RETORNO_ARMAZENAGEM', 'ETAPA_3_REMESSA_REDEX', 'ETAPA_4_EXPORTACAO');

-- CreateEnum
CREATE TYPE "StatusSefaz" AS ENUM ('AUTORIZADA', 'PENDENTE', 'CANCELADA', 'DENEGADA');

-- CreateEnum
CREATE TYPE "StatusAverbacao" AS ENUM ('AGUARDANDO', 'PENDENTE_AVERBACAO', 'AVERBADA', 'REJEITADA');

-- CreateEnum
CREATE TYPE "TipoEntidadeComercial" AS ENUM ('PRODUTOR', 'IMPORTADOR', 'BUYER', 'ARMAZEM');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "cpf" TEXT,
    "senhaHash" TEXT,
    "primeiroAcesso" BOOLEAN NOT NULL DEFAULT true,
    "papel" "Papel" NOT NULL DEFAULT 'COMERCIAL',
    "papeis" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "imagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
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
    "incoterm" TEXT DEFAULT 'FOB',
    "portoOrigem" TEXT,
    "portoDestino" TEXT NOT NULL,
    "redex" TEXT,
    "valorDeclaradoUsd" DECIMAL(14,2),
    "bookingNumero" TEXT,
    "navio" TEXT,
    "deadlineEmbarque" TIMESTAMP(3),
    "deadlineDraftBl" TIMESTAMP(3),
    "deadlineDraftVgm" TIMESTAMP(3),
    "deadlineCarga" TIMESTAMP(3),
    "dataEstufagem" TIMESTAMP(3),
    "localEstufagem" TEXT,
    "containerQtd" INTEGER,
    "containerTipo" TEXT DEFAULT '20'' DRY',
    "embalagemTipo" TEXT DEFAULT 'Sacaria 30kg',
    "sacasPorContainer" INTEGER,
    "fumigacaoNecessaria" BOOLEAN,
    "fumigacaoTipo" TEXT,
    "fumigacaoTempoHoras" INTEGER DEFAULT 24,
    "armador" TEXT DEFAULT 'ONE',
    "estufagemInicio" TIMESTAMP(3),
    "estufagemFim" TIMESTAMP(3),
    "mapaNaSequencia" BOOLEAN,
    "necessitaEtiqueta" BOOLEAN,
    "ncm" TEXT,
    "freeTimeDestino" TEXT,
    "ruc" TEXT,
    "contratoInterno" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "statusCache" TEXT,
    "status" "StatusNegociacao" NOT NULL DEFAULT 'PENDENTE',
    "enderecoBuyer" TEXT,
    "complementoBuyer" TEXT,
    "cidadeBuyer" TEXT,
    "paisBuyer" TEXT,
    "iecBuyer" TEXT,
    "fassaiBuyer" TEXT,
    "panBuyer" TEXT,
    "gstBuyer" TEXT,
    "emailBuyer" TEXT,
    "telefoneBuyer" TEXT,
    "produtorId" TEXT,
    "importadorId" TEXT,
    "fazendaOrigemNome" TEXT,
    "produtorCarCache" TEXT,
    "produtorIeCache" TEXT,
    "trajetoStatus" TEXT DEFAULT 'FAZENDA',
    "siloArmazemOrigem" TEXT,
    "armazemCnpj" TEXT,
    "armazemUf" TEXT,
    "armazemCidade" TEXT,
    "armazemEndereco" TEXT,
    "coletaDiretaLavoura" BOOLEAN DEFAULT false,
    "armazemId" TEXT,
    "terminalTransbordo" TEXT,
    "laudoClassificacao" TEXT,
    "distanciaRodoviariaKm" INTEGER,
    "emissaoCO2EstimadaKg" DECIMAL(10,2),

    CONSTRAINT "Processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Container" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "numeroContainer" TEXT,
    "lacre" TEXT,
    "pesoBruto" DECIMAL(12,3),
    "pesoLiquido" DECIMAL(12,3),
    "totalSacos" INTEGER,
    "tara" DECIMAL(12,3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
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
    "descricaoOutro" TEXT,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Financeiro" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "precoUsd" DECIMAL(12,2) NOT NULL,
    "bancoDestino" TEXT DEFAULT 'BB BRASIL',
    "statusRecebimento" TEXT NOT NULL DEFAULT 'A_RECEBER',
    "dataRecebimento" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Financeiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CambioTravado" (
    "id" TEXT NOT NULL,
    "financeiroId" TEXT NOT NULL,
    "valorUsdParcial" DECIMAL(14,2) NOT NULL,
    "ptax" DECIMAL(16,7) NOT NULL,
    "taxa" DECIMAL(12,2) DEFAULT 0,
    "moedaTaxa" TEXT DEFAULT 'USD',
    "valorLiquido" DECIMAL(14,2),
    "dataTravamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CambioTravado_pkey" PRIMARY KEY ("id")
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
    "alteracoes" JSONB,
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

-- CreateTable
CREATE TABLE "NotaFiscal" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "etapa" "EtapaNotaFiscal" NOT NULL,
    "numero" TEXT NOT NULL,
    "serie" TEXT DEFAULT '1',
    "chaveAcesso" TEXT,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "emitente" TEXT NOT NULL,
    "emitenteCnpj" TEXT,
    "destinatario" TEXT NOT NULL,
    "destinatarioCnpj" TEXT,
    "cfop" TEXT,
    "pesoBruto" DECIMAL(14,3),
    "pesoLiquido" DECIMAL(14,3) NOT NULL,
    "quantidadeSacas" INTEGER,
    "valorTotal" DECIMAL(14,2),
    "anexoUrl" TEXT,
    "anexoNome" TEXT,
    "saldoDisponivelKg" DECIMAL(14,3),
    "saldoZerado" BOOLEAN NOT NULL DEFAULT false,
    "containerId" TEXT,
    "statusSefaz" "StatusSefaz" NOT NULL DEFAULT 'AUTORIZADA',
    "protocoloSefaz" TEXT,
    "dataConsultaSefaz" TIMESTAMP(3),
    "mensagemSefaz" TEXT,
    "statusAverbacao" "StatusAverbacao" NOT NULL DEFAULT 'AGUARDANDO',
    "dataAverbacao" TIMESTAMP(3),
    "numeroDue" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotaFiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaFiscalRetornoItem" (
    "id" TEXT NOT NULL,
    "notaRetornoId" TEXT NOT NULL,
    "notaEntradaId" TEXT NOT NULL,
    "pesoRetornadoKg" DECIMAL(14,3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaFiscalRetornoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaFiscalExportacaoItem" (
    "id" TEXT NOT NULL,
    "notaExportacaoId" TEXT NOT NULL,
    "notaLoteRedexId" TEXT NOT NULL,
    "pesoConsumidoKg" DECIMAL(14,3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaFiscalExportacaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CadastroEntidade" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEntidadeComercial" NOT NULL DEFAULT 'IMPORTADOR',
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "documento" TEXT,
    "inscricaoEstadual" TEXT,
    "carNumero" TEXT,
    "nomePropriedade" TEXT,
    "municipio" TEXT,
    "uf" TEXT,
    "coordenadasGps" TEXT,
    "areaTotalHectares" DECIMAL(12,2),
    "certificacoes" TEXT,
    "conformidadeSocioambiental" BOOLEAN DEFAULT true,
    "pais" TEXT DEFAULT 'Brasil',
    "cidade" TEXT,
    "endereco" TEXT,
    "complemento" TEXT,
    "codigoPostal" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "iecTaxId" TEXT,
    "fassaiId" TEXT,
    "panId" TEXT,
    "gstId" TEXT,
    "bancoNome" TEXT,
    "bancoEndereco" TEXT,
    "bancoConta" TEXT,
    "bancoSwift" TEXT,
    "bancoEmail" TEXT,
    "bancoTelefone" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CadastroEntidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Parceiro_nome_key" ON "Parceiro"("nome");

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
CREATE INDEX "Processo_produtorId_idx" ON "Processo"("produtorId");

-- CreateIndex
CREATE INDEX "Processo_importadorId_idx" ON "Processo"("importadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Container_processoId_ordem_key" ON "Container"("processoId", "ordem");

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

-- CreateIndex
CREATE INDEX "NotaFiscal_processoId_etapa_idx" ON "NotaFiscal"("processoId", "etapa");

-- CreateIndex
CREATE INDEX "NotaFiscal_chaveAcesso_idx" ON "NotaFiscal"("chaveAcesso");

-- CreateIndex
CREATE UNIQUE INDEX "NotaFiscalRetornoItem_notaRetornoId_notaEntradaId_key" ON "NotaFiscalRetornoItem"("notaRetornoId", "notaEntradaId");

-- CreateIndex
CREATE UNIQUE INDEX "NotaFiscalExportacaoItem_notaExportacaoId_notaLoteRedexId_key" ON "NotaFiscalExportacaoItem"("notaExportacaoId", "notaLoteRedexId");

-- CreateIndex
CREATE INDEX "CadastroEntidade_tipo_idx" ON "CadastroEntidade"("tipo");

-- CreateIndex
CREATE INDEX "CadastroEntidade_razaoSocial_idx" ON "CadastroEntidade"("razaoSocial");

-- CreateIndex
CREATE INDEX "CadastroEntidade_carNumero_idx" ON "CadastroEntidade"("carNumero");

-- CreateIndex
CREATE INDEX "CadastroEntidade_documento_idx" ON "CadastroEntidade"("documento");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Processo" ADD CONSTRAINT "Processo_produtorId_fkey" FOREIGN KEY ("produtorId") REFERENCES "CadastroEntidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Processo" ADD CONSTRAINT "Processo_importadorId_fkey" FOREIGN KEY ("importadorId") REFERENCES "CadastroEntidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "CambioTravado" ADD CONSTRAINT "CambioTravado_financeiroId_fkey" FOREIGN KEY ("financeiroId") REFERENCES "Financeiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "NotaFiscal" ADD CONSTRAINT "NotaFiscal_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscal" ADD CONSTRAINT "NotaFiscal_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscalRetornoItem" ADD CONSTRAINT "NotaFiscalRetornoItem_notaRetornoId_fkey" FOREIGN KEY ("notaRetornoId") REFERENCES "NotaFiscal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscalRetornoItem" ADD CONSTRAINT "NotaFiscalRetornoItem_notaEntradaId_fkey" FOREIGN KEY ("notaEntradaId") REFERENCES "NotaFiscal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscalExportacaoItem" ADD CONSTRAINT "NotaFiscalExportacaoItem_notaExportacaoId_fkey" FOREIGN KEY ("notaExportacaoId") REFERENCES "NotaFiscal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscalExportacaoItem" ADD CONSTRAINT "NotaFiscalExportacaoItem_notaLoteRedexId_fkey" FOREIGN KEY ("notaLoteRedexId") REFERENCES "NotaFiscal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- CARGA INICIAL OBRIGATÓRIA: USUÁRIO MASTER ADMIN (@Bela2026)
-- ---------------------------------------------------------------------------
INSERT INTO "Usuario" (
    "id", 
    "nome", 
    "email", 
    "username", 
    "cpf", 
    "senhaHash", 
    "primeiroAcesso", 
    "papel", 
    "papeis", 
    "ativo", 
    "criadoEm", 
    "atualizadoEm"
) VALUES (
    'usr_admin_master',
    'Administrador PEX',
    'bela@belacereais.com.br',
    'ADMIN',
    NULL,
    '$2b$10$u27eR/YG8ttK4jdJ9DWrDuSXZwmUEKvpE2lhNtKQMQ1w4iC1yBj5O',
    false,
    'ADMIN',
    ARRAY['ADMIN', 'DIRETORIA', 'COMERCIAL', 'FINANCEIRO', 'ADMINISTRATIVO']::TEXT[],
    true,
    NOW(),
    NOW()
) ON CONFLICT ("email") DO UPDATE SET 
    "senhaHash" = EXCLUDED."senhaHash",
    "username" = EXCLUDED."username",
    "papeis" = EXCLUDED."papeis";


