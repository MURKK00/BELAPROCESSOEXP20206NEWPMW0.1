'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Ship, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft,
  Edit3,
  Globe2,
  Layers,
  Printer
} from 'lucide-react';
import { formatDateBR } from '@/lib/formatters';
import { StatusSelect } from '@/components/negociacoes/StatusSelect';
import type { PendenciasCadastrais } from '@/lib/validacaoCadastrosProcesso';

export interface QuickActionsProcessoProps {
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
  pendencias?: PendenciasCadastrais;
}

export interface QuickActionsHeaderProps {
  processo: QuickActionsProcessoProps;
  totalEtapas: number;
  etapasConcluidas: number;
}

// 6 Grandes Marcos do Ciclo de Exportação
const MARCOS_EXPORTACAO = [
  { chave: 'CONTRATO', num: '01', label: 'Contrato Comercial' },
  { chave: 'BOOKING', num: '02', label: 'Booking & Armador' },
  { chave: 'ESTUFAGEM', num: '03', label: 'Estufagem & Gate' },
  { chave: 'EMBARQUE', num: '04', label: 'Embarque Marítimo' },
  { chave: 'CAMBIO', num: '05', label: 'Dossiê & Câmbio' },
  { chave: 'FINALIZADO', num: '06', label: 'Finalizado' },
];

/**
 * 1. TOPO DA PÁGINA: ITENS MARCADOS
 * Breadcrumbs (← Negociações / Nº / Cliente), Título Principal, Incoterm/Rota, Subtítulo, Status da Operação e Ações
 */
export function ProcessoTopHeader({ processo }: { processo: QuickActionsProcessoProps }) {
  const router = useRouter();

  return (
    <header className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm p-5 sm:p-6 mb-4 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        
        {/* Lado Esquerdo: Breadcrumb, Processo, Cliente, Incoterm e Produto */}
        <div className="space-y-2.5">
          {/* Breadcrumb suave */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => router.push('/negociacoes')}
              className="hover:text-slate-900 dark:hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Negociações</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{processo.numeroProcesso}</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-400 truncate max-w-[200px] sm:max-w-none">{processo.clienteFinal}</span>
          </div>

          {/* Título Principal de Alto Impacto */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>{processo.numeroProcesso}</span>
              <span className="text-slate-300 dark:text-slate-700 font-normal">·</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">
                {processo.clienteFinal}
              </span>
            </h1>

            {/* Selo do Incoterm e Rota */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
              <Globe2 className="w-3.5 h-3.5 text-orange-500" />
              <span>{processo.incoterm || 'FOB'}</span>
              <span className="text-slate-400">→</span>
              <span>{processo.portoDestino}</span>
            </span>
          </div>

          {/* Subtítulo com Produto e Origem */}
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Produto: <strong className="text-slate-700 dark:text-slate-300">{processo.produto}</strong>
            {processo.portoOrigem && (
              <>
                <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                Porto de Origem: <strong className="text-slate-700 dark:text-slate-300">{processo.portoOrigem}</strong>
              </>
            )}
          </p>
        </div>

        {/* Lado Direito: Status da Operação e Prévia de Contrato (PDF) Alinhados & Justificados */}
        <div className="flex items-center gap-3 self-stretch lg:self-center shrink-0 justify-end">
          {/* Card de Status da Operação */}
          <div className="bg-slate-50 dark:bg-slate-850 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-750 shadow-xs flex flex-col justify-center gap-1 shrink-0 whitespace-nowrap min-w-[200px]">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-0.5 whitespace-nowrap">
              Status da Operação
            </span>
            <StatusSelect 
              processoId={processo.id} 
              status={processo.status} 
              pendencias={processo.pendencias} 
            />
          </div>

          {/* Botão de Prévia do Contrato (PDF / Imprimir) */}
          <Link
            href={`/contrato-preview/${processo.id}`}
            target="_blank"
            className="px-4 py-3.5 h-[58px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] shrink-0 whitespace-nowrap"
            title="Visualizar e Imprimir Prévia do Contrato / Confirmação de Negócio em PDF"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap font-bold">Prévia Contrato (PDF)</span>
          </Link>
        </div>

      </div>
    </header>
  );
}

/**
 * 2. STEPPER DOS 6 MARCOS DO CICLO & RESUMO LOGÍSTICO (Posicionado abaixo das Abas)
 */
export function ProcessoCicloStepper({ processo, totalEtapas, etapasConcluidas }: QuickActionsHeaderProps) {
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
  const isFinalizado = processo.status === 'FINALIZADO' || processo.status === 'CONCLUIDO';
  const isEmExecucaoOuNegociacao =
    processo.status === 'EM_NEGOCIACAO' || processo.status === 'EM_EXECUCAO';

  const progressoPercent = totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;

  // Inferência do marco ativo baseado no status
  let marcoAtivoIndex = 0;
  if (isFinalizado) {
    marcoAtivoIndex = 5;
  } else if (processo.status === 'EMBARCADO') {
    marcoAtivoIndex = 4; // Em Dossiê & Câmbio
  } else if (processo.estufagemFim || processo.deadlineCarga) {
    marcoAtivoIndex = 3; // Em Embarque Marítimo
  } else if (processo.bookingNumero) {
    marcoAtivoIndex = 2; // Em Estufagem & Gate
  } else if (processo.status === 'EM_EXECUCAO') {
    marcoAtivoIndex = 1; // Em Booking
  } else {
    marcoAtivoIndex = 0; // Em Contrato
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm p-4 sm:p-5 mb-6 transition-all">
      {/* LINHA DO STEPPER DOS 6 MARCOS DO CICLO */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Ciclo Operacional & Marcos
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Fase {marcoAtivoIndex + 1} de {MARCOS_EXPORTACAO.length}: <span className="text-orange-500">{MARCOS_EXPORTACAO[marcoAtivoIndex].label}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {MARCOS_EXPORTACAO.map((m, idx) => {
            const isCompleted = idx < marcoAtivoIndex;
            const isCurrent = idx === marcoAtivoIndex;
            const isFinishedCard = m.chave === 'FINALIZADO' && isFinalizado;

            return (
              <div
                key={m.chave}
                className={`relative overflow-hidden rounded-xl p-3 border transition-all flex flex-col justify-between ${
                  isFinishedCard
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : isCurrent
                    ? 'bg-orange-50/70 dark:bg-orange-950/30 border-orange-400/80 dark:border-orange-600/80 shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/70 dark:border-emerald-800/60'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-black ${
                    isFinishedCard 
                      ? 'text-white' 
                      : isCurrent 
                      ? 'text-orange-600 dark:text-orange-400' 
                      : isCompleted 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-slate-400'
                  }`}>
                    {m.num}
                  </span>
                  {isFinishedCard ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                </div>

                <div className={`text-xs font-bold truncate ${
                  isFinishedCard
                    ? 'text-white font-black'
                    : isCurrent 
                    ? 'text-orange-950 dark:text-orange-200' 
                    : isCompleted 
                    ? 'text-slate-800 dark:text-slate-200' 
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {isFinishedCard ? 'Operação Finalizada' : m.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LINHA INFERIOR: RESUMO LOGÍSTICO, DEADLINE & ATALHO PARA LINHA DO TEMPO */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Ship className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-400">Navio:</span>
            <strong className="text-slate-900 dark:text-white font-semibold">{processo.navio || 'A definir'}</strong>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="text-slate-400">Booking:</span>
            <strong className="text-slate-900 dark:text-white font-mono font-semibold">{processo.bookingNumero || 'Pendente'}</strong>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-400">Checklist Geral:</span>
            <strong className="text-slate-900 dark:text-white font-semibold">
              {etapasConcluidas}/{totalEtapas} ({progressoPercent}%)
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-between md:justify-end">
          {/* ALERTA DO PRÓXIMO DEADLINE */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              {maisUrgente ? `Próximo Prazo (${maisUrgente.label}):` : 'Deadline de Carga:'}
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {formatDateBR(maisUrgente ? maisUrgente.data : processo.deadlineEmbarque)}
            </span>

            {isEmbarcadoOuFinalizado ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Embarcado
              </span>
            ) : isEmExecucaoOuNegociacao && deadlineVencido && maisUrgente ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px] flex items-center gap-1 border border-rose-200 dark:border-rose-800 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-600" /> Atrasado
              </span>
            ) : isEmExecucaoOuNegociacao && deadlineCritico && maisUrgente ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                <Clock className="w-3 h-3 text-amber-600" /> Faltam {maisUrgente.diffHours}h
              </span>
            ) : null}
          </div>

          {/* ATALHO NO RODAPÉ PARA ALTERAR CICLO NA LINHA DO TEMPO */}
          <Link
            href={`/negociacoes/${processo.id}/checklist`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 text-[#f58220] hover:text-[#d96e14] dark:text-orange-400 font-bold text-xs border border-orange-200 dark:border-orange-800/80 transition-all shadow-xs cursor-pointer shrink-0"
            title="Ir para a Linha do Tempo e Etapas para alterar o ciclo operacional e marcar tarefas"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Alterar Ciclo na Linha do Tempo &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente combinado original (mantido para compatibilidade)
 */
export function QuickActionsHeader({ processo, totalEtapas, etapasConcluidas }: QuickActionsHeaderProps) {
  return (
    <>
      <ProcessoTopHeader processo={processo} />
      <ProcessoCicloStepper processo={processo} totalEtapas={totalEtapas} etapasConcluidas={etapasConcluidas} />
    </>
  );
}
