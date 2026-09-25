'use client';

import { useMemo } from 'react';
import { Scale, DollarSign, Activity } from 'lucide-react';
import { formatUSD } from '@/lib/formatters';

interface ProcessoSummaryItem {
  id: string;
  status: string;
  volumeKg: number | string;
  metricasFinanceiras?: {
    valorTotalUsd: number;
    totalUsdTravado: number;
    saldoUsdParaTravar: number;
  };
}

interface NegotiationsSummaryBarProps {
  processos: ProcessoSummaryItem[];
  processosFiltrados?: ProcessoSummaryItem[];
  isFiltered?: boolean;
}

export function NegotiationsSummaryBar({
  processos,
  processosFiltrados,
  isFiltered = false,
}: NegotiationsSummaryBarProps) {
  const listaAlvo = isFiltered && processosFiltrados ? processosFiltrados : processos;

  const stats = useMemo(() => {
    const validos = listaAlvo.filter((p) => p.status !== 'CANCELADO');

    const totalVolumeKg = validos.reduce((acc, p) => acc + (Number(p.volumeKg) || 0), 0);
    const totalVolumeTon = totalVolumeKg / 1000;
    const totalUsd = validos.reduce((acc, p) => acc + (p.metricasFinanceiras?.valorTotalUsd || 0), 0);
    const totalTravadoUsd = validos.reduce((acc, p) => acc + (p.metricasFinanceiras?.totalUsdTravado || 0), 0);
    const totalNegociacoes = validos.length;

    return {
      totalNegociacoes,
      totalVolumeTon,
      totalVolumeKg,
      totalUsd,
      totalTravadoUsd,
    };
  }, [listaAlvo]);

  return (
    <div
      id="negotiations-summary-bar"
      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs mb-5 transition-colors"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* 1. VOLUME NEGOCIADO */}
        <div
          id="summary-active-volume-card"
          className="flex items-center gap-3.5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/30 rounded-xl p-3.5 transition-all hover:shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Volume Negociado
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.totalVolumeTon.toLocaleString('pt-BR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 3,
                })}
              </span>
              <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">Toneladas</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              {stats.totalVolumeKg.toLocaleString('pt-BR')} kg {isFiltered ? 'nos filtros' : 'negociados'}
            </span>
          </div>
        </div>

        {/* 2. VALOR TOTAL NEGOCIADO */}
        <div
          id="summary-active-usd-card"
          className="flex items-center gap-3.5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl p-3.5 transition-all hover:shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Valor Total Negociado
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatUSD(stats.totalUsd)}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-medium truncate">
              {stats.totalUsd - stats.totalTravadoUsd <= 0.01 && stats.totalUsd > 0
                ? '🔒 Câmbio 100% travado'
                : stats.totalTravadoUsd > 0
                ? `${formatUSD(stats.totalTravadoUsd)} travados • ${formatUSD(Math.max(0, stats.totalUsd - stats.totalTravadoUsd))} a travar`
                : 'Aguardando travamento cambial'}
            </span>
          </div>
        </div>

        {/* 3. TOTAL DE NEGOCIAÇÕES */}
        <div
          id="summary-active-count-card"
          className="flex items-center gap-3.5 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 dark:border-blue-500/30 rounded-xl p-3.5 sm:col-span-2 md:col-span-1 transition-all hover:shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total de Negociações
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.totalNegociacoes}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {stats.totalNegociacoes === 1 ? 'negociação' : 'negociações'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              {isFiltered ? 'Ativas com filtros aplicados' : 'Desconsiderando canceladas'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
