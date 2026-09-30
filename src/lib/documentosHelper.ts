export type DocumentoGrupo = 'ORIGINAIS' | 'DRAFTS' | 'DIVERSOS';

export interface GrupoConfig {
  key: DocumentoGrupo;
  titulo: string;
  subtitulo: string;
  descricaoCurta: string;
  badgeCor: string;
  badgeBorda: string;
  badgeTexto: string;
  bgAtivo: string;
  iconeNome: string;
}

export const GRUPOS_CONFIG: Record<DocumentoGrupo, GrupoConfig> = {
  ORIGINAIS: {
    key: 'ORIGINAIS',
    titulo: 'Documentos Oficiais (Cliente)',
    subtitulo: 'Pacote de Exportação',
    descricaoCurta: 'Documentos finais e oficiais que efetivamente vão para o importador/cliente e banco.',
    badgeCor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    badgeBorda: 'border-emerald-200 dark:border-emerald-800',
    badgeTexto: 'Oficial / Cliente',
    bgAtivo: 'text-emerald-700 dark:text-emerald-300 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20',
    iconeNome: 'FileCheck2',
  },
  DRAFTS: {
    key: 'DRAFTS',
    titulo: 'Drafts & Minutas',
    subtitulo: 'Para Conferência e Aprovação',
    descricaoCurta: 'Rascunhos para validação prévia de dados com armador, despachante e aprovação do comprador.',
    badgeCor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    badgeBorda: 'border-amber-200 dark:border-amber-800',
    badgeTexto: 'Draft / Minuta',
    bgAtivo: 'text-amber-700 dark:text-amber-300 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
    iconeNome: 'FileEdit',
  },
  DIVERSOS: {
    key: 'DIVERSOS',
    titulo: 'Documentos Diversos (Apoio)',
    subtitulo: 'Operação & Apoio Interno',
    descricaoCurta: 'Documentos que auxiliam a operação e a negociação mas não vão diretamente para o cliente.',
    badgeCor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    badgeBorda: 'border-blue-200 dark:border-blue-800',
    badgeTexto: 'Diverso / Apoio',
    bgAtivo: 'text-blue-700 dark:text-blue-300 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
    iconeNome: 'Paperclip',
  },
};

export const STATUS_DOC_CONFIG: Record<string, { label: string; cor: string }> = {
  RASCUNHO: {
    label: 'Rascunho / Em Análise',
    cor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  },
  APROVADO: {
    label: 'Aprovado / Válido',
    cor: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  },
  ENVIADO_CLIENTE: {
    label: 'Enviado ao Cliente ✉️',
    cor: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
  },
  ARQUIVADO: {
    label: 'Arquivado',
    cor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  },
  REPROVADO: {
    label: 'Reprovado / Ajustar',
    cor: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700',
  },
};

/**
 * Lista dos 10 principais documentos que compõem o dossiê oficial
 * de exportação de feijão / grãos para o cliente internacional.
 */
export const DOCUMENTOS_PACOTE_EXPORTACAO = [
  { 
    id: 'bl', 
    nomeMatch: ['bl original', 'bill of lading', 'conhecimento de embarque', 'bl'], 
    label: 'BL Original (Bill of Lading)', 
    descricao: 'Emitido pelo armador após o carregamento marítimo.',
    obrigatorio: true 
  },
  { 
    id: 'invoice', 
    nomeMatch: ['comercial invoice', 'commercial invoice', 'fatura comercial', 'invoice'], 
    label: 'Commercial Invoice (Fatura Comercial)', 
    descricao: 'Fatura final com valores, dados bancários, peso e incoterm.',
    obrigatorio: true 
  },
  { 
    id: 'packing', 
    nomeMatch: ['packing list', 'romaneio'], 
    label: 'Packing List (Romaneio de Carga)', 
    descricao: 'Detalhamento contêiner por contêiner com pesos bruto e líquido.',
    obrigatorio: true 
  },
  { 
    id: 'co', 
    nomeMatch: ['certificate of origin', 'certificado de origem', 'co'], 
    label: 'Certificate of Origin (Certificado de Origem)', 
    descricao: 'Emitido pela Câmara de Comércio / FIESP / entidade autorizada.',
    obrigatorio: true 
  },
  { 
    id: 'mapa', 
    nomeMatch: ['phytosanitary certificate (mapa)', 'certificado fitossanitário', 'mapa', 'fito'], 
    label: 'Certificado Fitossanitário (MAPA)', 
    descricao: 'Certificado oficial emitido pelo Ministério da Agricultura do Brasil.',
    obrigatorio: true 
  },
  { 
    id: 'fumigacao', 
    nomeMatch: ['fumigation certificate', 'certificado de fumigação', 'expurgo'], 
    label: 'Certificado de Fumigação', 
    descricao: 'Comprovante do tratamento e período de dosagem no porto.',
    obrigatorio: true 
  },
  { 
    id: 'qualidade', 
    nomeMatch: ['quality certificate', 'certificado de qualidade', 'laudo de qualidade'], 
    label: 'Certificado de Qualidade (Laudo)', 
    descricao: 'Emissão pela empresa de vistoria/classificação (ex: SURVEY/Port Inspect).',
    obrigatorio: true 
  },
  { 
    id: 'peso', 
    nomeMatch: ['weight certificate', 'certificado de peso'], 
    label: 'Certificado de Peso (Weight Certificate)', 
    descricao: 'Conferência de balança e tara dos contêineres.',
    obrigatorio: true 
  },
  { 
    id: 'due', 
    nomeMatch: ['du-e', 'due', 'declaração única de exportação'], 
    label: 'DU-E (Declaração Única de Exportação)', 
    descricao: 'Registro Siscomex averbado pela Receita Federal.',
    obrigatorio: true 
  },
  { 
    id: 'nongmo', 
    nomeMatch: ['certificate non-gmo', 'non-gmo', 'não transgênico'], 
    label: 'Certificado Non-GMO', 
    descricao: 'Declaração e análise laboratorial de grão não transgênico.',
    obrigatorio: false 
  },
];

/**
 * Analisa um documento e extrai seu grupo oficial, além de limpar
 * a tag interna da observação do usuário.
 */
export function parseDocumentoGrupo(doc: {
  descricaoOutro?: string | null;
  status?: string | null;
  nomeArquivo?: string | null;
  tipoDocumento?: {
    nome: string;
    categoria: string;
    obrigatorioNoPacoteFinal?: boolean;
  };
}): { grupo: DocumentoGrupo; observacaoLimpa: string | null } {
  const desc = doc.descricaoOutro || '';

  // 1. Tag explícita colocada no início da descrição: [GRUPO:DRAFTS], etc.
  const tagMatch = desc.match(/^\[GRUPO:(DRAFTS|ORIGINAIS|DIVERSOS)\]\s*(.*)$/i);
  if (tagMatch) {
    return {
      grupo: tagMatch[1].toUpperCase() as DocumentoGrupo,
      observacaoLimpa: tagMatch[2]?.trim() || null,
    };
  }

  // 2. Classificação inteligente automática para documentos existentes ou sem tag
  const nomeLower = (doc.nomeArquivo || '').toLowerCase();
  const tipoNomeLower = (doc.tipoDocumento?.nome || '').toLowerCase();

  // Rascunho / Draft explícito no status ou nome
  if (
    doc.status === 'RASCUNHO' ||
    nomeLower.includes('draft') ||
    nomeLower.includes('minuta') ||
    tipoNomeLower.includes('draft') ||
    tipoNomeLower.includes('minuta')
  ) {
    return { grupo: 'DRAFTS', observacaoLimpa: desc.trim() || null };
  }

  // Se o tipo for obrigatório no pacote final ou categoria de documentação de exportação
  if (
    doc.tipoDocumento?.obrigatorioNoPacoteFinal === true ||
    doc.tipoDocumento?.categoria === 'DOCUMENTACAO_EXPORTACAO'
  ) {
    return { grupo: 'ORIGINAIS', observacaoLimpa: desc.trim() || null };
  }

  // Documentos de apoio interno e operacionais
  return { grupo: 'DIVERSOS', observacaoLimpa: desc.trim() || null };
}

/**
 * Formata o texto final para ser gravado em `descricaoOutro`,
 * preservando a anotação do usuário com a tag do grupo.
 */
export function formatDescricaoWithGrupo(
  grupo: DocumentoGrupo,
  observacao?: string | null
): string {
  const clean = (observacao || '').replace(/^\[GRUPO:(DRAFTS|ORIGINAIS|DIVERSOS)\]\s*/i, '').trim();
  if (!clean) {
    return `[GRUPO:${grupo}]`;
  }
  return `[GRUPO:${grupo}] ${clean}`;
}
