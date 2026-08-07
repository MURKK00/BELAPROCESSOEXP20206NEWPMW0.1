import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { formatDateBR } from '@/lib/formatters';
import { StatusSelect } from '@/components/negociacoes/StatusSelect';
import type { Processo, ProcessoEtapa } from '@prisma/client';

type ProcessoComEtapas = Processo & { etapas: ProcessoEtapa[] };

export function NegotiationTable({ processos }: { processos: ProcessoComEtapas[] }) {
  if (processos.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-10 text-center text-gray-500 text-sm">
        Nenhum processo ainda.{' '}
        <Link href="/negociacoes/nova" className="text-secondary font-semibold">
          Criar o primeiro
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th className="text-left px-6 py-4 font-semibold">Nº Processo</th>
            <th className="text-left px-6 py-4 font-semibold">Cliente</th>
            <th className="text-left px-6 py-4 font-semibold">Produto</th>
            <th className="text-left px-6 py-4 font-semibold">Status</th>
            <th className="text-left px-6 py-4 font-semibold">Deadline</th>
          </tr>
        </thead>
        <tbody>
          {processos.map((p) => (
            <tr key={p.id} className="border-t border-border hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-semibold">
                <Link href={`/negociacoes/${p.id}`}>{p.numeroProcesso}</Link>
              </td>
              <td className="px-6 py-4 text-sm">
                <Link href={`/negociacoes/${p.id}`}>{p.clienteFinal}</Link>
              </td>
              <td className="px-6 py-4 text-sm">{p.produto}</td>
              <td className="px-6 py-4">
                <StatusBadge status={p.status} />
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{formatDateBR(p.deadlineEmbarque)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
