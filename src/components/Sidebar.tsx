"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Tv2,
  Container,
  FileKey2,
  ChevronDown,
  Gauge,
  Handshake,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  canAccessAdmin,
  canAccessCotacoes,
  canAccessFinanceiro,
  canAccessBackoffice,
  canManageCertificados,
  isBackofficeTvOnly,
} from '@/lib/permissions';

export interface SidebarProps {
  collapsed?: boolean;
  onItemClick?: () => void;
}

interface SidebarLinkItem {
  href: string;
  label: string;
  sublabel?: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  visivel: boolean;
}

export function Sidebar({ collapsed = false, onItemClick }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [localUser, setLocalUser] = useState<any>(null);
  const [pexCockpitAberto, setPexCockpitAberto] = useState<boolean>(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bela_user');
      if (saved) setLocalUser(JSON.parse(saved));
    } catch {}
  }, []);

  const currentUser = session?.user || localUser;

  const isVisaoGeral = pathname === '/';
  const isCadastros = pathname.startsWith('/cadastros');
  const isNegociacoes = pathname.startsWith('/negociacoes');
  const isLogistica = pathname.startsWith('/logistica');
  const isFinanceiro = pathname.startsWith('/financeiro');
  const isNotasFiscais = pathname.startsWith('/notas-fiscais');
  const isCotacoes = pathname.startsWith('/cotacoes');
  const isBackoffice = pathname.startsWith('/backoffice');
  const isCertificados = pathname.startsWith('/certificados');
  const isAdmin = pathname.startsWith('/admin');

  const tvOnly = isBackofficeTvOnly(currentUser);

  const pexCockpitSublinks: SidebarLinkItem[] = [
    {
      href: '/',
      label: 'Visão Geral',
      active: isVisaoGeral,
      icon: LayoutDashboard,
      visivel: !tvOnly,
    },
    {
      href: '/negociacoes',
      label: 'Negociações',
      active: isNegociacoes,
      icon: Handshake,
      visivel: !tvOnly,
    },
    {
      href: '/cadastros',
      label: 'Cadastro & Rastreabilidade',
      active: isCadastros,
      icon: Compass,
      visivel: !tvOnly,
    },
    {
      href: '/logistica',
      label: 'PEX Box & Tracking',
      active: isLogistica,
      icon: Container,
      visivel: !tvOnly,
    },
  ];

  const pexCockpitAtivo = pexCockpitSublinks.some((item) => item.active);

  // Garante abertura automática do grupo PEX Cockpit quando uma de suas rotas está ativa
  useEffect(() => {
    if (pexCockpitAtivo) {
      setPexCockpitAberto(true);
    }
  }, [pexCockpitAtivo]);

  const outrosLinks: SidebarLinkItem[] = [
    {
      href: '/financeiro',
      label: 'Financeiro',
      active: isFinanceiro,
      icon: DollarSign,
      visivel: !tvOnly && canAccessFinanceiro(currentUser),
    },
    {
      href: '/notas-fiscais',
      label: 'Notas Fiscais',
      active: isNotasFiscais,
      icon: FileSpreadsheet,
      visivel: !tvOnly,
    },
    {
      href: '/cotacoes',
      label: 'Cotações Mercado',
      active: isCotacoes,
      icon: TrendingUp,
      visivel: !tvOnly && canAccessCotacoes(currentUser),
    },
    {
      href: '/backoffice',
      label: 'BackOffice Cockpit',
      sublabel: '(Disponível para visualização apenas em perfis ADMIN e BackOffice TV)',
      active: isBackoffice,
      icon: Tv2,
      visivel: canAccessBackoffice(currentUser),
    },
    {
      href: '/certificados',
      label: 'Certificados Digitais',
      active: isCertificados,
      icon: FileKey2,
      visivel: !tvOnly && canManageCertificados(currentUser),
    },
    {
      href: '/admin',
      label: 'Painel Admin',
      active: isAdmin,
      icon: ShieldCheck,
      visivel: !tvOnly && canAccessAdmin(currentUser),
    },
  ];

  const sublinksVisiveis = pexCockpitSublinks.filter((l) => l.visivel);
  const outrosVisiveis = outrosLinks.filter((l) => l.visivel);

  const renderLinkItem = (link: SidebarLinkItem, isChild = false) => {
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={onItemClick}
        title={
          collapsed
            ? link.sublabel
              ? `${link.label} ${link.sublabel}`
              : link.label
            : undefined
        }
        className={`flex rounded-xl text-xs transition-all ${
          collapsed
            ? 'items-center justify-center p-3 relative group font-semibold'
            : link.sublabel
              ? 'items-start gap-3 px-3.5 py-2.5 font-semibold'
              : isChild
                ? 'items-center gap-2.5 px-3 py-2 font-semibold'
                : 'items-center gap-3 px-3.5 py-2.5 font-semibold'
        } ${
          link.active
            ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors ${
            link.sublabel ? 'mt-0.5' : ''
          } ${
            link.active
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
          }`}
        />

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="truncate">{link.label}</div>
            {link.sublabel && (
              <div
                className={`text-[10px] leading-snug font-normal mt-0.5 ${
                  link.active
                    ? 'text-emerald-700/80 dark:text-emerald-300/80'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {link.sublabel}
              </div>
            )}
          </div>
        )}

        {collapsed && (
          <div className="hidden group-hover:flex flex-col absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-700 pointer-events-none">
            <span>{link.label}</span>
            {link.sublabel && (
              <span className="text-[10px] font-normal text-slate-300 mt-0.5">
                {link.sublabel}
              </span>
            )}
          </div>
        )}
      </Link>
    );
  };

  return (
    <nav className={`flex flex-col gap-1.5 mt-2 ${collapsed ? 'px-2' : 'px-3'}`}>
      {/* Grupo principal: PEX Cockpit */}
      {sublinksVisiveis.length > 0 && (
        collapsed ? (
          <div className="flex flex-col gap-1.5 pb-1.5 border-b border-slate-200/70 dark:border-slate-800/80">
            {sublinksVisiveis.map((sublink) => renderLinkItem(sublink, true))}
          </div>
        ) : (
          <div className="flex flex-col gap-1 pb-1.5 border-b border-slate-200/70 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setPexCockpitAberto((prev) => !prev)}
              aria-expanded={pexCockpitAberto}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                pexCockpitAtivo
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Gauge
                className={`w-4 h-4 shrink-0 ${
                  pexCockpitAtivo
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span className="flex-1 text-left truncate">PEX Cockpit</span>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                  pexCockpitAberto ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {pexCockpitAberto && (
              <div className="ml-3.5 pl-2.5 border-l border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                {sublinksVisiveis.map((sublink) => renderLinkItem(sublink, true))}
              </div>
            )}
          </div>
        )
      )}

      {/* Demais módulos na ordem definida */}
      {outrosVisiveis.map((link) => renderLinkItem(link))}
    </nav>
  );
}
