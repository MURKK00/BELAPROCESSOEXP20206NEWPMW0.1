export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-8">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-5 pb-3 border-b border-border">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </div>
  );
}

export function Field({
  label, name, type = 'text', placeholder, required = false, readOnly = false, defaultValue,
}: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; readOnly?: boolean; defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" htmlFor={name}>
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        defaultValue={defaultValue}
        className={`border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-blue-100 ${
          readOnly ? 'bg-gray-100 text-gray-500' : ''
        }`}
      />
    </div>
  );
}

export function SelectField({
  label, name, options, required = false, placeholder, defaultValue = '',
}: {
  label: string; name: string; options: { value: string; label: string }[];
  required?: boolean; placeholder?: string; defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" htmlFor={name}>
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-blue-100 bg-white"
      >
        <option value="" disabled>{placeholder ?? 'Selecione...'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// Lista central dos produtos — edite aqui quando quiser adicionar mais tipos
export const PRODUTOS_FEIJAO = [
  { value: 'Feijão Mungo Verde (Green Mung Bean)', label: 'Feijão Mungo Verde (Green Mung Bean)' },
  { value: 'Feijão Mungo Preto (Black Matpe)', label: 'Feijão Mungo Preto (Black Matpe)' },
  { value: 'Feijão Caupi Fradinho (Cowpea / Black Eye Pea)', label: 'Feijão Caupi Fradinho (Cowpea / Black Eye Pea)' },
  { value: 'Feijão Caupi Vermelho (Red Cowpea)', label: 'Feijão Caupi Vermelho (Red Cowpea)' },
  { value: 'Feijão Caupi Branco (White Cowpea)', label: 'Feijão Caupi Branco (White Cowpea)' },
  { value: 'Feijão Caupi Sempre-Verde (Evergreen Cowpea)', label: 'Feijão Caupi Sempre-Verde (Evergreen Cowpea)' },
];