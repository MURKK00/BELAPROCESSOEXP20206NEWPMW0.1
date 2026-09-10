export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { NegotiationTable } from '@/components/negociacoes/NegotiationTable';
import { getDaysLeft } from '@/lib/workflow';
import { formatNum, formatDateBR } from '@/lib/formatters';

export default async function DashboardPage() {
  const processos = await prisma.processo.findMany({
    include: { etapas: true },
    orderBy: { deadlineEmbarque: 'asc' }, 
  });

  const processosValidos = processos.filter(
    (p) => p.status !== 'CANCELADO' && p.status !== 'CANCELADA'
  );

  const processosEmbarcados = processosValidos.filter((p) => p.status === 'EMBARCADO');
  
  const processosEmExecucao = processosValidos.filter(
    (p) => p.status !== 'EMBARCADO' && p.status !== 'CONCLUIDO'
  );

  let volumeTotalTon = 0;
  for (const p of processosValidos) {
    const kg = Number(p.volumeKg) || 0;
    volumeTotalTon += (kg / 1000);
  }

  // AGORA SIM: Somando o valor de TODOS os processos válidos.
  // Quem não tem valor declarado (null ou 0) vai somar zero e não vai atrapalhar a conta.
  let valorEmOperacaoUsd = 0;
  for (const p of processosValidos) {
    const kg = Number(p.volumeKg) || 0;
    const ton = kg / 1000;
    const precoUnitario = Number(p.valorDeclaradoUsd) || 0;
    
    valorEmOperacaoUsd += (ton * precoUnitario);
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const proximo = processosValidos.find((p) => {
    if (!p.deadlineEmbarque) return false;
    if (p.status === 'EMBARCADO' || p.status === 'CONCLUIDO') return false; 
    return p.deadlineEmbarque >= hoje;
  }) ?? null;

  const processosRecentes = [...processosValidos]
    .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Painel de exportação</h2>
        <Link
          href="/negociacoes/nova"
          className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-100"
        >
          + Nova negociação
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-6">
        <KpiCard label="Volume Total (t)" value={formatNum(volumeTotalTon, 3)} />
        <KpiCard label="Valor em Operação" value={formatCurrency(valorEmOperacaoUsd)} />
        <KpiCard label="Em Execução" value={processosEmExecucao.length} />
        <KpiCard label="Embarcados" value={processosEmbarcados.length} />
      </div>

      {proximo && (
        <div className="bg-[#1a365d] text-white rounded-2xl p-8 mb-6 relative overflow-hidden shadow-sm">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full text-xs font-semibold mb-5">
            Próximo deadline
          </div>
          <div className="text-2xl font-bold mb-1">{proximo.clienteFinal}</div>
          <div className="text-sm text-gray-300 mb-6">
            {proximo.numeroProcesso} · {proximo.produto} ·{' '}
            {formatNum(Number(proximo.volumeKg) / 1000, 3)} TON
          </div>
          <div className="grid grid-cols-3 gap-5 border-t border-white/10 pt-5">
            <Info label="Booking" value={proximo.bookingNumero ?? '-'} />
            <Info label="Data limite" value={formatDateBR(proximo.deadlineEmbarque)} />
            <Info label="Navio" value={proximo.navio ?? '-'} />
          </div>
          {proximo.deadlineEmbarque && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/10 rounded-2xl px-6 py-5 text-center">
              <div className="text-5xl font-extrabold leading-none">
                {getDaysLeft(proximo.deadlineEmbarque)}
              </div>
              <div className="text-xs uppercase tracking-wide text-gray-200 mt-1">Dias restantes</div>
            </div>
          )}
        </div>
      )}

      <h3 className="text-lg font-semibold mb-4">Processos recentes</h3>
      <NegotiationTable 
          processos={processosRecentes.map(p => ({ 
            ...p, 
            volumeKg: Number(p.volumeKg), 
            valorDeclaradoUsd: p.valorDeclaradoUsd ? Number(p.valorDeclaradoUsd) : null 
          })) as any} 
        />
    </div>
  );
}

function KpiCard({ label, value, warn = false }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
      <h4 className="text-gray-500 text-sm font-medium mb-2.5">{label}</h4>
      <div className={`text-2xl font-bold ${warn ? 'text-warning' : 'text-gray-900'}`}>{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs uppercase text-gray-400 tracking-wide mb-1">{label}</label>
      <span className="text-base font-semibold">{value}</span>
    </div>
  );
}