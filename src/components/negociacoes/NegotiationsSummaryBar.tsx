'use client';

import { useMemo } from 'react';
import { Scale, DollarSign, Activity, Ship, Layers } from 'lucide-react';
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
  // Negociações abertas / ativas em andamento (excluindo CANCELADO e FINALIZADO)
  const statsGerais = useMemo(() => {
    const abertos = processos.filter(
      (p) => p.status !== 'CANCELADO' && p.status !== 'FINALIZADO'
    );

    const totalVolumeTon = abertos.reduce((acc, p) => acc + (Number(p.volumeKg) || 0) / 1000, 0);
    const totalUsd = abertos.reduce((acc, p) => acc + (p.metricasFinanceiras?.valorTotalUsd || 0), 0);
    const totalTravadoUsd = abertos.reduce((acc, p) => acc + (p.metricasFinanceiras?.totalUsdTravado || 0), 0);
    const totalEmbarcadoTon = abertos
      .filter((p) => p.status === 'EMBARCADO')
      .reduce((acc, p) => acc + (Number(p.volumeKg) || 0) / 1000, 0);

    return {
      qtdAbertas: abertos.length,
      totalVolumeTon,
      totalUsd,
      totalTravadoUsd,
      totalEmbarcadoTon,
    };
  }, [processos]);

  // Se houver filtros aplicados na tela, calcular também para os itens visíveis
  const statsFiltrados = useMemo(() => {
    if (!isFiltered || !processosFiltrados) return null;

    const abertos = processosFiltrados.filter(
      (p) => p.status !== 'CANCELADO' && p.status !== 'FINALIZADO'
    );

    const totalVolumeTon = abertos.reduce((acc, p) => acc + (Number(p.volumeKg) || 0) / 1000, 0);
    const totalUsd = abertos.reduce((acc, p) => acc + (p.metricasFinanceiras?.valorTotalUsd || 0), 0);

    return {
      qtdAbertas: abertos.length,
      totalVolumeTon,
      totalUsd,
    };
  }, [isFiltered, processosFiltrados]);

  return (
    <div
      id="negotiations-summary-bar"
      className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs mb-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* LADO ESQUERDO: OS 2 INDICADORES PRINCIPAIS PEDIDOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 flex-1">
          {/* 1. VOLUME TOTAL ATIVO EM TONELADAS */}
          <div
            id="summary-active-volume-card"
            className="flex items-center gap-3.5 bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200/70 rounded-xl p-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Volume Ativo Aberto
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {statsGerais.totalVolumeTon.toLocaleString('pt-BR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 1,
                  })}
                </span>
                <span className="text-xs font-extrabold text-secondary">Toneladas</span>
              </div>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {(statsGerais.totalVolumeTon * 1000).toLocaleString('pt-BR')} kg em andamento
              </span>
            </div>
          </div>

          {/* 2. VALOR TOTAL EM USD NAS NEGOCIAÇÕES ABERTAS */}
          <div
            id="summary-active-usd-card"
            className="flex items-center gap-3.5 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/70 rounded-xl p-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/15 flex items-center justify-center text-emerald-700 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Valor Total Aberto
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
                  {formatUSD(statsGerais.totalUsd)}
                </span>
              </div>
              <span className="text-[10px] text-emerald-700/80 block mt-0.5">
                {statsGerais.totalUsd - statsGerais.totalTravadoUsd <= 0.01 && statsGerais.totalUsd > 0
                  ? '🔒 Câmbio 100% travado'
                  : statsGerais.totalTravadoUsd > 0
                  ? `${formatUSD(statsGerais.totalTravadoUsd)} travados • ${formatUSD(Math.max(0, statsGerais.totalUsd - statsGerais.totalTravadoUsd))} a travar`
                  : 'Aguardando travamento cambial'}
              </span>
            </div>
          </div>

          {/* 3. OPERAÇÕES EM ANDAMENTO */}
          <div
            id="summary-active-count-card"
            className="flex items-center gap-3.5 bg-gradient-to-br from-blue-50/70 to-slate-50/40 border border-blue-200/70 rounded-xl p-3.5 sm:col-span-2 md:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center text-blue-700 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Negociações Abertas
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {statsGerais.qtdAbertas}
                </span>
                <span className="text-xs font-semibold text-gray-500">processos ativos</span>
              </div>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                Exclui processos cancelados ou já finalizados
              </span>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: INFORMAÇÕES DE CONTEXTO / FILTRO ATIVO */}
        {isFiltered && statsFiltrados && (
          <div
            id="summary-filtered-indicator"
            className="lg:w-64 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-3 flex flex-col justify-center text-xs shrink-0"
          >
            <div className="flex items-center gap-1.5 text-gray-700 font-bold mb-1">
              <Layers className="w-3.5 h-3.5 text-secondary" />
              <span>Visível com Filtros Atuais</span>
            </div>
            <div className="text-gray-600 space-y-0.5 text-[11px]">
              <div>
                Volume:{' '}
                <strong className="text-gray-900">
                  {statsFiltrados.totalVolumeTon.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t
                </strong>{' '}
                ({statsFiltrados.qtdAbertas} ativas)
              </div>
              <div>
                Valor:{' '}
                <strong className="text-emerald-700">{formatUSD(statsFiltrados.totalUsd)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
