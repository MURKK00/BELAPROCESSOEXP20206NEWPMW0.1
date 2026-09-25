import { Fase, TipoParceiro, CategoriaDocumento, Papel, CategoriaCusto, StatusNegociacao } from '@prisma/client';
import { CHECKLIST_ETAPAS, TIPOS_DOCUMENTO_CHECKLIST } from '../../prisma/checklistData';

export interface MockStore {
  usuarios: any[];
  parceiros: any[];
  tiposDocumento: any[];
  etapasTemplate: any[];
  processos: any[];
  processoEtapas: any[];
  containers: any[];
  financeiros: any[];
  custosItem: any[];
  cambiosTravados: any[];
  documentos: any[];
  chatMessages: any[];
  auditLogs: any[];
}

function initMockStore(): MockStore {
  const store: MockStore = {
    usuarios: [
      {
        id: 'usr_dev_admin',
        nome: 'Admin (Dev)',
        email: 'dev@belacereais.local',
        papel: Papel.ADMIN,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      },
    ],
    parceiros: [
      { id: 'parc_1', nome: 'Buonny', tipo: TipoParceiro.GERENCIADORA_RISCO, ativo: true, criadoEm: new Date() },
      { id: 'parc_2', nome: 'CROMO', tipo: TipoParceiro.AGENTE_DESPACHANTE, ativo: true, criadoEm: new Date() },
      { id: 'parc_3', nome: 'SCAN', tipo: TipoParceiro.AGENTE_BOOKING, ativo: true, criadoEm: new Date() },
      { id: 'parc_4', nome: 'Port Inspect', tipo: TipoParceiro.INSPETORIA, ativo: true, criadoEm: new Date() },
      { id: 'parc_5', nome: 'SURVEY / UNICCA', tipo: TipoParceiro.SURVEY_FUMIGACAO, ativo: true, criadoEm: new Date() },
      { id: 'parc_6', nome: 'AT&M', tipo: TipoParceiro.SEGURADORA, ativo: true, criadoEm: new Date() },
      { id: 'parc_7', nome: 'Banco do Brasil', tipo: TipoParceiro.BANCO, ativo: true, criadoEm: new Date() },
      { id: 'parc_8', nome: 'DHL', tipo: TipoParceiro.TRANSPORTADORA_INTL, ativo: true, criadoEm: new Date() },
      { id: 'parc_9', nome: 'Fretebras', tipo: TipoParceiro.TRANSPORTADORA, ativo: true, criadoEm: new Date() },
    ],
    tiposDocumento: [],
    etapasTemplate: [],
    processos: [],
    processoEtapas: [],
    containers: [],
    financeiros: [],
    custosItem: [],
    cambiosTravados: [],
    documentos: [],
    chatMessages: [],
    auditLogs: [],
  };

  // 1. Tipos de documento
  const tiposBase = [
    { nome: 'Minuta de Contrato de Compra', categoria: CategoriaDocumento.ADMINISTRATIVO, obrigatorioNoPacoteFinal: false },
    { nome: 'Contrato de Compra Assinado', categoria: CategoriaDocumento.ADMINISTRATIVO, obrigatorioNoPacoteFinal: false },
    { nome: 'Parecer de Risco (Buonny)', categoria: CategoriaDocumento.ADMINISTRATIVO, obrigatorioNoPacoteFinal: false },
    { nome: 'Ordem de Carregamento', categoria: CategoriaDocumento.ADMINISTRATIVO, obrigatorioNoPacoteFinal: false },
    { nome: 'Booking', categoria: CategoriaDocumento.BOOKING_TRANSPORTE, obrigatorioNoPacoteFinal: false },
    { nome: 'Borderô Bancário', categoria: CategoriaDocumento.FECHAMENTO_BANCARIO, obrigatorioNoPacoteFinal: false },
    { nome: 'Contrato de Câmbio', categoria: CategoriaDocumento.FECHAMENTO_BANCARIO, obrigatorioNoPacoteFinal: false },
    { nome: 'Photo Report', categoria: CategoriaDocumento.REDEX_CARREGAMENTO, obrigatorioNoPacoteFinal: false },
  ];

  let docIdCounter = 1;
  const allTipos = [...tiposBase, ...TIPOS_DOCUMENTO_CHECKLIST];
  for (const t of allTipos) {
    if (!store.tiposDocumento.some((td) => td.nome === t.nome)) {
      store.tiposDocumento.push({
        id: `td_${docIdCounter++}`,
        nome: t.nome,
        categoria: t.categoria as CategoriaDocumento,
        obrigatorioNoPacoteFinal: 'obrigatorioNoPacoteFinal' in t ? Boolean(t.obrigatorioNoPacoteFinal) : false,
        criadoEm: new Date(),
      });
    }
  }

  // 2. Etapas template
  let tmplIdCounter = 1;
  for (const etapa of CHECKLIST_ETAPAS) {
    store.etapasTemplate.push({
      id: `tmpl_${tmplIdCounter++}`,
      numero: etapa.numero,
      ordem: etapa.ordem,
      fase: etapa.fase,
      etapa: etapa.etapa,
      raiaResponsavel: etapa.raiaResponsavel,
      geraDocumento: Boolean(etapa.geraDocumento),
      tipoDocNome: etapa.tipoDocNome ?? null,
      parceiroId: null,
      parceiro: null,
      criadoEm: new Date(),
    });
  }

  // 3. Processo 1: Em Execução
  const proc1Id = 'proc_bc26_001';
  const proc1Date = new Date();
  proc1Date.setDate(proc1Date.getDate() - 3);
  const deadline1 = new Date();
  deadline1.setDate(deadline1.getDate() + 12);

  store.processos.push({
    id: proc1Id,
    numeroProcesso: 'BC26-001',
    clienteFinal: 'Cargill International SA',
    traderIntermedio: 'AgriTrading Partners SA',
    produto: 'Feijão Mungo Verde (Green Mung Bean)',
    volumeKg: 250000,
    incoterm: 'FOB',
    portoOrigem: 'Santos - SSZDPW',
    portoDestino: 'Rotterdam (NL)',
    freeTimeDestino: '14 dias corridos',
    redex: 'REDEX Santos — Pátio 4',
    valorDeclaradoUsd: 850,
    bookingNumero: 'BKG-99281-MAERSK',
    navio: 'MSC ALTAIR',
    deadlineEmbarque: deadline1,
    dataEstufagem: new Date(Date.now() + 5 * 86400000),
    localEstufagem: 'REDEX Santos — Pátio 4',
    containerQtd: 10,
    containerTipo: "20' DRY",
    embalagemTipo: 'Sacas 25kg PP',
    sacasPorContainer: 1000,
    fumigacaoNecessaria: true,
    fumigacaoTipo: 'Fosfina 72h',
    fumigacaoTempoHoras: 72,
    armador: 'Maersk Line',
    necessitaEtiqueta: true,
    estufagemInicio: new Date(),
    estufagemFim: new Date(Date.now() + 2 * 86400000),
    mapaNaSequencia: true,
    ncm: '0713.31.90',
    cnpjBuyer: 'NL802349182B01',
    enderecoBuyer: 'Evert van de Beekstraat 378, 1118 CZ Schiphol, Netherlands',
    status: StatusNegociacao.EM_EXECUCAO,
    statusCache: 'Em execução',
    criadoPorId: 'usr_dev_admin',
    criadoEm: proc1Date,
    atualizadoEm: new Date(),
  });

  // Etapas para o Processo 1
  let peId = 1;
  store.etapasTemplate.forEach((tmpl, idx) => {
    store.processoEtapas.push({
      id: `pe_${peId++}`,
      processoId: proc1Id,
      etapaTemplateId: tmpl.id,
      status: idx < 3 ? 'CONCLUIDA' : idx === 3 ? 'EM_ANDAMENTO' : 'PENDENTE',
      concluidaEm: idx < 3 ? new Date() : null,
      concluidaPorId: idx < 3 ? 'usr_dev_admin' : null,
      documentoId: null,
      observacao: idx === 0 ? 'Booking confirmado com Maersk.' : null,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
  });

  // Contêineres do Processo 1
  for (let i = 1; i <= 10; i++) {
    store.containers.push({
      id: `cont_${proc1Id}_${i}`,
      processoId: proc1Id,
      ordem: i,
      numeroContainer: `MSKU${7849100 + i}`,
      lacre: `ML-BR${9900 + i}`,
      pesoBruto: 27200,
      tara: 2200,
      tipoContainer: "20' DRY",
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
  }

  // Financeiro do Processo 1
  const fin1Id = `fin_${proc1Id}`;
  store.financeiros.push({
    id: fin1Id,
    processoId: proc1Id,
    precoUsd: 850,
    bancoDestino: 'BB BRASIL',
    statusRecebimento: 'A_RECEBER',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });

  store.cambiosTravados.push({
    id: 'trav_1',
    financeiroId: fin1Id,
    valorUsdParcial: 100000,
    ptax: 5.62,
    observacao: 'Trava antecipada 40% contrato',
    dataTravamento: new Date(),
  });

  // Custos padrão
  const custosValores: Partial<Record<CategoriaCusto, number>> = {
    COMPRA: 850000,
    BENEFICIAMENTO: 45000,
    SACARIA: 32000,
    FRETE_TERRESTRE: 28000,
    FRETE_MARITIMO: 65000,
    TARIFA_ARMADOR_PORTO: 14000,
    SERVICO_ESTUFF: 8500,
    COMISSAO: 12000,
    OUTROS_CUSTOS: 3500,
    COMPRA_MATERIA_PRIMA: 0,
    ESTUFAGEM_REDEX: 0,
    COMISSAO_INTERMEDIACAO: 0,
    OUTROS: 0,
  };

  for (const cat of Object.values(CategoriaCusto)) {
    store.custosItem.push({
      id: `custo_${fin1Id}_${cat}`,
      financeiroId: fin1Id,
      categoria: cat,
      valor: custosValores[cat] ?? 0,
      atualizadoPorId: 'usr_dev_admin',
      atualizadoEm: new Date(),
    });
  }

  // Mensagens de Chat do Processo 1
  store.chatMessages.push({
    id: 'chat_1',
    processoId: proc1Id,
    autorId: 'usr_dev_admin',
    mensagem: 'Iniciada a coordenação de estufagem no REDEX Santos.',
    criadoEm: new Date(Date.now() - 3600000 * 24),
  });

  // Logs de Auditoria do Processo 1
  store.auditLogs.push({
    id: 'audit_1',
    processoId: proc1Id,
    usuarioId: 'usr_dev_admin',
    acao: 'PROCESSO_CRIADO',
    detalhe: 'Processo BC26-001 criado com 18 etapas do workflow padrão.',
    alteracoes: null,
    criadoEm: proc1Date,
  });

  // 4. Processo 2: Embarcado
  const proc2Id = 'proc_bc26_002';
  const proc2Date = new Date();
  proc2Date.setDate(proc2Date.getDate() - 15);
  const deadline2 = new Date();
  deadline2.setDate(deadline2.getDate() - 2);

  store.processos.push({
    id: proc2Id,
    numeroProcesso: 'BC26-002',
    clienteFinal: 'Olam Global Agri Pte Ltd',
    traderIntermedio: 'Olam International',
    produto: 'Feijão Caupi Fradinho (Cowpea / Black Eye Pea)',
    volumeKg: 125000,
    incoterm: 'CFR',
    portoOrigem: 'Paranaguá - PR',
    portoDestino: 'Jebel Ali (AE)',
    freeTimeDestino: '21 dias',
    redex: 'TCP Paranaguá',
    valorDeclaradoUsd: 920,
    bookingNumero: 'CMA-77401-DXB',
    navio: 'CMA CGM ALEXANDER',
    deadlineEmbarque: deadline2,
    dataEstufagem: new Date(Date.now() - 6 * 86400000),
    localEstufagem: 'TCP Paranaguá',
    containerQtd: 5,
    containerTipo: "20' DRY",
    embalagemTipo: 'Sacas 50kg Juta',
    sacasPorContainer: 500,
    fumigacaoNecessaria: true,
    fumigacaoTipo: 'Brometo de Metila',
    fumigacaoTempoHoras: 48,
    armador: 'CMA CGM',
    necessitaEtiqueta: false,
    estufagemInicio: new Date(Date.now() - 8 * 86400000),
    estufagemFim: new Date(Date.now() - 6 * 86400000),
    mapaNaSequencia: false,
    ncm: '0713.35.90',
    cnpjBuyer: 'AE-992144-DXB',
    enderecoBuyer: 'Marina Plaza, Suite 2401, Dubai Marina, UAE',
    status: StatusNegociacao.EMBARCADO,
    statusCache: 'Embarcado',
    criadoPorId: 'usr_dev_admin',
    criadoEm: proc2Date,
    atualizadoEm: new Date(),
  });

  store.etapasTemplate.forEach((tmpl) => {
    store.processoEtapas.push({
      id: `pe_${peId++}`,
      processoId: proc2Id,
      etapaTemplateId: tmpl.id,
      status: 'CONCLUIDA',
      concluidaEm: new Date(),
      concluidaPorId: 'usr_dev_admin',
      documentoId: null,
      observacao: null,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
  });

  for (let i = 1; i <= 5; i++) {
    store.containers.push({
      id: `cont_${proc2Id}_${i}`,
      processoId: proc2Id,
      ordem: i,
      numeroContainer: `CMAU${5521000 + i}`,
      lacre: `CM-BR${8800 + i}`,
      pesoBruto: 25000,
      tara: 2250,
      tipoContainer: "20' DRY",
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
  }

  const fin2Id = `fin_${proc2Id}`;
  store.financeiros.push({
    id: fin2Id,
    processoId: proc2Id,
    precoUsd: 920,
    bancoDestino: 'BB AMERICA',
    statusRecebimento: 'RECEBIDO',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });

  store.cambiosTravados.push({
    id: `trav_${fin2Id}_1`,
    financeiroId: fin2Id,
    valorUsdParcial: 115000,
    ptax: 5.62,
    dataFechamento: new Date(Date.now() - 5 * 86400000),
    observacao: 'Hedge cambial 100% fixado com mesa BB Miami',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });

  const custosValores2: Partial<Record<CategoriaCusto, number>> = {
    COMPRA: 460000,
    BENEFICIAMENTO: 25000,
    SACARIA: 18000,
    FRETE_TERRESTRE: 22000,
    FRETE_MARITIMO: 48000,
    TARIFA_ARMADOR_PORTO: 9500,
    SERVICO_ESTUFF: 6000,
    COMISSAO: 7500,
    OUTROS_CUSTOS: 2500,
    COMPRA_MATERIA_PRIMA: 0,
    ESTUFAGEM_REDEX: 0,
    COMISSAO_INTERMEDIACAO: 0,
    OUTROS: 0,
  };

  for (const cat of Object.values(CategoriaCusto)) {
    store.custosItem.push({
      id: `custo_${fin2Id}_${cat}`,
      financeiroId: fin2Id,
      categoria: cat,
      valor: custosValores2[cat] ?? 0,
      atualizadoPorId: 'usr_dev_admin',
      atualizadoEm: new Date(),
    });
  }

  // 5. Processo 3: Gergelim Japão (Em Negociação / Alta Rentabilidade)
  const proc3Id = 'proc_bc26_003';
  const proc3Date = new Date();
  proc3Date.setDate(proc3Date.getDate() - 3);

  store.processos.push({
    id: proc3Id,
    numeroProcesso: 'BC26-003',
    clienteFinal: 'Nishimoto Trading Co. Ltd',
    traderIntermedio: 'Nishimoto Global Corp',
    produto: 'Gergelim Branco Natural 99.9%',
    volumeKg: 100000,
    incoterm: 'FOB',
    portoOrigem: 'Santos - SP',
    portoDestino: 'Yokohama (JP)',
    freeTimeDestino: '28 dias',
    redex: 'BTP Santos',
    valorDeclaradoUsd: 1450,
    bookingNumero: 'ONE-88120-TYO',
    navio: 'ONE HARBOUR',
    deadlineEmbarque: new Date(Date.now() + 18 * 86400000),
    dataEstufagem: new Date(Date.now() + 7 * 86400000),
    localEstufagem: 'BTP Santos',
    containerQtd: 4,
    containerTipo: "20' DRY",
    embalagemTipo: 'Sacas 25kg Kraft',
    sacasPorContainer: 1000,
    fumigacaoNecessaria: true,
    fumigacaoTipo: 'Fosfina',
    fumigacaoTempoHoras: 72,
    armador: 'Ocean Network Express (ONE)',
    necessitaEtiqueta: true,
    mapaNaSequencia: true,
    ncm: '1207.40.90',
    cnpjBuyer: 'JP-771920-TYO',
    enderecoBuyer: 'Chuo-ku, Nihonbashi 3-chome, Tóquio, Japão',
    status: StatusNegociacao.EM_NEGOCIACAO,
    statusCache: 'Em Negociação',
    criadoPorId: 'usr_dev_admin',
    criadoEm: proc3Date,
    atualizadoEm: new Date(),
  });

  const fin3Id = `fin_${proc3Id}`;
  store.financeiros.push({
    id: fin3Id,
    processoId: proc3Id,
    precoUsd: 1450,
    bancoDestino: 'BB BRASIL',
    statusRecebimento: 'A_RECEBER',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });

  store.cambiosTravados.push({
    id: `trav_${fin3Id}_1`,
    financeiroId: fin3Id,
    valorUsdParcial: 80000,
    ptax: 5.68,
    dataFechamento: new Date(Date.now() - 2 * 86400000),
    observacao: 'Trava parcial 55% fixada na abertura de mercado',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });

  const custosValores3: Partial<Record<CategoriaCusto, number>> = {
    COMPRA: 310000,
    BENEFICIAMENTO: 20000,
    SACARIA: 15000,
    FRETE_TERRESTRE: 16000,
    FRETE_MARITIMO: 0, // FOB
    TARIFA_ARMADOR_PORTO: 7000,
    SERVICO_ESTUFF: 5000,
    COMISSAO: 6000,
    OUTROS_CUSTOS: 2000,
    COMPRA_MATERIA_PRIMA: 0,
    ESTUFAGEM_REDEX: 0,
    COMISSAO_INTERMEDIACAO: 0,
    OUTROS: 0,
  };

  for (const cat of Object.values(CategoriaCusto)) {
    store.custosItem.push({
      id: `custo_${fin3Id}_${cat}`,
      financeiroId: fin3Id,
      categoria: cat,
      valor: custosValores3[cat] ?? 0,
      atualizadoPorId: 'usr_dev_admin',
      atualizadoEm: new Date(),
    });
  }

  return store;
}

// Singleton global mock store
const globalStore = (global as any).__belaMockStore || initMockStore();
if (process.env.NODE_ENV !== 'production') {
  (global as any).__belaMockStore = globalStore;
}

export function getMockStore(): MockStore {
  return globalStore;
}
