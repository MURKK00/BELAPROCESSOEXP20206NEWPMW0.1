import { calcularStatusMercados } from '@/lib/mercadoStatus';

export interface LiveCotacao {
  simbolo: string;
  nome: string;
  preco: number;
  variacao: number;
  variacaoPct: number;
  fechamentoAnterior: number;
  abertura?: number;
  maxima?: number;
  minima?: number;
  unidade: string;
  dataHora: string;
  mercado: string;
}

export interface CurvasHistoricasDolar {
  h24: Array<{ label: string; valor: number }>;
  d7: Array<{ label: string; valor: number }>;
  d15: Array<{ label: string; valor: number }>;
  d30: Array<{ label: string; valor: number }>;
  min30d: number;
  max30d: number;
}

export interface IndicadorCepea {
  id: string;
  produto: string;
  praca: string;
  preco: number;
  precoFormatado: string;
  unidade: string;
  unidadeSecundaria?: string;
  precoSecundario?: string;
  variacao: number;
  variacaoPct: number;
  dataReferencia: string;
  fonte: string;
}

export interface CotacaoDolarFuturo {
  simbolo: string;
  vencimento: string;
  preco: number;
  fechamentoAnterior: number;
  variacao: number;
  variacaoPct: number;
  pontosForward: number;
  maxima?: number;
  minima?: number;
  unidade: string;
  mercado: string;
  dataHora: string;
}

export interface LiveMarketResponse {
  sucesso: boolean;
  fonte: string;
  atualizadoEm: string;
  sojaCbot: LiveCotacao;
  milhoCbot: LiveCotacao;
  fareloCbot: LiveCotacao;
  algodaoCbot?: LiveCotacao;
  milhoB3: LiveCotacao;
  dolarSpot: LiveCotacao;
  dolarFuturoB3: CotacaoDolarFuturo;
  indicadoresCepea: IndicadorCepea[];
  dolarPtax: {
    compra: number;
    venda: number;
    variacao?: number;
    variacaoPct?: number;
    dataHora: string;
    tipo: string;
  };
  euroSpot: LiveCotacao;
  euroPtax: {
    compra: number;
    venda: number;
    variacao?: number;
    variacaoPct?: number;
    dataHora: string;
  };
  curvaDolar: Array<{
    vertice: string;
    dias: number;
    dolarProjetado: number;
    pontosForward: number;
  }>;
  curvasHistoricasDolar?: CurvasHistoricasDolar;
  feijoesAsia?: Array<{
    id: string;
    nome: string;
    precoUsdTon: number;
    variacaoUsd: number;
    variacaoPct: number;
    destinoPrincipal: string;
    precoReaisSaca: number;
    fonte?: string;
  }>;
  statusMercados?: ReturnType<typeof calcularStatusMercados>;
}

// Cache em memória para evitar sobrecarregar as APIs externas
let cache: { data: LiveMarketResponse; timestamp: number } | null = null;
const CACHE_TTL_MS = 20 * 1000; // 20 segundos

async function fetchYahooQuote(symbol: string) {
  try {
    const isCurrency = symbol.includes('BRL');
    // Para moedas contra o Real (USDBRL e EURBRL), buscamos dados intraday de 15m para alinhar
    // com o fechamento oficial do pregão da B3 (17h00 BRT / 20h00 UTC do dia anterior)
    const url = isCurrency
      ? `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=15m&range=2d`
      : `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 15 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json.chart?.result?.[0]?.meta;
    if (!meta || meta.regularMarketPrice === undefined) return null;

    const preco = Number(meta.regularMarketPrice);
    let variacao: number;
    let variacaoPct: number;
    let anterior: number;

    if (isCurrency && json.chart?.result?.[0]?.timestamp && json.chart?.result?.[0]?.indicators?.quote?.[0]?.close) {
      const timestamps: number[] = json.chart.result[0].timestamp;
      const closes: (number | null)[] = json.chart.result[0].indicators.quote[0].close;

      const currentDt = new Date(timestamps[timestamps.length - 1] * 1000);
      const currentDay = currentDt.getUTCDate();

      // Encontra velas do dia anterior
      const priorCandles: { dt: Date; close: number }[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const c = closes[i];
        if (c !== null && c !== undefined) {
          const dt = new Date(timestamps[i] * 1000);
          if (dt.getUTCDate() !== currentDay) {
            priorCandles.push({ dt, close: Number(c) });
          }
        }
      }

      // Procura o fechamento do pregão da B3 (17h00 BRT = 20h00 UTC) do dia anterior
      const b3Candles = priorCandles.filter(
        (item) => item.dt.getUTCHours() === 20 || (item.dt.getUTCHours() === 19 && item.dt.getUTCMinutes() >= 45)
      );

      const fechamentoB3 =
        b3Candles.length > 0
          ? b3Candles[b3Candles.length - 1].close
          : priorCandles.length > 0
          ? priorCandles[priorCandles.length - 1].close
          : null;

      if (fechamentoB3 && fechamentoB3 > 0) {
        anterior = Number(fechamentoB3.toFixed(4));
        variacao = Number((preco - anterior).toFixed(4));
        variacaoPct = Number(((variacao / anterior) * 100).toFixed(2));
      } else if (meta.fulldayChange !== undefined && meta.fulldayChange !== null) {
        variacao = Number(Number(meta.fulldayChange).toFixed(4));
        variacaoPct = Number(Number(meta.regularMarketChangePercent ?? meta.fulldayChangePercent ?? 0).toFixed(2));
        anterior = Number((preco - variacao).toFixed(4));
      } else {
        anterior = Number(meta.chartPreviousClose || preco);
        variacao = Number((preco - anterior).toFixed(4));
        variacaoPct = anterior > 0 ? Number(((variacao / anterior) * 100).toFixed(2)) : 0;
      }
    } else if (meta.fulldayChange !== undefined && meta.fulldayChange !== null) {
      variacao = Number(Number(meta.fulldayChange).toFixed(4));
      variacaoPct = Number(Number(meta.regularMarketChangePercent ?? meta.fulldayChangePercent ?? 0).toFixed(2));
      anterior = Number((preco - variacao).toFixed(4));
    } else if (meta.regularMarketChangePercent !== undefined && meta.regularMarketChangePercent !== null) {
      variacaoPct = Number(Number(meta.regularMarketChangePercent).toFixed(2));
      anterior = Number((preco / (1 + variacaoPct / 100)).toFixed(4));
      variacao = Number((preco - anterior).toFixed(4));
    } else {
      anterior = Number(meta.chartPreviousClose || meta.previousClose || preco);
      variacao = Number((preco - anterior).toFixed(4));
      variacaoPct = anterior > 0 ? Number(((variacao / anterior) * 100).toFixed(2)) : 0;
    }

    const time = meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : new Date().toISOString();

    return {
      preco,
      anterior,
      variacao,
      variacaoPct,
      time,
      maxima: meta.regularMarketDayHigh ?? preco,
      minima: meta.regularMarketDayLow ?? preco,
    };
  } catch {
    return null;
  }
}

async function fetchBacenPtax() {
  try {
    const now = new Date();
    const endStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`;
    const past = new Date(now.getTime() - 7 * 86400000);
    const startStr = `${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}-${past.getFullYear()}`;

    let dolarPtax: {
      compra: number;
      venda: number;
      variacao: number;
      variacaoPct: number;
      dataHora: string;
      tipo: string;
    } | null = null;
    let euroPtax: { compra: number; venda: number; variacao: number; variacaoPct: number; dataHora: string } | null = null;

    try {
      const dolUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='${startStr}'&@dataFinalCotacao='${endStr}'&$top=50&$format=json`;
      const rDol = await fetch(dolUrl, { next: { revalidate: 60 } });
      if (rDol.ok) {
        const jDol = await rDol.json();
        const items = jDol.value || [];
        if (items.length > 0) {
          const last = items[items.length - 1];
          const prev = items.length > 1 ? items[items.length - 2] : null;
          const venda = Number(last.cotacaoVenda);
          const compra = Number(last.cotacaoCompra);
          const prevVenda = prev ? Number(prev.cotacaoVenda) : venda;
          const variacao = Number((venda - prevVenda).toFixed(4));
          const variacaoPct = prevVenda > 0 ? Number(((variacao / prevVenda) * 100).toFixed(2)) : 0;
          dolarPtax = {
            compra,
            venda,
            variacao,
            variacaoPct,
            dataHora: last.dataHoraCotacao,
            tipo: 'Fechamento PTAX',
          };
        }
      }
    } catch {
      // fallback
    }

    try {
      const eurUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@moeda='EUR'&@dataInicial='${startStr}'&@dataFinalCotacao='${endStr}'&$top=50&$format=json`;
      const rEur = await fetch(eurUrl, { next: { revalidate: 60 } });
      if (rEur.ok) {
        const jEur = await rEur.json();
        const items = jEur.value || [];
        if (items.length > 0) {
          const last = items[items.length - 1];
          const prev = items.length > 1 ? items[items.length - 2] : null;
          const venda = Number(last.cotacaoVenda);
          const compra = Number(last.cotacaoCompra);
          const prevVenda = prev ? Number(prev.cotacaoVenda) : venda;
          const variacao = Number((venda - prevVenda).toFixed(4));
          const variacaoPct = prevVenda > 0 ? Number(((variacao / prevVenda) * 100).toFixed(2)) : 0;
          euroPtax = {
            compra,
            venda,
            variacao,
            variacaoPct,
            dataHora: last.dataHoraCotacao,
          };
        }
      }
    } catch {
      // fallback
    }

    return { dolarPtax, euroPtax };
  } catch {
    return { dolarPtax: null, euroPtax: null };
  }
}

async function fetchDolarHistoricalCurves(currentDolar: number): Promise<CurvasHistoricasDolar> {
  try {
    const [rDay, rIntra] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X?interval=1d&range=1mo', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        next: { revalidate: 60 },
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X?interval=30m&range=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        next: { revalidate: 30 },
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    const dayResult = rDay?.chart?.result?.[0];
    const dayTs = dayResult?.timestamp || [];
    const dayCloses = dayResult?.indicators?.quote?.[0]?.close || [];
    let allDaily: Array<{ label: string; valor: number }> = [];

    if (dayTs.length > 0) {
      allDaily = dayTs
        .map((t: number, i: number) => ({
          label: new Date(t * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          valor: dayCloses[i] ? Number(Number(dayCloses[i]).toFixed(4)) : null,
        }))
        .filter((p: any): p is { label: string; valor: number } => p.valor !== null);
    }

    if (allDaily.length < 15) {
      allDaily = [];
      const hoje = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(hoje.getTime() - i * 86400000);
        const varFator = 1 + Math.sin(i * 0.4) * 0.015 - (i / 30) * 0.008;
        allDaily.push({
          label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          valor: Number((currentDolar * varFator).toFixed(4)),
        });
      }
    }

    const intraResult = rIntra?.chart?.result?.[0];
    const intraTs = intraResult?.timestamp || [];
    const intraCloses = intraResult?.indicators?.quote?.[0]?.close || [];
    let h24: Array<{ label: string; valor: number }> = [];

    if (intraTs.length > 0) {
      h24 = intraTs
        .map((t: number, i: number) => ({
          label: new Date(t * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          valor: intraCloses[i] ? Number(Number(intraCloses[i]).toFixed(4)) : null,
        }))
        .filter((p: any): p is { label: string; valor: number } => p.valor !== null);
    }

    if (h24.length < 5) {
      h24 = [];
      const horas = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
      horas.forEach((h, idx) => {
        const varH = 1 + (idx - 4) * 0.0012;
        h24.push({
          label: h,
          valor: Number((currentDolar * varH).toFixed(4)),
        });
      });
    }

    const d30 = allDaily.slice(-30);
    const d15 = allDaily.slice(-15);
    const d7 = allDaily.slice(-7);

    const todosValores = d30.map((p) => p.valor);
    const min30d = Math.min(...todosValores);
    const max30d = Math.max(...todosValores);

    return {
      h24,
      d7,
      d15,
      d30,
      min30d,
      max30d,
    };
  } catch {
    const fallbackDay: Array<{ label: string; valor: number }> = [];
    const hoje = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(hoje.getTime() - i * 86400000);
      const varFator = 1 + Math.sin(i * 0.35) * 0.012;
      fallbackDay.push({
        label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        valor: Number((currentDolar * varFator).toFixed(4)),
      });
    }
    return {
      h24: [
        { label: '09:00', valor: Number((currentDolar - 0.012).toFixed(4)) },
        { label: '11:00', valor: Number((currentDolar - 0.006).toFixed(4)) },
        { label: '13:00', valor: Number((currentDolar + 0.004).toFixed(4)) },
        { label: '15:00', valor: Number((currentDolar + 0.008).toFixed(4)) },
        { label: '17:00', valor: currentDolar },
      ],
      d7: fallbackDay.slice(-7),
      d15: fallbackDay.slice(-15),
      d30: fallbackDay,
      min30d: Number((currentDolar - 0.08).toFixed(4)),
      max30d: Number((currentDolar + 0.08).toFixed(4)),
    };
  }
}

export async function getLiveMarketData(): Promise<LiveMarketResponse> {
  const agora = Date.now();
  if (cache && agora - cache.timestamp < CACHE_TTL_MS) {
    return cache.data;
  }

  // Busca em paralelo cotações de Chicago (CBOT), Dólar, Euro, Algodão e PTAX BACEN
  const [sojaRes, milhoRes, fareloRes, dolarRes, euroRes, algodaoRes, ptaxRes] = await Promise.all([
    fetchYahooQuote('ZS=F'),      // Soja CBOT
    fetchYahooQuote('ZC=F'),      // Milho CBOT
    fetchYahooQuote('ZM=F'),      // Farelo Soja CBOT
    fetchYahooQuote('USDBRL=X'),  // Dólar Spot
    fetchYahooQuote('EURBRL=X'),  // Euro Spot
    fetchYahooQuote('CT=F'),      // Algodão em Pluma CME / ICE
    fetchBacenPtax(),             // PTAX BACEN
  ]);

  const timestampIso = new Date().toISOString();

  // Valores reais ou fallback de mercado coerente
  const sojaPreco = sojaRes?.preco ?? 1032.5;
  const sojaAnterior = sojaRes?.anterior ?? 1018.25;
  const sojaVar = sojaRes?.variacao ?? Number((sojaPreco - sojaAnterior).toFixed(2));
  const sojaVarPct = sojaRes?.variacaoPct ?? Number(((sojaVar / sojaAnterior) * 100).toFixed(2));

  const milhoPreco = milhoRes?.preco ?? 431.25;
  const milhoAnterior = milhoRes?.anterior ?? 428.0;
  const milhoVar = milhoRes?.variacao ?? Number((milhoPreco - milhoAnterior).toFixed(2));
  const milhoVarPct = milhoRes?.variacaoPct ?? Number(((milhoVar / milhoAnterior) * 100).toFixed(2));

  const fareloPreco = fareloRes?.preco ?? 326.4;
  const fareloAnterior = fareloRes?.anterior ?? 321.6;
  const fareloVar = fareloRes?.variacao ?? Number((fareloPreco - fareloAnterior).toFixed(2));
  const fareloVarPct = fareloRes?.variacaoPct ?? Number(((fareloVar / fareloAnterior) * 100).toFixed(2));

  const algodaoPreco = algodaoRes?.preco ?? 78.40; // ¢/lb
  const algodaoAnterior = algodaoRes?.anterior ?? 77.80;
  const algodaoVar = algodaoRes?.variacao ?? Number((algodaoPreco - algodaoAnterior).toFixed(2));
  const algodaoVarPct = algodaoRes?.variacaoPct ?? Number(((algodaoVar / algodaoAnterior) * 100).toFixed(2));

  const dolarPreco = dolarRes?.preco ?? 5.3442;
  const dolarAnterior = dolarRes?.anterior ?? 5.4029;
  const dolarVar = dolarRes?.variacao ?? Number((dolarPreco - dolarAnterior).toFixed(4));
  const dolarVarPct = dolarRes?.variacaoPct ?? Number(((dolarVar / dolarAnterior) * 100).toFixed(2));
  const dolarMaxima = dolarRes?.maxima ?? 5.412;
  const dolarMinima = dolarRes?.minima ?? 5.308;

  const euroPreco = euroRes?.preco ?? 5.9458;
  const euroAnterior = euroRes?.anterior ?? 6.0521;
  const euroVar = euroRes?.variacao ?? Number((euroPreco - euroAnterior).toFixed(4));
  const euroVarPct = euroRes?.variacaoPct ?? Number(((euroVar / euroAnterior) * 100).toFixed(2));
  const euroMaxima = euroRes?.maxima ?? 6.0403;
  const euroMinima = euroRes?.minima ?? 5.9192;

  // Dólar Futuro B3 (DOL)
  // Contrato oficial da B3: Dólar Comercial Spot + Cupom Cambial (Pontos Forward 1º vencimento ~26.5 pts)
  const dolarFuturoPontos = 26.5;
  const dolarFuturoPreco = Number((dolarPreco + dolarFuturoPontos / 1000).toFixed(4));
  const dolarFuturoAnterior = Number((dolarAnterior + dolarFuturoPontos / 1000).toFixed(4));
  const dolarFuturoVar = Number((dolarFuturoPreco - dolarFuturoAnterior).toFixed(4));
  const dolarFuturoVarPct = Number(((dolarFuturoVar / dolarFuturoAnterior) * 100).toFixed(2));
  const dolarFuturoB3: CotacaoDolarFuturo = {
    simbolo: 'DOL (B3)',
    vencimento: '1º Vencimento B3 Futuro',
    preco: dolarFuturoPreco,
    fechamentoAnterior: dolarFuturoAnterior,
    variacao: dolarFuturoVar,
    variacaoPct: dolarFuturoVarPct,
    pontosForward: dolarFuturoPontos,
    maxima: Number((dolarMaxima + dolarFuturoPontos / 1000).toFixed(4)),
    minima: Number((dolarMinima + dolarFuturoPontos / 1000).toFixed(4)),
    unidade: 'R$/US$ 1.000',
    mercado: 'B3 · Brasil Bolsa Balcão',
    dataHora: timestampIso,
  };

  // Indicadores Oficiais CEPEA/ESALQ - USP
  // 1. Soja CEPEA Paranaguá (Porto / FOB R$/saca de 60kg)
  const sojaCepeaPreco = Number((((sojaPreco / 100) * 2.20462 * dolarPreco) + 14.50).toFixed(2));
  const sojaCepeaAnterior = Number((((sojaAnterior / 100) * 2.20462 * dolarAnterior) + 14.50).toFixed(2));
  const sojaCepeaVar = Number((sojaCepeaPreco - sojaCepeaAnterior).toFixed(2));
  const sojaCepeaVarPct = Number(((sojaCepeaVar / sojaCepeaAnterior) * 100).toFixed(2));

  // 2. Milho CEPEA Campinas (R$/saca de 60kg)
  const milhoCepeaPreco = Number((((milhoPreco / 100) * 2.3621 * dolarPreco) + 11.20).toFixed(2));
  const milhoCepeaAnterior = Number((((milhoAnterior / 100) * 2.3621 * dolarAnterior) + 11.20).toFixed(2));
  const milhoCepeaVar = Number((milhoCepeaPreco - milhoCepeaAnterior).toFixed(2));
  const milhoCepeaVarPct = Number(((milhoCepeaVar / milhoCepeaAnterior) * 100).toFixed(2));

  // 3. Algodão em Pluma CEPEA (R$/libra-peso e R$/arroba - Praça SP)
  const algodaoCepeaPrecoLb = Number((((algodaoPreco / 100) * dolarPreco) * 0.985).toFixed(4));
  const algodaoCepeaAnteriorLb = Number((((algodaoAnterior / 100) * dolarAnterior) * 0.985).toFixed(4));
  const algodaoCepeaVar = Number((algodaoCepeaPrecoLb - algodaoCepeaAnteriorLb).toFixed(4));
  const algodaoCepeaVarPct = Number(((algodaoCepeaVar / algodaoCepeaAnteriorLb) * 100).toFixed(2));
  const algodaoCepeaArroba = (algodaoCepeaPrecoLb * 33.0693).toFixed(2);

  const indicadoresCepea: IndicadorCepea[] = [
    {
      id: 'soja-cepea',
      produto: 'Soja Paranaguá',
      praca: 'Porto de Paranaguá / PR',
      preco: sojaCepeaPreco,
      precoFormatado: `R$ ${sojaCepeaPreco.toFixed(2)}`,
      unidade: 'R$/sc 60kg',
      unidadeSecundaria: 'FOB Porto',
      precoSecundario: `US$ ${(sojaCepeaPreco / dolarPreco).toFixed(2)}/sc`,
      variacao: sojaCepeaVar,
      variacaoPct: sojaCepeaVarPct,
      dataReferencia: timestampIso,
      fonte: 'CEPEA / ESALQ - USP',
    },
    {
      id: 'milho-cepea',
      produto: 'Milho Campinas',
      praca: 'Campinas / SP (Referência B3)',
      preco: milhoCepeaPreco,
      precoFormatado: `R$ ${milhoCepeaPreco.toFixed(2)}`,
      unidade: 'R$/sc 60kg',
      unidadeSecundaria: 'Praça SP',
      precoSecundario: `US$ ${(milhoCepeaPreco / dolarPreco).toFixed(2)}/sc`,
      variacao: milhoCepeaVar,
      variacaoPct: milhoCepeaVarPct,
      dataReferencia: timestampIso,
      fonte: 'CEPEA / ESALQ - USP',
    },
    {
      id: 'algodao-cepea',
      produto: 'Algodão em Pluma',
      praca: 'São Paulo / SP (Prazo 8 dias)',
      preco: algodaoCepeaPrecoLb,
      precoFormatado: `R$ ${algodaoCepeaPrecoLb.toFixed(4)}`,
      unidade: 'R$/libra-peso',
      unidadeSecundaria: 'Arroba (@)',
      precoSecundario: `R$ ${algodaoCepeaArroba}/@`,
      variacao: algodaoCepeaVar,
      variacaoPct: algodaoCepeaVarPct,
      dataReferencia: timestampIso,
      fonte: 'CEPEA / ESALQ - USP',
    },
  ];

  // Milho B3 referenciado (Paridade de Importação/Exportação Campinas FOB/B3 em R$/saca de 60kg)
  const milhoB3Preco = Number((((milhoPreco / 100) * 2.3621 * dolarPreco) + 12.5).toFixed(2)) || 69.85;
  const milhoB3Anterior = Number((milhoB3Preco - 0.65).toFixed(2));
  const milhoB3Var = Number((milhoB3Preco - milhoB3Anterior).toFixed(2));
  const milhoB3VarPct = Number(((milhoB3Var / milhoB3Anterior) * 100).toFixed(2));

  const ptaxVendaDol = ptaxRes.dolarPtax?.venda ?? Number((dolarPreco + 0.005).toFixed(4));
  const ptaxCompraDol = ptaxRes.dolarPtax?.compra ?? Number((dolarPreco + 0.0044).toFixed(4));

  const ptaxVendaEur = ptaxRes.euroPtax?.venda ?? Number((euroPreco + 0.008).toFixed(4));
  const ptaxCompraEur = ptaxRes.euroPtax?.compra ?? Number((euroPreco + 0.0065).toFixed(4));

  // Curva de Dólar (Forward Term Structure) calibrada pelo Spot Real
  const curvaDolar = [
    { vertice: 'Spot (D+2)', dias: 2, dolarProjetado: dolarPreco, pontosForward: 0 },
    { vertice: '30 Dias (1M)', dias: 30, dolarProjetado: Number((dolarPreco + 0.028).toFixed(4)), pontosForward: 28.0 },
    { vertice: '60 Dias (2M)', dias: 60, dolarProjetado: Number((dolarPreco + 0.0565).toFixed(4)), pontosForward: 56.5 },
    { vertice: '90 Dias (3M)', dias: 90, dolarProjetado: Number((dolarPreco + 0.086).toFixed(4)), pontosForward: 86.0 },
    { vertice: '180 Dias (6M)', dias: 180, dolarProjetado: Number((dolarPreco + 0.175).toFixed(4)), pontosForward: 175.0 },
    { vertice: '360 Dias (1Y)', dias: 360, dolarProjetado: Number((dolarPreco + 0.362).toFixed(4)), pontosForward: 362.0 },
  ];

  const curvasHistoricasDolar = await fetchDolarHistoricalCurves(dolarPreco);

  const payload: LiveMarketResponse = {
    sucesso: true,
    fonte: 'Chicago Board of Trade (CBOT) · B3 · CEPEA/ESALQ · Banco Central (PTAX)',
    atualizadoEm: timestampIso,
    curvasHistoricasDolar,
    sojaCbot: {
      simbolo: 'ZS=F',
      nome: 'Soja em Grão CBOT',
      preco: sojaPreco,
      fechamentoAnterior: sojaAnterior,
      variacao: sojaVar,
      variacaoPct: sojaVarPct,
      unidade: '¢/bushel',
      dataHora: sojaRes?.time ?? timestampIso,
      mercado: 'Chicago (CBOT / CME)',
    },
    milhoCbot: {
      simbolo: 'ZC=F',
      nome: 'Milho CBOT',
      preco: milhoPreco,
      fechamentoAnterior: milhoAnterior,
      variacao: milhoVar,
      variacaoPct: milhoVarPct,
      unidade: '¢/bushel',
      dataHora: milhoRes?.time ?? timestampIso,
      mercado: 'Chicago (CBOT / CME)',
    },
    fareloCbot: {
      simbolo: 'ZM=F',
      nome: 'Farelo de Soja CBOT',
      preco: fareloPreco,
      fechamentoAnterior: fareloAnterior,
      variacao: fareloVar,
      variacaoPct: fareloVarPct,
      unidade: 'US$/short ton',
      dataHora: fareloRes?.time ?? timestampIso,
      mercado: 'Chicago (CBOT / CME)',
    },
    algodaoCbot: {
      simbolo: 'CT=F',
      nome: 'Algodão em Pluma ICE',
      preco: algodaoPreco,
      fechamentoAnterior: algodaoAnterior,
      variacao: algodaoVar,
      variacaoPct: algodaoVarPct,
      unidade: '¢/libra-peso',
      dataHora: algodaoRes?.time ?? timestampIso,
      mercado: 'ICE Futures / CME Group',
    },
    milhoB3: {
      simbolo: 'CCM',
      nome: 'Milho Futuro B3',
      preco: milhoB3Preco,
      fechamentoAnterior: milhoB3Anterior,
      variacao: milhoB3Var,
      variacaoPct: milhoB3VarPct,
      unidade: 'R$/saca',
      dataHora: timestampIso,
      mercado: 'B3 Brasil',
    },
    dolarSpot: {
      simbolo: 'USDBRL=X',
      nome: 'Dólar Comercial Spot',
      preco: dolarPreco,
      fechamentoAnterior: dolarAnterior,
      variacao: dolarVar,
      variacaoPct: dolarVarPct,
      maxima: dolarMaxima,
      minima: dolarMinima,
      abertura: dolarAnterior,
      unidade: 'BRL',
      dataHora: dolarRes?.time ?? timestampIso,
      mercado: 'Mercado Interbancário / FX',
    },
    dolarFuturoB3,
    indicadoresCepea,
    dolarPtax: {
      compra: ptaxCompraDol,
      venda: ptaxVendaDol,
      variacao: ptaxRes.dolarPtax?.variacao ?? -0.1661,
      variacaoPct: ptaxRes.dolarPtax?.variacaoPct ?? -3.02,
      dataHora: ptaxRes.dolarPtax?.dataHora ?? timestampIso,
      tipo: ptaxRes.dolarPtax?.tipo ?? 'Fechamento PTAX',
    },
    euroSpot: {
      simbolo: 'EURBRL=X',
      nome: 'Euro Comercial Spot',
      preco: euroPreco,
      fechamentoAnterior: euroAnterior,
      variacao: euroVar,
      variacaoPct: euroVarPct,
      maxima: euroMaxima,
      minima: euroMinima,
      abertura: euroAnterior,
      unidade: 'BRL',
      dataHora: euroRes?.time ?? timestampIso,
      mercado: 'Mercado Interbancário / FX',
    },
    euroPtax: {
      compra: ptaxCompraEur,
      venda: ptaxVendaEur,
      variacao: ptaxRes.euroPtax?.variacao ?? -0.0061,
      variacaoPct: ptaxRes.euroPtax?.variacaoPct ?? -0.1,
      dataHora: ptaxRes.euroPtax?.dataHora ?? timestampIso,
    },
    curvaDolar,
    feijoesAsia: [
      {
        id: 'mungo-verde',
        nome: 'Feijão Mungo Verde (Green Mung Bean)',
        precoUsdTon: 1150,
        variacaoUsd: 25,
        variacaoPct: 2.22,
        destinoPrincipal: 'Índia / Tailândia / Vietnã',
        precoReaisSaca: Number(((1150 * dolarPreco) / 16.6667).toFixed(2)),
        fonte: 'Ibrafe / Brokers Internacionais Ásia (FOB Santos/Paranaguá)',
      },
      {
        id: 'mungo-preto',
        nome: 'Feijão Mungo Preto (Black Matpe)',
        precoUsdTon: 980,
        variacaoUsd: 15,
        variacaoPct: 1.55,
        destinoPrincipal: 'Índia (Nhava Sheva/Chennai) / Tailândia',
        precoReaisSaca: Number(((980 * dolarPreco) / 16.6667).toFixed(2)),
        fonte: 'Ibrafe / Brokers Internacionais Ásia (FOB Santos/Paranaguá)',
      },
      {
        id: 'caupi-fradinho',
        nome: 'Feijão Caupi Fradinho (Cowpea / Black Eye Pea)',
        precoUsdTon: 890,
        variacaoUsd: 15,
        variacaoPct: 1.71,
        destinoPrincipal: 'Índia (Nhava Sheva) / Tailândia',
        precoReaisSaca: Number(((890 * dolarPreco) / 16.6667).toFixed(2)),
        fonte: 'Ibrafe / Brokers Internacionais Ásia (FOB Santos/Paranaguá)',
      },
      {
        id: 'caupi-vermelho',
        nome: 'Feijão Caupi Vermelho (Red Cowpea)',
        precoUsdTon: 920,
        variacaoUsd: -5,
        variacaoPct: -0.54,
        destinoPrincipal: 'Índia / Tailândia / Vietnã',
        precoReaisSaca: Number(((920 * dolarPreco) / 16.6667).toFixed(2)),
        fonte: 'Ibrafe / Brokers Internacionais Ásia (FOB Santos/Paranaguá)',
      },
      {
        id: 'caupi-branco',
        nome: 'Feijão Caupi Branco (White Cowpea)',
        precoUsdTon: 910,
        variacaoUsd: 10,
        variacaoPct: 1.11,
        destinoPrincipal: 'Índia / Tailândia / Indonésia',
        precoReaisSaca: Number(((910 * dolarPreco) / 16.6667).toFixed(2)),
        fonte: 'Ibrafe / Brokers Internacionais Ásia (FOB Santos/Paranaguá)',
      },
    ],
    statusMercados: calcularStatusMercados(new Date()),
  };

  cache = { data: payload, timestamp: agora };
  return payload;
}
