import { Fase } from '@prisma/client';

export type ChecklistEtapaSeed = {
  numero: string;
  ordem: number;
  fase: Fase;
  etapa: string;
  raiaResponsavel: string;
  geraDocumento?: boolean;
  tipoDocNome?: string;
};

// Tipos de documento que o checklist referencia (aba "Documentos Emitidos")
export const TIPOS_DOCUMENTO_CHECKLIST: Array<{ nome: string; categoria: string; obrigatorioNoPacoteFinal?: boolean }> = [
  { nome: 'DU-E', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true },
  { nome: 'BL Original', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true },
  { nome: 'Comercial Invoice', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true },
  { nome: 'Packing List', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true },
  { nome: 'Certificate of Origin', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true },
  { nome: 'Weight Certificate', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true },
  { nome: 'Quality Certificate', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true },
  { nome: 'Stuffing Report', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true },
  { nome: 'Fumigation Certificate', categoria: 'REDEX_CARREGAMENTO', obrigatorioNoPacoteFinal: true },
  { nome: 'Phytosanitary Certificate (MAPA)', categoria: 'REDEX_CARREGAMENTO', obrigatorioNoPacoteFinal: true },
  { nome: 'Certificate Non-GMO', categoria: 'DOCUMENTACAO_EXPORTACAO', obrigatorioNoPacoteFinal: true },
];

export const CHECKLIST_ETAPAS: ChecklistEtapaSeed[] = [
  // ==========================================
  // ETAPA 1: NEGOCIAÇÃO
  // ==========================================
  { numero: '1', ordem: 1, fase: Fase.COMERCIAL, etapa: 'Preencher campo Importador', raiaResponsavel: 'Comercial' },
  { numero: '2', ordem: 2, fase: Fase.COMERCIAL, etapa: 'Preencher campo Rastreabilidade', raiaResponsavel: 'Comercial' },
  { numero: '3', ordem: 3, fase: Fase.COMERCIAL, etapa: 'E-mail Nomeação', raiaResponsavel: 'Comercial' },
  { numero: '4', ordem: 4, fase: Fase.COMERCIAL, etapa: 'Emissão Booking****', raiaResponsavel: 'Administrativo' },

  // ==========================================
  // ETAPA 2: ESTUFAGEM (Antigo etapa 2 descontinuado)
  // ==========================================
  { numero: '5', ordem: 5, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Contratação Transportadora', raiaResponsavel: 'Logística / Operacional' },
  { numero: '6', ordem: 6, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Emissão Notas Fiscais #1 - Formação Lote p/ exportação*', raiaResponsavel: 'Administrativo' },
  { numero: '7', ordem: 7, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Estufagem REDEX', raiaResponsavel: 'REDEX' },
  { numero: '8', ordem: 8, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Etiquetagem (Se marcado na negociação que tem etiquetagem)', raiaResponsavel: 'REDEX' },
  { numero: '9', ordem: 9, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Fumigação', raiaResponsavel: 'REDEX' },
  { numero: '10', ordem: 10, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Preencher Contêineres**', raiaResponsavel: 'Logística / Operacional' },
  { numero: '11', ordem: 11, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Vistoria MAPA', raiaResponsavel: 'REDEX' },
  { numero: '12', ordem: 12, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Envio Drafts', raiaResponsavel: 'Administrativo' },
  { numero: '13', ordem: 13, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Aprovação Drafts [Cliente]', raiaResponsavel: 'Comercial' },

  // ==========================================
  // ETAPA 4: EMBARQUE
  // ==========================================
  { numero: '14', ordem: 14, fase: Fase.TERMINAL_PORTO, etapa: 'Emissão Notas Fiscais #2 - Retorno lote p/ exportação*', raiaResponsavel: 'Administrativo' },
  { numero: '15', ordem: 15, fase: Fase.TERMINAL_PORTO, etapa: 'Emissão Notas Fiscais #3 - Exportação (DU-E)*', raiaResponsavel: 'Administrativo' },

  // ==========================================
  // ETAPA 5: DOCUMENTAÇÃO APROVADAS (12 existentes)
  // ==========================================
  { numero: '16', ordem: 16, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'DU-E***', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'DU-E' },
  { numero: '17', ordem: 17, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'BL Original***', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'BL Original' },
  { numero: '18', ordem: 18, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Comercial Invoice***', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Comercial Invoice' },
  { numero: '19', ordem: 19, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Packing List***', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Packing List' },
  { numero: '20', ordem: 20, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Certificate of Origin (CO)***', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Certificate of Origin' },
  { numero: '21', ordem: 21, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Weight Certificate***', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Weight Certificate' },
  { numero: '22', ordem: 22, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Quality Certificate***', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Quality Certificate' },
  { numero: '23', ordem: 23, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Stuffing Report***', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Stuffing Report' },
  { numero: '24', ordem: 24, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Fumigation Certificate***', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Fumigation Certificate' },
  { numero: '25', ordem: 25, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Phytosanitary Certificate (MAPA)***', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Phytosanitary Certificate (MAPA)' },
  { numero: '26', ordem: 26, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Certificate Non-GMO***', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Certificate Non-GMO' },
  { numero: '27', ordem: 27, fase: Fase.FECHAMENTO_BANCARIO, etapa: 'Fechamento de Câmbio***', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Contrato de Câmbio' },
];
