import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { 
  adicionarTravamentoAction, 
  deletarTravamentoAction 
} from '@/server/actions/financeiroActions';
import { formatNum } from '@/lib/formatters';
import { CategoriaCusto } from '@prisma/client';
import { CustoItemRow } from '@/components/financeiro/CustoItemRow';
import { BancoStatusConfig } from '@/components/financeiro/BancoStatusConfig';

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

  // Travamentos
  const totalUsdTravado = financeiro.travamentos.reduce((acc, t) => acc + Number(t.valorUsdParcial.toString()), 0);
  const saldoUsdParaTravar = valorTotalUsd - totalUsdTravado;

  let somatorioReaisTravados = 0;
  for (const t of financeiro.travamentos) {
    somatorioReaisTravados += Number(t.valorUsdParcial.toString()) * Number(t.ptax.toString());
  }
  const ptaxMedia = totalUsdTravado > 0 ? somatorioReaisTravados / totalUsdTravado : 0;
  const receitaBrutaBRL = totalUsdTravado * ptaxMedia;

  // Custos e DRE
  const custosMap = new Map(financeiro.custos.map(c => [c.categoria, Number(c.valor.toString())]));
  const categoriasPrincipais: CategoriaCusto[] = ['COMPRA', 'BENEFICIAMENTO', 'SACARIA', 'FRETE_TERRESTRE', 'FRETE_MARITIMO', 'TARIFA_ARMADOR_PORTO', 'SERVICO_ESTUFF', 'COMISSAO', 'OUTROS_CUSTOS'];
  const totalCustosBRL = Array.from(custosMap.entries()).filter(([cat]) => categoriasPrincipais.includes(cat as CategoriaCusto)).reduce((acc, [, val]) => acc + val, 0);

  const resultadoOperacionalBRL = receitaBrutaBRL - totalCustosBRL;
  const margemLucro = receitaBrutaBRL > 0 ? (resultadoOperacionalBRL / receitaBrutaBRL) * 100 : 0;

  const formatCurrencyUSD = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatCurrencyBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      
      {/* BALÃO DE DESTAQUE NO TOPO */}
      <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 ${resultadoOperacionalBRL >= 0 ? 'bg-gradient-to-r from-emerald-900 to-teal-900 text-white border-emerald-700' : 'bg-gradient-to-r from-red-900 to-rose-900 text-white border-red-700'}`}>
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold opacity-80 block mb-1">Resultado Líquido da Operação (DRE)</span>
          <div className="text-3xl font-extrabold">{formatCurrencyBRL(resultadoOperacionalBRL)}</div>
          <span className="text-xs opacity-90 mt-1 block">
            Margem de Lucro: <strong>{margemLucro.toFixed(2)}%</strong> {totalUsdTravado < valorTotalUsd ? '(⚠️ Câmbio Parcial Travado)' : '(🔒 Câmbio 100% Fechado)'}
          </span>
        </div>
        <div className="flex gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm text-sm">
          <div>
            <span className="block text-xs opacity-70 uppercase">Receita Bruta (BRL)</span>
            <strong className="text-base">{formatCurrencyBRL(receitaBrutaBRL)}</strong>
          </div>
          <div className="border-l border-white/20 pl-4">
            <span className="block text-xs opacity-70 uppercase">Total Custos (BRL)</span>
            <strong className="text-base">{formatCurrencyBRL(totalCustosBRL)}</strong>
          </div>
        </div>
      </div>

      {/* RESUMO DO CONTRATO + BANCO E STATUS AUTOMÁTICOS */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo do Contrato & Configurações de Recebimento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <span className="text-xs uppercase font-semibold text-blue-600 block mb-1">Total a Receber em USD</span>
            <span className="text-2xl font-bold text-blue-900">{formatCurrencyUSD(valorTotalUsd)}</span>
          </div>
        </div>

        {/* COMPONENTE QUE SALVA BANCO E STATUS AUTOMATICAMENTE */}
        <BancoStatusConfig 
          processoId={processo.id} 
          bancoInicial={financeiro.bancoDestino || 'BB BRASIL'} 
          statusInicial={financeiro.statusRecebimento || 'A_RECEBER'} 
        />
      </div>

      {/* FECHAMENTOS DE CÂMBIO (LIMPO, SEM STATUS DE PAGAMENTO) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Fechamentos de Câmbio (Parcial ou Total)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Gerencie as travas PTAX vinculadas a este contrato de exportação.</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500 block">Saldo Restante a Travar:</span>
            <span className={`text-base font-bold ${saldoUsdParaTravar > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {formatCurrencyUSD(saldoUsdParaTravar)}
            </span>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
                <th className="p-3">Data</th>
                <th className="p-3">Valor USD</th>
                <th className="p-3">PTAX</th>
                <th className="p-3">Valor BRL</th>
                <th className="p-3">Obs</th>
                <th className="p-center p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {financeiro.travamentos.map((t) => {
                const usd = Number(t.valorUsdParcial.toString());
                const ptax = Number(t.ptax.toString());

                return (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-gray-600">{new Date(t.dataTravamento).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 font-bold text-gray-900">{formatCurrencyUSD(usd)}</td>
                    <td className="p-3 font-semibold text-blue-600">{ptax.toFixed(4)}</td>
                    <td className="p-3 font-semibold text-green-700">{formatCurrencyBRL(usd * ptax)}</td>
                    <td className="p-3 text-gray-500 text-xs">{t.observacao || '-'}</td>
                    <td className="p-3 text-center">
                      <form action={deletarTravamentoAction}>
                        <input type="hidden" name="travamentoId" value={t.id} />
                        <input type="hidden" name="processoId" value={processo.id} />
                        <button type="submit" className="text-red-500 hover:text-red-700 font-bold text-xs">🗑️</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {financeiro.travamentos.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-gray-400 text-sm">Nenhum travamento registrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <form action={adicionarTravamentoAction} className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <input type="hidden" name="processoId" value={processo.id} />
          <input type="hidden" name="financeiroId" value={financeiro.id} />
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Valor USD</label>
            <input type="number" step="0.01" name="valorUsdParcial" defaultValue={saldoUsdParaTravar > 0 ? saldoUsdParaTravar : ''} required placeholder="0.00" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#f58220]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Taxa PTAX</label>
            <input type="number" step="0.0001" name="ptax" required placeholder="Ex: 5.4500" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#f58220]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Observação</label>
            <input type="text" name="observacao" placeholder="Ex: Parcial 50%" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#f58220]" />
          </div>
          <div>
            <button type="submit" className="w-full bg-[#f58220] text-white py-2 rounded-lg font-bold text-sm hover:bg-orange-600 shadow-sm">+ Adicionar Trava</button>
          </div>
        </form>
      </div>

      {/* DRE OPERACIONAL */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-1">DRE Operacional & Lançamento de Custos</h3>
        <p className="text-xs text-gray-500 mb-6">Preencha os valores de cada categoria abaixo. O salvamento é individual por linha sem perder o foco da tela.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {categoriasPrincipais.map((cat) => {
            const valorAtual = custosMap.get(cat) || 0;
            const percentual = receitaBrutaBRL > 0 ? (valorAtual / receitaBrutaBRL) * 100 : 0;

            return (
              <CustoItemRow 
                key={cat}
                processoId={processo.id}
                financeiroId={financeiro.id}
                categoria={cat}
                label={CATEGORIAS_LABELS[cat] || cat}
                valorInicial={valorAtual}
                percentual={percentual}
              />
            );
          })}
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">(+) Receita Bruta de Câmbio (BRL)</span>
            <span className="font-bold text-gray-900">{formatCurrencyBRL(receitaBrutaBRL)}</span>
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