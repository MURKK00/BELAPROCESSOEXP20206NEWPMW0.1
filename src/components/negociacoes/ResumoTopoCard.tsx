'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { atualizarResumoTopoAction } from '@/server/actions/blocoActions';
import { formatDateBR } from '@/lib/formatters';

type Props = {
  processoId: string;
  bookingNumero: string;
  navio: string;
  estufagemInicio: string | null; // ISO
  estufagemFim: string | null; // ISO
  deadlineEmbarque: string | null; // ISO
};

function toDateInput(iso: string | null) {
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
      <div className="bg-surface border border-border rounded-2xl px-10 py-6 flex flex-wrap justify-between items-center gap-6 mb-6 relative">
        <button
          onClick={() => setEditando(true)}
          title="Editar"
          className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 transition-colors"
        >
          ✏️
        </button>
        <SummaryItem label="Booking" value={props.bookingNumero || '-'} />
        <SummaryItem label="Navio" value={props.navio || '-'} />
        <SummaryItem label="Estufagem" value={estufagemStr} />
        <SummaryItem label="Deadline" value={formatDateBR(props.deadlineEmbarque)} />
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="bg-surface border border-blue-200 rounded-2xl px-10 py-6 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <EditField label="Booking" name="bookingNumero" defaultValue={props.bookingNumero} />
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
        <EditField
          label="Deadline"
          name="deadlineEmbarque"
          type="date"
          defaultValue={toDateInput(props.deadlineEmbarque)}
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold"
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