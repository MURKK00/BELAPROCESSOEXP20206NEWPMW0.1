"use client";

import { useState } from 'react';
import { atualizarFinanceiroConfigAction } from '@/server/actions/financeiroActions';

interface Props {
  processoId: string;
  bancoInicial: string;
  statusInicial: string;
}

export function BancoStatusConfig({ processoId, bancoInicial, statusInicial }: Props) {
  const [bancoDestino, setBancoDestino] = useState(bancoInicial || 'BB BRASIL');
  const [statusRecebimento, setStatusRecebimento] = useState(statusInicial || 'A_RECEBER');
  const [salvando, setSalvando] = useState(false);

  async function handleUpdate(novoBanco: string, novoStatus: string) {
    setSalvando(true);
    await atualizarFinanceiroConfigAction(processoId, {
      bancoDestino: novoBanco,
      statusRecebimento: novoStatus
    });
    setSalvando(false);
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Banco de Destino:</label>
        <select 
          value={bancoDestino}
          onChange={(e) => {
            setBancoDestino(e.target.value);
            handleUpdate(e.target.value, statusRecebimento);
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold bg-white outline-none focus:border-[#f58220]"
        >
          <option value="BB BRASIL">Banco do Brasil (Brasil)</option>
          <option value="BB AMERICA">Banco do Brasil (América / Exterior)</option>
        </select>
      </div>

      <div className="flex items-center gap-3 justify-between md:justify-end">
        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Status Pagamento:</label>
        <select 
          value={statusRecebimento}
          onChange={(e) => {
            setStatusRecebimento(e.target.value);
            handleUpdate(bancoDestino, e.target.value);
          }}
          className={`border rounded-lg px-3 py-2 text-sm font-bold outline-none shadow-sm ${
            statusRecebimento === 'RECEBIDO' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}
        >
          <option value="A_RECEBER">⏳ A Receber</option>
          <option value="RECEBIDO">✓ Recebido</option>
        </select>
        {salvando && <span className="text-xs text-gray-400 italic">Salvando...</span>}
      </div>
    </div>
  );
}