export type TipoCertificado = 'CNPJ' | 'CPF';
export type FinalidadeCertificado = 'SEFAZ' | 'SISCOMEX' | 'AMBOS';

export const FINALIDADES_CERTIFICADO: Array<{
  id: FinalidadeCertificado;
  label: string;
  descricao: string;
}> = [
  {
    id: 'SEFAZ',
    label: 'SEFAZ',
    descricao: 'Consultas de NF-e, manifestação e eventos na SEFAZ',
  },
  {
    id: 'SISCOMEX',
    label: 'Siscomex',
    descricao: 'Operações no Portal Único Siscomex / DUE',
  },
  {
    id: 'AMBOS',
    label: 'Ambos (SEFAZ e Siscomex)',
    descricao: 'Uso compartilhado nas integrações SEFAZ e Siscomex',
  },
];

export const MAX_CERT_UPLOAD_BYTES = 1024 * 1024; // 1 MB

export function normalizarDocumentoCertificado(doc?: string | null): string {
  if (!doc) return '';
  return String(doc).replace(/\D/g, '');
}

export function formatarDocumentoCertificado(
  doc?: string | null,
  tipo?: string | null
): string {
  const digits = normalizarDocumentoCertificado(doc);
  if (digits.length === 14 || (tipo === 'CNPJ' && digits.length === 14)) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }
  if (digits.length === 11 || (tipo === 'CPF' && digits.length === 11)) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  return doc ? String(doc) : '—';
}

function obterDataBrasilISO(data: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(data);

  const year = partes.find((p) => p.type === 'year')?.value ?? '1970';
  const month = partes.find((p) => p.type === 'month')?.value ?? '01';
  const day = partes.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function calcularDiasParaVencimento(
  validadeFim: Date | string,
  agora: Date = new Date()
): number {
  const fimDate = validadeFim instanceof Date ? validadeFim : new Date(validadeFim);
  if (Number.isNaN(fimDate.getTime())) return 0;

  if (fimDate.getTime() <= agora.getTime()) {
    const hojeIso = obterDataBrasilISO(agora);
    const fimIso = obterDataBrasilISO(fimDate);
    const [ay, am, ad] = hojeIso.split('-').map(Number);
    const [fy, fm, fd] = fimIso.split('-').map(Number);
    const diff = Math.round(
      (Date.UTC(fy, fm - 1, fd) - Date.UTC(ay, am - 1, ad)) / 86_400_000
    );
    return diff >= 0 ? -1 : diff;
  }

  const hojeIso = obterDataBrasilISO(agora);
  const fimIso = obterDataBrasilISO(fimDate);
  const [ay, am, ad] = hojeIso.split('-').map(Number);
  const [fy, fm, fd] = fimIso.split('-').map(Number);
  const diff = Math.round(
    (Date.UTC(fy, fm - 1, fd) - Date.UTC(ay, am - 1, ad)) / 86_400_000
  );
  return Math.max(0, diff);
}

export interface StatusValidadeCertificado {
  diasRestantes: number;
  vencido: boolean;
  alertaAmarelo: boolean;
  rotulo: string;
}

export function classificarValidadeCertificado(
  validadeFim: Date | string,
  agora: Date = new Date()
): StatusValidadeCertificado {
  const fimDate = validadeFim instanceof Date ? validadeFim : new Date(validadeFim);
  const diasRestantes = calcularDiasParaVencimento(fimDate, agora);
  const vencido = fimDate.getTime() <= agora.getTime() || diasRestantes < 0;

  if (vencido) {
    const diasAtraso = Math.abs(diasRestantes);
    return {
      diasRestantes,
      vencido: true,
      alertaAmarelo: false,
      rotulo:
        diasAtraso <= 1
          ? 'Vencido'
          : `Vencido há ${diasAtraso} dias`,
    };
  }

  if (diasRestantes === 0) {
    return {
      diasRestantes: 0,
      vencido: false,
      alertaAmarelo: true,
      rotulo: 'Vence hoje',
    };
  }

  if (diasRestantes <= 30) {
    return {
      diasRestantes,
      vencido: false,
      alertaAmarelo: true,
      rotulo:
        diasRestantes === 1
          ? 'Vence em 1 dia'
          : `Vence em ${diasRestantes} dias`,
    };
  }

  return {
    diasRestantes,
    vencido: false,
    alertaAmarelo: false,
    rotulo: `Vence em ${diasRestantes} dias`,
  };
}

export function formatarFinalidadeCertificado(finalidade?: string | null): string {
  if (finalidade === 'SEFAZ') return 'SEFAZ';
  if (finalidade === 'SISCOMEX') return 'Siscomex';
  if (finalidade === 'AMBOS') return 'SEFAZ + Siscomex';
  return finalidade || '—';
}
