import { safeNumber } from '@/lib/formatters';

/**
 * Converte texto ou número no padrão brasileiro (ou internacional) para número JS.
 * Regras:
 * - Vazio / inválido => null (nunca retorna NaN)
 * - Se tiver vírgula: a vírgula é o decimal e os pontos são milhar ("1.000,50" => 1000.5)
 * - Se só tiver pontos seguindo o padrão de milhar (\d{1,3}(\.\d{3})+): pontos são milhar ("1.000" => 1000)
 * - Caso contrário, o ponto é decimal ("1000.5" => 1000.5)
 */
export function parseNumeroBR(texto: string | number | null | undefined): number | null {
  if (texto === null || texto === undefined) return null;

  if (typeof texto === 'number') {
    return Number.isFinite(texto) ? texto : null;
  }

  const trimmed = String(texto).trim();
  if (!trimmed) return null;

  // Mantém apenas dígitos, ponto, vírgula e sinal negativo inicial
  let limpo = trimmed.replace(/[^\d.,-]/g, '');
  if (!limpo || limpo === '-' || limpo === '.' || limpo === ',') return null;

  // Garante que apenas sinal negativo no início seja considerado
  const negativo = limpo.startsWith('-');
  limpo = limpo.replace(/-/g, '');
  if (!limpo) return null;

  let normalizado: string;

  if (limpo.includes(',')) {
    // Se há vírgula, pontos são separadores de milhar e a última vírgula é o separador decimal
    const semPontos = limpo.replace(/\./g, '');
    const ultimaVirgula = semPontos.lastIndexOf(',');
    const parteInteira = semPontos.slice(0, ultimaVirgula).replace(/,/g, '');
    const parteDecimal = semPontos.slice(ultimaVirgula + 1).replace(/,/g, '');
    normalizado = parteDecimal.length > 0 ? `${parteInteira || '0'}.${parteDecimal}` : (parteInteira || '0');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    // Apenas pontos seguindo padrão estrito de milhar ("1.000", "27.500", "1.234.567")
    normalizado = limpo.replace(/\./g, '');
  } else {
    // Caso contrário, trata ponto como decimal ("1000.5", "100.50")
    const primeiroPonto = limpo.indexOf('.');
    if (primeiroPonto !== -1) {
      const antes = limpo.slice(0, primeiroPonto);
      const depois = limpo.slice(primeiroPonto + 1).replace(/\./g, '');
      normalizado = depois.length > 0 ? `${antes || '0'}.${depois}` : (antes || '0');
    } else {
      normalizado = limpo;
    }
  }

  if (!normalizado || !/\d/.test(normalizado)) return null;

  const numero = Number(negativo ? `-${normalizado}` : normalizado);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Formata número para o padrão brasileiro ("1.234,56").
 * Retorna "" se o valor for null/undefined/inválido.
 */
export function formatNumeroBR(
  numero: number | string | null | undefined,
  casasMin = 2,
  casasMax = 2
): string {
  if (numero === null || numero === undefined || numero === '') return '';
  const parsed = typeof numero === 'number' ? (Number.isFinite(numero) ? numero : null) : parseNumeroBR(numero);
  if (parsed === null) return '';

  const min = Math.max(0, Math.min(casasMin, casasMax));
  const max = Math.max(min, casasMax);

  return parsed.toLocaleString('pt-BR', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

/**
 * Sanitiza texto durante digitação mantendo apenas dígitos, ponto, vírgula e sinal negativo.
 */
export function sanitizarInputNumeroBR(valor: string): string {
  return valor.replace(/[^\d.,-]/g, '');
}

export interface ResultadoContratoPesoValor {
  pesoLiquidoContainersKg: number;
  temContainersPreenchidos: boolean;
  pesoFinalKg: number;
  pesoFinalTon: number;
  precoUnitarioUsd: number;
  valorTotalUsd: number;
}

/**
 * Função padronizada para apuração de peso e valor total a receber em USD:
 * - Soma o peso líquido dos contêineres (kg)
 * - Se os contêineres ainda estiverem zerados, mantém fallback para volumeKg contratado
 * - Valor em USD = (pesoConsideradoKg / 1000) * precoUnitarioUsd (USD/ton métrico sobre peso líquido)
 */
export function calcularPesoEValorContratoUsd(params: {
  containers?: Array<{ pesoLiquido?: any }> | null;
  volumeKgContratado?: any;
  precoUsdFinanceiro?: any;
  valorDeclaradoUsd?: any;
}): ResultadoContratoPesoValor {
  const containers = Array.isArray(params.containers) ? params.containers : [];
  const pesoLiquidoContainersKg = containers.reduce(
    (acc, c) => acc + safeNumber(c?.pesoLiquido, 0),
    0
  );

  const temContainersPreenchidos = pesoLiquidoContainersKg > 0;
  const pesoFinalKg = temContainersPreenchidos
    ? pesoLiquidoContainersKg
    : safeNumber(params.volumeKgContratado, 0);
  const pesoFinalTon = pesoFinalKg / 1000;

  const hasPrecoFinanceiro =
    params.precoUsdFinanceiro !== null && params.precoUsdFinanceiro !== undefined;
  const precoUnitarioUsd = hasPrecoFinanceiro
    ? safeNumber(params.precoUsdFinanceiro, 0)
    : safeNumber(params.valorDeclaradoUsd, 0);

  const valorTotalUsd = pesoFinalTon * precoUnitarioUsd;

  return {
    pesoLiquidoContainersKg,
    temContainersPreenchidos,
    pesoFinalKg,
    pesoFinalTon,
    precoUnitarioUsd,
    valorTotalUsd,
  };
}
