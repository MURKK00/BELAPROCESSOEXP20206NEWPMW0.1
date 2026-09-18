"use client";

import { useState } from 'react';
import { salvarCustoAction } from '@/server/actions/financeiroActions';

interface CustoItemRowProps {
  processoId: string;
  financeiroId: string;
  categoria: string;
  label: string;
  valorInicial: number;
  percentual: number;
}

export function CustoItemRow({ processoId, financeiroId, categoria, label, valorInicial, percentual }: CustoItemRowProps) {
  const [valor, setValor] = useState(valorInicial ? valorInicial.toString() : '');
  const [loading, setLoading] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function handleSalvar() {
    setLoading(true);
    setSalvo(false);

    try {
      const formData = new FormData();
      formData.append('processoId', processoId);
      formData.append('financeiroId', financeiroId);
      formData.append('categoria', categoria);
      formData.append('valor', valor || '0');

      await salvarCustoAction(formData);
      
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000); // Some o aviso de salvo após 2 segundos
    } catch (error) {
      alert('Erro ao salvar custo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 gap-3">
      <div className="w-1/2">
        <span className="text-xs font-bold uppercase text-gray-700 block">{label}</span>
        <span className="text-[10px] text-gray-400">{percentual.toFixed(1)}% da receita</span>
      </div>

      <div className="flex items-center gap-2 w-1/2 justify-end">
        <input 
          type="number" 
          step="0.01" 
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
          className="w-28 border border-gray-300 rounded px-2 py-1 text-sm font-semibold text-right bg-white outline-none focus:border-[#f58220]" 
        />
        <button 
          type="button" 
          onClick={handleSalvar}
          disabled={loading}
          className={`px-3 py-1 rounded text-xs font-bold transition-colors ${salvo ? 'bg-green-600 text-white' : 'bg-[#1a365d] text-white hover:bg-blue-900'}`}
        >
          {loading ? '...' : salvo ? 'Salvo!' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}