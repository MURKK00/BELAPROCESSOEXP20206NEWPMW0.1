'use client';

import { Clock, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { formatDateBR } from '@/lib/formatters';

interface DeadlinesTripleCardProps {
  draftBl?: string | Date | null;
  draftVgm?: string | Date | null;
  draftCarga?: string | Date | null;
  deadlineEmbarqueFallback?: string | Date | null;
  onEditClick?: () => void;
  status?: string;
}

interface DeadlineItemCalculated {
  id: string;
  titulo: string;
  subtitulo: string;
  data: string | Date | null;
  diffHours: number | null;
  status: 'CUMPRIDO' | 'VENCIDO' | 'CRITICO' | 'ATENCAO' | 'NORMAL' | 'PENDENTE' | 'CANCELADO';
}

function calcularStatusDeadline(
  data?: string | Date | null,
  statusProcesso?: string
): {
  diffHours: number | null;
  status: 'CUMPRIDO' | 'VENCIDO' | 'CRITICO' | 'ATENCAO' | 'NORMAL' | 'PENDENTE' | 'CANCELADO';
} {
  const isCumprido =
    statusProcesso === 'EMBARCADO' || statusProcesso === 'FINALIZADO' || statusProcesso === 'CONCLUIDO';
  if (isCumprido) {
    return { diffHours: null, status: 'CUMPRIDO' };
  }

  if (statusProcesso === 'CANCELADO' || statusProcesso === 'CANCELADA') {
    return { diffHours: null, status: 'CANCELADO' };
  }

  if (!data) {
    return { diffHours: null, status: 'PENDENTE' };
  }

  const diffMs = new Date(data).getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  const isEmExecucaoOuNegociacao =
    statusProcesso === 'EM_NEGOCIACAO' || statusProcesso === 'EM_EXECUCAO';

  if (diffHours < 0) {
    // Marca atrasado apenas quando o status estiver em negociação ou em execução
    if (isEmExecucaoOuNegociacao) {
      return { diffHours, status: 'VENCIDO' };
    }
    // Fora disso, não precisa marcar que está atrasado
    return { diffHours, status: 'PENDENTE' };
  } else if (diffHours <= 24) {
    return { diffHours, status: 'CRITICO' };
  } else if (diffHours <= 72) {
    return { diffHours, status: 'ATENCAO' };
  } else {
    return { diffHours, status: 'NORMAL' };
  }
}

export function DeadlinesTripleCard({
  draftBl,
  draftVgm,
  draftCarga,
  deadlineEmbarqueFallback,
  onEditClick,
  status,
}: DeadlinesTripleCardProps) {
  const dataCarga = draftCarga || deadlineEmbarqueFallback;

  const items: DeadlineItemCalculated[] = [
    {
      id: 'draft-bl',
      titulo: '1. Draft BL',
      subtitulo: 'Minuta do BL p/ Armador',
      data: draftBl || null,
      ...calcularStatusDeadline(draftBl, status),
    },
    {
      id: 'draft-vgm',
      titulo: '2. Draft VGM',
      subtitulo: 'Peso Bruto Verificado (SOLAS)',
      data: draftVgm || null,
      ...calcularStatusDeadline(draftVgm, status),
    },
    {
      id: 'draft-carga',
      titulo: '3. Draft Carga',
      subtitulo: 'Gate Terminal / REDEX',
      data: dataCarga || null,
      ...calcularStatusDeadline(dataCarga, status),
    },
  ];

  const isEmbarcadoOuFinalizado =
    status === 'EMBARCADO' || status === 'FINALIZADO' || status === 'CONCLUIDO';
  const temVencido = items.some((i) => i.status === 'VENCIDO');
  const temCritico = items.some((i) => i.status === 'CRITICO');

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs transition-colors">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Tríade de Deadlines do Navio
          </h3>
          {isEmbarcadoOuFinalizado ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Prazo Cumprido (OK)
            </span>
          ) : temVencido ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 animate-pulse">
              🚨 Prazo Expirado (Atrasado)
            </span>
          ) : temCritico ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse">
              ⚠️ Alerta 24h
            </span>
          ) : null}
        </div>

        {onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            className="text-xs font-bold text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:underline cursor-pointer"
          >
            Editar prazos
          </button>
        )}
      </div>

      {/* OS 3 DEADLINES COM CONTAGEM REGRESSIVA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((item) => {
          let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
          let textoContagem = 'Não informado';

          if (item.status === 'CUMPRIDO') {
            badgeColor = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold';
            textoContagem = 'Prazo cumprido (OK)';
          } else if (item.status === 'CANCELADO') {
            badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            textoContagem = 'Cancelado';
          } else if (item.status === 'VENCIDO') {
            badgeColor = 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 font-black';
            textoContagem = `Atrasado há ${Math.abs(item.diffHours || 0)}h`;
          } else if (item.status === 'CRITICO') {
            badgeColor = 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/40 font-extrabold';
            textoContagem = `Faltam ${item.diffHours}h (Urgente!)`;
          } else if (item.status === 'ATENCAO') {
            badgeColor = 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold';
            const dias = Math.floor((item.diffHours || 0) / 24);
            const horas = (item.diffHours || 0) % 24;
            textoContagem = `Faltam ${dias > 0 ? `${dias}d ` : ''}${horas}h`;
          } else if (item.status === 'NORMAL') {
            badgeColor = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold';
            const dias = Math.floor((item.diffHours || 0) / 24);
            textoContagem = `Faltam ${dias} dias`;
          } else if (item.status === 'PENDENTE') {
            badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            textoContagem = item.data ? 'Programado' : 'Não informado';
          }

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                item.status === 'CUMPRIDO'
                  ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20'
                  : item.status === 'CRITICO' || item.status === 'VENCIDO'
                  ? 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20'
                  : item.status === 'ATENCAO'
                  ? 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white">{item.titulo}</span>
                  {item.status === 'CUMPRIDO' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : item.status === 'VENCIDO' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  ) : item.status === 'CRITICO' || item.status === 'ATENCAO' ? (
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">
                  {item.subtitulo}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Data Limite</div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {formatDateBR(item.data)}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${badgeColor}`}
                >
                  {textoContagem}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
