const CATEGORIA_CODIGO: Record<string, string> = {
  COMERCIAL: '01_Comercial',
  ADMINISTRATIVO: '02_Administrativo',
  PRODUCAO_INDUSTRIA: '03_Producao_Industria',
  BOOKING_TRANSPORTE: '04_Booking_Transporte',
  REDEX_CARREGAMENTO: '05_Redex_Carregamento',
  DOCUMENTACAO_EXPORTACAO: '06_Documentacao_Exportacao',
  FECHAMENTO_BANCARIO: '07_Fechamento_Bancario',
};

export function buildManualUploadPath(params: {
  numeroProcesso: string;
  categoria: string;
  tipoDocumentoNome: string;
  dataUpload: Date;
  nomeArquivoOriginal: string;
}): string {
  const { numeroProcesso, categoria, tipoDocumentoNome, dataUpload, nomeArquivoOriginal } = params;
  const categoriaCodigo = CATEGORIA_CODIGO[categoria] ?? '00_Outros';
  const dataStr =
    dataUpload.getFullYear().toString() +
    (dataUpload.getMonth() + 1).toString().padStart(2, '0') +
    dataUpload.getDate().toString().padStart(2, '0');
  const extensao = nomeArquivoOriginal.includes('.') ? nomeArquivoOriginal.split('.').pop() : 'bin';
  const nomeArquivo = `${numeroProcesso}_${tipoDocumentoNome.replace(/\s+/g, '')}_${dataStr}.${extensao}`;
  return `processos/${numeroProcesso}/${categoriaCodigo}/${nomeArquivo}`;
}