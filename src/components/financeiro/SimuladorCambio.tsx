'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

interface SimuladorCambioProps {
  saldoUsdParaTravar: number;
  totalUsdTravado: number;
  ptaxMedia: number;
  receitaBrutaAtualBRL: number;
  totalCustosBRL: number;
  resultadoAtualBRL: number;
  margemAtual: number;
}

export function SimuladorCambio({
  saldoUsdParaTravar,
  totalUsdTravado,
  ptaxMedia,
  receitaBrutaAtualBRL,
  totalCustosBRL,
  resultadoAtualBRL,
  margemAtual,
}: SimuladorCambioProps) {
  // PTAX simulada para a fatia de dólares AINDA EM ABERTO
  const ptaxBase = ptaxMedia > 0 ? ptaxMedia : 5.45;
  const [ptaxSimulada, setPtaxSimulada] = useState<number>(ptaxBase);

  // Se já tiver 100% travado, o simulador permite testar cenários hipotéticos gerais
  const temSaldoAberto = saldoUsdParaTravar > 0.01;

  // Cálculos no cenário simulado:
  // Se tem saldo aberto: (totalUsdTravado * ptaxMedia) + (saldoUsdParaTravar * ptaxSimulada)
  // Se não tem saldo aberto: simula o impacto caso o contrato todo tivesse sido fechado nessa taxa
  const receitaSimuladaBRL = temSaldoAberto
    ? totalUsdTravado * ptaxMedia + saldoUsdParaTravar * ptaxSimulada
    : (totalUsdTravado > 0 ? totalUsdTravado : 100000) * ptaxSimulada;

  const resultadoSimuladoBRL = receitaSimuladaBRL - totalCustosBRL;
  const margemSimulada = receitaSimuladaBRL > 0 ? (resultadoSimuladoBRL / receitaSimuladaBRL) * 100 : 0;
  const diferencaResultadoBRL = resultadoSimuladoBRL - resultadoAtualBRL;

  // Variações rápidas (-10%, -5%, Atual, +5%, +10%)
  const cenariosPredefinidos = [
    { label: '-10%', taxa: Number((ptaxBase * 0.9).toFixed(4)) },
    { label: '-5%', taxa: Number((ptaxBase * 0.95).toFixed(4)) },
    { label: 'Base', taxa: Number(ptaxBase.toFixed(4)) },
    { label: '+5%', taxa: Number((ptaxBase * 1.05).toFixed(4)) },
    { label: '+10%', taxa: Number((ptaxBase * 1.1).toFixed(4)) },
  ];

  // Cálculo da PTAX de Ponto de Equilíbrio (Break-Even):
  // Qual PTAX no saldo aberto faria o resultado da operação ser R$ 0,00?
  // totalUsdTravado * ptaxMedia + saldoUsdParaTravar * ptaxBE = totalCustosBRL
  let ptaxBreakEven: number | null = null;
  if (temSaldoAberto) {
    const custoRestante = totalCustosBRL - totalUsdTravado * ptaxMedia;
    ptaxBreakEven = custoRestante > 0 ? custoRestante / saldoUsdParaTravar : 0;
  }

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const formatUSD = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded-lg text-secondary">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Simulador de Câmbio & Sensibilidade de Margem
            </h3>
            <p className="text-xs text-gray-500">
              {temSaldoAberto
                ? `Simule o impacto da taxa PTAX no saldo ainda em aberto de ${formatUSD(saldoUsdParaTravar)}.`
                : 'Câmbio 100% travado. Simulação hipotética para benchmarking cambial.'}
            </p>
          </div>
        </div>

        {temSaldoAberto ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{formatUSD(saldoUsdParaTravar)} exposto a oscilação</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% protegido contra risco cambial</span>
          </span>
        )}
      </div>

      {/* PAINEL DE CONTROLE DA TAXA SIMULADA */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="w-full lg:w-1/2">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Taxa PTAX Simulada para Fechamento:
              </label>
              <span className="text-base font-extrabold text-blue-700">
                R$ {ptaxSimulada.toFixed(4)}
              </span>
            </div>
            <input
              type="range"
              min={Number((ptaxBase * 0.75).toFixed(2))}
              max={Number((ptaxBase * 1.25).toFixed(2))}
              step="0.01"
              value={ptaxSimulada}
              onChange={(e) => setPtaxSimulada(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#f58220]"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>R$ {(ptaxBase * 0.75).toFixed(2)}</span>
              <span>Base: R$ {ptaxBase.toFixed(4)}</span>
              <span>R$ {(ptaxBase * 1.25).toFixed(2)}</span>
            </div>
          </div>

          {/* Botões de cenários rápidos */}
          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-end">
            <span className="text-xs text-gray-500 font-semibold mr-1">Cenários:</span>
            {cenariosPredefinidos.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setPtaxSimulada(c.taxa)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                  Math.abs(ptaxSimulada - c.taxa) < 0.005
                    ? 'bg-secondary text-white border-secondary shadow-xs'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {c.label} ({c.taxa.toFixed(2)})
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPtaxSimulada(ptaxBase)}
              title="Restaurar taxa base"
              className="p-1 text-gray-400 hover:text-gray-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CARDS COMPARATIVOS: ATUAL VS SIMULADO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Receita Bruta */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
            Receita Bruta (BRL)
          </span>
          <div className="text-xl font-bold text-gray-800">{formatBRL(receitaSimuladaBRL)}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>Atual: {formatBRL(receitaBrutaAtualBRL)}</span>
            <span
              className={`font-semibold ${
                receitaSimuladaBRL >= receitaBrutaAtualBRL ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {receitaSimuladaBRL >= receitaBrutaAtualBRL ? '+' : ''}
              {formatBRL(receitaSimuladaBRL - receitaBrutaAtualBRL)}
            </span>
          </div>
        </div>

        {/* Resultado Operacional Líquido */}
        <div
          className={`p-4 border rounded-xl ${
            resultadoSimuladoBRL >= 0
              ? 'bg-emerald-50/50 border-emerald-200'
              : 'bg-rose-50/50 border-rose-200'
          }`}
        >
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
            Resultado Líquido Simulado
          </span>
          <div
            className={`text-xl font-extrabold ${
              resultadoSimuladoBRL >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatBRL(resultadoSimuladoBRL)}
          </div>
          <div className="text-xs mt-1 flex items-center justify-between">
            <span className="text-gray-500">Atual: {formatBRL(resultadoAtualBRL)}</span>
            <span
              className={`font-bold flex items-center gap-0.5 ${
                diferencaResultadoBRL >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {diferencaResultadoBRL >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {diferencaResultadoBRL >= 0 ? '+' : ''}
              {formatBRL(diferencaResultadoBRL)}
            </span>
          </div>
        </div>

        {/* Margem de Lucro Simulada */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
            Margem Operacional Simulada
          </span>
          <div
            className={`text-xl font-bold ${
              margemSimulada >= 0 ? 'text-gray-900' : 'text-rose-600'
            }`}
          >
            {margemSimulada.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>Margem atual: {margemAtual.toFixed(2)}%</span>
            <span
              className={`font-semibold ${
                margemSimulada >= margemAtual ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {margemSimulada >= margemAtual ? '+' : ''}
              {(margemSimulada - margemAtual).toFixed(2)} p.p.
            </span>
          </div>
        </div>
      </div>

      {/* ANÁLISE DE PONTO DE EQUILÍBRIO (BREAK-EVEN FX) */}
      {temSaldoAberto && ptaxBreakEven !== null && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-blue-900">
          <div>
            <span className="font-bold">🎯 PTAX de Equilíbrio (Break-Even): </span>
            <span>
              O dólar mínimo para não ter prejuízo no saldo em aberto é{' '}
              <strong className="underline decoration-blue-500 decoration-2">
                R$ {ptaxBreakEven.toFixed(4)}
              </strong>
              .
            </span>
          </div>
          <div className="font-medium text-blue-700 text-[11px]">
            {ptaxSimulada > ptaxBreakEven
              ? `Folga de R$ ${(ptaxSimulada - ptaxBreakEven).toFixed(4)} acima do zero a zero.`
              : `⚠️ Atenção: Taxa simulada está abaixo do break-even em R$ ${(ptaxBreakEven - ptaxSimulada).toFixed(4)}.`}
          </div>
        </div>
      )}
    </div>
  );
}
