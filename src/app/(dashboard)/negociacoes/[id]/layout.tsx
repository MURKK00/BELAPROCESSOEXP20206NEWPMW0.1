import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { QuickActionsHeader } from '@/components/negociacoes/QuickActionsHeader';
import { ResumoTopoCard } from '@/components/negociacoes/ResumoTopoCard';
import { NegociacaoTabs } from '@/components/negociacoes/NegociacaoTabs';

export default async function DetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id: id },
    include: { etapas: true },
  });

  if (!processo) notFound();

  const totalEtapas = processo.etapas.length;
  const etapasConcluidas = processo.etapas.filter((e) => e.status === 'CONCLUIDA').length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* CABEÇALHO UNIFICADO DE AÇÕES RÁPIDAS E TIMELINE */}
      <QuickActionsHeader
        processo={{
          id: processo.id,
          numeroProcesso: processo.numeroProcesso,
          clienteFinal: processo.clienteFinal,
          produto: processo.produto,
          incoterm: processo.incoterm,
          portoOrigem: processo.portoOrigem,
          portoDestino: processo.portoDestino,
          status: processo.status,
          bookingNumero: processo.bookingNumero,
          navio: processo.navio,
          deadlineEmbarque: processo.deadlineEmbarque,
          deadlineDraftBl: processo.deadlineDraftBl,
          deadlineDraftVgm: processo.deadlineDraftVgm,
          deadlineCarga: processo.deadlineCarga,
          estufagemInicio: processo.estufagemInicio,
          estufagemFim: processo.estufagemFim,
        }}
        totalEtapas={totalEtapas}
        etapasConcluidas={etapasConcluidas}
      />

      {/* ABAS DO COCKPIT INTEGRADO */}
      <NegociacaoTabs processoId={processo.id} />

      {children}
    </div>
  );
}