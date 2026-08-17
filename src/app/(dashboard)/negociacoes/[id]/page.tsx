import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

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

  // Lógica funcional real: Conta quantas pendências reais existem no processo.
  const pendentesAdmin = processo.etapas.filter(
    (e) => e.etapaTemplate.fase === 'ADMINISTRATIVO' && e.status !== 'CONCLUIDA'
  ).length;

  const pendentesDocs = processo.etapas.filter(
    (e) => e.etapaTemplate.fase === 'DOCUMENTACAO_EXPORTACAO' && e.status !== 'CONCLUIDA'
  ).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LADO ESQUERDO: Informações da Operação */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Informações da Operação</h2>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">Cliente Final</label>
            <div className="font-medium text-gray-900">{processo.clienteFinal}</div>
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">Produto</label>
            <div className="font-medium text-gray-900">{processo.produto}</div>
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">Volume</label>
            <div className="font-medium text-gray-900">{Number(processo.volumeKg) / 1000} Toneladas</div>
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">Incoterm / Porto</label>
            <div className="font-medium text-gray-900">{processo.incoterm} → {processo.portoDestino}</div>
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">Redex</label>
            <div className="font-medium text-gray-900">{processo.redex || '-'}</div>
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">Valor Declarado</label>
            <div className="font-medium text-gray-900">
              {processo.valorDeclaradoUsd ? `$ ${Number(processo.valorDeclaradoUsd).toFixed(2)}` : '-'}
            </div>
          </div>
          
          {/* NOVOS CAMPOS: Contêineres e Sacas */}
          <div>
            <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">Contêineres (Qtd)</label>
            <div className="font-medium text-gray-900">
              {processo.containerQtd ? `${processo.containerQtd}x ${processo.containerTipo}` : '-'}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">Sacas por contêiner</label>
            <div className="font-medium text-gray-900">
              {processo.sacasPorContainer ? `${processo.sacasPorContainer} sacas` : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: Resumo do Checklist */}
      <div className="lg:col-span-1 bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm h-fit">
        <h2 className="text-lg font-bold mb-1 text-gray-900">Status da Operação</h2>
        <p className="text-xs text-gray-500 mb-6">Resumo de pendências do checklist.</p>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Administrativo</span>
            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              {pendentesAdmin} pendentes
            </span>
          </div>
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Documentos</span>
            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              {pendentesDocs} pendentes
            </span>
          </div>
        </div>

        <Link 
          href={`/negociacoes/${id}/checklist`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
        >
          Ver checklist completo →
        </Link>
      </div>

    </div>
  );
}