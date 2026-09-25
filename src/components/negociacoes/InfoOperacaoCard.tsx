'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { atualizarInfoOperacaoAction } from '@/server/actions/blocoActions';
import { IncotermHelpBadge, INCOTERMS_OPTIONS } from './IncotermSelectField';

type Props = {
  processoId: string;
  clienteFinal: string;
  produto: string;
  volumeKg: number;
  incoterm: string;
  portoOrigem: string;
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
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs relative transition-colors">
        <button
          onClick={() => setEditando(true)}
          title="Editar informações"
          className="absolute top-5 right-5 text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
        >
          ✏️
        </button>
        <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Informações da Operação</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <Info label="Cliente Final" value={props.clienteFinal} />
          <Info label="Produto" value={props.produto} />
          <Info label="Volume" value={`${props.volumeKg / 1000} Toneladas`} />

          {/* INCOTERM COM TOOLTIP DE AJUDA */}
          <div>
            <label className="block text-xs uppercase text-slate-400 dark:text-slate-500 font-bold mb-1">
              Incoterm
            </label>
            <div className="font-bold text-slate-900 dark:text-white flex items-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {props.incoterm || 'FOB'}
              </span>
              <IncotermHelpBadge incoterm={props.incoterm || 'FOB'} />
            </div>
          </div>

          <Info label="Porto de Origem → Destino" value={`${props.portoOrigem || '-'} → ${props.portoDestino || '-'}`} />
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
      className="lg:col-span-2 bg-white dark:bg-slate-900 border border-orange-500/40 dark:border-orange-500/30 rounded-2xl p-6 shadow-sm transition-colors"
    >
      <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Editar Informações da Operação</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <EditField label="Cliente Final" name="clienteFinal" defaultValue={props.clienteFinal} />
        <EditField label="Produto" name="produto" defaultValue={props.produto} />
        <EditField label="Volume (KG)" name="volumeKg" type="number" defaultValue={props.volumeKg} />

        {/* SELECT DE INCOTERM NA EDIÇÃO COM TOOLTIP */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Incoterm</label>
            <IncotermHelpBadge incoterm={props.incoterm} />
          </div>
          <select
            name="incoterm"
            defaultValue={props.incoterm || 'FOB'}
            className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            {INCOTERMS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        
        <EditField 
          label="Porto de Origem (Saída)" 
          name="portoOrigem" 
          defaultValue={props.portoOrigem ?? ''} 
          placeholder="Ex: Santos - SSZDPW" 
        />

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
          className="bg-[#f58220] hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
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
      <label className="block text-xs uppercase text-slate-400 dark:text-slate-500 font-bold mb-1">{label}</label>
      <div className="font-bold text-slate-900 dark:text-white">{value}</div>
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
      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
      />
    </div>
  );
}
