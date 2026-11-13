import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { NegotiationTable } from '@/components/negociacoes/NegotiationTable';
import { serializeDecimals } from '@/lib/serialize';
import { parseRecebimentoProformaInfo } from '@/lib/proformaHelper';
import { calcularPesoEValorContratoUsd } from '@/lib/numeroBR';

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
    const {
      temContainersPreenchidos,
      pesoFinalKg,
      pesoFinalTon,
      precoUnitarioUsd: precoUsd,
      valorTotalUsd,
    } = calcularPesoEValorContratoUsd({
      containers: p.containers,
      volumeKgContratado: p.volumeKg,
      precoUsdFinanceiro: fin?.precoUsd,
      valorDeclaradoUsd,
    });

    const proformaInfo = parseRecebimentoProformaInfo(fin?.bancoDestino, fin?.statusRecebimento, fin?.dataRecebimento, valorTotalUsd);
    const valorLiquidoTotalUsd = proformaInfo.totalLiquidoUsd > 0 ? proformaInfo.totalLiquidoUsd : valorTotalUsd;

    const travamentos = fin?.travamentos || [];
    const totalUsdTravado = travamentos.reduce((acc, t) => acc + Number(t.valorUsdParcial), 0);
    const saldoUsdParaTravar = Math.max(0, valorLiquidoTotalUsd - totalUsdTravado);

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

    const containersSerialized = p.containers.map((c) => ({
      id: c.id,
      ordem: c.ordem,
      numeroContainer: c.numeroContainer || '',
      lacre: c.lacre || '',
      pesoBruto: c.pesoBruto ? Number(c.pesoBruto) : 0,
      pesoLiquido: c.pesoLiquido ? Number(c.pesoLiquido) : 0,
      totalSacos: c.totalSacos ?? 0,
      tara: c.tara ? Number(c.tara) : 0,
    }));

    const custosSerialized = custos.map((c) => ({
      id: c.id,
      categoria: c.categoria,
      valor: Number(c.valor),
    }));

    // Omitimos financeiro e containers brutos (que contêm objetos Decimal do Prisma)
    const { financeiro: _fin, containers: _con, ...restoDoProcesso } = p;

    return {
      ...restoDoProcesso,
      deadlineEmbarque: p.deadlineEmbarque || p.deadlineCarga || null,
      deadlineCarga: p.deadlineCarga || p.deadlineEmbarque || null,
      deadlineDraftBl: p.deadlineDraftBl || null,
      deadlineDraftVgm: p.deadlineDraftVgm || null,
      volumeKg: pesoFinalKg,
      volumeTon: pesoFinalTon,
      volumeInicialContratadoKg: volumeKg,
      temContainersPreenchidos,
      valorDeclaradoUsd,
      containers: containersSerialized,
      custos: custosSerialized,
      metricasFinanceiras: {
        precoUsd,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Todas as Negociações</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe status, logística marítima e mini-DRE financeiro em tempo real.
          </p>
        </div>
        <Link
          href="/negociacoes/nova"
          className="inline-flex items-center gap-2 bg-[#f58220] hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all self-start sm:self-auto"
        >
          <span>+ Nova Negociação</span>
        </Link>
      </div>
      <NegotiationTable processos={serializeDecimals(processosFormatados) as any} />
    </div>
  );
}