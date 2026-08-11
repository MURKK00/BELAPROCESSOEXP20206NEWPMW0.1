import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { NegotiationTable } from '@/components/negociacoes/NegotiationTable';
import { getDaysLeft } from '@/lib/workflow';
import { formatNum, formatInt, formatDateBR } from '@/lib/formatters';

export default async function DashboardPage() {
  const processos = await prisma.processo.findMany({
    include: { etapas: true },
    orderBy: { deadlineEmbarque: 'asc' },
  });

  const volumeTotalTon = processos.reduce((sum, p) => sum + Number(p.volumeKg), 0) / 1000;
  const totalEtapas = processos.reduce((sum, p) => sum + p.etapas.length, 0);
  const etapasConcluidas = processos.reduce(
    (sum, p) => sum + p.etapas.filter((e) => e.status === 'CONCLUIDA').length,
    0
  );
  const proximo = processos.find((p) => p.deadlineEmbarque) ?? null;

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
        <KpiCard label="Processos ativos" value={processos.length} />
        <KpiCard label="Volume (t)" value={formatNum(volumeTotalTon, 3)} />
        <KpiCard
          label="Etapas concluídas"
          value={`${etapasConcluidas}/${totalEtapas || 0}`}
        />
        <KpiCard
          label="Docs pendentes"
          value={processos.filter((p) => p.etapas.some((e) => e.status === 'BLOQUEADA')).length}
          warn
        />
      </div>

      {proximo && (
        <div className="bg-[#1a365d] text-white rounded-2xl p-8 mb-6 relative overflow-hidden">
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
          processos={processos.slice(0, 5).map(p => ({ 
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
    <div className="bg-surface border border-border rounded-xl p-5">
      <h4 className="text-gray-500 text-sm font-medium mb-2.5">{label}</h4>
      <div className={`text-2xl font-bold ${warn ? 'text-warning' : ''}`}>{value}</div>
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
