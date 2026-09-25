'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  ArrowUpRight, 
  AlertCircle,
  HelpCircle,
  Percent
} from 'lucide-react';
import { formatBRL } from '@/lib/formatters';
import type { FinanceiroProcessoItem } from './FinanceiroDashboardClient';

export interface FinanceiroGraficosProps {
  processos: FinanceiroProcessoItem[];
  metaMargemPadrao?: number; // ex: 8%
}

// Paleta sofisticada para o mix de custos
const PALETA_CORES_CUSTOS = [
  '#3b82f6', // Azul (Compra de Grãos)
  '#06b6d4', // Ciano (Frete Marítimo)
  '#f97316', // Laranja (Beneficiamento)
  '#8b5cf6', // Roxo (Sacaria)
  '#10b981', // Verde Esmeralda (Frete Terrestre)
  '#ec4899', // Rosa (Tarifas Portuárias)
  '#eab308', // Amarelo (Estufagem / REDEX)
  '#6366f1', // Índigo (Comissão)
  '#64748b', // Cinza Slate (Outros)
  '#14b8a6', // Teal
];

// Custom Tooltip para o Gráfico de Pizza (Mix de Custos)
interface CustomPieTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      percent: number;
      countProcessos: number;
    };
  }>;
}

function CustomPieTooltip({ active, payload }: CustomPieTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs min-w-[210px] z-50">
        <div className="flex items-center gap-1.5 text-slate-300 font-bold mb-1">
          <Layers className="w-3.5 h-3.5 text-orange-400" />
          <span>{data.name}</span>
        </div>
        <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">Total do Centro:</span>
          <span className="text-sm font-black text-white">{formatBRL(data.value)}</span>
        </div>
        <div className="flex items-baseline justify-between mt-1 text-[11px]">
          <span className="text-slate-400">Participação:</span>
          <span className="font-extrabold text-orange-400">
            {data.percent.toFixed(1)}% do mix total
          </span>
        </div>
      </div>
    );
  }
  return null;
}

// Custom Tooltip para o Gráfico de Barras (Distribuição de Margem)
interface CustomBarTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      numeroProcesso: string;
      clienteFinal: string;
      produto: string;
      margemLucro: number;
      receitaBrutaBRL: number;
      totalCustosBRL: number;
      resultadoOperacionalBRL: number;
      status: string;
    };
  }>;
}

function CustomBarTooltip({ active, payload }: CustomBarTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isLucro = data.resultadoOperacionalBRL >= 0;

    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700/80 text-xs min-w-[240px] z-50 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 font-black text-white text-sm">
            <span>{data.numeroProcesso}</span>
          </div>
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
              data.margemLucro >= 10
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : data.margemLucro >= 5
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}
          >
            {data.margemLucro.toFixed(1)}% Margem
          </span>
        </div>

        <div className="space-y-0.5">
          <div className="text-[11px] font-bold text-slate-200 truncate max-w-[220px]">
            {data.clienteFinal}
          </div>
          <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
            {data.produto}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Receita Bruta:</span>
            <span className="font-semibold text-white">{formatBRL(data.receitaBrutaBRL)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Custos Totais:</span>
            <span className="font-semibold text-slate-300">{formatBRL(data.totalCustosBRL)}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
            <span className="text-slate-300 font-bold">Resultado Operacional:</span>
            <span className={`font-black ${isLucro ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatBRL(data.resultadoOperacionalBRL)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function FinanceiroGraficos({
  processos,
  metaMargemPadrao = 8,
}: FinanceiroGraficosProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [metricaBarra, setMetricaBarra] = useState<'margem' | 'lucro'>('margem');

  // Evita hydration mismatch com componentes que medem o DOM (Recharts)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Filtrar negociações abertas (em andamento, embarcadas ou em negociação)
  const negociacoesAbertas = useMemo(() => {
    return processos.filter(
      (p) => p.status !== 'CANCELADO' && p.status !== 'FINALIZADO'
    );
  }, [processos]);

  // Se não houver processos abertos específicos no filtro, usa os processos ativos da tela
  const processosParaAnalise = negociacoesAbertas.length > 0 ? negociacoesAbertas : processos;

  // 2. Agregar dados para o Gráfico de Pizza (Mix de Custos por Categoria)
  const { dadosCustosPizza, totalGeralCustos, maiorCentroCusto } = useMemo(() => {
    const mapaCustos = new Map<string, { nome: string; valor: number; count: number }>();
    let total = 0;

    for (const p of processosParaAnalise) {
      if (p.custos && p.custos.length > 0) {
        for (const c of p.custos) {
          if (c.valor > 0) {
            const atual = mapaCustos.get(c.categoria) || {
              nome: c.categoriaLabel || c.categoria,
              valor: 0,
              count: 0,
            };
            atual.valor += c.valor;
            atual.count += 1;
            mapaCustos.set(c.categoria, atual);
            total += c.valor;
          }
        }
      } else if (p.totalCustosBRL > 0) {
        // Fallback se o processo tem total de custos sem detalhamento por categoria
        const atual = mapaCustos.get('OUTROS') || {
          nome: 'Custos Operacionais Gerais',
          valor: 0,
          count: 0,
        };
        atual.valor += p.totalCustosBRL;
        atual.count += 1;
        mapaCustos.set('OUTROS', atual);
        total += p.totalCustosBRL;
      }
    }

    const lista = Array.from(mapaCustos.values())
      .map((item) => ({
        name: item.nome,
        value: item.valor,
        countProcessos: item.count,
        percent: total > 0 ? (item.valor / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const maior = lista.length > 0 ? lista[0] : null;

    return {
      dadosCustosPizza: lista,
      totalGeralCustos: total,
      maiorCentroCusto: maior,
    };
  }, [processosParaAnalise]);

  // 3. Agregar dados para o Gráfico de Barras (Distribuição de Margem)
  const dadosMargensBarras = useMemo(() => {
    return processosParaAnalise.map((p) => {
      // Limitar a exibição do nome para o eixo X
      const labelCurto = p.numeroProcesso.replace('BC26-', '#');
      return {
        id: p.id,
        numeroProcesso: p.numeroProcesso,
        labelCurto,
        clienteFinal: p.clienteFinal,
        produto: p.produto,
        volumeTon: p.volumeTon,
        receitaBrutaBRL: p.receitaBrutaBRL,
        totalCustosBRL: p.totalCustosBRL,
        resultadoOperacionalBRL: p.resultadoOperacionalBRL,
        margemLucro: Number(p.margemLucro.toFixed(2)),
        status: p.status,
      };
    });
  }, [processosParaAnalise]);

  // Indicador de Margem Média consolidada dos processos sob análise
  const margemMediaConsolidada = useMemo(() => {
    const somaReceita = processosParaAnalise.reduce((acc, p) => acc + p.receitaBrutaBRL, 0);
    const somaResultado = processosParaAnalise.reduce((acc, p) => acc + p.resultadoOperacionalBRL, 0);
    return somaReceita > 0 ? (somaResultado / somaReceita) * 100 : 0;
  }, [processosParaAnalise]);

  if (!isMounted) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
        <div className="h-72 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
            <span>Carregando gráficos financeiros...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* BARRA SUPERIOR DE RESUMO EXECUTIVO DOS GRÁFICOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
        {/* KPI 1: Negociações Analisadas */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Negociações em Análise
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {processosParaAnalise.length} abertas
            </span>
          </div>
        </div>

        {/* KPI 2: Total Custos Mapeados */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Total Custos Mapeados
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white truncate block">
              {formatBRL(totalGeralCustos)}
            </span>
          </div>
        </div>

        {/* KPI 3: Margem Média Consolidada */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Margem Média Ponderada
            </span>
            <span
              className={`text-base font-black truncate block ${
                margemMediaConsolidada >= metaMargemPadrao
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {margemMediaConsolidada.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* KPI 4: Maior Centro de Custo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Maior Custo Unitário
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white truncate block" title={maiorCentroCusto?.name || 'N/A'}>
              {maiorCentroCusto ? `${maiorCentroCusto.name} (${maiorCentroCusto.percent.toFixed(0)}%)` : 'Nenhum'}
            </span>
          </div>
        </div>
      </div>

      {/* CONTAINER PRINCIPAL DOS 2 GRÁFICOS LADO A LADO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* GRÁFICO 1 (PIZZA / DONUT): MIX DE CUSTOS POR CATEGORIA (COL-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <PieIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                    Mix de Custos por Categoria
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Composição percentual dos centros operacionais
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {dadosCustosPizza.length} categorias
              </span>
            </div>

            {/* GRÁFICO DE PIZZA / DONUT RECHARTS */}
            {dadosCustosPizza.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <span>Nenhum custo registrado para as negociações selecionadas.</span>
              </div>
            ) : (
              <div className="relative mt-2">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosCustosPizza}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {dadosCustosPizza.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={PALETA_CORES_CUSTOS[index % PALETA_CORES_CUSTOS.length]}
                            className="transition-all hover:opacity-80 cursor-pointer focus:outline-none"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Valor Total no Centro do Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Custos Totais
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                      {formatBRL(totalGeralCustos)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LISTA RESUMIDA DAS TOP CATEGORIAS COM CORES */}
          {dadosCustosPizza.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {dadosCustosPizza.slice(0, 6).map((item, idx) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: PALETA_CORES_CUSTOS[idx % PALETA_CORES_CUSTOS.length],
                      }}
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                      {formatBRL(item.value)}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 w-10 text-right">
                      {item.percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GRÁFICO 2 (BARRAS): DISTRIBUIÇÃO DE MARGEM DAS NEGOCIAÇÕES ABERTAS (COL-7) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                    Distribuição de Margem por Negociação
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Rentabilidade operacional comparativa dos contratos em andamento
                  </p>
                </div>
              </div>

              {/* SELETOR DE MÉTRICA DE VISUALIZAÇÃO */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMetricaBarra('margem')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    metricaBarra === 'margem'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Margem (%)
                </button>
                <button
                  type="button"
                  onClick={() => setMetricaBarra('lucro')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    metricaBarra === 'lucro'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Lucro (R$)
                </button>
              </div>
            </div>

            {/* GRÁFICO DE BARRAS RECHARTS */}
            {dadosMargensBarras.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <span>Nenhuma negociação disponível para exibir no gráfico de barras.</span>
              </div>
            ) : (
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dadosMargensBarras}
                    margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(148, 163, 184, 0.2)"
                    />
                    <XAxis
                      dataKey="numeroProcesso"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                      tick={{ fill: '#64748b', fontWeight: 600 }}
                      interval={0}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                      tick={{ fill: '#64748b' }}
                      tickFormatter={(val) =>
                        metricaBarra === 'margem'
                          ? `${val}%`
                          : `${(val / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip content={<CustomBarTooltip />} />

                    {/* Linha de Referência da Meta de Margem da Empresa */}
                    {metricaBarra === 'margem' && (
                      <ReferenceLine
                        y={metaMargemPadrao}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `Meta (${metaMargemPadrao}%)`,
                          fill: '#d97706',
                          fontSize: 10,
                          position: 'top',
                          fontWeight: 700,
                        }}
                      />
                    )}

                    {/* Linha Zero / Breakeven */}
                    <ReferenceLine
                      y={0}
                      stroke="#94a3b8"
                      strokeWidth={1}
                    />

                    <Bar
                      dataKey={metricaBarra === 'margem' ? 'margemLucro' : 'resultadoOperacionalBRL'}
                      radius={[6, 6, 0, 0]}
                    >
                      {dadosMargensBarras.map((entry) => {
                        let corBarra = '#10b981'; // Verde padrão para margem boa
                        if (metricaBarra === 'margem') {
                          if (entry.margemLucro >= 10) {
                            corBarra = '#10b981'; // Emerald
                          } else if (entry.margemLucro >= 5) {
                            corBarra = '#f59e0b'; // Âmbar
                          } else {
                            corBarra = '#f43f5e'; // Rose
                          }
                        } else {
                          corBarra = entry.resultadoOperacionalBRL >= 0 ? '#10b981' : '#f43f5e';
                        }

                        return <Cell key={`bar-${entry.id}`} fill={corBarra} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* LEGENDA INFORMATIVA DAS BARRAS */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Alta (&gt; 10%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Moderada (5% a 10%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Alerta (&lt; 5%)
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-slate-400" />
              <span>Dica: passe o cursor sobre as barras para ver a DRE do processo</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
