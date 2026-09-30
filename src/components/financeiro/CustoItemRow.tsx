"use client";

import { useState, useEffect } from 'react';
import { salvarCustoAction } from '@/server/actions/financeiroActions';
import { parseBRLToNumber, formatBRLInputString } from '@/lib/formatters';

interface CustoItemRowProps {
  processoId: string;
  financeiroId: string;
  categoria: string;
  label: string;
  valorInicial: number;
  percentual: number;
}

export function CustoItemRow({ processoId, financeiroId, categoria, label, valorInicial, percentual }: CustoItemRowProps) {
  // Inicializa já no formato brasileiro padrão (ex: "595.478,07")
  const [valorStr, setValorStr] = useState<string>(() => formatBRLInputString(valorInicial));
  const [loading, setLoading] = useState(false);
  const [salvo, setSalvo] = useState(false);

  // Sincroniza caso o valor inicial mude por recarregamento da página
  useEffect(() => {
    setValorStr(formatBRLInputString(valorInicial));
  }, [valorInicial]);

  // Intercepta o Ctrl+V para colar do Excel exatamente no padrão brasileiro
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const textoColado = e.clipboardData.getData('text');
    if (!textoColado) return;

    const num = parseBRLToNumber(textoColado);
    if (!isNaN(num) && num > 0) {
      setValorStr(formatBRLInputString(num));
    } else if (textoColado.trim() === '0' || textoColado.trim() === '0,00' || textoColado.trim() === '0.00') {
      setValorStr('0,00');
    } else {
      setValorStr(textoColado.trim());
    }
  }

  // Ao sair do campo (onBlur), formata perfeitamente em BRL
  function handleBlur() {
    if (!valorStr.trim()) return;
    const num = parseBRLToNumber(valorStr);
    if (!isNaN(num) && num > 0) {
      setValorStr(formatBRLInputString(num));
    }
  }

  async function handleSalvar() {
    setLoading(true);
    setSalvo(false);

    try {
      const num = parseBRLToNumber(valorStr);

      const formData = new FormData();
      formData.append('processoId', processoId);
      formData.append('financeiroId', financeiroId);
      formData.append('categoria', categoria);
      formData.append('valor', num.toString()); // Envia número puro para o banco

      await salvarCustoAction(formData);
      
      // Mantém a exibição formatada
      setValorStr(num > 0 ? formatBRLInputString(num) : (valorStr.trim() ? valorStr : ''));
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (error) {
      alert('Erro ao salvar custo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between bg-gray-50/90 hover:bg-gray-100/70 p-3 rounded-xl border border-gray-200/90 gap-3 transition-colors shadow-2xs">
      <div className="flex-1 min-w-0 pr-2">
        <span className="text-xs font-bold uppercase text-gray-800 block truncate" title={label}>
          {label}
        </span>
        <span className="text-[10px] text-gray-500 font-medium">
          {percentual.toFixed(1)}% da receita líquida
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 select-none pointer-events-none">
            R$
          </span>
          <input 
            type="text" 
            inputMode="decimal"
            value={valorStr}
            onChange={(e) => setValorStr(e.target.value)}
            onPaste={handlePaste}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSalvar();
              }
            }}
            placeholder="0,00"
            className="w-36 sm:w-44 border border-gray-300 rounded-lg pl-8 pr-2.5 py-1.5 text-sm font-bold text-right bg-white text-gray-900 outline-none focus:border-[#f58220] focus:ring-2 focus:ring-[#f58220]/20 transition-all shadow-2xs" 
            title="Digite ou cole. Pressione Enter para salvar."
          />
        </div>
        <button 
          type="button" 
          onClick={handleSalvar}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
            salvo 
              ? 'bg-emerald-600 text-white' 
              : 'bg-[#1a365d] text-white hover:bg-blue-900'
          }`}
        >
          {loading ? '...' : salvo ? '✓ Salvo' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
