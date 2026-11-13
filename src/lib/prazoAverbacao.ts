/**
 * Cálculo centralizado do prazo legal de averbação (180 dias) no fuso America/Sao_Paulo.
 * Regra de negócio: o prazo de 180 dias é contado exclusivamente a partir da data de emissão
 * das Notas Fiscais da Etapa 4 (ETAPA_4_EXPORTACAO). As demais etapas não têm prazo de averbação.
 */

export const PRAZO_AVERBACAO_DIAS = 180;
export const LIMIAR_CRITICO_DIAS = 5;
export const TIMEZONE_FISCAL = 'America/Sao_Paulo';

export type FaixaPrazoAverbacao =
  | 'AVERBADA'
  | 'DENTRO_DO_PRAZO'
  | 'CRITICO'
  | 'FORA_DO_PRAZO';

export interface DataCivilSP {
  ano: number;
  mes: number;
  dia: number;
  iso: string;
}

export interface InfoPrazoAverbacao {
  aplicavel: boolean;
  faixa: FaixaPrazoAverbacao | null;
  diasDecorridos: number | null;
  diasRestantes: number | null;
  dataEmissaoSp: string | null;
  dataLimiteIso: string | null;
  icmsARecolher: boolean;
  prioridadeOrdenacao: number;
}

export function obterDataCivilSaoPaulo(input: Date | string | null | undefined): DataCivilSP | null {
  if (!input) return null;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    const matchYmd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchYmd) {
      const ano = Number(matchYmd[1]);
      const mes = Number(matchYmd[2]);
      const dia = Number(matchYmd[3]);
      return { ano, mes, dia, iso: trimmed };
    }
  }

  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_FISCAL,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const ano = Number(parts.find((p) => p.type === 'year')?.value);
  const mes = Number(parts.find((p) => p.type === 'month')?.value);
  const dia = Number(parts.find((p) => p.type === 'day')?.value);

  if (!ano || !mes || !dia) return null;

  const iso = `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  return { ano, mes, dia, iso };
}

function paraDiaEpochUtc(d: DataCivilSP): number {
  return Math.floor(Date.UTC(d.ano, d.mes - 1, d.dia) / 86_400_000);
}

export function calcularPrazoAverbacao(params: {
  etapa: string;
  dataEmissao: Date | string | null | undefined;
  statusAverbacao?: string | null;
  dataReferencia?: Date;
}): InfoPrazoAverbacao {
  const { etapa, dataEmissao, statusAverbacao, dataReferencia = new Date() } = params;
  const emissaoSp = obterDataCivilSaoPaulo(dataEmissao);

  if (etapa !== 'ETAPA_4_EXPORTACAO') {
    return {
      aplicavel: false,
      faixa: null,
      diasDecorridos: null,
      diasRestantes: null,
      dataEmissaoSp: emissaoSp?.iso || null,
      dataLimiteIso: null,
      icmsARecolher: false,
      prioridadeOrdenacao: 4,
    };
  }

  const dataLimiteIso = emissaoSp
    ? new Date(Date.UTC(emissaoSp.ano, emissaoSp.mes - 1, emissaoSp.dia + PRAZO_AVERBACAO_DIAS))
        .toISOString()
        .slice(0, 10)
    : null;

  if (statusAverbacao === 'AVERBADA') {
    return {
      aplicavel: true,
      faixa: 'AVERBADA',
      diasDecorridos: null,
      diasRestantes: null,
      dataEmissaoSp: emissaoSp?.iso || null,
      dataLimiteIso,
      icmsARecolher: false,
      prioridadeOrdenacao: 3,
    };
  }

  if (!emissaoSp) {
    return {
      aplicavel: true,
      faixa: 'DENTRO_DO_PRAZO',
      diasDecorridos: null,
      diasRestantes: null,
      dataEmissaoSp: null,
      dataLimiteIso: null,
      icmsARecolher: false,
      prioridadeOrdenacao: 2,
    };
  }

  const hojeSp = obterDataCivilSaoPaulo(dataReferencia) || obterDataCivilSaoPaulo(new Date())!;
  const diasDecorridos = paraDiaEpochUtc(hojeSp) - paraDiaEpochUtc(emissaoSp);
  const diasRestantes = PRAZO_AVERBACAO_DIAS - diasDecorridos;

  if (diasRestantes < 0) {
    return {
      aplicavel: true,
      faixa: 'FORA_DO_PRAZO',
      diasDecorridos,
      diasRestantes,
      dataEmissaoSp: emissaoSp.iso,
      dataLimiteIso,
      icmsARecolher: true,
      prioridadeOrdenacao: 0,
    };
  }

  if (diasRestantes <= LIMIAR_CRITICO_DIAS) {
    return {
      aplicavel: true,
      faixa: 'CRITICO',
      diasDecorridos,
      diasRestantes,
      dataEmissaoSp: emissaoSp.iso,
      dataLimiteIso,
      icmsARecolher: false,
      prioridadeOrdenacao: 1,
    };
  }

  return {
    aplicavel: true,
    faixa: 'DENTRO_DO_PRAZO',
    diasDecorridos,
    diasRestantes,
    dataEmissaoSp: emissaoSp.iso,
    dataLimiteIso,
    icmsARecolher: false,
    prioridadeOrdenacao: 2,
  };
}

export function compararPorCriticidadeAverbacao(
  a: { prazo: InfoPrazoAverbacao; dataEmissao: Date | string; id?: string },
  b: { prazo: InfoPrazoAverbacao; dataEmissao: Date | string; id?: string }
): number {
  if (a.prazo.prioridadeOrdenacao !== b.prazo.prioridadeOrdenacao) {
    return a.prazo.prioridadeOrdenacao - b.prazo.prioridadeOrdenacao;
  }

  // Para notas pendentes dentro de uma faixa com prazo (FORA_DO_PRAZO, CRITICO, DENTRO_DO_PRAZO),
  // ordena da menor quantidade de dias restantes (mais atrasada/urgente) para a maior.
  if (a.prazo.diasRestantes !== null && b.prazo.diasRestantes !== null) {
    if (a.prazo.diasRestantes !== b.prazo.diasRestantes) {
      return a.prazo.diasRestantes - b.prazo.diasRestantes;
    }
  }

  const timeA = new Date(a.dataEmissao).getTime() || 0;
  const timeB = new Date(b.dataEmissao).getTime() || 0;
  if (timeB !== timeA) {
    return timeB - timeA;
  }

  return (a.id || '').localeCompare(b.id || '');
}

export function formatarTextoDiasRestantes(prazo: InfoPrazoAverbacao | null | undefined): string {
  if (!prazo || !prazo.aplicavel) return '—';
  if (prazo.faixa === 'AVERBADA') return 'Averbada';
  if (prazo.diasRestantes === null) return '—';
  if (prazo.diasRestantes < 0) {
    const atraso = Math.abs(prazo.diasRestantes);
    return `Vencida há ${atraso} ${atraso === 1 ? 'dia' : 'dias'}`;
  }
  if (prazo.diasRestantes === 0) return 'Vence hoje';
  if (prazo.diasRestantes === 1) return 'Falta 1 dia';
  return `${prazo.diasRestantes} dias restantes`;
}

export function formatarDataCivilBR(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return String(isoDate);
  return d.toLocaleDateString('pt-BR', { timeZone: TIMEZONE_FISCAL });
}
