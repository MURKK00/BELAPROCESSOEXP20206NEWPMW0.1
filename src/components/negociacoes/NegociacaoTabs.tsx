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
  History 
} from 'lucide-react';

interface NegociacaoTabsProps {
  processoId: string;
}

export function NegociacaoTabs({ processoId }: NegociacaoTabsProps) {
  const pathname = usePathname();
  const base = `/negociacoes/${processoId}`;
  
  const tabs = [
    { href: base, label: 'Visão Geral', icon: LayoutDashboard },
    { href: `${base}/importador`, label: 'Importador (Buyer)', icon: UserCheck },
    { href: `${base}/checklist`, label: 'Linha do Tempo & Etapas', icon: CheckSquare },
    { href: `${base}/financeiro`, label: 'Financeiro & DRE', icon: DollarSign },
    { href: `${base}/containers`, label: 'Contêineres & Lotes', icon: Container },
    { href: `${base}/documentos`, label: 'Documentos', icon: FileSpreadsheet },
    { href: `${base}/auditoria`, label: 'Auditoria', icon: History },
  ];

  return (
    <div className="flex w-full items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl mb-6 gap-1 overflow-x-auto border border-slate-200/90 dark:border-slate-700/80 transition-colors">
      {tabs.map((t) => {
        const isActive = pathname === t.href;
        const Icon = t.icon;

        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 min-w-fit text-center px-3.5 py-2.5 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              isActive 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black border border-slate-200/80 dark:border-slate-700' 
                : 'text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
