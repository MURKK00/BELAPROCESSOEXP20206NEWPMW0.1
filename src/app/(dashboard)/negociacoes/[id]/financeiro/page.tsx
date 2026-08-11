import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatBRL, formatUSD, formatNum } from '@/lib/formatters';
import { atualizarCustoAction, atualizarPrecoPtaxAction } from '@/server/actions/financeiroActions';
import { EnterToSaveInput } from '@/components/financeiro/EnterToSaveInput';

const CUSTO_LABEL: Record<string, string> = {
  COMPRA_MATERIA_PRIMA: 'Compra (Matéria-Prima)',
  BENEFICIAMENTO: 'Beneficiamento',
  FRETE_TERRESTRE: 'Frete Terrestre',
  FRETE_MARITIMO: 'Frete Marítimo',
  TARIFA_ARMADOR_PORTO: 'Tarifa Armador / Porto',
  ESTUFAGEM_REDEX: 'Serviço de Estufagem (REDEX)',
  COMISSAO_INTERMEDIACAO: 'Comissão Intermediação',
  OUTROS: 'Outros Custos / Diversos',
};

export default async function FinanceiroPage({ params }: { params: { id: string } }) {
  const processo = await prisma.processo.findUnique({
    where: { id: params.id },
    include: { financeiro: { include: { custos: true } } },
  });
  if (!processo || !processo.financeiro) notFound();

  const f = processo.financeiro;
  const qtdeT = Number(processo.volumeKg) / 1000;
  const receitaUsd = qtdeT * Number(f.precoUsd);
  const receitaBrl = receitaUsd * Number(f.ptax);
  const totalCustos = f.custos.reduce((sum, c) => sum + Number(c.valor), 0);
  const resultadoLiquido = receitaBrl - totalCustos;
  const sacas60kg = Number(processo.volumeKg) / 60;
  const lucroPorSaca = sacas60kg > 0 ? resultadoLiquido / 60 : 0;

  return (
    <div className="bg-surface border border-border rounded-2xl p-8">
      <h3 className="text-lg font-semibold mb-6">Demonstrativo de Resultados (DRE)</h3>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 border border-border rounded-lg p-4">
          <label className="block text-xs uppercase text-gray-400 font-semibold mb-1">Quantidade (t)</label>
          <span className="font-bold">{formatNum(qtdeT, 3)}</span>
        </div>
        <EditableCard
          label="Preço unit. (USD)"
          value={formatUSD(f.precoUsd)}
          action={atualizarPrecoPtaxAction}
          hiddenFields={{ financeiroId: f.id, campo: 'precoUsd' }}
          current={Number(f.precoUsd)}
        />
        <div className="bg-gray-50 border border-border rounded-lg p-4">
          <label className="block text-xs uppercase text-gray-400 font-semibold mb-1">Valor total (USD)</label>
          <span className="font-bold">{formatUSD(receitaUsd)}</span>
        </div>
        <EditableCard
          label="PTAX (fechamento)"
          value={`R$ ${formatNum(f.ptax, 4)}`}
          action={atualizarPrecoPtaxAction}
          hiddenFields={{ financeiroId: f.id, campo: 'ptax' }}
          current={Number(f.ptax)}
          highlight
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4 flex justify-between items-center mb-7">
        <label className="text-sm font-bold uppercase text-green-800">Receita bruta total</label>
        <span className="text-2xl font-extrabold text-green-900">{formatBRL(receitaBrl)}</span>
      </div>

      <h4 className="text-base font-semibold mb-4">Detalhamento de custos operacionais</h4>
      <table className="w-full mb-2">
        <thead>
          <tr className="text-left text-xs uppercase text-gray-400 border-b-2 border-border">
            <th className="py-2.5">Conta / categoria</th>
            <th className="py-2.5 w-64">Valor (R$)</th>
            <th className="py-2.5 w-48">% sobre custos</th>
          </tr>
        </thead>
        <tbody>
          {f.custos.map((c) => {
            const pct = totalCustos > 0 ? (Number(c.valor) / totalCustos) * 100 : 0;
            return (
              <tr key={c.id} className="border-b border-gray-50">
                <td className="py-2.5 text-sm">{CUSTO_LABEL[c.categoria] ?? c.categoria}</td>
                <td className="py-2.5">
                  <form action={atualizarCustoAction} className="flex items-center gap-2">
                    <input type="hidden" name="custoItemId" value={c.id} />
                    <input type="hidden" name="processoId" value={processo.id} />
                    <EnterToSaveInput
                      name="valor"
                      type="number"
                      step="0.01"
                      defaultValue={Number(c.valor)}
                      className="border border-transparent hover:border-border rounded-md px-2 py-1 text-sm font-mono w-32"
                    />
                    <button type="submit" className="text-xs text-secondary font-semibold">
                      Salvar
                    </button>
                  </form>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-9 text-right">{formatNum(pct, 1)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="bg-gray-50 border border-border rounded-lg px-5 py-3 flex justify-between items-center mb-7 text-gray-500">
        <label className="text-sm font-semibold uppercase">Total de custos operacionais</label>
        <span className="text-base font-bold text-gray-900">- {formatBRL(totalCustos)}</span>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
          <label className="text-sm font-bold uppercase text-teal-800">Resultado líquido</label>
          <div className="text-3xl font-extrabold text-teal-900 mt-2">{formatBRL(resultadoLiquido)}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <label className="text-sm font-bold uppercase text-amber-800">Margem: lucro por SC (60kg)</label>
          <div className="text-3xl font-extrabold text-amber-900 mt-2">{formatBRL(lucroPorSaca)}</div>
        </div>
      </div>
    </div>
  );
}

function EditableCard({
  label,
  value,
  action,
  hiddenFields,
  current,
  highlight = false,
}: {
  label: string;
  value: string;
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  current: number;
  highlight?: boolean;
}) {
  return (
    <form
      action={action}
      className={`rounded-lg p-4 border ${highlight ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-border'}`}
    >
      {Object.entries(hiddenFields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label className="block text-xs uppercase text-gray-400 font-semibold mb-1">{label}</label>
      <div className="flex items-center justify-between gap-2">
        <EnterToSaveInput
          name="novoValor"
          type="number"
          step="0.0001"
          defaultValue={current}
          className="font-bold text-sm bg-transparent w-24 outline-none"
        />
        <button type="submit" className="text-xs text-secondary font-semibold shrink-0">
          Salvar
        </button>
      </div>
    </form>
  );
}
