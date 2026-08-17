import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDateTimeBR } from '@/lib/formatters';

export default async function AuditoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const processo = await prisma.processo.findUnique({
    where: { id },
    include: { logs: { include: { usuario: true }, orderBy: { criadoEm: 'desc' } } },
  });
  if (!processo) notFound();

  return (
    <div className="bg-surface border border-border rounded-2xl p-8">
      <h3 className="text-lg font-semibold mb-6">Histórico de ações (log)</h3>
      <div className="relative pl-8">
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border" />
        {processo.logs.length === 0 && <p className="text-sm text-gray-400">Nenhuma ação registrada ainda.</p>}
        {processo.logs.map((log) => (
          <div key={log.id} className="relative mb-6">
            <div className="absolute -left-8 w-6 h-6 rounded-full bg-primary border-4 border-white" />
            <div className="bg-gray-50 border border-border rounded-lg px-4 py-3">
              <div className="text-sm font-semibold">{log.detalhe}</div>
              <div className="text-xs text-gray-500 mt-1">
                Por <strong>{log.usuario.nome}</strong> em {formatDateTimeBR(log.criadoEm)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}