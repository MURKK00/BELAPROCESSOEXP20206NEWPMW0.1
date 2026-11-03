"use client";

import { useRef, useState, useEffect } from 'react';
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
  Compass,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';

interface NegociacaoTabsProps {
  processoId: string;
  importadorPendente?: boolean;
}

export function NegociacaoTabs({ processoId, importadorPendente = false }: NegociacaoTabsProps) {
  const pathname = usePathname();
  const base = `/negociacoes/${processoId}`;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  const [podeRolarEsquerda, setPodeRolarEsquerda] = useState(false);
  const [podeRolarDireita, setPodeRolarDireita] = useState(false);

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
      label: 'Importador', 
      sublabel: '(Buyer)',
      tag: 'Consignee',
      icon: UserCheck,
      color: 'text-purple-500' 
    },
    { 
      href: `${base}/rastreabilidade`, 
      label: 'Rastreabilidade', 
      tag: 'Origem CAR',
      icon: Compass,
      color: 'text-amber-500' 
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

  // Identifica a aba ativa para destacar no cabeçalho
  const abaAtivaAtual = tabs.find((t) => t.href === pathname) || tabs[0];

  // Verifica status do scroll para exibir botões de navegação lateral
  const verificarScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setPodeRolarEsquerda(el.scrollLeft > 10);
    setPodeRolarDireita(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    verificarScroll();
    window.addEventListener('resize', verificarScroll);
    return () => window.removeEventListener('resize', verificarScroll);
  }, []);

  // Faz scroll automático suave para a aba ativa para nunca ficar cortada
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
    verificarScroll();
  }, [pathname]);

  const rolarPara = (direcao: 'esquerda' | 'direita') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distancia = direcao === 'esquerda' ? -260 : 260;
    el.scrollBy({ left: distancia, behavior: 'smooth' });
    setTimeout(verificarScroll, 350);
  };

  return (
    <nav 
      aria-label="Navegação da negociação"
      className="mb-6 relative z-10 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700/80 rounded-3xl p-3 sm:p-3.5 shadow-md shadow-slate-200/60 dark:shadow-slate-950/40 transition-all"
    >
      {/* LINHA SUPERIOR DE DESTAQUE: TÍTULO DO BOX E STATUS DA ABA */}
      <div className="flex items-center justify-between px-2 pb-2.5 mb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#f58220]/10 text-[#f58220] border border-[#f58220]/20">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Navegação da Negociação
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            • 9 Módulos Operacionais
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicador da Aba Ativa */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#f58220] animate-pulse"></span>
            <span>Ativo: <strong>{abaAtivaAtual.label}</strong></span>
          </div>

          {/* Botões de Scroll Lateral quando houver overflow */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => rolarPara('esquerda')}
              disabled={!podeRolarEsquerda}
              aria-label="Rolar abas para a esquerda"
              className={`p-1.5 rounded-xl border transition-all ${
                podeRolarEsquerda
                  ? 'bg-slate-100 hover:bg-[#f58220] hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 cursor-pointer shadow-xs'
                  : 'opacity-30 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed'
              }`}
              title="Rolar abas para a esquerda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => rolarPara('direita')}
              disabled={!podeRolarDireita}
              aria-label="Rolar abas para a direita"
              className={`p-1.5 rounded-xl border transition-all ${
                podeRolarDireita
                  ? 'bg-slate-100 hover:bg-[#f58220] hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 cursor-pointer shadow-xs'
                  : 'opacity-30 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed'
              }`}
              title="Rolar abas para a direita"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ESTEIRA DE ABAS HORIZONTAIS */}
      <div 
        ref={scrollContainerRef}
        onScroll={verificarScroll}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
      >
        {tabs.map((t) => {
          const isActive = pathname === t.href;
          const isImportadorTab = t.href.endsWith('/importador');
          const isPendenteAndAttention = isImportadorTab && importadorPendente;
          const Icon = t.icon;

          return (
            <Link
              key={t.href}
              href={t.href}
              ref={isActive ? activeTabRef : undefined}
              title={
                isPendenteAndAttention 
                  ? 'Atenção: Os dados do Importador (Buyer) ainda não foram preenchidos! Clique aqui para preencher.' 
                  : `${t.label} - ${t.tag}`
              }
              className={`group relative shrink-0 px-3.5 py-2.5 rounded-2xl transition-all flex items-center gap-2 text-xs select-none border ${
                isActive 
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-black shadow-md border-slate-950 dark:border-white ring-2 ring-[#f58220]/40' 
                  : isPendenteAndAttention
                  ? 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border-2 border-amber-500 animate-pulse font-black shadow-md shadow-amber-500/20 ring-2 ring-amber-400/60'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-slate-200/90 dark:border-slate-700/60 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {/* Ícone com destaque colorido temático */}
              <span className={`p-1 rounded-lg transition-transform group-hover:scale-110 shrink-0 ${
                isActive 
                  ? 'bg-white/20 dark:bg-slate-900/20 text-[#f58220]' 
                  : isPendenteAndAttention
                  ? 'bg-amber-500 text-white animate-bounce shadow-xs'
                  : `${t.color} bg-white dark:bg-slate-900 shadow-2xs border border-slate-200/60 dark:border-slate-700/60`
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </span>

              {/* Rótulo da Aba */}
              <span className="whitespace-nowrap tracking-tight font-extrabold">
                {t.label}
              </span>

              {/* Subrótulo opcional */}
              {t.sublabel && !isPendenteAndAttention && (
                <span className={`text-[10px] font-semibold -ml-0.5 ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                  {t.sublabel}
                </span>
              )}

              {/* Alerta pulsando quando dados do importador estão pendentes */}
              {isPendenteAndAttention && !isActive && (
                <span className="flex items-center gap-1 ml-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider shadow-2xs">
                    Preencher
                  </span>
                </span>
              )}

              {/* Indicador luminoso de aba ativa */}
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-[#f58220] animate-pulse shrink-0 ml-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
