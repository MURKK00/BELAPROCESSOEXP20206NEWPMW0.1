"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Users, Compass, BookOpen } from 'lucide-react';
import { CentralCadastrosModal } from '@/components/cadastros/CentralCadastrosModal';

export function VisaoGeralHeaderActions() {
  const [modalCadastrosAberto, setModalCadastrosAberto] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setModalCadastrosAberto(true)}
          className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-[#f58220] hover:text-[#f58220] text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
          title="Cadastrar e gerenciar Produtores (CAR / IE), Importadores e Buyers"
        >
          <Compass className="w-4 h-4 text-[#f58220]" />
          <span>Cadastros & Rastreabilidade</span>
        </button>

        <Link
          href="/negociacoes/nova"
          className="inline-flex items-center gap-2 bg-[#f58220] hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Negociação</span>
        </Link>
      </div>

      <CentralCadastrosModal
        isOpen={modalCadastrosAberto}
        onClose={() => setModalCadastrosAberto(false)}
        tipoInicial="ALL"
      />
    </>
  );
}
