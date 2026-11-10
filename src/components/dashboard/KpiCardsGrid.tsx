"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Scale, DollarSign, Container, Clock, Ship } from 'lucide-react';
import { formatNum } from '@/lib/formatters';

export interface KpiCardsGridProps {
  volumeTotalTon: number;
  valorEmOperacaoUsd: number;
  totalContainersMovimentados: number;
  containersEmbarcados: number;
  containersEmExecucao: number;
  processosEmExecucaoCount: number;
  processosEmbarcadosCount: number;
}

/**
 * Componente interno que renderiza o número do KPI.
 * Se o valor for maior que a largura disponível do box, ele permite ver o número
 * completo com rolagem interna suave (marquee), sem cortar com reticências e sem vazar do card.
 */
function NumericBox({
  value,
  unit,
  unitColor,
}: {
  value: string;
  unit?: string;
  unitColor?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflowPixels, setOverflowPixels] = useState(0);

  useEffect(() => {
    function calculateOverflow() {
      if (!containerRef.current || !contentRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const contentWidth = contentRef.current.scrollWidth;
      const diff = contentWidth - containerWidth;
      setOverflowPixels(diff > 2 ? diff : 0);
    }

    calculateOverflow();
    window.addEventListener('resize', calculateOverflow);
    return () => window.removeEventListener('resize', calculateOverflow);
  }, [value, unit]);

  return (
    <div 
      ref={containerRef} 
      className="overflow-hidden relative w-full group/numbox py-0.5"
      title={`${value}${unit ? ' ' + unit : ''}`}
    >
      <div
        ref={contentRef}
        style={{
          '--overflow-x': `-${overflowPixels + 6}px`,
        } as React.CSSProperties}
        className={`flex items-baseline gap-1 whitespace-nowrap will-change-transform leading-tight ${
          overflowPixels > 0
            ? 'animate-kpi-scroll group-hover/numbox:pause'
            : ''
        }`}
      >
        <span className="text-lg sm:text-xl xl:text-[20px] 2xl:text-[22px] font-black text-slate-900 dark:text-white tracking-tight shrink-0">
          {value}
        </span>
        {unit && (
          <span className={`text-xs font-black ${unitColor || 'text-slate-500 dark:text-slate-400'} shrink-0`}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function KpiCardsGrid({
  volumeTotalTon,
  valorEmOperacaoUsd,
  totalContainersMovimentados,
  containersEmbarcados,
  containersEmExecucao,
  processosEmExecucaoCount,
  processosEmbarcadosCount,
}: KpiCardsGridProps) {
  // Formatação amigável de moeda sem zeros desnecessários se inteiro, ou com 2 decimais
  const formatCurrencyClean = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: val % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Formatação de volume (evita zeros como 1.712,000 exibindo 1.712 Ton)
  const formatVolumeClean = (val: number) => {
    const isInteger = Math.abs(val - Math.round(val)) < 0.001;
    if (isInteger) {
      return Math.round(val).toLocaleString('pt-BR');
    }
    return formatNum(val, 2);
  };

  const cards = [
    {
      id: 'volume-total',
      title: 'VOLUME TOTAL',
      value: formatVolumeClean(volumeTotalTon),
      unit: 'Ton',
      subtitle: `${(volumeTotalTon * 1000).toLocaleString('pt-BR')} kg faturado`,
      icon: Scale,
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      border: 'border-amber-500/20 dark:border-amber-500/30 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      unitColor: 'text-amber-600 dark:text-amber-400',
      subColor: 'text-slate-400 dark:text-slate-500',
    },
    {
      id: 'valor-operacao',
      title: 'VALOR EM OPERAÇÃO',
      value: formatCurrencyClean(valorEmOperacaoUsd),
      unit: '',
      subtitle: 'Portfólio ativo em USD',
      icon: DollarSign,
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      border: 'border-emerald-500/20 dark:border-emerald-500/30 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      unitColor: '',
      subColor: 'text-emerald-600 dark:text-emerald-400 font-semibold',
    },
    {
      id: 'containers-movimentados',
      title: 'CONTÊINERES',
      value: String(totalContainersMovimentados),
      unit: totalContainersMovimentados === 1 ? 'box' : 'boxes',
      subtitle: `${containersEmbarcados} emb · ${containersEmExecucao} em pátio`,
      icon: Container,
      gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
      border: 'border-indigo-500/20 dark:border-indigo-500/30 hover:border-indigo-500/40',
      iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
      unitColor: 'text-slate-500 dark:text-slate-400',
      subColor: 'text-indigo-600 dark:text-indigo-400 font-medium',
    },
    {
      id: 'em-execucao',
      title: 'EM EXECUÇÃO',
      value: String(processosEmExecucaoCount),
      unit: processosEmExecucaoCount === 1 ? 'processo' : 'processos',
      subtitle: 'Fase operacional ativa',
      icon: Clock,
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      border: 'border-blue-500/20 dark:border-blue-500/30 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      unitColor: 'text-slate-500 dark:text-slate-400',
      subColor: 'text-slate-400 dark:text-slate-500',
    },
    {
      id: 'embarcados',
      title: 'EMBARCADOS',
      value: String(processosEmbarcadosCount),
      unit: processosEmbarcadosCount === 1 ? 'carga' : 'cargas',
      subtitle: 'Em trânsito marítimo',
      icon: Ship,
      gradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
      border: 'border-cyan-500/20 dark:border-cyan-500/30 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
      unitColor: 'text-slate-500 dark:text-slate-400',
      subColor: 'text-slate-400 dark:text-slate-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 my-1">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`relative overflow-hidden flex items-center gap-3 bg-gradient-to-br ${card.gradient} border ${card.border} rounded-2xl p-4 sm:p-4.5 shadow-xs transition-all hover:shadow-md min-h-[104px]`}
          >
            {/* Ícone */}
            <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Conteúdo com rolagem interna suave no box caso o número seja longo */}
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                {card.title}
              </span>

              {/* Box do número com rolagem interna (sem reticências e sem vazar da caixa) */}
              <NumericBox
                value={card.value}
                unit={card.unit}
                unitColor={card.unitColor}
              />

              <span className={`text-[10px] block mt-0.5 truncate ${card.subColor}`}>
                {card.subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
