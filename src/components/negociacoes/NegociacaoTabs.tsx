"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UserCheck, 
  CheckSquare, 
  DollarSign, 
  Container, 
  FileSpreadsheet, 
  History,
  Receipt,
  Sparkles
} from 'lucide-react';

interface NegociacaoTabsProps {
  processoId: string;
  importadorPendente?: boolean;
}

export function NegociacaoTabs({ processoId, importadorPendente = false }: NegociacaoTabsProps) {
  const pathname = usePathname();
  const base = `/negociacoes/${processoId}`;
  
  const tabs = [
    { 
      href: base, 
      label: 'Visão Geral', 
      tag: 'Cockpit 360',
      icon: LayoutDashboard,
      color: 'text-blue-500' 
    },
    { 
      href: `${base}/importador`, 
      label: 'Importador (Buyer)', 
      tag: 'Consignee',
      icon: UserCheck,
      color: 'text-purple-500' 
    },
    { 
      href: `${base}/checklist`, 
      label: 'Linha do Tempo & Etapas', 
      tag: 'Workflow',
      icon: CheckSquare,
      color: 'text-emerald-500' 
    },
    { 
      href: `${base}/containers`, 
      label: 'Contêineres & Lotes', 
      tag: 'Estufagem',
      icon: Container,
      color: 'text-cyan-500' 
    },
    { 
      href: `${base}/notas-fiscais`, 
      label: 'Notas Fiscais', 
      tag: 'Triangulação',
      icon: Receipt,
      color: 'text-emerald-500' 
    },
    { 
      href: `${base}/financeiro`, 
      label: 'Financeiro & DRE', 
      tag: 'Câmbio',
      icon: DollarSign,
      color: 'text-emerald-600' 
    },
    { 
      href: `${base}/documentos`, 
      label: 'Documentos & GED', 
      tag: 'Dossiê',
      icon: FileSpreadsheet,
      color: 'text-amber-500' 
    },
    { 
      href: `${base}/auditoria`, 
      label: 'Auditoria & Logs', 
      tag: 'Trilha',
      icon: History,
      color: 'text-slate-500' 
    },
  ];

  return (
    <nav 
      aria-label="Navegação da negociação"
      className="mb-6 relative z-0 bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-1.5 shadow-xs transition-all"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((t) => {
          const isActive = pathname === t.href;
          const isImportadorTab = t.href.endsWith('/importador');
          const isPendenteAndAttention = isImportadorTab && importadorPendente;
          const Icon = t.icon;

          return (
            <Link
              key={t.href}
              href={t.href}
              title={
                isPendenteAndAttention 
                  ? 'Atenção: Os dados do Importador (Buyer) ainda não foram preenchidos! Clique aqui para preencher.' 
                  : undefined
              }
              className={`group relative flex-1 min-w-[140px] sm:min-w-fit px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2.5 text-xs select-none ${
                isActive 
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-md shadow-slate-900/10' 
                  : isPendenteAndAttention
                  ? 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border-2 border-amber-500 animate-pulse font-black shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/60 ring-offset-1 hover:bg-amber-500/25'
                  : 'text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
              }`}
            >
              {/* Ícone com destaque */}
              <span className={`p-1 rounded-lg transition-transform group-hover:scale-110 ${
                isActive 
                  ? 'bg-white/15 dark:bg-slate-900/15 text-orange-400 dark:text-orange-600' 
                  : isPendenteAndAttention
                  ? 'bg-amber-500 text-white animate-bounce shadow-xs'
                  : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </span>

              {/* Rótulo da Aba */}
              <span className="whitespace-nowrap tracking-tight">{t.label}</span>

              {/* Alerta pulsando quando pendente */}
              {isPendenteAndAttention && !isActive && (
                <span className="flex items-center gap-1.5 ml-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider shadow-2xs">
                    Preencher
                  </span>
                </span>
              )}

              {/* Ponto indicador de aba ativa */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 dark:bg-orange-500 animate-pulse shrink-0" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
