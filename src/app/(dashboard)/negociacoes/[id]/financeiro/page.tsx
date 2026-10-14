import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { deletarTravamentoAction } from '@/server/actions/financeiroActions';
import { formatNum } from '@/lib/formatters';
import { CategoriaCusto } from '@prisma/client';
import { DRECustosManager } from '@/components/financeiro/DRECustosManager';
import { BancoStatusConfig } from '@/components/financeiro/BancoStatusConfig';
import { DREExportButtons } from '@/components/financeiro/DREExportButtons';
import { SimuladorCambio } from '@/components/financeiro/SimuladorCambio';
import { FormLancarTrava } from '@/components/financeiro/FormLancarTrava';
import { TabelaTravamentos } from '@/components/financeiro/TabelaTravamentos';
import { parseTravamentoInfo } from '@/lib/travamentoHelper';
import { parseRecebimentoProformaInfo } from '@/lib/proformaHelper';
import { Info, CheckCircle2, Clock } from 'lucide-react';

const CATEGORIAS_LABELS: Record<CategoriaCusto, string> = {
  COMPRA: 'Compra',
  BENEFICIAMENTO: 'Beneficiamento',
  SACARIA: 'Sacaria',
  FRETE_TERRESTRE: 'Frete Terrestre',
  FRETE_MARITIMO: 'Frete Marítimo',
  TARIFA_ARMADOR_PORTO: 'Tarifa Armador / Porto',
  SERVICO_ESTUFF: 'Serviço Estuff',
  COMISSAO: 'Comissão',
  OUTROS_CUSTOS: 'Outros Custos',
  COMPRA_MATERIA_PRIMA: 'Compra Matéria Prima',
  ESTUFAGEM_REDEX: 'Estufagem Redex',
  COMISSAO_INTERMEDIACAO: 'Comissão Intermediação',
  OUTROS: 'Outros'
};

export default async function FinanceiroNegociacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      containers: true,
      financeiro: {
        include: { travamentos: true, custos: true }
      }
    }
  });

  if (!processo) notFound();

  let financeiro = processo.financeiro;
  if (!financeiro) {
    financeiro = await prisma.financeiro.create({
      data: { processoId: processo.id, precoUsd: processo.valorDeclaradoUsd || 0, bancoDestino: 'BB BRASIL', statusRecebimento: 'A_RECEBER' },
      include: { travamentos: true, custos: true }
    });
  }

  // Peso Real (Net Weight)
  const pesoLiquidoTotalKg = processo.containers.reduce((acc, c) => acc + (c.pesoLiquido ? Number(c.pesoLiquido.toString()) : 0), 0);
  const pesoFinalKg = pesoLiquidoTotalKg > 0 ? pesoLiquidoTotalKg : Number(processo.volumeKg.toString());
  const pesoFinalTon = pesoFinalKg / 1000;

  // Receita Total USD
  const precoUnitarioUsd = Number(financeiro.precoUsd.toString());
  const valorTotalUsd = pesoFinalTon * precoUnitarioUsd;

  // Informações de Recebimento, Taxas Bancárias e Conta
  const proformaInfo = parseRecebimentoProformaInfo(
    financeiro.bancoDestino,
    financeiro.statusRecebimento,
    financeiro.dataRecebimento,
    valorTotalUsd
  );
  const isBBAmerica = proformaInfo.bancoLimpo === 'BB AMERICA';

  // O valor total em USD que efetivamente entra na conta e deve ser travado é o LÍQUIDO (descontadas as taxas bancárias do recebimento)
  const valorLiquidoTotalUsd = proformaInfo.totalLiquidoUsd > 0 ? proformaInfo.totalLiquidoUsd : valorTotalUsd;

  // Travamentos Cambiais (A trava considera estritamente o valor do dólar líquido)
  const totalUsdTravado = financeiro.travamentos.reduce((acc, t) => acc + Number(t.valorUsdParcial.toString()), 0);
  const saldoUsdParaTravar = Math.max(0, valorLiquidoTotalUsd - totalUsdTravado);

  let somatorioReaisBruto = 0;
  for (const t of financeiro.travamentos) {
    const usd = Number(t.valorUsdParcial.toString());
    const ptax = Number(t.ptax.toString());
    somatorioReaisBruto += usd * ptax;
  }

  const ptaxMedia = totalUsdTravado > 0 ? somatorioReaisBruto / totalUsdTravado : 0;
  const receitaBrutaBRL = somatorioReaisBruto;

  // A taxa é sempre do recebimento (tarifa de ordem/swift descontada do recebimento)
  const taxaRecebimentoUsd = proformaInfo.totalTaxasUsd;
  const taxaRecebimentoBRL = taxaRecebimentoUsd * (ptaxMedia > 0 ? ptaxMedia : 5.2);
  const totalTaxasBRL = taxaRecebimentoBRL;

  // CÂMBIO LÍQUIDO TOTAL: deduz a taxa bancária do recebimento da receita
  const receitaLiquidaBRL = Math.max(0, receitaBrutaBRL - totalTaxasBRL);

  // Custos e DRE
  const custosMap = new Map(financeiro.custos.map(c => [c.categoria, Number(c.valor.toString())]));
  const categoriasPrincipais: CategoriaCusto[] = ['COMPRA', 'BENEFICIAMENTO', 'SACARIA', 'FRETE_TERRESTRE', 'FRETE_MARITIMO', 'TARIFA_ARMADOR_PORTO', 'SERVICO_ESTUFF', 'COMISSAO', 'OUTROS_CUSTOS'];
  const totalCustosBRL = Array.from(custosMap.entries()).filter(([cat]) => categoriasPrincipais.includes(cat as CategoriaCusto)).reduce((acc, [, val]) => acc + val, 0);

  // O resultado operacional líquido é a receita líquida de câmbio menos os custos operacionais:
  const resultadoOperacionalBRL = receitaLiquidaBRL - totalCustosBRL;
  const margemLucro = receitaLiquidaBRL > 0 ? (resultadoOperacionalBRL / receitaLiquidaBRL) * 100 : 0;

  const formatCurrencyUSD = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatCurrencyBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      
      {/* BALÃO DE DESTAQUE NO TOPO COM EXPORTAÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-gray-900">Demonstrativo Financeiro (DRE)</h2>
          <p className="text-xs text-gray-500">Acompanhamento consolidado de câmbio líquido, margem e custos operacionais.</p>
        </div>
        <DREExportButtons
          processo={{
            id: processo.id,
            numeroProcesso: processo.numeroProcesso,
            clienteFinal: processo.clienteFinal,
            produto: processo.produto,
            volumeKg: String(processo.volumeKg),
            incoterm: processo.incoterm,
            portoOrigem: processo.portoOrigem,
            portoDestino: processo.portoDestino,
          }}
          financeiro={{
            precoUsd: precoUnitarioUsd,
            bancoDestino: financeiro.bancoDestino,
            statusRecebimento: financeiro.statusRecebimento,
            dataRecebimento: financeiro.dataRecebimento,
          }}
          metricas={{
            pesoFinalTon,
            pesoFinalKg,
            precoUnitarioUsd,
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
          }}
          travamentos={financeiro.travamentos.map((t) => {
            const valUsd = Number(t.valorUsdParcial.toString());
            const valPtax = Number(t.ptax.toString());
            const parsed = parseTravamentoInfo(t);
            return {
              dataTravamento: t.dataTravamento,
              valorUsdParcial: valUsd,
              ptax: valPtax,
              taxa: parsed.taxa,
              valorLiquido: parsed.valorLiquido,
              observacao: parsed.observacaoLimpa,
            };
          })}
          custos={Array.from(custosMap.entries())
            .filter(([cat]) => categoriasPrincipais.includes(cat as CategoriaCusto))
            .map(([cat, val]) => ({
              categoria: cat,
              categoriaLabel: CATEGORIAS_LABELS[cat as CategoriaCusto] || cat,
              valor: val,
            }))}
        />
      </div>

      {/* BALÃO DE DESTAQUE NO TOPO (RESULTADO LÍQUIDO) */}
      <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 ${resultadoOperacionalBRL >= 0 ? 'bg-gradient-to-r from-emerald-900 to-teal-900 text-white border-emerald-700' : 'bg-gradient-to-r from-red-900 to-rose-900 text-white border-red-700'}`}>
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold opacity-80">Resultado Líquido da Operação (DRE)</span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              proformaInfo.statusGeral === 'RECEBIDO'
                ? 'bg-emerald-400 text-emerald-950'
                : proformaInfo.statusGeral === 'PROFORMA_RECEBIDA'
                ? 'bg-blue-300 text-blue-950'
                : 'bg-amber-300 text-amber-950'
            }`}>
              {proformaInfo.statusGeral === 'RECEBIDO' ? '✓ Recebido' : proformaInfo.statusGeral === 'PROFORMA_RECEBIDA' ? '⚡ Entrada Recebida' : '⏳ A Receber'}
            </span>
          </div>
          <div className="text-3xl font-extrabold">{formatCurrencyBRL(resultadoOperacionalBRL)}</div>
          <span className="text-xs opacity-90 mt-1 block">
            Margem de Lucro: <strong>{margemLucro.toFixed(2)}%</strong> {totalUsdTravado < valorLiquidoTotalUsd - 0.01 ? '(⚠️ Câmbio Parcial Travado)' : '(🔒 Câmbio 100% Fechado)'}
          </span>
        </div>
        <div className="flex gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm text-sm flex-wrap items-center">
          <div>
            <span className="block text-xs opacity-70 uppercase">Receita Bruta (BRL)</span>
            <strong className="text-base">{formatCurrencyBRL(receitaBrutaBRL)}</strong>
          </div>
          {totalTaxasBRL > 0 && (
            <div className="border-l border-white/20 pl-4">
              <span className="block text-xs opacity-70 uppercase">(-) Taxas Recebimento</span>
              <strong className="text-base text-rose-300">-{formatCurrencyBRL(totalTaxasBRL)}</strong>
            </div>
          )}
          <div className="border-l border-white/20 pl-4">
            <span className="block text-xs opacity-70 uppercase">(=) Câmbio Líquido</span>
            <strong className="text-base text-emerald-200">{formatCurrencyBRL(receitaLiquidaBRL)}</strong>
          </div>
          <div className="border-l border-white/20 pl-4">
            <span className="block text-xs opacity-70 uppercase">Total Custos (BRL)</span>
            <strong className="text-base">{formatCurrencyBRL(totalCustosBRL)}</strong>
          </div>
          <div className="border-l border-white/20 pl-4 flex flex-col justify-center">
            <span className="block text-xs opacity-70 uppercase">Status Pagamento</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {proformaInfo.statusGeral === 'RECEBIDO' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-400 text-emerald-950">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Recebido
                </span>
              ) : proformaInfo.statusGeral === 'PROFORMA_RECEBIDA' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-300 text-blue-950">
                  <Clock className="w-3.5 h-3.5" /> Entrada Recebida
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-300 text-amber-950">
                  <Clock className="w-3.5 h-3.5" /> A Receber
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RESUMO DO CONTRATO + BANCO E STATUS AUTOMÁTICOS */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo do Contrato & Configurações de Recebimento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <span className="text-xs uppercase font-semibold text-gray-500 block mb-1">📦 Peso Real (Net Weight)</span>
            <span className="text-2xl font-bold text-gray-800">{formatNum(pesoFinalTon, 3)} TON</span>
            <span className="text-xs text-gray-400 block mt-1">({formatNum(pesoFinalKg, 2)} KG)</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <span className="text-xs uppercase font-semibold text-gray-500 block mb-1">Preço Unitário (USD / Ton)</span>
            <span className="text-2xl font-bold text-gray-800">{formatCurrencyUSD(precoUnitarioUsd)}</span>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <span className="text-xs uppercase font-semibold text-blue-600 block mb-1">Total Bruto em USD</span>
            <span className="text-2xl font-bold text-blue-900">{formatCurrencyUSD(valorTotalUsd)}</span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <span className="text-xs uppercase font-semibold text-emerald-800 block mb-1">Líquido Creditado (USD)</span>
            <span className="text-2xl font-black text-emerald-950">
              {formatCurrencyUSD(proformaInfo.totalLiquidoUsd > 0 ? proformaInfo.totalLiquidoUsd : valorTotalUsd)}
            </span>
            {proformaInfo.totalTaxasUsd > 0 ? (
              <span className="text-[11px] text-red-600 font-semibold block mt-1">
                (-{formatCurrencyUSD(proformaInfo.totalTaxasUsd)} taxas de recebimento)
              </span>
            ) : (
              <span className="text-[11px] text-emerald-700 block mt-1">Sem tarifas descontadas</span>
            )}
          </div>

          {/* VISOR / CARD DE STATUS DO RECEBIMENTO */}
          <div className={`p-4 rounded-lg border flex flex-col justify-between ${
            proformaInfo.statusGeral === 'RECEBIDO'
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              : proformaInfo.statusGeral === 'PROFORMA_RECEBIDA'
              ? 'bg-blue-50/90 border-blue-300 text-blue-950'
              : 'bg-amber-50/90 border-amber-300 text-amber-950'
          }`}>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider opacity-75 flex items-center gap-1.5">
                {proformaInfo.statusGeral === 'RECEBIDO' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600" />
                )}
                Status do Pagamento
              </span>
              <div className="text-xl font-black leading-tight mt-1">
                {proformaInfo.statusGeral === 'RECEBIDO'
                  ? '✓ 100% Recebido'
                  : proformaInfo.statusGeral === 'PROFORMA_RECEBIDA'
                  ? '⚡ Entrada Paga'
                  : '⏳ A Receber'}
              </div>
            </div>

            <div className="text-[11px] font-semibold opacity-90 mt-2 pt-2 border-t border-black/10">
              {proformaInfo.temProforma ? (
                proformaInfo.statusGeral === 'RECEBIDO' ? (
                  <span>
                    Liquidado ({proformaInfo.dataSaldo ? new Date(proformaInfo.dataSaldo + 'T12:00:00Z').toLocaleDateString('pt-BR') : 'conta'})
                  </span>
                ) : proformaInfo.statusGeral === 'PROFORMA_RECEBIDA' ? (
                  <span>
                    Entrada em {proformaInfo.dataProforma ? new Date(proformaInfo.dataProforma + 'T12:00:00Z').toLocaleDateString('pt-BR') : '-'}
                  </span>
                ) : (
                  <span>Aguardando entrada</span>
                )
              ) : (
                financeiro.statusRecebimento === 'RECEBIDO' ? (
                  <span>
                    Liquidado ({financeiro.dataRecebimento ? new Date(financeiro.dataRecebimento).toLocaleDateString('pt-BR') : 'conta'})
                  </span>
                ) : (
                  <span>Pendente no banco</span>
                )
              )}
            </div>
          </div>
        </div>

        {/* COMPONENTE QUE SALVA BANCO, STATUS E DATA DO RECEBIMENTO */}
        <BancoStatusConfig 
          processoId={processo.id} 
          bancoInicial={financeiro.bancoDestino || 'BB BRASIL'} 
          statusInicial={financeiro.statusRecebimento || 'A_RECEBER'}
          dataRecebimentoInicial={financeiro.dataRecebimento}
          valorTotalUsd={valorTotalUsd}
        />
      </div>

      {/* SIMULADOR DE CÂMBIO & SENSIBILIDADE (RECOLHÍVEL NO TOPO PARA NÃO CONFUNDIR DADOS REAIS) */}
      <SimuladorCambio
        saldoUsdParaTravar={saldoUsdParaTravar}
        totalUsdTravado={totalUsdTravado}
        ptaxMedia={ptaxMedia}
        receitaBrutaAtualBRL={receitaLiquidaBRL}
        totalCustosBRL={totalCustosBRL}
        resultadoAtualBRL={resultadoOperacionalBRL}
        margemAtual={margemLucro}
      />

      {/* FECHAMENTOS DE CÂMBIO COM TAXAS E VALOR LÍQUIDO */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Fechamentos de Câmbio (Trava PTAX em R$)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Gerencie as travas cambiais da conta BB Brasil e a conversão das divisas para Reais.</p>
          </div>
          <div className="text-right sm:text-right">
            <span className="text-xs text-gray-500 block">
              {isBBAmerica ? 'Saldo em Dólar (BB América):' : 'Saldo Restante a Travar:'}
            </span>
            <span className={`text-base font-bold ${isBBAmerica ? 'text-blue-700' : (saldoUsdParaTravar > 0 ? 'text-amber-600' : 'text-green-600')}`}>
              {formatCurrencyUSD(saldoUsdParaTravar)}
            </span>
          </div>
        </div>

        {/* TABELA DE TRAVAMENTOS COM EDIÇÃO E EXCLUSÃO */}
        <TabelaTravamentos
          processoId={processo.id}
          travamentos={financeiro.travamentos.map((t) => {
            const parsed = parseTravamentoInfo(t);
            const valUsd = Number(t.valorUsdParcial.toString());
            const valPtax = Number(t.ptax.toString());
            return {
              id: t.id,
              dataTravamento: t.dataTravamento,
              valorUsdParcial: valUsd,
              ptax: valPtax,
              taxa: 0,
              moedaTaxa: 'USD',
              valorLiquido: valUsd * valPtax,
              observacaoLimpa: parsed.observacaoLimpa,
              observacaoBruta: t.observacao || '',
            };
          })}
          totalUsdTravado={totalUsdTravado}
          ptaxMedia={ptaxMedia}
          receitaBrutaBRL={receitaBrutaBRL}
          totalTaxasBRL={totalTaxasBRL}
          receitaLiquidaBRL={receitaLiquidaBRL}
        />

        {/* NOVO FORMULÁRIO COM DATA DA TRAVA, TAXA E VALOR LÍQUIDO */}
        <FormLancarTrava 
          processoId={processo.id} 
          financeiroId={financeiro.id} 
          saldoUsdParaTravar={saldoUsdParaTravar} 
        />
      </div>

      {/* DRE OPERACIONAL */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-1">DRE Operacional & Lançamento de Custos</h3>
        <p className="text-xs text-gray-500 mb-6">Preencha ou cole os valores das despesas operacionais abaixo. O salvamento agora é unificado pelo botão global abaixo.</p>

        <DRECustosManager
          processoId={processo.id}
          financeiroId={financeiro.id}
          receitaLiquidaBRL={receitaLiquidaBRL}
          custosIniciais={categoriasPrincipais.map((cat) => ({
            categoria: cat,
            label: CATEGORIAS_LABELS[cat] || cat,
            valorInicial: custosMap.get(cat) || 0,
          }))}
        />

        <div className="border-t border-gray-200 pt-6 space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">(+) Receita Bruta de Câmbio (BRL)</span>
            <span className="font-bold text-gray-900">{formatCurrencyBRL(receitaBrutaBRL)}</span>
          </div>
          {totalTaxasBRL > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-100 text-red-600">
              <span className="font-medium">(-) Taxas Cobradas na Operação de Câmbio (BRL)</span>
              <span className="font-bold">({formatCurrencyBRL(totalTaxasBRL)})</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700 font-bold">(=) Receita Líquida de Câmbio (BRL)</span>
            <span className="font-bold text-emerald-700">{formatCurrencyBRL(receitaLiquidaBRL)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">(-) Total de Custos Operacionais (BRL)</span>
            <span className="font-bold text-red-600">({formatCurrencyBRL(totalCustosBRL)})</span>
          </div>
          <div className={`flex justify-between py-3 px-4 rounded-lg font-bold text-base ${resultadoOperacionalBRL >= 0 ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'}`}>
            <span>(=) Resultado Líquido da Operação</span>
            <div className="text-right">
              <span>{formatCurrencyBRL(resultadoOperacionalBRL)}</span>
              <span className="block text-xs font-normal opacity-80">Margem: {margemLucro.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
