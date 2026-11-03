'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, 
  ArrowRight, 
  Edit3, 
  Check, 
  X, 
  CheckCircle2, 
  Loader2, 
  Ship, 
  Calendar 
} from 'lucide-react';
import { formatDateBR } from '@/lib/formatters';
import { atualizarResumoTopoAction } from '@/server/actions/blocoActions';

interface DeadlinesPrazosCardProps {
  processoId: string;
  deadlineDraftBl: string | Date | null;
  deadlineDraftVgm: string | Date | null;
  deadlineCarga: string | Date | null;
  deadlineEmbarque: string | Date | null;
  navio?: string | null;
  bookingNumero?: string | null;
  isEmbarcado: boolean;
}

function toInputDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function DeadlinesPrazosCard({
  processoId,
  deadlineDraftBl,
  deadlineDraftVgm,
  deadlineCarga,
  deadlineEmbarque,
  navio,
  bookingNumero,
  isEmbarcado,
}: DeadlinesPrazosCardProps) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Tríade de Deadlines
  const deadlinesArr = [
    { label: 'Draft BL', data: deadlineDraftBl },
    { label: 'Draft VGM', data: deadlineDraftVgm },
    { label: 'Gate Carga', data: deadlineCarga || deadlineEmbarque },
  ]
    .filter((d) => Boolean(d.data))
    .map((d) => {
      const diffMs = new Date(d.data!).getTime() - Date.now();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      return { ...d, diffHours };
    })
    .sort((a, b) => a.diffHours - b.diffHours);

  const maisUrgente = deadlinesArr[0] ?? null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set('processoId', processoId);
      await atualizarResumoTopoAction(formData);
      setEditando(false);
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      {/* Header com Título, Link da Linha do Tempo e Botão de Editar Prazos */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          Deadlines & Prazos Limites da Carga
        </span>

        <div className="flex items-center gap-3">
          <Link
            href={`/negociacoes/${processoId}/checklist`}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Ver Linha do Tempo Completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {!editando && (
            <button
              onClick={() => setEditando(true)}
              title="Alterar datas dos deadlines e limites operacionais"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-orange-500" />
              <span>Editar Prazos</span>
            </button>
          )}
        </div>
      </div>

      {/* CARD PRINCIPAL */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 opacity-90" />

        {editando ? (
          /* MODO DE EDIÇÃO DOS DEADLINES */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Editar Prazos Limites & Identificação
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina as datas limites para minutas, VGM, Gate do terminal e identificação logística.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  disabled={salvando}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar Prazos</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Draft BL */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Deadline Draft BL (Minuta)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">Envio da minuta do BL ao Armador</p>
                <input
                  type="date"
                  name="deadlineDraftBl"
                  defaultValue={toInputDate(deadlineDraftBl)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Draft VGM */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Deadline Draft VGM (SOLAS)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">Peso Bruto Verificado transmitido</p>
                <input
                  type="date"
                  name="deadlineDraftVgm"
                  defaultValue={toInputDate(deadlineDraftVgm)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Gate Porto / Carga */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Gate Porto / Deadline Carga
                </label>
                <p className="text-[11px] text-slate-400 mb-2">Entrada dos contêineres no terminal</p>
                <input
                  type="date"
                  name="deadlineCarga"
                  defaultValue={toInputDate(deadlineCarga || deadlineEmbarque)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Informações adicionais de Booking e Navio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Navio / Embarcação
                </label>
                <input
                  type="text"
                  name="navio"
                  placeholder="Ex: MSC CADIZ / CMA CGM BAHIA"
                  defaultValue={navio || ''}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Número do Booking / Reserva
                </label>
                <input
                  type="text"
                  name="bookingNumero"
                  placeholder="Ex: BK-BR-8921-X"
                  defaultValue={bookingNumero || ''}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </form>
        ) : (
          /* MODO DE VISUALIZAÇÃO */
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Próximo Limite Operacional
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
                  {isEmbarcado ? (
                    <span className="text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-6 h-6 shrink-0" />
                      <span>Carga Embarcada no Navio</span>
                    </span>
                  ) : maisUrgente ? (
                    <span>{maisUrgente.label}: {formatDateBR(maisUrgente.data)}</span>
                  ) : (
                    <span>{formatDateBR(deadlineEmbarque || deadlineCarga)}</span>
                  )}

                  {maisUrgente && !isEmbarcado && (
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      maisUrgente.diffHours < 0
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : maisUrgente.diffHours <= 24
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}>
                      {maisUrgente.diffHours < 0 ? 'Prazo Vencido' : `Faltam ${maisUrgente.diffHours}h`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Ship className="w-3.5 h-3.5 text-blue-500" />
                  Navio: <strong className="text-slate-800 dark:text-slate-200">{navio || 'A definir'}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>
                  Booking: <strong className="text-slate-800 dark:text-slate-200 font-mono">{bookingNumero || 'Pendente'}</strong>
                </span>
              </div>
            </div>

            {/* AS 3 DATAS DEADLINE (DRAFT BL, DRAFT VGM, GATE PORTO) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
              {/* 1. DRAFT BL */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Draft BL
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                    Armador
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">
                  {formatDateBR(deadlineDraftBl)}
                </div>
                <span className="text-[11px] text-slate-400">
                  Minuta do Conhecimento de Embarque
                </span>
              </div>

              {/* 2. DRAFT VGM */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Draft VGM
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                    SOLAS
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">
                  {formatDateBR(deadlineDraftVgm)}
                </div>
                <span className="text-[11px] text-slate-400">
                  Peso Bruto Verificado dos contêineres
                </span>
              </div>

              {/* 3. GATE PORTO / CARGA */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Gate Porto (Carga)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                    Terminal
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">
                  {formatDateBR(deadlineCarga || deadlineEmbarque)}
                </div>
                <span className="text-[11px] text-slate-400">
                  Entrada física dos contêineres no porto
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
