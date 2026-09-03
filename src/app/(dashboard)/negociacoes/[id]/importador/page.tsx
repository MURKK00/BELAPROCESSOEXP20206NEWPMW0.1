import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ImportadorCard } from '@/components/negociacoes/ImportadorCard';

export default async function ImportadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id }
  });

  if (!processo) notFound();

  return (
    <div className="max-w-4xl">
      <ImportadorCard 
        processoId={processo.id}
        clienteFinal={processo.clienteFinal}
        enderecoBuyer={processo.enderecoBuyer}
        iecBuyer={processo.iecBuyer}
        fassaiBuyer={processo.fassaiBuyer}
        panBuyer={processo.panBuyer}
        gstBuyer={processo.gstBuyer}
        emailBuyer={processo.emailBuyer}
        telefoneBuyer={processo.telefoneBuyer}
      />
    </div>
  );
}