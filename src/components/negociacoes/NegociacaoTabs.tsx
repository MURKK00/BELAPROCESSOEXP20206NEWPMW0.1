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
  MessageSquare 
} from 'lucide-react';

export function NegociacaoTabs({ processoId }: { processoId: string }) {
  const pathname = usePathname();
  const base = `/negociacoes/${processoId}`;
  
  const tabs = [
    { href: base, label: 'Visão Geral', icon: LayoutDashboard },
    { href: `${base}/importador`, label: 'Importador (Buyer)', icon: UserCheck },
    { href: `${base}/checklist`, label: 'Checklist & Etapas', icon: CheckSquare },
    { href: `${base}/financeiro`, label: 'Financeiro & DRE', icon: DollarSign },
    { href: `${base}/containers`, label: 'Contêineres & Lotes', icon: Container },
    { href: `${base}/documentos`, label: 'Documentos', icon: FileSpreadsheet },
    { href: `${base}/auditoria`, label: 'Auditoria', icon: History },
    { href: `${base}/chat`, label: 'Chat', icon: MessageSquare, isChat: true },
  ];

  return (
    <div className="flex w-full items-center bg-gray-100/90 p-1.5 rounded-xl mb-6 gap-1 overflow-x-auto border border-gray-200">
      {tabs.map((t) => {
        const isActive = pathname === t.href;
        const Icon = t.icon;

        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 min-w-fit text-center px-3.5 py-2.5 text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              t.isChat 
                ? 'bg-[#f58220] text-white hover:bg-[#e0751b] font-bold shadow-2xs' 
                : isActive 
                  ? 'bg-white text-gray-900 shadow-2xs font-extrabold border border-gray-200' 
                  : 'text-gray-600 font-semibold hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-secondary' : t.isChat ? 'text-white' : 'text-gray-400'}`} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}