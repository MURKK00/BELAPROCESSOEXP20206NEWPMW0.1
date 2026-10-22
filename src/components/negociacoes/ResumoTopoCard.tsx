'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { atualizarResumoTopoAction } from '@/server/actions/blocoActions';
import { formatDateBR } from '@/lib/formatters';
import { DeadlinesTripleCard } from '@/components/negociacoes/DeadlinesTripleCard';
import { Ship, Calendar, Bookmark, Clock, Edit3, ArrowRight, ShieldCheck } from 'lucide-react';

type Props = {
  processoId: string;
  status?: string;
  bookingNumero: string;
  navio: string;
  estufagemInicio: string | null; // ISO
  estufagemFim: string | null; // ISO
  deadlineEmbarque: string | null; // ISO (Geral / fallback)
  deadlineDraftBl?: string | null; // ISO
  deadlineDraftVgm?: string | null; // ISO
  deadlineCarga?: string | null; // ISO
};

function toDateInput(iso: string | null | undefined) {
  return iso ? iso.slice(0, 10) : '';
}

export function ResumoTopoCard(props: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSalvando(true);
    try {
      formData.set('processoId', props.processoId);
      await atualizarResumoTopoAction(formData);
      setEditando(false);
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  let estufagemStr = 'A definir';
  if (props.estufagemInicio && props.estufagemFim) {
    estufagemStr = `${formatDateBR(props.estufagemInicio)} até ${formatDateBR(props.estufagemFim)}`;
  } else if (props.estufagemInicio) {
    estufagemStr = `A partir de ${formatDateBR(props.estufagemInicio)}`;
  }

  if (!editando) {
    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-all relative overflow-hidden">
        {/* Header do Card com Título e Ação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Ship className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Programação Marítima & Deadlines</span>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  Armador
                </span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Reserva de praça, navio designado e controle dos prazos limites de entrega.
              </p>
            </div>
          </div>

          <button
            onClick={() => setEditando(true)}
            title="Editar Logística e Deadlines"
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-orange-500" />
            <span>Editar Prazos</span>
          </button>
        </div>

        {/* Grade de Informações em 4 Colunas com Destaque Visual */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Booking */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
              <span>Nº do Booking</span>
            </div>
            <div className="text-sm font-black font-mono text-slate-900 dark:text-white truncate">
              {props.bookingNumero || 'Pendente'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Reserva de praça</div>
          </div>

          {/* Navio */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              <Ship className="w-3.5 h-3.5 text-blue-500" />
              <span>Navio / Viagem</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {props.navio || 'Não designado'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Transportador marítimo</div>
          </div>

          {/* Estufagem */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>Janela de Estufagem</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {estufagemStr}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Enchimento no REDEX</div>
          </div>

          {/* Deadline Geral */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>Deadline Gate (Carga)</span>
            </div>
            <div className="text-sm font-black font-mono text-slate-900 dark:text-white truncate">
              {formatDateBR(props.deadlineCarga || props.deadlineEmbarque)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Limite físico de entrada</div>
          </div>
        </div>

        {/* Tríade de Deadlines Integrada sem bordas duplicadas */}
        <div className="pt-2">
          <DeadlinesTripleCard
            draftBl={props.deadlineDraftBl}
            draftVgm={props.deadlineDraftVgm}
            draftCarga={props.deadlineCarga}
            deadlineEmbarqueFallback={props.deadlineEmbarque}
            onEditClick={() => setEditando(true)}
            status={props.status}
          />
        </div>
      </section>
    );
  }

  return (
    <form action={handleSubmit} className="bg-white dark:bg-slate-900 border-2 border-orange-500/50 rounded-3xl p-6 mb-6 shadow-md transition-all">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Editar Programação & Deadlines</h3>
          <p className="text-xs text-slate-400">Prazos e parâmetros operacionais do armador.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
        >
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <EditField label="Nº Booking" name="bookingNumero" defaultValue={props.bookingNumero} />
        <EditField label="Navio" name="navio" defaultValue={props.navio} />
        <EditField
          label="Estufagem — início"
          name="estufagemInicio"
          type="date"
          defaultValue={toDateInput(props.estufagemInicio)}
        />
        <EditField
          label="Estufagem — fim"
          name="estufagemFim"
          type="date"
          defaultValue={toDateInput(props.estufagemFim)}
        />
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mb-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
          Tríade de Deadlines do Armador
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EditField
            label="1. Deadline Draft BL"
            name="deadlineDraftBl"
            type="date"
            defaultValue={toDateInput(props.deadlineDraftBl)}
          />
          <EditField
            label="2. Deadline Draft VGM"
            name="deadlineDraftVgm"
            type="date"
            defaultValue={toDateInput(props.deadlineDraftVgm)}
          />
          <EditField
            label="3. Deadline Draft Carga (Gate)"
            name="deadlineCarga"
            type="date"
            defaultValue={toDateInput(props.deadlineCarga || props.deadlineEmbarque)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}

function EditField({
  label,
  name,
  defaultValue,
  type = 'text',
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/40"
      />
    </div>
  );
}
