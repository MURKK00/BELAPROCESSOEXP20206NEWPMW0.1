'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { formatarFinalidadeCertificado } from '@/lib/certificadosUtils';

export interface CertificadoExclusaoAlvo {
  id: string;
  titular: string;
  tipo: string;
  documentoFormatado: string;
  finalidade: string;
}

interface ModalExcluirCertificadoProps {
  alvo: CertificadoExclusaoAlvo | null;
  onClose: () => void;
  onConfirmado: (mensagem: string) => void;
}

export function ModalExcluirCertificado({
  alvo,
  onClose,
  onConfirmado,
}: ModalExcluirCertificadoProps) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!alvo) return null;

  const handleConfirmar = async () => {
    setErro(null);
    setExcluindo(true);
    try {
      const res = await fetch(`/api/certificados/${alvo.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data?.error || 'Não foi possível excluir o certificado.');
        return;
      }
      onConfirmado(
        `Certificado de ${alvo.titular} (${alvo.documentoFormatado}) excluído permanentemente.`
      );
      onClose();
    } catch {
      setErro('Erro de rede ao tentar excluir o certificado.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-excluir-cert-titulo"
    >
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2
              id="modal-excluir-cert-titulo"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Excluir Certificado Digital
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={excluindo}
            aria-label="Cancelar exclusão"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Tem certeza que deseja excluir permanentemente este certificado A1? Esta ação removerá o arquivo criptografado e a senha do cofre e ficará registrada no histórico de auditoria.
          </p>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {alvo.titular}
            </div>
            <div className="text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              {alvo.tipo}: {alvo.documentoFormatado} · {formatarFinalidadeCertificado(alvo.finalidade)}
            </div>
          </div>

          {erro && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
              {erro}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={excluindo}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={excluindo}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white whitespace-nowrap"
            >
              {excluindo ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {excluindo ? 'Excluindo...' : 'Excluir Definitivamente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
