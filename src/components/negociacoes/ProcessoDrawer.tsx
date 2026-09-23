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
        className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* HEADER DO DRAWER */}
          <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-extrabold tracking-wider text-gray-500">
                  Resumo Operacional
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-gray-200 text-gray-700">
                  {STATUS_NEGOCIACAO_MAP[processo.status] || processo.status}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                {processo.numeroProcesso}
              </h2>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">
                {processo.clienteFinal}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CORPO ROLÁVEL COM INFORMAÇÕES RESUMIDAS */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            
            {/* CARD 1: RESUMO DO CONTRATO E MERCADORIA */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
                <span>Mercadoria & Volume</span>
                <span className="text-gray-900">{processo.incoterm || 'FOB'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-gray-500 block">Produto</span>
                  <strong className="text-gray-900">{processo.produto}</strong>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Volume Total</span>
                  <strong className="text-gray-900">
                    {volTon.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t
                  </strong>
                  <span className="text-[11px] text-gray-500 block">
                    ({processo.volumeKg.toLocaleString('pt-BR')} kg)
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Origem</span>
                  <span className="text-gray-700 font-medium">{processo.portoOrigem || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Destino</span>
                  <span className="text-gray-700 font-medium">{processo.portoDestino}</span>
                </div>
              </div>
            </div>

            {/* CARD 2: MINI DRE & CÂMBIO */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Resultado Financeiro & Margem</span>
                </span>
                <Link
                  href={`/negociacoes/${processo.id}/financeiro`}
                  className="text-xs font-semibold text-secondary hover:underline flex items-center gap-0.5"
                >
                  <span>DRE Completo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-gray-50">
                  <span className="text-[11px] text-gray-500 block">Receita Bruta (BRL)</span>
                  <strong className="text-sm font-extrabold text-gray-900">
                    {formatBRL(processo.receitaBrutaBRL)}
                  </strong>
                  <span className="text-[10px] text-gray-400 block">
                    {formatUSD(processo.valorTotalUsd)}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg ${processo.resultadoOperacionalBRL >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                  <span className="text-[11px] block opacity-80">Lucro Líquido (DRE)</span>
                  <strong className="text-sm font-extrabold block">
                    {formatBRL(processo.resultadoOperacionalBRL)}
                  </strong>
                  <span className="text-[10px] font-bold block">
                    Margem: {processo.margemLucro.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Status Cambial */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {cambiotravado ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="font-semibold text-gray-700">
                    {cambiotravado ? 'Câmbio 100% Travado' : `${formatUSD(processo.saldoUsdParaTravar)} aberto`}
                  </span>
                </div>
                <span className="text-gray-500 text-[11px]">
                  PTAX média: R$ {processo.ptaxMedia > 0 ? processo.ptaxMedia.toFixed(4) : '-'}
                </span>
              </div>
            </div>

            {/* CARD 3: LOGÍSTICA & CONTÊINERES */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Ship className="w-4 h-4 text-blue-600" />
                  <span>Logística Marítima</span>
                </span>
                <Link
                  href={`/negociacoes/${processo.id}/containers`}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  <span>Contêineres</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Armador:</span>
                  <strong className="text-gray-800">{processo.armador || 'A definir'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Navio:</span>
                  <strong className="text-gray-800">{processo.navio || 'A definir'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Booking:</span>
                  <strong className="text-gray-800">{processo.bookingNumero || 'Pendente'}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Contêineres Preenchidos:</span>
                  <strong className="text-gray-800">
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
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                Documentos & Ações Rápidas
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/etiquetas/${processo.id}`}
                  target="_blank"
                  className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-500" />
                  <span>Etiquetas de Sacaria</span>
                </Link>

                <Link
                  href={`/instrucao-embarque/${processo.id}`}
                  target="_blank"
                  className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  <span>Instrução de Embarque</span>
                </Link>
              </div>
            </div>
          </div>

          {/* FOOTER FIXO COM AÇÃO PRINCIPAL */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Fechar
            </button>

            <Link
              href={`/negociacoes/${processo.id}`}
              className="flex-1 text-center py-2.5 px-4 bg-secondary hover:bg-[#e0751b] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
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
