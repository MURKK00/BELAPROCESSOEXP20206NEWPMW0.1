'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { atualizarStatusAction } from '@/server/actions/editarProcessoAction';
import { STATUS_NEGOCIACAO_MAP } from '@/lib/formatters';
import { getUserPapeis } from '@/lib/permissions';
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
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bela_user');
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
  }, []);

  const theme = STATUS_THEMES[status] || DEFAULT_THEME;

  // Calcula os status permitidos para o perfil do usuário
  const papeis = currentUser ? getUserPapeis(currentUser) : ['ADMIN'];
  const hasFullStatusAccess = papeis.some((p) => p === 'ADMIN' || p === 'DIRETORIA' || p === 'ADMINISTRATIVO');
  const isComercialOnly = papeis.includes('COMERCIAL') && !hasFullStatusAccess;
  const isFinanceiroOnly = papeis.includes('FINANCEIRO') && !hasFullStatusAccess && !papeis.includes('COMERCIAL');

  // Determina lista de status elegíveis para troca
  let statusDisponiveis: string[] = [];
  if (hasFullStatusAccess) {
    statusDisponiveis = Object.keys(STATUS_NEGOCIACAO_MAP);
  } else if (isComercialOnly) {
    statusDisponiveis = ['PENDENTE', 'EM_NEGOCIACAO', 'CANCELADO'];
  } else {
    statusDisponiveis = [status]; // Apenas leitura
  }

  // Garante que o status atual sempre apareça na lista para visualização
  if (!statusDisponiveis.includes(status)) {
    statusDisponiveis = [status, ...statusDisponiveis];
  }

  const podeAlterar = !isFinanceiroOnly && statusDisponiveis.length > 1;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoStatus = e.target.value;
    if (novoStatus === status || !podeAlterar) return;

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
        className={`flex items-center gap-2 pl-3 pr-8 py-2 rounded-xl border text-xs sm:text-sm font-black transition-all shadow-xs ${
          podeAlterar ? 'cursor-pointer' : 'cursor-default opacity-90'
        } ${theme.bg} ${theme.border} ${theme.text}`}
        title={
          podeAlterar
            ? isComercialOnly
              ? 'Perfil Comercial: permitido alterar para Pendente, Em Negociação ou Cancelado'
              : 'Gerenciar status da negociação'
            : 'Seu perfil possui acesso de visualização para este status'
        }
      >
        <span className="text-sm select-none" aria-hidden="true">
          {salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : theme.icon}
        </span>

        <span className="relative z-10 pointer-events-none tracking-tight">
          {STATUS_NEGOCIACAO_MAP[status] || status}
        </span>

        {/* SELECT NATIVO INVISÍVEL (ATIVO APENAS SE TIVER PERMISSÃO DE ALTERAÇÃO) */}
        {podeAlterar ? (
          <select
            value={status}
            onChange={handleChange}
            disabled={salvando}
            aria-label="Alterar status da negociação"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {statusDisponiveis.map((val) => (
              <option key={val} value={val} className="text-slate-900 bg-white font-semibold py-1">
                {STATUS_THEMES[val]?.icon ? `${STATUS_THEMES[val].icon} ` : ''}
                {STATUS_NEGOCIACAO_MAP[val] || val}
              </option>
            ))}
          </select>
        ) : null}

        {/* ÍCONE DE SETINHA DE SELEÇÃO OU CADEADO */}
        <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center opacity-70">
          {podeAlterar ? <ChevronDown className="w-4 h-4" /> : null}
        </div>
      </div>
    </div>
  );
}