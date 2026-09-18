import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StatusSelect } from '@/components/negociacoes/StatusSelect';
import { ResumoTopoCard } from '@/components/negociacoes/ResumoTopoCard';
import NextLink from 'next/link';
import { NegociacaoTabs } from '@/components/negociacoes/NegociacaoTabs';

export default async function DetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id: id },
    include: { etapas: true },
  });

  if (!processo) notFound();

  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
        Negociações · {processo.numeroProcesso}
      </div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
            {processo.numeroProcesso} · {processo.clienteFinal}
          </h1>
          <div className="text-gray-500">
            {processo.produto} · {processo.incoterm || ''} → {processo.portoDestino}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NextLink
            href="/negociacoes"
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            ← Voltar
          </NextLink>

          <StatusSelect processoId={processo.id} status={processo.status} />
        </div>
      </div>

      <ResumoTopoCard
        processoId={processo.id}
        bookingNumero={processo.bookingNumero ?? ''}
        navio={processo.navio ?? ''}
        estufagemInicio={processo.estufagemInicio ? processo.estufagemInicio.toISOString() : null}
        estufagemFim={processo.estufagemFim ? processo.estufagemFim.toISOString() : null}
        deadlineEmbarque={processo.deadlineEmbarque ? processo.deadlineEmbarque.toISOString() : null}
      />

      {/* A BARRA DE ABAS AGORA VEM DO COMPONENTE CLIENT */}
      <NegociacaoTabs processoId={processo.id} />

      {children}
    </div>
  );
}