'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { atualizarInfoOperacaoAction } from '@/server/actions/blocoActions';
import { IncotermHelpBadge } from './IncotermSelectField';
import { 
  Briefcase, 
  MapPin, 
  Package, 
  Edit3, 
  Globe2, 
  FileText, 
  Clock, 
  Box, 
  Check, 
  X,
  Scale
} from 'lucide-react';

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

  const volumeTon = props.volumeKg ? (props.volumeKg / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '0';

  if (!editando) {
    return (
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative transition-all">
        {/* Header do Card com Botão de Edição */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Ficha Técnica da Operação
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Parâmetros comerciais, rota marítima e especificações da carga.
              </p>
            </div>
          </div>

          <button
            onClick={() => setEditando(true)}
            title="Editar informações da operação"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-orange-500" />
            <span>Editar Ficha</span>
          </button>
        </div>

        {/* 3 SEÇÕES ESTRUTURADAS E VISUALMENTE DISTINTAS */}
        <div className="space-y-6">
          
          {/* SEÇÃO 1: DADOS COMERCIAIS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                1. Comercial & Contrato
              </span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <FieldBox 
                label="Cliente Final" 
                value={props.clienteFinal} 
                highlight 
              />
              <FieldBox 
                label="Produto / Mercadoria" 
                value={props.produto} 
              />
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">
                  Incoterm
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {props.incoterm || 'FOB'}
                  </span>
                  <IncotermHelpBadge incoterm={props.incoterm || 'FOB'} />
                </div>
              </div>

              <FieldBox 
                label="Preço Declarado (USD/t)" 
                value={props.valorDeclaradoUsd ? `US$ ${Number(props.valorDeclaradoUsd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'} 
              />
              <FieldBox 
                label="RUC (DUE)" 
                value={props.ruc || 'Pendente de emissão'} 
                mono 
              />
              <FieldBox 
                label="Contrato Interno" 
                value={props.contratoInterno || 'N/A'} 
                mono 
              />
            </div>
          </div>

          {/* SEÇÃO 2: ROTA & LOGÍSTICA */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                2. Rota Marítima & Armazém
              </span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
                <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">
                  Porto de Origem (Saída)
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{props.portoOrigem || '-'}</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
                <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">
                  Porto de Destino (Descarga)
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span className="truncate">{props.portoDestino || '-'}</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
                <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">
                  Free Time no Destino
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{props.freeTimeDestino || 'Padrão armador'}</span>
                </span>
              </div>

              <div className="sm:col-span-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                    Terminal REDEX / Local de Estufagem
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {props.redex || 'Não informado'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  Estufagem Terceirizada
                </span>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: CARGA & ESPECIFICAÇÃO DE EMBALAGEM */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                3. Volume, Contêineres & Embalagem
              </span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <FieldBox 
                label="Volume Total" 
                value={`${volumeTon} t (${props.volumeKg.toLocaleString('pt-BR')} kg)`} 
                highlight 
              />
              <FieldBox 
                label="Qtd. Contêineres" 
                value={props.containerQtd ? `${props.containerQtd}x ${props.containerTipo}` : '-'} 
              />
              <FieldBox 
                label="Sacas por Contêiner" 
                value={props.sacasPorContainer ? `${props.sacasPorContainer} sacas` : '-'} 
              />
              <FieldBox 
                label="Tipo de Contêiner" 
                value={props.containerTipo || "20' DRY"} 
              />
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="lg:col-span-2 bg-white dark:bg-slate-900 border-2 border-orange-500/50 rounded-3xl p-6 shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Editar Ficha Técnica da Operação
          </h2>
          <p className="text-xs text-slate-400">
            Atualize dados comerciais, porto de origem/destino e carga contratada.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
        >
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <EditInput label="Cliente Final" name="clienteFinal" defaultValue={props.clienteFinal} required />
        <EditInput label="Produto" name="produto" defaultValue={props.produto} required />
        <EditInput label="Volume (KG)" name="volumeKg" type="number" defaultValue={String(props.volumeKg)} required />
        
        <EditInput label="Incoterm" name="incoterm" defaultValue={props.incoterm} required />
        <EditInput label="Porto de Origem" name="portoOrigem" defaultValue={props.portoOrigem} required />
        <EditInput label="Porto de Destino" name="portoDestino" defaultValue={props.portoDestino} required />
        
        <EditInput label="Local de Estufagem / REDEX" name="redex" defaultValue={props.redex} />
        <EditInput label="Preço Declarado (USD/t)" name="valorDeclaradoUsd" type="number" defaultValue={props.valorDeclaradoUsd ? String(props.valorDeclaradoUsd) : ''} />
        <EditInput label="Qtd. Contêineres" name="containerQtd" type="number" defaultValue={props.containerQtd ? String(props.containerQtd) : ''} />
        
        <EditInput label="Sacas por Contêiner" name="sacasPorContainer" type="number" defaultValue={props.sacasPorContainer ? String(props.sacasPorContainer) : ''} />
        <EditInput label="Free time (Destino)" name="freeTimeDestino" defaultValue={props.freeTimeDestino} />
        <EditInput label="RUC (DUE)" name="ruc" defaultValue={props.ruc} />
        <EditInput label="Contrato Interno" name="contratoInterno" defaultValue={props.contratoInterno} />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}

function FieldBox({
  label,
  value,
  highlight = false,
  mono = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
      <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5 truncate">
        {label}
      </span>
      <span className={`block text-xs font-bold truncate ${
        highlight 
          ? 'text-slate-950 dark:text-white' 
          : 'text-slate-800 dark:text-slate-200'
      } ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function EditInput({
  label,
  name,
  defaultValue,
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor={name}>
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        required={required}
        className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/40"
      />
    </div>
  );
}
