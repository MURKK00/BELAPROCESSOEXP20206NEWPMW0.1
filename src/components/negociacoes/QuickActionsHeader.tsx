'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Ship, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  DollarSign, 
  Container, 
  Printer, 
  ChevronRight,
  ExternalLink,
  Edit3,
  MessageSquare
} from 'lucide-react';
import { formatDateBR, STATUS_NEGOCIACAO_MAP } from '@/lib/formatters';
import { StatusSelect } from '@/components/negociacoes/StatusSelect';

interface QuickActionsHeaderProps {
  processo: {
    id: string;
    numeroProcesso: string;
    clienteFinal: string;
    produto: string;
    incoterm?: string | null;
    portoOrigem?: string | null;
    portoDestino: string;
    status: string;
    bookingNumero?: string | null;
    navio?: string | null;
    deadlineEmbarque?: string | Date | null;
    deadlineDraftBl?: string | Date | null;
    deadlineDraftVgm?: string | Date | null;
    deadlineCarga?: string | Date | null;
    estufagemInicio?: string | Date | null;
    estufagemFim?: string | Date | null;
  };
  totalEtapas: number;
  etapasConcluidas: number;
}

// 5 Grandes Marcos do Ciclo de Exportação
const MARCOS_EXPORTACAO = [
  { chave: 'CONTRATO', label: '1. Contrato' },
  { chave: 'BOOKING', label: '2. Booking & Industrialização' },
  { chave: 'ESTUFAGEM', label: '3. Estufagem' },
  { chave: 'EMBARQUE', label: '4. Embarque' },
  { chave: 'CAMBIO', label: '5. Documentação & Câmbio' },
];

export function QuickActionsHeader({ processo, totalEtapas, etapasConcluidas }: QuickActionsHeaderProps) {
  const router = useRouter();

  // Avaliar o próximo deadline mais urgente entre a Tríade (Draft BL, Draft VGM, Draft Carga)
  const deadlinesArr = [
    { label: 'Draft BL', data: processo.deadlineDraftBl },
    { label: 'Draft VGM', data: processo.deadlineDraftVgm },
    { label: 'Draft Carga', data: processo.deadlineCarga || processo.deadlineEmbarque },
  ]
    .filter((d) => Boolean(d.data))
    .map((d) => {
      const diffMs = new Date(d.data!).getTime() - Date.now();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      return { ...d, diffHours };
    })
    .sort((a, b) => a.diffHours - b.diffHours);

  const maisUrgente = deadlinesArr[0] ?? null;
  const deadlineCritico = maisUrgente && maisUrgente.diffHours <= 24 && maisUrgente.diffHours >= 0;
  const deadlineVencido = maisUrgente && maisUrgente.diffHours < 0;

  const isEmbarcadoOuFinalizado =
    processo.status === 'EMBARCADO' || processo.status === 'FINALIZADO' || processo.status === 'CONCLUIDO';
  const isEmExecucaoOuNegociacao =
    processo.status === 'EM_NEGOCIACAO' || processo.status === 'EM_EXECUCAO';

  const progressoPercent = totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;

  // Inferência do marco ativo baseado no status
  let marcoAtivoIndex = 0;
  if (processo.status === 'EM_NEGOCIACAO' || processo.status === 'PENDENTE') {
    marcoAtivoIndex = 0;
  } else if (!processo.bookingNumero) {
    marcoAtivoIndex = 1;
  } else if (!processo.estufagemFim && processo.status !== 'EMBARCADO' && processo.status !== 'FINALIZADO') {
    marcoAtivoIndex = 2;
  } else if (processo.status === 'EMBARCADO') {
    marcoAtivoIndex = 3;
  } else if (processo.status === 'FINALIZADO') {
    marcoAtivoIndex = 4;
  } else {
    marcoAtivoIndex = 2;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xs p-5 mb-6 space-y-4 transition-colors">
      
      {/* LINHA SUPERIOR: TÍTULO, STATUS E AÇÃO PRIMÁRIA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">
              Processo de Exportação
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {processo.produto} ({processo.incoterm || 'FOB'} → {processo.portoDestino})
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {processo.numeroProcesso}
            </h1>
            <span className="text-lg text-slate-300 dark:text-slate-700 font-normal">·</span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {processo.clienteFinal}
            </span>
          </div>
        </div>

        {/* DESTAQUE E CONTROLE DO STATUS DA NEGOCIAÇÃO */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <div className="bg-slate-50 dark:bg-slate-850 p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1">
              Status da Negociação
            </span>
            <StatusSelect processoId={processo.id} status={processo.status} />
          </div>

          <Link
            href="/negociacoes"
            className="px-3.5 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs self-center"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      {/* LINHA DO MEIO: MINI TIMELINE DE MARCOS OPERACIONAIS */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {MARCOS_EXPORTACAO.map((m, idx) => {
            const isCompleted = idx < marcoAtivoIndex;
            const isCurrent = idx === marcoAtivoIndex;

            return (
              <div
                key={m.chave}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-all ${
                  isCurrent
                    ? 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-400 font-extrabold shadow-2xs'
                    : isCompleted
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-medium'
                }`}
              >
                <span className="truncate">{m.label}</span>
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0 ml-1" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0 ml-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* LINHA INFERIOR: MINI BARRA DE DADOS LOGÍSTICOS & ALERTA DE DEADLINE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 dark:text-slate-500">Navio:</span>
            <strong className="text-slate-800 dark:text-slate-200">{processo.navio || 'Não informado'}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">Booking:</span>
            <strong className="text-slate-800 dark:text-slate-200">{processo.bookingNumero || 'Pendente'}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 dark:text-slate-500">Checklist:</span>
            <strong className="text-slate-800 dark:text-slate-200">
              {etapasConcluidas}/{totalEtapas} ({progressoPercent}%)
            </strong>
          </div>
        </div>

        {/* INDICADOR DO PRÓXIMO DEADLINE MAIS URGENTE */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 dark:text-slate-500">
            {maisUrgente ? `Próximo Deadline (${maisUrgente.label}):` : 'Deadline de Carga:'}
          </span>
          <strong className="text-slate-900 dark:text-white font-black">
            {formatDateBR(maisUrgente ? maisUrgente.data : processo.deadlineEmbarque)}
          </strong>

          {isEmbarcadoOuFinalizado ? (
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-black text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Prazo cumprido (OK)
            </span>
          ) : isEmExecucaoOuNegociacao && deadlineVencido && maisUrgente ? (
            <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-black text-[10px] flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> ATRASADO
            </span>
          ) : isEmExecucaoOuNegociacao && deadlineCritico && maisUrgente ? (
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-black text-[10px] flex items-center gap-1 animate-pulse">
              <Clock className="w-3 h-3" /> Faltam {maisUrgente.diffHours}h
            </span>
          ) : null}
        </div>
      </div>

    </div>
  );
}
