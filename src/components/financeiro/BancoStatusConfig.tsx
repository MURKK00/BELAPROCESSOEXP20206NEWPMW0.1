"use client";

import { useState } from 'react';
import { atualizarFinanceiroConfigAction } from '@/server/actions/financeiroActions';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  processoId: string;
  bancoInicial: string;
  statusInicial: string;
  dataRecebimentoInicial?: string | Date | null;
}

export function BancoStatusConfig({
  processoId,
  bancoInicial,
  statusInicial,
  dataRecebimentoInicial,
}: Props) {
  const [bancoDestino, setBancoDestino] = useState(bancoInicial || 'BB BRASIL');
  const [statusRecebimento, setStatusRecebimento] = useState(statusInicial || 'A_RECEBER');
  
  // Formata data inicial para o formato aceito por input[type=date] (YYYY-MM-DD)
  const formatInitialDate = (d?: string | Date | null) => {
    if (!d) return '';
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().split('T')[0];
  };

  const [dataRecebimento, setDataRecebimento] = useState<string>(formatInitialDate(dataRecebimentoInicial));
  const [salvando, setSalvando] = useState(false);

  async function handleUpdate(novoBanco: string, novoStatus: string, novaData?: string) {
    setSalvando(true);
    let dataFinal = novaData !== undefined ? novaData : dataRecebimento;
    
    // Se mudou para RECEBIDO e ainda não tinha data preenchida, sugere a data de hoje automaticamente
    if (novoStatus === 'RECEBIDO' && !dataFinal) {
      dataFinal = new Date().toISOString().split('T')[0];
      setDataRecebimento(dataFinal);
    }

    await atualizarFinanceiroConfigAction(processoId, {
      bancoDestino: novoBanco,
      statusRecebimento: novoStatus,
      dataRecebimento: novoStatus === 'RECEBIDO' ? dataFinal : null,
    });
    setSalvando(false);
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* BANCO DE DESTINO */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Banco de Destino:</label>
        <select 
          value={bancoDestino}
          onChange={(e) => {
            const val = e.target.value;
            setBancoDestino(val);
            handleUpdate(val, statusRecebimento);
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white outline-none focus:border-[#f58220] transition-colors"
        >
          <option value="BB BRASIL">Banco do Brasil (Brasil)</option>
          <option value="BB AMERICA">Banco do Brasil (América / Exterior)</option>
        </select>
        <span className="text-[11px] text-gray-400">Conta e banco para liquidação do contrato de exportação.</span>
      </div>

      {/* STATUS DE RECEBIMENTO & DATA DO RECEBIMENTO */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Status de Pagamento:</label>
          {salvando && <span className="text-xs text-orange-600 font-medium animate-pulse">Salvando...</span>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={statusRecebimento}
            onChange={(e) => {
              const novoStatus = e.target.value;
              setStatusRecebimento(novoStatus);
              handleUpdate(bancoDestino, novoStatus);
            }}
            className={`flex-1 min-w-[140px] border rounded-lg px-3 py-2 text-sm font-bold outline-none shadow-2xs transition-colors cursor-pointer ${
              statusRecebimento === 'RECEBIDO' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            <option value="A_RECEBER">⏳ A Receber</option>
            <option value="RECEBIDO">✓ Recebido</option>
          </select>

          {/* CAMPO DE DATA DO RECEBIMENTO (apenas quando status for RECEBIDO) */}
          {statusRecebimento === 'RECEBIDO' && (
            <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-lg flex-1 min-w-[200px] shadow-2xs">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col flex-1">
                <span className="text-[10px] uppercase font-bold text-emerald-800 leading-none mb-1">
                  Data do Recebimento:
                </span>
                <input
                  type="date"
                  value={dataRecebimento}
                  onChange={(e) => {
                    const dt = e.target.value;
                    setDataRecebimento(dt);
                    handleUpdate(bancoDestino, statusRecebimento, dt);
                  }}
                  className="bg-transparent text-xs font-bold text-emerald-950 outline-none w-full cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {statusRecebimento === 'RECEBIDO' ? (
          <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" /> 
            {dataRecebimento 
              ? `Pagamento liquidado e recebido em ${new Date(dataRecebimento + 'T12:00:00Z').toLocaleDateString('pt-BR')}.`
              : 'Pagamento marcado como recebido.'}
          </p>
        ) : (
          <p className="text-[11px] text-amber-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" /> Aguardando liquidação da ordem de pagamento no exterior.
          </p>
        )}
      </div>
    </div>
  );
}
