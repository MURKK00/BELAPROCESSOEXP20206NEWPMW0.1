'use client';

import { Clock, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { formatDateBR } from '@/lib/formatters';

interface DeadlinesTripleCardProps {
  draftBl?: string | Date | null;
  draftVgm?: string | Date | null;
  draftCarga?: string | Date | null;
  // Fallback se apenas o deadline geral estiver preenchido
  deadlineEmbarqueFallback?: string | Date | null;
  onEditClick?: () => void;
}

interface DeadlineItemCalculated {
  id: string;
  titulo: string;
  subtitulo: string;
  data: string | Date | null;
  diffHours: number | null;
  status: 'VENCIDO' | 'CRITICO' | 'ATENCAO' | 'NORMAL' | 'PENDENTE';
}

function calcularStatusDeadline(data?: string | Date | null): {
  diffHours: number | null;
  status: 'VENCIDO' | 'CRITICO' | 'ATENCAO' | 'NORMAL' | 'PENDENTE';
} {
  if (!data) {
    return { diffHours: null, status: 'PENDENTE' };
  }

  const diffMs = new Date(data).getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours < 0) {
    return { diffHours, status: 'VENCIDO' };
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
}: DeadlinesTripleCardProps) {
  // Se draftCarga não existir mas deadlineEmbarqueFallback existir, usamos como carga
  const dataCarga = draftCarga || deadlineEmbarqueFallback;

  const items: DeadlineItemCalculated[] = [
    {
      id: 'draft-bl',
      titulo: '1. Draft BL',
      subtitulo: 'Minuta do BL p/ Armador',
      data: draftBl || null,
      ...calcularStatusDeadline(draftBl),
    },
    {
      id: 'draft-vgm',
      titulo: '2. Draft VGM',
      subtitulo: 'Peso Bruto Verificado (SOLAS)',
      data: draftVgm || null,
      ...calcularStatusDeadline(draftVgm),
    },
    {
      id: 'draft-carga',
      titulo: '3. Draft Carga',
      subtitulo: 'Gate Terminal / REDEX',
      data: dataCarga || null,
      ...calcularStatusDeadline(dataCarga),
    },
  ];

  // Identificar se algum é crítico ou vencido
  const temVencido = items.some((i) => i.status === 'VENCIDO');
  const temCritico = items.some((i) => i.status === 'CRITICO');

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Tríade de Deadlines do Navio
          </h3>
          {temVencido ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 animate-pulse">
              🚨 Prazo Expirado
            </span>
          ) : temCritico ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 animate-pulse">
              ⚠️ Alerta 24h
            </span>
          ) : null}
        </div>

        {onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            className="text-xs font-semibold text-secondary hover:underline cursor-pointer"
          >
            Editar prazos
          </button>
        )}
      </div>

      {/* OS 3 DEADLINES COM CONTAGEM REGRESSIVA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((item) => {
          let badgeColor = 'bg-gray-100 text-gray-600 border-gray-200';
          let textoContagem = 'Não informado';

          if (item.status === 'VENCIDO') {
            badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
            textoContagem = `Vencido há ${Math.abs(item.diffHours || 0)}h`;
          } else if (item.status === 'CRITICO') {
            badgeColor = 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold';
            textoContagem = `Faltam ${item.diffHours}h (Urgente!)`;
          } else if (item.status === 'ATENCAO') {
            badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
            const dias = Math.floor((item.diffHours || 0) / 24);
            const horas = (item.diffHours || 0) % 24;
            textoContagem = `Faltam ${dias > 0 ? `${dias}d ` : ''}${horas}h`;
          } else if (item.status === 'NORMAL') {
            badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            const dias = Math.floor((item.diffHours || 0) / 24);
            textoContagem = `Faltam ${dias} dias`;
          }

          return (
            <div
              key={item.id}
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                item.status === 'CRITICO' || item.status === 'VENCIDO'
                  ? 'border-rose-300 bg-rose-50/30'
                  : item.status === 'ATENCAO'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-gray-200 bg-gray-50/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-900">{item.titulo}</span>
                  {item.status === 'VENCIDO' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  ) : item.status === 'CRITICO' || item.status === 'ATENCAO' ? (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
                <div className="text-[11px] text-gray-500 mb-2 leading-tight">
                  {item.subtitulo}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Data Limite</div>
                  <div className="text-xs font-extrabold text-gray-800">
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
