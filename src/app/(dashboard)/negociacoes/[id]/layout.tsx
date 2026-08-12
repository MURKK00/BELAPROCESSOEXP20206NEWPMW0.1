import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/components/negociacoes/StatusBadge';
import { StatusSelect } from '@/components/negociacoes/StatusSelect';
import { formatDateBR } from '@/lib/formatters';

export default async function DetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // 1. Extraímos o 'id' da URL (obrigatório ser 'await' no Next.js 15)
  const { id } = await params;

  // 2. Buscamos as informações no banco de dados
  const processo = await prisma.processo.findUnique({
    where: { id: id },
    include: { etapas: true },
  });

  // 3. Se não encontrar nada, vai para a página de erro 404
  if (!processo) notFound();

  const base = `/negociacoes/${processo.id}`;
  const tabs = [
    { href: base, label: 'Visão geral' },
    { href: `${base}/checklist`, label: 'Checklist' },
    { href: `${base}/financeiro`, label: 'Financeiro' },
    { href: `${base}/documentos`, label: 'Documentos' },
    { href: `${base}/chat`, label: 'Chat interno' },
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
        
        {/* AQUI ESTÁ A MÁGICA: Os botões novos, modernos e com ícones! */}
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

          {/* O seletor de status continua aqui, mas agora os botões do lado dele estão com a altura e design corretos */}
          <StatusSelect processoId={processo.id} status={processo.status} />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl px-8 py-6 grid grid-cols-3 mb-6">
        <SummaryItem label="Booking" value={processo.bookingNumero ?? '-'} />
        <SummaryItem label="Navio" value={processo.navio ?? '-'} />
        <SummaryItem label="Deadline" value={formatDateBR(processo.deadlineEmbarque)} />
      </div>

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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs uppercase text-gray-400 font-semibold mb-2">{label}</label>
      <span className="text-base font-semibold text-gray-900">{value}</span>
    </div>
  );
}