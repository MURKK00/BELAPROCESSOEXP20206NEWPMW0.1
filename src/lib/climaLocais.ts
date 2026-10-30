export interface PrevisaoTempoLocal {
  id: string;
  cidade: string;
  uf: string;
  nomeExibicao: string;
  funcaoLogistica: string;
  tempAtual: number;
  tempMin: number;
  tempMax: number;
  umidade: number;
  ventoKmH: number;
  probChuva: number;
  condicaoTexto: string;
  iconeTipo: 'sol' | 'parcial' | 'chuva' | 'garoa' | 'tempestade';
  atualizadoEm: string;
}

const PONTOS_LOGISTICOS = [
  {
    id: 'confresa',
    cidade: 'Confresa',
    uf: 'MT',
    nomeExibicao: 'Confresa - MT',
    funcaoLogistica: 'Origem Grãos · Araguaia MT',
    lat: -10.6439,
    lon: -51.5694,
    fallback: { temp: 31, min: 23, max: 33, umid: 62, vento: 6, chuva: 45, cond: 'Nuvens Dispersas', icone: 'parcial' as const },
  },
  {
    id: 'santos',
    cidade: 'Santos',
    uf: 'SP',
    nomeExibicao: 'Santos - SP',
    funcaoLogistica: 'Porto de Embarque (BRSSZ)',
    lat: -23.9618,
    lon: -46.3322,
    fallback: { temp: 24, min: 20, max: 25, umid: 78, vento: 14, chuva: 80, cond: 'Garoa Leve / Porto', icone: 'garoa' as const },
  },
  {
    id: 'paranagua',
    cidade: 'Paranaguá',
    uf: 'PR',
    nomeExibicao: 'Paranaguá - PR',
    funcaoLogistica: 'Porto Exportação (BRPNG)',
    lat: -25.5205,
    lon: -48.5095,
    fallback: { temp: 23, min: 18, max: 24, umid: 72, vento: 10, chuva: 75, cond: 'Chuva Fraca / Litoral', icone: 'garoa' as const },
  },
  {
    id: 'palmas',
    cidade: 'Palmas',
    uf: 'TO',
    nomeExibicao: 'Palmas - TO',
    funcaoLogistica: 'Corredor Norte-Sul / Ferrovia',
    lat: -10.1844,
    lon: -48.3336,
    fallback: { temp: 29, min: 23, max: 31, umid: 68, vento: 7, chuva: 55, cond: 'Parcialmente Nublado', icone: 'parcial' as const },
  },
];

let cacheClima: { data: PrevisaoTempoLocal[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache

function traduzirWmo(code: number): { texto: string; icone: 'sol' | 'parcial' | 'chuva' | 'garoa' | 'tempestade' } {
  if (code === 0) return { texto: 'Céu Limpo', icone: 'sol' };
  if ([1, 2].includes(code)) return { texto: 'Parcialmente Nublado', icone: 'parcial' };
  if (code === 3) return { texto: 'Encoberto', icone: 'parcial' };
  if ([45, 48].includes(code)) return { texto: 'Nevoeiro', icone: 'parcial' };
  if ([51, 53, 55].includes(code)) return { texto: 'Garoa / Chuvisco', icone: 'garoa' };
  if ([61, 63, 65].includes(code)) return { texto: 'Chuva Moderada', icone: 'chuva' };
  if ([80, 81, 82].includes(code)) return { texto: 'Pancadas de Chuva', icone: 'chuva' };
  if ([95, 96, 99].includes(code)) return { texto: 'Tempestade', icone: 'tempestade' };
  return { texto: 'Tempo Estável', icone: 'parcial' };
}

export async function getPrevisaoTempoLocais(): Promise<PrevisaoTempoLocal[]> {
  const agora = Date.now();
  if (cacheClima && agora - cacheClima.timestamp < CACHE_TTL_MS) {
    return cacheClima.data;
  }

  try {
    const promises = PONTOS_LOGISTICOS.map(async (ponto) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${ponto.lat}&longitude=${ponto.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSao_Paulo`;
        const res = await fetch(url, { next: { revalidate: 300 } });
        if (!res.ok) throw new Error('Falha HTTP');
        const d = await res.json();

        const current = d.current;
        const daily = d.daily;
        const meteo = traduzirWmo(current?.weather_code ?? 2);

        return {
          id: ponto.id,
          cidade: ponto.cidade,
          uf: ponto.uf,
          nomeExibicao: ponto.nomeExibicao,
          funcaoLogistica: ponto.funcaoLogistica,
          tempAtual: Math.round(current?.temperature_2m ?? ponto.fallback.temp),
          tempMin: Math.round(daily?.temperature_2m_min?.[0] ?? ponto.fallback.min),
          tempMax: Math.round(daily?.temperature_2m_max?.[0] ?? ponto.fallback.max),
          umidade: Math.round(current?.relative_humidity_2m ?? ponto.fallback.umid),
          ventoKmH: Math.round(current?.wind_speed_10m ?? ponto.fallback.vento),
          probChuva: Math.round(daily?.precipitation_probability_max?.[0] ?? ponto.fallback.chuva),
          condicaoTexto: meteo.texto,
          iconeTipo: meteo.icone,
          atualizadoEm: new Date().toISOString(),
        };
      } catch {
        return {
          id: ponto.id,
          cidade: ponto.cidade,
          uf: ponto.uf,
          nomeExibicao: ponto.nomeExibicao,
          funcaoLogistica: ponto.funcaoLogistica,
          tempAtual: ponto.fallback.temp,
          tempMin: ponto.fallback.min,
          tempMax: ponto.fallback.max,
          umidade: ponto.fallback.umid,
          ventoKmH: ponto.fallback.vento,
          probChuva: ponto.fallback.chuva,
          condicaoTexto: ponto.fallback.cond,
          iconeTipo: ponto.fallback.icone,
          atualizadoEm: new Date().toISOString(),
        };
      }
    });

    const resultados = await Promise.all(promises);
    cacheClima = { data: resultados, timestamp: agora };
    return resultados;
  } catch {
    const fallbackList = PONTOS_LOGISTICOS.map((p) => ({
      id: p.id,
      cidade: p.cidade,
      uf: p.uf,
      nomeExibicao: p.nomeExibicao,
      funcaoLogistica: p.funcaoLogistica,
      tempAtual: p.fallback.temp,
      tempMin: p.fallback.min,
      tempMax: p.fallback.max,
      umidade: p.fallback.umid,
      ventoKmH: p.fallback.vento,
      probChuva: p.fallback.chuva,
      condicaoTexto: p.fallback.cond,
      iconeTipo: p.fallback.icone,
      atualizadoEm: new Date().toISOString(),
    }));
    return fallbackList;
  }
}
