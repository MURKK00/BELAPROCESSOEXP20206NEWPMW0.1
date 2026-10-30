'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Tv2, 
  Maximize, 
  Minimize, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle2, 
  Ship, 
  Container, 
  DollarSign, 
  Globe2, 
  Anchor, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck, 
  ShieldAlert, 
  Calendar,
  Layers,
  Pause,
  Play,
  Bookmark,
  Activity,
  Wheat,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface WorldClock {
  cidade: string;
  pais: string;
  bandeiraImg: string;
  fuso: string;
  timeZone: string;
}

const WORLD_CLOCKS: WorldClock[] = [
  {
    cidade: 'Santos / Sinop',
    pais: 'Brasil',
    bandeiraImg: '/assets/aistudio/BRASIL_07f5fbf4.png',
    fuso: 'GMT-3',
    timeZone: 'America/Sao_Paulo',
  },
  {
    cidade: 'Chicago (CBOT)',
    pais: 'EUA',
    bandeiraImg: '/assets/aistudio/EUA_184fb482.png',
    fuso: 'GMT-5',
    timeZone: 'America/Chicago',
  },
  {
    cidade: 'Dubai (Jebel Ali)',
    pais: 'EAU',
    bandeiraImg: '/assets/aistudio/EAU_bbd4493a.png',
    fuso: 'GMT+4',
    timeZone: 'Asia/Dubai',
  },
  {
    cidade: 'Dhaka',
    pais: 'Bangladesh',
    bandeiraImg: '/assets/aistudio/BANGLADESH_2772d1bf.png',
    fuso: 'GMT+6',
    timeZone: 'Asia/Dhaka',
  },
  {
    cidade: 'Mumbai / Delhi',
    pais: 'Índia',
    bandeiraImg: '/assets/aistudio/INDIA_3785c9da.png',
    fuso: 'GMT+5:30',
    timeZone: 'Asia/Kolkata',
  },
  {
    cidade: 'Xangai / Dalian',
    pais: 'China',
    bandeiraImg: '/assets/aistudio/CHINA_b1993b91.png',
    fuso: 'GMT+8',
    timeZone: 'Asia/Shanghai',
  },
  {
    cidade: 'Londres / Roterdã',
    pais: 'Grã-Bretanha',
    bandeiraImg: '/assets/aistudio/GRABRETANHA_6b2d17b9.png',
    fuso: 'GMT+0',
    timeZone: 'Europe/London',
  },
];

type PeriodoCurva = '24h' | '7d' | '15d' | '30d';

export default function BackofficeTvPage() {
  const [dataAtual, setDataAtual] = useState<Date | null>(null);
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [segundosParaRefresh, setSegundosParaRefresh] = useState<number>(30);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [autoScrollPausado, setAutoScrollPausado] = useState<boolean>(false);
  const [periodoCurva, setPeriodoCurva] = useState<PeriodoCurva>('30d');
  const [autoCycleCurva, setAutoCycleCurva] = useState<boolean>(true);
  const tickerContainerRef = useRef<HTMLDivElement>(null);

  // 1. Relógio Mundial com atualização a cada segundo
  useEffect(() => {
    setDataAtual(new Date());
    const clockInterval = setInterval(() => {
      setDataAtual(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // 2. Carregamento das Métricas do Backoffice
  const carregarMetricas = useCallback(async (isSilencioso = false) => {
    try {
      if (!isSilencioso) setLoading(true);
      setErro(null);
      const res = await fetch('/api/backoffice/metrics');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha ao buscar métricas de TV');
      }
      setDados(json.data);
      setSegundosParaRefresh(30);
    } catch (err: any) {
      setErro(err.message || 'Erro ao atualizar dados do Backoffice');
    } finally {
      if (!isSilencioso) setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarMetricas();
  }, [carregarMetricas]);

  // 3. Temporizador de Auto-Refresh (a cada 30 segundos)
  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosParaRefresh((prev) => {
        if (prev <= 1) {
          carregarMetricas(true);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [carregarMetricas]);

  // 4. Auto-Cycle do período do gráfico na TV (a cada 12 segundos se ativo)
  useEffect(() => {
    if (!autoCycleCurva) return;
    const periodos: PeriodoCurva[] = ['24h', '7d', '15d', '30d'];
    const timer = setInterval(() => {
      setPeriodoCurva((prev) => {
        const idx = periodos.indexOf(prev);
        return periodos[(idx + 1) % periodos.length];
      });
    }, 12000);
    return () => clearInterval(timer);
  }, [autoCycleCurva]);

  // 5. Modo Tela Cheia
  const alternarFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullScreen(false)).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // 6. Formatação de hora por fuso horário
  const formatarHoraFuso = (timeZone: string) => {
    if (!dataAtual) return '--:--:--';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(dataAtual);
    } catch {
      return '--:--:--';
    }
  };

  const formatarDataFuso = (timeZone: string) => {
    if (!dataAtual) return '';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone,
        day: '2-digit',
        month: '2-digit',
      }).format(dataAtual);
    } catch {
      return '';
    }
  };

  const proximoDeadline = dados?.proximoDeadline;
  const emExecucao = dados?.negociacoesEmExecucao;
  const embarcadas = dados?.negociacoesEmbarcadas;
  const fiscal = dados?.auditoriaFiscal;
  const cambio = dados?.cambio;
  const commodities = dados?.commodities;
  const tickerItems = dados?.ticker || [];
  const alertasDeadlines = dados?.alertasDeadlines;

  const totalVencidos = alertasDeadlines?.totalVencidos || 0;
  const totalCriticos = alertasDeadlines?.totalCriticos || 0;

  // Dados das Curvas do Gráfico
  const curvasHistoricas = cambio?.curvasHistoricas;
  const dadosGrafico = useMemo(() => {
    if (!curvasHistoricas) return [];
    switch (periodoCurva) {
      case '24h':
        return curvasHistoricas.h24 || [];
      case '7d':
        return curvasHistoricas.d7 || [];
      case '15d':
        return curvasHistoricas.d15 || [];
      case '30d':
      default:
        return curvasHistoricas.d30 || [];
    }
  }, [curvasHistoricas, periodoCurva]);

  // Cálculos de Min / Max para domínio do gráfico
  const { minValor, maxValor, varPeriodoPct } = useMemo(() => {
    if (!dadosGrafico || dadosGrafico.length === 0) {
      return { minValor: 5.30, maxValor: 5.45, varPeriodoPct: 0 };
    }
    const vals = dadosGrafico.map((d: any) => d.valor).filter((v: any) => typeof v === 'number' && !isNaN(v));
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const prim = vals[0] || 1;
    const ult = vals[vals.length - 1] || 1;
    const varPct = Number((((ult - prim) / prim) * 100).toFixed(2));
    return { minValor: min, maxValor: max, varPeriodoPct: varPct };
  }, [dadosGrafico]);

  const paddingY = Math.max((maxValor - minValor) * 0.15, 0.015);
  const domainY = [Number((minValor - paddingY).toFixed(4)), Number((maxValor + paddingY).toFixed(4))];

  // Commodities Chicago (CBOT)
  const soja = commodities?.sojaCbot;
  const milho = commodities?.milhoCbot;
  const dolarPreco = Number(cambio?.dolarLive ?? 5.3890);

  // Paridades derivadas
  const sojaUsdTon = soja ? Number(((soja.preco / 100) * 36.7437).toFixed(2)) : 379.38;
  const sojaReaisSaca = Number(((sojaUsdTon * dolarPreco) / 16.6667).toFixed(2));

  const milhoUsdTon = milho ? Number(((milho.preco / 100) * 39.368).toFixed(2)) : 169.77;
  const milhoReaisSaca = Number(((milhoUsdTon * dolarPreco) / 16.6667).toFixed(2));

  return (
    <div
      className={`bg-[#060a12] text-slate-100 flex flex-col justify-between select-none font-sans overflow-hidden transition-all ${
        isFullScreen
          ? 'fixed inset-0 z-50 w-screen h-screen p-3 gap-2.5'
          : 'h-[calc(100vh-4.2rem)] max-h-[calc(100vh-4.2rem)] -m-3.5 sm:-m-6 lg:-m-8 p-2.5 sm:p-3 gap-2'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOPO: HEADER EXECUTIVO + WORLD CLOCKS COM BANDEIRAS OFICIAIS           */}
      {/* ========================================================================= */}
      <header className="shrink-0 space-y-1.5">
        {/* Barra de Identificação e Controle TV */}
        <div className="flex items-center justify-between gap-3 bg-[#0d1424] border border-slate-800/90 rounded-xl px-3 py-1.5 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
              <Tv2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs sm:text-sm tracking-tight text-white uppercase whitespace-nowrap">
                Bela Cereais
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-xs font-bold text-orange-400 tracking-wider uppercase font-mono whitespace-nowrap">
                Backoffice TV Cockpit
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Wallboard
              </span>

              {/* ALERTAS VISUAIS DE DEADLINES NO TOPO */}
              {totalVencidos > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse whitespace-nowrap">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  {totalVencidos} {totalVencidos === 1 ? 'Deadline Vencido' : 'Deadlines Vencidos'}
                </span>
              )}
              {totalCriticos > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse whitespace-nowrap">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {totalCriticos} {totalCriticos === 1 ? 'Crítico (< 72h)' : 'Críticos (< 72h)'}
                </span>
              )}
            </div>
          </div>

          {/* Controles de Atualização & Tela Cheia */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <RefreshCw className={`w-3 h-3 text-orange-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-slate-400 text-[10px] hidden sm:inline">Refresh:</span>
              <span className="font-mono font-bold text-orange-400 tabular-nums text-xs">
                {segundosParaRefresh}s
              </span>
            </div>

            <button
              type="button"
              onClick={() => carregarMetricas(false)}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
              title="Atualizar dados agora"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={alternarFullscreen}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer"
              title={isFullScreen ? 'Sair da Tela Cheia' : 'Modo TV Tela Cheia (F11)'}
            >
              {isFullScreen ? (
                <>
                  <Minimize className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Janela</span>
                </>
              ) : (
                <>
                  <Maximize className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Tela Cheia</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* FAIXA DE RELÓGIOS MUNDIAIS (7 PAÍSES COM BANDEIRAS OFICIAIS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
          {WORLD_CLOCKS.map((clock) => {
            const hora = formatarHoraFuso(clock.timeZone);
            const dataFuso = formatarDataFuso(clock.timeZone);
            return (
              <div
                key={clock.pais + clock.cidade}
                className="bg-[#0b1120] border border-slate-800/90 hover:border-slate-700 rounded-xl px-2.5 py-1.5 flex flex-col justify-between transition-all shadow-xs"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="relative w-6 h-4 rounded overflow-hidden shadow-xs border border-slate-700/80 shrink-0 bg-slate-900">
                      <Image
                        src={clock.bandeiraImg}
                        alt={clock.pais}
                        fill
                        sizes="24px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 truncate" title={clock.pais}>
                      {clock.pais}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-orange-400/90 bg-orange-500/10 px-1 py-0.2 rounded uppercase tracking-wider shrink-0">
                    {clock.fuso}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <div className="font-mono font-black text-sm text-white tracking-wider tabular-nums">
                    {hora}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate text-right">
                    <span className="truncate">{clock.cidade.split(' ')[0]}</span>
                    <span className="font-mono text-slate-500 ml-1">{dataFuso}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BLOCO DE INDICADORES (4 CARDS COMPACTOS - NÃO ESTICADOS)               */}
      {/* ========================================================================= */}
      <section className="shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* CARD 1: PRÓXIMO DEADLINE */}
        <div
          className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between shadow-md transition-all relative overflow-hidden h-[120px] ${
            proximoDeadline?.atrasado
              ? 'animate-pulse-danger bg-gradient-to-br from-[#260e15] to-[#0b1120]'
              : proximoDeadline?.urgente
              ? 'animate-pulse-warning bg-gradient-to-br from-[#26170a] to-[#0b1120]'
              : 'bg-[#0b1120] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className={`p-1 rounded-md ${
                  proximoDeadline?.atrasado
                    ? 'bg-rose-500/20 text-rose-400'
                    : proximoDeadline?.urgente
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-blue-500/15 text-blue-400'
                }`}
              >
                {proximoDeadline?.atrasado ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Anchor className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Próximo Deadline
              </span>
            </div>
            {proximoDeadline && (
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase tracking-wider border ${
                  proximoDeadline.atrasado
                    ? 'bg-rose-500/25 text-rose-300 border-rose-500/60 animate-pulse'
                    : proximoDeadline.urgente
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 animate-pulse'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}
              >
                {proximoDeadline.tempoTexto}
              </span>
            )}
          </div>

          {proximoDeadline ? (
            <div className="my-1">
              <div className="flex items-baseline justify-between">
                <span className="font-mono font-black text-base text-white">
                  {proximoDeadline.numeroProcesso}
                </span>
                <span className="text-xs font-mono font-bold text-orange-400">
                  {(proximoDeadline.volumeKg / 1000).toFixed(0)} t
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-bold truncate">
                {proximoDeadline.clienteFinal}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-2">Sem deadline pendente</div>
          )}

          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate max-w-[150px]">Navio: <strong className="text-slate-200">{proximoDeadline?.navio}</strong></span>
            <span className="font-mono text-slate-300">{proximoDeadline?.portoDestino}</span>
          </div>
        </div>

        {/* CARD 2: EM EXECUÇÃO */}
        <div className="p-2.5 sm:p-3 bg-[#0b1120] border border-slate-800 rounded-xl flex flex-col justify-between shadow-md h-[120px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-md bg-orange-500/15 text-orange-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Em Execução
              </span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
              Ativas
            </span>
          </div>

          <div className="my-1 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              {emExecucao?.total || 0}{' '}
              <span className="text-xs font-bold text-slate-400">contratos</span>
            </div>
            <span className="font-mono font-bold text-xs text-orange-400">
              {emExecucao?.containers || 0} contêineres
            </span>
          </div>

          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>Volume: <strong className="text-slate-200 font-mono">{emExecucao?.volumeToneladas || 0} t</strong></span>
            <span className="font-mono text-slate-300">{Number(emExecucao?.volumeSacas || 0).toLocaleString('pt-BR')} sc</span>
          </div>
        </div>

        {/* CARD 3: NEGOCIAÇÕES EMBARCADAS */}
        <div className="p-2.5 sm:p-3 bg-[#0b1120] border border-slate-800 rounded-xl flex flex-col justify-between shadow-md h-[120px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-md bg-blue-500/15 text-blue-400">
                <Ship className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Embarcadas
              </span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
              No Mar / BL
            </span>
          </div>

          <div className="my-1 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              {embarcadas?.total || 0}{' '}
              <span className="text-xs font-bold text-slate-400">embarcadas</span>
            </div>
            <span className="font-mono font-bold text-xs text-blue-400">
              {embarcadas?.containers || 0} contêineres
            </span>
          </div>

          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>Volume: <strong className="text-slate-200 font-mono">{embarcadas?.volumeToneladas || 0} t</strong></span>
            <span className="font-mono text-slate-300">{Number(embarcadas?.volumeSacas || 0).toLocaleString('pt-BR')} sc</span>
          </div>
        </div>

        {/* CARD 4: AVERBAÇÃO SEFAZ & ALERTA FISCAL */}
        <div
          className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between shadow-md h-[120px] ${
            fiscal?.semAverbacaoEEmbarcadas > 0
              ? 'animate-pulse-warning bg-gradient-to-br from-[#26170a] to-[#0b1120]'
              : 'bg-[#0b1120] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className={`p-1 rounded-md ${
                  fiscal?.semAverbacaoEEmbarcadas > 0
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {fiscal?.semAverbacaoEEmbarcadas > 0 ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Averbação SEFAZ
              </span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              Etapa 4 NFe
            </span>
          </div>

          <div className="my-1 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              {fiscal?.semAverbacaoTotal || 0}{' '}
              <span className="text-xs font-bold text-slate-400">sem averbar</span>
            </div>
            <span className="font-mono font-bold text-xs text-emerald-400">
              {fiscal?.totalAverbadas || 0} averbada(s)
            </span>
          </div>

          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-amber-300 flex items-center gap-1 font-bold">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Embarcadas s/ averbação:
            </span>
            <strong className="text-amber-400 font-mono font-black text-xs">
              {fiscal?.semAverbacaoEEmbarcadas || 0} NFs
            </strong>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CENTRO: CÂMBIO DÓLAR EM GRANDE EVIDÊNCIA + GRÁFICO CURVAS + CBOT AGRO  */}
      {/* ========================================================================= */}
      <section className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        {/* COLUNA ESQUERDA (8 COLUNAS): DÓLAR LIVE + GRÁFICO DE CURVAS (24h, 7d, 15d, 30d) */}
        <div className="lg:col-span-8 bg-[#0b1120] border border-slate-800/90 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-xl">
          {/* Topo do Card de Câmbio: Valores com Alto Destaque Visual */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
            {/* Dólar Comercial Spot Principal */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-inner">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Dólar Comercial Spot
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                    Ao Vivo
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-black text-2xl sm:text-3xl text-emerald-400 tabular-nums tracking-tight">
                    R$ {Number(cambio?.dolarLive ?? 5.3890).toFixed(4)}
                  </span>
                  <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                    Number(cambio?.dolarVariacaoPct || 0) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                  }`}>
                    {Number(cambio?.dolarVariacaoPct || 0) >= 0 ? '+' : ''}{Number(cambio?.dolarVariacaoPct || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* PTAX BACEN Oficial */}
            <div className="hidden sm:block border-l border-slate-800/80 pl-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                PTAX BACEN (Oficial)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono font-black text-sm text-white tabular-nums">
                  Venda: R$ {Number(cambio?.ptaxVenda ?? 5.3744).toFixed(4)}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  (Compra: R$ {Number(cambio?.ptaxCompra ?? 5.3688).toFixed(4)})
                </span>
              </div>
            </div>

            {/* Margem / Spread */}
            <div className="hidden md:block border-l border-slate-800/80 pl-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Margem Dólar (Spread)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-black text-sm text-amber-400 tabular-nums">
                  +{cambio?.margemDolarPct || '0.27'}%
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  (Δ R$ {cambio?.margemDolarValor || '0.0146'})
                </span>
              </div>
            </div>

            {/* Seletor de Período da Curva (24h, 7d, 15d, 30d) */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
              {(['24h', '7d', '15d', '30d'] as PeriodoCurva[]).map((periodo) => {
                const isAtivo = periodoCurva === periodo;
                return (
                  <button
                    key={periodo}
                    type="button"
                    onClick={() => {
                      setPeriodoCurva(periodo);
                      setAutoCycleCurva(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      isAtivo
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs shadow-emerald-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {periodo}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gráfico de Curva do Dólar Recharts */}
          <div className="flex-1 min-h-[140px] sm:min-h-[160px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dolarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  dy={4}
                />
                <YAxis
                  domain={domainY}
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `R$${val.toFixed(2)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1120',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#10b981', fontFamily: 'monospace', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '2px' }}
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(4)}`, 'Dólar']}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dolarGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Rodapé do Gráfico com Indicadores Estatísticos */}
          <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <span>Mínima {periodoCurva}: <strong className="text-slate-200">R$ {minValor.toFixed(4)}</strong></span>
              <span className="text-slate-700">|</span>
              <span>Máxima {periodoCurva}: <strong className="text-slate-200">R$ {maxValor.toFixed(4)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Variação {periodoCurva}:</span>
              <strong className={`font-bold ${varPeriodoPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {varPeriodoPct >= 0 ? '+' : ''}{varPeriodoPct.toFixed(2)}%
              </strong>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (4 COLUNAS): COTAÇÕES SOJA & MILHO CHICAGO (CBOT) */}
        <div className="lg:col-span-4 bg-[#0b1120] border border-slate-800/90 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Wheat className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Commodities Chicago
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  CBOT · CME Group Oficial
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
              Mercado Agro
            </span>
          </div>

          {/* Bloco 1: Soja em Grão CBOT (ZS=F) */}
          <div className="py-2.5 border-b border-slate-800/60">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-sm text-slate-100">SOJA CBOT</span>
                <span className="text-[10px] font-mono text-slate-500">(ZS=F)</span>
              </div>
              <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                (soja?.variacaoPct ?? 1.40) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}>
                {(soja?.variacaoPct ?? 1.40) >= 0 ? '+' : ''}{(soja?.variacaoPct ?? 1.40).toFixed(2)}%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="font-mono font-black text-xl sm:text-2xl text-amber-400 tabular-nums">
                {Number(soja?.preco ?? 1032.50).toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">¢/bu</span>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-300">
                <div>US$ {sojaUsdTon.toFixed(2)}/t</div>
                <div className="text-emerald-400 font-bold">R$ {sojaReaisSaca.toFixed(2)}/sc</div>
              </div>
            </div>
          </div>

          {/* Bloco 2: Milho CBOT (ZC=F) */}
          <div className="py-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-sm text-slate-100">MILHO CBOT</span>
                <span className="text-[10px] font-mono text-slate-500">(ZC=F)</span>
              </div>
              <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                (milho?.variacaoPct ?? 0.82) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}>
                {(milho?.variacaoPct ?? 0.82) >= 0 ? '+' : ''}{(milho?.variacaoPct ?? 0.82).toFixed(2)}%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="font-mono font-black text-xl sm:text-2xl text-amber-400 tabular-nums">
                {Number(milho?.preco ?? 431.25).toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">¢/bu</span>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-300">
                <div>US$ {milhoUsdTon.toFixed(2)}/t</div>
                <div className="text-emerald-400 font-bold">R$ {milhoReaisSaca.toFixed(2)}/sc</div>
              </div>
            </div>
          </div>

          {/* Rodapé de Paridade Cambial / Exportação */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Base FOB Santos / Paranaguá</span>
            <span className="text-orange-400 font-bold">Safra 2026</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PARTE INFERIOR: NEGOCIAÇÕES (MAIORES COM NÚMERO BOOKING E ALERTAS)     */}
      {/* ========================================================================= */}
      <footer className="shrink-0 space-y-1.5 pb-0.5">
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="font-black uppercase tracking-wider text-white text-xs sm:text-sm">
              Negociações
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {tickerItems.length} processos ativos
            </span>
            {totalVencidos > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                {totalVencidos} com deadline vencido
              </span>
            )}
            {totalCriticos > 0 && (
              <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse">
                <Clock className="w-3 h-3 text-amber-400" />
                {totalCriticos} críticos
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <button
              type="button"
              onClick={() => setAutoScrollPausado(!autoScrollPausado)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:text-white cursor-pointer"
            >
              {autoScrollPausado ? (
                <>
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>Retomar</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 text-amber-400" />
                  <span>Pausar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CONTAINER COM ROLAGEM AUTOMÁTICA EM LOOP */}
        <div
          ref={tickerContainerRef}
          onMouseEnter={() => setAutoScrollPausado(true)}
          onMouseLeave={() => setAutoScrollPausado(false)}
          className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-2.5 overflow-x-auto no-scrollbar shadow-xl"
        >
          <div
            className={`flex items-stretch gap-3 ${
              autoScrollPausado ? '' : 'animate-marquee'
            }`}
            style={{ width: 'max-content' }}
          >
            {/* Duplicamos os itens para garantir efeito de loop contínuo impecável */}
            {[...tickerItems, ...tickerItems].map((item, idx) => {
              const isEmbarcado = item.status === 'EMBARCADO' || item.status === 'FINALIZADO';
              const isAtrasado = item.isAtrasado;
              const isCritico = item.isCritico;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className={`w-[360px] sm:w-[410px] h-[160px] p-3 rounded-xl transition-all flex flex-col justify-between shrink-0 shadow-lg group relative overflow-hidden ${
                    isAtrasado
                      ? 'animate-pulse-danger bg-gradient-to-b from-[#280d16] via-[#1a0a10] to-[#0d1424]'
                      : isCritico
                      ? 'animate-pulse-warning bg-gradient-to-b from-[#24170a] via-[#160e06] to-[#0d1424]'
                      : 'bg-[#0e172a] border border-slate-800 hover:border-orange-500/50'
                  }`}
                >
                  {/* Linha 1: Processo + Status / Alerta Deadline */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-base sm:text-lg text-white group-hover:text-orange-400 transition-colors">
                        {item.numeroProcesso}
                      </span>
                      {isAtrasado && (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      )}
                      {isCritico && !isAtrasado && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      )}
                    </div>

                    {/* BADGE DE DEADLINE VENCIDO OU CRÍTICO */}
                    {isAtrasado ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500/60 animate-pulse">
                        {item.deadlineTexto || 'Vencido'}
                      </span>
                    ) : isCritico ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/30 text-amber-300 border border-amber-500/60 animate-pulse">
                        {item.deadlineTexto || 'Crítico'}
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                          isEmbarcado
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Linha 2: BOOKING EM EVIDÊNCIA */}
                  <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-mono">Booking:</span>
                    </div>
                    <strong className="text-xs font-mono font-black text-amber-300 tracking-wider">
                      {item.bookingNumero || item.booking || 'A Definir'}
                    </strong>
                  </div>

                  {/* Linha 3: Cliente & Produto / Volume */}
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-100 truncate" title={item.clienteFinal}>
                      {item.clienteFinal}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate max-w-[210px] text-slate-300">{item.produto}</span>
                      <span className="font-mono font-bold text-slate-100 shrink-0">
                        {(item.volumeKg / 1000).toFixed(0)} t{' '}
                        {item.sacas ? `(${item.sacas.toLocaleString('pt-BR')} sc)` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Linha 4: Logística (Navio, Destino e Contêineres) */}
                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-300">
                    <div className="truncate max-w-[220px]" title={`${item.navio} -> ${item.portoDestino}`}>
                      <span className="text-slate-400">Navio:</span>{' '}
                      <strong className="text-white">{item.navio}</strong>{' '}
                      <span className="text-orange-400">➔</span> {item.portoDestino}
                    </div>

                    <div className="flex items-center gap-1 font-mono shrink-0 text-slate-400">
                      <Container className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-200">{item.containers} cont.</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </footer>

      {/* ESTILO CSS GLOBAL PARA ROLAGEM CONTÍNUA E ALERTAS VISUAIS PULSANTES */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 45s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }

        @keyframes pulseDangerBorder {
          0%, 100% {
            box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.95), 0 0 22px rgba(244, 63, 94, 0.6);
            border-color: rgba(244, 63, 94, 1);
          }
          50% {
            box-shadow: 0 0 0 1px rgba(244, 63, 94, 0.45), 0 0 8px rgba(244, 63, 94, 0.25);
            border-color: rgba(244, 63, 94, 0.65);
          }
        }

        @keyframes pulseWarningBorder {
          0%, 100% {
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.95), 0 0 20px rgba(245, 158, 11, 0.55);
            border-color: rgba(245, 158, 11, 1);
          }
          50% {
            box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.45), 0 0 8px rgba(245, 158, 11, 0.25);
            border-color: rgba(245, 158, 11, 0.65);
          }
        }

        .animate-pulse-danger {
          animation: pulseDangerBorder 1.8s ease-in-out infinite;
        }

        .animate-pulse-warning {
          animation: pulseWarningBorder 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
