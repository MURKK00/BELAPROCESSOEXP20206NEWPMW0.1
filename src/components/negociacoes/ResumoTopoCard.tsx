'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { atualizarResumoTopoAction } from '@/server/actions/blocoActions';
import { formatDateBR } from '@/lib/formatters';
import { DeadlinesTripleCard } from '@/components/negociacoes/DeadlinesTripleCard';

type Props = {
  processoId: string;
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

  let estufagemStr = '-';
  if (props.estufagemInicio && props.estufagemFim) {
    estufagemStr = `${formatDateBR(props.estufagemInicio)} → ${formatDateBR(props.estufagemFim)}`;
  } else if (props.estufagemInicio) {
    estufagemStr = formatDateBR(props.estufagemInicio);
  }

  if (!editando) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 mb-6 relative shadow-2xs transition-colors">
        <button
          onClick={() => setEditando(true)}
          title="Editar Dados de Logística e Deadlines"
          className="absolute top-5 right-5 text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors flex items-center gap-1 text-xs font-bold"
        >
          <span>✏️ Editar</span>
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
          <SummaryItem label="Nº Booking" value={props.bookingNumero || '-'} />
          <SummaryItem label="Navio" value={props.navio || '-'} />
          <SummaryItem label="Período de Estufagem" value={estufagemStr} />
          <SummaryItem 
            label="Deadline Geral (Embarque)" 
            value={formatDateBR(props.deadlineCarga || props.deadlineEmbarque)} 
          />
        </div>

        {/* TRÍADE DE DEADLINES INTEGRADA */}
        <DeadlinesTripleCard
          draftBl={props.deadlineDraftBl}
          draftVgm={props.deadlineDraftVgm}
          draftCarga={props.deadlineCarga}
          deadlineEmbarqueFallback={props.deadlineEmbarque}
          onEditClick={() => setEditando(true)}
        />
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="bg-white dark:bg-slate-900 border border-orange-500/40 dark:border-orange-500/30 rounded-2xl p-6 mb-6 shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Editar Logística & Deadlines do Armador</h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">Prazos cruciais para evitar multas de rolagem</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
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

      <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-5">
        <div className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-3">
          Tríade de Deadlines (Armador / Terminal)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EditField
            label="1. Deadline Draft BL (Minuta)"
            name="deadlineDraftBl"
            type="date"
            defaultValue={toDateInput(props.deadlineDraftBl)}
          />
          <EditField
            label="2. Deadline Draft VGM (Peso SOLAS)"
            name="deadlineDraftVgm"
            type="date"
            defaultValue={toDateInput(props.deadlineDraftVgm)}
          />
          <EditField
            label="3. Deadline Draft Carga (Gate Terminal)"
            name="deadlineCarga"
            type="date"
            defaultValue={toDateInput(props.deadlineCarga || props.deadlineEmbarque)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="bg-[#f58220] hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors shadow-2xs"
        >
          {salvando ? 'Salvando...' : 'Salvar Prazos'}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs uppercase text-slate-400 dark:text-slate-500 font-bold mb-1.5">{label}</label>
      <span className="text-base font-black text-slate-900 dark:text-white">{value}</span>
    </div>
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
  defaultValue: any;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
      />
    </div>
  );
}
