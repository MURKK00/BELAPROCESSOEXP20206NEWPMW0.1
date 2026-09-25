export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getDaysLeft } from '@/lib/workflow';
import { formatNum, formatDateBR } from '@/lib/formatters';
import { Scale, DollarSign, Clock, Ship } from 'lucide-react';

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
  let valorEmOperacaoUsd = 0;

  for (const p of processosValidos) {
    const fin = p.financeiro;
    // Volume Real dos Containers (se estufados/preenchidos) ou Volume Contratado inicial
    const pesoLiquidoContainers = (p.containers || []).reduce(
      (acc: number, c: any) => acc + (c.pesoLiquido ? Number(c.pesoLiquido.toString()) : 0),
      0
    );
    const pesoKg = pesoLiquidoContainers > 0 ? pesoLiquidoContainers : Number(p.volumeKg) || 0;
    const pesoTon = pesoKg / 1000;
    volumeTotalTon += pesoTon;

    const precoUnitario = fin?.precoUsd ? Number(fin.precoUsd.toString()) : Number(p.valorDeclaradoUsd) || 0;
    valorEmOperacaoUsd += (pesoTon * precoUnitario);
  }

  // CÁLCULO FINANCEIRO CONSOLIDADO (RECEBIMENTO BANCÁRIO VS. TRAVAS CAMBIAIS)
  let pendingRecebimentoUsd = 0;
  let countPendingRecebimento = 0;
  let saldoCambialAbertoUsd = 0;
  let totalUsdTravadoGeral = 0;

  for (const p of processosValidos) {
    const fin = p.financeiro;
    const statusRec = fin?.statusRecebimento || 'A_RECEBER';

    const pesoLiquidoContainers = (p.containers || []).reduce(
      (acc: number, c: any) => acc + (c.pesoLiquido ? Number(c.pesoLiquido.toString()) : 0),
      0
    );
    const pesoKg = pesoLiquidoContainers > 0 ? pesoLiquidoContainers : Number(p.volumeKg) || 0;
    const pesoTon = pesoKg / 1000;

    const precoUnit = fin?.precoUsd ? Number(fin.precoUsd.toString()) : Number(p.valorDeclaradoUsd) || 0;
    const valorProcessoUsd = pesoTon * precoUnit;

    const travamentos = fin?.travamentos || [];
    const travadoUsd = travamentos.reduce((acc, t) => acc + Number(t.valorUsdParcial), 0);
    totalUsdTravadoGeral += travadoUsd;

    const saldoAbertoProcesso = Math.max(0, valorProcessoUsd - travadoUsd);
    saldoCambialAbertoUsd += saldoAbertoProcesso;

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

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Visão Geral</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhamento executivo de volumes, câmbio e operações em andamento.
          </p>
        </div>
        <Link
          href="/negociacoes/nova"
          className="inline-flex items-center gap-2 bg-[#f58220] hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all self-start sm:self-auto"
        >
          <span>+ Nova Negociação</span>
        </Link>
      </div>

      {/* CARDS SUPERIORES ESTILIZADOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. VOLUME TOTAL */}
        <div className="flex items-center gap-3.5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-4.5 shadow-2xs transition-all hover:shadow-md hover:border-amber-500/40">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Volume Total
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNum(volumeTotalTon, 3)}
              </span>
              <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">Ton</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              {(volumeTotalTon * 1000).toLocaleString('pt-BR')} kg faturado
            </span>
          </div>
        </div>

        {/* 2. VALOR EM OPERAÇÃO */}
        <div className="flex items-center gap-3.5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl p-4.5 shadow-2xs transition-all hover:shadow-md hover:border-emerald-500/40">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Valor em Operação
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(valorEmOperacaoUsd)}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-medium">
              Portfólio ativo em USD
            </span>
          </div>
        </div>

        {/* 3. EM EXECUÇÃO */}
        <div className="flex items-center gap-3.5 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 dark:border-blue-500/30 rounded-2xl p-4.5 shadow-2xs transition-all hover:shadow-md hover:border-blue-500/40">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Em Execução
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {processosEmExecucao.length}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">processos</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              Fase operacional ativa
            </span>
          </div>
        </div>

        {/* 4. EMBARCADOS */}
        <div className="flex items-center gap-3.5 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/20 dark:border-cyan-500/30 rounded-2xl p-4.5 shadow-2xs transition-all hover:shadow-md hover:border-cyan-500/40">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
            <Ship className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Embarcados
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {processosEmbarcados.length}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">cargas</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              Em trânsito marítimo
            </span>
          </div>
        </div>
      </div>

      {/* PRÓXIMO DEADLINE */}
      {proximo && (
        <div className="bg-gradient-to-br from-[#1a365d] to-[#0f2444] text-white rounded-2xl p-7 relative overflow-hidden shadow-lg border border-blue-900/40">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Próximo deadline de embarque</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mb-1 tracking-tight">{proximo.clienteFinal}</div>
          <div className="text-sm text-slate-300 mb-6">
            {proximo.numeroProcesso} · {proximo.produto} ·{' '}
            <strong className="text-white">{formatNum(Number(proximo.volumeKg) / 1000, 3)} TON</strong>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-t border-white/10 pt-5">
            <Info label="Booking" value={proximo.bookingNumero ?? '-'} />
            <Info label="Data limite" value={formatDateBR(proximo.deadlineEmbarque)} />
            <Info label="Navio" value={proximo.navio ?? '-'} />
          </div>
          {proximo.deadlineEmbarque && (
            <div className="hidden sm:block absolute right-8 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-5 text-center border border-white/15">
              <div className="text-5xl font-black leading-none tracking-tight">
                {getDaysLeft(proximo.deadlineEmbarque)}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-300 mt-1 font-bold">Dias restantes</div>
            </div>
          )}
        </div>
      )}
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