"use client";

import { useState } from 'react';
import { adicionarTravamentoAction } from '@/server/actions/financeiroActions';
import { Calendar, DollarSign, CheckCircle, ChevronDown, ChevronUp, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { parseBRLToNumber, formatPTAX } from '@/lib/formatters';

interface Props {
  processoId: string;
  financeiroId: string;
  saldoUsdParaTravar: number;
}

export function FormLancarTrava({ processoId, financeiroId, saldoUsdParaTravar }: Props) {
  const esta100Travado = saldoUsdParaTravar <= 0.001;
  const [aberto, setAberto] = useState<boolean>(!esta100Travado);

  const [dataTrava, setDataTrava] = useState<string>(new Date().toISOString().split('T')[0]);
  const [valorUsd, setValorUsd] = useState<string>(saldoUsdParaTravar > 0 ? saldoUsdParaTravar.toFixed(2) : '');
  const [ptax, setPtax] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);

  const numUsd = parseBRLToNumber(valorUsd);
  const numPtax = parseBRLToNumber(ptax);
  const totalReais = numUsd * numPtax;

  const formatCurrencyBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-xl transition-all duration-200 shadow-2xs overflow-hidden">
      {/* CABEÇALHO RECOLHÍVEL */}
      <div
        onClick={() => setAberto(!aberto)}
        className="p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-colors ${aberto ? 'bg-orange-100 text-[#f58220]' : 'bg-white text-slate-600 shadow-2xs border border-slate-200'}`}>
            <DollarSign className="w-4 h-4 text-[#f58220]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-800">
                Lançamento de Trava Cambial (PTAX Fechada)
              </h3>
              {esta100Travado ? (
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded tracking-wider">
                  Câmbio 100% Travado
                </span>
              ) : (
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded tracking-wider">
                  Trava Aberta
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {esta100Travado
                ? 'Todas as divisas deste contrato já foram travadas. Clique para expandir caso deseje lançar uma nova trava ou ajuste.'
                : `Saldo restante para travar: $ ${saldoUsdParaTravar.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {esta100Travado ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saldo: $0.00</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>${saldoUsdParaTravar.toLocaleString('en-US', { minimumFractionDigits: 2 })} restante</span>
            </span>
          )}

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-colors"
          >
            {aberto ? (
              <>
                <span>Recolher</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>{esta100Travado ? 'Nova Trava' : 'Abrir Formulário'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* FORMULÁRIO COMPLETO QUANDO EXPANDIDO */}
      {aberto && (
        <form
          action={async (formData: FormData) => {
            setEnviando(true);
            try {
              formData.set('valorUsdParcial', numUsd.toString());
              formData.set('ptax', numPtax.toString());
              formData.set('taxa', '0');
              formData.set('moedaTaxa', 'USD');
              await adicionarTravamentoAction(formData);
              // Limpa campos após lançamento com sucesso
              setPtax('');
              setObservacao('');
            } finally {
              setEnviando(false);
            }
          }}
          className="p-5 bg-white border-t border-slate-200 space-y-4"
        >
          <input type="hidden" name="processoId" value={processoId} />
          <input type="hidden" name="financeiroId" value={financeiroId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                Valor USD Travado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 select-none text-xs">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  name="valorUsdParcial"
                  value={valorUsd}
                  onChange={(e) => setValorUsd(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm bg-white font-bold text-gray-900 outline-none focus:border-[#f58220] transition-colors"
                />
              </div>
            </div>

            {/* TAXA PTAX */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Taxa PTAX (Cotação Fixada)
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

          {/* PAINEL DINÂMICO DE PRÉVIA DA CONVERSÃO */}
          {numUsd > 0 && numPtax > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs animate-fadeIn">
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Dólar Travado</span>
                  <span className="font-black text-gray-900 text-sm">${numUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div>
                  <span className="text-blue-600 block text-[10px] uppercase font-semibold">Cotação PTAX</span>
                  <span className="font-mono font-bold text-blue-800 text-sm">R$ {formatPTAX(numPtax)}</span>
                </div>

                <div className="border-l border-gray-200 pl-4">
                  <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Total Convertido em Reais</span>
                  <span className="font-black text-emerald-800 text-base">{formatCurrencyBRL(totalReais)}</span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>As taxas de recebimento bancário/Swift são lançadas diretamente no card de recebimento.</span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={enviando || numUsd <= 0 || numPtax <= 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#f58220] hover:bg-orange-600 text-white font-bold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{enviando ? 'Gravando Trava...' : 'Salvar Trava de Câmbio'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
