import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { Lock, AlertTriangle } from 'lucide-react';
import { verificarPendenciasCadastrais } from '@/lib/validacaoCadastrosProcesso';
import { 
  ProcessoTopHeader 
} from '@/components/negociacoes/QuickActionsHeader';
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

  const pendencias = verificarPendenciasCadastrais(processo);

  const processoDados = {
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
    pendencias,
  };

  return (
    <div className="max-w-7xl mx-auto relative pb-16">
      {/* 1. TOPO ABSOLUTO DA PÁGINA: ITENS MARCADOS (BREADCRUMB, PROCESSO, CLIENTE, STATUS DA OPERAÇÃO E AÇÕES) */}
      <ProcessoTopHeader processo={processoDados} />

      {/* BANNER DE TRAVAMENTO DE STATUS QUANDO HOUVER CADASTROS PENDENTES */}
      {pendencias.statusTravado && (
        <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm">Status travado em PENDENTE</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[10px] font-black uppercase">
                  Cadastro Pendente
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                Para liberar o avanço desta negociação, resolva o cadastro de:{' '}
                <strong className="text-amber-950 dark:text-amber-100">{pendencias.motivos.join(' • ')}</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {pendencias.pendenteImportador && (
              <Link
                href={`/negociacoes/${processo.id}/importador`}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Cadastrar Importador</span>
                <span>&rarr;</span>
              </Link>
            )}
            {(pendencias.pendenteProdutor || pendencias.pendenteArmazem) && (
              <Link
                href={`/negociacoes/${processo.id}/rastreabilidade`}
                className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:opacity-90 transition-opacity shadow-2xs inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Vincular Produtor/Armazém</span>
                <span>&rarr;</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 2. NAVEGAÇÃO DA NEGOCIAÇÃO */}
      <NegociacaoTabs 
        processoId={processo.id} 
        importadorPendente={pendencias.pendenteImportador} 
      />

      {/* 3. CONTEÚDO DA ABA ATUAL */}
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
