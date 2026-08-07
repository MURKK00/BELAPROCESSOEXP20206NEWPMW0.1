import { criarProcessoAction } from '@/server/actions/criarProcessoAction';

export default function NovaNegociacaoPage() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Nova negociação</h2>
      <form action={criarProcessoAction} className="bg-surface border border-border rounded-2xl p-8 space-y-5">
        <Field label="Cliente final" name="clienteFinal" placeholder="Ex: Cargill International SA" required />
        <Field label="Trader / Intermédio" name="traderIntermedio" placeholder="Ex: AgriTrading Partners SA" />
        <Field label="Produto" name="produto" placeholder="Ex: Soja em grãos — Non-GMO" required />
        <Field label="Volume (KG)" name="volumeKg" type="number" placeholder="Ex: 250687" required />
        <Field label="Incoterm" name="incoterm" placeholder="Ex: FOB Santos" required />
        <Field label="Porto de destino" name="portoDestino" placeholder="Ex: Rotterdam (NL)" required />
        <Field label="REDEX" name="redex" placeholder="Ex: REDEX Santos — Pátio 4" />
        <Field label="Preço unitário declarado (USD/TON)" name="valorDeclaradoUsd" type="number" placeholder="Ex: 880" />

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-50 text-blue-700 border border-blue-200 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-100"
          >
            Lançar Negociação
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
