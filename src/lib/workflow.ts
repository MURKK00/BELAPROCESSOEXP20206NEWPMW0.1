import type { ProcessoEtapa, StatusEtapa } from '@prisma/client';

/**
 * No rascunho HTML, o "status" de uma negociação era um <select> escolhido
 * manualmente. Isso divergia da realidade toda vez que alguém esquecia de
 * atualizar. Aqui o status é sempre CALCULADO a partir do estado real das
 * etapas do processo (ProcessoEtapa) — a fonte de verdade é o checklist,
 * não um campo solto.
 */

export type StatusProcessoDerivado =
  | 'Criado'
  | 'Docs Pendentes'
  | 'Embarcando'
  | 'Concluído';

export function deriveStatusProcesso(etapas: Pick<ProcessoEtapa, 'status'>[]): StatusProcessoDerivado {
  if (etapas.length === 0) return 'Criado';

  const total = etapas.length;
  const concluidas = etapas.filter((e) => e.status === 'CONCLUIDA').length;
  const bloqueadas = etapas.some((e) => e.status === 'BLOQUEADA');

  if (concluidas === total) return 'Concluído';
  if (bloqueadas) return 'Docs Pendentes';
  if (concluidas > total * 0.6) return 'Embarcando';
  if (concluidas === 0) return 'Criado';
  return 'Docs Pendentes';
}

export function getDaysLeft(deadline: Date | string | null): number | null {
  if (!deadline) return null;
  const target = new Date(deadline);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Gera o número de processo no mesmo padrão do rascunho: BC + AAAAMMDD + sequência. */
export function generateNumeroProcesso(sequenciaDoDia: number): string {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  return `BC${dateStr}${sequenciaDoDia.toString().padStart(4, '0')}`;
}

/** Caminho de armazenamento seguindo a convenção definida na aba "Estrutura GED". */
const FASE_CODIGO: Record<string, string> = {
  COMERCIAL: '01_Comercial',
  ADMINISTRATIVO: '02_Administrativo',
  PRODUTOR_VENDEDOR: '02_Administrativo',
  INDUSTRIA_BENEFICIAMENTO: '03_Producao_Industria',
  BOOKING_TRANSPORTE: '04_Booking_Transporte',
  CARREGAMENTO: '05_Redex_Carregamento',
  CARREGAMENTO_REDEX: '05_Redex_Carregamento',
  DOCUMENTACAO_EXPORTACAO: '06_Documentacao_Exportacao',
  TERMINAL_PORTO: '06_Documentacao_Exportacao',
  FECHAMENTO_BANCARIO: '07_Fechamento_Bancario',
};

export function buildDocumentStoragePath(params: {
  numeroProcesso: string;
  fase: keyof typeof FASE_CODIGO;
  tipoDocumentoNome: string;
  dataEmissao: Date;
  extensao: string; // "pdf", "docx"...
}): string {
  const { numeroProcesso, fase, tipoDocumentoNome, dataEmissao, extensao } = params;
  const faseCodigo = FASE_CODIGO[fase] ?? '00_Outros';
  const dataStr =
    dataEmissao.getFullYear().toString() +
    (dataEmissao.getMonth() + 1).toString().padStart(2, '0') +
    dataEmissao.getDate().toString().padStart(2, '0');
  const nomeArquivo = `${numeroProcesso}_${tipoDocumentoNome.replace(/\s+/g, '')}_${dataStr}.${extensao}`;
  return `processos/${numeroProcesso}/${faseCodigo}/${nomeArquivo}`;
}
