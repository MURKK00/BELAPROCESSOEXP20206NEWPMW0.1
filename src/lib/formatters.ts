import type { Decimal } from '@prisma/client/runtime/library';

// Portado do rascunho HTML — mesma UX de formatação, agora aceitando Decimal do Prisma
// (nunca `number` puro para dinheiro, pra não repetir o problema de arredondamento).

function toNumber(val: number | Decimal): number {
  return typeof val === 'number' ? val : Number(val);
}

export const formatBRL = (val: number | Decimal) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNumber(val));

export const formatUSD = (val: number | Decimal) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(toNumber(val));

export const formatNum = (val: number | Decimal, dec = 2) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(toNumber(val));

export const formatInt = (val: number | Decimal) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(toNumber(val));

export const formatDateBR = (date: Date | string | null | undefined) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getUTCDate().toString().padStart(2, '0');
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTimeBR = (date: Date | string | null | undefined) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${new Intl.DateTimeFormat('pt-BR').format(d)} às ${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

/**
 * Converte qualquer formato numérico (seja do Excel "595.478,07", "R$ 595.478,07", "595478,07" ou "595478.07")
 * para um float numérico JavaScript puro e confiável.
 */
export function parseBRLToNumber(raw: any): number {
  if (raw === undefined || raw === null) return 0;
  if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;
  const str = String(raw).trim();
  if (!str) return 0;

  // Remove caracteres que não sejam dígitos, separadores decimais/milhar ou sinal negativo
  let limpo = str.replace(/[^\d.,-]/g, '');
  if (!limpo) return 0;

  // Se contém ponto e vírgula (ex: 595.478,07) -> ponto é milhar, vírgula é decimal
  if (limpo.includes('.') && limpo.includes(',')) {
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else if (limpo.includes(',')) {
    // Se só contém vírgula (ex: 595478,07) -> vírgula é decimal
    limpo = limpo.replace(',', '.');
  } else if ((limpo.match(/\./g) || []).length > 1) {
    // Mais de um ponto (ex: 595.478.000) -> pontos de milhar
    limpo = limpo.replace(/\./g, '');
  }

  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

/**
 * Formata um número puro para exibição em inputs BRL padrão (ex: "595.478,07")
 */
export function formatBRLInputString(val: number | string | null | undefined): string {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'number' ? val : parseBRLToNumber(val);
  if (isNaN(num) || num === 0) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formata a taxa PTAX com suporte a até 7 casas decimais exatas (ex: "5,1500727").
 * Mantém no mínimo 4 casas decimais e preserva todas as casas de precisão bancária (até 7 casas).
 */
export function formatPTAX(val: number | Decimal | string | null | undefined): string {
  if (val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num) || num === 0) return '-';

  // Suporte a até 7 casas decimais sem truncar precisão bancária
  const str = num.toFixed(7);
  const trimmed = str.replace(/(\.\d{4,}?)0+$/, '$1');
  return trimmed.replace('.', ',');
}

// NOVO: Mapa centralizado de status do sistema
export const STATUS_NEGOCIACAO_MAP: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_NEGOCIACAO: 'Em negociação',
  EM_EXECUCAO: 'Em execução',
  EMBARCADO: 'Embarcado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};