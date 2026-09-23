import { prisma } from '@/lib/prisma';
import { LogisticaCockpit } from '@/components/logistica/LogisticaCockpit';

export const metadata = {
  title: 'Logística & Deadlines - Bela Cereais Export',
  description: 'Radar operacional de logística marítima, controle de deadlines de embarque e bookings.',
};

export default async function LogisticaPage() {
  const processosRaw = await prisma.processo.findMany({
    include: {
      etapas: {
        include: {
          etapaTemplate: true,
        },
        orderBy: { etapaTemplate: { ordem: 'asc' } },
      },
      containers: true,
    },
    orderBy: [
      { deadlineEmbarque: 'asc' },
      { criadoEm: 'desc' },
    ],
  });

  const processosFormatados = processosRaw.map((p) => {
    const containersPreenchidos = (p.containers || []).filter(
      (c) => Boolean(c.numeroContainer?.trim())
    ).length;

    return {
      id: p.id,
      numeroProcesso: p.numeroProcesso,
      clienteFinal: p.clienteFinal,
      produto: p.produto,
      volumeKg: Number(p.volumeKg) || 0,
      incoterm: p.incoterm,
      portoOrigem: p.portoOrigem,
      portoDestino: p.portoDestino,
      armador: p.armador,
      navio: p.navio,
      bookingNumero: p.bookingNumero,
      deadlineEmbarque: p.deadlineEmbarque,
      dataEstufagem: p.dataEstufagem,
      redex: p.redex,
      containerQtd: p.containerQtd,
      containerTipo: p.containerTipo,
      freeTimeDestino: p.freeTimeDestino,
      status: p.status,
      containersCount: p.containers?.length || 0,
      containersPreenchidos,
      etapas: (p.etapas || []).map((e) => ({
        nome: e.etapaTemplate?.etapa || 'Etapa',
        status: e.status,
        ordem: e.etapaTemplate?.ordem || 0,
      })),
    };
  });

  return (
    <div className="max-w-7xl mx-auto py-2">
      <LogisticaCockpit processos={processosFormatados} />
    </div>
  );
}
