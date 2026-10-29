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
  PanelLeftClose,
  PanelLeftOpen
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
  const [tickerOffset, setTickerOffset] = useState<number>(0);
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

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between -m-3.5 sm:-m-6 lg:-m-8 p-3 sm:p-5 lg:p-6 overflow-hidden select-none font-sans">
      {/* ========================================================================= */}
      {/* 1. TOPO: HEADER EXECUTIVO + WORLD CLOCKS COM BANDEIRAS                   */}
      {/* ========================================================================= */}
      <header className="space-y-3">
        {/* Barra de Identificação e Controle TV */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1424] border border-slate-800/90 rounded-2xl px-4 py-2.5 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30 shadow-inner">
              <Tv2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white uppercase">
                  Bela Cereais
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-xs font-bold text-orange-400 tracking-wider uppercase font-mono">
                  Backoffice TV Cockpit
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Wallboard
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Espelhamento contínuo de deadlines, cotações, averbação fiscal e fluxo de exportações.
              </p>
            </div>
          </div>

          {/* Controles de Atualização & Tela Cheia */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Indicador de Auto-refresh 30s */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-slate-400 text-[11px]">Auto-refresh:</span>
              <span className="font-mono font-bold text-orange-400 tabular-nums">
                {segundosParaRefresh}s
              </span>
            </div>

            {/* Botão de Atualizar Agora */}
            <button
              type="button"
              onClick={() => carregarMetricas(false)}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
              title="Atualizar dados agora"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Botão Tela Cheia (Ideal para TV) */}
            <button
              type="button"
              onClick={alternarFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {WORLD_CLOCKS.map((clock) => {
            const hora = formatarHoraFuso(clock.timeZone);
            const dataFuso = formatarDataFuso(clock.timeZone);
            return (
              <div
                key={clock.pais + clock.cidade}
                className="bg-[#0b1120] border border-slate-800/90 hover:border-slate-700 rounded-xl px-3 py-2 flex flex-col justify-between transition-all shadow-sm"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative w-6 h-4 sm:w-7 sm:h-4.5 rounded overflow-hidden shadow-xs border border-slate-700/80 shrink-0 bg-slate-900">
                      <Image
                        src={clock.bandeiraImg}
                        alt={clock.pais}
                        fill
                        sizes="28px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-300 truncate" title={clock.pais}>
                      {clock.pais}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0">
                    {clock.fuso}
                  </span>
                </div>
                <div className="mt-1.5">
                  <div className="font-mono font-black text-sm text-slate-100 tracking-wider tabular-nums">
                    {hora}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5 truncate">
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
      <section className="my-3 bg-gradient-to-r from-[#0d1424] via-[#0e172a] to-[#0d1424] border border-slate-800/80 rounded-2xl p-3 sm:px-5 sm:py-3 shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Dólar Comercial Live Spot */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Dólar Comercial Spot
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                Ao Vivo
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-black text-xl text-emerald-400 tabular-nums">
                R$ {Number(cambio?.dolarLive ?? 5.3442).toFixed(4)}
              </span>
              <span className={`text-xs font-bold font-mono ${
                Number(cambio?.dolarVariacaoPct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {Number(cambio?.dolarVariacaoPct || 0) >= 0 ? '+' : ''}{Number(cambio?.dolarVariacaoPct || 0).toFixed(2)}%
              </span>
              {cambio?.dolarVariacao !== undefined && (
                <span className="text-[11px] text-slate-400 font-mono hidden xl:inline">
                  (Δ {Number(cambio.dolarVariacao) >= 0 ? '+' : ''}{Number(cambio.dolarVariacao).toFixed(4)})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-800 hidden md:block" />

        {/* Ptax Banco Central Oficial */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                PTAX Banco Central (BACEN Oficial)
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase">
                Fechamento
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-slate-200 text-sm tabular-nums">
                Venda: <strong className="text-white">R$ {Number(cambio?.ptaxVenda ?? 5.3492).toFixed(4)}</strong>
              </span>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                (Compra: R$ {Number(cambio?.ptaxCompra ?? 5.3436).toFixed(4)})
              </span>
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-800 hidden md:block" />

        {/* Margem / Spread Dólar */}
        <div className="flex items-center gap-2.5">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Margem Dólar (Spread Spot vs PTAX)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-black text-amber-400 text-sm tabular-nums">
                +{cambio?.margemDolarPct || '0.10'}%
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                (Δ R$ {cambio?.margemDolarValor || '0.0050'} / USD)
              </span>
            </div>
          </div>
        </div>

        {/* Range Intraday */}
        {cambio?.minima && cambio?.maxima && (
          <>
            <div className="h-8 w-px bg-slate-800 hidden lg:block" />
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
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 my-1">
        {/* CARD 1: PRÓXIMO DEADLINE EMBARQUE */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between shadow-xl transition-all relative overflow-hidden ${
          proximoDeadline?.urgente || proximoDeadline?.atrasado
            ? 'bg-gradient-to-br from-[#1c1214] to-[#0f1422] border-rose-500/40'
            : 'bg-[#0b1120] border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  proximoDeadline?.atrasado
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}>
                  <Anchor className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Próximo Deadline Embarque
                </span>
              </div>
              {proximoDeadline && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider border ${
                  proximoDeadline.atrasado
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : proximoDeadline.urgente
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  {proximoDeadline.tempoTexto}
                </span>
              )}
            </div>

            {proximoDeadline ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono font-black text-lg text-white">
                    {proximoDeadline.numeroProcesso}
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-400">
                    {(proximoDeadline.volumeKg / 1000).toFixed(0)} Toneladas
                  </span>
                </div>

                <div className="text-xs text-slate-300 font-bold truncate">
                  {proximoDeadline.clienteFinal}
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Navio:</span>
                    <strong className="text-slate-200 truncate max-w-[130px]">{proximoDeadline.navio}</strong>
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

          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>Status Operacional</span>
            <span className="font-mono text-slate-400">Controle Portuário</span>
          </div>
        </div>

        {/* CARD 2: NEGOCIAÇÕES EM EXECUÇÃO */}
        <div className="p-4 sm:p-5 bg-[#0b1120] border border-slate-800 rounded-2xl flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
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
              <div className="text-3xl font-black text-white font-mono tracking-tight tabular-nums">
                {emExecucao?.total || 0} <span className="text-sm font-bold text-slate-400">contratos</span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Volume Total:</span>
                  <span className="font-mono font-bold text-slate-100">
                    {emExecucao?.volumeToneladas || 0} t
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sacaria Estimada:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {Number(emExecucao?.volumeSacas || 0).toLocaleString('pt-BR')} sacas
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Contêineres em Lote:</span>
                  <span className="font-mono font-bold text-orange-400">
                    {emExecucao?.containers || 0} contêineres
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>Fase 1 a 3 (Indústria e REDEX)</span>
            <span className="font-mono text-emerald-400">Fluxo Normal</span>
          </div>
        </div>

        {/* CARD 3: NEGOCIAÇÕES EMBARCADAS */}
        <div className="p-4 sm:p-5 bg-[#0b1120] border border-slate-800 rounded-2xl flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
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
              <div className="text-3xl font-black text-white font-mono tracking-tight tabular-nums">
                {embarcadas?.total || 0} <span className="text-sm font-bold text-slate-400">embarcadas</span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Volume Despachado:</span>
                  <span className="font-mono font-bold text-slate-100">
                    {embarcadas?.volumeToneladas || 0} t
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sacaria Embarcada:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {Number(embarcadas?.volumeSacas || 0).toLocaleString('pt-BR')} sacas
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Contêineres no Mar:</span>
                  <span className="font-mono font-bold text-blue-400">
                    {embarcadas?.containers || 0} contêineres
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>Fase 4 (Exportação Marítima)</span>
            <span className="font-mono text-blue-400">Em Trânsito / BL</span>
          </div>
        </div>

        {/* CARD 4: NOTAS FISCAIS SEM AVERBAÇÃO & RISCO FISCAL CRÍTICO */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between shadow-xl transition-all relative overflow-hidden ${
          fiscal?.semAverbacaoEEmbarcadas > 0
            ? 'bg-gradient-to-br from-[#1c1410] to-[#0f1422] border-amber-500/40'
            : 'bg-[#0b1120] border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  fiscal?.semAverbacaoEEmbarcadas > 0
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                }`}>
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
                <div className="text-3xl font-black text-white font-mono tracking-tight tabular-nums">
                  {fiscal?.semAverbacaoTotal || 0} <span className="text-sm font-bold text-slate-400">sem averbar</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {fiscal?.totalAverbadas || 0} averbada(s)
                </span>
              </div>

              {/* ALERTA CRÍTICO: Cargas já embarcadas sem averbação */}
              <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Embarcadas sem averbação:</span>
                  </span>
                  <span className="font-mono font-black text-sm text-amber-400 tabular-nums">
                    {fiscal?.semAverbacaoEEmbarcadas || 0} NFs
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {fiscal?.semAverbacaoEEmbarcadas > 0
                    ? 'Atenção: Risco fiscal com prazo de 60 dias Siscomex.'
                    : 'Nenhuma carga embarcada em risco fiscal.'}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progresso Averbação */}
          <div className="mt-3 pt-2 border-t border-slate-800/60">
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
      {/* 4. PARTE INFERIOR: LISTAGEM DE NEGOCIAÇÕES EM ROLAGEM AUTOMÁTICA (TICKER) */}
      {/* ========================================================================= */}
      <footer className="mt-3 space-y-2">
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-slate-300 text-xs">
              Monitor de Negociações em Tempo Real (Rolagem Contínua TV)
            </span>
            <span className="text-slate-500 text-[11px] hidden sm:inline">
              ({tickerItems.length} processos ativos monitorados)
            </span>
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
                  <span>Retomar Rolagem</span>
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
              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="w-72 sm:w-80 p-3.5 rounded-xl bg-[#0e172a] border border-slate-800 hover:border-orange-500/50 transition-all flex flex-col justify-between shrink-0 shadow-md group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-white group-hover:text-orange-400 transition-colors">
                        {item.numeroProcesso}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                        isEmbarcado
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-300 truncate" title={item.clienteFinal}>
                      {item.clienteFinal}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{item.produto}</span>
                      <span className="font-mono font-bold text-slate-200">
                        {(item.volumeKg / 1000).toFixed(0)} Toneladas
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="truncate max-w-[140px]" title={item.portoDestino}>
                      Destino: <strong className="text-slate-300">{item.portoDestino}</strong>
                    </div>

                    <div className="flex items-center gap-1 font-mono">
                      <Container className="w-3 h-3 text-slate-500" />
                      <span>{item.containers} cont.</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </footer>

      {/* ESTILO CSS GLOBAL PARA ROLAGEM CONTÍNUA TV */}
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
      `}</style>
    </div>
  );
}
