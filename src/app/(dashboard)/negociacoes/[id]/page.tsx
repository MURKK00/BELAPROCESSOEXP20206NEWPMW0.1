import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatInt, formatNum } from '@/lib/formatters';

export default async function VisaoGeralPage({ params }: { params: { id: string } }) {
  const processo = await prisma.processo.findUnique({ where: { id: params.id } });
  if (!processo) notFound();

  const volKg = Number(processo.volumeKg);

  return (
    <div className="bg-surface border border-border rounded-2xl p-8">
      <h3 className="text-lg font-semibold mb-6">Dados do contrato</h3>
      <div className="grid grid-cols-2 gap-x-10 gap-y-6">
        <Item label="Cliente" value={processo.clienteFinal} />
        <Item label="Trader/Intermédio" value={processo.traderIntermedio ?? '-'} />
        <Item label="Produto" value={processo.produto} />
        <div>
          <label className="block text-xs uppercase text-gray-400 font-semibold mb-1.5">Volume</label>
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-gray-900 text-lg">{formatInt(volKg)} KG</span>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md">
              {formatNum(volKg / 1000, 3)} TON
            </span>
          </div>
        </div>
        <Item label="Incoterm" value={processo.incoterm} />
        <Item label="Porto de destino" value={processo.portoDestino} />
        <Item label="REDEX" value={processo.redex ?? '-'} />
        <Item
          label="Valor declarado (USD)"
          value={processo.valorDeclaradoUsd ? `USD ${formatInt(Number(processo.valorDeclaradoUsd))}` : '-'}
        />
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs uppercase text-gray-400 font-semibold mb-1.5">{label}</label>
      <span className="text-base font-medium text-gray-900">{value}</span>
    </div>
  );
}
