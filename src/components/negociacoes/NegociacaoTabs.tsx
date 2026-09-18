"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NegociacaoTabs({ processoId }: { processoId: string }) {
  const pathname = usePathname();
  const base = `/negociacoes/${processoId}`;
  
  const tabs = [
    { href: base, label: 'Visão geral' },
    { href: `${base}/importador`, label: 'Dados do Importador' },
    { href: `${base}/checklist`, label: 'Checklist' },
    { href: `${base}/financeiro`, label: 'Financeiro' },
    { href: `${base}/containers`, label: 'Contêineres' },
    { href: `${base}/documentos`, label: 'Documentos' },
    { href: `${base}/auditoria`, label: 'Auditoria' },
    { href: `${base}/chat`, label: 'Chat Interno', isChat: true },
  ];

  return (
    <div className="flex w-full justify-between items-center bg-gray-100 p-2 rounded-xl mb-6 gap-2 overflow-x-auto">
      {tabs.map((t) => {
        const isActive = pathname === t.href;

        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 text-center px-3 py-3 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap 
              ${
                t.isChat 
                  ? 'bg-[#f58220] text-white hover:bg-[#e0751b] shadow-sm font-bold' 
                  : isActive 
                    ? 'bg-gray-600 text-white shadow-sm font-bold' // ← CINZA NEUTRO AQUI
                    : 'text-gray-600 font-semibold hover:text-gray-900 hover:bg-gray-200'
              }`}
          >
            {t.isChat && <span>💬</span>}
            <span>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}