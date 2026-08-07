/**
 * Seed inicial: transforma a aba "Backlog Automação" (48 etapas) e a aba
 * "Estrutura GED" em dados de configuração reais no banco.
 *
 * IMPORTANTE: este arquivo é o ponto de verdade única do processo. Se o
 * processo de negócio mudar (nova etapa, novo parceiro), edita-se AQUI —
 * não no front-end. Toda negociação nova instancia uma cópia destas etapas
 * em `ProcessoEtapa`.
 *
 * TODO (próximo passo real): terminar de portar as 48 linhas completas da
 * planilha "Backlog Automação". Abaixo estão as primeiras etapas de cada
 * fase como exemplo de padrão — o restante segue o mesmo shape e pode ser
 * gerado automaticamente lendo o .xlsx (ver script scripts/import-backlog.ts).
 */

import { PrismaClient, Fase, TipoParceiro, NivelAutomacao, CategoriaDocumento, Papel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 0. Usuário padrão de desenvolvimento (ver src/lib/auth.ts — bypass
  //    temporário até o NextAuth estar plugado). Remover em produção.
  await prisma.usuario.upsert({
    where: { email: 'dev@belacereais.local' },
    update: {},
    create: { nome: 'Admin (Dev)', email: 'dev@belacereais.local', papel: Papel.ADMIN },
  });

  // 1. Parceiros externos (raia "Executor / Contato" da planilha)
  const parceiros = await Promise.all([
    prisma.parceiro.upsert({ where: { nome: 'Buonny' }, update: {}, create: { nome: 'Buonny', tipo: TipoParceiro.GERENCIADORA_RISCO } }),
    prisma.parceiro.upsert({ where: { nome: 'CROMO' }, update: {}, create: { nome: 'CROMO', tipo: TipoParceiro.AGENTE_DESPACHANTE } }),
    prisma.parceiro.upsert({ where: { nome: 'SCAN' }, update: {}, create: { nome: 'SCAN', tipo: TipoParceiro.AGENTE_BOOKING } }),
    prisma.parceiro.upsert({ where: { nome: 'Port Inspect' }, update: {}, create: { nome: 'Port Inspect', tipo: TipoParceiro.INSPETORIA } }),
    prisma.parceiro.upsert({ where: { nome: 'SURVEY / UNICCA' }, update: {}, create: { nome: 'SURVEY / UNICCA', tipo: TipoParceiro.SURVEY_FUMIGACAO } }),
    prisma.parceiro.upsert({ where: { nome: 'AT&M' }, update: {}, create: { nome: 'AT&M', tipo: TipoParceiro.SEGURADORA } }),
    prisma.parceiro.upsert({ where: { nome: 'Banco do Brasil' }, update: {}, create: { nome: 'Banco do Brasil', tipo: TipoParceiro.BANCO } }),
    prisma.parceiro.upsert({ where: { nome: 'DHL' }, update: {}, create: { nome: 'DHL', tipo: TipoParceiro.TRANSPORTADORA_INTL } }),
    prisma.parceiro.upsert({ where: { nome: 'Fretebras' }, update: {}, create: { nome: 'Fretebras', tipo: TipoParceiro.TRANSPORTADORA } }),
  ]);
  const p = Object.fromEntries(parceiros.map((x) => [x.nome, x.id]));

  // 2. Tipos de documento (aba "Estrutura GED" + coluna "Documento p/ GED?")
  const tiposDoc = await Promise.all([
    prisma.tipoDocumento.upsert({ where: { nome: 'Minuta de Contrato de Compra' }, update: {}, create: { nome: 'Minuta de Contrato de Compra', categoria: CategoriaDocumento.ADMINISTRATIVO } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Contrato de Compra Assinado' }, update: {}, create: { nome: 'Contrato de Compra Assinado', categoria: CategoriaDocumento.ADMINISTRATIVO } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Parecer de Risco (Buonny)' }, update: {}, create: { nome: 'Parecer de Risco (Buonny)', categoria: CategoriaDocumento.ADMINISTRATIVO } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Ordem de Carregamento' }, update: {}, create: { nome: 'Ordem de Carregamento', categoria: CategoriaDocumento.ADMINISTRATIVO } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Booking' }, update: {}, create: { nome: 'Booking', categoria: CategoriaDocumento.BOOKING_TRANSPORTE } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'BL Original' }, update: {}, create: { nome: 'BL Original', categoria: CategoriaDocumento.DOCUMENTACAO_EXPORTACAO, obrigatorioNoPacoteFinal: true } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Comercial Invoice' }, update: {}, create: { nome: 'Comercial Invoice', categoria: CategoriaDocumento.DOCUMENTACAO_EXPORTACAO, obrigatorioNoPacoteFinal: true } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Packing List' }, update: {}, create: { nome: 'Packing List', categoria: CategoriaDocumento.DOCUMENTACAO_EXPORTACAO, obrigatorioNoPacoteFinal: true } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Certificate of Origin' }, update: {}, create: { nome: 'Certificate of Origin', categoria: CategoriaDocumento.DOCUMENTACAO_EXPORTACAO, obrigatorioNoPacoteFinal: true } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Weight Certificate' }, update: {}, create: { nome: 'Weight Certificate', categoria: CategoriaDocumento.DOCUMENTACAO_EXPORTACAO, obrigatorioNoPacoteFinal: true } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Quality Certificate' }, update: {}, create: { nome: 'Quality Certificate', categoria: CategoriaDocumento.DOCUMENTACAO_EXPORTACAO, obrigatorioNoPacoteFinal: true } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Stuffing Report' }, update: {}, create: { nome: 'Stuffing Report', categoria: CategoriaDocumento.DOCUMENTACAO_EXPORTACAO, obrigatorioNoPacoteFinal: true } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Fumigation Certificate' }, update: {}, create: { nome: 'Fumigation Certificate', categoria: CategoriaDocumento.REDEX_CARREGAMENTO, obrigatorioNoPacoteFinal: true } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Phytosanitary Certificate (MAPA)' }, update: {}, create: { nome: 'Phytosanitary Certificate (MAPA)', categoria: CategoriaDocumento.REDEX_CARREGAMENTO, obrigatorioNoPacoteFinal: true } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Certificate Non-GMO' }, update: {}, create: { nome: 'Certificate Non-GMO', categoria: CategoriaDocumento.DOCUMENTACAO_EXPORTACAO, obrigatorioNoPacoteFinal: true } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Borderô Bancário' }, update: {}, create: { nome: 'Borderô Bancário', categoria: CategoriaDocumento.FECHAMENTO_BANCARIO } }),
    prisma.tipoDocumento.upsert({ where: { nome: 'Contrato de Câmbio' }, update: {}, create: { nome: 'Contrato de Câmbio', categoria: CategoriaDocumento.FECHAMENTO_BANCARIO } }),
  ]);
  const t = Object.fromEntries(tiposDoc.map((x) => [x.nome, x.id]));

  // 3. Etapas — exemplo representativo (1 a 2 por fase). Portar as 48 linhas
  //    completas da planilha antes de ir pra produção.
  const etapas: Array<{
    numero: string; ordem: number; fase: Fase; etapa: string; raiaResponsavel: string;
    parceiroNome?: string; canal?: string; gatilho?: string; entrada?: string; saida?: string;
    ehDecisao?: boolean; automacaoSugerida?: NivelAutomacao; geraDocumento?: boolean; tipoDocNome?: string;
  }> = [
    { numero: '1', ordem: 1, fase: Fase.COMERCIAL, etapa: 'Negociação Contrato Exportação', raiaResponsavel: 'Comercial', canal: 'ERP', automacaoSugerida: NivelAutomacao.MANUAL },
    { numero: '2', ordem: 2, fase: Fase.COMERCIAL, etapa: 'Decisão: Fecha contrato de exportação?', raiaResponsavel: 'Comercial', ehDecisao: true },
    { numero: '6', ordem: 6, fase: Fase.ADMINISTRATIVO, etapa: 'Administrativo Elabora Minuta de Contrato de Compra', raiaResponsavel: 'Administrativo', automacaoSugerida: NivelAutomacao.N8N_SIMPLES, geraDocumento: true, tipoDocNome: 'Minuta de Contrato de Compra' },
    { numero: '9', ordem: 9, fase: Fase.ADMINISTRATIVO, etapa: 'Consulta Motorista na Gerenciadora de Risco', raiaResponsavel: 'Administrativo', parceiroNome: 'Buonny', canal: 'Site', automacaoSugerida: NivelAutomacao.API_RPA_FASE2, geraDocumento: true, tipoDocNome: 'Parecer de Risco (Buonny)' },
    { numero: '13', ordem: 13, fase: Fase.ADMINISTRATIVO, etapa: 'Gera Ordem de Carregamento', raiaResponsavel: 'Administrativo', automacaoSugerida: NivelAutomacao.N8N_SIMPLES, geraDocumento: true, tipoDocNome: 'Ordem de Carregamento' },
    { numero: '19', ordem: 19, fase: Fase.INDUSTRIA_BENEFICIAMENTO, etapa: 'Beneficiamento do Grão', raiaResponsavel: 'Indústria de Beneficiamento' },
    { numero: '22', ordem: 22, fase: Fase.BOOKING_TRANSPORTE, etapa: 'Emissão do Booking', raiaResponsavel: 'Administrativo', parceiroNome: 'SCAN', canal: 'E-mail', geraDocumento: true, tipoDocNome: 'Booking' },
    { numero: '29', ordem: 29, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Estufagem + Etiquetagem', raiaResponsavel: 'REDEX', parceiroNome: 'SCAN' },
    { numero: '32', ordem: 32, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Fumigação', raiaResponsavel: 'REDEX', parceiroNome: 'SURVEY / UNICCA', automacaoSugerida: NivelAutomacao.N8N_SIMPLES, geraDocumento: true, tipoDocNome: 'Fumigation Certificate' },
    { numero: '34', ordem: 34, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Vistoria MAPA (Fitossanitário)', raiaResponsavel: 'REDEX', parceiroNome: 'CROMO', automacaoSugerida: NivelAutomacao.N8N_SIMPLES, geraDocumento: true, tipoDocNome: 'Phytosanitary Certificate (MAPA)' },
    { numero: '44', ordem: 44, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Última Checagem de Documentação (10 documentos)', raiaResponsavel: 'Administrativo', automacaoSugerida: NivelAutomacao.N8N_SIMPLES },
    { numero: '44-B', ordem: 45, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Decisão: Cliente aprova o pacote de documentos?', raiaResponsavel: 'Administrativo', ehDecisao: true },
    { numero: '45', ordem: 46, fase: Fase.FECHAMENTO_BANCARIO, etapa: 'Carta Borderô ao Banco', raiaResponsavel: 'Administrativo', parceiroNome: 'Banco do Brasil', geraDocumento: true, tipoDocNome: 'Borderô Bancário' },
    { numero: '46-A', ordem: 47, fase: Fase.FECHAMENTO_BANCARIO, etapa: 'Fechamento de Câmbio', raiaResponsavel: 'Administrativo', parceiroNome: 'Banco do Brasil', automacaoSugerida: NivelAutomacao.N8N_SIMPLES, geraDocumento: true, tipoDocNome: 'Contrato de Câmbio' },
    { numero: '48', ordem: 48, fase: Fase.FECHAMENTO_BANCARIO, etapa: 'Comercial Invoice Acompanha Navio + Encerramento', raiaResponsavel: 'Administrativo', parceiroNome: 'DHL', automacaoSugerida: NivelAutomacao.N8N_SIMPLES },
  ];

  for (const e of etapas) {
    await prisma.etapaTemplate.upsert({
      where: { numero: e.numero },
      update: {},
      create: {
        numero: e.numero,
        ordem: e.ordem,
        fase: e.fase,
        etapa: e.etapa,
        raiaResponsavel: e.raiaResponsavel,
        parceiroId: e.parceiroNome ? p[e.parceiroNome] : undefined,
        canal: e.canal,
        gatilho: e.gatilho,
        entrada: e.entrada,
        saida: e.saida,
        ehDecisao: e.ehDecisao ?? false,
        automacaoSugerida: e.automacaoSugerida ?? NivelAutomacao.MANUAL,
        geraDocumento: e.geraDocumento ?? false,
        tipoDocumentoId: e.tipoDocNome ? t[e.tipoDocNome] : undefined,
      },
    });
  }

  console.log(`Seed concluído: ${parceiros.length} parceiros, ${tiposDoc.length} tipos de documento, ${etapas.length} etapas (amostra).`);
  console.log('⚠️  Portar as 48 linhas completas da planilha antes de usar em produção.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
