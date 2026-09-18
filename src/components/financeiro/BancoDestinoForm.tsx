"use client";

import { useState } from 'react';
import { salvarBancoDestinoAction } from '@/server/actions/financeiroActions';

export function BancoDestinoForm({ processoId, bancoInicial }: { processoId: string; bancoInicial: string }) {
  const [banco, setBanco] = useState(bancoInicial || 'BB BRASIL');
  const [loading, setLoading] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSalvo(false);

    const formData = new FormData();
    formData.append('processoId', processoId);
    formData.append('bancoDestino', banco);

    await salvarBancoDestinoAction(formData);
    setLoading(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  return (
    <form onSubmit={handleSalvar} className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-700">Banco de Destino:</label>
        <select 
          value={banco}
          onChange={(e) => setBanco(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-bold bg-white outline-none focus:border-[#f58220]"
        >
          <option value="BB BRASIL">Banco do Brasil (Brasil)</option>
          <option value="BB AMERICA">Banco do Brasil (América / Exterior)</option>
        </select>
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${salvo ? 'bg-green-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-900'}`}
      >
        {loading ? 'Salvando...' : salvo ? 'Salvo!' : 'Salvar Banco'}
      </button>
    </form>
  );
}