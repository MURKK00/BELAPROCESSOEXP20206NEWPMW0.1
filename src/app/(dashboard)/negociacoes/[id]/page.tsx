import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { InfoOperacaoCard } from '@/components/negociacoes/InfoOperacaoCard';
import { ResumoTopoCard } from '@/components/negociacoes/ResumoTopoCard';
import { 
  DollarSign, 
  Container, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { parseRecebimentoProformaInfo } from '@/lib/proformaHelper';

const FASES_STATUS: { fase: string; label: string; num: string }[] = [
  { fase: 'BOOKING_TRANSPORTE', label: 'Booking & Transporte', num: '01' },
  { fase: 'ADMINISTRATIVO', label: 'Administrativo & Compras', num: '02' },
  { fase: 'CARREGAMENTO_REDEX', label: 'Estufagem & REDEX', num: '03' },
  { fase: 'DOCUMENTACAO_EXPORTACAO', label: 'Dossiê & Certificados', num: '04' },
  { fase: 'FECHAMENTO_BANCARIO', label: 'Fechamento de Câmbio', num: '05' },
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
      documentos: { include: { tipoDocumento: true } },
      financeiro: {
        include: {
          travamentos: true,
          custos: true,
        },
      },
    },
  });

  if (!processo) notFound();

  const totalEtapas = processo.etapas.length;
  const etapasConcluidasTotal = processo.etapas.filter((e) => e.status === 'CONCLUIDA').length;
  const percEtapas = totalEtapas > 0 ? Math.round((etapasConcluidasTotal / totalEtapas) * 100) : 0;

  const pendentesPorFase = FASES_STATUS.map((f) => {
    const etapasDaFase = processo.etapas.filter((e) => e.etapaTemplate.fase === f.fase);
    const pendentes = etapasDaFase.filter((e) => e.status !== 'CONCLUIDA').length;
    
    return {
      ...f,
      pendentes,
      concluidas: etapasDaFase.length - pendentes,
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

  const proformaInfo = parseRecebimentoProformaInfo(fin?.bancoDestino, fin?.statusRecebimento, fin?.dataRecebimento, valorTotalUsd);
  const valorLiquidoTotalUsd = proformaInfo.totalLiquidoUsd > 0 ? proformaInfo.totalLiquidoUsd : valorTotalUsd;

  const travamentos = fin?.travamentos || [];
  const totalUsdTravado = travamentos.reduce((acc, t) => acc + Number(t.valorUsdParcial), 0);
  const saldoUsdParaTravar = Math.max(0, valorLiquidoTotalUsd - totalUsdTravado);
  const percCambioTravado = valorLiquidoTotalUsd > 0 ? Math.min(100, Math.round((totalUsdTravado / valorLiquidoTotalUsd) * 100)) : 0;

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

  const containerTotal = processo.containerQtd || processo.containers.length || 0;
  const containersPreenchidos = processo.containers.filter((c) => Boolean(c.numeroContainer?.trim())).length;
  const percContainers = containerTotal > 0 ? Math.round((containersPreenchidos / containerTotal) * 100) : 0;

  const docsList = processo.documentos || [];
  const docsOriginaisCount = docsList.filter((d) => {
    const desc = d.descricaoOutro || '';
    if (desc.includes('[GRUPO:ORIGINAIS]')) return true;
    if (desc.includes('[GRUPO:DRAFTS]') || desc.includes('[GRUPO:DIVERSOS]')) return false;
    return d.tipoDocumento?.obrigatorioNoPacoteFinal || d.tipoDocumento?.categoria === 'DOCUMENTACAO_EXPORTACAO';
  }).length;

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-8">
      
      {/* 1. SEÇÃO DE PROGRAMAÇÃO MARÍTIMA & TRÍADE DE DEADLINES */}
      <ResumoTopoCard
        processoId={processo.id}
        status={processo.status}
        bookingNumero={processo.bookingNumero ?? ''}
        navio={processo.navio ?? ''}
        estufagemInicio={processo.estufagemInicio ? (typeof processo.estufagemInicio === 'string' ? processo.estufagemInicio : processo.estufagemInicio.toISOString()) : null}
        estufagemFim={processo.estufagemFim ? (typeof processo.estufagemFim === 'string' ? processo.estufagemFim : processo.estufagemFim.toISOString()) : null}
        deadlineEmbarque={processo.deadlineEmbarque ? (typeof processo.deadlineEmbarque === 'string' ? processo.deadlineEmbarque : processo.deadlineEmbarque.toISOString()) : null}
        deadlineDraftBl={processo.deadlineDraftBl ? (typeof processo.deadlineDraftBl === 'string' ? processo.deadlineDraftBl : processo.deadlineDraftBl.toISOString()) : null}
        deadlineDraftVgm={processo.deadlineDraftVgm ? (typeof processo.deadlineDraftVgm === 'string' ? processo.deadlineDraftVgm : processo.deadlineDraftVgm.toISOString()) : null}
        deadlineCarga={processo.deadlineCarga ? (typeof processo.deadlineCarga === 'string' ? processo.deadlineCarga : processo.deadlineCarga.toISOString()) : null}
      />

      {/* 2. OS 3 CARDS INTEGRADOS DO COCKPIT 360 COM ALTA DIFERENCIAÇÃO VISUAL */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            Visão Consolidada em Tempo Real
          </span>
          <span className="text-xs text-slate-400">Atalhos diretos para os módulos</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* CARD 1: DRE & RESULTADO OPERACIONAL (TEMA ESMERALDA) */}
          <Link
            href={`/negociacoes/${id}/financeiro`}
            className="group relative bg-white dark:bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/70 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
          >
            {/* Brilho decorativo suave no topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-90" />
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <span>DRE & Câmbio</span>
                </span>
                <span className="p-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>

              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Resultado Operacional Estimado
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white my-1 tracking-tight font-mono">
                {formatBRL(resultadoBRL)}
              </div>

              {/* Barra de progresso do Câmbio Travado */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500 font-medium">Hedge Cambial</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{percCambioTravado}% Travado</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${percCambioTravado}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Margem: <strong className={margem >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 font-bold'}>{margem.toFixed(1)}%</strong>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {saldoUsdParaTravar <= 0.01 ? (
                  <span className="text-emerald-600 font-bold">100% Protegido</span>
                ) : (
                  <span>US$ {Math.round(saldoUsdParaTravar).toLocaleString()} aberto</span>
                )}
              </span>
            </div>
          </Link>

          {/* CARD 2: CONTÊINERES & ESTUFAGEM (TEMA AZUL MARÍTIMO) */}
          <Link
            href={`/negociacoes/${id}/containers`}
            className="group relative bg-white dark:bg-slate-900 border border-blue-500/30 hover:border-blue-500/70 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-90" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Container className="w-4 h-4" />
                  </span>
                  <span>Contêineres & Lacre</span>
                </span>
                <span className="p-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>

              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Unidades Estufadas & Lacradas
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white my-1 tracking-tight">
                {containersPreenchidos} <span className="text-base font-normal text-slate-400">de {containerTotal} ctns</span>
              </div>

              {/* Barra de progresso dos Contêineres */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500 font-medium">Preenchimento no REDEX</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{percContainers}% pronto</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${percContainers}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Tipo: <strong className="text-slate-800 dark:text-slate-200 font-bold">{processo.containerTipo || "20' DRY"}</strong></span>
              <span>Peso Total: <strong className="text-slate-800 dark:text-slate-200 font-bold">{(pesoFinalTon).toFixed(2)} t</strong></span>
            </div>
          </Link>

          {/* CARD 3: GED & DOSSIÊ DOCUMENTAL (TEMA ÂMBAR / DOCUMENTOS) */}
          <Link
            href={`/negociacoes/${id}/documentos`}
            className="group relative bg-white dark:bg-slate-900 border border-amber-500/30 hover:border-amber-500/70 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400 opacity-90" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <span>Documentos & Packing</span>
                </span>
                <span className="p-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>

              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Dossiê de Originais
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white my-1 tracking-tight">
                {docsOriginaisCount} <span className="text-base font-normal text-slate-400">originais ({docsList.length} total)</span>
              </div>

              {/* Barra de progresso dos Documentos */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500 font-medium">Pacote para Banco / Correio</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {docsOriginaisCount > 0 ? `${docsOriginaisCount} anexados` : 'Aguardando BL'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (docsOriginaisCount / 4) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Status: <strong className="text-slate-800 dark:text-slate-200 font-bold">{docsOriginaisCount >= 3 ? 'Dossiê Avançado' : 'Em Andamento'}</strong></span>
              <span className="text-orange-500 font-bold group-hover:translate-x-0.5 transition-transform">Abrir GED →</span>
            </div>
          </Link>

        </div>
      </div>

      {/* 3. GRID INFERIOR: FICHA TÉCNICA E CHECKLIST DE FASES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Ficha Técnica (Ocupa 2 colunas com seções temáticas) */}
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

        {/* Card do Checklist de Fases na Coluna Lateral (Ocupa 1 coluna) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                <span>Checklist Operacional</span>
              </h2>
              <p className="text-xs text-slate-400">Progresso das 5 fases do fluxo</p>
            </div>
            <Link 
              href={`/negociacoes/${id}/checklist`}
              className="text-xs font-bold text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:underline flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Progresso Geral */}
          <div className="my-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500 font-medium">Progresso Total das Tarefas</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">{etapasConcluidasTotal} de {totalEtapas} ({percEtapas}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${percEtapas}%` }}
              />
            </div>
          </div>

          {/* Lista das 5 Fases */}
          <div className="space-y-2.5 mb-5">
            {pendentesPorFase.map((f) => {
              const concluido = f.total > 0 && f.pendentes === 0;
              const emAndamento = f.concluidas > 0 && f.pendentes > 0;
              
              return (
                <div
                  key={f.fase}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    concluido
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-800/60'
                      : emAndamento
                      ? 'bg-orange-50/40 dark:bg-orange-950/20 border-orange-300/60 dark:border-orange-800/60'
                      : 'bg-slate-50/70 dark:bg-slate-850 border-slate-200/70 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {f.num}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={f.label}>
                      {f.label}
                    </span>
                  </div>

                  {f.total === 0 ? (
                    <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      Sem itens
                    </span>
                  ) : concluido ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Concluído
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100/70 dark:bg-orange-950/50 px-2 py-0.5 rounded-lg whitespace-nowrap shrink-0 border border-orange-200 dark:border-orange-800/60 font-mono">
                      {f.pendentes} pendente{f.pendentes > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <Link
            href={`/negociacoes/${id}/checklist`}
            className="block w-full text-center bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs py-3 rounded-xl transition-all shadow-xs"
          >
            Abrir Checklist Completo →
          </Link>
        </div>

      </div>

    </div>
  );
}
