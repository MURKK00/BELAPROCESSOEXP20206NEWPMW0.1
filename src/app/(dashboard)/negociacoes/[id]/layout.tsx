import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StatusSelect } from '@/components/negociacoes/StatusSelect';
import { ResumoTopoCard } from '@/components/negociacoes/ResumoTopoCard';

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

  const base = `/negociacoes/${processo.id}`;
  const tabs = [
    { href: base, label: 'Visão geral' },
    { href: `${base}/checklist`, label: 'Checklist' },
    { href: `${base}/financeiro`, label: 'Financeiro' },
    { href: `${base}/containers`, label: 'Contêineres' },
    { href: `${base}/documentos`, label: 'Documentos' },
    { href: `${base}/auditoria`, label: 'Auditoria' },
  ];

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
            {processo.produto} · {processo.incoterm} → {processo.portoDestino}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/negociacoes"
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            ← Voltar
          </Link>

          <Link
            href={`/negociacoes/${processo.id}/editar`}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            Editar dados
          </Link>

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

      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl mb-6 w-fit flex-wrap">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg text-gray-500 hover:text-gray-900 data-[active=true]:bg-white data-[active=true]:text-gray-900 data-[active=true]:shadow-sm"
          >
            {t.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}