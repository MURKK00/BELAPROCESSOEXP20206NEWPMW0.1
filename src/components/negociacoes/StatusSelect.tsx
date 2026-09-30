'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { atualizarStatusAction } from '@/server/actions/editarProcessoAction';
import { STATUS_NEGOCIACAO_MAP } from '@/lib/formatters';
import { ChevronDown, Loader2 } from 'lucide-react';

interface StatusTheme {
  border: string;
  bg: string;
  text: string;
  badge: string;
  dot: string;
  icon: string;
}

const STATUS_THEMES: Record<string, StatusTheme> = {
  EMBARCADO: {
    border: 'border-blue-500/40 hover:border-blue-500 dark:border-blue-500/50',
    bg: 'bg-blue-50/90 dark:bg-blue-950/40',
    text: 'text-blue-900 dark:text-blue-200',
    badge: 'bg-blue-600 text-white',
    dot: 'bg-blue-500',
    icon: '🚢',
  },
  EM_EXECUCAO: {
    border: 'border-orange-500/40 hover:border-orange-500 dark:border-orange-500/50',
    bg: 'bg-orange-50/90 dark:bg-orange-950/40',
    text: 'text-orange-950 dark:text-orange-200',
    badge: 'bg-[#f58220] text-white',
    dot: 'bg-orange-500',
    icon: '⚡',
  },
  EM_NEGOCIACAO: {
    border: 'border-indigo-500/40 hover:border-indigo-500 dark:border-indigo-500/50',
    bg: 'bg-indigo-50/90 dark:bg-indigo-950/40',
    text: 'text-indigo-950 dark:text-indigo-200',
    badge: 'bg-indigo-600 text-white',
    dot: 'bg-indigo-500',
    icon: '📝',
  },
  FINALIZADO: {
    border: 'border-emerald-500/40 hover:border-emerald-500 dark:border-emerald-500/50',
    bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
    text: 'text-emerald-950 dark:text-emerald-200',
    badge: 'bg-emerald-600 text-white',
    dot: 'bg-emerald-500',
    icon: '✅',
  },
  PENDENTE: {
    border: 'border-amber-500/40 hover:border-amber-500 dark:border-amber-500/50',
    bg: 'bg-amber-50/90 dark:bg-amber-950/40',
    text: 'text-amber-950 dark:text-amber-200',
    badge: 'bg-amber-500 text-white',
    dot: 'bg-amber-500',
    icon: '⏳',
  },
  CANCELADO: {
    border: 'border-rose-500/40 hover:border-rose-500 dark:border-rose-500/50',
    bg: 'bg-rose-50/90 dark:bg-rose-950/40',
    text: 'text-rose-950 dark:text-rose-200',
    badge: 'bg-rose-600 text-white',
    dot: 'bg-rose-500',
    icon: '❌',
  },
};

const DEFAULT_THEME: StatusTheme = {
  border: 'border-slate-300 dark:border-slate-700',
  bg: 'bg-white dark:bg-slate-800',
  text: 'text-slate-900 dark:text-white',
  badge: 'bg-slate-600 text-white',
  dot: 'bg-slate-400',
  icon: '📌',
};

export function StatusSelect({ processoId, status }: { processoId: string; status: string }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);

  const theme = STATUS_THEMES[status] || DEFAULT_THEME;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoStatus = e.target.value;
    if (novoStatus === status) return;

    setSalvando(true);
    try {
      const formData = new FormData();
      formData.set('processoId', processoId);
      formData.set('status', novoStatus);
      
      await atualizarStatusAction(formData);
      router.refresh();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <div
        className={`flex items-center gap-2 pl-3 pr-8 py-2 rounded-xl border text-xs sm:text-sm font-black transition-all shadow-xs cursor-pointer ${theme.bg} ${theme.border} ${theme.text}`}
      >
        <span className="text-sm select-none" aria-hidden="true">
          {salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : theme.icon}
        </span>

        <span className="relative z-10 pointer-events-none tracking-tight">
          {STATUS_NEGOCIACAO_MAP[status] || status}
        </span>

        {/* SELECT INVISÍVEL COBRINDO O CONTAINER PARA NAVEGAÇÃO NATIVA PERFEITA */}
        <select
          value={status}
          onChange={handleChange}
          disabled={salvando}
          aria-label="Alterar status da negociação"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {Object.entries(STATUS_NEGOCIACAO_MAP).map(([val, label]) => (
            <option key={val} value={val} className="text-slate-900 bg-white font-semibold py-1">
              {STATUS_THEMES[val]?.icon ? `${STATUS_THEMES[val].icon} ` : ''}
              {label}
            </option>
          ))}
        </select>

        {/* ÍCONE DE SETINHA DE SELEÇÃO */}
        <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center opacity-70">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}