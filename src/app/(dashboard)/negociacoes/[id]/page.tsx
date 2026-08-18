import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { InfoOperacaoCard } from '@/components/negociacoes/InfoOperacaoCard';
import { ChatSidebar } from '@/components/negociacoes/ChatSidebar';

const FASES_STATUS: { fase: string; label: string }[] = [
  { fase: 'BOOKING_TRANSPORTE', label: 'Booking / Transporte Internacional' },
  { fase: 'ADMINISTRATIVO', label: 'Administrativo' },
  { fase: 'CARREGAMENTO_REDEX', label: 'Carregamento e REDEX' },
  { fase: 'DOCUMENTACAO_EXPORTACAO', label: 'Documentos' },
  { fase: 'FECHAMENTO_BANCARIO', label: 'Fechamento Bancário/Documental' },
];

export default async function VisaoGeralNegociacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: { etapas: { include: { etapaTemplate: true } } },
  });

  if (!processo) notFound();

  const pendentesPorFase = FASES_STATUS.map((f) => ({
    ...f,
    pendentes: processo.etapas.filter(
      (e) => e.etapaTemplate.fase === f.fase && e.status !== 'CONCLUIDA'
    ).length,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <InfoOperacaoCard
        processoId={processo.id}
        clienteFinal={processo.clienteFinal}
        produto={processo.produto}
        volumeKg={Number(processo.volumeKg)}
        incoterm={processo.incoterm}
        portoDestino={processo.portoDestino}
        redex={processo.redex ?? ''}
        valorDeclaradoUsd={processo.valorDeclaradoUsd ? Number(processo.valorDeclaradoUsd) : null}
        containerQtd={processo.containerQtd}
        containerTipo={processo.containerTipo ?? "20' DRY"}
        sacasPorContainer={processo.sacasPorContainer}
        freeTimeDestino={processo.freeTimeDestino ?? ''}
        ruc={processo.ruc ?? ''}
        contratoInterno={processo.contratoInterno ?? ''}
      />

      {/* LADO DIREITO: Resumo do Checklist */}
      <div className="lg:col-span-1 bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm h-fit">
        <h2 className="text-lg font-bold mb-1 text-gray-900">Status da Operação</h2>
        <p className="text-xs text-gray-500 mb-6">Resumo de pendências do checklist.</p>

        <div className="space-y-4 mb-6">
          {pendentesPorFase.map((f) => (
            <div
              key={f.fase}
              className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
            >
              <span className="text-sm font-semibold text-gray-700">{f.label}</span>
              <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                {f.pendentes} pendentes
              </span>
            </div>
          ))}
        </div>

        <Link
          href={`/negociacoes/${id}/checklist`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
        >
          Ver checklist completo →
        </Link>
      </div>

      <ChatSidebar processoId={processo.id} />
    </div>
  );
}