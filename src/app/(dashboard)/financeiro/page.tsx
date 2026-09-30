export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { FinanceiroDashboardClient, type FinanceiroProcessoItem, type FinanceiroCustoItem } from '@/components/financeiro/FinanceiroDashboardClient';
import { serializeDecimals } from '@/lib/serialize';
import { parseTravamentoInfo } from '@/lib/travamentoHelper';

const CATEGORIAS_CUSTO_LABELS: Record<string, string> = {
  COMPRA: 'Compra Grãos/Matéria-Prima',
  BENEFICIAMENTO: 'Beneficiamento & Limpeza',
  SACARIA: 'Sacaria & Embalagens',
  FRETE_TERRESTRE: 'Frete Rodoviário',
  FRETE_MARITIMO: 'Frete Marítimo Internacional',
  TARIFA_ARMADOR_PORTO: 'Tarifas Armador & Porto',
  SERVICO_ESTUFF: 'Estufagem & REDEX',
  COMISSAO: 'Comissão Corretagem',
  OUTROS_CUSTOS: 'Outros Custos Aduaneiros',
  COMPRA_MATERIA_PRIMA: 'Compra Matéria Prima',
  ESTUFAGEM_REDEX: 'Estufagem Redex',
  COMISSAO_INTERMEDIACAO: 'Comissão Intermediação',
  OUTROS: 'Outros',
};

export default async function FinanceiroPage() {
  const processos = await prisma.processo.findMany({
    where: {
      status: { not: 'CANCELADO' },
    },
    include: {
      containers: true,
      financeiro: {
        include: {
          travamentos: true,
          custos: true,
        },
      },
    },
    orderBy: {
      criadoEm: 'desc',
    },
  });

  const processosFormatados: FinanceiroProcessoItem[] = processos.map((p) => {
    const fin = p.financeiro;
    const containers = p.containers || [];

    // Peso Líquido Real dos Containers (definido na estufagem/documento) ou Contratado inicial
    const pesoLiquidoTotalKg = containers.reduce(
      (acc, c) => acc + (c.pesoLiquido ? Number(c.pesoLiquido.toString()) : 0),
      0
    );
    const temContainersPreenchidos = pesoLiquidoTotalKg > 0;
    const volumeKg = temContainersPreenchidos ? pesoLiquidoTotalKg : Number(p.volumeKg.toString()) || 0;
    const volumeTon = volumeKg / 1000;

    // Preço unitário configurado ou declarado no processo
    const precoUsd = fin?.precoUsd ? Number(fin.precoUsd.toString()) : Number(p.valorDeclaradoUsd) || 0;
    const valorTotalUsd = volumeTon * precoUsd;

    // Travamentos Cambiais
    const travamentos = fin?.travamentos || [];
    const totalUsdTravado = travamentos.reduce(
      (acc, t) => acc + Number(t.valorUsdParcial.toString()),
      0
    );
    const saldoUsdParaTravar = Math.max(0, valorTotalUsd - totalUsdTravado);

    let somatorioReaisTravados = 0;
    let somatorioTaxas = 0;
    for (const t of travamentos) {
      const usd = Number(t.valorUsdParcial.toString());
      const ptax = Number(t.ptax.toString());
      const parsed = parseTravamentoInfo(t);
      const taxaEmBrl = parsed.moedaTaxa === 'USD' ? parsed.taxa * ptax : parsed.taxa;
      somatorioReaisTravados += usd * ptax;
      somatorioTaxas += taxaEmBrl;
    }
    const ptaxMedia = totalUsdTravado > 0 ? somatorioReaisTravados / totalUsdTravado : 0;
    const receitaBrutaBRL = somatorioReaisTravados;
    const totalTaxasBRL = somatorioTaxas;
    const receitaLiquidaBRL = totalTaxasBRL > 0 ? (receitaBrutaBRL - totalTaxasBRL) : receitaBrutaBRL;

    // Custos Operacionais
    const custos = fin?.custos || [];
    const totalCustosBRL = custos.reduce((acc, c) => acc + Number(c.valor.toString()), 0);

    const custosFormatados: FinanceiroCustoItem[] = custos.map((c) => ({
      categoria: c.categoria,
      categoriaLabel: CATEGORIAS_CUSTO_LABELS[c.categoria] || c.categoria,
      valor: Number(c.valor.toString()) || 0,
    }));

    const resultadoOperacionalBRL = receitaLiquidaBRL - totalCustosBRL;
    const margemLucro = receitaLiquidaBRL > 0 ? (resultadoOperacionalBRL / receitaLiquidaBRL) * 100 : 0;

    // Cálculo Proporcional (Margem Real da Parcela Já Travada)
    const proporcaoTravada = valorTotalUsd > 0 ? Math.min(1, totalUsdTravado / valorTotalUsd) : 0;
    const custoProporcionalTravado = totalCustosBRL * proporcaoTravada;
    const resultadoTravadoBRL = receitaLiquidaBRL - custoProporcionalTravado;
    const margemTravada = receitaLiquidaBRL > 0 ? (resultadoTravadoBRL / receitaLiquidaBRL) * 100 : 0;

    // Projeção Total (100% da Carga com o restante na PTAX média ou base de mercado 5.45)
    const ptaxRef = ptaxMedia > 0 ? ptaxMedia : 5.45;
    const receitaSaldoAbertoBRL = saldoUsdParaTravar * ptaxRef;
    const receitaProjetadaTotalBRL = receitaLiquidaBRL + receitaSaldoAbertoBRL;
    const resultadoProjetadoTotalBRL = receitaProjetadaTotalBRL - totalCustosBRL;
    const margemProjetadaTotal = receitaProjetadaTotalBRL > 0 ? (resultadoProjetadoTotalBRL / receitaProjetadaTotalBRL) * 100 : 0;

    return {
      id: p.id,
      numeroProcesso: p.numeroProcesso,
      clienteFinal: p.clienteFinal,
      produto: p.produto,
      status: p.status,
      volumeTon,
      volumeKg,
      temContainersPreenchidos,
      precoUsd,
      valorTotalUsd,
      totalUsdTravado,
      saldoUsdParaTravar,
      ptaxMedia,
      receitaBrutaBRL,
      totalTaxasBRL,
      receitaLiquidaBRL,
      totalCustosBRL,
      resultadoOperacionalBRL,
      margemLucro,
      proporcaoTravada,
      custoProporcionalTravado,
      resultadoTravadoBRL,
      margemTravada,
      receitaProjetadaTotalBRL,
      resultadoProjetadoTotalBRL,
      margemProjetadaTotal,
      bancoDestino: fin?.bancoDestino || 'BB BRASIL',
      statusRecebimento: fin?.statusRecebimento || 'A_RECEBER',
      dataRecebimento: fin?.dataRecebimento ? new Date(fin.dataRecebimento).toLocaleDateString('pt-BR') : null,
      financeiroId: fin?.id,
      travamentosCount: travamentos.length,
      custosCount: custos.length,
      custos: custosFormatados,
    };
  });

  return <FinanceiroDashboardClient processos={serializeDecimals(processosFormatados)} />;
}
