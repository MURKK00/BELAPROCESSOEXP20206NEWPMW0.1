"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft, Plus } from 'lucide-react';
import { CentralCadastrosModal } from '@/components/cadastros/CentralCadastrosModal';

export default function CadastrosPage() {
  const [modalAberto, setModalAberto] = useState(true);

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <Link 
              href="/"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Voltar ao PEX Cockpit"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#f58220] flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Cadastros & Rastreabilidade do Grão
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestão centralizada de Produtores (CAR / IE), Importadores, Buyers e Armazéns Gerais.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center gap-2 bg-[#f58220] hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Gerenciar Cadastros</span>
          </button>
        </div>
      </div>

      {/* Painel Centralizado via Modal Integrado */}
      <CentralCadastrosModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        tipoInicial="ALL"
      />

      {/* Se o modal for fechado pelo usuário na rota /cadastros, exibe um painel de boas-vindas com botão para reabrir */}
      {!modalAberto && (
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-10 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-[#f58220] flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Central de Cadastros e Rastreabilidade
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Acesse as fichas técnicas de conformidade socioambiental, inscrições estaduais, coordenadas GPS das lavouras e dados de faturamento internacional.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setModalAberto(true)}
              className="inline-flex items-center gap-2 bg-[#f58220] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Abrir Painel de Cadastros</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
            >
              Voltar ao Cockpit
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
