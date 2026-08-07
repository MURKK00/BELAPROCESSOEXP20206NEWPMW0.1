import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { marcarEtapaAction } from '@/server/actions/etapaActions';

const FASE_LABEL: Record<string, string> = {
  COMERCIAL: 'Comercial',
  PRODUTOR_VENDEDOR: 'Produtor/Vendedor',
  ADMINISTRATIVO: 'Administrativo',
  INDUSTRIA_BENEFICIAMENTO: 'Indústria de Beneficiamento',
  BOOKING_TRANSPORTE: 'Booking / Transporte Internacional',
  CARREGAMENTO: 'Carregamento',
  CARREGAMENTO_REDEX: 'Carregamento e REDEX',
  DOCUMENTACAO_EXPORTACAO: 'Documentação de Exportação',
  TERMINAL_PORTO: 'Terminal/Porto',
  FECHAMENTO_BANCARIO: 'Fechamento Bancário/Documental',
};

export default async function ChecklistPage({ params }: { params: { id: string } }) {
  const processo = await prisma.processo.findUnique({
    where: { id: params.id },
    include: {
      etapas: {
        include: { etapaTemplate: { include: { parceiro: true } } },
        orderBy: { etapaTemplate: { ordem: 'asc' } },
      },
    },
  });
  if (!processo) notFound();

  const fases = Array.from(new Set(processo.etapas.map((e) => e.etapaTemplate.fase)));

  return (
    <div className="grid grid-cols-2 gap-6">
      {fases.map((fase) => {
        const etapasDaFase = processo.etapas.filter((e) => e.etapaTemplate.fase === fase);
        return (
          <div key={fase} className="bg-surface border border-border rounded-2xl p-7">
            <h3 className="text-base font-semibold mb-5 pb-4 border-b border-border">
              {FASE_LABEL[fase] ?? fase}
            </h3>
            <ul className="space-y-1">
              {etapasDaFase.map((e) => {
                const done = e.status === 'CONCLUIDA';
                return (
                  <li key={e.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                    <form action={marcarEtapaAction}>
                      <input type="hidden" name="etapaId" value={e.id} />
                      <input type="hidden" name="processoId" value={processo.id} />
                      <input type="hidden" name="novoStatus" value={done ? 'PENDENTE' : 'CONCLUIDA'} />
                      <button
                        type="submit"
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          done ? 'bg-success border-success text-white' : 'border-gray-300'
                        }`}
                        aria-label={done ? 'Marcar como pendente' : 'Marcar como concluída'}
                      >
                        {done && '✓'}
                      </button>
                    </form>
                    <span className={`text-sm ${done ? '' : 'text-gray-500'}`}>
                      {e.etapaTemplate.etapa}
                      {e.etapaTemplate.parceiro && (
                        <span className="text-gray-400"> — {e.etapaTemplate.parceiro.nome}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
