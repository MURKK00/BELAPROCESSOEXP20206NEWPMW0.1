'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Tv2, 
  Maximize, 
  Minimize, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Ship, 
  Container, 
  DollarSign, 
  Globe2, 
  Anchor, 
  ExternalLink, 
  ArrowUpRight, 
  ShieldCheck, 
  ShieldAlert, 
  Calendar,
  Layers,
  Pause,
  Play,
  AlertOctagon
} from 'lucide-react';

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

export default function BackofficeTvPage() {
  const [dataAtual, setDataAtual] = useState<Date | null>(null);
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [segundosParaRefresh, setSegundosParaRefresh] = useState<number>(30);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [autoScrollPausado, setAutoScrollPausado] = useState<boolean>(false);
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

  // 4. Modo Tela Cheia
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

  // 5. Formatação de hora por fuso horário
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
  const tickerItems = dados?.ticker || [];
  const alertasDeadlines = dados?.alertasDeadlines;

  const totalVencidos = alertasDeadlines?.totalVencidos || 0;
  const totalCriticos = alertasDeadlines?.totalCriticos || 0;
  const temAlertasDeadlines = totalVencidos > 0 || totalCriticos > 0;

  return (
    <div
      className={`bg-[#070b14] text-slate-100 flex flex-col justify-between select-none font-sans overflow-hidden transition-all ${
        isFullScreen
          ? 'fixed inset-0 z-50 w-screen h-screen p-3 sm:p-4 gap-2'
          : 'h-[calc(100vh-4.2rem)] max-h-[calc(100vh-4.2rem)] -m-3.5 sm:-m-6 lg:-m-8 p-2.5 sm:p-3.5 gap-2'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOPO: HEADER EXECUTIVO + WORLD CLOCKS COM BANDEIRAS OFICIAIS           */}
      {/* ========================================================================= */}
      <header className="shrink-0 space-y-2">
        {/* Barra de Identificação e Controle TV */}
        <div className="flex items-center justify-between gap-3 bg-[#0d1424] border border-slate-800/90 rounded-xl px-3.5 py-2 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30 shadow-inner">
              <Tv2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
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

                {/* ALERTA VISUAL NO TOPO SE HOUVER DEADLINES VENCIDOS OU CRÍTICOS */}
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
          </div>

          {/* Controles de Atualização & Tela Cheia */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Indicador de Auto-refresh 30s */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <RefreshCw className={`w-3 h-3 text-orange-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-slate-400 text-[10px] hidden sm:inline">Refresh:</span>
              <span className="font-mono font-bold text-orange-400 tabular-nums text-xs">
                {segundosParaRefresh}s
              </span>
            </div>

            {/* Botão de Atualizar Agora */}
            <button
              type="button"
              onClick={() => carregarMetricas(false)}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
              title="Atualizar dados agora"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Botão Tela Cheia (Ideal para TV) */}
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

        {/* FAIXA DE RELÓGIOS MUNDIAIS (WORLD CLOCKS COM BANDEIRAS OFICIAIS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
          {WORLD_CLOCKS.map((clock) => {
            const hora = formatarHoraFuso(clock.timeZone);
            const dataFuso = formatarDataFuso(clock.timeZone);
            return (
              <div
                key={clock.pais + clock.cidade}
                className="bg-[#0b1120] border border-slate-800/90 hover:border-slate-700 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 flex flex-col justify-between transition-all shadow-sm"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative w-7 h-4.5 sm:w-8 sm:h-5 rounded overflow-hidden shadow-xs border border-slate-700/80 shrink-0 bg-slate-900">
                      <Image
                        src={clock.bandeiraImg}
                        alt={clock.pais}
                        fill
                        sizes="32px"
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
                <div className="mt-1">
                  <div className="font-mono font-black text-sm sm:text-base text-white tracking-wider tabular-nums">
                    {hora}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 truncate">
                    <span className="truncate text-slate-400">{clock.cidade}</span>
                    <span className="font-mono text-slate-500 shrink-0 ml-1">{dataFuso}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BARRA DE CÂMBIO & DÓLAR AO VIVO (OFICIAL IGUAL A COTAÇÕES MERCADO)      */}
      {/* ========================================================================= */}
      <section className="shrink-0 bg-gradient-to-r from-[#0d1424] via-[#0e172a] to-[#0d1424] border border-slate-800/80 rounded-xl px-3 py-2 sm:px-5 sm:py-2.5 shadow-md flex flex-wrap items-center justify-between gap-2.5">
        {/* Dólar Comercial Live Spot */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Dólar Comercial Spot
              </span>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                Ao Vivo
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-black text-lg sm:text-xl text-emerald-400 tabular-nums">
                R$ {Number(cambio?.dolarLive ?? 5.3442).toFixed(4)}
              </span>
              <span className={`text-xs font-bold font-mono ${
                Number(cambio?.dolarVariacaoPct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {Number(cambio?.dolarVariacaoPct || 0) >= 0 ? '+' : ''}{Number(cambio?.dolarVariacaoPct || 0).toFixed(2)}%
              </span>
              {cambio?.dolarVariacao !== undefined && (
                <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
                  (Δ {Number(cambio.dolarVariacao) >= 0 ? '+' : ''}{Number(cambio.dolarVariacao).toFixed(4)})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-7 w-px bg-slate-800 hidden md:block" />

        {/* Ptax Banco Central Oficial */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                PTAX BACEN Oficial
              </span>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase">
                Fechamento
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm tabular-nums">
                Venda: <strong className="text-white">R$ {Number(cambio?.ptaxVenda ?? 5.3492).toFixed(4)}</strong>
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                (Compra: R$ {Number(cambio?.ptaxCompra ?? 5.3436).toFixed(4)})
              </span>
            </div>
          </div>
        </div>

        <div className="h-7 w-px bg-slate-800 hidden md:block" />

        {/* Margem / Spread Dólar */}
        <div className="flex items-center gap-2.5">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Margem Dólar (Spread Spot vs PTAX)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-black text-amber-400 text-xs sm:text-sm tabular-nums">
                +{cambio?.margemDolarPct || '0.10'}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                (Δ R$ {cambio?.margemDolarValor || '0.0050'} / USD)
              </span>
            </div>
          </div>
        </div>

        {/* Range Intraday */}
        {cambio?.minima && cambio?.maxima && (
          <>
            <div className="h-7 w-px bg-slate-800 hidden lg:block" />
            <div className="hidden lg:block">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                Range Intraday
              </span>
              <div className="text-[11px] font-mono text-slate-300">
                <span className="text-slate-400">Mín:</span> R$ {Number(cambio.minima).toFixed(4)}{' '}
                <span className="text-slate-600">|</span>{' '}
                <span className="text-slate-400">Máx:</span> R$ {Number(cambio.maxima).toFixed(4)}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. BLOCO PRINCIPAL: 4 CARDS DE INDICADORES DE ALTO IMPACTO (TV)          */}
      {/* ========================================================================= */}
      <section className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* CARD 1: PRÓXIMO DEADLINE EMBARQUE COM ALERTA VISUAL PULSANTE */}
        <div
          className={`p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between shadow-xl transition-all relative overflow-hidden ${
            proximoDeadline?.atrasado
              ? 'animate-pulse-danger bg-gradient-to-br from-[#260e15] via-[#160a0f] to-[#0b1120]'
              : proximoDeadline?.urgente
              ? 'animate-pulse-warning bg-gradient-to-br from-[#26170a] via-[#150d06] to-[#0b1120]'
              : 'bg-[#0b1120] border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    proximoDeadline?.atrasado
                      ? 'bg-rose-500/20 text-rose-400'
                      : proximoDeadline?.urgente
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-blue-500/15 text-blue-400'
                  }`}
                >
                  {proximoDeadline?.atrasado ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                  ) : proximoDeadline?.urgente ? (
                    <Clock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Anchor className="w-4 h-4" />
                  )}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Próximo Deadline Embarque
                </span>
              </div>
              {proximoDeadline && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider border ${
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
              <div className="mt-2 space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono font-black text-lg sm:text-xl text-white">
                    {proximoDeadline.numeroProcesso}
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-400">
                    {(proximoDeadline.volumeKg / 1000).toFixed(0)} Toneladas
                  </span>
                </div>

                <div className="text-xs text-slate-200 font-bold truncate">
                  {proximoDeadline.clienteFinal}
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Navio:</span>
                    <strong className="text-slate-200 truncate max-w-[140px]">{proximoDeadline.navio}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Porto Destino:</span>
                    <strong className="text-slate-200">{proximoDeadline.portoDestino}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Booking:</span>
                    <span className="font-mono text-slate-300">{proximoDeadline.bookingNumero}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                Nenhum deadline pendente cadastrado.
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Controle Portuário</span>
            <span className={`font-mono font-bold ${
              proximoDeadline?.atrasado
                ? 'text-rose-400'
                : proximoDeadline?.urgente
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}>
              {proximoDeadline?.atrasado ? 'Atenção Imediata' : proximoDeadline?.urgente ? 'Atenção Crítica' : 'Fluxo Normal'}
            </span>
          </div>
        </div>

        {/* CARD 2: NEGOCIAÇÕES EM EXECUÇÃO */}
        <div className="p-3.5 sm:p-4 bg-[#0b1120] border border-slate-800 rounded-xl flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Em Execução
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
                Operações Ativas
              </span>
            </div>

            <div className="mt-2">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight tabular-nums">
                {emExecucao?.total || 0} <span className="text-xs font-bold text-slate-400">contratos</span>
              </div>

              <div className="mt-2.5 space-y-1 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Volume Total:</span>
                  <span className="font-mono font-bold text-slate-100">
                    {emExecucao?.volumeToneladas || 0} t
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sacaria Estimada:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {Number(emExecucao?.volumeSacas || 0).toLocaleString('pt-BR')} sc
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Contêineres em Lote:</span>
                  <span className="font-mono font-bold text-orange-400">
                    {emExecucao?.containers || 0} cont.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>Fase 1 a 3 (Indústria e REDEX)</span>
            <span className="font-mono text-emerald-400">Operando</span>
          </div>
        </div>

        {/* CARD 3: NEGOCIAÇÕES EMBARCADAS */}
        <div className="p-3.5 sm:p-4 bg-[#0b1120] border border-slate-800 rounded-xl flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                  <Ship className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Negociações Embarcadas
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Carga Despachada
              </span>
            </div>

            <div className="mt-2">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight tabular-nums">
                {embarcadas?.total || 0} <span className="text-xs font-bold text-slate-400">embarcadas</span>
              </div>

              <div className="mt-2.5 space-y-1 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Volume Despachado:</span>
                  <span className="font-mono font-bold text-slate-100">
                    {embarcadas?.volumeToneladas || 0} t
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sacaria Embarcada:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {Number(embarcadas?.volumeSacas || 0).toLocaleString('pt-BR')} sc
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Contêineres no Mar:</span>
                  <span className="font-mono font-bold text-blue-400">
                    {embarcadas?.containers || 0} cont.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>Fase 4 (Exportação Marítima)</span>
            <span className="font-mono text-blue-400">Em Trânsito / BL</span>
          </div>
        </div>

        {/* CARD 4: NOTAS FISCAIS SEM AVERBAÇÃO & RISCO FISCAL CRÍTICO */}
        <div
          className={`p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between shadow-xl transition-all relative overflow-hidden ${
            fiscal?.semAverbacaoEEmbarcadas > 0
              ? 'animate-pulse-warning bg-gradient-to-br from-[#26170a] via-[#140e06] to-[#0b1120]'
              : 'bg-[#0b1120] border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    fiscal?.semAverbacaoEEmbarcadas > 0
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-400'
                  }`}
                >
                  {fiscal?.semAverbacaoEEmbarcadas > 0 ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Averbação SEFAZ
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                Etapa 4 NFe
              </span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight tabular-nums">
                  {fiscal?.semAverbacaoTotal || 0} <span className="text-xs font-bold text-slate-400">sem averbar</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {fiscal?.totalAverbadas || 0} averbada(s)
                </span>
              </div>

              {/* ALERTA CRÍTICO: Cargas já embarcadas sem averbação */}
              <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Embarcadas sem averbação:</span>
                  </span>
                  <span className="font-mono font-black text-xs text-amber-400 tabular-nums">
                    {fiscal?.semAverbacaoEEmbarcadas || 0} NFs
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {fiscal?.semAverbacaoEEmbarcadas > 0
                    ? 'Atenção: Prazo legal Siscomex 60 dias.'
                    : 'Sem carga embarcada em risco.'}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progresso Averbação */}
          <div className="mt-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Índice Geral de Averbação</span>
              <span className="font-mono font-bold text-emerald-400">
                {Number(fiscal?.percAverbado || 0).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${fiscal?.percAverbado || 0}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PARTE INFERIOR: NEGOCIAÇÕES (ROLAGEM CONTÍNUA TV COM ALERTAS VISUAIS) */}
      {/* ========================================================================= */}
      <footer className="shrink-0 space-y-1.5 pb-1">
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="font-black uppercase tracking-wider text-white text-xs sm:text-sm">
              Negociações
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {tickerItems.length} ativas
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
          className="bg-[#0b1120] border border-slate-800/90 rounded-xl p-2 overflow-x-auto no-scrollbar shadow-lg"
        >
          <div
            className={`flex items-stretch gap-2.5 ${
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
                  className={`w-72 sm:w-80 h-[135px] p-2.5 sm:p-3 rounded-xl transition-all flex flex-col justify-between shrink-0 shadow-md group relative overflow-hidden ${
                    isAtrasado
                      ? 'animate-pulse-danger bg-gradient-to-b from-[#260e14] to-[#0d1424]'
                      : isCritico
                      ? 'animate-pulse-warning bg-gradient-to-b from-[#22160a] to-[#0d1424]'
                      : 'bg-[#0e172a] border border-slate-800 hover:border-orange-500/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-sm text-white group-hover:text-orange-400 transition-colors">
                          {item.numeroProcesso}
                        </span>
                        {isAtrasado && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                        {isCritico && !isAtrasado && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        )}
                      </div>

                      {/* BADGE DE DEADLINE VENCIDO OU CRÍTICO */}
                      {isAtrasado ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500/60 animate-pulse">
                          {item.deadlineTexto || 'Vencido'}
                        </span>
                      ) : isCritico ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-amber-500/30 text-amber-300 border border-amber-500/60 animate-pulse">
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

                    <div className="text-xs font-bold text-slate-200 truncate" title={item.clienteFinal}>
                      {item.clienteFinal}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate max-w-[160px]">{item.produto}</span>
                      <span className="font-mono font-bold text-slate-200 shrink-0">
                        {(item.volumeKg / 1000).toFixed(0)} Ton
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-300">
                    <div className="truncate max-w-[160px]" title={item.portoDestino}>
                      Destino: <strong className="text-white">{item.portoDestino}</strong>
                    </div>

                    <div className="flex items-center gap-1 font-mono shrink-0 text-slate-400">
                      <Container className="w-3 h-3 text-slate-400" />
                      <span>{item.containers} cont.</span>
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
