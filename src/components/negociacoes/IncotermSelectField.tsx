'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

export const INCOTERMS_OPTIONS = [
  { value: 'FOB', label: 'FOB — Free on Board' },
  { value: 'CFR', label: 'CFR — Cost and Freight' },
  { value: 'CIF', label: 'CIF — Cost, Insurance and Freight' },
  { value: 'FCA', label: 'FCA — Free Carrier' },
];

export const INCOTERMS_EXPLICACAO = [
  {
    sigla: 'CFR',
    nome: 'Cost and Freight / Custo e Frete',
    descricao: 'O exportador paga o custo da carga e o frete marítimo até o destino.',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    sigla: 'FCA',
    nome: 'Free Carrier / Livre no Transportador',
    descricao: 'O exportador entrega a carga ao transportador indicado pelo comprador no local combinado.',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    sigla: 'CIF',
    nome: 'Cost, Insurance and Freight / Custo, Seguro e Frete',
    descricao: 'Igual ao CFR, mas com o seguro marítimo pago pelo exportador.',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    sigla: 'FOB',
    nome: 'Free on Board / Livre a Bordo',
    descricao: 'O exportador coloca a carga dentro do navio no porto de embarque.',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
];

export function IncotermSelectField({
  defaultValue = 'CFR',
  required = true,
  name = 'incoterm',
}: {
  defaultValue?: string;
  required?: boolean;
  name?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-semibold text-gray-900" htmlFor={name}>
            Incoterm{required && <span className="text-red-500"> *</span>}
          </label>

          {/* ÍCONE DE INTERROGAÇÃO COM TOOLTIP EM HOVER */}
          <div
            className="relative inline-flex items-center"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowTooltip((prev) => !prev)}
              className="text-gray-400 hover:text-secondary p-0.5 rounded-full hover:bg-gray-100 transition-colors cursor-help focus:outline-none"
              aria-label="Ver detalhes dos Incoterms"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* CAIXA SUSPENSA / TOOLTIP COM DETALHES DE CADA INCOTERM */}
            {showTooltip && (
              <div
                role="tooltip"
                className="absolute left-0 top-full mt-2 w-80 sm:w-96 p-3.5 bg-gray-950 text-white rounded-xl shadow-xl z-50 text-xs border border-gray-800 animate-in fade-in duration-150"
              >
                <div className="font-bold text-[13px] text-amber-400 mb-2 pb-1.5 border-b border-gray-800 flex items-center justify-between">
                  <span>Significado dos Incoterms</span>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">Guia Rápido</span>
                </div>

                <div className="space-y-2.5">
                  {INCOTERMS_EXPLICACAO.map((item) => (
                    <div key={item.sigla} className="text-gray-200">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-extrabold text-amber-400 text-xs">
                          {item.sigla}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          ({item.nome})
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 leading-snug pl-1 border-l-2 border-amber-500/40">
                        {item.descricao}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <span className="text-[11px] text-gray-400">Passe o mouse na ❓ para guia</span>
      </div>

      {/* SELECT LIST BOX COM AS 4 OPÇÕES */}
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-blue-100 bg-white font-medium text-gray-900"
      >
        <option value="" disabled>
          Selecione o Incoterm...
        </option>
        {INCOTERMS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Componente de ajuda/tooltip compacto para ser usado na visualização/edição do Incoterm
 */
export function IncotermHelpBadge({ incoterm }: { incoterm?: string | null }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const atual = INCOTERMS_EXPLICACAO.find((item) => item.sigla === (incoterm || '').toUpperCase());

  return (
    <div
      className="relative inline-flex items-center ml-1.5 align-middle"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShowTooltip((prev) => !prev)}
        className="text-gray-400 hover:text-secondary p-0.5 rounded-full hover:bg-gray-100 transition-colors cursor-help focus:outline-none"
        aria-label="Ver regras do Incoterm"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {showTooltip && (
        <div
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 sm:w-84 p-3 bg-gray-950 text-white rounded-xl shadow-xl z-50 text-xs border border-gray-800 animate-in fade-in duration-150"
        >
          {atual ? (
            <div>
              <div className="flex items-center gap-1.5 mb-1 text-amber-400 font-bold text-[12px]">
                <span>{atual.sigla}</span>
                <span className="text-[10px] text-gray-400 font-normal">({atual.nome})</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-snug mb-2">
                {atual.descricao}
              </p>
            </div>
          ) : null}

          <div className="pt-1.5 border-t border-gray-800 space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Demais modalidades:
            </span>
            {INCOTERMS_EXPLICACAO.filter((i) => i.sigla !== (incoterm || '').toUpperCase()).map((i) => (
              <div key={i.sigla} className="text-[10px] text-gray-300">
                <strong className="text-amber-400">{i.sigla}:</strong> {i.descricao}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
