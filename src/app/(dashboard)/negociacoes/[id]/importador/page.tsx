import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ImportadorCard } from '@/components/negociacoes/ImportadorCard';

export default async function ImportadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id }
  });

  if (!processo) notFound();

  // Mágica para o Next.js parar de chorar com os Decimais do Prisma
  const processoSanitizado = {
    ...processo,
    volumeKg: Number(processo.volumeKg),
    valorDeclaradoUsd: processo.valorDeclaradoUsd ? Number(processo.valorDeclaradoUsd) : null,
  } as any;

  return (
    <div className="max-w-4xl">
      <ImportadorCard processo={processoSanitizado} />
    </div>
  );
}