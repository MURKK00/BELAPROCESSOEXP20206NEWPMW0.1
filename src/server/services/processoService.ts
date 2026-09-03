import { prisma } from '@/lib/prisma';
import { CategoriaCusto } from '@prisma/client';

/**
 * Cria um novo processo E já instancia TODAS as etapas do template
 * (EtapaTemplate) como ProcessoEtapa pendentes, além das linhas de
 * contêiner (uma por unidade informada em containerQtd).
 */
export async function criarProcesso(input: {
  clienteFinal: string;
  traderIntermedio?: string;
  produto: string;
  volumeKg: number;
  portoOrigem: string;
  portoDestino: string;
  freeTimeDestino?: string;
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
  necessitaEtiqueta?: boolean;

  estufagemInicio?: Date;
  estufagemFim?: Date;
  mapaNaSequencia?: boolean;
  ncm?: string;
  criadoPorId: string;
}) {
  // Pega o ano atual (ex: 2026) e o início do ano para contar os processos anuais
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);

  const baseCount = await prisma.processo.count({
    where: {
      criadoEm: {
        gte: startOfYear,
      },
    },
  });

  const templates = await prisma.etapaTemplate.findMany({ orderBy: { ordem: 'asc' } });

  let tentativas = 0;
  let offset = 1;
  const maxTentativas = 5;

  // LOOP DE SEGURANÇA: Previne erros caso duas pessoas criem processos na mesma fração de segundo
  while (tentativas < maxTentativas) {
    try {
      // Gera o ID no formato BC26-001, BC26-002...
      const yearSuffix = String(currentYear).slice(-2);
      const sequencia = String(baseCount + offset).padStart(3, '0');
      const numeroProcesso = `BC${yearSuffix}-${sequencia}`;

      return await prisma.$transaction(async (tx) => {
        const processo = await tx.processo.create({
          data: {
            numeroProcesso,
            clienteFinal: input.clienteFinal,
            traderIntermedio: input.traderIntermedio,
            produto: input.produto,
            volumeKg: input.volumeKg,
            portoOrigem: input.portoOrigem,
            portoDestino: input.portoDestino,
            freeTimeDestino: input.freeTimeDestino,
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
            necessitaEtiqueta: input.necessitaEtiqueta,

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
            containers: input.containerQtd
              ? {
                  create: Array.from({ length: input.containerQtd }, (_, i) => ({
                    ordem: i + 1,
                  })),
                }
              : undefined,
            financeiro: {
              create: {
                precoUsd: input.valorDeclaradoUsd ?? 0,
                ptax: 0,
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
      
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('numeroProcesso')) {
        tentativas++;
        offset++;
      } else {
        throw error;
      }
    }
  }

  throw new Error('Falha ao gerar um número de processo único após várias tentativas.');
}