import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { NegotiationTable } from '@/components/negociacoes/NegotiationTable';

export default async function NegociacoesPage() {
  const processos = await prisma.processo.findMany({
    include: { etapas: true },
    orderBy: { criadoEm: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Todos os processos</h2>
        <Link
          href="/negociacoes/nova"
          className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-100"
        >
          + Nova negociação
        </Link>
      </div>
      <NegotiationTable processos={processos} />
    </div>
  );
}
