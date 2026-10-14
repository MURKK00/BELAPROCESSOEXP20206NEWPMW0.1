"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Handshake, DollarSign, TrendingUp } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const isVisaoGeral = pathname === '/';
  const isNegociacoes = pathname.startsWith('/negociacoes');
  const isFinanceiro = pathname.startsWith('/financeiro');
  const isCotacoes = pathname.startsWith('/cotacoes');

  const links = [
    {
      href: '/',
      label: 'Visão Geral',
      active: isVisaoGeral,
      icon: LayoutDashboard,
    },
    {
      href: '/negociacoes',
      label: 'Negociações',
      active: isNegociacoes,
      icon: Handshake,
    },
    {
      href: '/financeiro',
      label: 'Financeiro',
      active: isFinanceiro,
      icon: DollarSign,
    },
    {
      href: '/cotacoes',
      label: 'Cotações Mercado',
      active: isCotacoes,
      icon: TrendingUp,
      badge: 'LIVE',
    },
  ];

  return (
    <nav className="flex flex-col gap-1.5 mt-5 px-3">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
              link.active
                ? 'bg-orange-500/10 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                link.active
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <span className="flex-1">{link.label}</span>
            {link.badge && (
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                {link.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
