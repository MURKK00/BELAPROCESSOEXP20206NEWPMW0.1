import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ChecklistTabs } from '@/components/negociacoes/ChecklistTabs';

export default async function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      etapas: {
        include: { etapaTemplate: { include: { parceiro: true } } },
        orderBy: { etapaTemplate: { ordem: 'asc' } },
      },
    },
  });

  if (!processo) notFound();

  if (processo.etapas.length === 0) {
    return (
      <div className="p-2">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Checklist da Operação</h2>
          <p className="text-sm text-orange-600 font-semibold mt-1">
            ⚠️ Esta negociação ainda não tem etapas de checklist geradas. Rode o script de reset do
            checklist (scripts/reset-checklist.ts) ou recrie a negociação.
          </p>
        </div>
      </div>
    );
  }

  // Descobre quais abas existem
  const fases = Array.from(new Set(processo.etapas.map((e) => e.etapaTemplate.fase)));

  // Simplificamos os dados para enviar ao componente de abas de forma segura e rápida
  const etapasSimplificadas = processo.etapas.map(e => ({
    id: e.id,
    status: e.status,
    fase: e.etapaTemplate.fase,
    etapa: e.etapaTemplate.etapa
  }));

  return (
    <div className="p-2">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Checklist da Operação</h2>
        <p className="text-sm text-gray-500 mt-1">Acompanhe e valide o andamento clicando nas abas abaixo.</p>
      </div>

      {/* Chama o seu novo componente lindão aqui */}
      <ChecklistTabs 
        processoId={processo.id} 
        fases={fases} 
        etapas={etapasSimplificadas} 
      />
    </div>
  );
}