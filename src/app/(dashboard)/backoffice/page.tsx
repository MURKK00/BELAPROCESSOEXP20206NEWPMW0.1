'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
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
  CircleDot,
  Eye,
  EyeOff
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

  // 4. Modo Tela Cheia Imersivo (Cobre toda a tela sem barras laterais ou superiores)
  const alternarFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Formatar Horário por Fuso
  const formatarHoraFuso = (timeZone: string) => {
    if (!dataAtual) return '--:--:--';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(dataAtual);
  };

  const formatarDataFuso = (timeZone: string) => {
    if (!dataAtual) return '--/--';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone,
      day: '2-digit',
      month: '2-digit',
    }).format(dataAtual);
  };

  const proximoDeadline = dados?.proximoDeadline;
  const emExecucao = dados?.negociacoesEmExecucao;
  const embarcadas = dados?.negociacoesEmbarcadas;
  const fiscal = dados?.auditoriaFiscal;
  const cambio = dados?.cambio;
  const commodities = dados?.commodities;
  const soja = commodities?.sojaCbot;
  const milho = commodities?.milhoCbot;
  const indicadoresCepea: any[] = commodities?.indicadoresCepea || [];
  const dolarFuturo = cambio?.dolarFuturo;
  const tickerItems: any[] = dados?.ticker || [];
  const alertasDeadlines = dados?.alertasDeadlines;

  const totalVencidos = alertasDeadlines?.totalVencidos || 0;
  const totalCriticos = alertasDeadlines?.totalCriticos || 0;

  // Conversões agro CBOT
  const dolarRef = Number(cambio?.dolarLive ?? 5.4245);
  const sojaUsdTon = soja?.preco ? (Number(soja.preco) / 100) * 36.7437 : 452.87;
  const sojaReaisSaca = soja?.preco ? ((Number(soja.preco) / 100) * 2.20462 * dolarRef) + 14.50 : 161.89;
  const milhoUsdTon = milho?.preco ? (Number(milho.preco) / 100) * 39.368 : 176.76;
  const milhoReaisSaca = milho?.preco ? ((Number(milho.preco) / 100) * 2.3621 * dolarRef) + 11.20 : 68.73;

  return (
    <div
      className={`w-full bg-[#060913] text-slate-100 flex flex-col justify-between p-2 sm:p-3 overflow-hidden select-none font-sans ${
        isFullScreen ? 'fixed inset-0 z-[99999] h-screen w-screen' : 'h-screen max-h-screen'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOPO: HEADER SLIM + 7 RELÓGIOS MUNDIAIS COM BANDEIRAS VISÍVEIS         */}
      {/* ========================================================================= */}
      <header className="shrink-0 space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/40 shadow-xs">
              <Tv2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                BELA CEREAIS <span className="text-orange-400">|</span> BACKOFFICE TV COCKPIT
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-wider">
                Live Wallboard 50&quot;
              </span>
              {totalVencidos > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  {totalVencidos} VENCIDOS
                </span>
              )}
              {totalCriticos > 0 && (
                <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {totalCriticos} CRÍTICOS (&lt; 72H)
                </span>
              )}
            </div>
          </div>

          {/* Controles de Atualização & Tela Cheia */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
              <RefreshCw className="w-3 h-3 text-orange-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-slate-400">Sync:</span>
              <strong className="text-orange-400 font-bold">{segundosParaRefresh}s</strong>
            </div>

            <button
              type="button"
              onClick={() => carregarMetricas()}
              disabled={loading}
              title="Atualizar agora"
              className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={alternarFullscreen}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-sm ${
                isFullScreen 
                  ? 'bg-rose-500/30 border border-rose-500/50 text-rose-300 hover:bg-rose-500/40' 
                  : 'bg-orange-600/30 border border-orange-500/50 hover:bg-orange-600/50 text-orange-300'
              }`}
            >
              {isFullScreen ? (
                <>
                  <Minimize className="w-3.5 h-3.5" />
                  <span>Sair da TV</span>
                </>
              ) : (
                <>
                  <Maximize className="w-3.5 h-3.5" />
                  <span>Tela Cheia (TV 50&quot;)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 7 RELÓGIOS MUNDIAIS COM BANDEIRAS NATIVAS VISÍVEIS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
          {WORLD_CLOCKS.map((clock) => {
            const hora = formatarHoraFuso(clock.timeZone);
            const dataFuso = formatarDataFuso(clock.timeZone);
            const isBrasil = clock.pais === 'Brasil';

            return (
              <div
                key={clock.pais}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between transition-colors shadow-xs ${
                  isBrasil
                    ? 'bg-gradient-to-r from-[#0d1e17] to-[#0b1522] border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : 'bg-[#0b1120] border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Bandeira com tag img explícita para renderizar 100% dos assets */}
                  <div className="w-8 h-5 min-w-[32px] min-h-[20px] rounded overflow-hidden border border-slate-700 shadow-xs shrink-0 bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={clock.bandeiraImg}
                      alt={clock.pais}
                      className="w-full h-full object-cover block"
                      loading="eager"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate leading-tight">
                      {clock.pais}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate font-medium">
                      {clock.cidade}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-1">
                  <span className="text-sm sm:text-base font-black text-white font-mono tracking-tight block leading-tight tabular-nums">
                    {hora}
                  </span>
                  <div className="flex items-center justify-end gap-1 text-[9px] font-mono text-slate-400">
                    <span className="text-slate-400 font-semibold">{clock.fuso}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{dataFuso}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. LINHA DE CARDS PRINCIPAIS: KPIS OPERACIONAIS                           */}
      {/* ========================================================================= */}
      <section className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* CARD 1: PRÓXIMO DEADLINE */}
        <div
          className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border flex flex-col justify-between shadow-md h-[105px] ${
            proximoDeadline?.atrasado
              ? 'animate-pulse-danger bg-gradient-to-br from-[#280d16] via-[#1a0a10] to-[#0b1120]'
              : proximoDeadline?.urgente
              ? 'animate-pulse-warning bg-gradient-to-br from-[#24170a] via-[#160e06] to-[#0b1120]'
              : 'bg-[#0b1120] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className={`p-1 rounded-md ${
                  proximoDeadline?.atrasado
                    ? 'bg-rose-500/25 text-rose-300'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Próximo Deadline
              </span>
            </div>
            {proximoDeadline && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider ${
                  proximoDeadline.atrasado
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/60 animate-pulse'
                    : 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                }`}
              >
                {proximoDeadline.tempoTexto}
              </span>
            )}
          </div>

          <div className="my-0.5 flex items-baseline justify-between">
            <div className="font-mono font-black text-xl sm:text-2xl text-amber-400 tracking-tight">
              {proximoDeadline?.numeroProcesso || 'Sem processos'}
            </div>
            <div className="font-mono font-bold text-xs text-slate-200">
              {proximoDeadline?.volumeKg ? `${(proximoDeadline.volumeKg / 1000).toFixed(0)} Toneladas` : ''}
            </div>
          </div>

          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300 font-medium">
            <div className="truncate max-w-[200px]">
              <span className="text-slate-400">Navio:</span>{' '}
              <strong className="text-white">{proximoDeadline?.navio || 'Nomear'}</strong>
            </div>
            <div className="truncate max-w-[170px] text-right font-mono text-slate-300">
              {proximoDeadline?.portoDestino || 'Destino a definir'}
            </div>
          </div>
        </div>

        {/* CARD 2: NEGOCIAÇÕES EM EXECUÇÃO */}
        <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl flex flex-col justify-between shadow-md h-[105px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-md bg-orange-500/15 text-orange-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Em Execução
              </span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
              Operações Ativas
            </span>
          </div>

          <div className="my-0.5 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              {emExecucao?.total || 0}{' '}
              <span className="text-xs font-bold text-slate-400">contratos</span>
            </div>
            <span className="font-mono font-bold text-xs text-orange-400">
              {emExecucao?.containers || 0} contêineres
            </span>
          </div>

          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
            <span>Volume: <strong className="text-white font-mono">{emExecucao?.volumeToneladas || 0} t</strong></span>
            <span className="font-mono text-slate-300">{Number(emExecucao?.volumeSacas || 0).toLocaleString('pt-BR')} sc</span>
          </div>
        </div>

        {/* CARD 3: NEGOCIAÇÕES EMBARCADAS */}
        <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl flex flex-col justify-between shadow-md h-[105px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-md bg-blue-500/15 text-blue-400">
                <Ship className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Negociações Embarcadas
              </span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
              No Mar / BL
            </span>
          </div>

          <div className="my-0.5 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              {embarcadas?.total || 0}{' '}
              <span className="text-xs font-bold text-slate-400">embarcadas</span>
            </div>
            <span className="font-mono font-bold text-xs text-blue-400">
              {embarcadas?.containers || 0} contêineres
            </span>
          </div>

          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
            <span>Volume: <strong className="text-white font-mono">{embarcadas?.volumeToneladas || 0} t</strong></span>
            <span className="font-mono text-slate-300">{Number(embarcadas?.volumeSacas || 0).toLocaleString('pt-BR')} sc</span>
          </div>
        </div>

        {/* CARD 4: AVERBAÇÃO SEFAZ & ALERTA FISCAL */}
        <div
          className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border flex flex-col justify-between shadow-md h-[105px] ${
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
                    ? 'bg-amber-500/25 text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {fiscal?.semAverbacaoEEmbarcadas > 0 ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Averbação SEFAZ
              </span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              Etapa 4 NFe
            </span>
          </div>

          <div className="my-0.5 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              {fiscal?.semAverbacaoTotal || 0}{' '}
              <span className="text-xs font-bold text-slate-400">sem averbar</span>
            </div>
            <span className="font-mono font-bold text-xs text-emerald-400">
              {fiscal?.totalAverbadas || 0} averbada(s)
            </span>
          </div>

          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-amber-300 flex items-center gap-1 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Embarcadas s/ averbação:
            </span>
            <strong className="text-amber-400 font-mono font-black text-xs">
              {fiscal?.semAverbacaoEEmbarcadas || 0} NFs
            </strong>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. RETÂNGULO HORIZONTAL 1: COTAÇÕES DO DÓLAR & MERCADO FX                */}
      {/* ========================================================================= */}
      <section className="shrink-0 w-full bg-[#0b1120] border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Célula 1: Título e Status de Mercado Aberto/Fechado */}
          <div className="flex items-center gap-2.5 min-w-[210px]">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider block">
                Câmbio &amp; Dólar
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-mono font-black tracking-wider border ${
                    cambio?.aberto
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <CircleDot className={`w-2.5 h-2.5 ${cambio?.aberto ? 'text-emerald-400 fill-emerald-400' : 'text-slate-400'}`} />
                  {cambio?.statusLabel || (cambio?.aberto ? 'MERCADO ABERTO' : 'PREGÃO FECHADO')}
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden xl:inline">
                  {cambio?.detalheSessao || 'Seg a Sex · 09h às 17h'}
                </span>
              </div>
            </div>
          </div>

          {/* Célula 2: Dólar Comercial Spot (Grande em Destaque) */}
          <div className="border-l border-slate-800/80 pl-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Dólar Comercial Spot (USDBRL)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-black text-2xl sm:text-3xl text-emerald-400 tabular-nums tracking-tight">
                R$ {Number(cambio?.dolarLive ?? 5.4245).toFixed(4)}
              </span>
              <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded border ${
                Number(cambio?.dolarVariacaoPct || 0) >= 0 
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}>
                {Number(cambio?.dolarVariacaoPct || 0) >= 0 ? '+' : ''}{Number(cambio?.dolarVariacaoPct || 0).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Célula 3: Máxima e Mínima do Dia */}
          <div className="border-l border-slate-800/80 pl-3 bg-slate-900/60 px-2.5 py-1 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Range Intraday
            </span>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-slate-300">
                <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-400">Mín:</span>
                <strong className="text-white font-bold">R$ {Number(cambio?.minima ?? 5.3598).toFixed(4)}</strong>
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1 text-slate-300">
                <ArrowUpRight className="w-3 h-3 text-rose-400" />
                <span className="text-slate-400">Máx:</span>
                <strong className="text-white font-bold">R$ {Number(cambio?.maxima ?? 5.4258).toFixed(4)}</strong>
              </span>
            </div>
          </div>

          {/* Célula 4: Dólar Futuro B3 (DOL) */}
          <div className="border-l border-slate-800/80 pl-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider font-mono">
                Dólar Futuro B3 (DOL)
              </span>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                1º Venc.
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-black text-xl sm:text-2xl text-cyan-300 tabular-nums">
                R$ {Number(dolarFuturo?.preco ?? (dolarRef + 0.0265)).toFixed(4)}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                +{dolarFuturo?.pontosForward || '26.5'} pts
              </span>
            </div>
          </div>

          {/* Célula 5: PTAX BACEN Oficial */}
          <div className="border-l border-slate-800/80 pl-3 hidden md:block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              PTAX BACEN (Oficial)
            </span>
            <div className="flex items-baseline gap-2 text-xs font-mono">
              <span className="font-black text-white">Venda: R$ {Number(cambio?.ptaxVenda ?? 5.3744).toFixed(4)}</span>
              <span className="text-slate-400 text-[10px]">(C: R$ {Number(cambio?.ptaxCompra ?? 5.3688).toFixed(4)})</span>
            </div>
          </div>

          {/* Célula 6: Margem Dólar (Spread) */}
          <div className="border-l border-slate-800/80 pl-3 hidden lg:block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Margem / Spread
            </span>
            <div className="font-mono font-black text-sm text-amber-400 tabular-nums">
              +{cambio?.margemDolarPct || '0.92'}%
              <span className="text-[10px] text-slate-400 font-normal ml-1">
                (Δ R$ {cambio?.margemDolarValor || '0.0501'})
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. RETÂNGULO HORIZONTAL 2: COMMODITIES CBOT & INDICADORES CEPEA/ESALQ    */}
      {/* ========================================================================= */}
      <section className="shrink-0 w-full bg-[#0b1120] border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-center">
          
          {/* Célula 1: Identificação Agro */}
          <div className="flex items-center gap-2 lg:col-span-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Wheat className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider block">
                Agro &amp; CEPEA
              </span>
              <span className="text-[10px] font-mono text-slate-400 block">
                CBOT · CME · CEPEA/ESALQ
              </span>
            </div>
          </div>

          {/* Célula 2: Soja CBOT */}
          <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-mono font-black text-xs text-slate-100">SOJA CBOT (ZS=F)</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                (soja?.variacaoPct ?? -0.18) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}>
                {(soja?.variacaoPct ?? -0.18) >= 0 ? '+' : ''}{(soja?.variacaoPct ?? -0.18).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="font-mono font-black text-lg text-amber-400 tabular-nums">
                {Number(soja?.preco ?? 1232.50).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">¢/bu</span>
              </div>
              <div className="text-right text-[10px] font-mono text-slate-300 leading-tight">
                <div>US$ {sojaUsdTon.toFixed(2)}/t</div>
                <div className="text-emerald-400 font-bold">R$ {sojaReaisSaca.toFixed(2)}/sc</div>
              </div>
            </div>
          </div>

          {/* Célula 3: Milho CBOT */}
          <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-mono font-black text-xs text-slate-100">MILHO CBOT (ZC=F)</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                (milho?.variacaoPct ?? -0.50) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}>
                {(milho?.variacaoPct ?? -0.50) >= 0 ? '+' : ''}{(milho?.variacaoPct ?? -0.50).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="font-mono font-black text-lg text-amber-400 tabular-nums">
                {Number(milho?.preco ?? 449.00).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">¢/bu</span>
              </div>
              <div className="text-right text-[10px] font-mono text-slate-300 leading-tight">
                <div>US$ {milhoUsdTon.toFixed(2)}/t</div>
                <div className="text-emerald-400 font-bold">R$ {milhoReaisSaca.toFixed(2)}/sc</div>
              </div>
            </div>
          </div>

          {/* Célula 4: Soja CEPEA Paranaguá */}
          <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-mono font-black text-xs text-emerald-400 uppercase">SOJA CEPEA</span>
              <span className="text-[9px] font-mono text-slate-400">Paranaguá (FOB)</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="font-mono font-black text-lg text-white tabular-nums">
                {indicadoresCepea[0]?.precoFormatado || 'R$ 161,89'}
              </div>
              <div className="text-right text-[10px] font-mono text-emerald-400 font-bold">
                {indicadoresCepea[0]?.precoSecundario || 'US$ 29.84/sc'}
              </div>
            </div>
          </div>

          {/* Célula 5: Milho CEPEA Campinas */}
          <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-mono font-black text-xs text-amber-400 uppercase">MILHO CEPEA</span>
              <span className="text-[9px] font-mono text-slate-400">Campinas (B3)</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="font-mono font-black text-lg text-white tabular-nums">
                {indicadoresCepea[1]?.precoFormatado || 'R$ 68,73'}
              </div>
              <div className="text-right text-[10px] font-mono text-amber-400 font-bold">
                {indicadoresCepea[1]?.precoSecundario || 'US$ 12.67/sc'}
              </div>
            </div>
          </div>

          {/* Célula 6: Algodão em Pluma CEPEA */}
          <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-mono font-black text-xs text-purple-300 uppercase">ALGODÃO CEPEA</span>
              <span className="text-[9px] font-mono text-slate-400">Praça SP Pluma</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="font-mono font-black text-lg text-purple-300 tabular-nums">
                {indicadoresCepea[2]?.precoFormatado || 'R$ 4,1757'}
              </div>
              <div className="text-right text-[10px] font-mono text-slate-300">
                {indicadoresCepea[2]?.precoSecundario || 'R$ 138,09/@'}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PARTE INFERIOR: NEGOCIAÇÕES EM CARROSSEL COM BOOKING E DATA DEADLINE  */}
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
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                {totalVencidos} com deadline vencido
              </span>
            )}
            {totalCriticos > 0 && (
              <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse">
                <Clock className="w-3 h-3 text-amber-400" />
                {totalCriticos} críticos (&lt; 72h)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <button
              type="button"
              onClick={() => setAutoScrollPausado(!autoScrollPausado)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:text-white cursor-pointer font-bold"
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

        {/* CONTAINER COM ROLAGEM AUTOMÁTICA EM LOOP (ALTURA CONTROLADA SEM CORTES) */}
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
                  className={`w-[360px] sm:w-[400px] h-[155px] p-3 rounded-xl transition-all flex flex-col justify-between shrink-0 shadow-lg group relative overflow-hidden ${
                    isAtrasado
                      ? 'animate-pulse-danger bg-gradient-to-b from-[#280d16] via-[#1a0a10] to-[#0d1424]'
                      : isCritico
                      ? 'animate-pulse-warning bg-gradient-to-b from-[#24170a] via-[#160e06] to-[#0d1424]'
                      : 'bg-[#0e172a] border border-slate-800 hover:border-orange-500/50'
                  }`}
                >
                  {/* Linha 1: Processo + Status / Alerta Deadline */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
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

                  {/* Linha 2: BOOKING E DATA DO DEADLINE EM EVIDÊNCIA */}
                  <div className="px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1 text-slate-300 truncate max-w-[190px]">
                      <Bookmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[10px] text-slate-400">BKG:</span>
                      <strong className="text-amber-300 font-bold truncate">
                        {item.bookingNumero || item.booking || 'A Definir'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1 border-l border-slate-800 pl-2 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="text-[10px] text-slate-400">Deadline:</span>
                      <strong className="text-orange-300 font-bold">
                        {item.deadlineEmbarque || 'A Definir'}
                      </strong>
                    </div>
                  </div>

                  {/* Linha 3: Cliente & Produto / Volume */}
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-100 truncate" title={item.clienteFinal}>
                      {item.clienteFinal}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="truncate max-w-[210px] text-slate-200">{item.produto}</span>
                      <span className="font-mono font-bold text-white shrink-0">
                        {(item.volumeKg / 1000).toFixed(0)} t{' '}
                        {item.sacas ? `(${item.sacas.toLocaleString('pt-BR')} sc)` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Linha 4: Logística (Navio, Destino e Contêineres) */}
                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-300">
                    <div className="truncate max-w-[240px]" title={`${item.navio} -> ${item.portoDestino}`}>
                      <span className="text-slate-400">Navio:</span>{' '}
                      <strong className="text-white">{item.navio}</strong>{' '}
                      <span className="text-orange-400">➔</span> {item.portoDestino}
                    </div>

                    <div className="flex items-center gap-1 font-mono shrink-0 text-slate-300">
                      <Container className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-white">{item.containers} cont.</span>
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
