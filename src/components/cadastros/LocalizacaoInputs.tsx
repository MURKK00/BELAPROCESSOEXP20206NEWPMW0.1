"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { GeoCombobox, type GeoComboboxOption } from './GeoCombobox';
import {
  UFS_BRASIL,
  UFS_BRASIL_SIGLAS,
  obterListaPaises,
  ehBrasil,
  formatarCep,
  limparCep,
  buscarMunicipiosIbge,
  buscarCidadesPorPais,
  encontrarMatchNaLista,
} from '@/lib/localidadesHelper';

export interface CepResultado {
  cep: string;
  endereco: string;
  uf: string;
  cidade: string;
  complemento: string;
}

interface CepLookupFieldProps {
  value: string;
  onChange: (novoValor: string) => void;
  onCepEncontrado: (dados: CepResultado) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function CepLookupField({
  value,
  onChange,
  onCepEncontrado,
  label = 'CEP',
  placeholder = '00000-000',
  required = false,
  className = '',
}: CepLookupFieldProps) {
  const [buscando, setBuscando] = useState(false);
  const [erroCep, setErroCep] = useState<string | null>(null);

  async function handleBuscarCep() {
    const digits = limparCep(value);
    if (digits.length !== 8) {
      setErroCep('CEP com formato inválido. Informe 8 dígitos numéricos (ex: 78652-000).');
      return;
    }

    setBuscando(true);
    setErroCep(null);

    try {
      const res = await fetch(`/api/cep/${digits}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErroCep(data?.error || 'CEP não encontrado.');
        return;
      }

      let cidadeFinal = typeof data.cidade === 'string' ? data.cidade.trim() : '';
      const ufFinal = typeof data.uf === 'string' ? data.uf.trim().toUpperCase() : '';

      // Pré-aquece cache IBGE e tenta casar o nome oficial do município
      if (ufFinal && UFS_BRASIL_SIGLAS.has(ufFinal)) {
        try {
          const municipios = await buscarMunicipiosIbge(ufFinal);
          const matchIbge = encontrarMatchNaLista(cidadeFinal, municipios);
          if (matchIbge) {
            cidadeFinal = matchIbge;
          }
        } catch {
          // Mantém a cidade retornada pela API de CEP se o IBGE falhar momentaneamente
        }
      }

      onCepEncontrado({
        cep: data.cep || formatarCep(digits),
        endereco: typeof data.endereco === 'string' ? data.endereco.trim() : '',
        uf: ufFinal,
        cidade: cidadeFinal,
        complemento: typeof data.complemento === 'string' ? data.complemento.trim() : '',
      });
    } catch {
      setErroCep('Erro de conexão ao consultar o CEP. Verifique sua rede ou preencha manualmente.');
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
        {label} {required && <span className="text-[#f58220]">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={9}
          required={required}
          placeholder={placeholder}
          value={formatarCep(value)}
          onChange={(e) => {
            if (erroCep) setErroCep(null);
            onChange(formatarCep(e.target.value));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              handleBuscarCep();
            }
          }}
          className={`w-full font-mono px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none transition-all ${
            erroCep
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#f58220]/40'
          }`}
        />
        <button
          type="button"
          onClick={handleBuscarCep}
          disabled={buscando}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-60 text-slate-800 dark:text-slate-100 text-xs font-bold shrink-0 transition-colors cursor-pointer"
          title="Buscar endereço pelo CEP"
        >
          {buscando ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f58220]" />
          ) : (
            <Search className="w-3.5 h-3.5 text-[#f58220]" />
          )}
          <span>Buscar CEP</span>
        </button>
      </div>
      {erroCep && (
        <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1">{erroCep}</p>
      )}
    </div>
  );
}

interface BrasilUfSelectProps {
  value: string;
  onChange: (novaUf: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

export function BrasilUfSelect({
  value,
  onChange,
  label = 'UF (Estado)',
  required = false,
  className = '',
}: BrasilUfSelectProps) {
  const ufUpper = (value || '').trim().toUpperCase();
  const isLegacyCustom = Boolean(ufUpper && !UFS_BRASIL_SIGLAS.has(ufUpper));

  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
        {label} {required && <span className="text-[#f58220]">*</span>}
      </label>
      <select
        required={required}
        value={isLegacyCustom ? value : ufUpper}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none font-medium"
      >
        <option value="">Selecione a UF...</option>
        {isLegacyCustom && (
          <option value={value}>{value} (valor atual)</option>
        )}
        {UFS_BRASIL.map((u) => (
          <option key={u.sigla} value={u.sigla}>
            {u.sigla} — {u.nome}
          </option>
        ))}
      </select>
    </div>
  );
}

interface BrasilCidadeComboboxProps {
  uf: string;
  value: string;
  onChange: (novaCidade: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function BrasilCidadeCombobox({
  uf,
  value,
  onChange,
  label = 'Cidade / Município',
  placeholder = 'Selecione o município...',
  required = false,
  className = '',
}: BrasilCidadeComboboxProps) {
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erroIbge, setErroIbge] = useState<string | null>(null);

  const ufUpper = (uf || '').trim().toUpperCase();

  useEffect(() => {
    let cancelado = false;

    if (!ufUpper || !UFS_BRASIL_SIGLAS.has(ufUpper)) {
      setMunicipios([]);
      setErroIbge(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErroIbge(null);

    buscarMunicipiosIbge(ufUpper)
      .then((lista) => {
        if (!cancelado) {
          setMunicipios(lista);
        }
      })
      .catch((err: any) => {
        if (!cancelado) {
          setMunicipios([]);
          setErroIbge(err?.message || 'Erro ao carregar municípios do IBGE. Use a opção manual.');
        }
      })
      .finally(() => {
        if (!cancelado) {
          setLoading(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [ufUpper]);

  const options = useMemo<GeoComboboxOption[]>(
    () => municipios.map((nome) => ({ value: nome, label: nome })),
    [municipios]
  );

  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
        {label} {required && <span className="text-[#f58220]">*</span>}
      </label>
      <GeoCombobox
        value={value}
        onChange={onChange}
        options={options}
        placeholder={ufUpper ? placeholder : 'Selecione a UF primeiro...'}
        searchPlaceholder="Digite o nome do município..."
        loading={loading}
        disabled={!ufUpper}
        required={required}
        allowManual
        manualOptionLabel="Outra (digitar manualmente)"
        manualPlaceholder="Digite o nome do município"
        emptyMessage={ufUpper ? 'Município não encontrado na lista do IBGE.' : 'Selecione a UF primeiro.'}
        error={erroIbge}
      />
    </div>
  );
}

interface PaisComboboxProps {
  value: string;
  onChange: (novoPais: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  allowClear?: boolean;
  className?: string;
}

export function PaisCombobox({
  value,
  onChange,
  label = 'País de Destino',
  placeholder = 'Selecione o país...',
  required = false,
  allowClear = true,
  className = '',
}: PaisComboboxProps) {
  const options = useMemo<GeoComboboxOption[]>(
    () =>
      obterListaPaises().map((p) => ({
        value: p.nome,
        label: p.nome,
        searchTerms: p.searchTerms,
      })),
    []
  );

  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-[#f58220]">*</span>}
      </label>
      <GeoCombobox
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        searchPlaceholder="Digite para filtrar países..."
        required={required}
        allowClear={allowClear}
        emptyMessage="País não encontrado na lista."
      />
    </div>
  );
}

interface PaisCidadeComboboxProps {
  pais: string;
  value: string;
  onChange: (novaCidade: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function PaisCidadeCombobox({
  pais,
  value,
  onChange,
  label = 'Cidade',
  placeholder = 'Selecione a cidade...',
  required = false,
  className = '',
}: PaisCidadeComboboxProps) {
  const [cidades, setCidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erroCidades, setErroCidades] = useState<string | null>(null);

  const paisTrim = (pais || '').trim();
  const isBr = ehBrasil(paisTrim);

  useEffect(() => {
    let cancelado = false;

    if (!paisTrim || isBr) {
      setCidades([]);
      setErroCidades(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErroCidades(null);

    buscarCidadesPorPais(paisTrim)
      .then((lista) => {
        if (!cancelado) {
          setCidades(lista);
        }
      })
      .catch((err: any) => {
        if (!cancelado) {
          setCidades([]);
          setErroCidades(err?.message || 'Não foi possível carregar as cidades. Use a opção manual.');
        }
      })
      .finally(() => {
        if (!cancelado) {
          setLoading(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [paisTrim, isBr]);

  const options = useMemo<GeoComboboxOption[]>(
    () => cidades.map((nome) => ({ value: nome, label: nome })),
    [cidades]
  );

  if (!paisTrim) {
    return (
      <div className={className}>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-[#f58220]">*</span>}
        </label>
        <input
          type="text"
          required={required}
          placeholder="Selecione um país ou digite a cidade"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-[#f58220]">*</span>}
      </label>
      <GeoCombobox
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        searchPlaceholder="Digite o nome da cidade..."
        loading={loading}
        required={required}
        allowManual
        manualOptionLabel="Outra (digitar manualmente)"
        manualPlaceholder="Digite o nome da cidade"
        emptyMessage="Nenhuma cidade encontrada na lista deste país."
        error={erroCidades}
      />
    </div>
  );
}
