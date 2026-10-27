'use client';

import { Printer, Edit3, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface ContratoPrintControlsProps {
  processoId: string;
}

export function ContratoPrintControls({ processoId }: ContratoPrintControlsProps) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/negociacoes/${processoId}/importador`}
        className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
      >
        <Edit3 className="w-3.5 h-3.5 text-orange-500" />
        <span>Editar Dados</span>
      </Link>

      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.print();
          }
        }}
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
        title="Imprimir ou salvar confirmação de negócio em PDF"
      >
        <Printer className="w-4 h-4" />
        <span>Imprimir / Salvar PDF</span>
      </button>

      <button
        type="button"
        onClick={() => setShowTip(!showTip)}
        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs transition-colors"
        title="Dicas para salvar PDF limpo sem cabeçalhos do navegador"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {showTip && (
        <div className="absolute right-4 top-20 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 shadow-xl text-[11px] text-slate-600 dark:text-slate-300 animate-fadeIn">
          <p className="font-bold text-slate-900 dark:text-white mb-1">
            📄 Como salvar um PDF perfeito:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
            <li>No diálogo de impressão, selecione <strong>&quot;Salvar como PDF&quot;</strong>.</li>
            <li>O documento já inclui o número oficial de páginas no rodapé de cada folha.</li>
            <li>Em <em>Mais definições</em>, certifique-se de que a opção <strong>&quot;Cabeçalhos e rodapés&quot;</strong> do navegador esteja desmarcada para evitar links/datas automáticas.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
