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

export const formatDateBR = (date: Date | string | null) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getUTCDate().toString().padStart(2, '0');
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTimeBR = (date: Date | string | null) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${new Intl.DateTimeFormat('pt-BR').format(d)} às ${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};
