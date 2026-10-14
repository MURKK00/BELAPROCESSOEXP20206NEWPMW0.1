import fs from 'fs';
import path from 'path';
import { formatBancoDestinoWithProforma } from '../src/lib/proformaHelper';
import { formatComplementoWithComprador } from '../src/lib/compradorHelper';
import { CHECKLIST_ETAPAS, TIPOS_DOCUMENTO_CHECKLIST } from '../prisma/checklistData';

const STORAGE_FILE_PATH = path.join(process.cwd(), 'prisma', 'dev-store.json');

async function main() {
  console.log('🌱 Gerando dados de demonstração completos para a Bela Cereais...');

  // 1. Carrega ou recria base
  let store: any = {
    usuarios: [
      {
        id: 'usr_dev_admin',
        nome: 'Admin (Dev)',
        email: 'dev@belacereais.local',
        papel: 'ADMIN',
        criadoEm: new Date('2026-09-01T08:00:00.000Z'),
        atualizadoEm: new Date('2026-09-01T08:00:00.000Z'),
      },
    ],
    parceiros: [
      { id: 'parc_1', nome: 'Buonny', tipo: 'GERENCIADORA_RISCO', ativo: true, criadoEm: new Date('2026-09-01') },
      { id: 'parc_2', nome: 'CROMO', tipo: 'AGENTE_DESPACHANTE', ativo: true, criadoEm: new Date('2026-09-01') },
      { id: 'parc_3', nome: 'SCAN', tipo: 'AGENTE_BOOKING', ativo: true, criadoEm: new Date('2026-09-01') },
      { id: 'parc_4', nome: 'Port Inspect', tipo: 'INSPETORIA', ativo: true, criadoEm: new Date('2026-09-01') },
      { id: 'parc_5', nome: 'SURVEY / UNICCA', tipo: 'SURVEY_FUMIGACAO', ativo: true, criadoEm: new Date('2026-09-01') },
      { id: 'parc_6', nome: 'AT&M', tipo: 'SEGURADORA', ativo: true, criadoEm: new Date('2026-09-01') },
      { id: 'parc_7', nome: 'Banco do Brasil', tipo: 'BANCO', ativo: true, criadoEm: new Date('2026-09-01') },
      { id: 'parc_8', nome: 'DHL', tipo: 'TRANSPORTADORA_INTL', ativo: true, criadoEm: new Date('2026-09-01') },
      { id: 'parc_9', nome: 'Fretebras', tipo: 'TRANSPORTADORA', ativo: true, criadoEm: new Date('2026-09-01') },
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

  // Garante tipos de documento
  const tiposBase = [
    { nome: 'Minuta de Contrato de Compra', categoria: 'ADMINISTRATIVO', obrigatorioNoPacoteFinal: false },
    { nome: 'Contrato de Compra Assinado', categoria: 'ADMINISTRATIVO', obrigatorioNoPacoteFinal: false },
    { nome: 'Parecer de Risco (Buonny)', categoria: 'ADMINISTRATIVO', obrigatorioNoPacoteFinal: false },
    { nome: 'Ordem de Carregamento', categoria: 'ADMINISTRATIVO', obrigatorioNoPacoteFinal: false },
    { nome: 'Booking', categoria: 'BOOKING_TRANSPORTE', obrigatorioNoPacoteFinal: false },
    { nome: 'Borderô Bancário', categoria: 'FECHAMENTO_BANCARIO', obrigatorioNoPacoteFinal: false },
    { nome: 'Contrato de Câmbio', categoria: 'FECHAMENTO_BANCARIO', obrigatorioNoPacoteFinal: false },
    { nome: 'Photo Report', categoria: 'REDEX_CARREGAMENTO', obrigatorioNoPacoteFinal: false },
  ];

  let docIdCounter = 1;
  for (const t of [...tiposBase, ...TIPOS_DOCUMENTO_CHECKLIST]) {
    store.tiposDocumento.push({
      id: `td_${docIdCounter++}`,
      nome: t.nome,
      categoria: t.categoria,
      obrigatorioNoPacoteFinal: Boolean(t.obrigatorioNoPacoteFinal),
      criadoEm: new Date('2026-09-01'),
    });
  }

  // Garante etapas template (21 etapas)
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
      criadoEm: new Date('2026-09-01'),
    });
  }

  // 2. Definição dos 6 processos de demonstração
  const processosDemo = [
    {
      id: 'proc_bc26_001',
      numeroProcesso: 'BC26-001',
      clienteFinal: 'Al Dahra Global Trading LLC',
      traderIntermedio: 'Cofco International Agri',
      produto: 'Feijão Preto Extra - Safra 2026',
      volumeKg: 270000,
      incoterm: 'CFR',
      portoOrigem: 'SANTOS (Santos - BRSSZ)',
      portoDestino: 'Jebel Ali (AEJEA - Emirados Árabes Unidos)',
      freeTimeDestino: '21 dias livres no destino',
      redex: 'Elog Santos Armazéns Gerais',
      valorDeclaradoUsd: 840,
      localEstufagem: 'Elog Santos Armazéns Gerais',
      containerQtd: 10,
      containerTipo: "20' DRY",
      embalagemTipo: 'Sacaria 30kg',
      sacasPorContainer: 900,
      fumigacaoNecessaria: true,
      fumigacaoTipo: 'Fosfina (PH3) em Trânsito',
      fumigacaoTempoHoras: 48,
      armador: 'ONE',
      bookingNumero: 'BKG-ONE-892341',
      navio: 'ONE ARCADIA',
      deadlineDraftBl: new Date('2026-09-15T18:00:00.000Z'),
      deadlineDraftVgm: new Date('2026-09-17T12:00:00.000Z'),
      deadlineCarga: new Date('2026-09-18T16:00:00.000Z'),
      deadlineEmbarque: new Date('2026-09-20T00:00:00.000Z'),
      estufagemInicio: new Date('2026-09-10T08:00:00.000Z'),
      estufagemFim: new Date('2026-09-13T17:00:00.000Z'),
      mapaNaSequencia: true,
      necessitaEtiqueta: true,
      ncm: '0713.33.99',
      status: 'EMBARCADO',
      statusCache: 'Embarcado',
      criadoEm: new Date('2026-09-02T10:15:00.000Z'),
      atualizadoEm: new Date('2026-09-26T16:00:00.000Z'),
      enderecoBuyer: 'JAFZA South Zone, Plot 52-B, Gate 4',
      complementoBuyer: formatComplementoWithComprador('Warehouse 12', {
        diferente: true,
        nome: 'Al Dahra Global Trading LLC',
        endereco: 'Boulevard Plaza Tower 1, Suite 1902, Downtown Dubai',
        complemento: 'Floor 19',
        cidade: 'Dubai',
        pais: 'United Arab Emirates',
        taxId: 'TRN 100293847500003',
        email: 'commercial@aldahra-trading.com',
        telefone: '+971 4 456 7890',
        importadorNome: 'Al Dahra Agriculture LLC (Jebel Ali Clearance Branch)',
      }),
      cidadeBuyer: 'Dubai',
      paisBuyer: 'United Arab Emirates, PO BOX 18000',
      iecBuyer: 'AE-992019',
      panBuyer: 'N/A',
      fassaiBuyer: 'N/A',
      gstBuyer: 'VAT-AE-10029384',
      emailBuyer: 'clearance.jebelali@aldahra.com',
      telefoneBuyer: '+971 4 881 2345',
      containersCount: 10,
      etapasConcluidasCount: 18,
      finConfig: {
        precoUsd: 840,
        statusRecebimento: 'RECEBIDO',
        dataRecebimento: '2026-09-25T14:30:00.000Z',
        bancoBase: 'BB BRASIL',
        proforma: {
          temProforma: true,
          valorProformaBrutoUsd: 68040,
          taxaProformaUsd: 15,
          statusProforma: 'RECEBIDO' as const,
          dataProforma: '2026-09-08',
          valorSaldoBrutoUsd: 158760,
          taxaSaldoUsd: 25,
          statusSaldo: 'RECEBIDO' as const,
          dataSaldo: '2026-09-25',
        },
        travas: [
          { valorUsd: 68025, ptax: 5.5120, taxa: 15, data: '2026-09-08', obs: 'Trava Pro-forma 30% creditada' },
          { valorUsd: 158735, ptax: 5.5480, taxa: 25, data: '2026-09-25', obs: 'Trava Saldo 70% contra liberação BL' },
        ],
        custos: {
          COMPRA: 820000,
          BENEFICIAMENTO: 38500,
          SACARIA: 24300,
          FRETE_TERRESTRE: 54000,
          FRETE_MARITIMO: 86400,
          TARIFA_ARMADOR_PORTO: 21000,
          SERVICO_ESTUFF: 16500,
          COMISSAO: 14000,
          OUTROS_CUSTOS: 8900,
        },
      },
    },

    {
      id: 'proc_bc26_002',
      numeroProcesso: 'BC26-002',
      clienteFinal: 'Meghna Group of Industries',
      traderIntermedio: 'Bunge Alimentos SA',
      produto: 'Soja Não Transgênica (Non-GMO Ipê)',
      volumeKg: 540000,
      incoterm: 'CFR',
      portoOrigem: 'PARANAGUA (Paranaguá - BRPNG)',
      portoDestino: 'Chittagong (BDCGP - Bangladesh)',
      freeTimeDestino: '28 dias livres no destino',
      redex: 'TCP Terminal de Contêineres de Paranaguá',
      valorDeclaradoUsd: 590,
      localEstufagem: 'TCP Terminal de Contêineres de Paranaguá',
      containerQtd: 20,
      containerTipo: "20' DRY",
      embalagemTipo: 'Sacaria 50kg',
      sacasPorContainer: 540,
      fumigacaoNecessaria: true,
      fumigacaoTipo: 'Brometo de Metila',
      fumigacaoTempoHoras: 24,
      armador: 'Maersk',
      bookingNumero: 'BKG-MAE-447812',
      navio: 'MAERSK TAURUS',
      deadlineDraftBl: new Date('2026-10-12T18:00:00.000Z'),
      deadlineDraftVgm: new Date('2026-10-14T12:00:00.000Z'),
      deadlineCarga: new Date('2026-10-16T16:00:00.000Z'),
      deadlineEmbarque: new Date('2026-10-18T00:00:00.000Z'),
      estufagemInicio: new Date('2026-10-06T08:00:00.000Z'),
      estufagemFim: new Date('2026-10-10T17:00:00.000Z'),
      mapaNaSequencia: true,
      necessitaEtiqueta: true,
      ncm: '1201.90.00',
      status: 'EM_EXECUCAO',
      statusCache: 'Estufagem / Redex',
      criadoEm: new Date('2026-09-12T14:20:00.000Z'),
      atualizadoEm: new Date('2026-10-02T11:00:00.000Z'),
      enderecoBuyer: 'Meghna Ghat, Sonargaon',
      complementoBuyer: 'Industrial Park Block A',
      cidadeBuyer: 'Narayanganj / Dhaka',
      paisBuyer: 'Bangladesh, ZIP 1440',
      iecBuyer: 'BD-0098231',
      panBuyer: 'N/A',
      fassaiBuyer: 'BSTI-9021',
      gstBuyer: 'BIN 001298456',
      emailBuyer: 'import@meghnagroup.biz',
      telefoneBuyer: '+880 2 956 1234',
      containersCount: 20,
      etapasConcluidasCount: 11,
      finConfig: {
        precoUsd: 590,
        statusRecebimento: 'A_RECEBER',
        dataRecebimento: null,
        bancoBase: 'BB BRASIL',
        proforma: {
          temProforma: true,
          valorProformaBrutoUsd: 79650,
          taxaProformaUsd: 15,
          statusProforma: 'RECEBIDO' as const,
          dataProforma: '2026-09-30',
          valorSaldoBrutoUsd: 238950,
          taxaSaldoUsd: 25,
          statusSaldo: 'A_RECEBER' as const,
          dataSaldo: null,
        },
        travas: [
          { valorUsd: 79635, ptax: 5.5620, taxa: 15, data: '2026-09-30', obs: 'Hedge Parcial da Pro-forma 25%' },
        ],
        custos: {
          COMPRA: 1150000,
          BENEFICIAMENTO: 62000,
          SACARIA: 35000,
          FRETE_TERRESTRE: 92000,
          FRETE_MARITIMO: 168000,
          TARIFA_ARMADOR_PORTO: 42000,
          SERVICO_ESTUFF: 32000,
          COMISSAO: 22000,
          OUTROS_CUSTOS: 14500,
        },
      },
    },

    {
      id: 'proc_bc26_003',
      numeroProcesso: 'BC26-003',
      clienteFinal: 'ITC Agri Business Ltd',
      traderIntermedio: 'Olam Agri Commodities',
      produto: 'Gergelim Branco Natural Selecionado',
      volumeKg: 160000,
      incoterm: 'FOB',
      portoOrigem: 'SANTOS (Santos - BRSSZ)',
      portoDestino: 'Nhava Sheva (INNSA - Índia)',
      freeTimeDestino: '14 dias livres no destino',
      redex: 'Terminal Bandeirantes Santos',
      valorDeclaradoUsd: 1350,
      localEstufagem: 'Terminal Bandeirantes Santos',
      containerQtd: 8,
      containerTipo: "20' DRY",
      embalagemTipo: 'Sacaria 25kg',
      sacasPorContainer: 800,
      fumigacaoNecessaria: true,
      fumigacaoTipo: 'Fosfina (PH3)',
      fumigacaoTempoHoras: 72,
      armador: 'CMA CGM',
      bookingNumero: 'BKG-CMA-991204',
      navio: 'CMA CGM TIGRIS',
      deadlineDraftBl: new Date('2026-10-18T18:00:00.000Z'),
      deadlineDraftVgm: new Date('2026-10-20T12:00:00.000Z'),
      deadlineCarga: new Date('2026-10-22T16:00:00.000Z'),
      deadlineEmbarque: new Date('2026-10-25T00:00:00.000Z'),
      estufagemInicio: new Date('2026-10-14T08:00:00.000Z'),
      estufagemFim: new Date('2026-10-16T17:00:00.000Z'),
      mapaNaSequencia: true,
      necessitaEtiqueta: true,
      ncm: '1207.40.10',
      status: 'EM_EXECUCAO',
      statusCache: 'Booking & Transporte',
      criadoEm: new Date('2026-09-18T09:30:00.000Z'),
      atualizadoEm: new Date('2026-10-03T15:45:00.000Z'),
      enderecoBuyer: 'Plot No. 42, GIDC Industrial Estate',
      complementoBuyer: 'Phase II, Near Port Road',
      cidadeBuyer: 'Gandhidham, Gujarat',
      paisBuyer: 'India, PIN 370201',
      iecBuyer: '0588001234',
      panBuyer: 'AABCT1234F',
      fassaiBuyer: '10019022009383',
      gstBuyer: '24AABCT1234F1Z2',
      emailBuyer: 'import@rstrivenifoods.in',
      telefoneBuyer: '+91 2836 223456',
      containersCount: 8,
      etapasConcluidasCount: 7,
      finConfig: {
        precoUsd: 1350,
        statusRecebimento: 'A_RECEBER',
        dataRecebimento: null,
        bancoBase: 'BB BRASIL',
        proforma: {
          temProforma: false,
          valorUnicoBrutoUsd: 216000,
          taxaUnicoUsd: 20,
          statusUnico: 'A_RECEBER' as const,
          dataUnico: null,
        },
        travas: [
          { valorUsd: 100000, ptax: 5.5350, taxa: 20, data: '2026-10-01', obs: 'Trava antecipada parcial USD 100k' },
        ],
        custos: {
          COMPRA: 740000,
          BENEFICIAMENTO: 32000,
          SACARIA: 18000,
          FRETE_TERRESTRE: 42000,
          FRETE_MARITIMO: 0,
          TARIFA_ARMADOR_PORTO: 16000,
          SERVICO_ESTUFF: 14000,
          COMISSAO: 12000,
          OUTROS_CUSTOS: 7200,
        },
      },
    },

    {
      id: 'proc_bc26_004',
      numeroProcesso: 'BC26-004',
      clienteFinal: 'Anadolu Agro Import Corp',
      traderIntermedio: 'ADM do Brasil',
      produto: 'Feijão Carioca Tipo 1 (Cores Claras)',
      volumeKg: 216000,
      incoterm: 'CFR',
      portoOrigem: 'PARANAGUA (Paranaguá - BRPNG)',
      portoDestino: 'Mersin (TRMER - Turquia)',
      freeTimeDestino: '21 dias livres no destino',
      redex: 'Rocha Terminais Paranaguá',
      valorDeclaradoUsd: 920,
      localEstufagem: 'Rocha Terminais Paranaguá',
      containerQtd: 8,
      containerTipo: "20' DRY",
      embalagemTipo: 'Sacaria 30kg',
      sacasPorContainer: 900,
      fumigacaoNecessaria: true,
      fumigacaoTipo: 'Fosfina',
      fumigacaoTempoHoras: 48,
      armador: 'Hapag-Lloyd',
      bookingNumero: 'BKG-HL-773190',
      navio: 'HAPAG LLOYD SANTOS',
      deadlineDraftBl: new Date('2026-09-18T18:00:00.000Z'),
      deadlineDraftVgm: new Date('2026-09-20T12:00:00.000Z'),
      deadlineCarga: new Date('2026-09-22T16:00:00.000Z'),
      deadlineEmbarque: new Date('2026-09-24T00:00:00.000Z'),
      estufagemInicio: new Date('2026-09-12T08:00:00.000Z'),
      estufagemFim: new Date('2026-09-15T17:00:00.000Z'),
      mapaNaSequencia: true,
      necessitaEtiqueta: true,
      ncm: '0713.33.99',
      status: 'FINALIZADO',
      statusCache: 'Finalizado',
      criadoEm: new Date('2026-09-05T11:00:00.000Z'),
      atualizadoEm: new Date('2026-09-29T18:00:00.000Z'),
      enderecoBuyer: 'Akdeniz Mah. Ismet Inonu Bulvari No: 78',
      complementoBuyer: 'Kat 4, Daire 12',
      cidadeBuyer: 'Mersin',
      paisBuyer: 'Turkey, TR-33010',
      iecBuyer: 'TR-7719203',
      panBuyer: 'N/A',
      fassaiBuyer: 'TARIM-TR-8819',
      gstBuyer: 'VKN 0680192834',
      emailBuyer: 'operasyon@anadoluagro.com.tr',
      telefoneBuyer: '+90 324 238 9012',
      containersCount: 8,
      etapasConcluidasCount: 21,
      finConfig: {
        precoUsd: 920,
        statusRecebimento: 'RECEBIDO',
        dataRecebimento: '2026-09-28T10:00:00.000Z',
        bancoBase: 'BB AMERICA',
        proforma: {
          temProforma: false,
          valorUnicoBrutoUsd: 198720,
          taxaUnicoUsd: 20,
          statusUnico: 'RECEBIDO' as const,
          dataUnico: '2026-09-28',
        },
        travas: [
          { valorUsd: 198700, ptax: 5.4950, taxa: 20, data: '2026-09-28', obs: 'Liquidado 100% à vista em BB América' },
        ],
        custos: {
          COMPRA: 720000,
          BENEFICIAMENTO: 34000,
          SACARIA: 21000,
          FRETE_TERRESTRE: 48000,
          FRETE_MARITIMO: 72000,
          TARIFA_ARMADOR_PORTO: 18000,
          SERVICO_ESTUFF: 15000,
          COMISSAO: 12500,
          OUTROS_CUSTOS: 7500,
        },
      },
    },

    {
      id: 'proc_bc26_005',
      numeroProcesso: 'BC26-005',
      clienteFinal: 'Vina Agri Commodities Joint Stock Co',
      traderIntermedio: 'Louis Dreyfus Company',
      produto: 'Milho Pipoca Especial (Butterfly Grade)',
      volumeKg: 135000,
      incoterm: 'CFR',
      portoOrigem: 'SANTOS (Santos - BRSSZ)',
      portoDestino: 'Hai Phong (VNHPH - Vietnã)',
      freeTimeDestino: '21 dias livres no destino',
      redex: 'Terminal Deicmar Santos',
      valorDeclaradoUsd: 780,
      localEstufagem: 'Terminal Deicmar Santos',
      containerQtd: 5,
      containerTipo: "20' DRY",
      embalagemTipo: 'Sacaria 25kg',
      sacasPorContainer: 1080,
      fumigacaoNecessaria: true,
      fumigacaoTipo: 'Fosfina',
      fumigacaoTempoHoras: 48,
      armador: 'Evergreen',
      bookingNumero: 'BKG-EMC-302918',
      navio: 'EVER GLOBE',
      deadlineDraftBl: new Date('2026-10-25T18:00:00.000Z'),
      deadlineDraftVgm: new Date('2026-10-27T12:00:00.000Z'),
      deadlineCarga: new Date('2026-10-29T16:00:00.000Z'),
      deadlineEmbarque: new Date('2026-10-31T00:00:00.000Z'),
      estufagemInicio: new Date('2026-10-20T08:00:00.000Z'),
      estufagemFim: new Date('2026-10-23T17:00:00.000Z'),
      mapaNaSequencia: true,
      necessitaEtiqueta: true,
      ncm: '1005.90.10',
      status: 'EM_NEGOCIACAO',
      statusCache: 'Comercial / Contrato',
      criadoEm: new Date('2026-09-28T16:00:00.000Z'),
      atualizadoEm: new Date('2026-10-04T09:00:00.000Z'),
      enderecoBuyer: 'El Geish Avenue, Port Area',
      complementoBuyer: 'Commercial Building 5',
      cidadeBuyer: 'Alexandria',
      paisBuyer: 'Egypt, EG-21500',
      iecBuyer: 'EG-IMP-55192',
      panBuyer: 'N/A',
      fassaiBuyer: 'NFSA-EG-4401',
      gstBuyer: 'TAX-REG-291823',
      emailBuyer: 'clearance@goldengrain-eg.com',
      telefoneBuyer: '+20 3 487 6543',
      containersCount: 5,
      etapasConcluidasCount: 4,
      finConfig: {
        precoUsd: 780,
        statusRecebimento: 'A_RECEBER',
        dataRecebimento: null,
        bancoBase: 'BB BRASIL',
        proforma: {
          temProforma: true,
          valorProformaBrutoUsd: 21060,
          taxaProformaUsd: 10,
          statusProforma: 'A_RECEBER' as const,
          dataProforma: null,
          valorSaldoBrutoUsd: 84240,
          taxaSaldoUsd: 20,
          statusSaldo: 'A_RECEBER' as const,
          dataSaldo: null,
        },
        travas: [],
        custos: {
          COMPRA: 410000,
          BENEFICIAMENTO: 22000,
          SACARIA: 14000,
          FRETE_TERRESTRE: 28000,
          FRETE_MARITIMO: 48000,
          TARIFA_ARMADOR_PORTO: 12000,
          SERVICO_ESTUFF: 9500,
          COMISSAO: 8000,
          OUTROS_CUSTOS: 4500,
        },
      },
    },

    {
      id: 'proc_bc26_006',
      numeroProcesso: 'BC26-006',
      clienteFinal: 'Mediterranean Pulse Traders SL',
      traderIntermedio: 'Glencore Agriculture',
      produto: 'Feijão Rajado Extra (Pinto Beans)',
      volumeKg: 108000,
      incoterm: 'FOB',
      portoOrigem: 'SANTOS (Santos - BRSSZ)',
      portoDestino: 'Valência (ESVLC - Espanha)',
      freeTimeDestino: '14 dias livres no destino',
      redex: 'Elog Santos Armazéns Gerais',
      valorDeclaradoUsd: 1050,
      localEstufagem: 'Elog Santos Armazéns Gerais',
      containerQtd: 4,
      containerTipo: "20' DRY",
      embalagemTipo: 'Sacaria 30kg',
      sacasPorContainer: 900,
      fumigacaoNecessaria: true,
      fumigacaoTipo: 'Brometo de Metila',
      fumigacaoTempoHoras: 24,
      armador: 'MSC',
      bookingNumero: 'BKG-MSC-619283',
      navio: 'MSC CLARA',
      deadlineDraftBl: new Date('2026-10-15T18:00:00.000Z'),
      deadlineDraftVgm: new Date('2026-10-17T12:00:00.000Z'),
      deadlineCarga: new Date('2026-10-19T16:00:00.000Z'),
      deadlineEmbarque: new Date('2026-10-21T00:00:00.000Z'),
      estufagemInicio: new Date('2026-10-11T08:00:00.000Z'),
      estufagemFim: new Date('2026-10-13T17:00:00.000Z'),
      mapaNaSequencia: true,
      necessitaEtiqueta: true,
      ncm: '0713.33.99',
      status: 'EM_EXECUCAO',
      statusCache: 'Documentação & DU-E',
      criadoEm: new Date('2026-09-22T13:40:00.000Z'),
      atualizadoEm: new Date('2026-10-04T17:30:00.000Z'),
      enderecoBuyer: 'Avenida del Puerto 142',
      complementoBuyer: 'Edificio Maritimo, Planta 3',
      cidadeBuyer: 'Valencia',
      paisBuyer: 'Spain, ES-46024',
      iecBuyer: 'ESB98765432',
      panBuyer: 'N/A',
      fassaiBuyer: 'TRACES-ES-12093',
      gstBuyer: 'NIF ESB98765432',
      emailBuyer: 'logistica@mediterraneanpulses.es',
      telefoneBuyer: '+34 963 123 456',
      containersCount: 4,
      etapasConcluidasCount: 9,
      finConfig: {
        precoUsd: 1050,
        statusRecebimento: 'A_RECEBER',
        dataRecebimento: null,
        bancoBase: 'BB BRASIL',
        proforma: {
          temProforma: true,
          valorProformaBrutoUsd: 34020,
          taxaProformaUsd: 15,
          statusProforma: 'RECEBIDO' as const,
          dataProforma: '2026-10-02',
          valorSaldoBrutoUsd: 79380,
          taxaSaldoUsd: 20,
          statusSaldo: 'A_RECEBER' as const,
          dataSaldo: null,
        },
        travas: [
          { valorUsd: 34005, ptax: 5.5820, taxa: 15, data: '2026-10-02', obs: 'Hedge da Parcela Entrada 30%' },
        ],
        custos: {
          COMPRA: 460000,
          BENEFICIAMENTO: 24000,
          SACARIA: 13500,
          FRETE_TERRESTRE: 26000,
          FRETE_MARITIMO: 0,
          TARIFA_ARMADOR_PORTO: 11000,
          SERVICO_ESTUFF: 8800,
          COMISSAO: 7500,
          OUTROS_CUSTOS: 4200,
        },
      },
    },
  ];

  // 3. Itera sobre os processos e gera seus registros relacionados
  for (const p of processosDemo) {
    const { containersCount, etapasConcluidasCount, finConfig, ...procData } = p;
    store.processos.push({
      ...procData,
      criadoPorId: 'usr_dev_admin',
    });

    // Containers com dados detalhados
    const containerPrefixes = ['MSKU', 'ONEY', 'TCLU', 'CMAU', 'MEDU', 'HLXU'];
    const pidx = parseInt(p.numeroProcesso.slice(-1), 10) || 1;
    const prefix = containerPrefixes[(pidx - 1) % containerPrefixes.length];

    for (let c = 1; c <= containersCount; c++) {
      const containerNumber = `${prefix}${String(340912 + pidx * 100 + c).padStart(7, '0')}`;
      const lacreNumber = `BR-SEAL-${String(88000 + pidx * 200 + c)}`;
      const sacas = p.sacasPorContainer || 900;
      const pesoPorSaca = (p.volumeKg / (containersCount * sacas)) || 30;
      const pesoLiquido = sacas * pesoPorSaca;
      const tara = 2200;
      const pesoBruto = pesoLiquido + tara;

      store.containers.push({
        id: `cont_${p.id}_${c}`,
        processoId: p.id,
        ordem: c,
        numeroContainer: containerNumber,
        lacre: lacreNumber,
        pesoBruto,
        pesoLiquido,
        totalSacos: sacas,
        tara,
        tipoContainer: p.containerTipo || "20' DRY",
        atualizadoEm: p.atualizadoEm,
      });
    }

    // Etapas do checklist
    let etapaSeq = 1;
    for (const tmpl of store.etapasTemplate) {
      const isConcluida = etapaSeq <= etapasConcluidasCount;
      const isEmAndamento = etapaSeq === etapasConcluidasCount + 1;
      const status = isConcluida ? 'CONCLUIDA' : isEmAndamento ? 'EM_ANDAMENTO' : 'PENDENTE';

      store.processoEtapas.push({
        id: `pe_${p.id}_${tmpl.id}`,
        processoId: p.id,
        etapaTemplateId: tmpl.id,
        status,
        concluidaEm: isConcluida ? new Date('2026-09-15') : null,
        concluidaPorId: isConcluida ? 'usr_dev_admin' : null,
        documentoId: null,
        observacao: isConcluida ? 'Concluído conforme conferência operacional' : null,
        criadoEm: p.criadoEm,
        atualizadoEm: p.atualizadoEm,
      });
      etapaSeq++;
    }

    // Financeiro & Banco com Tag Proforma
    const finId = `fin_${p.id}`;
    const bancoDestinoFormatado = formatBancoDestinoWithProforma(finConfig.bancoBase, finConfig.proforma);

    store.financeiros.push({
      id: finId,
      processoId: p.id,
      precoUsd: finConfig.precoUsd,
      bancoDestino: bancoDestinoFormatado,
      statusRecebimento: finConfig.statusRecebimento,
      dataRecebimento: finConfig.dataRecebimento ? new Date(finConfig.dataRecebimento) : null,
      atualizadoEm: p.atualizadoEm,
    });

    // Travamentos Cambiais
    let tIdx = 1;
    for (const tr of finConfig.travas) {
      store.cambiosTravados.push({
        id: `trava_${finId}_${tIdx++}`,
        financeiroId: finId,
        valorUsdParcial: tr.valorUsd,
        ptax: tr.ptax,
        taxa: tr.taxa,
        moedaTaxa: 'USD',
        valorLiquido: tr.valorUsd * tr.ptax,
        dataTravamento: new Date(`${tr.data}T12:00:00.000Z`),
        observacao: tr.obs,
        atualizadoEm: new Date(`${tr.data}T12:00:00.000Z`),
      });
    }

    // Custos Operacionais
    for (const [cat, val] of Object.entries(finConfig.custos)) {
      store.custosItem.push({
        id: `custo_${finId}_${cat}`,
        financeiroId: finId,
        categoria: cat,
        valor: val,
        atualizadoPorId: 'usr_dev_admin',
        atualizadoEm: p.atualizadoEm,
      });
    }

    // Documentos GED de exemplo
    const docsExemplo = [
      { nome: `BL-${p.numeroProcesso}.pdf`, tipo: 'BL Original', categoria: 'DOCUMENTACAO_EXPORTACAO' },
      { nome: `Invoice-${p.numeroProcesso}.pdf`, tipo: 'Comercial Invoice', categoria: 'DOCUMENTACAO_EXPORTACAO' },
      { nome: `DUE-${p.numeroProcesso}.pdf`, tipo: 'DU-E', categoria: 'DOCUMENTACAO_EXPORTACAO' },
    ];
    let docIdx = 1;
    for (const d of docsExemplo) {
      const tipoObj = store.tiposDocumento.find((t: any) => t.nome === d.tipo);
      store.documentos.push({
        id: `doc_${p.id}_${docIdx++}`,
        processoId: p.id,
        nome: d.nome,
        url: `/uploads/docs/${d.nome}`,
        categoria: d.categoria,
        tipoDocumentoId: tipoObj?.id ?? null,
        criadoEm: p.criadoEm,
        uploadedById: 'usr_dev_admin',
      });
    }

    // Audit logs
    store.auditLogs.push({
      id: `log_${p.id}_create`,
      processoId: p.id,
      usuarioId: 'usr_dev_admin',
      acao: 'PROCESSO_CRIADO',
      detalhe: `Processo ${p.numeroProcesso} criado com sucesso no sistema.`,
      criadoEm: p.criadoEm,
    });
  }

  // Grava o dev-store.json
  fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  console.log(`✅ Sucesso! ${processosDemo.length} processos de demonstração gerados com sucesso em dev-store.json.`);
  console.log(`   - Contêineres: ${store.containers.length}`);
  console.log(`   - Etapas de checklist: ${store.processoEtapas.length}`);
  console.log(`   - Travamentos cambiais: ${store.cambiosTravados.length}`);
  console.log(`   - Custos de DRE: ${store.custosItem.length}`);
  console.log(`   - Documentos GED: ${store.documentos.length}`);
}

main().catch((err) => {
  console.error('Erro ao gerar dados de demonstração:', err);
  process.exit(1);
});
