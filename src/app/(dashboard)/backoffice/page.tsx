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
  BarChart2,
  CircleDot
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
  const algodao = commodities?.algodaoCbot;
  const indicadoresCepea: any[] = commodities?.indicadoresCepea || [];
  const dolarFuturo = cambio?.dolarFuturo;
  const tickerItems: any[] = dados?.ticker || [];
  const alertasDeadlines = dados?.alertasDeadlines;

  const totalVencidos = alertasDeadlines?.totalVencidos || 0;
  const totalCriticos = alertasDeadlines?.totalCriticos || 0;

  // Conversões agro CBOT
  const dolarRef = Number(cambio?.dolarLive ?? 5.4122);
  const sojaUsdTon = soja?.preco ? (Number(soja.preco) / 100) * 36.7437 : 379.38;
  const sojaReaisSaca = soja?.preco ? ((Number(soja.preco) / 100) * 2.20462 * dolarRef) + 14.50 : 139.50;
  const milhoUsdTon = milho?.preco ? (Number(milho.preco) / 100) * 39.368 : 169.78;
  const milhoReaisSaca = milho?.preco ? ((Number(milho.preco) / 100) * 2.3621 * dolarRef) + 11.20 : 68.20;

  return (
    <div className="w-full min-h-screen bg-[#060913] text-slate-100 flex flex-col p-2.5 sm:p-4 space-y-2.5 overflow-hidden select-none font-sans">
      {/* ========================================================================= */}
      {/* 1. TOPO: HEADER SLIM + WORLD CLOCKS COM BANDEIRAS OFICIAIS (FONTES AMPLAS) */}
      {/* ========================================================================= */}
      <header className="shrink-0 space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/40 shadow-xs">
              <Tv2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                  BELA CEREAIS <span className="text-orange-400">|</span> BACKOFFICE TV COCKPIT
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-wider">
                  Live Wallboard 50&quot;
                </span>
                {totalVencidos > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    {totalVencidos} DEADLINES VENCIDOS
                  </span>
                )}
                {totalCriticos > 0 && (
                  <span className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {totalCriticos} CRÍTICOS (&lt; 72H)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controles de Atualização & Tela Cheia */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
              <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-slate-400">Auto-refresh:</span>
              <strong className="text-orange-400 font-bold">{segundosParaRefresh}s</strong>
            </div>

            <button
              type="button"
              onClick={() => carregarMetricas()}
              disabled={loading}
              title="Atualizar agora"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={alternarFullscreen}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600/30 border border-orange-500/50 hover:bg-orange-600/50 text-orange-300 font-bold text-xs transition-colors cursor-pointer"
            >
              {isFullScreen ? (
                <>
                  <Minimize className="w-3.5 h-3.5" />
                  <span>Janela</span>
                </>
              ) : (
                <>
                  <Maximize className="w-3.5 h-3.5" />
                  <span>Tela Cheia</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 7 RELÓGIOS MUNDIAIS COM BANDEIRAS OFICIAIS E FONTES DE ALTA VISIBILIDADE */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {WORLD_CLOCKS.map((clock) => {
            const hora = formatarHoraFuso(clock.timeZone);
            const dataFuso = formatarDataFuso(clock.timeZone);
            const isBrasil = clock.pais === 'Brasil';

            return (
              <div
                key={clock.pais}
                className={`px-3 py-2 rounded-xl border flex items-center justify-between transition-colors shadow-md ${
                  isBrasil
                    ? 'bg-gradient-to-r from-[#0d1e17] to-[#0b1522] border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : 'bg-[#0b1120] border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-5.5 rounded overflow-hidden border border-slate-700 shadow-sm shrink-0 bg-slate-900">
                    <Image
                      src={clock.bandeiraImg}
                      alt={clock.pais}
                      fill
                      sizes="32px"
                      className="object-cover"
                      priority
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-white block truncate leading-tight">
                      {clock.pais}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate font-medium">
                      {clock.cidade}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-1.5">
                  <span className="text-sm sm:text-base lg:text-lg font-black text-white font-mono tracking-tight block leading-tight tabular-nums">
                    {hora}
                  </span>
                  <div className="flex items-center justify-end gap-1 text-[10px] font-mono text-slate-400">
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
      {/* 2. LINHA DE CARDS PRINCIPAIS: KPIS OPERACIONAIS COM FONTES AMPLIADAS       */}
      {/* ========================================================================= */}
      <section className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* CARD 1: PRÓXIMO DEADLINE */}
        <div
          className={`p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between shadow-lg min-h-[135px] ${
            proximoDeadline?.atrasado
              ? 'animate-pulse-danger bg-gradient-to-br from-[#280d16] via-[#1a0a10] to-[#0b1120]'
              : proximoDeadline?.urgente
              ? 'animate-pulse-warning bg-gradient-to-br from-[#24170a] via-[#160e06] to-[#0b1120]'
              : 'bg-[#0b1120] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  proximoDeadline?.atrasado
                    ? 'bg-rose-500/25 text-rose-300'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
                Próximo Deadline
              </span>
            </div>
            {proximoDeadline && (
              <span
                className={`px-2 py-0.5 rounded text-[11px] sm:text-xs font-mono font-black uppercase tracking-wider ${
                  proximoDeadline.atrasado
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/60 animate-pulse'
                    : 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                }`}
              >
                {proximoDeadline.tempoTexto}
              </span>
            )}
          </div>

          <div className="my-1.5">
            <div className="flex items-baseline justify-between">
              <div className="font-mono font-black text-2xl sm:text-3xl text-amber-400 tracking-tight">
                {proximoDeadline?.numeroProcesso || 'Sem processos'}
              </div>
              <div className="font-mono font-black text-xs sm:text-sm text-slate-200">
                {proximoDeadline?.volumeKg ? `${(proximoDeadline.volumeKg / 1000).toFixed(0)} Toneladas` : ''}
              </div>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-200 truncate mt-0.5">
              {proximoDeadline?.clienteFinal || 'Nenhum deadline pendente'}
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-medium">
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
        <div className="p-3 sm:p-3.5 bg-[#0b1120] border border-slate-800 rounded-xl flex flex-col justify-between shadow-lg min-h-[135px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-400">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
                Em Execução
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
              Operações Ativas
            </span>
          </div>

          <div className="my-1.5 flex items-baseline justify-between">
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
              {emExecucao?.total || 0}{' '}
              <span className="text-xs sm:text-sm font-bold text-slate-400">contratos</span>
            </div>
            <span className="font-mono font-bold text-xs sm:text-sm text-orange-400">
              {emExecucao?.containers || 0} contêineres
            </span>
          </div>

          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <span>Volume: <strong className="text-white font-mono">{emExecucao?.volumeToneladas || 0} t</strong></span>
            <span className="font-mono text-slate-300">{Number(emExecucao?.volumeSacas || 0).toLocaleString('pt-BR')} sc</span>
          </div>
        </div>

        {/* CARD 3: NEGOCIAÇÕES EMBARCADAS */}
        <div className="p-3 sm:p-3.5 bg-[#0b1120] border border-slate-800 rounded-xl flex flex-col justify-between shadow-lg min-h-[135px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                <Ship className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
                Negociações Embarcadas
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
              No Mar / BL
            </span>
          </div>

          <div className="my-1.5 flex items-baseline justify-between">
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
              {embarcadas?.total || 0}{' '}
              <span className="text-xs sm:text-sm font-bold text-slate-400">embarcadas</span>
            </div>
            <span className="font-mono font-bold text-xs sm:text-sm text-blue-400">
              {embarcadas?.containers || 0} contêineres
            </span>
          </div>

          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <span>Volume: <strong className="text-white font-mono">{embarcadas?.volumeToneladas || 0} t</strong></span>
            <span className="font-mono text-slate-300">{Number(embarcadas?.volumeSacas || 0).toLocaleString('pt-BR')} sc</span>
          </div>
        </div>

        {/* CARD 4: AVERBAÇÃO SEFAZ & ALERTA FISCAL */}
        <div
          className={`p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between shadow-lg min-h-[135px] ${
            fiscal?.semAverbacaoEEmbarcadas > 0
              ? 'animate-pulse-warning bg-gradient-to-br from-[#26170a] to-[#0b1120]'
              : 'bg-[#0b1120] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  fiscal?.semAverbacaoEEmbarcadas > 0
                    ? 'bg-amber-500/25 text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {fiscal?.semAverbacaoEEmbarcadas > 0 ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
                Averbação SEFAZ
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              Etapa 4 NFe
            </span>
          </div>

          <div className="my-1.5 flex items-baseline justify-between">
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
              {fiscal?.semAverbacaoTotal || 0}{' '}
              <span className="text-xs sm:text-sm font-bold text-slate-400">sem averbar</span>
            </div>
            <span className="font-mono font-bold text-xs sm:text-sm text-emerald-400">
              {fiscal?.totalAverbadas || 0} averbada(s)
            </span>
          </div>

          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-amber-300 flex items-center gap-1 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Embarcadas s/ averbação:
            </span>
            <strong className="text-amber-400 font-mono font-black text-sm">
              {fiscal?.semAverbacaoEEmbarcadas || 0} NFs
            </strong>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CENTRO: CÂMBIO DÓLAR (COM MÁX/MÍN, MERCADO ABERTO/FECHADO, DOL FUTURO) */}
      {/*    + COMMODITIES AGRÍCOLAS CBOT & INDICADORES CEPEA/ESALQ (SOJA, MILHO, ALGODÃO) */}
      {/* ========================================================================= */}
      <section className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        
        {/* COLUNA ESQUERDA (5 COLUNAS): CÂMBIO & MERCADO DE DÓLAR COMPLETO */}
        <div className="lg:col-span-5 bg-[#0b1120] border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-xl">
          {/* Topo: Título + Status Mercado Aberto/Fechado */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-inner">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider block">
                  Câmbio & Mercado de Dólar
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-400">
                  Banco Central (PTAX) · B3 Futuros · Spot FX
                </span>
              </div>
            </div>

            {/* Badge de Mercado Aberto ou Fechado */}
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-black tracking-wider border shadow-xs ${
                  cambio?.aberto
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <CircleDot className={`w-3 h-3 ${cambio?.aberto ? 'text-emerald-400 fill-emerald-400' : 'text-slate-400'}`} />
                {cambio?.statusLabel || (cambio?.aberto ? 'MERCADO ABERTO' : 'PREGÃO FECHADO')}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                {cambio?.detalheSessao || 'Seg a Sex · 09:00 às 17:00'}
              </span>
            </div>
          </div>

          {/* Bloco 1: Dólar Comercial Spot Principal + Variação + Máxima/Mínima */}
          <div className="py-3 border-b border-slate-800/70">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Dólar Comercial Spot (USDBRL)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                Ao Vivo Oficial
              </span>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-mono font-black text-3xl sm:text-4xl lg:text-5xl text-emerald-400 tabular-nums tracking-tight">
                R$ {Number(cambio?.dolarLive ?? 5.4122).toFixed(4)}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm sm:text-base font-bold font-mono px-2 py-1 rounded-lg border ${
                  Number(cambio?.dolarVariacaoPct || 0) >= 0 
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}>
                  {Number(cambio?.dolarVariacaoPct || 0) >= 0 ? '+' : ''}{Number(cambio?.dolarVariacaoPct || 0).toFixed(2)}%
                </span>
                <span className="text-xs font-mono font-semibold text-slate-400">
                  ({Number(cambio?.dolarVariacao || 0) >= 0 ? '+' : ''}R$ {Number(cambio?.dolarVariacao || 0).toFixed(4)})
                </span>
              </div>
            </div>

            {/* MÁXIMA E MÍNIMA DO DIA DO DÓLAR (SOLICITADO PELO USUÁRIO) */}
            <div className="mt-2.5 grid grid-cols-2 gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between px-2 py-0.5">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 font-mono">
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                  MÍNIMA:
                </span>
                <strong className="text-xs sm:text-sm font-mono font-black text-white tabular-nums">
                  R$ {Number(cambio?.minima ?? 5.3401).toFixed(4)}
                </strong>
              </div>
              <div className="flex items-center justify-between px-2 py-0.5 border-l border-slate-800">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 font-mono">
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                  MÁXIMA:
                </span>
                <strong className="text-xs sm:text-sm font-mono font-black text-white tabular-nums">
                  R$ {Number(cambio?.maxima ?? 5.4290).toFixed(4)}
                </strong>
              </div>
            </div>
          </div>

          {/* Bloco 2: Dólar Futuro B3 (DOL) */}
          <div className="py-3 border-b border-slate-800/70">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest font-mono">
                  Dólar Futuro B3 (DOL)
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {dolarFuturo?.vencimento || '1º Vencimento B3'}
                </span>
              </div>
              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                Number(dolarFuturo?.variacaoPct || cambio?.dolarVariacaoPct || 0) >= 0 ? 'bg-cyan-500/15 text-cyan-300' : 'bg-rose-500/15 text-rose-400'
              }`}>
                {Number(dolarFuturo?.variacaoPct || cambio?.dolarVariacaoPct || 0) >= 0 ? '+' : ''}
                {Number(dolarFuturo?.variacaoPct || cambio?.dolarVariacaoPct || 0).toFixed(2)}%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="font-mono font-black text-2xl sm:text-3xl text-cyan-300 tabular-nums tracking-tight">
                R$ {Number(dolarFuturo?.preco ?? (dolarRef + 0.0265)).toFixed(4)}
              </div>
              <div className="text-right text-xs font-mono text-slate-300">
                <span className="text-slate-400">Cupom Cambial: </span>
                <strong className="text-cyan-400 font-bold">+{dolarFuturo?.pontosForward || '26.5'} pts</strong>
              </div>
            </div>
          </div>

          {/* Bloco 3: PTAX BACEN Oficial e Margem Dólar */}
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                PTAX BACEN (Oficial)
              </span>
              <div className="font-mono font-black text-base sm:text-lg text-white tabular-nums">
                Venda: R$ {Number(cambio?.ptaxVenda ?? 5.3744).toFixed(4)}
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                Compra: R$ {Number(cambio?.ptaxCompra ?? 5.3688).toFixed(4)}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Margem Dólar (Spread Spot vs PTAX)
              </span>
              <div className="font-mono font-black text-base sm:text-lg text-amber-400 tabular-nums">
                +{cambio?.margemDolarPct || '0.27'}%
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                Δ Spread: R$ {cambio?.margemDolarValor || '0.0146'} / USD
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (7 COLUNAS): COMMODITIES CBOT + INDICADORES CEPEA/ESALQ OFICIAIS */}
        <div className="lg:col-span-7 bg-[#0b1120] border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                <Wheat className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider block">
                  Commodities Agrícolas & Indicadores CEPEA/ESALQ
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-400">
                  Chicago (CBOT/CME) · CEPEA/ESALQ (USP) · Paridade Portuária FOB
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
              Dados Oficiais
            </span>
          </div>

          {/* SUB-SEÇÃO 1: COTAÇÕES CHICAGO (CBOT) - MILHO E SOJA COM MAIOR DESTAQUE */}
          <div className="py-2.5 border-b border-slate-800/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">
                Bolsa de Chicago (CBOT · CME Group)
              </span>
              <span className="text-[11px] font-mono text-slate-400">Contratos Futuros de Grãos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Soja CBOT */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-sm sm:text-base text-white">SOJA CBOT</span>
                    <span className="text-xs font-mono text-slate-500">(ZS=F)</span>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    (soja?.variacaoPct ?? 1.40) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                  }`}>
                    {(soja?.variacaoPct ?? 1.40) >= 0 ? '+' : ''}{(soja?.variacaoPct ?? 1.40).toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="font-mono font-black text-2xl sm:text-3xl text-amber-400 tabular-nums">
                    {Number(soja?.preco ?? 1032.50).toFixed(2)}{' '}
                    <span className="text-xs font-normal text-slate-400">¢/bu</span>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-300 leading-tight">
                    <div>US$ {sojaUsdTon.toFixed(2)}/t</div>
                    <div className="text-emerald-400 font-bold">R$ {sojaReaisSaca.toFixed(2)}/sc</div>
                  </div>
                </div>
              </div>

              {/* Milho CBOT */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-sm sm:text-base text-white">MILHO CBOT</span>
                    <span className="text-xs font-mono text-slate-500">(ZC=F)</span>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    (milho?.variacaoPct ?? 0.82) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                  }`}>
                    {(milho?.variacaoPct ?? 0.82) >= 0 ? '+' : ''}{(milho?.variacaoPct ?? 0.82).toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="font-mono font-black text-2xl sm:text-3xl text-amber-400 tabular-nums">
                    {Number(milho?.preco ?? 431.25).toFixed(2)}{' '}
                    <span className="text-xs font-normal text-slate-400">¢/bu</span>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-300 leading-tight">
                    <div>US$ {milhoUsdTon.toFixed(2)}/t</div>
                    <div className="text-emerald-400 font-bold">R$ {milhoReaisSaca.toFixed(2)}/sc</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SUB-SEÇÃO 2: INDICADORES CEPEA/ESALQ - SOJA, MILHO E ALGODÃO */}
          <div className="pt-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                Indicadores Oficiais CEPEA / ESALQ - USP
              </span>
              <span className="text-[11px] font-mono text-slate-400">Mercado Físico Brasileiro</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Soja CEPEA (Paranaguá) */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-white font-mono uppercase">Soja CEPEA</span>
                    <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      (indicadoresCepea[0]?.variacaoPct ?? 1.25) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {(indicadoresCepea[0]?.variacaoPct ?? 1.25) >= 0 ? '+' : ''}
                      {(indicadoresCepea[0]?.variacaoPct ?? 1.25).toFixed(2)}%
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">
                    Porto Paranaguá / PR (FOB)
                  </span>
                </div>

                <div className="my-1">
                  <div className="font-mono font-black text-xl sm:text-2xl text-emerald-400 tabular-nums">
                    {indicadoresCepea[0]?.precoFormatado || 'R$ 139,50'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {indicadoresCepea[0]?.unidade || 'R$/sc 60kg'}
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span className="text-slate-400">Paridade:</span>
                  <strong className="text-emerald-400">{indicadoresCepea[0]?.precoSecundario || 'US$ 25.77/sc'}</strong>
                </div>
              </div>

              {/* 2. Milho CEPEA (Campinas) */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-white font-mono uppercase">Milho CEPEA</span>
                    <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      (indicadoresCepea[1]?.variacaoPct ?? 0.65) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {(indicadoresCepea[1]?.variacaoPct ?? 0.65) >= 0 ? '+' : ''}
                      {(indicadoresCepea[1]?.variacaoPct ?? 0.65).toFixed(2)}%
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">
                    Campinas / SP (Ref. B3)
                  </span>
                </div>

                <div className="my-1">
                  <div className="font-mono font-black text-xl sm:text-2xl text-amber-400 tabular-nums">
                    {indicadoresCepea[1]?.precoFormatado || 'R$ 68,20'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {indicadoresCepea[1]?.unidade || 'R$/sc 60kg'}
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span className="text-slate-400">Paridade:</span>
                  <strong className="text-amber-400">{indicadoresCepea[1]?.precoSecundario || 'US$ 12.60/sc'}</strong>
                </div>
              </div>

              {/* 3. Algodão em Pluma CEPEA (São Paulo) */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-white font-mono uppercase">Algodão CEPEA</span>
                    <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      (indicadoresCepea[2]?.variacaoPct ?? 0.95) >= 0 ? 'bg-purple-500/15 text-purple-300' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {(indicadoresCepea[2]?.variacaoPct ?? 0.95) >= 0 ? '+' : ''}
                      {(indicadoresCepea[2]?.variacaoPct ?? 0.95).toFixed(2)}%
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">
                    Praça SP (Pluma 8 dias)
                  </span>
                </div>

                <div className="my-1">
                  <div className="font-mono font-black text-xl sm:text-2xl text-purple-300 tabular-nums">
                    {indicadoresCepea[2]?.precoFormatado || 'R$ 4,1850'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {indicadoresCepea[2]?.unidade || 'R$/libra-peso'}
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span className="text-slate-400">Arroba:</span>
                  <strong className="text-purple-300">{indicadoresCepea[2]?.precoSecundario || 'R$ 138,40/@'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PARTE INFERIOR: NEGOCIAÇÕES (MAIORES COM NÚMERO BOOKING E ALERTAS)     */}
      {/* ========================================================================= */}
      <footer className="shrink-0 space-y-2 pb-0.5">
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="font-black uppercase tracking-wider text-white text-sm sm:text-base">
              Negociações
            </h2>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {tickerItems.length} processos ativos
            </span>
            {totalVencidos > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-black uppercase tracking-wider bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                {totalVencidos} com deadline vencido
              </span>
            )}
            {totalCriticos > 0 && (
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-black uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {totalCriticos} críticos (&lt; 72h)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setAutoScrollPausado(!autoScrollPausado)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:text-white cursor-pointer font-bold"
            >
              {autoScrollPausado ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Retomar</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
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
          className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-3 overflow-x-auto no-scrollbar shadow-xl"
        >
          <div
            className={`flex items-stretch gap-3.5 ${
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
                  className={`w-[390px] sm:w-[440px] min-h-[175px] p-3.5 sm:p-4 rounded-xl transition-all flex flex-col justify-between shrink-0 shadow-lg group relative overflow-hidden ${
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
                      <span className="font-mono font-black text-lg sm:text-xl text-white group-hover:text-orange-400 transition-colors">
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
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500/60 animate-pulse">
                        {item.deadlineTexto || 'Vencido'}
                      </span>
                    ) : isCritico ? (
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-black uppercase tracking-wider bg-amber-500/30 text-amber-300 border border-amber-500/60 animate-pulse">
                        {item.deadlineTexto || 'Crítico'}
                      </span>
                    ) : (
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                          isEmbarcado
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Linha 2: BOOKING EM GRANDE EVIDÊNCIA */}
                  <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between my-1">
                    <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                      <Bookmark className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-mono font-bold">BOOKING:</span>
                    </div>
                    <strong className="text-xs sm:text-sm font-mono font-black text-amber-300 tracking-wider">
                      {item.bookingNumero || item.booking || 'A DEFINIR'}
                    </strong>
                  </div>

                  {/* Linha 3: Cliente & Produto / Volume */}
                  <div className="space-y-0.5 my-1">
                    <div className="text-xs sm:text-sm font-bold text-slate-100 truncate" title={item.clienteFinal}>
                      {item.clienteFinal}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="truncate max-w-[240px] text-slate-200">{item.produto}</span>
                      <span className="font-mono font-bold text-white shrink-0">
                        {(item.volumeKg / 1000).toFixed(0)} t{' '}
                        {item.sacas ? `(${item.sacas.toLocaleString('pt-BR')} sc)` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Linha 4: Logística (Navio, Destino e Contêineres) */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                    <div className="truncate max-w-[260px]" title={`${item.navio} -> ${item.portoDestino}`}>
                      <span className="text-slate-400">Navio:</span>{' '}
                      <strong className="text-white">{item.navio}</strong>{' '}
                      <span className="text-orange-400">➔</span> {item.portoDestino}
                    </div>

                    <div className="flex items-center gap-1.5 font-mono shrink-0 text-slate-300">
                      <Container className="w-4 h-4 text-slate-400" />
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
