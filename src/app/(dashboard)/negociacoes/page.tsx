import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { NegotiationTable } from '@/components/negociacoes/NegotiationTable';

export const dynamic = 'force-dynamic';

export default async function NegociacoesPage() {
  const processos = await prisma.processo.findMany({
    include: { 
      etapas: true,
      containers: true,
      financeiro: {
        include: {
          travamentos: true,
          custos: true,
        },
      },
    },
    orderBy: { criadoEm: 'desc' },
  });

  // Converte e calcula métricas financeiras de cada processo para o Mini-DRE e o Drawer
  const processosFormatados = processos.map((p) => {
    const volumeKg = Number(p.volumeKg);
    const valorDeclaradoUsd = p.valorDeclaradoUsd ? Number(p.valorDeclaradoUsd) : null;

    // Métricas Financeiras
    const fin = p.financeiro;
    const precoUsd = fin ? Number(fin.precoUsd) : (valorDeclaradoUsd || 0);
    const pesoLiquidoTotalKg = p.containers.reduce((acc, c) => acc + (c.pesoLiquido ? Number(c.pesoLiquido) : 0), 0);
    const pesoFinalKg = pesoLiquidoTotalKg > 0 ? pesoLiquidoTotalKg : volumeKg;
    const pesoFinalTon = pesoFinalKg / 1000;
    const valorTotalUsd = pesoFinalTon * precoUsd;

    const travamentos = fin?.travamentos || [];
    const totalUsdTravado = travamentos.reduce((acc, t) => acc + Number(t.valorUsdParcial), 0);
    const saldoUsdParaTravar = Math.max(0, valorTotalUsd - totalUsdTravado);

    let somatorioReaisTravados = 0;
    for (const t of travamentos) {
      somatorioReaisTravados += Number(t.valorUsdParcial) * Number(t.ptax);
    }
    const ptaxMedia = totalUsdTravado > 0 ? somatorioReaisTravados / totalUsdTravado : 0;
    const receitaBrutaBRL = totalUsdTravado * ptaxMedia;

    const custos = fin?.custos || [];
    const totalCustosBRL = custos.reduce((acc, c) => acc + Number(c.valor), 0);
    const resultadoOperacionalBRL = receitaBrutaBRL - totalCustosBRL;
    const margemLucro = receitaBrutaBRL > 0 ? (resultadoOperacionalBRL / receitaBrutaBRL) * 100 : 0;

    const containersPreenchidos = p.containers.filter((c) => Boolean(c.numeroContainer?.trim())).length;

    return {
      ...p,
      volumeKg,
      valorDeclaradoUsd,
      metricasFinanceiras: {
        valorTotalUsd,
        totalUsdTravado,
        saldoUsdParaTravar,
        ptaxMedia,
        receitaBrutaBRL,
        totalCustosBRL,
        resultadoOperacionalBRL,
        margemLucro,
        statusRecebimento: fin?.statusRecebimento || 'A_RECEBER',
        bancoDestino: fin?.bancoDestino || 'BB BRASIL',
      },
      containersPreenchidos,
      containersTotal: p.containers.length,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Todas as negociações</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Acompanhe status, logística marítima e mini-DRE financeiro em tempo real.
          </p>
        </div>
        <Link
          href="/negociacoes/nova"
          className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#e0751b] shadow-2xs transition-colors"
        >
          + Nova negociação
        </Link>
      </div>
      <NegotiationTable processos={processosFormatados as any} />
    </div>
  );
}