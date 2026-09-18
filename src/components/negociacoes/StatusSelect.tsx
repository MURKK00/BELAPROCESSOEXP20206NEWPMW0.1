'use client';

import { useRouter } from 'next/navigation';
import { atualizarStatusAction } from '@/server/actions/editarProcessoAction';
import { STATUS_NEGOCIACAO_MAP } from '@/lib/formatters';

export function StatusSelect({ processoId, status }: { processoId: string; status: string }) {
  const router = useRouter();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formData = new FormData();
    formData.set('processoId', processoId);
    formData.set('status', e.target.value);
    
    await atualizarStatusAction(formData);
    router.refresh();
  };

  return (
    <div className="relative inline-block w-48">
      <select
        value={status}
        onChange={handleChange}
        className="w-full appearance-none border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm font-semibold outline-none hover:bg-gray-50 focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] bg-white shadow-sm transition-colors cursor-pointer"
      >
        {Object.entries(STATUS_NEGOCIACAO_MAP).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
      
      {/* O ícone da setinha flutuando à direita */}
      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}