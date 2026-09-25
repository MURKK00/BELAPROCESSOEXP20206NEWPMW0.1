import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { InfoOperacaoCard } from '@/components/negociacoes/InfoOperacaoCard';
import { ResumoTopoCard } from '@/components/negociacoes/ResumoTopoCard';
import { Ship, DollarSign, Container, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

const FASES_STATUS: { fase: string; label: string }[] = [
  { fase: 'BOOKING_TRANSPORTE', label: 'Booking & Industrialização' },
  { fase: 'ADMINISTRATIVO', label: 'Administrativo' },
  { fase: 'CARREGAMENTO_REDEX', label: 'Carregamento e REDEX' },
  { fase: 'DOCUMENTACAO_EXPORTACAO', label: 'Documentos' },
  { fase: 'FECHAMENTO_BANCARIO', label: 'Fechamento Bancário/Documental' },
];

export default async function VisaoGeralNegociacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: { 
      etapas: { include: { etapaTemplate: true } },
      containers: true,
      financeiro: {
        include: {
          travamentos: true,
          custos: true,
        },
      },
    },
  });

  if (!processo) notFound();

  const pendentesPorFase = FASES_STATUS.map((f) => {
    const etapasDaFase = processo.etapas.filter((e) => e.etapaTemplate.fase === f.fase);
    const pendentes = etapasDaFase.filter((e) => e.status !== 'CONCLUIDA').length;
    
    return {
      ...f,
      pendentes,
      total: etapasDaFase.length,
    };
  });

  // Métricas rápidas para os cards integrados do Cockpit 360
  const fin = processo.financeiro;
  const volumeKg = Number(processo.volumeKg);
  const precoUsd = fin ? Number(fin.precoUsd) : (processo.valorDeclaradoUsd ? Number(processo.valorDeclaradoUsd) : 0);
  const pesoRealKg = processo.containers.reduce((acc, c) => acc + (c.pesoLiquido ? Number(c.pesoLiquido) : 0), 0);
  const pesoFinalKg = pesoRealKg > 0 ? pesoRealKg : volumeKg;
  const pesoFinalTon = pesoFinalKg / 1000;
  const valorTotalUsd = pesoFinalTon * precoUsd;

  const travamentos = fin?.travamentos || [];
  const totalUsdTravado = travamentos.reduce((acc, t) => acc + Number(t.valorUsdParcial), 0);
  const saldoUsdParaTravar = Math.max(0, valorTotalUsd - totalUsdTravado);
  let somatorioReais = 0;
  for (const t of travamentos) {
    somatorioReais += Number(t.valorUsdParcial) * Number(t.ptax);
  }
  const ptaxMedia = totalUsdTravado > 0 ? somatorioReais / totalUsdTravado : 0;
  const receitaBrutaBRL = totalUsdTravado * ptaxMedia;
  const custos = fin?.custos || [];
  const totalCustosBRL = custos.reduce((acc, c) => acc + Number(c.valor), 0);
  const resultadoBRL = receitaBrutaBRL - totalCustosBRL;
  const margem = receitaBrutaBRL > 0 ? (resultadoBRL / receitaBrutaBRL) * 100 : 0;

  const containersPreenchidos = processo.containers.filter((c) => Boolean(c.numeroContainer?.trim())).length;

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6">
      
      {/* CARD COMPACTO EDITÁVEL DE LOGÍSTICA (BOOKING, NAVIO, ESTUFAGEM, 3 DEADLINES) */}
      <ResumoTopoCard
        processoId={processo.id}
        bookingNumero={processo.bookingNumero ?? ''}
        navio={processo.navio ?? ''}
        estufagemInicio={processo.estufagemInicio ? processo.estufagemInicio.toISOString() : null}
        estufagemFim={processo.estufagemFim ? processo.estufagemFim.toISOString() : null}
        deadlineEmbarque={processo.deadlineEmbarque ? processo.deadlineEmbarque.toISOString() : null}
        deadlineDraftBl={processo.deadlineDraftBl ? processo.deadlineDraftBl.toISOString() : null}
        deadlineDraftVgm={processo.deadlineDraftVgm ? processo.deadlineDraftVgm.toISOString() : null}
        deadlineCarga={processo.deadlineCarga ? processo.deadlineCarga.toISOString() : null}
      />

      {/* 3 CARDS DE ATALHO RÁPIDO PARA O COCKPIT 360 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD FINANCEIRO */}
        <Link
          href={`/negociacoes/${id}/financeiro`}
          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 shadow-2xs hover:border-orange-500/50 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>DRE & Câmbio</span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mb-1">
            {formatBRL(resultadoBRL)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Margem: <strong className={margem >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{margem.toFixed(1)}%</strong></span>
            <span>{saldoUsdParaTravar <= 0.01 ? '🔒 Câmbio 100%' : `⚠️ US$ ${Math.round(saldoUsdParaTravar).toLocaleString()} aberto`}</span>
          </div>
        </Link>

        {/* CARD CONTÊINERES */}
        <Link
          href={`/negociacoes/${id}/containers`}
          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 shadow-2xs hover:border-orange-500/50 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Container className="w-4 h-4 text-blue-500" />
              <span>Contêineres & Lacre</span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mb-1">
            {containersPreenchidos} de {processo.containerQtd || processo.containers.length || 0}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tipo: <strong className="text-slate-700 dark:text-slate-300">{processo.containerTipo || "20' DRY"}</strong></span>
            <span>Peso: <strong className="text-slate-700 dark:text-slate-300">{(pesoFinalTon).toFixed(2)} t</strong></span>
          </div>
        </Link>

        {/* CARD DOCUMENTAÇÃO & INSTRUÇÃO */}
        <Link
          href={`/negociacoes/${id}/documentos`}
          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 shadow-2xs hover:border-orange-500/50 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-orange-500" />
              <span>Documentos & Packing</span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mb-1">
            {processo.ruc ? 'RUC Gerada' : 'Pendente RUC'}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Free Time: <strong className="text-slate-700 dark:text-slate-300">{processo.freeTimeDestino || '14 dias'}</strong></span>
            <span className="text-orange-500 dark:text-orange-400 font-bold">Emitir Docs →</span>
          </div>
        </Link>

      </div>

      {/* GRID INFERIOR: INFO OPERAÇÃO + CHECKLIST POR FASES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Informações da Operação ocupando 2 colunas */}
        <InfoOperacaoCard
          processoId={processo.id}
          clienteFinal={processo.clienteFinal}
          produto={processo.produto}
          volumeKg={Number(processo.volumeKg)}
          incoterm={processo.incoterm ?? 'FOB'}
          portoOrigem={processo.portoOrigem ?? ''}
          portoDestino={processo.portoDestino ?? ''}
          redex={processo.redex ?? ''}
          valorDeclaradoUsd={processo.valorDeclaradoUsd ? Number(processo.valorDeclaradoUsd) : null}
          containerQtd={processo.containerQtd}
          containerTipo={processo.containerTipo ?? "20' DRY"}
          sacasPorContainer={processo.sacasPorContainer}
          freeTimeDestino={processo.freeTimeDestino ?? ''}
          ruc={processo.ruc ?? ''}
          contratoInterno={processo.contratoInterno ?? ''}
        />

        {/* Status da Operação na coluna da direita */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs w-full transition-colors">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Etapas do Checklist</h2>
            <Link 
              href={`/negociacoes/${id}/checklist`}
              className="text-xs font-bold text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:underline"
            >
              Abrir
            </Link>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Acompanhamento das 5 fases operacionais.</p>

          <div className="space-y-2.5 mb-5">
            {pendentesPorFase.map((f) => {
              const concluido = f.total > 0 && f.pendentes === 0;
              
              return (
                <div
                  key={f.fase}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 gap-3"
                >
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={f.label}>
                    {f.label}
                  </span>

                  {f.total === 0 ? (
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 uppercase">
                      Sem tarefas
                    </span>
                  ) : concluido ? (
                    <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 uppercase">
                      Concluído
                    </span>
                  ) : (
                    <span className="text-xs font-bold bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      {f.pendentes}/{f.total} pend.
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <Link
            href={`/negociacoes/${id}/checklist`}
            className="block w-full text-center bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow-2xs"
          >
            Gerenciar Checklist Completo →
          </Link>
        </div>
      </div>
    </div>
  );
}
