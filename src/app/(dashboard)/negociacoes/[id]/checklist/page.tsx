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
  DOCUMENTACAO_EXPORTACAO: 'Documentos',
  TERMINAL_PORTO: 'Terminal/Porto',
  FECHAMENTO_BANCARIO: 'Fechamento Bancário/Documental',
};

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

  // PREVIEW ESTÁTICO (Caso o banco esteja vazio na negociação TESTE)
  if (processo.etapas.length === 0) {
    const mockAdministrativo = [
      "Registro Booking", "Registro Dead Line", "Lacres registrados", 
      "Envio NF Exportação", "Embarque confirmado", "Envio Documentação ao Cliente", "Fechamento de cambio"
    ];
    const mockDocumentos = [
      "BL Original - CROMO", "Comercial Invoice - Banco", "Packing List - Port Inspect", 
      "CO (Certificate of Origin) - CROMO", "Weight Certificate - Port Inspect", 
      "Quality Certificate - Port Inspect", "Stuffing Report - Port Inspect", 
      "Fumigation Certificate - SURVEY", "Phytosanitary Certificate (MAPA) - CROMO", 
      "Certificate Non-GMO - Port Inspect", "DU-E Registrada"
    ];

    return (
      <div className="p-2">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Checklist da Operação</h2>
          <p className="text-sm text-orange-600 font-semibold mt-1">
            ⚠️ Modo Visualização (Esta negociação de teste não possui etapas no banco de dados. Crie um processo real para habilitar os cliques).
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-3 border-b border-gray-100 uppercase tracking-wider">
              Administrativo
            </h3>
            <ul className="space-y-2">
              {mockAdministrativo.map((item, index) => (
                <li key={index} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-5 h-5 rounded border border-gray-300 bg-gray-50"></div>
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-3 border-b border-gray-100 uppercase tracking-wider">
              Documentos
            </h3>
            <ul className="space-y-2">
              {mockDocumentos.map((item, index) => (
                <li key={index} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-5 h-5 rounded border border-gray-300 bg-gray-50"></div>
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // CÓDIGO REAL E INTERATIVO (Para quando houver dados no banco)
  const fases = Array.from(new Set(processo.etapas.map((e) => e.etapaTemplate.fase)));

  return (
    <div className="p-2">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Checklist da Operação</h2>
        <p className="text-sm text-gray-500 mt-1">Acompanhe e valide o andamento de cada fase.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fases.map((fase) => {
          const etapasDaFase = processo.etapas.filter((e) => e.etapaTemplate.fase === fase);
          return (
            <div key={fase} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit">
              <h3 className="text-sm font-bold text-gray-700 mb-4 pb-3 border-b border-gray-100 uppercase tracking-wider">
                {FASE_LABEL[fase] ?? fase}
              </h3>
              <ul className="space-y-2">
                {etapasDaFase.map((e) => {
                  const done = e.status === 'CONCLUIDA';
                  return (
                    <li key={e.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <form action={marcarEtapaAction}>
                        <input type="hidden" name="etapaId" value={e.id} />
                        <input type="hidden" name="processoId" value={processo.id} />
                        <input type="hidden" name="novoStatus" value={done ? 'PENDENTE' : 'CONCLUIDA'} />
                        <button
                          type="submit"
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            done ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {done && <span className="text-xs font-bold">✓</span>}
                        </button>
                      </form>
                      <span className={`text-sm font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {e.etapaTemplate.etapa}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}