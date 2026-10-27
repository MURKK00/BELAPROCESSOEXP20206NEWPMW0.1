export interface ContratoCotacao {
  codigo: string;
  mesVencimento: string;
  ano: number;
  ultimo: number;
  variacao: number;
  variacaoPct: number;
  abertura: number;
  maxima: number;
  minima: number;
  fechamentoAnterior: number;
  volumeContratos: number;
  unidade: string;
  sugeridoParaBela?: boolean;
  historicoIntraday?: { hora: string; preco: number }[];
}

export interface CurvaDolarItem {
  vertice: string;
  diasCorridos: number;
  diasUteis: number;
  dolarProjetado: number;
  pontosForward: number; // Swap cambial em pontos (ex: +35.5)
  cupomCambialPct: number; // Taxa de juros em dólar no Brasil (% a.a.)
  diFuturoPct: number; // Taxa de juros DI (% a.a.)
  variacaoDia: number;
}

export interface CotacoesMercadoState {
  timestamp: string;
  mercadoStatus: 'ABERTO' | 'FECHADO' | 'PRE_MARKET' | 'AFTER_HOURS';
  
  // 1. Soja Chicago (CBOT - ZS)
  sojaChicago: {
    nome: string;
    ticker: string;
    unidadePadrao: string;
    fatorConversaoTon: number; // 36.7437 bu/t
    contratos: ContratoCotacao[];
  };

  // 2. Milho Chicago (CBOT - ZC)
  milhoChicago: {
    nome: string;
    ticker: string;
    unidadePadrao: string;
    fatorConversaoTon: number; // 39.368 bu/t
    contratos: ContratoCotacao[];
  };

  // 3. Milho B3 (CCM)
  milhoB3: {
    nome: string;
    ticker: string;
    unidadePadrao: string;
    contratos: ContratoCotacao[];
  };

  // 4. Farelo de Soja Chicago (CBOT - ZM)
  fareloChicago: {
    nome: string;
    ticker: string;
    unidadePadrao: string;
    fatorConversaoTon: number; // 1.1023 ton/short ton
    contratos: ContratoCotacao[];
  };

  // 5. Câmbio Spot (USD/BRL & EUR/BRL)
  cambio: {
    dolarComercial: {
      compra: number;
      venda: number;
      ptaxVenda: number;
      ptaxCompra: number;
      variacao: number;
      variacaoPct: number;
      maxima: number;
      minima: number;
      abertura: number;
      dolarFuturoB3: number; // Primeiro vencimento DOL
      historicoIntraday: { hora: string; preco: number }[];
    };
    euroComercial: {
      compra: number;
      venda: number;
      ptaxVenda: number;
      variacao: number;
      variacaoPct: number;
      crossRateEurUsd: number;
      maxima: number;
      minima: number;
      abertura: number;
      historicoIntraday: { hora: string; preco: number }[];
    };
  };

  // 6. Curva de Dólar (Forward / Term Structure)
  curvaDolar: CurvaDolarItem[];

  // 7. Prêmios dos Portos Brasileiros (FOB Basis Santos / Paranaguá)
  premiosPorto: {
    sojaSantosCentsBu: number; // Ex: +75 ¢/bu
    milhoSantosCentsBu: number; // Ex: +65 ¢/bu
    freteMaritimoChinaUsdTon: number; // Ex: $48/ton
  };
}

export const COTACOES_INICIAIS: CotacoesMercadoState = {
  timestamp: new Date().toISOString(),
  mercadoStatus: 'ABERTO',

  sojaChicago: {
    nome: 'Soja em Grão - CBOT',
    ticker: 'ZS',
    unidadePadrao: '¢/bushel',
    fatorConversaoTon: 36.7437,
    contratos: [
      {
        codigo: 'ZSX26',
        mesVencimento: 'NOV/26',
        ano: 2026,
        ultimo: 1032.50,
        variacao: 14.25,
        variacaoPct: 1.40,
        abertura: 1018.25,
        maxima: 1036.00,
        minima: 1016.50,
        fechamentoAnterior: 1018.25,
        volumeContratos: 84920,
        unidade: '¢/bu',
        sugeridoParaBela: true,
        historicoIntraday: [
          { hora: '09:00', preco: 1018.25 },
          { hora: '10:00', preco: 1022.00 },
          { hora: '11:00', preco: 1020.50 },
          { hora: '12:00', preco: 1026.75 },
          { hora: '13:00', preco: 1029.00 },
          { hora: '14:00', preco: 1034.50 },
          { hora: '15:00', preco: 1032.50 },
        ],
      },
      {
        codigo: 'ZSF27',
        mesVencimento: 'JAN/27',
        ano: 2027,
        ultimo: 1048.75,
        variacao: 12.50,
        variacaoPct: 1.21,
        abertura: 1036.25,
        maxima: 1051.00,
        minima: 1034.00,
        fechamentoAnterior: 1036.25,
        volumeContratos: 45210,
        unidade: '¢/bu',
      },
      {
        codigo: 'ZSH27',
        mesVencimento: 'MAR/27',
        ano: 2027,
        ultimo: 1061.25,
        variacao: 11.75,
        variacaoPct: 1.12,
        abertura: 1049.50,
        maxima: 1063.50,
        minima: 1047.00,
        fechamentoAnterior: 1049.50,
        volumeContratos: 32180,
        unidade: '¢/bu',
      },
      {
        codigo: 'ZSK27',
        mesVencimento: 'MAI/27',
        ano: 2027,
        ultimo: 1073.00,
        variacao: 10.00,
        variacaoPct: 0.94,
        abertura: 1063.00,
        maxima: 1075.50,
        minima: 1060.00,
        fechamentoAnterior: 1063.00,
        volumeContratos: 18450,
        unidade: '¢/bu',
      },
      {
        codigo: 'ZSN27',
        mesVencimento: 'JUL/27',
        ano: 2027,
        ultimo: 1082.50,
        variacao: 9.50,
        variacaoPct: 0.89,
        abertura: 1073.00,
        maxima: 1084.00,
        minima: 1070.00,
        fechamentoAnterior: 1073.00,
        volumeContratos: 12900,
        unidade: '¢/bu',
      },
    ],
  },

  milhoChicago: {
    nome: 'Milho Grão - CBOT',
    ticker: 'ZC',
    unidadePadrao: '¢/bushel',
    fatorConversaoTon: 39.368,
    contratos: [
      {
        codigo: 'ZCZ26',
        mesVencimento: 'DEZ/26',
        ano: 2026,
        ultimo: 425.50,
        variacao: -3.75,
        variacaoPct: -0.87,
        abertura: 429.25,
        maxima: 431.50,
        minima: 423.00,
        fechamentoAnterior: 429.25,
        volumeContratos: 98120,
        unidade: '¢/bu',
        sugeridoParaBela: true,
        historicoIntraday: [
          { hora: '09:00', preco: 429.25 },
          { hora: '10:00', preco: 430.50 },
          { hora: '11:00', preco: 428.00 },
          { hora: '12:00', preco: 426.50 },
          { hora: '13:00', preco: 424.00 },
          { hora: '14:00', preco: 426.00 },
          { hora: '15:00', preco: 425.50 },
        ],
      },
      {
        codigo: 'ZCH27',
        mesVencimento: 'MAR/27',
        ano: 2027,
        ultimo: 441.25,
        variacao: -3.25,
        variacaoPct: -0.73,
        abertura: 444.50,
        maxima: 446.00,
        minima: 439.50,
        fechamentoAnterior: 444.50,
        volumeContratos: 41200,
        unidade: '¢/bu',
      },
      {
        codigo: 'ZCK27',
        mesVencimento: 'MAI/27',
        ano: 2027,
        ultimo: 450.75,
        variacao: -2.50,
        variacaoPct: -0.55,
        abertura: 453.25,
        maxima: 454.50,
        minima: 449.00,
        fechamentoAnterior: 453.25,
        volumeContratos: 22100,
        unidade: '¢/bu',
      },
      {
        codigo: 'ZCN27',
        mesVencimento: 'JUL/27',
        ano: 2027,
        ultimo: 458.00,
        variacao: -2.00,
        variacaoPct: -0.43,
        abertura: 460.00,
        maxima: 461.50,
        minima: 456.50,
        fechamentoAnterior: 460.00,
        volumeContratos: 15300,
        unidade: '¢/bu',
      },
    ],
  },

  milhoB3: {
    nome: 'Milho Futuro - B3',
    ticker: 'CCM',
    unidadePadrao: 'R$/saca (60kg)',
    contratos: [
      {
        codigo: 'CCMX26',
        mesVencimento: 'NOV/26',
        ano: 2026,
        ultimo: 69.85,
        variacao: 0.82,
        variacaoPct: 1.19,
        abertura: 69.03,
        maxima: 70.30,
        minima: 68.90,
        fechamentoAnterior: 69.03,
        volumeContratos: 14850,
        unidade: 'R$/sc',
        sugeridoParaBela: true,
        historicoIntraday: [
          { hora: '09:00', preco: 69.03 },
          { hora: '10:00', preco: 69.25 },
          { hora: '11:00', preco: 69.50 },
          { hora: '12:00', preco: 69.60 },
          { hora: '13:00', preco: 70.10 },
          { hora: '14:00', preco: 69.95 },
          { hora: '15:00', preco: 69.85 },
        ],
      },
      {
        codigo: 'CCMF27',
        mesVencimento: 'JAN/27',
        ano: 2027,
        ultimo: 72.15,
        variacao: 0.65,
        variacaoPct: 0.91,
        abertura: 71.50,
        maxima: 72.50,
        minima: 71.20,
        fechamentoAnterior: 71.50,
        volumeContratos: 8900,
        unidade: 'R$/sc',
      },
      {
        codigo: 'CCMH27',
        mesVencimento: 'MAR/27',
        ano: 2027,
        ultimo: 73.80,
        variacao: 0.50,
        variacaoPct: 0.68,
        abertura: 73.30,
        maxima: 74.10,
        minima: 73.00,
        fechamentoAnterior: 73.30,
        volumeContratos: 6200,
        unidade: 'R$/sc',
      },
      {
        codigo: 'CCMK27',
        mesVencimento: 'MAI/27',
        ano: 2027,
        ultimo: 71.20,
        variacao: 0.40,
        variacaoPct: 0.56,
        abertura: 70.80,
        maxima: 71.60,
        minima: 70.50,
        fechamentoAnterior: 70.80,
        volumeContratos: 4300,
        unidade: 'R$/sc',
      },
    ],
  },

  fareloChicago: {
    nome: 'Farelo de Soja - CBOT',
    ticker: 'ZM',
    unidadePadrao: 'US$/short ton',
    fatorConversaoTon: 1.1023, // 1 short ton = 0.907185 ton métrica -> para converter US$/st em US$/t: multiplicar por 1.1023
    contratos: [
      {
        codigo: 'ZMZ26',
        mesVencimento: 'DEZ/26',
        ano: 2026,
        ultimo: 326.40,
        variacao: 4.80,
        variacaoPct: 1.49,
        abertura: 321.60,
        maxima: 328.20,
        minima: 320.50,
        fechamentoAnterior: 321.60,
        volumeContratos: 36700,
        unidade: 'US$/st',
        sugeridoParaBela: true,
        historicoIntraday: [
          { hora: '09:00', preco: 321.60 },
          { hora: '10:00', preco: 322.80 },
          { hora: '11:00', preco: 323.50 },
          { hora: '12:00', preco: 325.20 },
          { hora: '13:00', preco: 327.00 },
          { hora: '14:00', preco: 326.80 },
          { hora: '15:00', preco: 326.40 },
        ],
      },
      {
        codigo: 'ZMF27',
        mesVencimento: 'JAN/27',
        ano: 2027,
        ultimo: 330.10,
        variacao: 4.20,
        variacaoPct: 1.29,
        abertura: 325.90,
        maxima: 331.50,
        minima: 324.80,
        fechamentoAnterior: 325.90,
        volumeContratos: 18400,
        unidade: 'US$/st',
      },
      {
        codigo: 'ZMH27',
        mesVencimento: 'MAR/27',
        ano: 2027,
        ultimo: 333.80,
        variacao: 3.90,
        variacaoPct: 1.18,
        abertura: 329.90,
        maxima: 335.00,
        minima: 328.50,
        fechamentoAnterior: 329.90,
        volumeContratos: 12300,
        unidade: 'US$/st',
      },
    ],
  },

  cambio: {
    dolarComercial: {
      compra: 5.3440,
      venda: 5.3450,
      ptaxVenda: 5.3346,
      ptaxCompra: 5.3340,
      variacao: -0.0579,
      variacaoPct: -1.07,
      maxima: 5.4120,
      minima: 5.3080,
      abertura: 5.4029,
      dolarFuturoB3: 5.3720,
      historicoIntraday: [
        { hora: '09:00', preco: 5.4029 },
        { hora: '10:00', preco: 5.3850 },
        { hora: '11:00', preco: 5.3720 },
        { hora: '12:00', preco: 5.3580 },
        { hora: '13:00', preco: 5.3480 },
        { hora: '14:00', preco: 5.3440 },
        { hora: '15:00', preco: 5.3450 },
      ],
    },
    euroComercial: {
      compra: 5.9428,
      venda: 5.9458,
      ptaxVenda: 5.9449,
      abertura: 6.0080,
      variacao: -0.0622,
      variacaoPct: -1.04,
      crossRateEurUsd: 1.1127,
      maxima: 6.0403,
      minima: 5.9192,
      historicoIntraday: [
        { hora: '09:00', preco: 6.0080 },
        { hora: '10:00', preco: 5.9920 },
        { hora: '11:00', preco: 5.9750 },
        { hora: '12:00', preco: 5.9610 },
        { hora: '13:00', preco: 5.9520 },
        { hora: '14:00', preco: 5.9490 },
        { hora: '15:00', preco: 5.9458 },
      ],
    },
  },

  curvaDolar: [
    {
      vertice: 'Spot (D+2)',
      diasCorridos: 2,
      diasUteis: 2,
      dolarProjetado: 5.5285,
      pontosForward: 0.0,
      cupomCambialPct: 6.10,
      diFuturoPct: 11.15,
      variacaoDia: 0.30,
    },
    {
      vertice: '30 Dias (1M)',
      diasCorridos: 30,
      diasUteis: 21,
      dolarProjetado: 5.5565,
      pontosForward: 28.0,
      cupomCambialPct: 6.22,
      diFuturoPct: 11.28,
      variacaoDia: 0.35,
    },
    {
      vertice: '60 Dias (2M)',
      diasCorridos: 60,
      diasUteis: 42,
      dolarProjetado: 5.5850,
      pontosForward: 56.5,
      cupomCambialPct: 6.30,
      diFuturoPct: 11.42,
      variacaoDia: 0.38,
    },
    {
      vertice: '90 Dias (3M)',
      diasCorridos: 90,
      diasUteis: 63,
      dolarProjetado: 5.6145,
      pontosForward: 86.0,
      cupomCambialPct: 6.38,
      diFuturoPct: 11.58,
      variacaoDia: 0.42,
    },
    {
      vertice: '180 Dias (6M)',
      diasCorridos: 180,
      diasUteis: 126,
      dolarProjetado: 5.7035,
      pontosForward: 175.0,
      cupomCambialPct: 6.48,
      diFuturoPct: 11.82,
      variacaoDia: 0.49,
    },
    {
      vertice: '360 Dias (1A)',
      diasCorridos: 360,
      diasUteis: 252,
      dolarProjetado: 5.8870,
      pontosForward: 358.5,
      cupomCambialPct: 6.65,
      diFuturoPct: 12.10,
      variacaoDia: 0.58,
    },
  ],

  premiosPorto: {
    sojaSantosCentsBu: 75.0,
    milhoSantosCentsBu: 65.0,
    freteMaritimoChinaUsdTon: 48.5,
  },
};

// Utilitários de cálculo e simulação de mercado
export function calcularParidadeExportacaoSoja({
  cbotCentsBu,
  premioCentsBu = 75,
  taxaDolar = 5.53,
  custoElevacaoUsdTon = 8.5,
  freteInternoReaisTon = 180,
}: {
  cbotCentsBu: number;
  premioCentsBu?: number;
  taxaDolar?: number;
  custoElevacaoUsdTon?: number;
  freteInternoReaisTon?: number;
}) {
  const precoTotalCentsBu = cbotCentsBu + premioCentsBu;
  // Soja tem 36.7437 bushels por tonelada métrica
  const precoFobUsdTon = (precoTotalCentsBu / 100) * 36.7437;
  const precoFobReaisTon = precoFobUsdTon * taxaDolar;
  // 1 tonelada = 16.6667 sacas de 60kg
  const precoFobReaisSaca = precoFobReaisTon / 16.6667;

  // Descontos de porto e frete interno para paridade interior MT
  const custoElevacaoReaisSaca = (custoElevacaoUsdTon * taxaDolar) / 16.6667;
  const freteInternoReaisSaca = freteInternoReaisTon / 16.6667;
  const precoFazendaReaisSaca = precoFobReaisSaca - custoElevacaoReaisSaca - freteInternoReaisSaca;

  return {
    precoFobUsdTon,
    precoFobReaisSaca,
    precoFazendaReaisSaca,
    spreadPremioUsdTon: (premioCentsBu / 100) * 36.7437,
  };
}

export function simularTickMercado(estadoAnterior: CotacoesMercadoState): CotacoesMercadoState {
  // Gera oscilações sutis e realistas de mercado financeiro
  const rand = (min: number, max: number) => min + Math.random() * (max - min);
  const now = new Date();
  const horaStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const newState = JSON.parse(JSON.stringify(estadoAnterior)) as CotacoesMercadoState;
  newState.timestamp = now.toISOString();

  // 1. Soja Chicago (passo de 0.25 ¢)
  newState.sojaChicago.contratos.forEach((c) => {
    const deltaSteps = Math.floor(rand(-2, 3)); // -2, -1, 0, 1, 2
    const delta = deltaSteps * 0.25;
    c.ultimo = Number((c.ultimo + delta).toFixed(2));
    c.variacao = Number((c.ultimo - c.fechamentoAnterior).toFixed(2));
    c.variacaoPct = Number(((c.variacao / c.fechamentoAnterior) * 100).toFixed(2));
    c.maxima = Math.max(c.maxima, c.ultimo);
    c.minima = Math.min(c.minima, c.ultimo);
    c.volumeContratos += Math.floor(rand(5, 50));
    if (c.historicoIntraday && c.historicoIntraday.length > 0 && Math.random() > 0.6) {
      c.historicoIntraday.push({ hora: horaStr, preco: c.ultimo });
      if (c.historicoIntraday.length > 20) c.historicoIntraday.shift();
    }
  });

  // 2. Milho Chicago
  newState.milhoChicago.contratos.forEach((c) => {
    const deltaSteps = Math.floor(rand(-2, 3));
    const delta = deltaSteps * 0.25;
    c.ultimo = Number((c.ultimo + delta).toFixed(2));
    c.variacao = Number((c.ultimo - c.fechamentoAnterior).toFixed(2));
    c.variacaoPct = Number(((c.variacao / c.fechamentoAnterior) * 100).toFixed(2));
    c.maxima = Math.max(c.maxima, c.ultimo);
    c.minima = Math.min(c.minima, c.ultimo);
    c.volumeContratos += Math.floor(rand(10, 60));
  });

  // 3. Milho B3
  newState.milhoB3.contratos.forEach((c) => {
    const delta = Number((rand(-0.08, 0.08)).toFixed(2));
    c.ultimo = Number((c.ultimo + delta).toFixed(2));
    c.variacao = Number((c.ultimo - c.fechamentoAnterior).toFixed(2));
    c.variacaoPct = Number(((c.variacao / c.fechamentoAnterior) * 100).toFixed(2));
    c.maxima = Math.max(c.maxima, c.ultimo);
    c.minima = Math.min(c.minima, c.ultimo);
    c.volumeContratos += Math.floor(rand(2, 20));
  });

  // 4. Farelo Chicago
  newState.fareloChicago.contratos.forEach((c) => {
    const delta = Number((rand(-0.5, 0.5)).toFixed(2));
    c.ultimo = Number((c.ultimo + delta).toFixed(2));
    c.variacao = Number((c.ultimo - c.fechamentoAnterior).toFixed(2));
    c.variacaoPct = Number(((c.variacao / c.fechamentoAnterior) * 100).toFixed(2));
    c.maxima = Math.max(c.maxima, c.ultimo);
    c.minima = Math.min(c.minima, c.ultimo);
  });

  // 5. Câmbio Spot USD/BRL
  const deltaUsd = Number((rand(-0.0020, 0.0020)).toFixed(4));
  const dol = newState.cambio.dolarComercial;
  dol.venda = Number((dol.venda + deltaUsd).toFixed(4));
  dol.compra = Number((dol.venda - 0.0020).toFixed(4));
  dol.dolarFuturoB3 = Number((dol.venda + 0.0280).toFixed(4));
  const fechamentoDol = dol.abertura || 5.3767;
  dol.variacao = Number((dol.venda - fechamentoDol).toFixed(4));
  dol.variacaoPct = Number(((dol.variacao / fechamentoDol) * 100).toFixed(2));
  dol.maxima = Math.max(dol.maxima, dol.venda);
  dol.minima = Math.min(dol.minima, dol.venda);

  // 6. Euro
  const deltaEur = Number((rand(-0.0020, 0.0020)).toFixed(4));
  const eur = newState.cambio.euroComercial;
  eur.venda = Number((eur.venda + deltaEur).toFixed(4));
  eur.compra = Number((eur.venda - 0.0030).toFixed(4));
  eur.crossRateEurUsd = Number((eur.venda / dol.venda).toFixed(4));
  const fechamentoEur = eur.abertura || 6.0080;
  eur.variacao = Number((eur.venda - fechamentoEur).toFixed(4));
  eur.variacaoPct = Number(((eur.variacao / fechamentoEur) * 100).toFixed(2));

  // 7. Curva de Dólar sincroniza com Spot
  newState.curvaDolar.forEach((item, idx) => {
    if (idx === 0) {
      item.dolarProjetado = dol.venda;
    } else {
      item.dolarProjetado = Number((dol.venda + (item.pontosForward / 1000)).toFixed(4));
    }
  });

  return newState;
}

// ============================================================================
// MÓDULO ESPECIAL: FEIJÕES & PULSES · EXPORTAÇÃO ÁSIA EM DÓLAR (USD)
// ============================================================================

export interface VariedadeFeijaoAsia {
  id: string;
  nome: string;
  nomeIngles: string;
  precoFobUsdTon: number; // Preço indicativo FOB porto brasileiro (US$/ton)
  variacaoUsd: number;
  variacaoPct: number;
  precoFazendaRefReaisSaca: number; // Referência fazenda/interior em R$/sc 60kg
  embalagemPadrao: string; // Ex: Sacaria 25kg, 50kg, Big Bag
  capacidadeContainer20Ton: number; // 24 a 26 tons
  principaisDestinos: string[];
  qualidadeEspecificacao: string; // Ex: Pureza 99%, Umidade max 14%, Defeitos max 2%
  fonteCotacao: string; // Ex: Ibrafe / Brokers Ásia
  historicoIntraday?: { hora: string; preco: number }[];
}

export interface PortoDestinoAsia {
  id: string;
  pais: string;
  porto: string;
  codigoIata: string;
  transitTimeDias: number; // Ex: 36 dias
  freteContainer20Usd: number; // Frete marítimo médio por container 20' em US$
  demurrageFreeDays: number; // Ex: 14 dias livres
  demandaPrincipal: string; // Ex: Feijão Mungo, Caupi, Pulses
  fonteFrete: string;
}

export const VARIEDADES_FEIJAO_ASIA: VariedadeFeijaoAsia[] = [
  {
    id: 'mungo-verde',
    nome: 'Feijão Mungo Verde',
    nomeIngles: 'Green Mung Bean',
    precoFobUsdTon: 1150.0,
    variacaoUsd: 25.0,
    variacaoPct: 2.22,
    precoFazendaRefReaisSaca: 320.0,
    embalagemPadrao: 'Sacaria 25kg multifolhas com liner',
    capacidadeContainer20Ton: 25.0,
    principaisDestinos: ['Índia', 'Tailândia', 'Vietnã', 'China'],
    qualidadeEspecificacao: 'Diâmetro 3.5mm+, Pureza 99.5%, Germinação 95%+, Umidade max 13%',
    fonteCotacao: 'Ibrafe / Brokers Internacionais Ásia (FOB Santos/Paranaguá)',
    historicoIntraday: [
      { hora: '09:00', preco: 1125 },
      { hora: '10:30', preco: 1135 },
      { hora: '12:00', preco: 1140 },
      { hora: '14:00', preco: 1150 },
      { hora: '15:30', preco: 1150 },
    ],
  },
  {
    id: 'mungo-preto',
    nome: 'Feijão Mungo Preto',
    nomeIngles: 'Black Matpe',
    precoFobUsdTon: 980.0,
    variacaoUsd: 15.0,
    variacaoPct: 1.55,
    precoFazendaRefReaisSaca: 275.0,
    embalagemPadrao: 'Sacaria 25kg / 50kg Polipropileno',
    capacidadeContainer20Ton: 24.5,
    principaisDestinos: ['Índia (Nhava Sheva / Chennai)', 'Tailândia', 'Vietnã'],
    qualidadeEspecificacao: 'Tipo 1 FAQ, Umidade max 13.5%, Pureza min 99%, Defeitos max 2%',
    fonteCotacao: 'Ibrafe / Brokers Internacionais Ásia (FOB Santos/Paranaguá)',
    historicoIntraday: [
      { hora: '09:00', preco: 965 },
      { hora: '10:30', preco: 970 },
      { hora: '12:00', preco: 975 },
      { hora: '14:00', preco: 980 },
      { hora: '15:30', preco: 980 },
    ],
  },
  {
    id: 'caupi-fradinho',
    nome: 'Feijão Caupi Fradinho',
    nomeIngles: 'Cowpea / Black Eye Pea',
    precoFobUsdTon: 890.0,
    variacaoUsd: 15.0,
    variacaoPct: 1.71,
    precoFazendaRefReaisSaca: 235.0,
    embalagemPadrao: 'Sacaria 25kg Polipropileno',
    capacidadeContainer20Ton: 25.0,
    principaisDestinos: ['Índia (Nhava Sheva)', 'Tailândia', 'Vietnã (Cat Lai)', 'Egito'],
    qualidadeEspecificacao: 'Calibre 4.5mm+, Umidade max 13.5%, Pureza min 99%',
    fonteCotacao: 'Ibrafe / Brokers Internacionais Ásia (FOB Santos/Paranaguá)',
    historicoIntraday: [
      { hora: '09:00', preco: 875 },
      { hora: '10:30', preco: 880 },
      { hora: '12:00', preco: 885 },
      { hora: '14:00', preco: 890 },
      { hora: '15:30', preco: 890 },
    ],
  },
  {
    id: 'caupi-vermelho',
    nome: 'Feijão Caupi Vermelho',
    nomeIngles: 'Red Cowpea',
    precoFobUsdTon: 920.0,
    variacaoUsd: -5.0,
    variacaoPct: -0.54,
    precoFazendaRefReaisSaca: 250.0,
    embalagemPadrao: 'Sacaria 25kg / 50kg Polipropileno',
    capacidadeContainer20Ton: 24.5,
    principaisDestinos: ['Índia', 'Tailândia', 'Vietnã', 'Filipinas'],
    qualidadeEspecificacao: 'Cor avermelhada uniforme safra nova, Umidade 13.5%, Pureza 99%',
    fonteCotacao: 'Ibrafe / Brokers Internacionais Ásia (FOB Santos/Paranaguá)',
    historicoIntraday: [
      { hora: '09:00', preco: 925 },
      { hora: '10:30', preco: 925 },
      { hora: '12:00', preco: 920 },
      { hora: '14:00', preco: 920 },
      { hora: '15:30', preco: 920 },
    ],
  },
  {
    id: 'caupi-branco',
    nome: 'Feijão Caupi Branco',
    nomeIngles: 'White Cowpea',
    precoFobUsdTon: 910.0,
    variacaoUsd: 10.0,
    variacaoPct: 1.11,
    precoFazendaRefReaisSaca: 245.0,
    embalagemPadrao: 'Sacaria 25kg com proteção anti-umidade',
    capacidadeContainer20Ton: 24.5,
    principaisDestinos: ['Índia', 'Tailândia', 'Indonésia', 'Oriente Médio'],
    qualidadeEspecificacao: 'Grãos claros selecionados tipo export, Umidade max 13%, Defeitos max 2%',
    fonteCotacao: 'Ibrafe / Brokers Internacionais Ásia (FOB Santos/Paranaguá)',
    historicoIntraday: [
      { hora: '09:00', preco: 900 },
      { hora: '10:30', preco: 905 },
      { hora: '12:00', preco: 910 },
      { hora: '14:00', preco: 910 },
      { hora: '15:30', preco: 910 },
    ],
  },
];

export const PORTOS_ASIA: PortoDestinoAsia[] = [
  {
    id: 'nhava-sheva',
    pais: 'Índia',
    porto: 'Nhava Sheva (JNPT Mumbai)',
    codigoIata: 'INNSA',
    transitTimeDias: 36,
    freteContainer20Usd: 1750.0,
    demurrageFreeDays: 14,
    demandaPrincipal: 'Feijão Mungo Preto, Mungo Verde e Caupi',
    fonteFrete: 'Freightos Baltic Index (FBX) / Armadores regulares Maersk, MSC',
  },
  {
    id: 'mundra',
    pais: 'Índia',
    porto: 'Mundra Port (Gujarat)',
    codigoIata: 'INMUN',
    transitTimeDias: 38,
    freteContainer20Usd: 1820.0,
    demurrageFreeDays: 14,
    demandaPrincipal: 'Feijão Caupi Fradinho, Branco e Pulses',
    fonteFrete: 'Freightos Baltic Index (FBX) / Armadores CMA CGM, Hapag-Lloyd',
  },
  {
    id: 'laem-chabang',
    pais: 'Tailândia',
    porto: 'Laem Chabang / Bangkok',
    codigoIata: 'THLCH',
    transitTimeDias: 32,
    freteContainer20Usd: 1720.0,
    demurrageFreeDays: 14,
    demandaPrincipal: 'Feijão Mungo Verde, Caupi Vermelho e Caupi Branco',
    fonteFrete: 'Freightos Baltic Index (FBX) / ONE, Maersk Liner Service',
  },
  {
    id: 'ho-chi-minh',
    pais: 'Vietnã',
    porto: 'Ho Chi Minh (Cat Lai)',
    codigoIata: 'VNSGN',
    transitTimeDias: 31,
    freteContainer20Usd: 1780.0,
    demurrageFreeDays: 14,
    demandaPrincipal: 'Feijão Mungo Verde, Caupi Fradinho e Vermelho',
    fonteFrete: 'Freightos Baltic Index (FBX) / CMA CGM, MSC Direct',
  },
  {
    id: 'qingdao',
    pais: 'China',
    porto: 'Qingdao Port',
    codigoIata: 'CNTAO',
    transitTimeDias: 34,
    freteContainer20Usd: 1950.0,
    demurrageFreeDays: 21,
    demandaPrincipal: 'Feijão Mungo Verde e Soja Non-GMO para Broto',
    fonteFrete: 'Freightos Baltic Index (FBX) / COSCO, Maersk Line',
  },
  {
    id: 'shanghai',
    pais: 'China',
    porto: 'Shanghai / Ningbo',
    codigoIata: 'CNSHA',
    transitTimeDias: 32,
    freteContainer20Usd: 1900.0,
    demurrageFreeDays: 21,
    demandaPrincipal: 'Mungo Verde Selecionado e Pulses Especiais',
    fonteFrete: 'Freightos Baltic Index (FBX) / COSCO, Evergreen',
  },
  {
    id: 'chittagong',
    pais: 'Bangladesh',
    porto: 'Chittagong Port',
    codigoIata: 'BDCGP',
    transitTimeDias: 41,
    freteContainer20Usd: 2150.0,
    demurrageFreeDays: 14,
    demandaPrincipal: 'Feijão Mungo Preto, Caupi e Pulses em Geral',
    fonteFrete: 'Freightos Baltic Index (FBX) / Feeder via Colombo/Singapura',
  },
  {
    id: 'jakarta',
    pais: 'Indonésia',
    porto: 'Jakarta (Tanjung Priok)',
    codigoIata: 'IDJKT',
    transitTimeDias: 33,
    freteContainer20Usd: 1840.0,
    demurrageFreeDays: 14,
    demandaPrincipal: 'Feijão Caupi Branco e Mungo Verde',
    fonteFrete: 'Freightos Baltic Index (FBX) / Maersk, ONE Line',
  },
  {
    id: 'manila',
    pais: 'Filipinas',
    porto: 'Manila South Harbor',
    codigoIata: 'MNL',
    transitTimeDias: 35,
    freteContainer20Usd: 1880.0,
    demurrageFreeDays: 14,
    demandaPrincipal: 'Feijão Mungo Verde e Caupi Vermelho',
    fonteFrete: 'Freightos Baltic Index (FBX) / Armadores regulares',
  },
];

export function calcularParidadeFeijaoAsia(params: {
  precoFobUsdTon: number; // Preço de venda FOB porto (US$/ton)
  freteMaritimoContainerUsd: number; // Frete container 20' em US$
  toneladasPorContainer: number; // Ex: 24 ou 25 toneladas
  taxaDolar: number; // R$/US$
  custoEstufagemSacariaUsdTon?: number; // Custo de estufagem, bagging e pallets em US$/t (default ~22 US$/t)
  thcDespesasPortoUsdContainer?: number; // THC e taxas portuárias em US$ por container (default ~240 US$)
  freteRodoviarioReaisTon?: number; // Frete interior até porto em R$/t (default ~180 R$/t)
  margemTradingUsdTon?: number; // Margem desejada em US$/t (default ~25 US$/t)
}) {
  const tons = params.toneladasPorContainer || 24.5;
  const freteMaritimoUsdTon = params.freteMaritimoContainerUsd / tons;
  const seguroMaritimoUsdTon = params.precoFobUsdTon * 0.0035; // ~0.35% de seguro
  const precoCfrUsdTon = params.precoFobUsdTon + freteMaritimoUsdTon + seguroMaritimoUsdTon;
  const valorTotalContainerCfrUsd = precoCfrUsdTon * tons;

  const custoEstufagemUsdTon = params.custoEstufagemSacariaUsdTon ?? 22.0;
  const thcUsdTon = (params.thcDespesasPortoUsdContainer ?? 240.0) / tons;
  const margemUsdTon = params.margemTradingUsdTon ?? 25.0;

  // Valor FOB líquido no interior (US$/ton) = FOB Porto - Estufagem - THC - Margem
  const fobLiquidoInteriorUsdTon = Math.max(0, params.precoFobUsdTon - custoEstufagemUsdTon - thcUsdTon - margemUsdTon);

  // Frete rodoviário em US$/ton
  const freteRodoviarioUsdTon = (params.freteRodoviarioReaisTon ?? 180.0) / params.taxaDolar;

  // Preço Máximo de Compra Fazenda FOB Fábrica (US$/ton)
  const precoMaxCompraFazendaUsdTon = Math.max(0, fobLiquidoInteriorUsdTon - freteRodoviarioUsdTon);

  // Conversão para R$/saca de 60kg:
  // 1 tonelada = 1000 kg = 16.6667 sacas de 60kg
  const precoMaxCompraFazendaReaisSaca = (precoMaxCompraFazendaUsdTon * params.taxaDolar) / (1000 / 60);
  const precoFobReaisSaca = (params.precoFobUsdTon * params.taxaDolar) / (1000 / 60);

  return {
    precoCfrUsdTon: Number(precoCfrUsdTon.toFixed(2)),
    valorTotalContainerCfrUsd: Number(valorTotalContainerCfrUsd.toFixed(2)),
    freteMaritimoUsdTon: Number(freteMaritimoUsdTon.toFixed(2)),
    precoFobReaisSaca: Number(precoFobReaisSaca.toFixed(2)),
    precoMaxCompraFazendaUsdTon: Number(precoMaxCompraFazendaUsdTon.toFixed(2)),
    precoMaxCompraFazendaReaisSaca: Number(precoMaxCompraFazendaReaisSaca.toFixed(2)),
    fatorConversaoSacasTon: 16.6667,
  };
}
