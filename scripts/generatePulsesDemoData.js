const fs = require('fs');
const path = require('path');

const DEMO_STORE_PATH = path.join(__dirname, '..', 'prisma', 'demo-store.json');
const DEV_STORE_PATH = path.join(__dirname, '..', 'prisma', 'dev-store.json');

// Carrega dados base
const { getDemoCadastrosData } = require('../src/lib/demoCadastrosData');
const { getDemoNotasFiscaisData } = require('../src/lib/demoNotasFiscaisData');

const agora = new Date().toISOString();

// 1. Usuário Único Admin Master
const usuarios = [
  {
    id: 'usr_admin_master',
    nome: 'Administrador PEX',
    email: 'admin@pexagritech.com',
    username: 'ADMIN',
    senhaHash: '$2b$10$f4djZ/xMUMx27iEBmL.GB.nvyAqyCIjN9kNec9lBJI8GyW0MEm42m', // @Bela2026
    primeiroAcesso: false,
    papel: 'ADMIN',
    papeis: ['ADMIN', 'DIRETORIA', 'COMERCIAL', 'FINANCEIRO', 'ADMINISTRATIVO'],
    ativo: true,
    criadoEm: '2026-11-06T00:00:00.000Z',
    atualizadoEm: '2026-11-06T00:00:00.000Z',
  },
];

// 2. Parceiros Operacionais
const parceiros = [
  { id: 'parc_1', nome: 'Buonny', tipo: 'GERENCIADORA_RISCO', ativo: true, criadoEm: agora },
  { id: 'parc_2', nome: 'CROMO Despachos Aduaneiros', tipo: 'AGENTE_DESPACHANTE', ativo: true, criadoEm: agora },
  { id: 'parc_3', nome: 'SCAN Shipping & Logistics', tipo: 'AGENTE_BOOKING', ativo: true, criadoEm: agora },
  { id: 'parc_4', nome: 'Port Inspect Brasil', tipo: 'INSPETORIA', ativo: true, criadoEm: agora },
  { id: 'parc_5', nome: 'SURVEY / UNICCA Fumigações', tipo: 'SURVEY_FUMIGACAO', ativo: true, criadoEm: agora },
  { id: 'parc_6', nome: 'AT&M Seguros Internacionais', tipo: 'SEGURADORA', ativo: true, criadoEm: agora },
  { id: 'parc_7', nome: 'Banco do Brasil S/A', tipo: 'BANCO', ativo: true, criadoEm: agora },
  { id: 'parc_8', nome: 'DHL Global Forwarding', tipo: 'TRANSPORTADORA_INTL', ativo: true, criadoEm: agora },
  { id: 'parc_9', nome: 'Rumo Logística Intermodal', tipo: 'TRANSPORTADORA', ativo: true, criadoEm: agora },
];

// 3. Tipos de Documento
const tiposDocumento = [
  { id: 'td_1', nome: 'Minuta de Contrato de Compra', categoria: 'ADMINISTRATIVO', obrigatorioNoPacoteFinal: false, criadoEm: agora },
  { id: 'td_2', nome: 'Contrato de Compra Assinado', categoria: 'ADMINISTRATIVO', obrigatorioNoPacoteFinal: false, criadoEm: agora },
  { id: 'td_3', nome: 'Parecer de Risco (Buonny)', categoria: 'ADMINISTRATIVO', obrigatorioNoPacoteFinal: false, criadoEm: agora },
  { id: 'td_4', nome: 'Ordem de Carregamento', categoria: 'ADMINISTRATIVO', obrigatorioNoPacoteFinal: false, criadoEm: agora },
  { id: 'td_5', nome: 'Booking Armador', categoria: 'BOOKING_TRANSPORTE', obrigatorioNoPacoteFinal: false, criadoEm: agora },
  { id: 'td_6', nome: 'Borderô Bancário CAD', categoria: 'FECHAMENTO_BANCARIO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_7', nome: 'Contrato de Câmbio', categoria: 'FECHAMENTO_BANCARIO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_8', nome: 'Photo Report de Estufagem', categoria: 'REDEX_CARREGAMENTO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_9', nome: 'Declaração Única de Exportação (DU-E)', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_10', nome: 'Certificado Fitossanitário MAPA', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_11', nome: 'Bill of Lading (BL Original)', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_12', nome: 'Fatura Comercial (Commercial Invoice)', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_13', nome: 'Packing List (Romaneio de Carga)', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_14', nome: 'Certificado de Origem Internacional', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_15', nome: 'Certificado de Fumigação', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_16', nome: 'Laudo de Análise e Qualidade (SGS / Bureau Veritas)', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_17', nome: 'Certificado de Peso e Tara (VGM SOLAS)', categoria: 'REDEX_CARREGAMENTO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_18', nome: 'Comprovante de Averbação Aduaneira', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
  { id: 'td_19', nome: 'Swift de Liquidação Cambial', categoria: 'FECHAMENTO_BANCARIO', obrigatorioNoPacoteFinal: true, criadoEm: agora },
];

// 4. Etapas Template (Workflow padrão PEX)
const etapasTemplate = [
  { id: 'tmpl_1', numero: '1.1', ordem: 1, fase: 'COMERCIAL', etapa: 'Confirmação do Pedido e Preço USD', raiaResponsavel: 'COMERCIAL', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_2', numero: '1.2', ordem: 2, fase: 'COMERCIAL', etapa: 'Emissão e Assinatura da Proforma Invoice', raiaResponsavel: 'COMERCIAL', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_3', numero: '1.3', ordem: 3, fase: 'COMERCIAL', etapa: 'Cadastro e Due Diligence do Importador', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: false, criadoEm: agora },
  { id: 'tmpl_4', numero: '2.1', ordem: 4, fase: 'PRODUTOR_VENDEDOR', etapa: 'Vínculo do Produtor Rural e CAR Ambiental', raiaResponsavel: 'COMERCIAL', geraDocumento: false, criadoEm: agora },
  { id: 'tmpl_5', numero: '2.2', ordem: 5, fase: 'PRODUTOR_VENDEDOR', etapa: 'Contrato de Compra e Laudo de Classificação do Grão', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_6', numero: '2.3', ordem: 6, fase: 'PRODUTOR_VENDEDOR', etapa: 'Consulta de Risco Gerenciadora Buonny', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_7', numero: '3.1', ordem: 7, fase: 'ADMINISTRATIVO', etapa: 'Emissão da Nota Fiscal de Entrada / Depósito (CFOP 5.901)', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_8', numero: '3.2', ordem: 8, fase: 'ADMINISTRATIVO', etapa: 'Emissão de Ordem de Carregamento', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_9', numero: '4.1', ordem: 9, fase: 'INDUSTRIA_BENEFICIAMENTO', etapa: 'Beneficiamento, Padronização e Ensaque do Grão', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: false, criadoEm: agora },
  { id: 'tmpl_10', numero: '4.2', ordem: 10, fase: 'INDUSTRIA_BENEFICIAMENTO', etapa: 'Classificação Oficial MAPA e Amostragem', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_11', numero: '5.1', ordem: 11, fase: 'BOOKING_TRANSPORTE', etapa: 'Solicitação e Confirmação de Booking junto ao Armador', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_12', numero: '5.2', ordem: 12, fase: 'BOOKING_TRANSPORTE', etapa: 'Confirmação de Navio, Deadlines e Free Time', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: false, criadoEm: agora },
  { id: 'tmpl_13', numero: '5.3', ordem: 13, fase: 'BOOKING_TRANSPORTE', etapa: 'Contratação do Frete Rodoviário / Intermodal', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: false, criadoEm: agora },
  { id: 'tmpl_14', numero: '6.1', ordem: 14, fase: 'CARREGAMENTO', etapa: 'Emissão da Nota Fiscal de Remessa para Embarque (CFOP 5.905)', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_15', numero: '6.2', ordem: 15, fase: 'CARREGAMENTO', etapa: 'Retirada de Contêineres Vazios no Porto / Depot', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: false, criadoEm: agora },
  { id: 'tmpl_16', numero: '7.1', ordem: 16, fase: 'CARREGAMENTO_REDEX', etapa: 'Estufagem, Lacração e Pesagem (VGM SOLAS)', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_17', numero: '7.2', ordem: 17, fase: 'CARREGAMENTO_REDEX', etapa: 'Fumigação dos Contêineres e Emissão de Laudo', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_18', numero: '7.3', ordem: 18, fase: 'CARREGAMENTO_REDEX', etapa: 'Geração e Transmissão do Registro Único de Exportação (RUC)', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: false, criadoEm: agora },
  { id: 'tmpl_19', numero: '8.1', ordem: 19, fase: 'DOCUMENTACAO_EXPORTACAO', etapa: 'Registro da DU-E (Declaração Única de Exportação)', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_20', numero: '8.2', ordem: 20, fase: 'DOCUMENTACAO_EXPORTACAO', etapa: 'Emissão e Aprovação do Draft BL', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_21', numero: '8.3', ordem: 21, fase: 'DOCUMENTACAO_EXPORTACAO', etapa: 'Inspeção e Emissão do Certificado Fitossanitário MAPA', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_22', numero: '8.4', ordem: 22, fase: 'DOCUMENTACAO_EXPORTACAO', etapa: 'Emissão da Nota Fiscal de Exportação (CFOP 7.101)', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_23', numero: '9.1', ordem: 23, fase: 'TERMINAL_PORTO', etapa: 'Entrega dos Contêineres no Gate do Terminal (Gate In)', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: false, criadoEm: agora },
  { id: 'tmpl_24', numero: '9.2', ordem: 24, fase: 'TERMINAL_PORTO', etapa: 'Desembaraço Aduaneiro Parametrização Canal Verde', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_25', numero: '9.3', ordem: 25, fase: 'TERMINAL_PORTO', etapa: 'Embarque a Bordo do Navio e Emissão do BL Final', raiaResponsavel: 'ADMINISTRATIVO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_26', numero: '10.1', ordem: 26, fase: 'FECHAMENTO_BANCARIO', etapa: 'Averbação da DU-E e Envio do Dossiê ao Banco (Borderô CAD)', raiaResponsavel: 'FINANCEIRO', geraDocumento: true, criadoEm: agora },
  { id: 'tmpl_27', numero: '10.2', ordem: 27, fase: 'FECHAMENTO_BANCARIO', etapa: 'Liquidação Cambial e Crédito em Conta Corrente', raiaResponsavel: 'FINANCEIRO', geraDocumento: true, criadoEm: agora },
];

// 5. AS 6 NEGOCIAÇÕES DE DEMONSTRAÇÃO (FEIJÃO MUNGO & PULSES - ÍNDIA E ÁSIA)
const processos = [
  // -------------------------------------------------------------------------
  // 1. BC26-001 | PENDENTE (Recurso: Trava de Status, Importador Avulso e Sinal de Atenção)
  // -------------------------------------------------------------------------
  {
    id: 'proc_bc26_001',
    numeroProcesso: 'BC26-001',
    clienteFinal: 'Vardhman Pulses & Grains Impex Pvt Ltd',
    traderIntermedio: 'Adani Agri International Hub',
    produto: 'Feijão Mungo Verde (Green Mung Bean)',
    volumeKg: 240000,
    incoterm: 'CFR',
    portoOrigem: 'SANTOS (Santos - BRSSZ)',
    portoDestino: 'Mundra (INMUN - Índia)',
    freeTimeDestino: '14 dias livres no destino',
    redex: 'BTP - Brasil Terminal Portuário (Santos)',
    valorDeclaradoUsd: 890.00,
    localEstufagem: 'BTP - Brasil Terminal Portuário (Santos)',
    containerQtd: 10,
    containerTipo: "20' DRY",
    embalagemTipo: 'Sacaria 30kg',
    sacasPorContainer: 800,
    fumigacaoNecessaria: true,
    fumigacaoTipo: 'Fosfina (PH3) 24h',
    fumigacaoTempoHoras: 24,
    armador: 'ONE',
    bookingNumero: 'BKG-ONE-772910',
    navio: 'ONE MINATO V.2601W',
    deadlineDraftBl: '2026-11-20T18:00:00.000Z',
    deadlineDraftVgm: '2026-11-22T12:00:00.000Z',
    deadlineCarga: '2026-11-24T16:00:00.000Z',
    deadlineEmbarque: '2026-11-26T00:00:00.000Z',
    estufagemInicio: '2026-11-16T08:00:00.000Z',
    estufagemFim: '2026-11-19T17:00:00.000Z',
    mapaNaSequencia: true,
    necessitaEtiqueta: true,
    ncm: '0713.31.90',
    status: 'PENDENTE',
    statusCache: 'Pendente',
    criadoEm: '2026-11-05T09:30:00.000Z',
    atualizadoEm: '2026-11-06T08:15:00.000Z',
    importadorId: null, // Propositadamente pendente de cadastro formal!
    enderecoBuyer: null,
    complementoBuyer: null,
    cidadeBuyer: 'Mundra',
    paisBuyer: 'Índia',
    iecBuyer: null,
    panBuyer: null,
    fassaiBuyer: null,
    gstBuyer: null,
    emailBuyer: 'procurement@vardhmanpulses.in',
    telefoneBuyer: '+91 2838 271 890',
    produtorId: null,
    fazendaOrigemNome: null,
    armazemId: null,
    siloArmazemOrigem: null,
    trajetoStatus: 'FAZENDA',
    criadoPorId: 'usr_admin_master',
  },

  // -------------------------------------------------------------------------
  // 2. BC26-002 | EM_NEGOCIACAO (Recurso: Comprador Diferente + Proforma + Rastreabilidade)
  // -------------------------------------------------------------------------
  {
    id: 'proc_bc26_002',
    numeroProcesso: 'BC26-002',
    clienteFinal: 'Shree Renuka Pulses & Spices Corp',
    traderIntermedio: 'AgroCommodities Global Trading Pte Ltd',
    produto: 'Feijão Mungo Amarelo / Despelicado (Moong Dal)',
    volumeKg: 480000,
    incoterm: 'CFR',
    portoOrigem: 'SANTOS (Santos - BRSSZ)',
    portoDestino: 'Nhava Sheva (INNSA - Índia)',
    freeTimeDestino: '21 dias livres no destino',
    redex: 'DP World Santos (Embraport)',
    valorDeclaradoUsd: 920.00,
    localEstufagem: 'DP World Santos (Embraport)',
    containerQtd: 20,
    containerTipo: "20' DRY",
    embalagemTipo: 'Sacaria 30kg',
    sacasPorContainer: 800,
    fumigacaoNecessaria: true,
    fumigacaoTipo: 'Fosfina (PH3) 48h',
    fumigacaoTempoHoras: 48,
    armador: 'MSC',
    bookingNumero: 'BKG-MSC-918234',
    navio: 'MSC ALEXANDRA V.341E',
    deadlineDraftBl: '2026-11-24T18:00:00.000Z',
    deadlineDraftVgm: '2026-11-26T12:00:00.000Z',
    deadlineCarga: '2026-11-28T16:00:00.000Z',
    deadlineEmbarque: '2026-11-30T00:00:00.000Z',
    estufagemInicio: '2026-11-20T08:00:00.000Z',
    estufagemFim: '2026-11-23T17:00:00.000Z',
    mapaNaSequencia: true,
    necessitaEtiqueta: true,
    ncm: '0713.31.90',
    status: 'EM_NEGOCIACAO',
    statusCache: 'Em Negociação',
    criadoEm: '2026-11-04T10:00:00.000Z',
    atualizadoEm: '2026-11-06T09:20:00.000Z',
    importadorId: 'ent_imp_2',
    enderecoBuyer: 'APMC Market Phase II, Sector 19, Vashi',
    complementoBuyer: 'Central Grain Market Complex, Suite 508 [COMPRADOR:{"diferente":true,"nome":"AgroCommodities Global Trading Pte Ltd","endereco":"10 Marina Boulevard, MBFC Tower 2, Suite 2401","complemento":"Level 24","cidade":"Singapura","pais":"Singapura","taxId":"SG201639102K","email":"contracts@agrocommodities.sg","telefone":"+65 6718 9000","importadorNome":"Shree Renuka Pulses & Spices Corp"}]',
    cidadeBuyer: 'Navi Mumbai',
    paisBuyer: 'Índia',
    iecBuyer: '0312019482',
    panBuyer: 'AABCS9912E',
    fassaiBuyer: '10018021008129',
    gstBuyer: '27AABCS9912E1Z8',
    emailBuyer: 'imports@shreerenukapulses.co.in',
    telefoneBuyer: '+91 22 2789 4410',
    produtorId: 'ent_prod_3',
    fazendaOrigemNome: 'Fazenda Alvorada - Módulo Pulses Canarana',
    produtorCarCache: 'MT-5102504-8A12.EE90.33D1.77A2.B991.2201.8844',
    produtorIeCache: '13.882.102-5',
    siloArmazemOrigem: 'Silo Grãos Primavera Canarana',
    trajetoStatus: 'FAZENDA',
    distanciaRodoviariaKm: 1650,
    emissaoCO2EstimadaKg: 2410.0,
    criadoPorId: 'usr_admin_master',
  },

  // -------------------------------------------------------------------------
  // 3. BC26-003 | EM_EXECUCAO (Recurso: PEX Box & Tracking, Deadlines, RUC e GED)
  // -------------------------------------------------------------------------
  {
    id: 'proc_bc26_003',
    numeroProcesso: 'BC26-003',
    clienteFinal: 'Golden Crop Foods Vietnam Co Ltd',
    traderIntermedio: 'Vina Commodities Asia',
    produto: 'Feijão Caupi Fradinho (Cowpea / Black Eye Pea)',
    volumeKg: 288000,
    incoterm: 'CFR',
    portoOrigem: 'PARANAGUA (Paranaguá - BRPNG)',
    portoDestino: 'Ho Chi Minh (VNCLI - Vietnã)',
    freeTimeDestino: '14 dias livres no destino',
    redex: 'TCP - Terminal de Contêineres de Paranaguá',
    valorDeclaradoUsd: 860.00,
    localEstufagem: 'TCP - Terminal de Contêineres de Paranaguá',
    containerQtd: 12,
    containerTipo: "20' DRY",
    embalagemTipo: 'Sacaria 30kg',
    sacasPorContainer: 800,
    fumigacaoNecessaria: true,
    fumigacaoTipo: 'Fosfina (PH3) 24h',
    fumigacaoTempoHoras: 24,
    armador: 'ONE',
    bookingNumero: 'ONE-BRPNG-884210',
    navio: 'ONE OLYMPUS V.2604W',
    deadlineDraftBl: '2026-11-12T18:00:00.000Z',
    deadlineDraftVgm: '2026-11-14T12:00:00.000Z',
    deadlineCarga: '2026-11-16T16:00:00.000Z',
    deadlineEmbarque: '2026-11-18T00:00:00.000Z',
    estufagemInicio: '2026-11-08T08:00:00.000Z',
    estufagemFim: '2026-11-11T17:00:00.000Z',
    mapaNaSequencia: true,
    necessitaEtiqueta: true,
    ncm: '0713.35.90',
    status: 'EM_EXECUCAO',
    statusCache: 'Em Execução',
    ruc: '6BR26000000000884210BELA',
    criadoEm: '2026-10-28T11:00:00.000Z',
    atualizadoEm: '2026-11-06T10:30:00.000Z',
    importadorId: 'ent_imp_5',
    enderecoBuyer: 'Saigon Port Logistics Park, District 7',
    complementoBuyer: 'Tan Thuan Export Processing Zone, Suite 302',
    cidadeBuyer: 'Ho Chi Minh',
    paisBuyer: 'Vietnã',
    iecBuyer: 'VN0318920194',
    emailBuyer: 'import@goldencrop.vn',
    telefoneBuyer: '+84 28 3770 1200',
    produtorId: 'ent_prod_2',
    fazendaOrigemNome: 'Fazenda Primavera - Talhão Safra Sul',
    produtorCarCache: 'MT-5107909-7C29.D81B.4E31.89C1.A119.55F2.4401',
    produtorIeCache: '13.987.654-2',
    siloArmazemOrigem: 'Armazém Rota 163 Sinop',
    terminalTransbordo: 'Terminal Ferroviário Rondonópolis / Rumo',
    trajetoStatus: 'TERMINAL_PORTUARIO',
    laudoClassificacao: 'Feijão Caupi Tipo 1 Exportação - Umidade 12.0% - Pureza 99.5%',
    distanciaRodoviariaKm: 1740,
    emissaoCO2EstimadaKg: 2280.0,
    criadoPorId: 'usr_admin_master',
  },

  // -------------------------------------------------------------------------
  // 4. BC26-004 | EMBARCADO (Recurso: NFs Triangulação + Câmbio Travado + DRE)
  // -------------------------------------------------------------------------
  {
    id: 'proc_bc26_004',
    numeroProcesso: 'BC26-004',
    clienteFinal: 'Adani Wilmar Agri Imports Ltd',
    traderIntermedio: 'Adani Global Pte Ltd',
    produto: 'Feijão Mungo Verde (Green Mung Bean) - Safra 2026',
    volumeKg: 360000,
    incoterm: 'CFR',
    portoOrigem: 'SANTOS (Santos - BRSSZ)',
    portoDestino: 'Kolkata (INCCU - Índia)',
    freeTimeDestino: '21 dias livres no destino',
    redex: 'Santos Brasil (Tecon Santos)',
    valorDeclaradoUsd: 940.00,
    localEstufagem: 'Santos Brasil (Tecon Santos)',
    containerQtd: 15,
    containerTipo: "20' DRY",
    embalagemTipo: 'Sacaria 30kg',
    sacasPorContainer: 800,
    fumigacaoNecessaria: true,
    fumigacaoTipo: 'Fosfina (PH3) 48h',
    fumigacaoTempoHoras: 48,
    armador: 'MSC',
    bookingNumero: 'MSC-BRSSZ-492100',
    navio: 'MSC MEDITERRANEAN V.812E',
    deadlineDraftBl: '2026-10-14T18:00:00.000Z',
    deadlineDraftVgm: '2026-10-16T12:00:00.000Z',
    deadlineCarga: '2026-10-18T16:00:00.000Z',
    deadlineEmbarque: '2026-10-20T00:00:00.000Z',
    estufagemInicio: '2026-10-10T08:00:00.000Z',
    estufagemFim: '2026-10-14T17:00:00.000Z',
    mapaNaSequencia: true,
    necessitaEtiqueta: true,
    ncm: '0713.31.90',
    status: 'EMBARCADO',
    statusCache: 'Embarcado',
    ruc: '6BR26000000000492100BELA',
    criadoEm: '2026-09-25T14:00:00.000Z',
    atualizadoEm: '2026-10-29T19:00:00.000Z',
    importadorId: 'ent_imp_3',
    enderecoBuyer: 'Fortune House, Netaji Subhas Road, BBD Bagh',
    complementoBuyer: 'Port Office Logistics Bay 12',
    cidadeBuyer: 'Kolkata',
    paisBuyer: 'Índia',
    iecBuyer: '0898014529',
    panBuyer: 'AAACA1928K',
    fassaiBuyer: '10013021000491',
    gstBuyer: '19AAACA1928K1ZX',
    emailBuyer: 'pulses.import@adaniwilmar.in',
    telefoneBuyer: '+91 33 2230 4500',
    produtorId: 'ent_prod_1',
    fazendaOrigemNome: 'Fazenda Santa Maria - Gleba Araguaia',
    produtorCarCache: 'MT-5103007-6B18.C94A.5D12.44A8.B268.31E0.8921',
    produtorIeCache: '13.456.789-0',
    siloArmazemOrigem: 'Silo Central Confresa',
    terminalTransbordo: 'Terminal Multimodal Santos BTP',
    trajetoStatus: 'EMBARCADO_NAVIO',
    laudoClassificacao: 'Feijão Mungo Verde Tipo Especial - Pureza 99.8% - Umidade 11.5%',
    distanciaRodoviariaKm: 2140,
    emissaoCO2EstimadaKg: 3420.0,
    criadoPorId: 'usr_admin_master',
  },

  // -------------------------------------------------------------------------
  // 5. BC26-005 | FINALIZADO (Recurso: Dossiê 100%, Borderô Liquidado e Trilha de Auditoria)
  // -------------------------------------------------------------------------
  {
    id: 'proc_bc26_005',
    numeroProcesso: 'BC26-005',
    clienteFinal: 'ITC Agri Business & Pulses Division',
    traderIntermedio: 'ITC Global Commodities',
    produto: 'Grão-de-Bico Kabuli Especial (Chickpeas / Chana White 8mm)',
    volumeKg: 240000,
    incoterm: 'CFR',
    portoOrigem: 'SANTOS (Santos - BRSSZ)',
    portoDestino: 'Chennai (INMAA - Índia)',
    freeTimeDestino: '14 dias livres no destino',
    redex: 'BTP - Brasil Terminal Portuário (Santos)',
    valorDeclaradoUsd: 1050.00,
    localEstufagem: 'BTP - Brasil Terminal Portuário (Santos)',
    containerQtd: 10,
    containerTipo: "20' DRY",
    embalagemTipo: 'Sacaria 30kg',
    sacasPorContainer: 800,
    fumigacaoNecessaria: true,
    fumigacaoTipo: 'Fosfina (PH3) 24h',
    fumigacaoTempoHoras: 24,
    armador: 'HAPAG-LLOYD',
    bookingNumero: 'HLCU-BRSSZ-339101',
    navio: 'SANTOS EXPRESS V.2602E',
    deadlineDraftBl: '2026-09-18T18:00:00.000Z',
    deadlineDraftVgm: '2026-09-20T12:00:00.000Z',
    deadlineCarga: '2026-09-22T16:00:00.000Z',
    deadlineEmbarque: '2026-09-24T00:00:00.000Z',
    estufagemInicio: '2026-09-12T08:00:00.000Z',
    estufagemFim: '2026-09-15T17:00:00.000Z',
    mapaNaSequencia: true,
    necessitaEtiqueta: true,
    ncm: '0713.20.90',
    status: 'FINALIZADO',
    statusCache: 'Finalizado',
    ruc: '6BR26000000000339101BELA',
    criadoEm: '2026-09-01T08:00:00.000Z',
    atualizadoEm: '2026-10-15T16:00:00.000Z',
    importadorId: 'ent_imp_4',
    enderecoBuyer: 'Rajaji Salai, George Town, Port Trust Area',
    complementoBuyer: 'ITC Centre, 4th Floor',
    cidadeBuyer: 'Chennai',
    paisBuyer: 'Índia',
    iecBuyer: '0488001234',
    panBuyer: 'AABCI1234F',
    fassaiBuyer: '10014042001122',
    gstBuyer: '33AABCI1234F1ZQ',
    emailBuyer: 'agri.export@itc.in',
    telefoneBuyer: '+91 44 2534 8800',
    produtorId: 'ent_prod_1',
    fazendaOrigemNome: 'Fazenda Santa Maria - Gleba Araguaia',
    produtorCarCache: 'MT-5103007-6B18.C94A.5D12.44A8.B268.31E0.8921',
    produtorIeCache: '13.456.789-0',
    siloArmazemOrigem: 'Silo Central Confresa',
    trajetoStatus: 'ENTREGUE_DESTINO',
    laudoClassificacao: 'Grão-de-Bico Kabuli Calibre 8-9mm - Pureza 99.4% - Umidade 12.0%',
    distanciaRodoviariaKm: 1680,
    emissaoCO2EstimadaKg: 2150.0,
    criadoPorId: 'usr_admin_master',
  },

  // -------------------------------------------------------------------------
  // 6. BC26-006 | EM_EXECUCAO (Recurso: Exportação China, GACC, Brometo e Sacaria 25kg)
  // -------------------------------------------------------------------------
  {
    id: 'proc_bc26_006',
    numeroProcesso: 'BC26-006',
    clienteFinal: 'Sinograin International Trade Co Ltd',
    traderIntermedio: 'China National Grain & Oils Impex',
    produto: 'Feijão Azuki Vermelho / Pulses Especiais',
    volumeKg: 300000,
    incoterm: 'CFR',
    portoOrigem: 'SANTOS (Santos - BRSSZ)',
    portoDestino: 'Qingdao (CNQDG - China)',
    freeTimeDestino: '14 dias livres no destino',
    redex: 'Santos Brasil (Tecon Santos)',
    valorDeclaradoUsd: 980.00,
    localEstufagem: 'Santos Brasil (Tecon Santos)',
    containerQtd: 12,
    containerTipo: "20' DRY",
    embalagemTipo: 'Sacaria 25kg',
    sacasPorContainer: 1000,
    fumigacaoNecessaria: true,
    fumigacaoTipo: 'Brometo de Metila (GACC Standard) - 48h',
    fumigacaoTempoHoras: 48,
    armador: 'COSCO',
    bookingNumero: 'COSU-BRSSZ-582910',
    navio: 'COSCO SHIPPING BRAZIL V.2601E',
    deadlineDraftBl: '2026-11-15T18:00:00.000Z',
    deadlineDraftVgm: '2026-11-17T12:00:00.000Z',
    deadlineCarga: '2026-11-19T16:00:00.000Z',
    deadlineEmbarque: '2026-11-21T00:00:00.000Z',
    estufagemInicio: '2026-11-10T08:00:00.000Z',
    estufagemFim: '2026-11-14T17:00:00.000Z',
    mapaNaSequencia: true,
    necessitaEtiqueta: true,
    ncm: '0713.32.90',
    status: 'EM_EXECUCAO',
    statusCache: 'Em Execução',
    ruc: '6BR26000000000582910BELA',
    criadoEm: '2026-10-30T10:00:00.000Z',
    atualizadoEm: '2026-11-06T11:00:00.000Z',
    importadorId: 'ent_imp_6',
    enderecoBuyer: 'Qingdao Free Trade Port Zone, Huangdao District',
    complementoBuyer: 'International Grain Exchange Tower, Floor 18',
    cidadeBuyer: 'Qingdao',
    paisBuyer: 'China',
    iecBuyer: 'CN-QDG-992144',
    emailBuyer: 'pulses.import@sinograin.cn',
    telefoneBuyer: '+86 532 8690 9900',
    produtorId: 'ent_prod_3',
    fazendaOrigemNome: 'Fazenda Alvorada - Módulo Pulses Canarana',
    produtorCarCache: 'MT-5102504-8A12.EE90.33D1.77A2.B991.2201.8844',
    siloArmazemOrigem: 'Silo Grãos Primavera Canarana',
    terminalTransbordo: 'Pátio Integrado Porto Franco / VLI',
    trajetoStatus: 'TRANSBORDO_RODOVIARIO',
    laudoClassificacao: 'Feijão Azuki Vermelho Tipo Exportação - Calibre Uniforme - Pureza 99.6%',
    distanciaRodoviariaKm: 1890,
    emissaoCO2EstimadaKg: 2980.0,
    criadoPorId: 'usr_admin_master',
  },
];

// 6. GERAÇÃO DE ETAPAS (27 ETAPAS PARA CADA PROCESSO)
const processoEtapas = [];
processos.forEach((p) => {
  etapasTemplate.forEach((tmpl, idx) => {
    let statusEtapa = 'PENDENTE';
    let dataConclusao = null;

    if (p.status === 'FINALIZADO') {
      statusEtapa = 'CONCLUIDA';
      dataConclusao = '2026-10-04T12:00:00.000Z';
    } else if (p.status === 'EMBARCADO') {
      // Conclui até etapa 25 (Embarque a bordo)
      if (idx < 25) {
        statusEtapa = 'CONCLUIDA';
        dataConclusao = '2026-10-25T16:00:00.000Z';
      } else if (idx === 25) {
        statusEtapa = 'EM_ANDAMENTO';
      } else {
        statusEtapa = 'PENDENTE';
      }
    } else if (p.status === 'EM_EXECUCAO') {
      // Conclui até etapa 18 (Estufagem e VGM)
      if (idx < 17) {
        statusEtapa = 'CONCLUIDA';
        dataConclusao = '2026-11-04T10:00:00.000Z';
      } else if (idx <= 19) {
        statusEtapa = 'EM_ANDAMENTO';
      } else {
        statusEtapa = 'PENDENTE';
      }
    } else if (p.status === 'EM_NEGOCIACAO') {
      if (idx < 3) {
        statusEtapa = 'CONCLUIDA';
        dataConclusao = '2026-11-05T14:00:00.000Z';
      } else if (idx === 3) {
        statusEtapa = 'EM_ANDAMENTO';
      } else {
        statusEtapa = 'PENDENTE';
      }
    } else {
      // PENDENTE
      statusEtapa = 'PENDENTE';
    }

    processoEtapas.push({
      id: `pe_${p.id}_${tmpl.id}`,
      processoId: p.id,
      etapaTemplateId: tmpl.id,
      status: statusEtapa,
      dataConclusao,
      responsavelId: 'usr_admin_master',
      observacao: null,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  });
});

// 7. GERAÇÃO DE CONTÊINERES REAIS
const armadoresPrefixos = {
  'ONE': 'ONEY',
  'MSC': 'MSCU',
  'HAPAG-LLOYD': 'HLXU',
  'COSCO': 'COSU',
};

const containers = [];
processos.forEach((p) => {
  const qtd = p.containerQtd || 10;
  const prefixo = armadoresPrefixos[p.armador] || 'BCHU';
  const pesoPorContainer = Math.round(p.volumeKg / qtd);
  const taraPadrao = 2240;

  for (let i = 1; i <= qtd; i++) {
    const isReady = p.status === 'EMBARCADO' || p.status === 'FINALIZADO' || (p.status === 'EM_EXECUCAO' && i <= 8);
    const numeroIdentificacao = `${prefixo}${2000000 + (parseInt(p.numeroProcesso.replace(/\D/g, '')) * 1000) + i}`;
    const lacre = `RFB${880000 + i}`;
    const vgm = pesoPorContainer + taraPadrao;

    containers.push({
      id: `cnt_${p.id}_${i}`,
      processoId: p.id,
      ordem: i,
      numero: isReady ? numeroIdentificacao : null,
      lacre: isReady ? lacre : null,
      tara: isReady ? taraPadrao : null,
      pesoLiquido: isReady ? pesoPorContainer : null,
      pesoBruto: isReady ? (pesoPorContainer + taraPadrao) : null,
      vgm: isReady ? vgm : null,
      temperatura: null,
      status: isReady ? 'ESTUFADO' : 'AGUARDANDO_ESTUFAGEM',
      dataEstufagem: isReady ? p.estufagemFim : null,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }
});

// 8. FINANCEIRO, CUSTOS & CÂMBIO TRAVADO
const financeiros = [];
const custosItem = [];
const cambiosTravados = [];

const categoriasCusto = [
  'COMPRA_MERCADORIA',
  'FRETE_RODOVIARIO',
  'FUMIGACAO',
  'CLASSIFICACAO',
  'ARMAZENAGEM',
  'ESTUFAGEM',
  'TAXAS_PORTUARIAS',
  'FRETE_MARITIMO',
  'SEGURO_INTERNACIONAL',
  'DESPACHO_ADUANEIRO',
  'COMISSAO_CORRETAGEM',
  'DESPESAS_BANCARIAS',
];

processos.forEach((p) => {
  const precoUsd = p.valorDeclaradoUsd || 900;
  const totalUsd = (p.volumeKg / 1000) * precoUsd;
  const taxaCambioBrl = 5.68;
  const receitaBrl = totalUsd * taxaCambioBrl;

  financeiros.push({
    id: `fin_${p.id}`,
    processoId: p.id,
    precoUsd,
    receitaTotalUsd: totalUsd,
    receitaTotalBrl: receitaBrl,
    lucroEsperadoBrl: receitaBrl * 0.145, // Margem líquida saudável de 14.5%
    criadoEm: agora,
    atualizadoEm: agora,
  });

  // Itens de custo detalhados por categoria
  categoriasCusto.forEach((cat, idx) => {
    let valorCusto = 0;
    if (cat === 'COMPRA_MERCADORIA') valorCusto = receitaBrl * 0.68; // 68% custo grão
    else if (cat === 'FRETE_MARITIMO') valorCusto = (p.containerQtd || 10) * 2800 * taxaCambioBrl; // ~$2.800/ctn
    else if (cat === 'FRETE_RODOVIARIO') valorCusto = (p.volumeKg / 1000) * 260; // R$ 260/ton
    else if (cat === 'TAXAS_PORTUARIAS') valorCusto = (p.containerQtd || 10) * 1450; // R$ 1.450/ctn THC
    else if (cat === 'FUMIGACAO') valorCusto = (p.containerQtd || 10) * 480;
    else if (cat === 'CLASSIFICACAO') valorCusto = 1850;
    else if (cat === 'DESPACHO_ADUANEIRO') valorCusto = 2800;
    else if (cat === 'SEGURO_INTERNACIONAL') valorCusto = receitaBrl * 0.0035;
    else if (cat === 'COMISSAO_CORRETAGEM') valorCusto = receitaBrl * 0.01;
    else valorCusto = 1200;

    custosItem.push({
      id: `custo_${p.id}_${idx + 1}`,
      financeiroId: `fin_${p.id}`,
      categoria: cat,
      valor: Math.round(valorCusto),
      moeda: 'BRL',
      observacao: null,
      atualizadoPorId: 'usr_admin_master',
      criadoEm: agora,
      atualizadoEm: agora,
    });
  });

  // Operações embarcadas e finalizadas com câmbio travado
  if (p.status === 'EMBARCADO' || p.status === 'FINALIZADO') {
    cambiosTravados.push({
      id: `cambio_${p.id}_1`,
      financeiroId: `fin_${p.id}`,
      banco: 'Banco do Brasil',
      numeroContrato: `BB-CAMB-2026-${p.numeroProcesso.replace(/\D/g, '')}A`,
      valorUsd: totalUsd * 0.6,
      taxaBrl: 5.6850,
      dataContratacao: '2026-10-15T10:00:00.000Z',
      dataLiquidacao: '2026-11-15T18:00:00.000Z',
      tipo: 'ACC (Adiantamento sobre Contrato de Câmbio)',
      status: p.status === 'FINALIZADO' ? 'LIQUIDADO' : 'CONTRATADO',
      criadoEm: agora,
      atualizadoEm: agora,
    });
    cambiosTravados.push({
      id: `cambio_${p.id}_2`,
      financeiroId: `fin_${p.id}`,
      banco: 'Santander Brasil',
      numeroContrato: `SAN-FX-2026-${p.numeroProcesso.replace(/\D/g, '')}B`,
      valorUsd: totalUsd * 0.4,
      taxaBrl: 5.6790,
      dataContratacao: '2026-10-18T14:30:00.000Z',
      dataLiquidacao: '2026-11-20T18:00:00.000Z',
      tipo: 'PRONTIDÃO / TRAVAMENTO EXPORTAÇÃO',
      status: p.status === 'FINALIZADO' ? 'LIQUIDADO' : 'CONTRATADO',
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }
});

// 9. DOCUMENTOS GED
const documentos = [
  {
    id: 'doc_1',
    processoId: 'proc_bc26_004',
    nomeArquivo: 'DU-E_26BR0008492019_Averbada.pdf',
    caminhoStorage: '/uploads/due_bc26_004.pdf',
    categoria: 'DOCUMENTACAO_EXPORTACAO',
    tipoDocumentoId: 'td_9',
    versao: 1,
    status: 'APROVADO',
    tamanhoBytes: 345020,
    criadoEm: '2026-10-29T18:00:00.000Z',
    uploadedById: 'usr_admin_master',
  },
  {
    id: 'doc_2',
    processoId: 'proc_bc26_004',
    nomeArquivo: 'Certificado_Fitossanitario_MAPA_BR202600984.pdf',
    caminhoStorage: '/uploads/fito_bc26_004.pdf',
    categoria: 'DOCUMENTACAO_EXPORTACAO',
    tipoDocumentoId: 'td_10',
    versao: 1,
    status: 'APROVADO',
    tamanhoBytes: 512000,
    criadoEm: '2026-10-27T14:00:00.000Z',
    uploadedById: 'usr_admin_master',
  },
  {
    id: 'doc_3',
    processoId: 'proc_bc26_004',
    nomeArquivo: 'Bill_of_Lading_MSC_MEDUSZ8920194.pdf',
    caminhoStorage: '/uploads/bl_bc26_004.pdf',
    categoria: 'DOCUMENTACAO_EXPORTACAO',
    tipoDocumentoId: 'td_11',
    versao: 1,
    status: 'APROVADO',
    tamanhoBytes: 684100,
    criadoEm: '2026-10-28T16:00:00.000Z',
    uploadedById: 'usr_admin_master',
  },
  {
    id: 'doc_4',
    processoId: 'proc_bc26_005',
    nomeArquivo: 'Dossie_Completo_Exportacao_BC26_005.pdf',
    caminhoStorage: '/uploads/dossie_bc26_005.pdf',
    categoria: 'DOCUMENTACAO_EXPORTACAO',
    tipoDocumentoId: 'td_12',
    versao: 1,
    status: 'APROVADO',
    tamanhoBytes: 1840000,
    criadoEm: '2026-10-10T11:00:00.000Z',
    uploadedById: 'usr_admin_master',
  },
  {
    id: 'doc_5',
    processoId: 'proc_bc26_003',
    nomeArquivo: 'Confirmacao_Booking_ONE_BRPNG884210.pdf',
    caminhoStorage: '/uploads/booking_bc26_003.pdf',
    categoria: 'BOOKING_TRANSPORTE',
    tipoDocumentoId: 'td_5',
    versao: 1,
    status: 'APROVADO',
    tamanhoBytes: 420000,
    criadoEm: '2026-11-02T10:00:00.000Z',
    uploadedById: 'usr_admin_master',
  },
];

// 10. AUDIT LOGS (Trilha de Compliance)
const auditLogs = [
  {
    id: 'audit_1',
    processoId: 'proc_bc26_004',
    usuarioId: 'usr_admin_master',
    acao: 'STATUS_ALTERADO',
    detalhe: 'Status da operação alterado de "EM_EXECUCAO" para "EMBARCADO" após confirmação de embarque no navio MSC MEDITERRANEAN.',
    criadoEm: '2026-10-29T19:00:00.000Z',
  },
  {
    id: 'audit_2',
    processoId: 'proc_bc26_005',
    usuarioId: 'usr_admin_master',
    acao: 'PROCESSO_FINALIZADO',
    detalhe: 'Dossiê cambial aprovado, DU-E averbada e contrato liquidado no Banco do Brasil.',
    criadoEm: '2026-10-15T16:00:00.000Z',
  },
  {
    id: 'audit_3',
    processoId: 'proc_bc26_001',
    usuarioId: 'usr_admin_master',
    acao: 'PROCESSO_CRIADO',
    detalhe: 'Processo BC26-001 criado com importador avulso (status travado em PENDENTE por conformidade de cadastro).',
    criadoEm: '2026-11-05T09:30:00.000Z',
  },
];

// 11. CADASTROS DE ENTIDADES
const cadastroEntidades = getDemoCadastrosData();

// 12. NOTAS FISCAIS
const demoNfs = getDemoNotasFiscaisData();

// ESTRUTURA FINAL CONSOLIDADA
const fullStore = {
  isDemoMode: true,
  usuarios,
  parceiros,
  tiposDocumento,
  etapasTemplate,
  processos,
  processoEtapas,
  containers,
  financeiros,
  custosItem,
  cambiosTravados,
  documentos,
  chatMessages: [],
  auditLogs,
  notasFiscais: demoNfs.notasFiscais,
  notasFiscaisRetorno: demoNfs.notasFiscaisRetorno,
  notasFiscaisExportacaoItens: demoNfs.notasFiscaisExportacaoItens,
  cadastroEntidades,
};

// Grava nos dois arquivos para sincronização perfeita
fs.writeFileSync(DEMO_STORE_PATH, JSON.stringify(fullStore, null, 2), 'utf-8');
fs.writeFileSync(DEV_STORE_PATH, JSON.stringify(fullStore, null, 2), 'utf-8');

console.log('✅ Base de demonstração gerada com sucesso!');
console.log(`- ${processos.length} negociações de Feijão Mungo e Pulses`);
console.log(`- ${containers.length} contêineres gerenciados`);
console.log(`- ${processoEtapas.length} etapas de checklist`);
console.log(`- ${demoNfs.notasFiscais.length} notas fiscais em triangulação`);
console.log(`- ${cadastroEntidades.length} entidades cadastradas (Produtores, Importadores Índia/Ásia, Silos)`);
