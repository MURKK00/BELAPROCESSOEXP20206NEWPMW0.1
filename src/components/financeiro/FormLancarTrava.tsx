"use client";

import { useState } from 'react';
import { adicionarTravamentoAction } from '@/server/actions/financeiroActions';
import { Calendar, DollarSign, Percent, ArrowDownRight, CheckCircle } from 'lucide-react';
import { parseBRLToNumber, formatPTAX } from '@/lib/formatters';

interface Props {
  processoId: string;
  financeiroId: string;
  saldoUsdParaTravar: number;
}

export function FormLancarTrava({ processoId, financeiroId, saldoUsdParaTravar }: Props) {
  const [dataTrava, setDataTrava] = useState<string>(new Date().toISOString().split('T')[0]);
  const [valorUsd, setValorUsd] = useState<string>(saldoUsdParaTravar > 0 ? saldoUsdParaTravar.toFixed(2) : '');
  const [ptax, setPtax] = useState<string>('');
  const [taxa, setTaxa] = useState<string>('0');
  const [moedaTaxa, setMoedaTaxa] = useState<'USD' | 'BRL'>('USD');
  const [observacao, setObservacao] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);

  const numUsd = parseBRLToNumber(valorUsd);
  const numPtax = parseBRLToNumber(ptax);
  const numTaxa = parseBRLToNumber(taxa);

  // Se a taxa for em USD: subtrai do USD antes de multiplicar pela PTAX
  // Exemplo: (214.424,66 USD - 40 USD) = 214.384,66 USD × 5,1360 = R$ 1.101.079,61
  const usdLiquido = moedaTaxa === 'USD' ? Math.max(0, numUsd - numTaxa) : numUsd;
  const taxaEmBrl = moedaTaxa === 'USD' ? numTaxa * numPtax : numTaxa;
  const valorBruto = numUsd * numPtax;
  const valorLiquido = moedaTaxa === 'USD' ? usdLiquido * numPtax : Math.max(0, valorBruto - numTaxa);

  const formatCurrencyBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <form
      action={async (formData: FormData) => {
        setEnviando(true);
        try {
          formData.set('valorUsdParcial', numUsd.toString());
          formData.set('ptax', numPtax.toString());
          formData.set('taxa', numTaxa.toString());
          await adicionarTravamentoAction(formData);
          // Limpa campos após lançamento com sucesso
          setPtax('');
          setTaxa('0');
          setObservacao('');
        } finally {
          setEnviando(false);
        }
      }}
      className="bg-gray-50/80 p-5 rounded-xl border border-gray-200 space-y-4"
    >
      <input type="hidden" name="processoId" value={processoId} />
      <input type="hidden" name="financeiroId" value={financeiroId} />
      <input type="hidden" name="moedaTaxa" value={moedaTaxa} />

      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-[#f58220]" /> Novo Lançamento de Trava de Câmbio
        </span>
        <span className="text-xs text-gray-500">
          Saldo restante: <strong className="text-gray-800">${saldoUsdParaTravar.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        {/* DATA DA TRAVA */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-500" /> Data da Trava
          </label>
          <input
            type="date"
            name="dataTrava"
            value={dataTrava}
            onChange={(e) => setDataTrava(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-medium outline-none focus:border-[#f58220] transition-colors"
          />
        </div>

        {/* VALOR USD */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Valor USD
          </label>
          <input
            type="text"
            inputMode="decimal"
            name="valorUsdParcial"
            value={valorUsd}
            onChange={(e) => setValorUsd(e.target.value)}
            required
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-bold text-gray-900 outline-none focus:border-[#f58220] transition-colors"
          />
        </div>

        {/* TAXA PTAX */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Taxa PTAX (até 7 casas decimais)
          </label>
          <input
            type="text"
            inputMode="decimal"
            name="ptax"
            value={ptax}
            onChange={(e) => setPtax(e.target.value)}
            required
            placeholder="Ex: 5,1500727"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-bold text-blue-600 outline-none focus:border-[#f58220] transition-colors"
          />
        </div>

        {/* TAXA BANCÁRIA COBRADA COM SELETOR DE MOEDA (USD / BRL) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-red-500" /> Taxa Cobrada
            </label>
            <div className="inline-flex rounded p-0.5 bg-gray-200 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setMoedaTaxa('USD')}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  moedaTaxa === 'USD' ? 'bg-[#f58220] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Cobrada em Dólar (deduz do USD antes da PTAX)"
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setMoedaTaxa('BRL')}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  moedaTaxa === 'BRL' ? 'bg-[#f58220] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Cobrada em Reais (deduz em R$)"
              >
                BRL (R$)
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              name="taxa"
              value={taxa}
              onChange={(e) => setTaxa(e.target.value)}
              placeholder="0,00"
              className="w-full border border-gray-300 rounded-lg pl-3 pr-12 py-2 text-sm bg-white font-medium text-red-600 outline-none focus:border-[#f58220] transition-colors"
            />
            <span className="absolute right-3 top-2 text-xs font-bold text-gray-400 pointer-events-none">
              {moedaTaxa}
            </span>
          </div>
        </div>

        {/* OBSERVAÇÃO */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Observação
          </label>
          <input
            type="text"
            name="observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: Trava BB 50%"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#f58220] transition-colors"
          />
        </div>
      </div>

      {/* PAINEL DINÂMICO DE PRÉVIA DO VALOR LÍQUIDO */}
      {numUsd > 0 && numPtax > 0 && (
        <div className="bg-white p-3.5 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-semibold">Valor Bruto Câmbio</span>
              <span className="font-bold text-gray-800 text-sm">{formatCurrencyBRL(valorBruto)}</span>
              <span className="text-[10px] text-gray-400 block">${numUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="text-red-600">
              <span className="text-red-500 block text-[10px] uppercase font-semibold">(-) Taxa Bancária</span>
              <span className="font-bold text-sm">
                {numTaxa > 0 
                  ? (moedaTaxa === 'USD' ? `- $ ${numTaxa.toFixed(2)} (- ${formatCurrencyBRL(taxaEmBrl)})` : `- ${formatCurrencyBRL(numTaxa)}`)
                  : 'R$ 0,00'}
              </span>
            </div>

            {moedaTaxa === 'USD' && numTaxa > 0 && (
              <div className="bg-blue-50/70 border border-blue-100 px-3 py-1 rounded-md">
                <span className="text-blue-700 block text-[10px] uppercase font-bold">(=) USD Líquido</span>
                <span className="font-extrabold text-blue-900 text-sm">
                  ${usdLiquido.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="border-l border-gray-200 pl-4">
              <span className="text-emerald-700 block text-[10px] uppercase font-bold">(=) Valor Líquido Total</span>
              <span className="font-extrabold text-emerald-700 text-base">{formatCurrencyBRL(valorLiquido)}</span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 italic max-w-md">
            {moedaTaxa === 'USD' && numTaxa > 0 
              ? `* A taxa de $ ${numTaxa.toFixed(2)} foi descontada do montante em USD ($ ${usdLiquido.toLocaleString('en-US', { minimumFractionDigits: 2 })}) × ${formatPTAX(numPtax)} = ${formatCurrencyBRL(valorLiquido)}.`
              : `* A taxa de ${formatCurrencyBRL(numTaxa)} é descontada diretamente do total em reais.`}
          </div>
        </div>
      )}

      {/* BOTÃO DE CONFIRMAR LANÇAMENTO */}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={enviando || numUsd <= 0 || numPtax <= 0}
          className="bg-[#f58220] hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          {enviando ? (
            <>Salvando Trava...</>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" /> Lançar Trava com Valor Líquido
            </>
          )}
        </button>
      </div>
    </form>
  );
}
