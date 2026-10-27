'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { 
  FileText, 
  Printer, 
  ExternalLink, 
  X, 
  Eye
} from 'lucide-react';

interface ContratoPreviewModalProps {
  processoId: string;
  numeroProcesso: string;
  clienteFinal: string;
  produto: string;
  volumeTon: number;
  valorTotalUsd: number;
  incoterm: string;
  fumigacao: boolean;
  importadorPendente: boolean;
}

export function ContratoPreviewModal({
  processoId,
  numeroProcesso,
  clienteFinal,
  importadorPendente,
}: ContratoPreviewModalProps) {
  const [aberto, setAberto] = useState(false);
  const [mounted, setMounted] = useState(false);
  const previewUrl = `/contrato-preview/${processoId}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloqueia scroll do body e trata tecla Escape para fechar modal
  useEffect(() => {
    if (!aberto) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto]);

  return (
    <>
      {/* BOTÃO MINIMALISTA DE ACESSO AO CONTRATO */}
      <div className="flex items-center gap-2">
        <Link
          href={previewUrl}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide shadow-xs hover:shadow transition-all cursor-pointer hover:scale-[1.01]"
          title="Abrir confirmação de negócio para imprimir ou salvar como PDF"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Gerar Confirmação (PDF)</span>
        </Link>
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors cursor-pointer"
          title="Ver prévia rápida nesta tela"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="hidden sm:inline">Visualizar</span>
        </button>
      </div>

      {/* MODAL DE PRÉVIA RÁPIDA - RENDERIZADO VIA PORTAL NO ROOT BODY COM Z-INDEX MÁXIMO */}
      {aberto && mounted && createPortal(
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-fadeIn"
          onClick={() => setAberto(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABEÇALHO DO MODAL */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    Prévia da Confirmação de Negócio (Sales Contract)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Ref: <strong className="font-mono text-slate-700 dark:text-slate-300">{numeroProcesso}</strong> • {clienteFinal}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={previewUrl}
                  target="_blank"
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
                  <span className="sm:hidden">Imprimir</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fechar prévia"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* AVISO SE IMPORTADOR ESTIVER PENDENTE */}
            {importadorPendente && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-5 sm:px-6 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between shrink-0">
                <span>⚠️ Os dados de endereço do importador ainda não foram preenchidos.</span>
                <Link
                  href={`/negociacoes/${processoId}/importador`}
                  className="font-bold underline text-amber-800 dark:text-amber-100 hover:text-amber-950 ml-2 whitespace-nowrap"
                  onClick={() => setAberto(false)}
                >
                  Preencher dados agora →
                </Link>
              </div>
            )}

            {/* CORPO COM IFRAME DA PÁGINA IMPRIMÍVEL */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 overflow-y-auto min-h-0">
              <div className="w-full h-[68vh] bg-white rounded-2xl shadow-inner border border-slate-300 dark:border-slate-800 overflow-hidden">
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-none"
                  title="Prévia do Contrato"
                />
              </div>
            </div>

            {/* RODAPÉ DO MODAL */}
            <div className="px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-850 shrink-0">
              <span className="hidden sm:inline text-slate-500">
                Para baixar em PDF, clique no botão e selecione &quot;Salvar como PDF&quot; no navegador.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Fechar
                </button>
                <Link
                  href={previewUrl}
                  target="_blank"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold hover:opacity-90 flex items-center gap-1.5 cursor-pointer transition-opacity"
                >
                  <span>Abrir em Nova Aba</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
