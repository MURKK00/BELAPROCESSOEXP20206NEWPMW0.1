import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { TimelineEtapasManager, type EtapaItem, type ProcessoResumo } from '@/components/negociacoes/TimelineEtapasManager';
import { calcularPesoEValorContratoUsd } from '@/lib/numeroBR';
import { getSessionUser } from '@/lib/auth';
import { isAdmin, isDiretoria } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      containers: true,
      financeiro: {
        include: {
          travamentos: true,
        },
      },
      etapas: {
        include: { etapaTemplate: true },
        orderBy: { etapaTemplate: { ordem: 'asc' } },
      },
    },
  });

  if (!processo) notFound();

  // Mapeia as etapas para o formato leve do componente
  const etapasSimplificadas: EtapaItem[] = processo.etapas.map((e) => ({
    id: e.id,
    status: e.status,
    fase: e.etapaTemplate?.fase || 'COMERCIAL',
    etapa: e.etapaTemplate?.etapa || 'Etapa Operacional',
  }));

  // Métricas do processo para alimentar o painel dos marcos
  const containers = processo.containers || [];
  const containersPreenchidosCount = containers.filter((c) => Boolean(c.numeroContainer?.trim())).length;
  const {
    pesoFinalKg: volumeKg,
    precoUnitarioUsd,
    valorTotalUsd,
  } = calcularPesoEValorContratoUsd({
    containers,
    volumeKgContratado: processo.volumeKg,
    precoUsdFinanceiro: processo.financeiro?.precoUsd,
    valorDeclaradoUsd: processo.valorDeclaradoUsd,
  });
  const precoUsd = precoUnitarioUsd > 0 ? precoUnitarioUsd : null;

  const travamentos = processo.financeiro?.travamentos || [];
  const totalUsdTravado = travamentos.reduce((acc, t) => acc + Number(t.valorUsdParcial), 0);

  const processoResumo: ProcessoResumo = {
    id: processo.id,
    numeroProcesso: processo.numeroProcesso,
    clienteFinal: processo.clienteFinal,
    produto: processo.produto,
    incoterm: processo.incoterm,
    portoOrigem: processo.portoOrigem,
    portoDestino: processo.portoDestino,
    status: processo.status,
    volumeKg: volumeKg,
    bookingNumero: processo.bookingNumero,
    navio: processo.navio,
    armador: processo.armador,
    localEstufagem: processo.localEstufagem,
    containerQtd: processo.containerQtd,
    fumigacaoNecessaria: processo.fumigacaoNecessaria,
    fumigacaoTipo: processo.fumigacaoTipo,
    fumigacaoTempoHoras: processo.fumigacaoTempoHoras,
    deadlineEmbarque: processo.deadlineEmbarque,
    deadlineDraftBl: processo.deadlineDraftBl,
    deadlineDraftVgm: processo.deadlineDraftVgm,
    deadlineCarga: processo.deadlineCarga,
    precoUsd,
    bancoDestino: processo.financeiro?.bancoDestino || 'BB BRASIL',
    containersCount: containers.length,
    containersPreenchidosCount,
    totalUsdTravado,
    valorTotalUsd,
  };

  const user = await getSessionUser();
  const podeGerarChecklist = Boolean(user && (isAdmin(user) || isDiretoria(user)));

  return (
    <div className="py-2">
      <TimelineEtapasManager
        processo={processoResumo}
        etapas={etapasSimplificadas}
        podeGerarChecklist={podeGerarChecklist}
      />
    </div>
  );
}
