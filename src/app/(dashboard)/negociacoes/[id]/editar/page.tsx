import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { atualizarProcessoAction } from '@/server/actions/editarProcessoAction';
import { Section, Field, SelectField, PRODUTOS_FEIJAO } from '@/components/negociacoes/FormFields';

export default async function EditarNegociacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const processo = await prisma.processo.findUnique({ where: { id } });
  if (!processo) notFound();

  const toDateInput = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');
  const toSimNao = (b: boolean | null) => (b === true ? 'sim' : b === false ? 'nao' : '');

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">Editar negociação — {processo.numeroProcesso}</h2>
      <form action={atualizarProcessoAction} className="space-y-6">
        <input type="hidden" name="processoId" value={processo.id} />

        <Section title="Dados do contrato">
          <Field label="Cliente final" name="clienteFinal" defaultValue={processo.clienteFinal} required />
          <Field label="Trader / Intermédio" name="traderIntermedio" defaultValue={processo.traderIntermedio ?? ''} />
          <Field label="Incoterm" name="incoterm" defaultValue={processo.incoterm} required />
          <Field label="Porto de destino" name="portoDestino" defaultValue={processo.portoDestino} required />
          <Field label="Free time (Destino)" name="freeTimeDestino" defaultValue={processo.freeTimeDestino ?? ''} />
          <Field label="REDEX" name="redex" defaultValue={processo.redex ?? ''} />
          <Field
            label="Preço unitário declarado (USD/TON)"
            name="valorDeclaradoUsd"
            type="number"
            defaultValue={processo.valorDeclaradoUsd ? String(processo.valorDeclaradoUsd) : ''}
          />
        </Section>

        <Section title="Informações">
          <Field label="Local de estufagem" name="localEstufagem" defaultValue={processo.localEstufagem ?? ''} required />
          <Field label="Volume (KG)" name="volumeKg" type="number" defaultValue={String(processo.volumeKg)} required />
          <Field label="Contêineres (quantidade)" name="containerQtd" type="number" defaultValue={processo.containerQtd ? String(processo.containerQtd) : ''} required />
          <Field label="Tipo de contêiner" name="containerTipo" defaultValue={processo.containerTipo ?? "20' DRY"} readOnly required />
          <Field label="Tipo de embalagem" name="embalagemTipo" defaultValue={processo.embalagemTipo ?? 'Sacaria 30kg'} readOnly required />
          <Field label="Quantidade por contêiner (sacas)" name="sacasPorContainer" type="number" defaultValue={processo.sacasPorContainer ? String(processo.sacasPorContainer) : ''} required />
          <SelectField
            label="Fumigação necessária?"
            name="fumigacaoNecessaria"
            required
            defaultValue={toSimNao(processo.fumigacaoNecessaria)}
            options={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]}
          />
          <Field label="Tipo de fumigação" name="fumigacaoTipo" defaultValue={processo.fumigacaoTipo ?? ''} />
          <Field label="Tempo de fumigação (horas)" name="fumigacaoTempoHoras" defaultValue={String(processo.fumigacaoTempoHoras ?? 24)} readOnly required />
          
          <SelectField
            label="Necessita etiqueta?"
            name="necessitaEtiqueta"
            required
            defaultValue={toSimNao(processo.necessitaEtiqueta)}
            options={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]}
          />

          <Field label="Armador" name="armador" defaultValue={processo.armador ?? 'ONE'} readOnly required />
        </Section>

        <Section title="Características">
          <Field label="Estufagem — início" name="estufagemInicio" type="date" defaultValue={toDateInput(processo.estufagemInicio)} required />
          <Field label="Estufagem — fim" name="estufagemFim" type="date" defaultValue={toDateInput(processo.estufagemFim)} required />
          <SelectField
            label="MAPA na sequência?"
            name="mapaNaSequencia"
            required
            defaultValue={toSimNao(processo.mapaNaSequencia)}
            options={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]}
          />
          <SelectField
            label="Produto"
            name="produto"
            required
            defaultValue={processo.produto}
            options={PRODUTOS_FEIJAO}
          />
          <Field label="NCM" name="ncm" defaultValue={processo.ncm ?? ''} required />
        </Section>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase mb-4">Dados de embarque</h4>
          <div className="bg-surface border border-border rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Nº Booking" name="bookingNumero" defaultValue={processo.bookingNumero ?? ''} />
            <Field label="Navio" name="navio" defaultValue={processo.navio ?? ''} />
            <Field label="Deadline de embarque" name="deadlineEmbarque" type="date" defaultValue={toDateInput(processo.deadlineEmbarque)} />
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