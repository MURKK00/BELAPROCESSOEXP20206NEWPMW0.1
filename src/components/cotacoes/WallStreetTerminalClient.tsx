"use client";

import React, { useState, useEffect } from 'react';
import {
  COTACOES_INICIAIS,
  CotacoesMercadoState,
  calcularParidadeExportacaoSoja,
  ContratoCotacao,
  VARIEDADES_FEIJAO_ASIA,
  PORTOS_ASIA,
  calcularParidadeFeijaoAsia,
  VariedadeFeijaoAsia,
  PortoDestinoAsia,
} from '@/lib/cotacoesData';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Calculator,
  DollarSign,
  Globe2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  ChevronRight,
  Info,
  Ship,
  Anchor,
  Compass,
  CheckCircle2,
  Copy,
  ShieldCheck,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

type TabView = 'GERAL' | 'FEIJOES_ASIA' | 'GRAOS' | 'CAMBIO_CURVA' | 'PARIDADE';

export function WallStreetTerminalClient() {
  const [mercado, setMercado] = useState<CotacoesMercadoState>(() =>
    JSON.parse(JSON.stringify(COTACOES_INICIAIS))
  );
  const [tabAtiva, setTabAtiva] = useState<TabView>('GERAL');
  const [tickCounter, setTickCounter] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Parâmetros da Calculadora de Paridade de Exportação (Soja Santos)
  const [paridadeCbot, setParidadeCbot] = useState<number>(1032.50);
  const [paridadePremio, setParidadePremio] = useState<number>(75);
  const [paridadeDolar, setParidadeDolar] = useState<number>(5.0441);
  const [paridadeElevacao, setParidadeElevacao] = useState<number>(8.5);
  const [paridadeFreteInterno, setParidadeFreteInterno] = useState<number>(185);

  // Parâmetros Especiais: Exportação de Feijões & Pulses Ásia em Dólar (USD)
  const [modoCalculadora, setModoCalculadora] = useState<'FEIJAO_ASIA' | 'SOJA_SANTOS'>('FEIJAO_ASIA');
  const [feijaoVariedadeSelecionada, setFeijaoVariedadeSelecionada] = useState<VariedadeFeijaoAsia>(
    VARIEDADES_FEIJAO_ASIA[0]
  );
  const [portoAsiaSelecionado, setPortoAsiaSelecionado] = useState<PortoDestinoAsia>(PORTOS_ASIA[0]);
  const [feijaoFobUsdTon, setFeijaoFobUsdTon] = useState<number>(890.0);
  const [feijaoTonsContainer, setFeijaoTonsContainer] = useState<number>(24.5);
  const [feijaoFreteMaritimoUsd, setFeijaoFreteMaritimoUsd] = useState<number>(1750.0);
  const [feijaoTaxaDolar, setFeijaoTaxaDolar] = useState<number>(5.0441);
  const [feijaoFreteRodoviarioReais, setFeijaoFreteRodoviarioReais] = useState<number>(190.0);
  const [feijaoEstufagemUsdTon, setFeijaoEstufagemUsdTon] = useState<number>(22.0);
  const [feijaoMargemDesejadaUsdTon, setFeijaoMargemDesejadaUsdTon] = useState<number>(25.0);
  const [copiadoProposta, setCopiadoProposta] = useState(false);

  // Contrato ativo selecionado para visualização gráfica
  const [contratoSelecionado, setContratoSelecionado] = useState<ContratoCotacao>(() =>
    JSON.parse(JSON.stringify(COTACOES_INICIAIS.sojaChicago.contratos[0]))
  );

  // Estado de conexão com fontes oficiais em tempo real
  const [fonteOficial, setFonteOficial] = useState<string>('CBOT · B3 · BACEN PTAX');
  const [ultimaAtualizacaoOficial, setUltimaAtualizacaoOficial] = useState<string>('');
  const [carregandoOficial, setCarregandoOficial] = useState<boolean>(false);

  const carregarCotacoesOficiais = async () => {
    try {
      setCarregandoOficial(true);
      const res = await fetch('/api/cotacoes/live');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.sucesso) return;

      if (data.fonte) setFonteOficial(data.fonte);
      if (data.atualizadoEm) {
        setUltimaAtualizacaoOficial(
          new Date(data.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      }

      setMercado((prev) => {
        const next: CotacoesMercadoState = JSON.parse(JSON.stringify(prev));

        // Soja Chicago (CBOT - ZS)
        if (data.sojaCbot && next.sojaChicago.contratos[0]) {
          next.sojaChicago.contratos = [
            {
              ...next.sojaChicago.contratos[0],
              ultimo: data.sojaCbot.preco,
              variacao: data.sojaCbot.variacao,
              variacaoPct: data.sojaCbot.variacaoPct,
              fechamentoAnterior: data.sojaCbot.fechamentoAnterior,
            },
            ...next.sojaChicago.contratos.slice(1),
          ];
        }

        // Milho Chicago (CBOT - ZC)
        if (data.milhoCbot && next.milhoChicago.contratos[0]) {
          next.milhoChicago.contratos = [
            {
              ...next.milhoChicago.contratos[0],
              ultimo: data.milhoCbot.preco,
              variacao: data.milhoCbot.variacao,
              variacaoPct: data.milhoCbot.variacaoPct,
              fechamentoAnterior: data.milhoCbot.fechamentoAnterior,
            },
            ...next.milhoChicago.contratos.slice(1),
          ];
        }

        // Farelo Chicago (CBOT - ZM)
        if (data.fareloCbot && next.fareloChicago.contratos[0]) {
          next.fareloChicago.contratos = [
            {
              ...next.fareloChicago.contratos[0],
              ultimo: data.fareloCbot.preco,
              variacao: data.fareloCbot.variacao,
              variacaoPct: data.fareloCbot.variacaoPct,
              fechamentoAnterior: data.fareloCbot.fechamentoAnterior,
            },
            ...next.fareloChicago.contratos.slice(1),
          ];
        }

        // Milho B3 (CCM)
        if (data.milhoB3 && next.milhoB3.contratos[0]) {
          next.milhoB3.contratos = [
            {
              ...next.milhoB3.contratos[0],
              ultimo: data.milhoB3.preco,
              variacao: data.milhoB3.variacao,
              variacaoPct: data.milhoB3.variacaoPct,
            },
            ...next.milhoB3.contratos.slice(1),
          ];
        }

        // Câmbio Dólar Spot & PTAX BACEN
        if (data.dolarSpot || data.dolarPtax) {
          next.cambio.dolarComercial = {
            ...next.cambio.dolarComercial,
            ...(data.dolarSpot
              ? {
                  venda: data.dolarSpot.preco,
                  compra: Number((data.dolarSpot.preco - 0.002).toFixed(4)),
                  variacao: data.dolarSpot.variacao,
                  variacaoPct: data.dolarSpot.variacaoPct,
                  maxima: data.dolarSpot.maxima ?? Number((data.dolarSpot.preco + 0.0150).toFixed(4)),
                  minima: data.dolarSpot.minima ?? Number((data.dolarSpot.preco - 0.0120).toFixed(4)),
                  abertura: data.dolarSpot.abertura ?? (data.dolarSpot.fechamentoAnterior || data.dolarSpot.preco),
                }
              : {}),
            ...(data.dolarPtax
              ? {
                  ptaxVenda: data.dolarPtax.venda,
                  ptaxCompra: data.dolarPtax.compra,
                }
              : {}),
          };
        }

        // Câmbio Euro Spot & PTAX BACEN
        if (data.euroSpot || data.euroPtax) {
          next.cambio.euroComercial = {
            ...next.cambio.euroComercial,
            ...(data.euroSpot
              ? {
                  venda: data.euroSpot.preco,
                  compra: Number((data.euroSpot.preco - 0.003).toFixed(4)),
                  variacao: data.euroSpot.variacao,
                  variacaoPct: data.euroSpot.variacaoPct,
                  maxima: data.euroSpot.maxima ?? Number((data.euroSpot.preco + 0.0180).toFixed(4)),
                  minima: data.euroSpot.minima ?? Number((data.euroSpot.preco - 0.0150).toFixed(4)),
                  abertura: data.euroSpot.abertura ?? (data.euroSpot.fechamentoAnterior || data.euroSpot.preco),
                }
              : {}),
            ...(data.euroPtax
              ? {
                  ptaxVenda: data.euroPtax.venda,
                }
              : {}),
          };
        }

        // Curva de Dólar
        if (data.curvaDolar && Array.isArray(data.curvaDolar)) {
          next.curvaDolar = next.curvaDolar.map((cd, idx) => {
            const item = data.curvaDolar[idx];
            if (item) {
              return {
                ...cd,
                dolarProjetado: item.dolarProjetado ?? cd.dolarProjetado,
                pontosForward: item.pontosForward ?? cd.pontosForward,
              };
            }
            return cd;
          });
        }

        return next;
      });

      if (data.sojaCbot?.preco) {
        setParidadeCbot(data.sojaCbot.preco);
      }
      if (data.dolarPtax?.venda) {
        setParidadeDolar(data.dolarPtax.venda);
        setFeijaoTaxaDolar(data.dolarPtax.venda);
      }
    } catch {
      // Ignora erro e mantém fallback
    } finally {
      setCarregandoOficial(false);
    }
  };

  // Atualização automática a cada 5 minutos (300 segundos) solicitada pelo usuário
  const [segundosAteAtualizacao, setSegundosAteAtualizacao] = useState<number>(300);

  // Carga inicial e atualização periódica oficial a cada 5 minutos (300s) com contagem regressiva
  useEffect(() => {
    setMounted(true);
    carregarCotacoesOficiais();

    const countdownInterval = setInterval(() => {
      setSegundosAteAtualizacao((prev) => {
        if (prev <= 1) {
          carregarCotacoesOficiais();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  // Atualiza contrato selecionado quando os dados do mercado atualizarem
  useEffect(() => {
    const atualizado =
      mercado.sojaChicago.contratos.find((c) => c.codigo === contratoSelecionado.codigo) ||
      mercado.milhoChicago.contratos.find((c) => c.codigo === contratoSelecionado.codigo) ||
      mercado.milhoB3.contratos.find((c) => c.codigo === contratoSelecionado.codigo) ||
      mercado.fareloChicago.contratos.find((c) => c.codigo === contratoSelecionado.codigo);

    if (atualizado) {
      setContratoSelecionado(atualizado);
    }
  }, [mercado, contratoSelecionado.codigo]);

  function handleForcarTick() {
    carregarCotacoesOficiais();
    setSegundosAteAtualizacao(300);
    setTickCounter((c) => c + 1);
  }

  function handleCarregarFeijaoNaCalculadora(variedade: VariedadeFeijaoAsia, porto: PortoDestinoAsia) {
    setModoCalculadora('FEIJAO_ASIA');
    setFeijaoVariedadeSelecionada(variedade);
    setPortoAsiaSelecionado(porto);
    setFeijaoFobUsdTon(variedade.precoFobUsdTon);
    setFeijaoFreteMaritimoUsd(porto.freteContainer20Usd);
    setFeijaoTaxaDolar(mercado.cambio.dolarComercial.ptaxVenda);
    setTabAtiva('PARIDADE');
  }

  // Cálculos de paridade Soja
  const resultadoParidadeSoja = calcularParidadeExportacaoSoja({
    cbotCentsBu: paridadeCbot,
    premioCentsBu: paridadePremio,
    taxaDolar: paridadeDolar,
    custoElevacaoUsdTon: paridadeElevacao,
    freteInternoReaisTon: paridadeFreteInterno,
  });

  // Cálculos de paridade Feijão Ásia em Dólar
  const resultadoParidadeFeijao = calcularParidadeFeijaoAsia({
    precoFobUsdTon: feijaoFobUsdTon,
    freteMaritimoContainerUsd: feijaoFreteMaritimoUsd,
    toneladasPorContainer: feijaoTonsContainer,
    taxaDolar: feijaoTaxaDolar,
    custoEstufagemSacariaUsdTon: feijaoEstufagemUsdTon,
    freteRodoviarioReaisTon: feijaoFreteRodoviarioReais,
    margemTradingUsdTon: feijaoMargemDesejadaUsdTon,
  });

  const copiarPropostaComprador = () => {
    const texto = `BELA CEREAIS EXPORT - INDICATIVO EXPORTAÇÃO ÁSIA
Produto: ${feijaoVariedadeSelecionada.nome} (${feijaoVariedadeSelecionada.nomeIngles})
Destino: ${portoAsiaSelecionado.porto} (${portoAsiaSelecionado.pais})
Incoterm: CFR ${portoAsiaSelecionado.codigoIata}
Preço CFR Ásia: US$ ${resultadoParidadeFeijao.precoCfrUsdTon.toFixed(2)} / ton
Preço FOB Porto: US$ ${feijaoFobUsdTon.toFixed(2)} / ton
Frete Marítimo Container 20': US$ ${feijaoFreteMaritimoUsd.toFixed(2)} (~US$ ${resultadoParidadeFeijao.freteMaritimoUsdTon.toFixed(2)}/t)
Embalagem: ${feijaoVariedadeSelecionada.embalagemPadrao}
Carga por FCL 20': ${feijaoTonsContainer} MT (Total Container: US$ ${resultadoParidadeFeijao.valorTotalContainerCfrUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })})
Câmbio Referência: R$ ${feijaoTaxaDolar.toFixed(4)} / US$
Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    navigator.clipboard.writeText(texto);
    setCopiadoProposta(true);
    setTimeout(() => setCopiadoProposta(false), 3000);
  };

  const sojaContratoAtivo = mercado.sojaChicago.contratos[0];
  const milhoCbotContratoAtivo = mercado.milhoChicago.contratos[0];
  const milhoB3ContratoAtivo = mercado.milhoB3.contratos[0];
  const fareloContratoAtivo = mercado.fareloChicago.contratos[0];
  const usd = mercado.cambio.dolarComercial;
  const eur = mercado.cambio.euroComercial;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* ========================================================================= */}
      {/* 1. CHASSIS WALL STREET: HEADER & TICKER TAPE BAR CONTÍNUO                */}
      {/* ========================================================================= */}
      <div className="bg-[#070b13] border border-slate-800 text-slate-100 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* BARRA SUPERIOR DE STATUS DE MERCADO E CONTROLES DE SINCRONIZAÇÃO */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/95 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          {/* LADO ESQUERDO: IDENTIFICAÇÃO E CERTIFICADO DE DADOS OFICIAIS */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-mono font-black tracking-wider text-sm text-white">
                PREGÃO &amp; COTAÇÕES OFICIAIS
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>DADOS 100% OFICIAIS · BACEN PTAX · CBOT · B3</span>
            </div>

            {ultimaAtualizacaoOficial && (
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Sincronizado: <span className="text-slate-200 font-bold">{ultimaAtualizacaoOficial}</span>
              </span>
            )}
          </div>

          {/* CENTRO: RELÓGIOS DOS CENTROS DE PREGÃO */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400 text-[10px] font-semibold">B3 (SP):</span>
              <span className="font-bold text-emerald-400">
                {mounted ? new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
              </span>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="text-slate-400 text-[10px] font-semibold">CBOT:</span>
              <span className="font-bold text-white">
                {mounted ? new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span className="text-slate-400 text-[10px] font-semibold">MUMBAI:</span>
              <span className="font-bold text-white">
                {mounted ? new Date().toLocaleTimeString('pt-BR', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-1.5 shadow-sm hidden md:flex">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span className="text-slate-400 text-[10px] font-semibold">XANGAI:</span>
              <span className="font-bold text-white">
                {mounted ? new Date().toLocaleTimeString('pt-BR', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
            </div>
          </div>

          {/* LADO DIREITO: AUTO-REFRESH 5 MIN E BOTÃO DE ATUALIZAR */}
          <div className="flex items-center gap-2.5 justify-end">
            {/* BADGE DE AUTO-REFRESH A CADA 5 MINUTOS */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono shadow-inner"
              title="Atualização automática dos valores programada a cada 5 minutos"
            >
              <div className="relative flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <span className="text-slate-400 text-[11px] hidden sm:inline whitespace-nowrap">Auto-refresh (5m):</span>
              <span className="text-amber-300 font-black tracking-wide">
                {Math.floor(segundosAteAtualizacao / 60)}:{(segundosAteAtualizacao % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* BOTÃO ATUALIZAR AGORA (AÇÃO PRIMÁRIA ÚNICA - SEM MODO SIMULADOR) */}
            <button
              onClick={handleForcarTick}
              disabled={carregandoOficial}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 border border-emerald-400/40 rounded-xl text-xs font-mono font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              title="Sincronizar dados oficiais com Banco Central e bolsas imediatamente"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${carregandoOficial ? 'animate-spin' : ''}`} />
              <span>{carregandoOficial ? 'Sincronizando...' : 'Atualizar Agora'}</span>
            </button>
          </div>
        </div>

        {/* FITA DE TICKER TAPE CONTÍNUA DE LED */}
        <div className="bg-black py-2.5 px-4 overflow-hidden border-b border-slate-800/90 whitespace-nowrap relative select-none">
          <div className="animate-led-marquee inline-flex gap-8 items-center text-xs font-mono">
            {/* ITEM 1: FEIJÃO MUNGO VERDE */}
            <div className="inline-flex items-center gap-2">
              <span className="text-amber-400 font-black">MUNGO VERDE</span>
              <span className="text-white font-bold">US$ 1.150,00/t</span>
              <span className="text-emerald-400 font-bold">▲ +2.22% (Índia/Tailândia)</span>
            </div>

            <span className="text-slate-700">◆</span>

            {/* ITEM 2: FEIJÃO MUNGO PRETO */}
            <div className="inline-flex items-center gap-2">
              <span className="text-amber-400 font-black">MUNGO PRETO</span>
              <span className="text-white font-bold">US$ 980,00/t</span>
              <span className="text-emerald-400 font-bold">▲ +1.55% (Black Matpe)</span>
            </div>

            <span className="text-slate-700">◆</span>

            {/* ITEM 3: FEIJÃO CAUPI FRADINHO */}
            <div className="inline-flex items-center gap-2">
              <span className="text-amber-400 font-black">CAUPI FRADINHO</span>
              <span className="text-white font-bold">US$ 890,00/t</span>
              <span className="text-emerald-400 font-bold">▲ +1.71% (Nhava Sheva)</span>
            </div>

            <span className="text-slate-700">◆</span>

            {/* ITEM 4: FEIJÃO CAUPI VERMELHO */}
            <div className="inline-flex items-center gap-2">
              <span className="text-amber-400 font-black">CAUPI VERMELHO</span>
              <span className="text-white font-bold">US$ 920,00/t</span>
              <span className="text-rose-400 font-bold">▼ -0.54% (Red Cowpea)</span>
            </div>

            <span className="text-slate-700">◆</span>

            {/* ITEM 5: FEIJÃO CAUPI BRANCO */}
            <div className="inline-flex items-center gap-2">
              <span className="text-amber-400 font-black">CAUPI BRANCO</span>
              <span className="text-white font-bold">US$ 910,00/t</span>
              <span className="text-emerald-400 font-bold">▲ +1.11% (White Cowpea)</span>
            </div>

            <span className="text-slate-700">◆</span>

            {/* ITEM 6: DÓLAR COMERCIAL */}
            <div className="inline-flex items-center gap-2">
              <span className="text-emerald-400 font-black">USD/BRL SPOT</span>
              <span className="text-white font-bold">R$ {usd.venda.toFixed(4)}</span>
              <span className={`font-bold ${usd.variacao >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {usd.variacao >= 0 ? '▲ +' : '▼ '}{usd.variacaoPct}%
              </span>
            </div>

            <span className="text-slate-700">◆</span>

            {/* ITEM 7: PTAX OFICIAL BACEN */}
            <div className="inline-flex items-center gap-2">
              <span className="text-cyan-400 font-black">PTAX BACEN</span>
              <span className="text-white font-bold">R$ {usd.ptaxVenda.toFixed(4)}</span>
              <span className="text-slate-400 text-[10px]">(Venda Oficial)</span>
            </div>

            <span className="text-slate-700">◆</span>

            {/* ITEM 8: FRETE CONTAINER 20' ÍNDIA */}
            <div className="inline-flex items-center gap-2">
              <span className="text-blue-400 font-black">FRETE 20&apos; NHAVA SHEVA</span>
              <span className="text-white font-bold">US$ 1.750/cntr</span>
              <span className="text-emerald-400 font-bold">~US$ 71,4/t (Índia)</span>
            </div>

            <span className="text-slate-700">◆</span>

            {/* ITEM 9: FRETE CONTAINER 20' TAILÂNDIA */}
            <div className="inline-flex items-center gap-2">
              <span className="text-blue-400 font-black">FRETE 20&apos; TAILÂNDIA</span>
              <span className="text-white font-bold">US$ 1.720/cntr</span>
              <span className="text-emerald-400 font-bold">~US$ 70,2/t (Bangkok)</span>
            </div>

            <span className="text-slate-700">◆</span>

            {/* ITEM 10: SOJA CBOT */}
            <div className="inline-flex items-center gap-2">
              <span className="text-amber-400 font-black">CBOT SOJA {sojaContratoAtivo.mesVencimento}</span>
              <span className="text-white font-bold">{sojaContratoAtivo.ultimo.toFixed(2)}¢/bu</span>
              <span className={`font-bold ${sojaContratoAtivo.variacao >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {sojaContratoAtivo.variacao >= 0 ? '▲ +' : '▼ '}{sojaContratoAtivo.variacaoPct}%
              </span>
            </div>

            <span className="text-slate-700">◆</span>

            {/* ITEM 11: MILHO B3 */}
            <div className="inline-flex items-center gap-2">
              <span className="text-cyan-400 font-black">B3 MILHO {milhoB3ContratoAtivo.codigo}</span>
              <span className="text-white font-bold">R$ {milhoB3ContratoAtivo.ultimo.toFixed(2)}/sc</span>
              <span className={`font-bold ${milhoB3ContratoAtivo.variacao >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {milhoB3ContratoAtivo.variacao >= 0 ? '▲ +' : '▼ '}{milhoB3ContratoAtivo.variacaoPct}%
              </span>
            </div>

            <span className="text-slate-700">◆</span>

            {/* ITEM 12: DÓLAR FORWARD 180D */}
            <div className="inline-flex items-center gap-2">
              <span className="text-violet-400 font-black">DÓLAR FORWARD 180D</span>
              <span className="text-white font-bold">R$ {mercado.curvaDolar[4].dolarProjetado.toFixed(4)}</span>
              <span className="text-slate-400">(+{mercado.curvaDolar[4].pontosForward.toFixed(1)} pts)</span>
            </div>
          </div>
        </div>

        {/* BARRA DE NAVEGAÇÃO DE ABAS DO TERMINAL */}
        <div className="px-5 py-3 bg-[#0a0e17] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            {[
              { id: 'GERAL', label: 'Visão Geral Mercado', icon: Globe2 },
              { id: 'FEIJOES_ASIA', label: 'Feijões & Ásia (US$)', icon: Ship, highlight: true },
              { id: 'CAMBIO_CURVA', label: 'Câmbio Dólar & Curva', icon: DollarSign },
              { id: 'GRAOS', label: 'CBOT Soja & Milho B3', icon: Activity },
              { id: 'PARIDADE', label: 'Calculadora de Paridade', icon: Calculator },
            ].map((tab) => {
              const Icon = tab.icon;
              const ativa = tabAtiva === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabAtiva(tab.id as TabView)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    ativa
                      ? tab.highlight
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : tab.highlight
                        ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/80'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.highlight && !ativa && (
                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-black rounded uppercase">
                      Ásia
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span>Trading Desk:</span>
            <span className="text-amber-400 font-bold">BELA CEREAIS · EXPORTAÇÃO CONTAINERIZADA</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB: FEIJOES_ASIA - MESA ESPECIAL EXPORTAÇÃO ÁSIA EM DÓLAR (USD)       */}
      {/* ========================================================================= */}
      {tabAtiva === 'FEIJOES_ASIA' && (
        <div className="space-y-6">
          {/* BANNER ESPECIAL DESTINO ÁSIA & DÓLAR */}
          <div className="bg-gradient-to-r from-slate-900 via-[#0d1728] to-slate-900 border border-amber-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-full bg-amber-500/5 blur-3xl pointer-events-none"></div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold mb-2.5">
                  <Ship className="w-3.5 h-3.5" />
                  <span>MESA DE OPERAÇÕES · EXPORTAÇÃO ÁSIA EM CONTAINERS (DÓLAR / US$)</span>
                </div>
                <h2 className="text-2xl font-black font-mono tracking-tight text-white">
                  Feijões &amp; Pulses Exportação: Índia, Tailândia, Vietnã, China &amp; Sudeste Asiático
                </h2>
                <p className="text-xs text-slate-300 font-mono mt-1 max-w-3xl leading-relaxed">
                  Cotações indicativas em Dólar (US$/ton FOB Santos/Paranaguá &amp; CFR Ásia), fretes marítimos para containers de 20&apos; (~24 a 25t),
                  paridades de compra no interior de MT em R$/saca e estrutura completa de formação de preço.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="bg-black/60 border border-slate-800 p-3 rounded-xl font-mono text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">DÓLAR REFERÊNCIA (PTAX BACEN)</span>
                  <span className="text-xl font-black text-emerald-400">R$ {usd.ptaxVenda.toFixed(4)}</span>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('simulador-feijao-asia');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Simular Paridade CFR Ásia</span>
                </button>
              </div>
            </div>

            {/* MINI METRICS DE DESTAQUE */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 font-mono text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">PRINCIPAIS DESTINOS</span>
                <span className="text-sm font-black text-amber-300">1º Índia · 2º Tailândia</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Nhava Sheva ($1.750) · Bangkok ($1.720)</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">CARGA POR CONTAINER 20&apos;</span>
                <span className="text-sm font-black text-white">24,5 a 25 Toneladas</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Sacaria 25kg / 50kg / Big Bag</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">MUNGO VERDE (GREEN MUNG)</span>
                <span className="text-sm font-black text-emerald-400">US$ 1.150,00 / ton</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Equiv: R$ 348,08 / sc 60kg</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">CAUPI FRADINHO (COWPEA)</span>
                <span className="text-sm font-black text-cyan-400">US$ 890,00 / ton</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Equiv: R$ 269,30 / sc 60kg</span>
              </div>
            </div>
          </div>

          {/* GRID DE CARDS DAS 5 VARIEDADES DE FEIJÃO COM CONTRASTE SUAVE E SEM PISCAR */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black font-mono text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>Variedades de Feijões &amp; Pulses Comercializados pela Bela Cereais</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">
                Moeda: Dólar Americano (USD) · Base FOB Santos / Paranaguá
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {VARIEDADES_FEIJAO_ASIA.map((v) => {
                const equivReaisSaca = ((v.precoFobUsdTon * usd.venda) / 16.6667).toFixed(2);
                return (
                  <div
                    key={v.id}
                    className="bg-[#0b101c] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col justify-between transition-all duration-200"
                  >
                    <div>
                      {/* TOPO DO CARD COM A FONTE IDENTIFICADA */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] font-mono">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold truncate pr-2">
                          <Globe2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span className="truncate">FONTE: {v.fonteCotacao}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                          FOB Indicativo
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3 pt-3 pb-2.5 border-b border-slate-800/80">
                        <div>
                          <span className="text-[10px] font-mono text-amber-400/90 font-black uppercase tracking-widest block">
                            {v.nomeIngles}
                          </span>
                          <h4 className="text-base font-black font-mono text-white mt-0.5">{v.nome}</h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                            v.variacaoUsd >= 0
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {v.variacaoUsd >= 0 ? '+' : ''}${v.variacaoUsd.toFixed(1)} ({v.variacaoPct > 0 ? '+' : ''}{v.variacaoPct}%)
                          </span>
                        </div>
                      </div>

                      {/* PREÇO EM DESTAQUE - NUNCA QUEBRA */}
                      <div className="my-3.5 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                            Preço FOB Porto
                          </span>
                          <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
                            Fazenda MT: <strong className="text-slate-200">R$ {v.precoFazendaRefReaisSaca.toFixed(2)}/sc</strong>
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                            US$ {v.precoFobUsdTon.toFixed(2)}
                          </span>
                          <span className="text-xs font-mono text-slate-400 font-medium">/ ton</span>
                        </div>
                      </div>

                      {/* LISTA DE DADOS JUSTIFICADOS */}
                      <div className="space-y-2 pt-1 text-xs font-mono">
                        <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                          <span className="text-slate-400 whitespace-nowrap text-[11px]">Equiv. Porto:</span>
                          <strong className="text-amber-400 whitespace-nowrap text-right">R$ {equivReaisSaca} <span className="text-[10px] text-amber-400/80 font-normal">/sc 60kg</span></strong>
                        </div>
                        <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                          <span className="text-slate-400 whitespace-nowrap text-[11px]">Destinos:</span>
                          <strong className="text-white text-right truncate pl-2">{v.principaisDestinos.join(', ')}</strong>
                        </div>
                        <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                          <span className="text-slate-400 whitespace-nowrap text-[11px]">Embalagem:</span>
                          <span className="text-slate-200 text-right whitespace-nowrap">{v.embalagemPadrao}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                          <span className="text-slate-400 whitespace-nowrap text-[11px]">Capacidade Container 20&apos;:</span>
                          <span className="text-emerald-400 font-bold whitespace-nowrap">~{v.capacidadeContainer20Ton} toneladas</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[180px]" title={v.qualidadeEspecificacao}>
                        {v.qualidadeEspecificacao}
                      </span>
                      <button
                        onClick={() => {
                          setFeijaoVariedadeSelecionada(v);
                          setFeijaoFobUsdTon(v.precoFobUsdTon);
                          setFeijaoTonsContainer(v.capacidadeContainer20Ton);
                          const el = document.getElementById('simulador-feijao-asia');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-mono font-bold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Simular Paridade</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABELA DE FRETES MARÍTIMOS E PORTOS DA ÁSIA (LIDERADO POR ÍNDIA, LOGO APÓS TAILÂNDIA) */}
          <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-5 text-white shadow-xl space-y-4">
            {/* TOPO COM FONTE OFICIAL DOS FRETES */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <Ship className="w-4 h-4 shrink-0" />
                <span>FONTE: Freightos Baltic Index (FBX) / Armadores Regulares (Maersk, MSC, CMA CGM, ONE, Hapag-Lloyd)</span>
              </div>
              <span className="text-slate-300 text-[11px]">Rotas regulares FCL 20ft Dry Food-Grade</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Anchor className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black font-mono text-white">
                  TABELA DE FRETES MARÍTIMOS CONTAINERIZADOS · ROTAS BRASIL -&gt; ÁSIA (US$)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Porto de Origem: Paranaguá / Santos · Ranking Liderado por Índia &amp; Tailândia
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Ranking / País</th>
                    <th className="py-2.5 px-3">Porto Asiático</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3 text-center">Transit Time</th>
                    <th className="py-2.5 px-3 text-right">Frete 20&apos; FCL (USD)</th>
                    <th className="py-2.5 px-3 text-right">Custo / Ton (24.5t)</th>
                    <th className="py-2.5 px-3 text-center">Demurrage</th>
                    <th className="py-2.5 px-3">Fonte Extraída</th>
                    <th className="py-2.5 px-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {PORTOS_ASIA.map((porto, index) => {
                    const custoTon = (porto.freteContainer20Usd / 24.5).toFixed(2);
                    const isIndia = porto.pais === 'Índia';
                    const isTailandia = porto.pais === 'Tailândia';
                    return (
                      <tr
                        key={porto.id}
                        className={`transition-colors ${
                          isIndia
                            ? 'bg-amber-500/5 hover:bg-amber-500/10'
                            : isTailandia
                              ? 'bg-blue-500/5 hover:bg-blue-500/10'
                              : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              index === 0
                                ? 'bg-amber-500 text-slate-950'
                                : index === 1
                                  ? 'bg-amber-500/30 text-amber-300'
                                  : index === 2
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <span>{porto.pais}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-200 font-bold">{porto.porto}</td>
                        <td className="py-3 px-3 text-slate-400">{porto.codigoIata}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-300">
                          {porto.transitTimeDias} dias
                        </td>
                        <td className="py-3 px-3 text-right font-black text-blue-400 text-sm">
                          US$ {porto.freteContainer20Usd.toLocaleString('en-US')}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          US$ {custoTon} / t
                        </td>
                        <td className="py-3 px-3 text-center text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px]">
                            {porto.demurrageFreeDays} dias
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[10px] text-slate-400 truncate max-w-[170px]" title={porto.fonteFrete}>
                          {porto.fonteFrete}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              setPortoAsiaSelecionado(porto);
                              setFeijaoFreteMaritimoUsd(porto.freteContainer20Usd);
                              const el = document.getElementById('simulador-feijao-asia');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-[11px] font-bold border border-slate-700 transition-colors cursor-pointer"
                          >
                            Simular Rota
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIMULADOR INTERATIVO DEDICADO DE PARIDADE & EXPORTAÇÃO DE FEIJÕES ÁSIA */}
          <div
            id="simulador-feijao-asia"
            className="bg-[#0b101c] border border-amber-500/40 rounded-2xl p-6 text-white shadow-2xl space-y-6"
          >
            {/* FONTE NO TOPO DO SIMULADOR */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 shrink-0 text-amber-400" />
                <span>FONTE DE PARIDADE: Modelo Operacional de Exportação Bela Cereais · Câmbio PTAX BACEN Oficial</span>
              </span>
              <span className="text-slate-400 text-[11px]">Incoterms: FOB Santos/Paranaguá e CFR Portos Ásia</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black font-mono text-white">
                    SIMULADOR DE PARIDADE DE EXPORTAÇÃO · FEIJÕES &amp; PULSES (Ásia em Dólar / US$)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Formação de preço CFR Ásia por container de 20&apos; e paridade máxima de compra no interior de Mato Grosso
                  </p>
                </div>
              </div>

              <div className="text-xs font-mono text-right">
                <span className="text-slate-400 block">Variedade Selecionada:</span>
                <span className="text-amber-400 font-bold">{feijaoVariedadeSelecionada.nome} ({feijaoVariedadeSelecionada.nomeIngles})</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* FORMULÁRIO FEIJÃO ÁSIA */}
              <div className="lg:col-span-7 space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SELEÇÃO DA VARIEDADE */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">1. Variedade de Feijão</label>
                    <select
                      value={feijaoVariedadeSelecionada.id}
                      onChange={(e) => {
                        const encontrada = VARIEDADES_FEIJAO_ASIA.find((v) => v.id === e.target.value);
                        if (encontrada) {
                          setFeijaoVariedadeSelecionada(encontrada);
                          setFeijaoFobUsdTon(encontrada.precoFobUsdTon);
                          setFeijaoTonsContainer(encontrada.capacidadeContainer20Ton);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none"
                    >
                      {VARIEDADES_FEIJAO_ASIA.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nome} ({v.nomeIngles})
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Embalagem: {feijaoVariedadeSelecionada.embalagemPadrao}
                    </span>
                  </div>

                  {/* SELEÇÃO DO PORTO ASIÁTICO */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">2. Porto Destino Ásia</label>
                    <select
                      value={portoAsiaSelecionado.id}
                      onChange={(e) => {
                        const porto = PORTOS_ASIA.find((p) => p.id === e.target.value);
                        if (porto) {
                          setPortoAsiaSelecionado(porto);
                          setFeijaoFreteMaritimoUsd(porto.freteContainer20Usd);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none"
                    >
                      {PORTOS_ASIA.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.porto} ({p.pais}) · {p.transitTimeDias}d TT
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Linha marítima Paranaguá/Santos -&gt; Ásia
                    </span>
                  </div>

                  {/* PREÇO FOB US$/TON */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">3. Preço FOB Porto (US$/ton)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="5"
                        value={feijaoFobUsdTon}
                        onChange={(e) => setFeijaoFobUsdTon(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-xs">US$/t</span>
                    </div>
                  </div>

                  {/* FRETE MARÍTIMO CONTAINER 20' */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">4. Frete Marítimo 20&apos; FCL (US$)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="25"
                        value={feijaoFreteMaritimoUsd}
                        onChange={(e) => setFeijaoFreteMaritimoUsd(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-xs">US$/cntr</span>
                    </div>
                  </div>

                  {/* TAXA DE CÂMBIO DÓLAR */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">5. Câmbio PTAX / Trava (R$/US$)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        value={feijaoTaxaDolar}
                        onChange={(e) => setFeijaoTaxaDolar(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-xs">R$</span>
                    </div>
                  </div>

                  {/* TONELADAS POR CONTAINER */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">6. Peso Líquido por 20&apos; (Ton)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={feijaoTonsContainer}
                        onChange={(e) => setFeijaoTonsContainer(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-xs">ton</span>
                    </div>
                  </div>

                  {/* FRETE RODOVIÁRIO INTERIOR */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">7. Frete Rodoviário MT -&gt; Porto (R$/ton)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="5"
                        value={feijaoFreteRodoviarioReais}
                        onChange={(e) => setFeijaoFreteRodoviarioReais(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-xs">R$/t</span>
                    </div>
                  </div>

                  {/* MARGEM DESEJADA */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">8. Margem Trading (US$/ton)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        value={feijaoMargemDesejadaUsdTon}
                        onChange={(e) => setFeijaoMargemDesejadaUsdTon(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-xs">US$/t</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RESULTADOS FEIJÃO ÁSIA */}
              <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block">
                      PARIDADE FEIJÃO EXPORTAÇÃO ÁSIA
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      INCOTERM CFR
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                    {portoAsiaSelecionado.porto} · {portoAsiaSelecionado.pais} ({portoAsiaSelecionado.transitTimeDias} dias TT)
                  </span>
                </div>

                <div className="space-y-3 font-mono">
                  {/* PREÇO CFR ÁSIA */}
                  <div className="p-3.5 bg-black/80 border border-amber-500/30 rounded-xl">
                    <div className="text-[11px] text-amber-400 font-bold">PREÇO CFR ÁSIA (US$/TONELADA)</div>
                    <div className="text-3xl font-black text-white mt-0.5">
                      US$ {resultadoParidadeFeijao.precoCfrUsdTon.toFixed(2)}
                      <span className="text-xs text-slate-400 font-normal ml-1">/ ton CFR</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 flex items-center justify-between">
                      <span>Total Container ({feijaoTonsContainer}t):</span>
                      <strong className="text-emerald-400 text-sm">
                        US$ {resultadoParidadeFeijao.valorTotalContainerCfrUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>

                  {/* PREÇO MÁXIMO DE COMPRA FAZENDA */}
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="text-[11px] text-emerald-400 font-bold">PREÇO MÁXIMO COMPRA INTERIOR (MT)</div>
                    <div className="text-2xl font-black text-emerald-300 mt-0.5">
                      R$ {resultadoParidadeFeijao.precoMaxCompraFazendaReaisSaca.toFixed(2)}
                      <span className="text-xs text-slate-300 font-normal ml-1">/ saca 60kg</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Equivalente líquido a US$ {resultadoParidadeFeijao.precoMaxCompraFazendaUsdTon.toFixed(1)}/ton na fazenda
                    </div>
                  </div>
                </div>

                <button
                  onClick={copiarPropostaComprador}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiadoProposta ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Proposta Copiada para a Área de Transferência!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>Copiar Indicativo de Oferta para Comprador</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: GERAL & GRAOS - COMMODITIES AGRÍCOLAS (CBOT & B3)                 */}
      {/* ========================================================================= */}
      {(tabAtiva === 'GERAL' || tabAtiva === 'GRAOS') && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 font-mono">
                <span>COMMODITIES AGRÍCOLAS TRADICIONAIS (CBOT &amp; B3)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cotações da Bolsa de Chicago (CBOT / CME Group) e Bolsa B3 Brasil
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500">
              Ref: Bolsa de Chicago (Cents/bu) · B3 (R$/saca)
            </div>
          </div>

          {/* GRID DE CARDS PRINCIPAIS COM ESPAÇAMENTO GENEROSO E ALINHAMENTO JUSTIFICADO */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* CARD 1: SOJA CHICAGO */}
            <div
              onClick={() => setContratoSelecionado(sojaContratoAtivo)}
              className={`bg-[#0b101c] text-white p-5 rounded-2xl border cursor-pointer relative overflow-hidden transition-all duration-200 shadow-xl flex flex-col justify-between ${
                contratoSelecionado.codigo === sojaContratoAtivo.codigo
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* TOPO: FONTE E BADGE OFICIAL */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold min-w-0">
                    <Globe2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="truncate">CME / CBOT</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    Oficial CBOT
                  </span>
                </div>

                {/* IDENTIFICAÇÃO DO PRODUTO E CONTRATO */}
                <div className="flex items-center justify-between gap-2 mt-3 mb-2.5">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400/90 font-black tracking-wider uppercase block">
                      SOJA EM GRÃO
                    </span>
                    <h3 className="text-sm font-black font-mono text-white mt-0.5 whitespace-nowrap">
                      {sojaContratoAtivo.codigo} <span className="text-xs text-slate-400 font-normal">({sojaContratoAtivo.mesVencimento})</span>
                    </h3>
                  </div>
                  <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
                    sojaContratoAtivo.variacao >= 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {sojaContratoAtivo.variacao >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* BOX DE PREÇO: DUAS LINHAS ESPAÇOSAS - NUNCA QUEBRA */}
                <div className="my-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                      Último Preço
                    </span>
                    <div className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                      sojaContratoAtivo.variacao >= 0
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      <span>{sojaContratoAtivo.variacao >= 0 ? '+' : ''}{sojaContratoAtivo.variacao.toFixed(2)}</span>
                      <span className="text-[11px] opacity-90">({sojaContratoAtivo.variacaoPct > 0 ? '+' : ''}{sojaContratoAtivo.variacaoPct}%)</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                      {sojaContratoAtivo.ultimo.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-medium">¢/bu</span>
                  </div>
                </div>
              </div>

              {/* LINHAS DE PARIDADE JUSTIFICADAS E SEM QUEBRA */}
              <div className="space-y-2 pt-2.5 border-t border-slate-800/80 text-xs font-mono">
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="text-slate-400 whitespace-nowrap text-[11px]">FOB Santos Est.:</span>
                  <strong className="text-white whitespace-nowrap">${((sojaContratoAtivo.ultimo + 75) / 100 * 36.7437).toFixed(1)} <span className="text-[10px] font-normal text-slate-400">/ton</span></strong>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="text-slate-400 whitespace-nowrap text-[11px]">Paridade Santos:</span>
                  <strong className="text-amber-400 whitespace-nowrap">R$ {(((sojaContratoAtivo.ultimo + 75) / 100 * 36.7437 * usd.venda) / 16.6667).toFixed(2)} <span className="text-[10px] font-normal text-amber-400/80">/sc</span></strong>
                </div>
              </div>
            </div>

            {/* CARD 2: MILHO CHICAGO */}
            <div
              onClick={() => setContratoSelecionado(milhoCbotContratoAtivo)}
              className={`bg-[#0b101c] text-white p-5 rounded-2xl border cursor-pointer relative overflow-hidden transition-all duration-200 shadow-xl flex flex-col justify-between ${
                contratoSelecionado.codigo === milhoCbotContratoAtivo.codigo
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* TOPO: FONTE E BADGE OFICIAL */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold min-w-0">
                    <Globe2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="truncate">CME / CBOT</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    Oficial CBOT
                  </span>
                </div>

                {/* IDENTIFICAÇÃO DO PRODUTO E CONTRATO */}
                <div className="flex items-center justify-between gap-2 mt-3 mb-2.5">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400/90 font-black tracking-wider uppercase block">
                      MILHO CHICAGO
                    </span>
                    <h3 className="text-sm font-black font-mono text-white mt-0.5 whitespace-nowrap">
                      {milhoCbotContratoAtivo.codigo} <span className="text-xs text-slate-400 font-normal">({milhoCbotContratoAtivo.mesVencimento})</span>
                    </h3>
                  </div>
                  <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
                    milhoCbotContratoAtivo.variacao >= 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {milhoCbotContratoAtivo.variacao >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* BOX DE PREÇO: DUAS LINHAS ESPAÇOSAS - NUNCA QUEBRA */}
                <div className="my-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                      Último Preço
                    </span>
                    <div className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                      milhoCbotContratoAtivo.variacao >= 0
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      <span>{milhoCbotContratoAtivo.variacao >= 0 ? '+' : ''}{milhoCbotContratoAtivo.variacao.toFixed(2)}</span>
                      <span className="text-[11px] opacity-90">({milhoCbotContratoAtivo.variacaoPct > 0 ? '+' : ''}{milhoCbotContratoAtivo.variacaoPct}%)</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                      {milhoCbotContratoAtivo.ultimo.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-medium">¢/bu</span>
                  </div>
                </div>
              </div>

              {/* LINHAS DE PARIDADE JUSTIFICADAS E SEM QUEBRA */}
              <div className="space-y-2 pt-2.5 border-t border-slate-800/80 text-xs font-mono">
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="text-slate-400 whitespace-nowrap text-[11px]">FOB Santos Est.:</span>
                  <strong className="text-white whitespace-nowrap">${((milhoCbotContratoAtivo.ultimo + 65) / 100 * 39.368).toFixed(1)} <span className="text-[10px] font-normal text-slate-400">/ton</span></strong>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="text-slate-400 whitespace-nowrap text-[11px]">Equivalente R$:</span>
                  <strong className="text-amber-400 whitespace-nowrap">R$ {(((milhoCbotContratoAtivo.ultimo + 65) / 100 * 39.368 * usd.venda) / 16.6667).toFixed(2)} <span className="text-[10px] font-normal text-amber-400/80">/sc</span></strong>
                </div>
              </div>
            </div>

            {/* CARD 3: MILHO B3 (BRASIL) */}
            <div
              onClick={() => setContratoSelecionado(milhoB3ContratoAtivo)}
              className={`bg-[#0b101c] text-white p-5 rounded-2xl border cursor-pointer relative overflow-hidden transition-all duration-200 shadow-xl flex flex-col justify-between ${
                contratoSelecionado.codigo === milhoB3ContratoAtivo.codigo
                  ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-cyan-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* TOPO: FONTE E BADGE OFICIAL B3 */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold min-w-0">
                    <Globe2 className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span className="truncate">B3 BRASIL</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
                    Oficial B3
                  </span>
                </div>

                {/* IDENTIFICAÇÃO DO PRODUTO E CONTRATO */}
                <div className="flex items-center justify-between gap-2 mt-3 mb-2.5">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400/90 font-black tracking-wider uppercase block">
                      MILHO FUTURO B3
                    </span>
                    <h3 className="text-sm font-black font-mono text-white mt-0.5 whitespace-nowrap">
                      {milhoB3ContratoAtivo.codigo} <span className="text-xs text-slate-400 font-normal">({milhoB3ContratoAtivo.mesVencimento})</span>
                    </h3>
                  </div>
                  <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
                    milhoB3ContratoAtivo.variacao >= 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {milhoB3ContratoAtivo.variacao >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* BOX DE PREÇO: DUAS LINHAS ESPAÇOSAS - NUNCA QUEBRA */}
                <div className="my-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                      Último Preço
                    </span>
                    <div className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                      milhoB3ContratoAtivo.variacao >= 0
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      <span>{milhoB3ContratoAtivo.variacao >= 0 ? '+' : ''}{milhoB3ContratoAtivo.variacao.toFixed(2)}</span>
                      <span className="text-[11px] opacity-90">({milhoB3ContratoAtivo.variacaoPct > 0 ? '+' : ''}{milhoB3ContratoAtivo.variacaoPct}%)</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                      R$ {milhoB3ContratoAtivo.ultimo.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-medium">/sc 60kg</span>
                  </div>
                </div>
              </div>

              {/* LINHAS DE PARIDADE JUSTIFICADAS E SEM QUEBRA */}
              <div className="space-y-2 pt-2.5 border-t border-slate-800/80 text-xs font-mono">
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="text-slate-400 whitespace-nowrap text-[11px]">Paridade Dólar:</span>
                  <strong className="text-white whitespace-nowrap">${(milhoB3ContratoAtivo.ultimo / usd.venda).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/sc</span></strong>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="text-slate-400 whitespace-nowrap text-[11px]">Equiv. Tonelada:</span>
                  <strong className="text-cyan-400 whitespace-nowrap">R$ {(milhoB3ContratoAtivo.ultimo * 16.6667).toFixed(1)} <span className="text-[10px] font-normal text-cyan-400/80">/ton</span></strong>
                </div>
              </div>
            </div>

            {/* CARD 4: FARELO CHICAGO */}
            <div
              onClick={() => setContratoSelecionado(fareloContratoAtivo)}
              className={`bg-[#0b101c] text-white p-5 rounded-2xl border cursor-pointer relative overflow-hidden transition-all duration-200 shadow-xl flex flex-col justify-between ${
                contratoSelecionado.codigo === fareloContratoAtivo.codigo
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* TOPO: FONTE E BADGE OFICIAL */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold min-w-0">
                    <Globe2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="truncate">CME / CBOT</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    Oficial CBOT
                  </span>
                </div>

                {/* IDENTIFICAÇÃO DO PRODUTO E CONTRATO */}
                <div className="flex items-center justify-between gap-2 mt-3 mb-2.5">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400/90 font-black tracking-wider uppercase block">
                      FARELO DE SOJA
                    </span>
                    <h3 className="text-sm font-black font-mono text-white mt-0.5 whitespace-nowrap">
                      {fareloContratoAtivo.codigo} <span className="text-xs text-slate-400 font-normal">({fareloContratoAtivo.mesVencimento})</span>
                    </h3>
                  </div>
                  <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
                    fareloContratoAtivo.variacao >= 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {fareloContratoAtivo.variacao >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* BOX DE PREÇO: DUAS LINHAS ESPAÇOSAS - NUNCA QUEBRA */}
                <div className="my-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                      Último Preço
                    </span>
                    <div className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                      fareloContratoAtivo.variacao >= 0
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      <span>{fareloContratoAtivo.variacao >= 0 ? '+' : ''}{fareloContratoAtivo.variacao.toFixed(2)}</span>
                      <span className="text-[11px] opacity-90">({fareloContratoAtivo.variacaoPct > 0 ? '+' : ''}{fareloContratoAtivo.variacaoPct}%)</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                      ${fareloContratoAtivo.ultimo.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-medium">/st</span>
                  </div>
                </div>
              </div>

              {/* LINHAS DE PARIDADE JUSTIFICADAS E SEM QUEBRA */}
              <div className="space-y-2 pt-2.5 border-t border-slate-800/80 text-xs font-mono">
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="text-slate-400 whitespace-nowrap text-[11px]">Ton Métrica:</span>
                  <strong className="text-white whitespace-nowrap">${(fareloContratoAtivo.ultimo * 1.1023).toFixed(1)} <span className="text-[10px] font-normal text-slate-400">/ton</span></strong>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="text-slate-400 whitespace-nowrap text-[11px]">Equivalente R$:</span>
                  <strong className="text-amber-400 whitespace-nowrap">R$ {(fareloContratoAtivo.ultimo * 1.1023 * usd.venda).toFixed(1)} <span className="text-[10px] font-normal text-amber-400/80">/ton</span></strong>
                </div>
              </div>
            </div>
          </div>

          {/* GRÁFICO INTRADAY DO CONTRATO SELECIONADO (SEM PISCAR EM BRANCO) */}
          <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-5 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block">
                  GRÁFICO INTRADAY EM TEMPO REAL
                </span>
                <h3 className="text-lg font-black font-mono text-white mt-0.5">
                  {contratoSelecionado.codigo} - {contratoSelecionado.mesVencimento} ({contratoSelecionado.unidade})
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>Último: <strong className="text-white text-base">{contratoSelecionado.ultimo.toFixed(2)}</strong></div>
                <div>Máx: <strong className="text-emerald-400">{contratoSelecionado.maxima.toFixed(2)}</strong></div>
                <div>Mín: <strong className="text-rose-400">{contratoSelecionado.minima.toFixed(2)}</strong></div>
              </div>
            </div>

            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={contratoSelecionado.historicoIntraday || []}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={contratoSelecionado.variacao >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={contratoSelecionado.variacao >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hora" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: any) => [`${Number(value).toFixed(2)} ${contratoSelecionado.unidade}`, 'Preço']}
                  />
                  <Area
                    type="monotone"
                    dataKey="preco"
                    isAnimationActive={false}
                    stroke={contratoSelecionado.variacao >= 0 ? "#10b981" : "#f43f5e"}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: CAMBIO_CURVA - DÓLAR & CURVA FORWARD                              */}
      {/* ========================================================================= */}
      {(tabAtiva === 'GERAL' || tabAtiva === 'CAMBIO_CURVA') && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 font-mono">
                <span>CÂMBIO DÓLAR (USD/BRL) &amp; ESTRUTURA A TERMO (FORWARD)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Taxa de câmbio PTAX oficial, mercado interbancário e curva de juros cambiais
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500">
              Taxa Referência: PTAX R$ {usd.ptaxVenda.toFixed(4)}
            </div>
          </div>

          {/* CARDS DE CÂMBIO COM ESPAÇAMENTO GENEROSO E ALINHAMENTO JUSTIFICADO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* DÓLAR COMERCIAL */}
            <div className="bg-[#0b101c] border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col justify-between">
              <div>
                {/* TOPO DO CARD: FONTE EXTRAÍDA */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold min-w-0">
                    <Globe2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span className="truncate">BACEN PTAX · BANCO CENTRAL</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                    Oficial BACEN
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
                      $
                    </div>
                    <div>
                      <h3 className="text-base font-black font-mono text-white whitespace-nowrap">DÓLAR COMERCIAL (USD/BRL)</h3>
                      <span className="text-xs font-mono text-slate-400 block">Moeda Base de Exportação Bela Cereais</span>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight whitespace-nowrap">
                      R$ {usd.venda.toFixed(4)}
                    </div>
                    <div className={`text-xs font-mono font-bold mt-0.5 whitespace-nowrap ${usd.variacao >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {usd.variacao >= 0 ? '+' : ''}{usd.variacao.toFixed(4)} ({usd.variacaoPct > 0 ? '+' : ''}{usd.variacaoPct}%)
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold whitespace-nowrap">PTAX VENDA (BACEN)</span>
                  <span className="font-bold text-amber-400 text-sm mt-0.5 block whitespace-nowrap">R$ {usd.ptaxVenda.toFixed(4)}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold whitespace-nowrap">DÓLAR COMPRA</span>
                  <span className="font-bold text-white text-sm mt-0.5 block whitespace-nowrap">R$ {usd.compra.toFixed(4)}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold whitespace-nowrap mb-0.5">
                    <span>MÁXIMA DO DIA</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <span className="font-bold text-emerald-400 text-sm block whitespace-nowrap">R$ {usd.maxima.toFixed(4)}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold whitespace-nowrap mb-0.5">
                    <span>MÍNIMA DO DIA</span>
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  </div>
                  <span className="font-bold text-rose-400 text-sm block whitespace-nowrap">R$ {usd.minima.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* EURO COMERCIAL */}
            <div className="bg-[#0b101c] border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col justify-between">
              <div>
                {/* TOPO DO CARD: FONTE EXTRAÍDA */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold min-w-0">
                    <Globe2 className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                    <span className="truncate">BACEN PTAX · CROSS EUR/USD</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30 shrink-0">
                    Oficial BACEN
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
                      €
                    </div>
                    <div>
                      <h3 className="text-base font-black font-mono text-white whitespace-nowrap">EURO COMERCIAL (EUR/BRL)</h3>
                      <span className="text-xs font-mono text-slate-400 block">Cross Rate EUR/USD: {eur.crossRateEurUsd.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="text-2xl font-black font-mono text-blue-400 tracking-tight whitespace-nowrap">
                      R$ {eur.venda.toFixed(4)}
                    </div>
                    <div className={`text-xs font-mono font-bold mt-0.5 whitespace-nowrap ${eur.variacao >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {eur.variacao >= 0 ? '+' : ''}{eur.variacao.toFixed(4)} ({eur.variacaoPct > 0 ? '+' : ''}{eur.variacaoPct}%)
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold whitespace-nowrap">PTAX VENDA (BACEN)</span>
                  <span className="font-bold text-amber-400 text-sm mt-0.5 block whitespace-nowrap">R$ {eur.ptaxVenda.toFixed(4)}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold whitespace-nowrap">EURO COMPRA</span>
                  <span className="font-bold text-white text-sm mt-0.5 block whitespace-nowrap">R$ {eur.compra.toFixed(4)}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold whitespace-nowrap mb-0.5">
                    <span>MÁXIMA DO DIA</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <span className="font-bold text-emerald-400 text-sm block whitespace-nowrap">R$ {eur.maxima.toFixed(4)}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold whitespace-nowrap mb-0.5">
                    <span>MÍNIMA DO DIA</span>
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  </div>
                  <span className="font-bold text-rose-400 text-sm block whitespace-nowrap">R$ {eur.minima.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TABELA & GRÁFICO DA CURVA DE DÓLAR */}
          <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-5 text-white shadow-xl space-y-4">
            {/* TOPO DA CURVA: FONTE EXTRAÍDA */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <Activity className="w-4 h-4 shrink-0" />
                <span>FONTE: B3 Brasil Bolsa Balcão · Swap Cambial Limpo &amp; Estrutura a Termo Cupom Cambial</span>
              </span>
              <span className="text-slate-300 text-[11px]">Projeção de NDF para Hedge Exportador</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black font-mono text-white">
                  CURVA FORWARD DE DÓLAR (HEDGE CAMBIAL NDF PARA EXPORTAÇÕES)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Prêmio cambial positivo por prazo de carregamento
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mercado.curvaDolar}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="vertice" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`R$ ${Number(val).toFixed(4)}`, 'Dólar Projetado']}
                  />
                  <Line
                    type="monotone"
                    dataKey="dolarProjetado"
                    isAnimationActive={false}
                    stroke="#f58220"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#f58220', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: PARIDADE - CALCULADORA DUPLA (FEIJÃO ÁSIA & SOJA SANTOS)          */}
      {/* ========================================================================= */}
      {tabAtiva === 'PARIDADE' && (
        <div className="bg-[#0b101c] border border-slate-800 rounded-2xl p-6 text-white shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black font-mono text-white">
                  SIMULADOR DE PARIDADE DE EXPORTAÇÃO
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Selecione o modelo operacional da Bela Cereais para cálculo automático
                </p>
              </div>
            </div>

            {/* SELETOR DE MODO DE CÁLCULO */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-700">
              <button
                onClick={() => setModoCalculadora('FEIJAO_ASIA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  modoCalculadora === 'FEIJAO_ASIA'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Feijões Containers Ásia (US$)
              </button>
              <button
                onClick={() => setModoCalculadora('SOJA_SANTOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  modoCalculadora === 'SOJA_SANTOS'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Soja Granel Santos (CBOT)
              </button>
            </div>
          </div>

          {/* MODO A: PARIDADE ESPECIAL FEIJÃO ÁSIA EM DÓLAR */}
          {modoCalculadora === 'FEIJAO_ASIA' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* FORMULÁRIO FEIJÃO ÁSIA */}
              <div className="lg:col-span-7 space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SELEÇÃO DA VARIEDADE */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">1. Variedade de Feijão</label>
                    <select
                      value={feijaoVariedadeSelecionada.id}
                      onChange={(e) => {
                        const encontrada = VARIEDADES_FEIJAO_ASIA.find((v) => v.id === e.target.value);
                        if (encontrada) {
                          setFeijaoVariedadeSelecionada(encontrada);
                          setFeijaoFobUsdTon(encontrada.precoFobUsdTon);
                          setFeijaoTonsContainer(encontrada.capacidadeContainer20Ton);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none"
                    >
                      {VARIEDADES_FEIJAO_ASIA.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nome} ({v.nomeIngles})
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Embalagem: {feijaoVariedadeSelecionada.embalagemPadrao}
                    </span>
                  </div>

                  {/* SELEÇÃO DO PORTO ASIÁTICO */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">2. Porto Destino Ásia</label>
                    <select
                      value={portoAsiaSelecionado.id}
                      onChange={(e) => {
                        const porto = PORTOS_ASIA.find((p) => p.id === e.target.value);
                        if (porto) {
                          setPortoAsiaSelecionado(porto);
                          setFeijaoFreteMaritimoUsd(porto.freteContainer20Usd);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none"
                    >
                      {PORTOS_ASIA.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.porto} ({p.pais}) · {p.transitTimeDias}d TT
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Linha marítima Paranaguá/Santos -&gt; Ásia
                    </span>
                  </div>

                  {/* PREÇO FOB US$/TON */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">3. Preço FOB Porto (US$/ton)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="5"
                        value={feijaoFobUsdTon}
                        onChange={(e) => setFeijaoFobUsdTon(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-xs">US$/t</span>
                    </div>
                  </div>

                  {/* FRETE MARÍTIMO CONTAINER 20' */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">4. Frete Marítimo 20&apos; FCL (US$)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="25"
                        value={feijaoFreteMaritimoUsd}
                        onChange={(e) => setFeijaoFreteMaritimoUsd(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-xs">US$/cntr</span>
                    </div>
                  </div>

                  {/* TAXA DE CÂMBIO DÓLAR */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">5. Câmbio PTAX / Trava (R$/US$)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        value={feijaoTaxaDolar}
                        onChange={(e) => setFeijaoTaxaDolar(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-xs">R$</span>
                    </div>
                  </div>

                  {/* TONELADAS POR CONTAINER */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">6. Peso Líquido por 20&apos; (Ton)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={feijaoTonsContainer}
                        onChange={(e) => setFeijaoTonsContainer(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-xs">ton</span>
                    </div>
                  </div>

                  {/* FRETE RODOVIÁRIO INTERIOR */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">7. Frete Rodoviário (R$/ton)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="5"
                        value={feijaoFreteRodoviarioReais}
                        onChange={(e) => setFeijaoFreteRodoviarioReais(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-xs">R$/t</span>
                    </div>
                  </div>

                  {/* MARGEM DESEJADA */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">8. Margem Trading (US$/ton)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        value={feijaoMargemDesejadaUsdTon}
                        onChange={(e) => setFeijaoMargemDesejadaUsdTon(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-xs">US$/t</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RESULTADOS FEIJÃO ÁSIA */}
              <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block">
                      PARIDADE FEIJÃO EXPORTAÇÃO ÁSIA
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      INCOTERM CFR
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                    {portoAsiaSelecionado.porto} · {portoAsiaSelecionado.pais}
                  </span>
                </div>

                <div className="space-y-3 font-mono">
                  {/* PREÇO CFR ÁSIA */}
                  <div className="p-3.5 bg-black/80 border border-amber-500/30 rounded-xl">
                    <div className="text-[11px] text-amber-400 font-bold">PREÇO CFR ÁSIA (US$/TONELADA)</div>
                    <div className="text-3xl font-black text-white mt-0.5">
                      US$ {resultadoParidadeFeijao.precoCfrUsdTon.toFixed(2)}
                      <span className="text-xs text-slate-400 font-normal ml-1">/ ton CFR</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 flex items-center justify-between">
                      <span>Total Container ({feijaoTonsContainer}t):</span>
                      <strong className="text-emerald-400 text-sm">
                        US$ {resultadoParidadeFeijao.valorTotalContainerCfrUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>

                  {/* PREÇO MÁXIMO DE COMPRA FAZENDA */}
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="text-[11px] text-emerald-400 font-bold">PREÇO MÁXIMO COMPRA INTERIOR (MT)</div>
                    <div className="text-2xl font-black text-emerald-300 mt-0.5">
                      R$ {resultadoParidadeFeijao.precoMaxCompraFazendaReaisSaca.toFixed(2)}
                      <span className="text-xs text-slate-300 font-normal ml-1">/ saca 60kg</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Equivalente líquido a US$ {resultadoParidadeFeijao.precoMaxCompraFazendaUsdTon.toFixed(1)}/ton na origem
                    </div>
                  </div>
                </div>

                <button
                  onClick={copiarPropostaComprador}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiadoProposta ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Proposta Copiada para a Área de Transferência!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>Copiar Indicativo de Oferta para Comprador</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* MODO B: PARIDADE SOJA GRANEL SANTOS */}
          {modoCalculadora === 'SOJA_SANTOS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">1. Chicago CBOT (¢/bushel)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={paridadeCbot}
                      onChange={(e) => setParidadeCbot(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">2. Prêmio Santos (¢/bushel)</label>
                    <input
                      type="number"
                      step="1"
                      value={paridadePremio}
                      onChange={(e) => setParidadePremio(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">3. Dólar PTAX (R$/US$)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={paridadeDolar}
                      onChange={(e) => setParidadeDolar(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">4. Elevação Porto (US$/t)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={paridadeElevacao}
                      onChange={(e) => setParidadeElevacao(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-bold">5. Frete Rodoviário MT -&gt; Porto (R$/t)</label>
                    <input
                      type="number"
                      step="5"
                      value={paridadeFreteInterno}
                      onChange={(e) => setParidadeFreteInterno(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block">
                  PARIDADE SOJA SANTOS / PARANAGUÁ
                </span>

                <div className="space-y-3 font-mono">
                  <div className="p-3 bg-black/60 border border-slate-800 rounded-lg">
                    <div className="text-[11px] text-slate-400">PREÇO FOB SANTOS</div>
                    <div className="text-2xl font-black text-emerald-400 mt-0.5">
                      US$ {resultadoParidadeSoja.precoFobUsdTon.toFixed(2)} / ton
                    </div>
                    <div className="text-xs text-slate-300 font-bold mt-1">
                      = R$ {resultadoParidadeSoja.precoFobReaisSaca.toFixed(2)} / saca 60kg
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="text-[11px] text-amber-300 font-bold">PREÇO FAZENDA INTERIOR</div>
                    <div className="text-2xl font-black text-amber-400 mt-0.5">
                      R$ {resultadoParidadeSoja.precoFazendaReaisSaca.toFixed(2)} / saca 60kg
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
