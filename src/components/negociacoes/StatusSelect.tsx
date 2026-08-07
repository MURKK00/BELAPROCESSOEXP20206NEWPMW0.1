'use client';

import { atualizarStatusAction } from '@/server/actions/editarProcessoAction';

const OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_NEGOCIACAO', label: 'Em negociação' },
  { value: 'EMBARCADO', label: 'Embarcado' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export function StatusSelect({ processoId, status }: { processoId: string; status: string }) {
  return (
    <form
      action={atualizarStatusAction}
      onChange={(e) => (e.currentTarget as HTMLFormElement).requestSubmit()}
    >
      <input type="hidden" name="processoId" value={processoId} />
      <select
        name="status"
        defaultValue={status}
        className="border border-border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-secondary bg-white"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </form>
  );
}