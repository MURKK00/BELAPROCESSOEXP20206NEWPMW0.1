export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getDaysLeft } from '@/lib/workflow';
import { formatNum, formatDateBR, safeNumber } from '@/lib/formatters';
import { Scale, DollarSign, Clock, Ship, TrendingUp, ArrowRight, Activity, Globe, Container } from 'lucide-react';
import { LedTickerTape } from '@/components/cotacoes/LedTickerTape';
import { VisaoGeralHeaderActions } from '@/components/dashboard/VisaoGeralHeaderActions';
import { KpiCardsGrid } from '@/components/dashboard/KpiCardsGrid';

export default async function DashboardPage() {
  const processos = await prisma.processo.findMany({
    include: {
      etapas: true,
      containers: true,
      financeiro: {
        include: {
          travamentos: true,
        },
      },
    },
    orderBy: { deadlineEmbarque: 'asc' }, 
  });

  const processosValidos = processos.filter(
    (p) => p.status !== 'CANCELADO'
  );

  const processosEmbarcados = processosValidos.filter((p) => p.status === 'EMBARCADO');
  
  const processosEmExecucao = processosValidos.filter(
    (p) => p.status !== 'EMBARCADO' && p.status !== 'FINALIZADO'
  );

  let volumeTotalTon = 0;
  let valorEmOperacaoUsd = 0;
  let totalContainersMovimentados = 0;
  let containersEmbarcados = 0;
  let containersEmExecucao = 0;

  for (const p of processosValidos) {
    const fin = p.financeiro;
    // Volume Real dos Containers (se estufados/preenchidos) ou Volume Contratado inicial
    const pesoLiquidoContainers = (p.containers || []).reduce(
      (acc: number, c: any) => acc + safeNumber(c?.pesoLiquido, 0),
      0
    );
    const pesoKg = pesoLiquidoContainers > 0 ? pesoLiquidoContainers : safeNumber(p.volumeKg, 0);
    const pesoTon = pesoKg / 1000;
    volumeTotalTon += pesoTon;

    const precoUnitario = fin?.precoUsd ? safeNumber(fin.precoUsd, 0) : safeNumber(p.valorDeclaradoUsd, 0);
    valorEmOperacaoUsd += (pesoTon * precoUnitario);

    // Contagem de contêineres movimentados no processo
    const qtdContainers = (p.containers && p.containers.length > 0)
      ? p.containers.length
      : (p.containerQtd || 0);

    totalContainersMovimentados += qtdContainers;
    if (p.status === 'EMBARCADO' || p.status === 'FINALIZADO') {
      containersEmbarcados += qtdContainers;
    } else {
      containersEmExecucao += qtdContainers;
    }
  }

  // CÁLCULO FINANCEIRO CONSOLIDADO (RECEBIMENTO BANCÁRIO VS. TRAVAS CAMBIAIS)
  let pendingRecebimentoUsd = 0;
  let countPendingRecebimento = 0;
  let saldoCambialAbertoUsd = 0;
  let totalUsdTravadoGeral = 0;

  for (const p of processosValidos) {
    const fin = p.financeiro;
    const statusRec = fin?.statusRecebimento || 'A_RECEBER';

    const pesoLiquidoContainers = (p.containers || []).reduce(
      (acc: number, c: any) => acc + safeNumber(c?.pesoLiquido, 0),
      0
    );
    const pesoKg = pesoLiquidoContainers > 0 ? pesoLiquidoContainers : safeNumber(p.volumeKg, 0);
    const pesoTon = pesoKg / 1000;

    const precoUnit = fin?.precoUsd ? safeNumber(fin.precoUsd, 0) : safeNumber(p.valorDeclaradoUsd, 0);
    const valorProcessoUsd = pesoTon * precoUnit;

    const travamentos = fin?.travamentos || [];
    const travadoUsd = travamentos.reduce((acc, t) => acc + safeNumber(t?.valorUsdParcial, 0), 0);
    totalUsdTravadoGeral += travadoUsd;

    const saldoAbertoProcesso = Math.max(0, valorProcessoUsd - travadoUsd);
    saldoCambialAbertoUsd += saldoAbertoProcesso;

    if (statusRec === 'A_RECEBER') {
      countPendingRecebimento++;
      pendingRecebimentoUsd += valorProcessoUsd;
    }
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const proximo = processosValidos.find((p) => {
    if (!p.deadlineEmbarque) return false;
    if (p.status === 'EMBARCADO' || p.status === 'FINALIZADO') return false; 
    return p.deadlineEmbarque >= hoje;
  }) ?? null;

  return (
    <div className="space-y-6">
      {/* ESTEIRA HORIZONTAL DE COTAÇÕES EM LED (WALL STREET STYLE) */}
      <div className="-mx-8 -mt-7 mb-2">
        <LedTickerTape />
      </div>

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">PEX Cockpit</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              Visão Geral 360°
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Inteligência operacional em tempo real de volumes, câmbio e esteira de exportação.
          </p>
        </div>
        <VisaoGeralHeaderActions />
      </div>

      {/* CARDS SUPERIORES DE KPIS (GRID COM ROLAGEM INTERNA INTELIGENTE NO BOX DO NÚMERO) */}
      <KpiCardsGrid
        volumeTotalTon={volumeTotalTon}
        valorEmOperacaoUsd={valorEmOperacaoUsd}
        totalContainersMovimentados={totalContainersMovimentados}
        containersEmbarcados={containersEmbarcados}
        containersEmExecucao={containersEmExecucao}
        processosEmExecucaoCount={processosEmExecucao.length}
        processosEmbarcadosCount={processosEmbarcados.length}
      />

      {/* ESTADO QUANDO O SISTEMA ESTÁ PRONTO PARA OPERAÇÃO */}
      {processosValidos.length === 0 && (
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-3">
            <Scale className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Sistema Pronto para Operação
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
            Nenhuma negociação ativa no momento. Cadastre sua primeira operação de exportação
          </p>
          <div className="flex items-center justify-center mt-6">
            <Link
              href="/negociacoes/novo"
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 inline-flex items-center gap-1.5"
            >
              + Criar Negociação
            </Link>
          </div>
        </div>
      )}

      {/* PRÓXIMO DEADLINE */}
      {proximo && (
        <div className="bg-gradient-to-br from-[#1a365d] to-[#0f2444] text-white rounded-2xl p-7 relative overflow-hidden shadow-lg border border-blue-900/40">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Próximo deadline de embarque</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mb-1 tracking-tight">{proximo.clienteFinal}</div>
          <div className="text-sm text-slate-300 mb-6">
            {proximo.numeroProcesso} · {proximo.produto} ·{' '}
            <strong className="text-white">{formatNum(Number(proximo.volumeKg) / 1000, 3)} TON</strong>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-t border-white/10 pt-5">
            <Info label="Booking" value={proximo.bookingNumero ?? '-'} />
            <Info label="Data limite" value={formatDateBR(proximo.deadlineEmbarque)} />
            <Info label="Navio" value={proximo.navio ?? '-'} />
          </div>
          {proximo.deadlineEmbarque && (
            <div className="hidden sm:block absolute right-8 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-5 text-center border border-white/15">
              <div className="text-5xl font-black leading-none tracking-tight">
                {getDaysLeft(proximo.deadlineEmbarque)}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-300 mt-1 font-bold">Dias restantes</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs uppercase text-gray-400 tracking-wide mb-1">{label}</label>
      <span className="text-base font-semibold">{value}</span>
    </div>
  );
}