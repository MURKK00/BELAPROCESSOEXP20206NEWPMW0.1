'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { atualizarInfoOperacaoAction } from '@/server/actions/blocoActions';

type Props = {
  processoId: string;
  clienteFinal: string;
  produto: string;
  volumeKg: number;
  incoterm: string;
  portoDestino: string;
  redex: string;
  valorDeclaradoUsd: number | null;
  containerQtd: number | null;
  containerTipo: string;
  sacasPorContainer: number | null;
  freeTimeDestino: string;
  ruc: string;
  contratoInterno: string;
};

export function InfoOperacaoCard(props: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSalvando(true);
    try {
      formData.set('processoId', props.processoId);
      await atualizarInfoOperacaoAction(formData);
      setEditando(false);
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  if (!editando) {
    return (
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative">
        <button
          onClick={() => setEditando(true)}
          title="Editar informações"
          className="absolute top-5 right-5 text-gray-400 hover:text-blue-600 transition-colors"
        >
          ✏️
        </button>
        <h2 className="text-lg font-bold mb-4 text-gray-900">Informações da Operação</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <Info label="Cliente Final" value={props.clienteFinal} />
          <Info label="Produto" value={props.produto} />
          <Info label="Volume" value={`${props.volumeKg / 1000} Toneladas`} />
          <Info label="Incoterm / Porto" value={`${props.incoterm} → ${props.portoDestino}`} />
          <Info label="Redex" value={props.redex || '-'} />
          <Info
            label="Valor Declarado"
            value={props.valorDeclaradoUsd ? `$ ${Number(props.valorDeclaradoUsd).toFixed(2)}` : '-'}
          />
          <Info
            label="Contêineres (Qtd)"
            value={props.containerQtd ? `${props.containerQtd}x ${props.containerTipo}` : '-'}
          />
          <Info
            label="Sacas por contêiner"
            value={props.sacasPorContainer ? `${props.sacasPorContainer} sacas` : '-'}
          />
          <Info label="Free time (Destino)" value={props.freeTimeDestino || '-'} />
          <Info label="RUC" value={props.ruc || '-'} />
          <Info label="Contrato Interno" value={props.contratoInterno || '-'} />
        </div>
      </div>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="lg:col-span-2 bg-white border border-blue-200 rounded-xl p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold mb-4 text-gray-900">Editar Informações da Operação</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <EditField label="Cliente Final" name="clienteFinal" defaultValue={props.clienteFinal} />
        <EditField label="Produto" name="produto" defaultValue={props.produto} />
        <EditField label="Volume (KG)" name="volumeKg" type="number" defaultValue={props.volumeKg} />
        <EditField label="Incoterm" name="incoterm" defaultValue={props.incoterm} />
        <EditField label="Porto de destino" name="portoDestino" defaultValue={props.portoDestino} />
        <EditField label="Redex" name="redex" defaultValue={props.redex} />
        <EditField
          label="Valor Declarado (USD)"
          name="valorDeclaradoUsd"
          type="number"
          defaultValue={props.valorDeclaradoUsd ?? ''}
        />
        <EditField
          label="Contêineres (Qtd)"
          name="containerQtd"
          type="number"
          defaultValue={props.containerQtd ?? ''}
        />
        <EditField
          label="Sacas por contêiner"
          name="sacasPorContainer"
          type="number"
          defaultValue={props.sacasPorContainer ?? ''}
        />
        <EditField
          label="Free time (Destino)"
          name="freeTimeDestino"
          defaultValue={props.freeTimeDestino}
          placeholder="Ex: 14 dias corridos"
        />
        <EditField label="RUC" name="ruc" defaultValue={props.ruc} />
        <EditField label="Contrato Interno" name="contratoInterno" defaultValue={props.contratoInterno} />
      </div>
      <div className="flex gap-3 mt-5">
        <button
          type="submit"
          disabled={salvando}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">{label}</label>
      <div className="font-medium text-gray-900">{value}</div>
    </div>
  );
}

function EditField({
  label,
  name,
  defaultValue,
  type = 'text',
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: any;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
}