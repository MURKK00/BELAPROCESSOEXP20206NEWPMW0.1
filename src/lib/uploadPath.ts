const CATEGORIA_CODIGO: Record<string, string> = {
  COMERCIAL: '01_Comercial',
  ADMINISTRATIVO: '02_Administrativo',
  PRODUCAO_INDUSTRIA: '03_Producao_Industria',
  BOOKING_TRANSPORTE: '04_Booking_Transporte',
  REDEX_CARREGAMENTO: '05_Redex_Carregamento',
  DOCUMENTACAO_EXPORTACAO: '06_Documentacao_Exportacao',
  FECHAMENTO_BANCARIO: '07_Fechamento_Bancario',
};

/**
 * Remove acentos, caracteres especiais, diacríticos e espaços.
 * Garante que a chave seja 100% válida e aceita por Supabase Storage, S3 e GCS.
 */
export function sanitizeStorageSegment(str: string): string {
  return str
    .normalize('NFD') // decompõe acentos (ex: ô -> o + ^)
    .replace(/[\u0300-\u036f]/g, '') // remove os acentos
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_') // substitui qualquer caractere não-ASCII por underline
    .replace(/_+/g, '_') // agrupa múltiplos underlines
    .replace(/^_+|_+$/g, ''); // remove underlines das pontas
}

export function buildManualUploadPath(params: {
  numeroProcesso: string;
  categoria: string;
  tipoDocumentoNome: string;
  dataUpload: Date;
  nomeArquivoOriginal: string;
}): string {
  const { numeroProcesso, categoria, tipoDocumentoNome, dataUpload, nomeArquivoOriginal } = params;
  
  const safeProcesso = sanitizeStorageSegment(numeroProcesso) || 'PROCESSO';
  const categoriaCodigo = CATEGORIA_CODIGO[categoria] ?? '00_Outros';
  
  // Normaliza o nome do tipo de documento sem espaços e sem acentos (ex: "Borderô Bancário" -> "BorderoBancario")
  const nomeTipoSemEspacos = tipoDocumentoNome.replace(/\s+/g, '');
  const safeTipoDoc = sanitizeStorageSegment(nomeTipoSemEspacos) || 'Documento';

  const dataStr =
    dataUpload.getFullYear().toString() +
    (dataUpload.getMonth() + 1).toString().padStart(2, '0') +
    dataUpload.getDate().toString().padStart(2, '0');

  // Extrai e sanitiza a extensão com segurança
  const lastDotIndex = nomeArquivoOriginal.lastIndexOf('.');
  const rawExt = lastDotIndex !== -1 ? nomeArquivoOriginal.substring(lastDotIndex + 1) : 'bin';
  const safeExt = sanitizeStorageSegment(rawExt).toLowerCase() || 'bin';

  // Sufixo aleatório para evitar sobrescrita acidental
  const randomSuffix = Math.random().toString(36).substring(2, 6);

  const nomeArquivo = `${safeProcesso}_${safeTipoDoc}_${dataStr}_${randomSuffix}.${safeExt}`;
  return `processos/${safeProcesso}/${categoriaCodigo}/${nomeArquivo}`;
}
