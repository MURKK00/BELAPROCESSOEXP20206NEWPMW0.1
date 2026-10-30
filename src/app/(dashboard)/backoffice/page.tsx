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
  Minus
} from 'lucide-react';

interface TendenciaNegociacao {
  direcao: 'UP' | 'DOWN' | 'EQUAL';
  variacaoPct: number;
  alterado: boolean;
}

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
  const historicoValoresRef = useRef<Map<string, number>>(new Map());
  const prevDolarRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [tendenciasAoVivo, setTendenciasAoVivo] = useState<Record<string, TendenciaNegociacao>>({});
  const [dolarDirecao, setDolarDirecao] = useState<'UP' | 'DOWN'>('UP');
  const [dolarFlash, setDolarFlash] = useState<'UP' | 'DOWN' | null>(null);
  const [itensFlashing, setItensFlashing] = useState<Set<string>>(new Set());

  // 1. Relógio Mundial com atualização a cada segundo
  useEffect(() => {
    setDataAtual(new Date());
    const clockInterval = setInterval(() => {
      setDataAtual(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Cleanup flash timeout ao desmontar
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  // 2. Carregamento das Métricas do Backoffice com Apuração de Tendência por Ciclo de 30s
  const carregarMetricas = useCallback(async (isSilencioso = false) => {
    try {
      if (!isSilencioso) setLoading(true);
      setErro(null);
      const res = await fetch('/api/backoffice/metrics');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha ao buscar métricas de TV');
      }

      // A) Dólar: Apuração de tendência e flash em relação ao ciclo anterior de 30s
      const novoDolar = Number(json.data?.cambio?.dolarLive ?? 5.4210);
      let novoDolarFlash: 'UP' | 'DOWN' | null = null;
      if (prevDolarRef.current !== null && isSilencioso) {
        if (novoDolar > prevDolarRef.current) {
          setDolarDirecao('UP');
          novoDolarFlash = 'UP';
        } else if (novoDolar < prevDolarRef.current) {
          setDolarDirecao('DOWN');
          novoDolarFlash = 'DOWN';
        } else {
          const varDia = Number(json.data?.cambio?.dolarVariacaoPct || 0);
          setDolarDirecao(varDia >= 0 ? 'UP' : 'DOWN');
        }
      } else {
        const varDia = Number(json.data?.cambio?.dolarVariacaoPct || 0);
        setDolarDirecao(varDia >= 0 ? 'UP' : 'DOWN');
      }
      prevDolarRef.current = novoDolar;
      setDolarFlash(novoDolarFlash);

      // B) Ticker tape: Apuração de tendência e flash por negociação comparando com o ciclo anterior
      const novosFlashing = new Set<string>();
      if (json.data?.ticker && Array.isArray(json.data.ticker)) {
        const novoMapaTendencias: Record<string, TendenciaNegociacao> = {};

        json.data.ticker.forEach((it: any) => {
          const valorAtual = Number(it.valorEstimadoReais || it.volumeKg || 0);
          const valorAnterior = historicoValoresRef.current.get(it.id);

          if (valorAnterior !== undefined && valorAnterior !== null && isSilencioso) {
            if (valorAtual > valorAnterior) {
              const diff = valorAtual - valorAnterior;
              const pct = valorAnterior > 0 ? (diff / valorAnterior) * 100 : 0.5;
              novoMapaTendencias[it.id] = {
                direcao: 'UP',
                variacaoPct: Number(pct.toFixed(2)),
                alterado: true,
              };
              novosFlashing.add(it.id);
            } else if (valorAtual < valorAnterior) {
              const diff = valorAnterior - valorAtual;
              const pct = valorAnterior > 0 ? (diff / valorAnterior) * 100 : 0.5;
              novoMapaTendencias[it.id] = {
                direcao: 'DOWN',
                variacaoPct: -Number(pct.toFixed(2)),
                alterado: true,
              };
              novosFlashing.add(it.id);
            } else {
              novoMapaTendencias[it.id] = {
                direcao: it.tendenciaCiclo || 'UP',
                variacaoPct: it.variacaoPct ?? 0.5,
                alterado: false,
              };
            }
          } else {
            // Primeiro ciclo carregado na TV
            novoMapaTendencias[it.id] = {
              direcao: it.tendenciaCiclo || 'UP',
              variacaoPct: it.variacaoPct ?? 0.5,
              alterado: false,
            };
          }

          // Salva para o próximo ciclo de 30s
          historicoValoresRef.current.set(it.id, valorAtual);
        });

        setTendenciasAoVivo(novoMapaTendencias);
        setItensFlashing(novosFlashing);
      }

      // C) Disparar limpeza do efeito flash após 2.5s para retorno suave ao normal
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      if (novoDolarFlash || novosFlashing.size > 0) {
        flashTimeoutRef.current = setTimeout(() => {
          setDolarFlash(null);
          setItensFlashing(new Set());
        }, 2500);
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
  const dolarRef = Number(cambio?.dolarLive ?? 5.4210);
  const sojaUsdTon = soja?.preco ? (Number(soja.preco) / 100) * 36.7437 : 455.16;
  const sojaReaisSaca = soja?.preco ? ((Number(soja.preco) / 100) * 2.20462 * dolarRef) + 14.50 : 162.55;
  const milhoUsdTon = milho?.preco ? (Number(milho.preco) / 100) * 39.368 : 177.16;
  const milhoReaisSaca = milho?.preco ? ((Number(milho.preco) / 100) * 2.3621 * dolarRef) + 11.20 : 68.82;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EM_NEGOCIACAO': return 'Em Negociação';
      case 'EM_EXECUCAO': return 'Em Execução';
      case 'EMBARCADO': return 'Embarcado';
      case 'FINALIZADO': return 'Finalizado';
      case 'PENDENTE': return 'Pendente';
      case 'CANCELADO': return 'Cancelado';
      default: return status ? status.replace('_', ' ') : 'Ativo';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'EMBARCADO':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'FINALIZADO':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'EM_EXECUCAO':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'EM_NEGOCIACAO':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div
      className={`w-full bg-[#060913] text-slate-100 flex flex-col justify-between p-2.5 sm:p-3.5 overflow-hidden select-none font-sans ${
        isFullScreen ? 'fixed inset-0 z-[99999] h-screen w-screen' : 'h-screen max-h-screen'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOPO: HEADER + 7 RELÓGIOS MUNDIAIS + PREVISÃO DO TEMPO DOS 4 PÓLOS     */}
      {/* ========================================================================= */}
      <header className="shrink-0 space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/40 shadow-xs">
              <Tv2 className="w-4 h-4" />
            </div>
            <h1 className="text-sm sm:text-base font-black tracking-wider text-white uppercase flex items-center gap-1.5">
              BELA CEREAIS <span className="text-orange-400">|</span> BACKOFFICE TV COCKPIT
            </h1>
          </div>

          {/* Botão de Tela Cheia */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={alternarFullscreen}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-sm ${
                isFullScreen 
                  ? 'bg-rose-500/30 border border-rose-500/50 text-rose-300 hover:bg-rose-500/40' 
                  : 'bg-orange-600/30 border border-orange-500/50 hover:bg-orange-600/50 text-orange-300'
              }`}
            >
              {isFullScreen ? (
                <>
                  <Minimize className="w-3.5 h-3.5" />
                  <span>Tela Cheia</span>
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

        {/* 7 RELÓGIOS MUNDIAIS AMPLIADOS VERTICALMENTE (OCUPANDO ESPAÇO COM DESTAQUE) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-0.5">
          {WORLD_CLOCKS.map((clock) => {
            const hora = formatarHoraFuso(clock.timeZone);
            const dataFuso = formatarDataFuso(clock.timeZone);
            const isBrasil = clock.pais === 'Brasil';

            return (
              <div
                key={clock.pais}
                className={`px-3 py-2.5 sm:py-3 rounded-xl border flex items-center justify-between transition-colors shadow-sm min-h-[58px] sm:min-h-[64px] ${
                  isBrasil
                    ? 'bg-gradient-to-r from-[#0d1e17] to-[#0b1522] border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : 'bg-[#0b1120] border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-5.5 min-w-[32px] min-h-[22px] rounded overflow-hidden border border-slate-700 shadow-xs shrink-0 bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={clock.bandeiraImg}
                      alt={clock.pais}
                      className="w-full h-full object-cover block"
                      loading="eager"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-black text-white block truncate leading-tight">
                      {clock.pais}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate font-medium">
                      {clock.cidade}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-1.5">
                  <span className="text-sm sm:text-base font-black text-white font-mono tracking-tight block leading-tight tabular-nums">
                    {hora}
                  </span>
                  <div className="flex items-center justify-end gap-1 text-[9px] font-mono text-slate-400 mt-0.5">
                    <span className="text-slate-300 font-semibold">{clock.fuso}</span>
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
      {/* 2. LINHA DE CARDS PRINCIPAIS: KPIS AMPLIADOS VERTICALMENTE (min-h: 195-210px) */}
      {/* ========================================================================= */}
      <section className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 my-1">
        
        {/* CARD 1: PRÓXIMO DEADLINE (AMPLIADO VERTICALMENTE COM DADOS COMPLETOS) */}
        <div
          className={`p-4 sm:p-4.5 rounded-2xl border flex flex-col justify-between shadow-lg min-h-[195px] sm:min-h-[210px] ${
            proximoDeadline?.atrasado
              ? 'animate-pulse-danger bg-gradient-to-br from-[#280d16] via-[#1a0a10] to-[#0b1120]'
              : proximoDeadline?.urgente
              ? 'animate-pulse-warning bg-gradient-to-br from-[#24170a] via-[#160e06] to-[#0b1120]'
              : 'bg-[#0b1120] border-slate-800'
          }`}
        >
          {/* Topo: Título + Badge de Prazo */}
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
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-black uppercase tracking-wider ${
                  proximoDeadline.atrasado
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/60 animate-pulse'
                    : 'bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse'
                }`}
              >
                {proximoDeadline.tempoTexto}
              </span>
            )}
          </div>

          {/* Número do Processo + Volume */}
          <div className="flex items-baseline justify-between mt-1">
            <div className="font-mono font-black text-2xl sm:text-3xl text-amber-400 tracking-tight">
              {proximoDeadline?.numeroProcesso || 'Sem processos'}
            </div>
            <div className="font-mono font-bold text-xs sm:text-sm text-slate-200">
              {proximoDeadline?.volumeKg ? `${(proximoDeadline.volumeKg / 1000).toFixed(0)} Toneladas` : ''}
            </div>
          </div>

          {/* BOX DESTACADO: NÚMERO DO BOOKING E DATA DO DEADLINE */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono my-1">
            <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-[200px]">
              <Bookmark className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-400 text-[11px] font-semibold">Booking:</span>
              <strong className="text-amber-300 font-bold truncate">
                {proximoDeadline?.bookingNumero || 'A definir'}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2.5 text-slate-300 shrink-0">
              <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-slate-400 text-[11px] font-semibold">Deadline:</span>
              <strong className="text-orange-300 font-bold">
                {proximoDeadline?.dataDeadlineFormatada || '20/09/2026'}
              </strong>
            </div>
          </div>

          {/* NOME DO CLIENTE EM DESTAQUE */}
          <div className="text-xs sm:text-sm font-bold text-white truncate" title={proximoDeadline?.clienteFinal}>
            <span className="text-slate-400 font-normal">Cliente:</span> {proximoDeadline?.clienteFinal || 'Vina Agri Commodities Joint Stock Co'}
          </div>

          {/* Rodapé: Navio e Destino */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-medium">
            <div className="truncate max-w-[210px]">
              <span className="text-slate-400">Navio:</span>{' '}
              <strong className="text-white">{proximoDeadline?.navio || 'Nomear'}</strong>
            </div>
            <div className="truncate max-w-[190px] text-right font-mono text-slate-300">
              {proximoDeadline?.portoDestino || 'Destino a definir'}
            </div>
          </div>
        </div>

        {/* CARD 2: NEGOCIAÇÕES EM EXECUÇÃO (AMPLIADO VERTICALMENTE) */}
        <div className="p-4 sm:p-4.5 bg-[#0b1120] border border-slate-800 rounded-2xl flex flex-col justify-between shadow-lg min-h-[195px] sm:min-h-[210px]">
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
            <div className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums">
              {emExecucao?.total || 0}{' '}
              <span className="text-xs sm:text-sm font-bold text-slate-400">contratos</span>
            </div>
            <span className="font-mono font-bold text-xs sm:text-sm text-orange-400">
              {emExecucao?.containers || 0} contêineres
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span>Volume Total em Lote:</span>
              <strong className="text-white font-mono text-sm">{emExecucao?.volumeToneladas || 0} Toneladas</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Sacaria Estimada:</span>
              <span className="text-slate-200 font-semibold">{Number(emExecucao?.volumeSacas || 0).toLocaleString('pt-BR')} sc</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Fase 1 a 3 (Indústria e REDEX)</span>
            <span className="text-emerald-400 font-bold">Fluxo Normal</span>
          </div>
        </div>

        {/* CARD 3: NEGOCIAÇÕES EMBARCADAS (AMPLIADO VERTICALMENTE) */}
        <div className="p-4 sm:p-4.5 bg-[#0b1120] border border-slate-800 rounded-2xl flex flex-col justify-between shadow-lg min-h-[195px] sm:min-h-[210px]">
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
            <div className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums">
              {embarcadas?.total || 0}{' '}
              <span className="text-xs sm:text-sm font-bold text-slate-400">embarcadas</span>
            </div>
            <span className="font-mono font-bold text-xs sm:text-sm text-blue-400">
              {embarcadas?.containers || 0} contêineres
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span>Volume Despachado:</span>
              <strong className="text-white font-mono text-sm">{embarcadas?.volumeToneladas || 0} Toneladas</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Sacaria Embarcada:</span>
              <span className="text-slate-200 font-semibold">{Number(embarcadas?.volumeSacas || 0).toLocaleString('pt-BR')} sc</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Fase 4 (Exportação Marítima)</span>
            <span className="text-blue-400 font-bold">Em Trânsito / BL</span>
          </div>
        </div>

        {/* CARD 4: AVERBAÇÃO SEFAZ & ALERTA FISCAL (AMPLIADO VERTICALMENTE) */}
        <div
          className={`p-4 sm:p-4.5 rounded-2xl border flex flex-col justify-between shadow-lg min-h-[195px] sm:min-h-[210px] ${
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
            <div className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums">
              {fiscal?.semAverbacaoTotal || 0}{' '}
              <span className="text-xs sm:text-sm font-bold text-slate-400">sem averbar</span>
            </div>
            <span className="font-mono font-bold text-xs sm:text-sm text-emerald-400">
              {fiscal?.totalAverbadas || 0} averbada(s)
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Embarcadas s/ averbação:
              </span>
              <strong className="text-amber-400 font-mono font-black text-base">
                {fiscal?.semAverbacaoEEmbarcadas || 0} NFs
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Índice Geral de Averbação:</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">{fiscal?.percAverbado ? fiscal.percAverbado.toFixed(0) : 81}%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Auditoria Fiscal SEFAZ</span>
            <span className={fiscal?.semAverbacaoEEmbarcadas > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
              {fiscal?.semAverbacaoEEmbarcadas > 0 ? 'Atenção Requerida' : 'Conformidade Fiscal'}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. RETÂNGULO HORIZONTAL 1: CÂMBIO & MERCADO DE DÓLAR                       */}
      {/*    TÍTULO NO TOPO · NÚMEROS ABAIXO · RANGE SOB SPOT · PTAX AMPLIADO       */}
      {/* ========================================================================= */}
      <section className="shrink-0 w-full bg-[#0b1120] border border-slate-800/90 rounded-2xl p-3.5 sm:p-4.5 shadow-xl min-h-[170px] sm:min-h-[185px] flex flex-col justify-between">
        {/* TOPO DO CARD: TÍTULO "CÂMBIO & DÓLAR" + STATUS DO MERCADO */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-inner">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Câmbio &amp; Dólar
              </h2>
              <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
                Banco Central do Brasil (PTAX) · B3 Futuros · Mercado Spot
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-black tracking-wider border shadow-xs ${
                cambio?.aberto
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <CircleDot className={`w-3 h-3 ${cambio?.aberto ? 'text-emerald-400 fill-emerald-400' : 'text-slate-400'}`} />
              {cambio?.statusLabel || (cambio?.aberto ? 'MERCADO ABERTO' : 'PREGÃO FECHADO')}
            </span>
            <span className="text-[11px] font-mono text-slate-400 hidden xl:inline">
              {cambio?.detalheSessao || 'Seg a Sex · 09h às 17h'}
            </span>
          </div>
        </div>

        {/* LOGO ABAIXO FICAM OS NÚMEROS */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center pt-2">
          
          {/* COLUNA 1: Dólar Comercial Spot (Mais Centralizado) + Range Intraday na Lateral (Maior) */}
          <div className="md:col-span-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pr-0 sm:pr-3">
            
            {/* Bloco Dólar Comercial Spot mais centralizado e destacado */}
            <div className="flex-1 flex flex-col items-center justify-center text-center py-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Dólar Comercial Spot (USDBRL)
              </span>
              <div className={`font-mono font-black text-3xl sm:text-4xl tabular-nums tracking-tight my-0.5 px-3 py-0.5 rounded-xl transition-all duration-700 ${
                dolarFlash === 'UP'
                  ? 'text-emerald-300 bg-emerald-500/25 ring-2 ring-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse'
                  : dolarFlash === 'DOWN'
                  ? 'text-rose-300 bg-rose-500/25 ring-2 ring-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.5)] animate-pulse'
                  : 'text-emerald-400'
              }`}>
                R$ {Number(cambio?.dolarLive ?? 5.4210).toFixed(4)}
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap mt-0.5">
                <span className={`text-xs sm:text-sm font-bold font-mono px-2 py-0.5 rounded-lg border ${
                  Number(cambio?.dolarVariacaoPct || 0) >= 0 
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}>
                  {Number(cambio?.dolarVariacaoPct || 0) >= 0 ? '+' : ''}{Number(cambio?.dolarVariacaoPct || 0).toFixed(2)}%
                </span>

                {/* Indicador visual de ciclo 30s (seta verde para cima ou vermelha para baixo substituindo o texto 'EM ALTA') */}
                <span 
                  title={dolarDirecao === 'UP' ? 'Tendência do Ciclo 30s: Alta' : 'Tendência do Ciclo 30s: Queda'}
                  className={`p-1 sm:p-1.5 rounded-lg border inline-flex items-center justify-center transition-all duration-700 ${
                    dolarFlash === 'UP'
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 ring-2 ring-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse'
                      : dolarFlash === 'DOWN'
                      ? 'bg-rose-500/30 text-rose-300 border-rose-400 ring-2 ring-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.5)] animate-pulse'
                      : dolarDirecao === 'UP'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  }`}
                >
                  {dolarDirecao === 'UP' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-rose-400 stroke-[3]" />
                  )}
                </span>
              </div>
            </div>

            {/* Bloco Range Intraday na lateral com números maiores */}
            <div className="shrink-0 bg-slate-900/95 border border-slate-800 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between min-w-[215px] sm:min-w-[230px] shadow-sm">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Range Intraday
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Mín / Máx
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/90 text-left">
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase font-semibold">
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mínima</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-white mt-1 tabular-nums">
                    R$ {Number(cambio?.minima ?? 5.3598).toFixed(4)}
                  </div>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/90 text-left">
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    <span>Máxima</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-white mt-1 tabular-nums">
                    R$ {Number(cambio?.maxima ?? 5.4494).toFixed(4)}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLUNA 2: Dólar Futuro B3 (DOL) */}
          <div className="md:col-span-2 border-l border-slate-800/80 pl-3 sm:pl-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] sm:text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">
                Dólar Futuro (DOL)
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                1º Venc.
              </span>
            </div>
            <div className="font-mono font-black text-2xl sm:text-3xl text-cyan-300 tabular-nums">
              R$ {Number(dolarFuturo?.preco ?? (dolarRef + 0.0265)).toFixed(4)}
            </div>
            <span className="text-xs font-mono text-slate-300 font-semibold mt-0.5">
              +{dolarFuturo?.pontosForward || '26.5'} pts forward
            </span>
          </div>

          {/* COLUNA 3: PTAX BACEN Oficial (VENDA E COMPRA COM MESMO TAMANHO DE FONTE) */}
          <div className="md:col-span-2 border-l border-slate-800/80 pl-3 sm:pl-4 flex flex-col justify-center">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              PTAX BACEN (Oficial)
            </span>
            <div className="space-y-1 font-mono">
              <div className="text-base sm:text-lg font-black text-white flex items-baseline gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase w-14">Venda:</span>
                <span className="tabular-nums">R$ {Number(cambio?.ptaxVenda ?? 5.3744).toFixed(4)}</span>
              </div>
              <div className="text-base sm:text-lg font-black text-slate-200 flex items-baseline gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase w-14">Compra:</span>
                <span className="tabular-nums">R$ {Number(cambio?.ptaxCompra ?? 5.3688).toFixed(4)}</span>
              </div>
            </div>
          </div>

          {/* COLUNA 4: Margem Dólar (Spread) */}
          <div className="md:col-span-2 border-l border-slate-800/80 pl-3 sm:pl-4 flex flex-col justify-center">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Margem / Spread
            </span>
            <div className="font-mono font-black text-xl sm:text-2xl text-amber-400 tabular-nums">
              +{cambio?.margemDolarPct || '0.86'}%
            </div>
            <span className="text-xs text-slate-400 font-mono mt-0.5">
              (Δ R$ {cambio?.margemDolarValor || '0.0466'})
            </span>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. RETÂNGULO HORIZONTAL 2: COMMODITIES CBOT & INDICADORES CEPEA           */}
      {/*    TÍTULO NO TOPO · NÚMEROS ABAIXO EM 5 COLUNAS · RETÂNGULO AMPLIADO     */}
      {/* ========================================================================= */}
      <section className="shrink-0 w-full bg-[#0b1120] border border-slate-800/90 rounded-2xl p-3.5 sm:p-4.5 shadow-xl min-h-[170px] sm:min-h-[185px] flex flex-col justify-between">
        {/* TOPO DO CARD: TÍTULO "AGRO & CEPEA" */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0 shadow-inner">
              <Wheat className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Agro &amp; CEPEA
              </h2>
              <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
                Bolsa de Chicago (CBOT · CME Group) · Indicadores Físicos Oficiais CEPEA/ESALQ - USP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Paridade Portuária &amp; Mercado Físico
            </span>
            <span className="text-[11px] font-mono text-slate-400 hidden xl:inline">
              Atualização Contínua
            </span>
          </div>
        </div>

        {/* LOGO ABAIXO FICAM OS NÚMEROS EM 5 COLUNAS DISTRIBUÍDAS */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          
          {/* Célula 1: Soja CBOT */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between min-h-[96px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-black text-xs text-slate-100">SOJA CBOT (ZS=F)</span>
              <span className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded ${
                (soja?.variacaoPct ?? 0.32) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}>
                {(soja?.variacaoPct ?? 0.32) >= 0 ? '+' : ''}{(soja?.variacaoPct ?? 0.32).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="font-mono font-black text-xl sm:text-2xl text-amber-400 tabular-nums">
                {Number(soja?.preco ?? 1238.75).toFixed(2)} <span className="text-xs font-normal text-slate-400">¢/bu</span>
              </div>
              <div className="text-right text-xs font-mono text-slate-300 leading-tight">
                <div>US$ {sojaUsdTon.toFixed(2)}/t</div>
                <div className="text-emerald-400 font-bold">R$ {sojaReaisSaca.toFixed(2)}/sc</div>
              </div>
            </div>
          </div>

          {/* Célula 2: Milho CBOT */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between min-h-[96px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-black text-xs text-slate-100">MILHO CBOT (ZC=F)</span>
              <span className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded ${
                (milho?.variacaoPct ?? -0.28) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}>
                {(milho?.variacaoPct ?? -0.28) >= 0 ? '+' : ''}{(milho?.variacaoPct ?? -0.28).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="font-mono font-black text-xl sm:text-2xl text-amber-400 tabular-nums">
                {Number(milho?.preco ?? 450.00).toFixed(2)} <span className="text-xs font-normal text-slate-400">¢/bu</span>
              </div>
              <div className="text-right text-xs font-mono text-slate-300 leading-tight">
                <div>US$ {milhoUsdTon.toFixed(2)}/t</div>
                <div className="text-emerald-400 font-bold">R$ {milhoReaisSaca.toFixed(2)}/sc</div>
              </div>
            </div>
          </div>

          {/* Célula 3: Soja CEPEA Paranaguá */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between min-h-[96px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-black text-xs text-emerald-400 uppercase">SOJA CEPEA</span>
              <span className="text-[10px] font-mono text-slate-400">Paranaguá (FOB)</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="font-mono font-black text-xl sm:text-2xl text-white tabular-nums">
                {indicadoresCepea[0]?.precoFormatado || 'R$ 162,55'}
              </div>
              <div className="text-right text-xs font-mono text-emerald-400 font-bold">
                {indicadoresCepea[0]?.precoSecundario || 'US$ 29.99/sc'}
              </div>
            </div>
          </div>

          {/* Célula 4: Milho CEPEA Campinas */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between min-h-[96px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-black text-xs text-amber-400 uppercase">MILHO CEPEA</span>
              <span className="text-[10px] font-mono text-slate-400">Campinas (B3)</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="font-mono font-black text-xl sm:text-2xl text-white tabular-nums">
                {indicadoresCepea[1]?.precoFormatado || 'R$ 68,82'}
              </div>
              <div className="text-right text-xs font-mono text-amber-400 font-bold">
                {indicadoresCepea[1]?.precoSecundario || 'US$ 12.70/sc'}
              </div>
            </div>
          </div>

          {/* Célula 5: Algodão em Pluma CEPEA */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between min-h-[96px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-black text-xs text-purple-300 uppercase">ALGODÃO CEPEA</span>
              <span className="text-[10px] font-mono text-slate-400">Praça SP Pluma</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="font-mono font-black text-xl sm:text-2xl text-purple-300 tabular-nums">
                {indicadoresCepea[2]?.precoFormatado || 'R$ 4,1730'}
              </div>
              <div className="text-right text-xs font-mono text-slate-300">
                {indicadoresCepea[2]?.precoSecundario || 'R$ 138,00/@'}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PARTE INFERIOR: CARROSSEL DE NEGOCIAÇÕES AMPLIADO COM STATUS & ALERTA  */}
      {/* ========================================================================= */}
      <footer className="shrink-0 space-y-1.5 pb-0.5">
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="font-black uppercase tracking-wider text-white text-xs sm:text-sm">
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
          className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-3 overflow-x-auto no-scrollbar shadow-2xl"
        >
          <div
            className={`flex items-stretch gap-3.5 ${
              autoScrollPausado ? '' : 'animate-marquee'
            }`}
            style={{ width: 'max-content' }}
          >
            {/* Duplicamos os itens para garantir efeito de loop contínuo impecável */}
            {[...tickerItems, ...tickerItems].map((item, idx) => {
              const isAtrasado = item.isAtrasado;
              const isCritico = item.isCritico;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className={`ticker-item w-[390px] sm:w-[430px] h-[175px] sm:h-[185px] p-3.5 sm:p-4 rounded-xl transition-all flex flex-col justify-between shrink-0 shadow-lg group relative overflow-hidden ${
                    isAtrasado
                      ? 'animate-pulse-danger bg-gradient-to-b from-[#280d16] via-[#1a0a10] to-[#0d1424]'
                      : isCritico
                      ? 'animate-pulse-warning bg-gradient-to-b from-[#24170a] via-[#160e06] to-[#0d1424]'
                      : 'bg-[#0e172a] border border-slate-800 hover:border-orange-500/50'
                  }`}
                >
                  {/* Linha 1: Processo + Status da Negociação + Alerta de Deadline (SEMPRE MOSTRA OS DOIS!) */}
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

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {/* STATUS OFICIAL DA NEGOCIAÇÃO */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getStatusBadgeStyle(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>

                      {/* BADGE DE DEADLINE VENCIDO OU CRÍTICO AO LADO */}
                      {isAtrasado ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500/60 animate-pulse">
                          {item.deadlineTexto || 'Vencido'}
                        </span>
                      ) : isCritico ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/30 text-amber-300 border border-amber-500/60 animate-pulse">
                          {item.deadlineTexto || 'Crítico'}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Linha 2: BOX DESTACADO COM BOOKING E DATA DO DEADLINE */}
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-[200px]">
                      <Bookmark className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-[11px] text-slate-400 font-semibold">BKG:</span>
                      <strong className="text-amber-300 font-bold truncate">
                        {item.bookingNumero || item.booking || 'A Definir'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2.5 shrink-0">
                      <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                      <span className="text-[11px] text-slate-400 font-semibold">Deadline:</span>
                      <strong className="text-orange-300 font-bold">
                        {item.deadlineEmbarque || 'A Definir'}
                      </strong>
                    </div>
                  </div>

                  {/* Linha 3: Cliente & Produto / Volume */}
                  <div className="space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-slate-100 truncate" title={item.clienteFinal}>
                      {item.clienteFinal}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="truncate max-w-[230px] text-slate-200" title={item.produto}>{item.produto}</span>
                      <span className="font-mono font-bold text-white shrink-0">
                        {(item.volumeKg / 1000).toFixed(0)} t{' '}
                        {item.sacas ? `(${item.sacas.toLocaleString('pt-BR')} sc)` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Linha 4: Logística (Navio, Destino e Contêineres / Valuation com Indicador e Flash) */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                    <div className="truncate max-w-[190px] sm:max-w-[210px]" title={`${item.navio} -> ${item.portoDestino}`}>
                      <span className="text-slate-400">Navio:</span>{' '}
                      <strong className="text-white">{item.navio}</strong>{' '}
                      <span className="text-orange-400">➔</span> {item.portoDestino}
                    </div>

                    <div className="flex items-center gap-2 font-mono shrink-0">
                      {/* CAMPO DE VALOR DA NEGOCIAÇÃO COM INDICADOR VISUAL E FLASH SUTIL */}
                      <div 
                        title={`Valor estimado do lote. Comparação ciclo 30s: ${
                          (tendenciasAoVivo[item.id]?.direcao || item.tendenciaCiclo) === 'DOWN' ? 'Queda' : 'Alta'
                        }`}
                        className={`px-2 py-0.5 rounded-lg border font-mono font-bold text-xs inline-flex items-center gap-1 transition-all duration-700 ${
                          itensFlashing.has(item.id) && tendenciasAoVivo[item.id]?.direcao === 'UP'
                            ? 'bg-emerald-500/35 text-emerald-200 border-emerald-400 ring-2 ring-emerald-500/70 shadow-[0_0_14px_rgba(16,185,129,0.6)] animate-pulse'
                            : itensFlashing.has(item.id) && tendenciasAoVivo[item.id]?.direcao === 'DOWN'
                            ? 'bg-rose-500/35 text-rose-200 border-rose-400 ring-2 ring-rose-500/70 shadow-[0_0_14px_rgba(244,63,94,0.6)] animate-pulse'
                            : (tendenciasAoVivo[item.id]?.direcao || item.tendenciaCiclo) === 'DOWN'
                            ? 'bg-rose-950/50 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {/* Indicador visual: seta verde para cima ou vermelha para baixo */}
                        {(tendenciasAoVivo[item.id]?.direcao || item.tendenciaCiclo) === 'DOWN' ? (
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 stroke-[3] shrink-0" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
                        )}
                        <span className="tabular-nums font-black">
                          {item.valorEstimadoFormatado || `R$ ${(item.volumeKg * 2.7).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 font-mono text-slate-300">
                        <Container className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-white">{item.containers} cont.</span>
                      </div>
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
          animation: marquee 85s linear infinite;
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
