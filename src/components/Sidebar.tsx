"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GlobalSpotlight } from './GlobalSpotlight';

export function Sidebar() {
  const pathname = usePathname();

  // Variáveis para garantir que ele entenda exatamente qual página está ativa
  const isVisaoGeral = pathname === '/';
  const isNegociacoes = pathname.startsWith('/negociacoes');
  const isLogistica = pathname.startsWith('/logistica');

  return (
    <nav className="flex flex-col gap-2 mt-4 px-4">
      {/* BUSCA RÁPIDA GLOBAL (SPOTLIGHT) */}
      <div className="mb-2">
        <GlobalSpotlight />
      </div>
      
      {/* LINK: VISÃO GERAL */}
      <Link 
        href="/" 
        className={`px-4 py-3 rounded-lg transition-all block ${
          isVisaoGeral 
            ? 'bg-gray-100 shadow-sm font-bold text-gray-900 border-l-4 border-[#f58220]' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        Visão geral
      </Link>

      {/* LINK: NEGOCIAÇÕES */}
      <Link 
        href="/negociacoes" 
        className={`px-4 py-3 rounded-lg transition-all block ${
          isNegociacoes 
            ? 'bg-gray-100 shadow-sm font-bold text-gray-900 border-l-4 border-[#f58220]' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        Negociações
      </Link>

      {/* LINK: LOGÍSTICA & DEADLINES */}
      <Link 
        href="/logistica" 
        className={`px-4 py-3 rounded-lg transition-all block ${
          isLogistica 
            ? 'bg-gray-100 shadow-sm font-bold text-gray-900 border-l-4 border-[#f58220]' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        Logística & Deadlines
      </Link>

      {/* LINKS INATIVOS (EM BREVE) */}
      <div className="px-4 py-3 text-gray-300 text-sm font-medium cursor-not-allowed mt-2">
        Dashboard <span className="text-[10px] uppercase ml-1 opacity-50">Em breve</span>
      </div>
      <div className="px-4 py-3 text-gray-300 text-sm font-medium cursor-not-allowed">
        Documentos <span className="text-[10px] uppercase ml-1 opacity-50">Em breve</span>
      </div>

    </nav>
  );
}