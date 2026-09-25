import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { QuickActionsHeader } from '@/components/negociacoes/QuickActionsHeader';
import { NegociacaoTabs } from '@/components/negociacoes/NegociacaoTabs';
import { FloatingChatDrawer } from '@/components/negociacoes/FloatingChatDrawer';

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
    include: { 
      etapas: true,
      mensagens: {
        include: {
          autor: {
            select: {
              id: true,
              nome: true,
              email: true,
              papel: true,
            },
          },
        },
        orderBy: { criadoEm: 'asc' },
      },
    },
  });

  if (!processo) notFound();

  const user = await getSessionUser();
  const totalEtapas = processo.etapas.length;
  const etapasConcluidas = processo.etapas.filter((e) => e.status === 'CONCLUIDA').length;

  const mensagensFormatadas = processo.mensagens.map((m) => ({
    id: m.id,
    texto: m.texto,
    criadoEm: m.criadoEm.toISOString(),
    autorId: m.autorId,
    autor: {
      id: m.autor.id,
      nome: m.autor.nome,
      email: m.autor.email,
      papel: m.autor.papel,
    },
  }));

  return (
    <div className="max-w-7xl mx-auto relative pb-16">
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

      {/* CONTEÚDO DA ABA ATUAL */}
      {children}

      {/* GAVETA FLUTUANTE DE CHAT (DISPONÍVEL EM TODAS AS ABAS) */}
      <FloatingChatDrawer
        processoId={processo.id}
        numeroProcesso={processo.numeroProcesso}
        clienteFinal={processo.clienteFinal}
        mensagensIniciais={mensagensFormatadas}
        currentUserId={user?.id}
      />
    </div>
  );
}
