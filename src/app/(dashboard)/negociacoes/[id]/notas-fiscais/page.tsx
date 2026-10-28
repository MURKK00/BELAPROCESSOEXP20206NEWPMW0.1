import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { NotasFiscaisDashboard } from '@/components/negociacoes/notas-fiscais/NotasFiscaisDashboard';

export const dynamic = 'force-dynamic';

export default async function NotasFiscaisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    select: { id: true, numeroProcesso: true },
  });

  if (!processo) notFound();

  return (
    <div className="space-y-6">
      <NotasFiscaisDashboard processoId={processo.id} />
    </div>
  );
}
