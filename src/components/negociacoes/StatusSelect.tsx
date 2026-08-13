'use client';

import { useRouter } from 'next/navigation';
import { atualizarStatusAction } from '@/server/actions/editarProcessoAction';

const OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_NEGOCIACAO', label: 'Em negociação' },
  { value: 'EM_EXECUCAO', label: 'Em execução' },
  { value: 'EMBARCADO', label: 'Embarcado' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export function StatusSelect({ processoId, status }: { processoId: string; status: string }) {
  const router = useRouter();

  // Função que detecta a mudança, envia pro banco e atualiza a tela
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formData = new FormData();
    formData.set('processoId', processoId);
    formData.set('status', e.target.value);
    
    await atualizarStatusAction(formData);
    
    // Esse é o comando mágico que estava faltando: ele recarrega os dados do banco!
    router.refresh();
  };

  return (
    <select
      value={status}
      onChange={handleChange}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold outline-none hover:bg-gray-50 focus:border-blue-500 bg-white shadow-sm transition-colors cursor-pointer"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}