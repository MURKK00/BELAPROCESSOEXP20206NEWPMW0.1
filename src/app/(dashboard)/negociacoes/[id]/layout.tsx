import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StatusSelect } from '@/components/negociacoes/StatusSelect';
import { ResumoTopoCard } from '@/components/negociacoes/ResumoTopoCard';
import NextLink from 'next/link';

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
    { href: `${base}/importador`, label: 'Dados do Importador' },
    { href: `${base}/checklist`, label: 'Checklist' },
    { href: `${base}/financeiro`, label: 'Financeiro' },
    { href: `${base}/containers`, label: 'Contêineres' },
    { href: `${base}/documentos`, label: 'Documentos' },
    { href: `${base}/auditoria`, label: 'Auditoria' },
    { href: `${base}/chat`, label: 'Chat Interno', isChat: true },
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

      {/* Barra de abas esticada de ponta a ponta (w-full) com itens maiores e justificados */}
      <div className="flex w-full justify-between items-center bg-gray-100 p-2 rounded-xl mb-6 gap-2">
        {tabs.map((t) => (
          <NextLink
            key={t.href}
            href={t.href}
            className={`flex-1 text-center px-3 py-3 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap data-[active=true]:bg-white data-[active=true]:text-gray-900 data-[active=true]:shadow-sm
              ${t.isChat 
                ? 'bg-[#f58220] text-white hover:bg-[#e0751b] shadow-sm font-bold' // Laranja Bela Cereais oficial
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {t.isChat && <span>💬</span>}
            <span>{t.label}</span>
          </NextLink>
        ))}
      </div>

      {children}
    </div>
  );
}