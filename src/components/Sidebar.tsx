"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  // Variáveis para garantir que ele entenda exatamente qual página está ativa
  const isVisaoGeral = pathname === '/';
  const isNegociacoes = pathname.startsWith('/negociacoes');

  return (
    <nav className="flex flex-col gap-2 mt-6 px-4">
      
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

      {/* LINKS INATIVOS (EM BREVE) */}
      <div className="px-4 py-3 text-gray-300 text-sm font-medium cursor-not-allowed mt-2">
        Dashboard <span className="text-[10px] uppercase ml-1 opacity-50">Em breve</span>
      </div>
      <div className="px-4 py-3 text-gray-300 text-sm font-medium cursor-not-allowed">
        Logística <span className="text-[10px] uppercase ml-1 opacity-50">Em breve</span>
      </div>
      <div className="px-4 py-3 text-gray-300 text-sm font-medium cursor-not-allowed">
        Documentos <span className="text-[10px] uppercase ml-1 opacity-50">Em breve</span>
      </div>

    </nav>
  );
}