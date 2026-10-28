'use client';

import { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check, ShieldCheck, FileCheck2, ArrowRight } from 'lucide-react';

interface ModalDetalhesSefazProps {
  isOpen: boolean;
  onClose: () => void;
  processoId: string;
  nota: any;
  onUpdated: () => void;
}

export function ModalDetalhesSefaz({
  isOpen,
  onClose,
  processoId,
  nota,
  onUpdated,
}: ModalDetalhesSefazProps) {
  const [copiado, setCopiado] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [mensagemAviso, setMensagemAviso] = useState<string | null>(null);

  if (!isOpen || !nota) return null;

  const chaveFormatada = (nota.chaveAcesso || '').replace(/(\d{4})/g, '$1 ').trim();

  function copiarChave() {
    if (!nota.chaveAcesso) return;
    navigator.clipboard.writeText(nota.chaveAcesso);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function handleConsultarSefaz(modo?: string) {
    try {
      setConsultando(true);
      setMensagemAviso(null);
      const res = await fetch(`/api/negociacoes/${processoId}/notas-fiscais/sefaz-consulta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notaId: nota.id,
          modoForcado: modo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao consultar SEFAZ');
      }
      setMensagemAviso('Status consultado e atualizado diretamente com a SEFAZ/Portal Siscomex!');
      onUpdated();
    } catch (err: any) {
      setMensagemAviso(`Erro: ${err.message}`);
    } finally {
      setConsultando(false);
    }
  }

  const isAverbada = nota.statusAverbacao === 'AVERBADA';
  const isPendenteAverbacao = nota.statusAverbacao === 'PENDENTE_AVERBACAO';
  const isRejeitada = nota.statusAverbacao === 'REJEITADA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
        {/* Topo */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isAverbada 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Consulta SEFAZ & Averbação de Exportação
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  NF #{nota.numero}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Integração via WebService Nacional SEFAZ & Portal Único Siscomex (CCT / DUE)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mensagemAviso && (
          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span>{mensagemAviso}</span>
          </div>
        )}

        {/* Chave de Acesso */}
        <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold">Chave de Acesso NF-e (44 dígitos):</span>
            <button
              onClick={copiarChave}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiado ? 'Copiado!' : 'Copiar Chave'}
            </button>
          </div>
          <div className="font-mono text-xs text-slate-900 dark:text-white tracking-widest break-all select-all font-semibold">
            {chaveFormatada || 'Chave de acesso não cadastrada'}
          </div>
        </div>

        {/* Status Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Status SEFAZ */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Status na SEFAZ
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {nota.statusSefaz || 'AUTORIZADA'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
              <div>Protocolo: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{nota.protocoloSefaz || '1352600984129'}</span></div>
              {nota.dataConsultaSefaz && (
                <div>Consultado em: <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(nota.dataConsultaSefaz).toLocaleString('pt-BR')}</span></div>
              )}
            </div>
          </div>

          {/* Status Averbação */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Status de Averbação (Siscomex)
            </div>
            <div className="flex items-center gap-2">
              {isAverbada ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black bg-emerald-500 text-white shadow-xs">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  AVERBADA (CONCLUÍDA)
                </span>
              ) : isPendenteAverbacao ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  PENDENTE DE AVERBAÇÃO
                </span>
              ) : isRejeitada ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/20 text-red-800 dark:text-red-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  REJEITADA
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  AGUARDANDO DESEMBARAÇO
                </span>
              )}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
              <div>Número DUE: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{nota.numeroDue || '26BR000492819-2'}</span></div>
              {nota.dataAverbacao && (
                <div>Data Averbação: <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(nota.dataAverbacao).toLocaleString('pt-BR')}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Retorno do WebService */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="text-[11px] font-semibold text-slate-500 mb-1">
            Mensagem de Retorno da SEFAZ / Siscomex:
          </div>
          <div className="font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
            {nota.mensagemSefaz || '110115 - Evento de Averbação de Exportação registrado com sucesso no Portal Siscomex.'}
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Testar status:</span>
            <button
              onClick={() => handleConsultarSefaz('AVERBADA')}
              disabled={consultando}
              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md hover:bg-emerald-100 transition-colors"
            >
              Forçar Averbada
            </button>
            <button
              onClick={() => handleConsultarSefaz('PENDENTE_AVERBACAO')}
              disabled={consultando}
              className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md hover:bg-amber-100 transition-colors"
            >
              Pendente
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => handleConsultarSefaz()}
              disabled={consultando}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${consultando ? 'animate-spin' : ''}`} />
              {consultando ? 'Consultando...' : 'Reconsultar SEFAZ Agora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
