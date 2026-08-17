import { STATUS_NEGOCIACAO_MAP } from '@/lib/formatters';

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDENTE: 'bg-gray-100 text-gray-600 border-gray-200',
    EM_NEGOCIACAO: 'bg-amber-100 text-amber-700 border-amber-200',
    EM_EXECUCAO: 'bg-blue-100 text-blue-700 border-blue-200',
    EMBARCADO: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    FINALIZADO: 'bg-green-100 text-green-700 border-green-200',
    CANCELADO: 'bg-red-100 text-red-700 border-red-200',
  };

  const style = colors[status] || colors.PENDENTE;
  const label = STATUS_NEGOCIACAO_MAP[status] || status;

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${style}`}>
      {label}
    </span>
  );
}