// LOCAL FINAL DESTE ARQUIVO: prisma/checklistData.ts (arquivo NOVO)
//
// Fonte única do novo checklist. Tanto o seed.ts (usado em bancos novos)
// quanto o scripts/reset-checklist.ts (usado para atualizar o banco atual)
// importam esta lista, para nunca ficarem dessincronizados.

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

// Tipos de documento que o checklist abaixo referencia (aba "Documentos Emitidos").
// O reset-checklist.ts garante que esses registros existam antes de criar as etapas.
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
  // Booking / Transporte Internacional
  { numero: '1', ordem: 1, fase: Fase.BOOKING_TRANSPORTE, etapa: 'Emissão do Booking', raiaResponsavel: 'Administrativo' },

  // Administrativo
  { numero: '2', ordem: 2, fase: Fase.ADMINISTRATIVO, etapa: 'E-mail nomeação', raiaResponsavel: 'Administrativo' },
  { numero: '3', ordem: 3, fase: Fase.ADMINISTRATIVO, etapa: 'Emissão Notas Fiscais #1 — Formação lote p/ exportação', raiaResponsavel: 'Administrativo' },
  { numero: '4', ordem: 4, fase: Fase.ADMINISTRATIVO, etapa: 'Emissão Notas Fiscais #2 — Retorno lote p/ exportação', raiaResponsavel: 'Administrativo' },
  { numero: '5', ordem: 5, fase: Fase.ADMINISTRATIVO, etapa: 'Emissão Notas Fiscais #3 — Exportação (DU-E)', raiaResponsavel: 'Administrativo' },
  { numero: '6', ordem: 6, fase: Fase.ADMINISTRATIVO, etapa: 'Aprovação Draft [CLIENTE]', raiaResponsavel: 'Administrativo' },

  // Carregamento e REDEX
  { numero: '7', ordem: 7, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Contratar Transportadora', raiaResponsavel: 'REDEX' },
  { numero: '8', ordem: 8, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Estufagem + Etiquetagem', raiaResponsavel: 'REDEX' },
  { numero: '9', ordem: 9, fase: Fase.CARREGAMENTO_REDEX, etapa: 'Vistoria MAPA (Fitossanitário)', raiaResponsavel: 'REDEX' },

  // Documentos Emitidos
  { numero: '10', ordem: 10, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'DU-E', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'DU-E' },
  { numero: '11', ordem: 11, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'BL Original', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'BL Original' },
  { numero: '12', ordem: 12, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Comercial Invoice', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Comercial Invoice' },
  { numero: '13', ordem: 13, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Packing List', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Packing List' },
  { numero: '14', ordem: 14, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'CO (Certificate of Origin)', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Certificate of Origin' },
  { numero: '15', ordem: 15, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Weight Certificate', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Weight Certificate' },
  { numero: '16', ordem: 16, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Quality Certificate', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Quality Certificate' },
  { numero: '17', ordem: 17, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Stuffing Report', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Stuffing Report' },
  { numero: '18', ordem: 18, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Fumigation Certificate', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Fumigation Certificate' },
  { numero: '19', ordem: 19, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Phytosanitary Certificate (MAPA)', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Phytosanitary Certificate (MAPA)' },
  { numero: '20', ordem: 20, fase: Fase.DOCUMENTACAO_EXPORTACAO, etapa: 'Certificate Non-GMO', raiaResponsavel: 'Administrativo', geraDocumento: true, tipoDocNome: 'Certificate Non-GMO' },

  // Fechamento Bancário/Documental
  { numero: '21', ordem: 21, fase: Fase.FECHAMENTO_BANCARIO, etapa: 'Fechamento de Câmbio', raiaResponsavel: 'Administrativo' },
];
