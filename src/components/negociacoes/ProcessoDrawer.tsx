'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  ExternalLink, 
  Ship, 
  DollarSign, 
  Container, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Anchor,
  Printer,
  ChevronRight
} from 'lucide-react';
import { formatDateBR, STATUS_NEGOCIACAO_MAP } from '@/lib/formatters';
import { DeadlinesTripleCard } from '@/components/negociacoes/DeadlinesTripleCard';

export interface ProcessoDrawerData {
  id: string;
  numeroProcesso: string;
  clienteFinal: string;
  produto: string;
  volumeKg: number;
  incoterm?: string | null;
  portoOrigem?: string | null;
  portoDestino: string;
  armador?: string | null;
  navio?: string | null;
  bookingNumero?: string | null;
  deadlineEmbarque?: string | Date | null;
  deadlineDraftBl?: string | Date | null;
  deadlineDraftVgm?: string | Date | null;
  deadlineCarga?: string | Date | null;
  dataEstufagem?: string | Date | null;
  redex?: string | null;
  containerQtd?: number | null;
  containerTipo?: string | null;
  status: string;
  // Métricas Financeiras
  valorTotalUsd: number;
  totalUsdTravado: number;
  saldoUsdParaTravar: number;
  ptaxMedia: number;
  receitaBrutaBRL: number;
  totalCustosBRL: number;
  resultadoOperacionalBRL: number;
  margemLucro: number;
  statusRecebimento?: string | null;
  bancoDestino?: string | null;
  // Contêineres
  containersTotal: number;
  containersPreenchidos: number;
}

interface ProcessoDrawerProps {
  processo: ProcessoDrawerData | null;
  onClose: () => void;
}

export function ProcessoDrawer({ processo, onClose }: ProcessoDrawerProps) {
  if (!processo) return null;

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatUSD = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

  const volTon = processo.volumeKg / 1000;
  const cambiotravado = processo.saldoUsdParaTravar <= 0.01;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md md:max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* HEADER DO DRAWER */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  Resumo Operacional
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {STATUS_NEGOCIACAO_MAP[processo.status] || processo.status}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {processo.numeroProcesso}
              </h2>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                {processo.clienteFinal}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CORPO ROLÁVEL COM INFORMAÇÕES RESUMIDAS */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            
            {/* CARD 1: RESUMO DO CONTRATO E MERCADORIA */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                <span>Mercadoria & Volume</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{processo.incoterm || 'FOB'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Produto</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{processo.produto}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Volume Total</span>
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {volTon.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    ({processo.volumeKg.toLocaleString('pt-BR')} kg)
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Origem</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{processo.portoOrigem || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Destino</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{processo.portoDestino}</span>
                </div>
              </div>
            </div>

            {/* CARD 2: MINI DRE & CÂMBIO */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-800/80 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Resultado Financeiro & Margem</span>
                </span>
                <Link
                  href={`/negociacoes/${processo.id}/financeiro`}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-0.5"
                >
                  <span>DRE Completo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Receita Bruta (BRL)</span>
                  <strong className="text-sm font-black text-slate-900 dark:text-white">
                    {formatBRL(processo.receitaBrutaBRL)}
                  </strong>
                  <span className="text-[10px] text-slate-400 block">
                    {formatUSD(processo.valorTotalUsd)}
                  </span>
                </div>

                <div className={`p-3 rounded-xl border ${processo.resultadoOperacionalBRL >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'}`}>
                  <span className="text-[11px] block opacity-80">Lucro Líquido (DRE)</span>
                  <strong className="text-sm font-black block">
                    {formatBRL(processo.resultadoOperacionalBRL)}
                  </strong>
                  <span className="text-[10px] font-bold block">
                    Margem: {processo.margemLucro.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Status Cambial */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {cambiotravado ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {cambiotravado ? 'Câmbio 100% Travado' : `${formatUSD(processo.saldoUsdParaTravar)} aberto`}
                  </span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                  PTAX média: R$ {processo.ptaxMedia > 0 ? processo.ptaxMedia.toFixed(4) : '-'}
                </span>
              </div>
            </div>

            {/* CARD 3: LOGÍSTICA & CONTÊINERES */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-800/80 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                  <Ship className="w-4 h-4 text-blue-500" />
                  <span>Logística Marítima</span>
                </span>
                <Link
                  href={`/negociacoes/${processo.id}/containers`}
                  className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-0.5"
                >
                  <span>Contêineres</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400">Armador:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{processo.armador || 'A definir'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400">Navio:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{processo.navio || 'A definir'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400">Booking:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{processo.bookingNumero || 'Pendente'}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Contêineres Preenchidos:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {processo.containersPreenchidos} de {processo.containerQtd || processo.containersTotal || 0}
                  </strong>
                </div>
              </div>
            </div>

            {/* TRÍADE DE DEADLINES (DRAFT BL, DRAFT VGM, DRAFT CARGA) */}
            <DeadlinesTripleCard
              draftBl={processo.deadlineDraftBl}
              draftVgm={processo.deadlineDraftVgm}
              draftCarga={processo.deadlineCarga}
              deadlineEmbarqueFallback={processo.deadlineEmbarque}
            />

            {/* ATALHOS RÁPIDOS PARA DOCUMENTOS */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Documentos & Ações Rápidas
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/etiquetas/${processo.id}`}
                  target="_blank"
                  className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Etiquetas de Sacaria</span>
                </Link>

                <Link
                  href={`/instrucao-embarque/${processo.id}`}
                  target="_blank"
                  className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Instrução de Embarque</span>
                </Link>
              </div>
            </div>
          </div>

          {/* FOOTER FIXO COM AÇÃO PRINCIPAL */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Fechar
            </button>

            <Link
              href={`/negociacoes/${processo.id}`}
              className="flex-1 text-center py-2.5 px-4 bg-[#f58220] hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Abrir Cockpit Completo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
