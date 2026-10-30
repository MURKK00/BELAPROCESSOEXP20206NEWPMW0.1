import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { RastreabilidadeTrajetoCard } from '@/components/negociacoes/RastreabilidadeTrajetoCard';

export default async function RastreabilidadePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      produtor: true,
      importador: true,
      containers: true,
    },
  });

  if (!processo) notFound();

  const processoSanitizado = {
    ...processo,
    volumeKg: Number(processo.volumeKg),
    valorDeclaradoUsd: processo.valorDeclaradoUsd ? Number(processo.valorDeclaradoUsd) : null,
    emissaoCO2EstimadaKg: processo.emissaoCO2EstimadaKg ? Number(processo.emissaoCO2EstimadaKg) : null,
  } as any;

  return (
    <div className="max-w-5xl">
      <RastreabilidadeTrajetoCard processo={processoSanitizado} />
    </div>
  );
}
