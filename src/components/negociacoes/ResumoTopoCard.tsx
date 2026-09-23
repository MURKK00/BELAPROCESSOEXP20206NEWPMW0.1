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
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 relative shadow-2xs">
        <button
          onClick={() => setEditando(true)}
          title="Editar Dados de Logística e Deadlines"
          className="absolute top-5 right-5 text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-xs font-semibold"
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
    <form action={handleSubmit} className="bg-white border border-blue-200 rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
        <h3 className="text-sm font-bold text-gray-900">Editar Logística & Deadlines do Armador</h3>
        <span className="text-xs text-gray-400">Prazos cruciais para evitar multas de rolagem</span>
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

      <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 mb-5">
        <div className="text-xs font-extrabold uppercase text-gray-700 tracking-wider mb-3">
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors shadow-2xs"
        >
          {salvando ? 'Salvando...' : 'Salvar Prazos'}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
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
      <label className="block text-xs uppercase text-gray-400 font-semibold mb-2">{label}</label>
      <span className="text-base font-semibold text-gray-900">{value}</span>
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
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
      />
    </div>
  );
}