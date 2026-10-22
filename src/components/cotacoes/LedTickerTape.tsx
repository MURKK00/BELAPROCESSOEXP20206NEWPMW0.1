"use client";

import React, { useEffect, useState } from 'react';
import { calcularStatusMercados, StatusMercadoGeral } from '@/lib/mercadoStatus';

interface TickerItem {
  id: string;
  ticker: string;
  nome: string;
  precoStr: string;
  unidade: string;
  variacao: number;
  variacaoPct: number;
  subinfo?: string;
}

export function LedTickerTape() {
  const [statusMercado, setStatusMercado] = useState<StatusMercadoGeral>(() => calcularStatusMercados());
  const [items, setItems] = useState<TickerItem[]>([
    {
      id: 'soja',
      ticker: 'SOJA CBOT',
      nome: 'Soja Chicago ZS',
      precoStr: '1.275,00',
      unidade: '¢/bu',
      variacao: 14.5,
      variacaoPct: 1.15,
      subinfo: 'US$ 468,50/t',
    },
    {
      id: 'milho-cbot',
      ticker: 'MILHO CBOT',
      nome: 'Milho Chicago ZC',
      precoStr: '479,75',
      unidade: '¢/bu',
      variacao: -3.0,
      variacaoPct: -0.62,
    },
    {
      id: 'milho-b3',
      ticker: 'MILHO B3',
      nome: 'Milho Futuro B3 (CCM)',
      precoStr: '69,85',
      unidade: 'R$/sc',
      variacao: 0.90,
      variacaoPct: 1.31,
    },
    {
      id: 'farelo',
      ticker: 'FARELO CBOT',
      nome: 'Farelo Soja ZM',
      precoStr: '359,50',
      unidade: 'US$/st',
      variacao: 5.2,
      variacaoPct: 1.47,
    },
    {
      id: 'dolar-spot',
      ticker: 'USD/BRL SPOT',
      nome: 'Dólar Comercial',
      precoStr: '5,0324',
      unidade: 'R$',
      variacao: 0.0474,
      variacaoPct: 0.95,
      subinfo: 'Interbancário',
    },
    {
      id: 'dolar-ptax',
      ticker: 'PTAX BACEN',
      nome: 'Dólar Oficial BACEN',
      precoStr: '5,0441',
      unidade: 'R$',
      variacao: 0.0080,
      variacaoPct: 0.16,
      subinfo: 'Fechamento',
    },
    {
      id: 'euro-spot',
      ticker: 'EUR/BRL SPOT',
      nome: 'Euro Comercial',
      precoStr: '5,5959',
      unidade: 'R$',
      variacao: 0.0342,
      variacaoPct: 0.61,
      subinfo: 'Cross 1,112',
    },
    {
      id: 'curva-180',
      ticker: 'CURVA USD 180D',
      nome: 'Dólar Forward 6M',
      precoStr: '5,2074',
      unidade: 'R$',
      variacao: 0.1750,
      variacaoPct: 3.48,
      subinfo: '+175 pts swap',
    },
    {
      id: 'feijao-mungo-verde',
      ticker: 'MUNGO VERDE',
      nome: 'Green Mung Bean',
      precoStr: '1.150,00',
      unidade: 'US$/t',
      variacao: 25.0,
      variacaoPct: 2.22,
      subinfo: 'Índia / Tailândia',
    },
    {
      id: 'feijao-mungo-preto',
      ticker: 'MUNGO PRETO',
      nome: 'Black Matpe',
      precoStr: '980,00',
      unidade: 'US$/t',
      variacao: 15.0,
      variacaoPct: 1.55,
      subinfo: 'Índia (Nhava Sheva)',
    },
    {
      id: 'feijao-caupi-fradinho',
      ticker: 'CAUPI FRADINHO',
      nome: 'Cowpea / Black Eye',
      precoStr: '890,00',
      unidade: 'US$/t',
      variacao: 15.0,
      variacaoPct: 1.71,
      subinfo: 'Índia / Tailândia',
    },
    {
      id: 'feijao-caupi-vermelho',
      ticker: 'CAUPI VERMELHO',
      nome: 'Red Cowpea',
      precoStr: '920,00',
      unidade: 'US$/t',
      variacao: -5.0,
      variacaoPct: -0.54,
      subinfo: 'Tailândia / Vietnã',
    },
    {
      id: 'feijao-caupi-branco',
      ticker: 'CAUPI BRANCO',
      nome: 'White Cowpea',
      precoStr: '910,00',
      unidade: 'US$/t',
      variacao: 10.0,
      variacaoPct: 1.11,
      subinfo: 'Índia / Tailândia',
    },
    {
      id: 'frete-india-20',
      ticker: "FRETE 20' ÍNDIA",
      nome: 'Ocean Freight Nhava Sheva',
      precoStr: '1.750',
      unidade: 'US$/cntr',
      variacao: -50.0,
      variacaoPct: -2.78,
      subinfo: '36d TT · FBX',
    },
    {
      id: 'frete-tailandia-20',
      ticker: "FRETE 20' TAILÂNDIA",
      nome: 'Ocean Freight Bangkok/Laem Chabang',
      precoStr: '1.720',
      unidade: 'US$/cntr',
      variacao: -30.0,
      variacaoPct: -1.71,
      subinfo: '32d TT · FBX',
    },
  ]);

  const [fonteInfo, setFonteInfo] = useState<string>('CBOT · B3 · BACEN PTAX');
  const [horaAtualizacao, setHoraAtualizacao] = useState<string>('--:--');
  const [carregando, setCarregando] = useState<boolean>(false);
  const [isLiveOfficial, setIsLiveOfficial] = useState<boolean>(true);

  const fetchLiveQuotes = async () => {
    try {
      setCarregando(true);
      const res = await fetch('/api/cotacoes/live');
      if (!res.ok) return;
      const data = await res.json();

      if (data.sucesso) {
        setIsLiveOfficial(true);
        setFonteInfo(data.fonte || 'CBOT · B3 · BACEN');
        if (data.statusMercados) setStatusMercado(data.statusMercados);
        else setStatusMercado(calcularStatusMercados());

        if (data.atualizadoEm) {
          const d = new Date(data.atualizadoEm);
          setHoraAtualizacao(
            d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
        }

        const novosItens: TickerItem[] = [
          {
            id: 'soja',
            ticker: 'SOJA CBOT',
            nome: data.sojaCbot.nome,
            precoStr: data.sojaCbot.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            unidade: '¢/bu',
            variacao: data.sojaCbot.variacao,
            variacaoPct: data.sojaCbot.variacaoPct,
            subinfo: `US$ ${(data.sojaCbot.preco * 0.367437).toFixed(1)}/t`,
          },
          {
            id: 'milho-cbot',
            ticker: 'MILHO CBOT',
            nome: data.milhoCbot.nome,
            precoStr: data.milhoCbot.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            unidade: '¢/bu',
            variacao: data.milhoCbot.variacao,
            variacaoPct: data.milhoCbot.variacaoPct,
          },
          {
            id: 'milho-b3',
            ticker: 'MILHO B3',
            nome: data.milhoB3.nome,
            precoStr: data.milhoB3.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            unidade: 'R$/sc',
            variacao: data.milhoB3.variacao,
            variacaoPct: data.milhoB3.variacaoPct,
          },
          {
            id: 'farelo',
            ticker: 'FARELO CBOT',
            nome: data.fareloCbot.nome,
            precoStr: data.fareloCbot.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            unidade: 'US$/st',
            variacao: data.fareloCbot.variacao,
            variacaoPct: data.fareloCbot.variacaoPct,
          },
          {
            id: 'dolar-spot',
            ticker: 'USD/BRL SPOT',
            nome: 'Dólar Comercial',
            precoStr: data.dolarSpot.preco.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
            unidade: 'R$',
            variacao: data.dolarSpot.variacao,
            variacaoPct: data.dolarSpot.variacaoPct,
            subinfo: 'Mercado Interbancário',
          },
          {
            id: 'dolar-ptax',
            ticker: 'PTAX BACEN',
            nome: 'Dólar Oficial BACEN',
            precoStr: data.dolarPtax.venda.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
            unidade: 'R$',
            variacao: 0.0080,
            variacaoPct: 0.16,
            subinfo: data.dolarPtax.tipo || 'Oficial',
          },
          {
            id: 'euro-spot',
            ticker: 'EUR/BRL SPOT',
            nome: 'Euro Comercial',
            precoStr: data.euroSpot.preco.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
            unidade: 'R$',
            variacao: data.euroSpot.variacao,
            variacaoPct: data.euroSpot.variacaoPct,
            subinfo: 'Spot FX',
          },
          {
            id: 'euro-ptax',
            ticker: 'EUR PTAX BACEN',
            nome: 'Euro Oficial BACEN',
            precoStr: data.euroPtax.venda.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
            unidade: 'R$',
            variacao: 0.0075,
            variacaoPct: 0.13,
            subinfo: 'Oficial',
          },
          {
            id: 'curva-180',
            ticker: 'CURVA USD 180D',
            nome: 'Dólar Forward 6M',
            precoStr: (data.curvaDolar?.[4]?.dolarProjetado ?? (data.dolarSpot.preco + 0.1750)).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
            unidade: 'R$',
            variacao: 0.1750,
            variacaoPct: 3.48,
            subinfo: '+175 pts swap',
          },
          {
            id: 'feijao-mungo-verde',
            ticker: 'MUNGO VERDE',
            nome: 'Green Mung Bean',
            precoStr: '1.150,00',
            unidade: 'US$/t',
            variacao: 25.0,
            variacaoPct: 2.22,
            subinfo: 'Índia / Tailândia',
          },
          {
            id: 'feijao-mungo-preto',
            ticker: 'MUNGO PRETO',
            nome: 'Black Matpe',
            precoStr: '980,00',
            unidade: 'US$/t',
            variacao: 15.0,
            variacaoPct: 1.55,
            subinfo: 'Índia (Nhava Sheva)',
          },
          {
            id: 'feijao-caupi-fradinho',
            ticker: 'CAUPI FRADINHO',
            nome: 'Cowpea / Black Eye',
            precoStr: '890,00',
            unidade: 'US$/t',
            variacao: 15.0,
            variacaoPct: 1.71,
            subinfo: 'Índia / Tailândia',
          },
          {
            id: 'feijao-caupi-vermelho',
            ticker: 'CAUPI VERMELHO',
            nome: 'Red Cowpea',
            precoStr: '920,00',
            unidade: 'US$/t',
            variacao: -5.0,
            variacaoPct: -0.54,
            subinfo: 'Tailândia / Vietnã',
          },
          {
            id: 'feijao-caupi-branco',
            ticker: 'CAUPI BRANCO',
            nome: 'White Cowpea',
            precoStr: '910,00',
            unidade: 'US$/t',
            variacao: 10.0,
            variacaoPct: 1.11,
            subinfo: 'Índia / Tailândia',
          },
          {
            id: 'frete-india-20',
            ticker: "FRETE 20' ÍNDIA",
            nome: 'Ocean Freight Nhava Sheva',
            precoStr: '1.750',
            unidade: 'US$/cntr',
            variacao: -50.0,
            variacaoPct: -2.78,
            subinfo: '36d TT · FBX',
          },
          {
            id: 'frete-tailandia-20',
            ticker: "FRETE 20' TAILÂNDIA",
            nome: 'Ocean Freight Bangkok/Laem Chabang',
            precoStr: '1.720',
            unidade: 'US$/cntr',
            variacao: -30.0,
            variacaoPct: -1.71,
            subinfo: '32d TT · FBX',
          },
        ];

        setItems(novosItens);
      }
    } catch {
      // Mantém itens com fallback visual
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchLiveQuotes();
    // Atualiza cotações a cada 30 segundos
    const interval = setInterval(fetchLiveQuotes, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative overflow-hidden bg-[#070b12] border-y border-slate-800 shadow-inner group">
      {/* Moldura de LED com efeito de painel eletrônico de bolsa */}
      <div className="flex items-center">
        {/* BLOCO FIXO ESQUERDA: COTAÇÕES & STATUS DO MERCADO */}
        <div className="shrink-0 z-20 flex items-center gap-2 bg-[#05080e] px-2.5 sm:px-3 py-2 border-r border-slate-800/90 shadow-md">
          <span className="relative flex h-2 w-2 shrink-0">
            {statusMercado.geralAberto && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusMercado.geralAberto ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="text-[11px] font-black tracking-wider text-emerald-400 font-mono uppercase whitespace-nowrap">
            COTAÇÕES
          </span>
          <span
            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono tracking-wider hidden sm:inline ${
              statusMercado.geralAberto
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}
          >
            {statusMercado.geralAberto ? 'ABERTO' : 'FECHADO'}
          </span>
        </div>

        {/* ESTEIRA HORIZONTAL INFINITA DE LED (OCUPA PRATICAMENTE TODA A LARGURA DA TELA) */}
        <div className="flex-1 overflow-hidden relative py-2">
          {/* Degradê de fade nas bordas para sensação de tela contínua */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-r from-[#070b12] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-l from-[#070b12] to-transparent z-10" />

          <div className="animate-led-marquee flex items-center">
            {/* DUPLICAMOS O ARRAY PARA LOOP CONTÍNUO PERFEITO SEM CORTES */}
            {[...items, ...items].map((item, idx) => {
              const isPositivo = item.variacao >= 0;
              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 font-mono text-xs select-none border-r border-slate-800/50 shrink-0"
                >
                  {/* Ticker / Nome do Ativo */}
                  <span className="font-extrabold text-amber-300 tracking-wider text-[11px] drop-shadow-[0_0_6px_rgba(252,211,77,0.4)] whitespace-nowrap">
                    {item.ticker}
                  </span>

                  {/* Valor Principal com brilho de LED */}
                  <span className="font-bold text-white text-[12px] tracking-tight whitespace-nowrap">
                    {item.precoStr}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      {item.unidade}
                    </span>
                  </span>

                  {/* Variação em LED Verde/Vermelho */}
                  <span
                    className={`text-[11px] font-bold flex items-center gap-0.5 whitespace-nowrap ${
                      isPositivo
                        ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                        : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                    }`}
                  >
                    <span>{isPositivo ? '▲' : '▼'}</span>
                    <span>
                      {isPositivo ? '+' : ''}
                      {item.variacaoPct.toFixed(2)}%
                    </span>
                  </span>

                  {/* Informação adicional de paridade ou mercado */}
                  {item.subinfo && (
                    <span className="text-[10px] text-slate-500 font-sans font-medium bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap hidden sm:inline">
                      {item.subinfo}
                    </span>
                  )}

                  {/* Separador sutil de LED */}
                  <span className="text-slate-700 ml-2">●</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
