import { criarProcessoAction } from '@/server/actions/criarProcessoAction';
import { Section, Field, SelectField, PRODUTOS_FEIJAO } from '@/components/negociacoes/FormFields';

export default function NovaNegociacaoPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">Nova negociação</h2>
      <form action={criarProcessoAction} className="space-y-6">

        <Section title="Dados do contrato">
          <Field label="Cliente final" name="clienteFinal" placeholder="Ex: Cargill International SA" required />
          <Field label="Trader / Intermédio" name="traderIntermedio" placeholder="Ex: AgriTrading Partners SA" />
          <Field label="Incoterm" name="incoterm" placeholder="Ex: FOB Santos" required />
          <Field label="Porto de destino" name="portoDestino" placeholder="Ex: Rotterdam (NL)" required />
          <Field label="REDEX" name="redex" placeholder="Ex: REDEX Santos — Pátio 4" />
          <Field label="Preço unitário declarado (USD/TON)" name="valorDeclaradoUsd" type="number" placeholder="Ex: 880" />
        </Section>

        <Section title="Informações">
          <Field label="Local de estufagem" name="localEstufagem" placeholder="Ex: REDEX Santos — Pátio 4" required />
          <Field label="Volume (KG)" name="volumeKg" type="number" placeholder="Ex: 250687" required />
          <Field label="Contêineres (quantidade)" name="containerQtd" type="number" placeholder="Ex: 10" required />
          <Field label="Tipo de contêiner" name="containerTipo" defaultValue="20' DRY" readOnly required />
          <Field label="Tipo de embalagem" name="embalagemTipo" defaultValue="Sacaria 30kg" readOnly required />
          <Field label="Quantidade por contêiner (sacas)" name="sacasPorContainer" type="number" placeholder="Ex: 700" required />
          <SelectField
            label="Fumigação necessária?"
            name="fumigacaoNecessaria"
            required
            options={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]}
          />
          <Field label="Tipo de fumigação" name="fumigacaoTipo" placeholder="Ex: Brometo (preencher se Fumigação = Sim)" />
          <Field label="Tempo de fumigação (horas)" name="fumigacaoTempoHoras" defaultValue="24" readOnly required />
          <Field label="Armador" name="armador" defaultValue="ONE" readOnly required />
        </Section>

        <Section title="Características">
          <Field label="Estufagem — início" name="estufagemInicio" type="date" required />
          <Field label="Estufagem — fim" name="estufagemFim" type="date" required />
          <SelectField
            label="MAPA na sequência?"
            name="mapaNaSequencia"
            required
            options={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]}
          />
          <SelectField
            label="Produto"
            name="produto"
            required
            options={PRODUTOS_FEIJAO}
            placeholder="Selecione o produto"
          />
          <Field label="NCM" name="ncm" placeholder="Ex: 0713.31.90" required />
        </Section>

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