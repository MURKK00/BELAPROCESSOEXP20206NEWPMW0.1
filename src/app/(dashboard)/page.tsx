export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { NegotiationTable } from '@/components/negociacoes/NegotiationTable';
import { getDaysLeft } from '@/lib/workflow';
import { formatNum, formatDateBR } from '@/lib/formatters';

export default async function DashboardPage() {
  const processos = await prisma.processo.findMany({
    include: {
      etapas: true,
      containers: true,
      financeiro: {
        include: {
          travamentos: true,
        },
      },
    },
    orderBy: { deadlineEmbarque: 'asc' }, 
  });

  const processosValidos = processos.filter(
    (p) => p.status !== 'CANCELADO'
  );

  const processosEmbarcados = processosValidos.filter((p) => p.status === 'EMBARCADO');
  
  const processosEmExecucao = processosValidos.filter(
    (p) => p.status !== 'EMBARCADO' && p.status !== 'FINALIZADO'
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

  // CÁLCULO FINANCEIRO CONSOLIDADO (RECEBIMENTO BANCÁRIO VS. TRAVAS CAMBIAIS)
  let pendingRecebimentoUsd = 0;
  let countPendingRecebimento = 0;
  let saldoCambialAbertoUsd = 0;
  let totalUsdTravadoGeral = 0;

  for (const p of processosValidos) {
    const fin = p.financeiro;
    const statusRec = fin?.statusRecebimento || 'A_RECEBER';

    // Prioriza o peso líquido real dos containers se preenchido, senão o volume contratado
    const pesoLiquidoContainers = (p.containers || []).reduce(
      (acc: number, c: any) => acc + (c.pesoLiquido ? Number(c.pesoLiquido.toString()) : 0),
      0
    );
    const pesoKg = pesoLiquidoContainers > 0 ? pesoLiquidoContainers : Number(p.volumeKg) || 0;
    const pesoTon = pesoKg / 1000;

    // Preço unitário configurado no financeiro ou declarado no processo
    const precoUnit = fin?.precoUsd ? Number(fin.precoUsd.toString()) : Number(p.valorDeclaradoUsd) || 0;
    const valorProcessoUsd = pesoTon * precoUnit;

    // Travamentos cambiais vinculados
    const travamentos = fin?.travamentos || [];
    const travadoUsd = travamentos.reduce((acc, t) => acc + Number(t.valorUsdParcial), 0);
    totalUsdTravadoGeral += travadoUsd;

    const saldoAbertoProcesso = Math.max(0, valorProcessoUsd - travadoUsd);
    saldoCambialAbertoUsd += saldoAbertoProcesso;

    // Se ainda não foi baixado como RECEBIDO no banco
    if (statusRec === 'A_RECEBER') {
      countPendingRecebimento++;
      pendingRecebimentoUsd += valorProcessoUsd;
    }
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const proximo = processosValidos.find((p) => {
    if (!p.deadlineEmbarque) return false;
    if (p.status === 'EMBARCADO' || p.status === 'FINALIZADO') return false; 
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
        <KpiCard label="Volume Total (t)" value={formatNum(volumeTotalTon, 3)} />
        <KpiCard label="Valor em Operação" value={formatCurrency(valorEmOperacaoUsd)} />
        <KpiCard
          label="Pending FX (Câmbio Aberto)"
          value={formatCurrency(saldoCambialAbertoUsd)}
          subtext={
            saldoCambialAbertoUsd <= 0.01
              ? '100% do câmbio fixado/travado'
              : `${formatCurrency(totalUsdTravadoGeral)} já travados`
          }
          accent={saldoCambialAbertoUsd <= 0.01 ? 'emerald' : 'amber'}
        />
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

function KpiCard({
  label,
  value,
  subtext,
  warn = false,
  accent,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  warn?: boolean;
  accent?: 'emerald' | 'amber' | 'blue';
}) {
  const accentBorder =
    accent === 'emerald'
      ? 'border-emerald-300/80 bg-emerald-50/30'
      : accent === 'amber'
      ? 'border-amber-300/80 bg-amber-50/30'
      : 'border-border bg-surface';
  const accentValue =
    accent === 'emerald'
      ? 'text-emerald-700'
      : accent === 'amber'
      ? 'text-amber-800'
      : warn
      ? 'text-warning'
      : 'text-gray-900';

  return (
    <div className={`border rounded-xl p-5 shadow-sm transition-all ${accentBorder}`}>
      <h4 className="text-gray-500 text-sm font-medium mb-2.5 flex items-center justify-between">
        <span>{label}</span>
        {accent === 'emerald' && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
        )}
        {accent === 'amber' && (
          <span className="w-2 h-2 rounded-full bg-amber-500 ring-4 ring-amber-100" />
        )}
      </h4>
      <div className={`text-2xl font-bold ${accentValue}`}>{value}</div>
      {subtext && <div className="text-[11px] text-gray-500 font-medium mt-1">{subtext}</div>}
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