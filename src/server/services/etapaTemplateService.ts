import { CategoriaDocumento } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CHECKLIST_ETAPAS, TIPOS_DOCUMENTO_CHECKLIST } from '../../../prisma/checklistData';

/**
 * Executa o seed idempotente dos Tipos de Documento e EtapaTemplate oficiais
 * definidos em prisma/checklistData.ts sem sobrescrever registros já existentes.
 */
export async function seedEtapaTemplatesIdempotente() {
  const templatesAntes = await prisma.etapaTemplate.count();

  const tiposNecessarios = [
    ...TIPOS_DOCUMENTO_CHECKLIST,
    {
      nome: 'Contrato de Câmbio',
      categoria: 'FECHAMENTO_BANCARIO',
      obrigatorioNoPacoteFinal: false,
    },
  ];

  for (const tipo of tiposNecessarios) {
    await prisma.tipoDocumento.upsert({
      where: { nome: tipo.nome },
      update: {},
      create: {
        nome: tipo.nome,
        categoria: tipo.categoria as CategoriaDocumento,
        obrigatorioNoPacoteFinal: Boolean(tipo.obrigatorioNoPacoteFinal),
      },
    });
  }

  const tiposDoc = await prisma.tipoDocumento.findMany({
    select: { id: true, nome: true },
  });
  const tipoDocPorNome = Object.fromEntries(tiposDoc.map((t) => [t.nome, t.id]));

  for (const e of CHECKLIST_ETAPAS) {
    await prisma.etapaTemplate.upsert({
      where: { numero: e.numero },
      update: {},
      create: {
        numero: e.numero,
        ordem: e.ordem,
        fase: e.fase,
        etapa: e.etapa,
        raiaResponsavel: e.raiaResponsavel,
        geraDocumento: e.geraDocumento ?? false,
        tipoDocumentoId: e.tipoDocNome ? tipoDocPorNome[e.tipoDocNome] : undefined,
      },
    });
  }

  const templatesDepois = await prisma.etapaTemplate.count();

  return {
    templatesAntes,
    templatesDepois,
    templatesCriados: Math.max(0, templatesDepois - templatesAntes),
    totalPadrao: CHECKLIST_ETAPAS.length,
  };
}
