"use client";

import { useState, useEffect, useMemo, useRef, useId } from 'react';
import { ChevronDown, Search, X, Loader2, Edit3, List } from 'lucide-react';
import { normalizarTextoGeo } from '@/lib/localidadesHelper';

export interface GeoComboboxOption {
  value: string;
  label: string;
  searchTerms?: string;
}

interface GeoComboboxProps {
  value: string;
  onChange: (novoValor: string) => void;
  options: GeoComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  allowManual?: boolean;
  manualOptionLabel?: string;
  manualPlaceholder?: string;
  allowClear?: boolean;
  emptyMessage?: string;
  error?: string | null;
  className?: string;
}

const MAX_VISIBLE_OPTIONS = 150;

export function GeoCombobox({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Digite para filtrar...',
  loading = false,
  disabled = false,
  required = false,
  allowManual = false,
  manualOptionLabel = 'Outra (digitar manualmente)',
  manualPlaceholder = 'Digite manualmente...',
  allowClear = false,
  emptyMessage = 'Nenhuma opção encontrada.',
  error = null,
  className = '',
}: GeoComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const listboxId = useId();

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Encontra correspondência ignorando acentos e maiúsculas/minúsculas
  const matchedOption = useMemo(() => {
    const normValue = normalizarTextoGeo(value);
    if (!normValue) return null;
    for (const opt of options) {
      if (normalizarTextoGeo(opt.value) === normValue || normalizarTextoGeo(opt.label) === normValue) {
        return opt;
      }
      if (opt.searchTerms) {
        const tokens = opt.searchTerms.split(/\s+/);
        if (tokens.includes(normValue)) {
          return opt;
        }
      }
    }
    return null;
  }, [value, options]);

  // Se o valor atual não está vazio e não casou com nenhuma opção (e não está carregando), trata como valor legado preservado
  const hasLegacyUnmatched = Boolean(
    value && value.trim() !== '' && !loading && !matchedOption
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setBusca('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 20);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Se o valor for limpo externamente (ex: troca de país), sai do modo manual
  useEffect(() => {
    if (!value) {
      setManualMode(false);
    }
  }, [value]);

  const filteredOptions = useMemo(() => {
    const q = normalizarTextoGeo(busca);
    if (!q) return options;
    return options.filter((opt) => {
      const target = normalizarTextoGeo(`${opt.label} ${opt.value} ${opt.searchTerms || ''}`);
      return target.includes(q);
    });
  }, [options, busca]);

  const visibleOptions = useMemo(
    () => filteredOptions.slice(0, MAX_VISIBLE_OPTIONS),
    [filteredOptions]
  );

  function handleSelectOption(optValue: string) {
    onChange(optValue);
    setIsOpen(false);
    setBusca('');
    setManualMode(false);
  }

  function handleEnterManualMode() {
    setIsOpen(false);
    setBusca('');
    setManualMode(true);
    setTimeout(() => manualInputRef.current?.focus(), 20);
  }

  if (manualMode) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-1.5">
          <input
            ref={manualInputRef}
            type="text"
            required={required}
            disabled={disabled}
            placeholder={manualPlaceholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setManualMode(false);
              setIsOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold shrink-0 cursor-pointer"
            title="Voltar para lista suspensa"
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
        </div>
        {error && (
          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </div>
    );
  }

  const displayLabel = matchedOption
    ? matchedOption.label
    : hasLegacyUnmatched
    ? `${value} (valor atual)`
    : value || '';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input oculto para preservar validação nativa HTML5 quando required=true */}
      {required && (
        <input
          type="text"
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          className="sr-only"
        />
      )}

      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl border transition-all select-none ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
            : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 focus:ring-2 focus:ring-[#f58220]/40 outline-none'
        }`}
      >
        <span className={`truncate ${displayLabel ? 'font-medium' : 'text-slate-400'}`}>
          {loading ? 'Carregando opções...' : displayLabel || placeholder}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f58220]" />}
          {allowClear && value && !disabled && !loading && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Limpar seleção"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">
          {/* Campo de busca */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setIsOpen(false);
                    setBusca('');
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (visibleOptions.length > 0) {
                      handleSelectOption(visibleOptions[0].value);
                    }
                  }
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#f58220]/40"
              />
            </div>
          </div>

          {/* Lista de opções */}
          <div id={listboxId} className="max-h-56 overflow-y-auto py-1" role="listbox">
            {/* Opção legada preservada ("valor atual") quando não casa na lista */}
            {hasLegacyUnmatched && (
              <button
                type="button"
                onClick={() => handleSelectOption(value)}
                className="w-full text-left px-3 py-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">{value} (valor atual)</span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 shrink-0 ml-2">
                  Salvo
                </span>
              </button>
            )}

            {loading ? (
              <div className="px-3 py-4 text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#f58220]" />
                <span>Carregando lista...</span>
              </div>
            ) : visibleOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">
                {emptyMessage}
              </div>
            ) : (
              <>
                {visibleOptions.map((opt) => {
                  const isSelected =
                    matchedOption?.value === opt.value ||
                    normalizarTextoGeo(value) === normalizarTextoGeo(opt.value);

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption(opt.value)}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer truncate ${
                        isSelected
                          ? 'bg-[#f58220]/15 text-[#f58220] font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                {filteredOptions.length > MAX_VISIBLE_OPTIONS && (
                  <div className="px-3 py-1.5 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                    Exibindo {MAX_VISIBLE_OPTIONS} de {filteredOptions.length} resultados. Digite para refinar.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Opção de entrada manual sempre acessível */}
          {allowManual && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-1.5 bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={handleEnterManualMode}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#f58220] hover:bg-orange-500/10 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                <span>{manualOptionLabel}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1">{error}</p>
      )}
    </div>
  );
}
