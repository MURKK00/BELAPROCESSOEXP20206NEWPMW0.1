'use client';

import { atualizarStatusAction } from '@/server/actions/editarProcessoAction';

const OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_NEGOCIACAO', label: 'Em negociação' },
  { value: 'EM_EXECUCAO', label: 'Em execução' }, // <-- O novo status entrou aqui!
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
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold outline-none hover:bg-gray-50 focus:border-blue-500 bg-white shadow-sm transition-colors cursor-pointer"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </form>
  );
}