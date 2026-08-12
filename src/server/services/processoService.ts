import { prisma } from '@/lib/prisma';
import { generateNumeroProcesso } from '@/lib/workflow';
import { CategoriaCusto } from '@prisma/client';

/**
 * Cria um novo processo E já instancia TODAS as etapas do template
 * (EtapaTemplate) como ProcessoEtapa pendentes. É isso que faz o checklist
 * e o dashboard nascerem "vivos" desde o dia 1, em vez de listas fixas
 * copiadas no HTML de cada view.
 */
export async function criarProcesso(input: {
  clienteFinal: string;
  traderIntermedio?: string;
  produto: string;
  volumeKg: number;
  incoterm: string;
  portoDestino: string;
  redex?: string;
  valorDeclaradoUsd?: number;
  localEstufagem?: string;
  containerQtd?: number;
  containerTipo?: string;
  embalagemTipo?: string;
  sacasPorContainer?: number;
  fumigacaoNecessaria?: boolean;
  fumigacaoTipo?: string;
  fumigacaoTempoHoras?: number;
  armador?: string;

  estufagemInicio?: Date;
  estufagemFim?: Date;
  mapaNaSequencia?: boolean;
  ncm?: string;
  criadoPorId: string;
}) {
  const totalHoje = await prisma.processo.count({
    where: {
      criadoEm: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  const numeroProcesso = generateNumeroProcesso(totalHoje + 1);
  const templates = await prisma.etapaTemplate.findMany({ orderBy: { ordem: 'asc' } });

  return prisma.$transaction(async (tx) => {
    const processo = await tx.processo.create({
      data: {
        numeroProcesso,
        clienteFinal: input.clienteFinal,
        traderIntermedio: input.traderIntermedio,
        produto: input.produto,
        volumeKg: input.volumeKg,
        incoterm: input.incoterm,
        portoDestino: input.portoDestino,
        redex: input.redex,
        valorDeclaradoUsd: input.valorDeclaradoUsd,
        localEstufagem: input.localEstufagem,
        containerQtd: input.containerQtd,
        containerTipo: input.containerTipo,
        embalagemTipo: input.embalagemTipo,
        sacasPorContainer: input.sacasPorContainer,
        fumigacaoNecessaria: input.fumigacaoNecessaria,
        fumigacaoTipo: input.fumigacaoTipo,
        fumigacaoTempoHoras: input.fumigacaoTempoHoras,
        armador: input.armador,

        estufagemInicio: input.estufagemInicio,
        estufagemFim: input.estufagemFim,
        mapaNaSequencia: input.mapaNaSequencia,
        ncm: input.ncm,
        criadoPorId: input.criadoPorId,
        statusCache: 'Criado',
        etapas: {
          create: templates.map((t) => ({
            etapaTemplateId: t.id,
            status: 'PENDENTE' as const,
          })),
        },
        financeiro: {
          create: {
            precoUsd: input.valorDeclaradoUsd ?? 0,
            ptax: 0,
            // inicializa as 8 categorias de custo zeradas, como no protótipo,
            // pra a aba Financeiro já nascer completa em vez de vazia.
            custos: {
              create: Object.values(CategoriaCusto).map((categoria) => ({
                categoria,
                valor: 0,
                atualizadoPorId: input.criadoPorId,
              })),
            },
          },
        },
      },
      include: { etapas: true },
    });

    await tx.auditLog.create({
      data: {
        processoId: processo.id,
        usuarioId: input.criadoPorId,
        acao: 'PROCESSO_CRIADO',
        detalhe: `Processo ${numeroProcesso} criado com ${templates.length} etapas do workflow padrão.`,
      },
    });

    return processo;
  });
}
