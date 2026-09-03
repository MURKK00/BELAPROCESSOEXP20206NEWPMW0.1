import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDateTimeBR } from '@/lib/formatters';

export default async function AuditoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const processo = await prisma.processo.findUnique({
    where: { id },
    include: { logs: { include: { usuario: true }, orderBy: { criadoEm: 'desc' } } },
  });
  
  if (!processo) notFound();

  return (
    <div className="bg-surface border border-border rounded-2xl p-8">
      <h3 className="text-lg font-semibold mb-6">Histórico de ações (log)</h3>
      <div className="relative pl-8">
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border" />
        
        {processo.logs.length === 0 && <p className="text-sm text-gray-400">Nenhuma ação registrada ainda.</p>}
        
        {processo.logs.map((log) => {
          // Garante que temos um objeto para renderizar as alterações, se existir
          const hasAlteracoes = log.alteracoes && typeof log.alteracoes === 'object' && Object.keys(log.alteracoes).length > 0;

          return (
            <div key={log.id} className="relative mb-6">
              <div className="absolute -left-8 w-6 h-6 rounded-full bg-primary border-4 border-white" />
              
              <div className="bg-gray-50 border border-border rounded-lg px-4 py-3 shadow-sm">
                <div className="text-sm font-semibold text-gray-800">{log.detalhe}</div>
                
                {/* O DE -> PARA DA OPERAÇÃO */}
                {hasAlteracoes && (
                  <div className="mt-3 mb-1 bg-white border border-gray-200 rounded-md overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 border-b border-gray-200 text-gray-500 uppercase">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Campo Modificado</th>
                          <th className="px-3 py-2 font-semibold text-red-400">De (Antigo)</th>
                          <th className="px-3 py-2 font-semibold text-green-600">Para (Novo)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Object.entries(log.alteracoes as any).map(([campo, valores]: [string, any]) => (
                          <tr key={campo}>
                            <td className="px-3 py-2 font-medium text-gray-700">{campo}</td>
                            <td className="px-3 py-2 text-red-500 line-through bg-red-50/30">
                              {valores?.de === null || valores?.de === '' ? 'Vazio' : String(valores?.de)}
                            </td>
                            <td className="px-3 py-2 text-green-600 font-medium bg-green-50/30">
                              {valores?.para === null || valores?.para === '' ? 'Vazio' : String(valores?.para)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  Por <strong>{log.usuario.nome}</strong> em {formatDateTimeBR(log.criadoEm)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}