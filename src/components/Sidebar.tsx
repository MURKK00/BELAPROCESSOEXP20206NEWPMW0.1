"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Compass, Handshake, FileSpreadsheet, DollarSign, TrendingUp, ShieldCheck, Tv2, Container, FileKey2 } from 'lucide-react';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  canAccessAdmin, 
  canAccessCotacoes, 
  canAccessFinanceiro,
  canAccessBackoffice,
  canManageCertificados,
  isBackofficeTvOnly
} from '@/lib/permissions';

export interface SidebarProps {
  collapsed?: boolean;
  onItemClick?: () => void;
}

export function Sidebar({ collapsed = false, onItemClick }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [localUser, setLocalUser] = useState<any>(null);

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
  const isNotasFiscais = pathname.startsWith('/notas-fiscais');
  const isFinanceiro = pathname.startsWith('/financeiro');
  const isCotacoes = pathname.startsWith('/cotacoes');
  const isBackoffice = pathname.startsWith('/backoffice');
  const isCertificados = pathname.startsWith('/certificados');
  const isAdmin = pathname.startsWith('/admin');

  const tvOnly = isBackofficeTvOnly(currentUser);

  // Filtragem de links por permissão (sem nenhum badge/card ao lado dos nomes)
  const allLinks = [
    {
      href: '/',
      label: 'PEX Cockpit',
      active: isVisaoGeral,
      icon: LayoutDashboard,
      visivel: !tvOnly,
    },
    {
      href: '/cadastros',
      label: 'Cadastros & Rastreabilidade',
      active: isCadastros,
      icon: Compass,
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
      href: '/logistica',
      label: 'PEX Box & Tracking',
      active: isLogistica,
      icon: Container,
      visivel: !tvOnly,
    },
    {
      href: '/notas-fiscais',
      label: 'Notas Fiscais',
      active: isNotasFiscais,
      icon: FileSpreadsheet,
      visivel: !tvOnly,
    },
    {
      href: '/financeiro',
      label: 'Financeiro',
      active: isFinanceiro,
      icon: DollarSign,
      visivel: !tvOnly && canAccessFinanceiro(currentUser),
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
      label: 'Backoffice Cockpit',
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

  const links = allLinks.filter((l) => l.visivel);

  return (
    <nav className={`flex flex-col gap-1.5 mt-2 ${collapsed ? 'px-2' : 'px-3'}`}>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onItemClick}
            title={collapsed ? link.label : undefined}
            className={`flex items-center rounded-xl font-semibold text-xs transition-all ${
              collapsed
                ? 'justify-center p-3 relative group'
                : 'gap-3 px-3.5 py-2.5'
            } ${
              link.active
                ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                link.active
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
              }`}
            />
            
            {!collapsed && <span className="flex-1 truncate">{link.label}</span>}

            {/* Tooltip flutuante discreto em modo recolhido no desktop */}
            {collapsed && (
              <div className="hidden group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-700 items-center gap-1.5 pointer-events-none">
                <span>{link.label}</span>
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
