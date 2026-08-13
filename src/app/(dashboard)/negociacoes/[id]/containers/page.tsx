// LOCAL FINAL DESTE ARQUIVO: src/app/(dashboard)/negociacoes/[id]/containers/page.tsx (arquivo NOVO)
// (crie também a pasta "containers" dentro de negociacoes/[id]/ se ela ainda não existir)

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ContainersTable } from '@/components/negociacoes/ContainersTable';

export default async function ContainersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: { containers: { orderBy: { ordem: 'asc' } } },
  });

  if (!processo) notFound();

  // Segurança: se a quantidade de contêineres foi aumentada e as linhas
  // ainda não existem (ex: negociação criada antes desta funcionalidade),
  // completamos aqui.
  const qtdDesejada = processo.containerQtd ?? 0;
  if (processo.containers.length < qtdDesejada) {
    const faltantes = Array.from({ length: qtdDesejada - processo.containers.length }, (_, i) => ({
      processoId: processo.id,
      ordem: processo.containers.length + i + 1,
    }));
    await prisma.container.createMany({ data: faltantes });
  }

  const containers = await prisma.container.findMany({
    where: { processoId: processo.id },
    orderBy: { ordem: 'asc' },
  });

  const containersFormatados = containers.map((c) => ({
    id: c.id,
    ordem: c.ordem,
    numeroContainer: c.numeroContainer ?? '',
    lacre: c.lacre ?? '',
    pesoBruto: c.pesoBruto ? Number(c.pesoBruto) : null,
    pesoLiquido: c.pesoLiquido ? Number(c.pesoLiquido) : null,
    totalSacos: c.totalSacos,
    tara: c.tara ? Number(c.tara) : null,
  }));

  return <ContainersTable processoId={processo.id} containers={containersFormatados} />;
}
