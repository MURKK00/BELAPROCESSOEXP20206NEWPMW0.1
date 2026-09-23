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
  Edit3
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
  { chave: 'BOOKING', label: '2. Booking' },
  { chave: 'ESTUFAGEM', label: '3. Estufagem' },
  { chave: 'EMBARQUE', label: '4. Embarque' },
  { chave: 'CAMBIO', label: '5. Câmbio/Doc' },
];

export function QuickActionsHeader({ processo, totalEtapas, etapasConcluidas }: QuickActionsHeaderProps) {
  const router = useRouter();

  // Avaliar o próximo deadline mais urgente entre a Tríade (Draft BL, Draft VGM, Draft Carga)
  const deadlinesArr = [
    { label: 'Draft BL', data: processo.deadlineDraftBl },
    { label: 'Draft VGM', data: processo.deadlineDraftVgm },
    { label: 'Draft Carga', data: processo.deadlineCarga || processo.deadlineEmbarque },
  ].filter((d) => Boolean(d.data));

  let maisUrgente: { label: string; data: Date | string; diffHours: number } | null = null;
  for (const d of deadlinesArr) {
    const diff = (new Date(d.data!).getTime() - Date.now()) / (1000 * 3600);
    const diffHours = Math.round(diff);
    if (!maisUrgente || diffHours < maisUrgente.diffHours) {
      maisUrgente = { label: d.label, data: d.data!, diffHours };
    }
  }

  const deadlineVencido = maisUrgente ? maisUrgente.diffHours < 0 : false;
  const deadlineCritico = maisUrgente ? maisUrgente.diffHours >= 0 && maisUrgente.diffHours <= 48 : false;

  // Progresso em %
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
    <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs p-5 mb-6 space-y-4">
      
      {/* LINHA SUPERIOR: TÍTULO, STATUS E AÇÃO PRIMÁRIA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">
              Processo de Exportação
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-semibold text-gray-600">
              {processo.produto} ({processo.incoterm || 'FOB'} → {processo.portoDestino})
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {processo.numeroProcesso}
            </h1>
            <span className="text-lg text-gray-400 font-normal">·</span>
            <span className="text-lg font-bold text-gray-700">
              {processo.clienteFinal}
            </span>
          </div>
        </div>

        {/* CONTROLES RÁPIDOS & STATUS */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <StatusSelect processoId={processo.id} status={processo.status} />

          {/* ATALHOS DIRETOS EM FORMATO DE BOTÕES COMPACTOS */}
          <Link
            href={`/instrucao-embarque/${processo.id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition-colors"
            title="Abrir Instrução de Embarque oficial para impressão"
          >
            <FileText className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">Instrução</span>
          </Link>

          <Link
            href={`/etiquetas/${processo.id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition-colors"
            title="Gerar etiquetas de sacaria"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">Etiquetas</span>
          </Link>

          <Link
            href="/negociacoes"
            className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold transition-colors"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      {/* LINHA DO MEIO: MINI TIMELINE DE MARCOS OPERACIONAIS */}
      <div className="pt-3 border-t border-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {MARCOS_EXPORTACAO.map((m, idx) => {
            const isCompleted = idx < marcoAtivoIndex;
            const isCurrent = idx === marcoAtivoIndex;

            return (
              <div
                key={m.chave}
                className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  isCurrent
                    ? 'bg-secondary/10 border-secondary/30 text-secondary font-extrabold shadow-2xs'
                    : isCompleted
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-semibold'
                    : 'bg-gray-50/80 border-gray-200 text-gray-400 font-medium'
                }`}
              >
                <span className="truncate">{m.label}</span>
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shrink-0 ml-1" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 ml-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* LINHA INFERIOR: MINI BARRA DE DADOS LOGÍSTICOS & ALERTA DE DEADLINE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-gray-600 bg-gray-50/60 p-3 rounded-xl border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Navio:</span>
            <strong className="text-gray-800">{processo.navio || 'Não informado'}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Booking:</span>
            <strong className="text-gray-800">{processo.bookingNumero || 'Pendente'}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Checklist:</span>
            <strong className="text-gray-800">
              {etapasConcluidas}/{totalEtapas} ({progressoPercent}%)
            </strong>
          </div>
        </div>

        {/* INDICADOR DO PRÓXIMO DEADLINE MAIS URGENTE */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">
            {maisUrgente ? `Próximo Deadline (${maisUrgente.label}):` : 'Deadline de Carga:'}
          </span>
          <strong className="text-gray-900 font-extrabold">
            {formatDateBR(maisUrgente ? maisUrgente.data : processo.deadlineEmbarque)}
          </strong>

          {deadlineVencido && maisUrgente ? (
            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[10px] flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> VENCIDO
            </span>
          ) : deadlineCritico && maisUrgente ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px] flex items-center gap-1 animate-pulse">
              <Clock className="w-3 h-3" /> Faltam {maisUrgente.diffHours}h
            </span>
          ) : null}
        </div>
      </div>

    </div>
  );
}
