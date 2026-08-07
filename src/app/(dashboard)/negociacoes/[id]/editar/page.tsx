import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { atualizarProcessoAction } from '@/server/actions/editarProcessoAction';

export default async function EditarNegociacaoPage({ params }: { params: { id: string } }) {
  const processo = await prisma.processo.findUnique({ where: { id: params.id } });
  if (!processo) notFound();

  const deadlineValue = processo.deadlineEmbarque
    ? new Date(processo.deadlineEmbarque).toISOString().slice(0, 10)
    : '';

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Editar negociação — {processo.numeroProcesso}</h2>
      <form action={atualizarProcessoAction} className="bg-surface border border-border rounded-2xl p-8 space-y-5">
        <input type="hidden" name="processoId" value={processo.id} />
        <Field label="Cliente final" name="clienteFinal" defaultValue={processo.clienteFinal} required />
        <Field label="Trader / Intermédio" name="traderIntermedio" defaultValue={processo.traderIntermedio ?? ''} />
        <Field label="Produto" name="produto" defaultValue={processo.produto} required />
        <Field label="Volume (KG)" name="volumeKg" type="number" defaultValue={String(processo.volumeKg)} required />
        <Field label="Incoterm" name="incoterm" defaultValue={processo.incoterm} required />
        <Field label="Porto de destino" name="portoDestino" defaultValue={processo.portoDestino} required />
        <Field label="REDEX" name="redex" defaultValue={processo.redex ?? ''} />
        <Field
          label="Preço unitário declarado (USD/TON)"
          name="valorDeclaradoUsd"
          type="number"
          defaultValue={processo.valorDeclaradoUsd ? String(processo.valorDeclaradoUsd) : ''}
        />

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase mb-4">Dados de embarque</h4>
          <div className="space-y-5">
            <Field label="Nº Booking" name="bookingNumero" defaultValue={processo.bookingNumero ?? ''} />
            <Field label="Navio" name="navio" defaultValue={processo.navio ?? ''} />
            <Field label="Deadline de embarque" name="deadlineEmbarque" type="date" defaultValue={deadlineValue} />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-50 text-blue-700 border border-blue-200 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-100"
          >
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, name, type = 'text', defaultValue, required = false,
}: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}