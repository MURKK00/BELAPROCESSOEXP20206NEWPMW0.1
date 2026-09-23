"use client";

import { useState } from 'react';
import { Printer, Globe2, Eye, HelpCircle, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EtiquetaControlsProps {
  processoId: string;
  padraoInicial: 'INDIA' | 'INTERNACIONAL_NEUTRO' | 'SEM_LOGOS';
  onMudancaPadrao: (padrao: 'INDIA' | 'INTERNACIONAL_NEUTRO' | 'SEM_LOGOS') => void;
  padraoAtual: 'INDIA' | 'INTERNACIONAL_NEUTRO' | 'SEM_LOGOS';
  exibirLogoEmpresa: boolean;
  onToggleLogoEmpresa: (val: boolean) => void;
}

export function EtiquetaControls({
  processoId,
  padraoAtual,
  onMudancaPadrao,
  exibirLogoEmpresa,
  onToggleLogoEmpresa,
}: EtiquetaControlsProps) {
  return (
    <div className="mb-6 print:hidden w-full max-w-[210mm] mx-auto bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* BARRA SUPERIOR: VOLTAR E IMPRIMIR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <Link
          href={`/negociacoes/${processoId}/documentos`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Documentos</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#1a365d] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-900 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF A4</span>
          </button>
        </div>
      </div>

      {/* SELEÇÃO DO MODELO DE ETIQUETA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* MODELO 1: ÍNDIA */}
        <button
          type="button"
          onClick={() => onMudancaPadrao('INDIA')}
          className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            padraoAtual === 'INDIA'
              ? 'border-secondary bg-amber-50/60 ring-2 ring-secondary/20'
              : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-900">1. Padrão Índia (Obrigatório)</span>
              {padraoAtual === 'INDIA' && <Check className="w-3.5 h-3.5 text-secondary" />}
            </div>
            <p className="text-[11px] text-gray-500 leading-tight">
              Com logos <strong>FSSAI</strong> + <strong>Ponto Verde Veg</strong> (Green Dot). Padrão exigido por lei na Índia.
            </p>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-amber-800 font-semibold">
            <span>🇮🇳 Para portos indianos</span>
          </div>
        </button>

        {/* MODELO 2: INTERNACIONAL COM LOGO BELA CEREAIS */}
        <button
          type="button"
          onClick={() => onMudancaPadrao('INTERNACIONAL_NEUTRO')}
          className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            padraoAtual === 'INTERNACIONAL_NEUTRO'
              ? 'border-secondary bg-blue-50/60 ring-2 ring-secondary/20'
              : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-900">2. Padrão Universal (Global)</span>
              {padraoAtual === 'INTERNACIONAL_NEUTRO' && <Check className="w-3.5 h-3.5 text-secondary" />}
            </div>
            <p className="text-[11px] text-gray-500 leading-tight">
              Sem logos indianos. Exibe o brasão/logo da <strong>Bela Cereais</strong> e layout internacional limpo.
            </p>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-blue-800 font-semibold">
            <span>🌍 Europa, Ásia, Américas</span>
          </div>
        </button>

        {/* MODELO 3: MINIMALISTA / SEM LOGOS */}
        <button
          type="button"
          onClick={() => onMudancaPadrao('SEM_LOGOS')}
          className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            padraoAtual === 'SEM_LOGOS'
              ? 'border-secondary bg-gray-100 ring-2 ring-secondary/20'
              : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-900">3. Neutra / Somente Texto</span>
              {padraoAtual === 'SEM_LOGOS' && <Check className="w-3.5 h-3.5 text-secondary" />}
            </div>
            <p className="text-[11px] text-gray-500 leading-tight">
              100% tipográfica, sem nenhum logotipo gráfico. Para armadores ou clientes com regras estritas.
            </p>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-gray-600 font-semibold">
            <span>🏷️ Neutra genérica</span>
          </div>
        </button>
      </div>

      {/* DICA DE IMPRESSÃO */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1 text-[11px]">
          <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
          Nas opções de impressão do navegador, marque <em>&quot;Gráficos de segundo plano&quot;</em> e desmarque <em>&quot;Cabeçalhos e rodapés&quot;</em>.
        </span>
      </div>
    </div>
  );
}
