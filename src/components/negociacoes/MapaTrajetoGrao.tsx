"use client";

import dynamic from 'next/dynamic';
import { Loader2, MapPin, Navigation, Compass, Sparkles } from 'lucide-react';

// Importação dinâmica sem SSR para garantir que o Leaflet seja carregado somente no client
const MapaTrajetoLeafletInner = dynamic(
  () => import('./MapaTrajetoLeafletInner'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[580px] w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#f58220]" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Carregando Trajeto Intermodal do Grão...
        </span>
      </div>
    ),
  }
);

interface MapaTrajetoGraoProps {
  processo: any;
  produtorTemp?: any;
  armazemTemp?: {
    siloArmazemOrigem?: string;
    armazemCnpj?: string;
    armazemUf?: string;
    armazemCidade?: string;
    armazemEndereco?: string;
  };
}

export function MapaTrajetoGrao({
  processo,
  produtorTemp,
  armazemTemp,
}: MapaTrajetoGraoProps) {
  return (
    <div className="space-y-3">
      {/* CABEÇALHO DO MAPA VISUAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-500/10 text-[#f58220] border border-orange-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Mapeamento Intermodal do Grão (Da Lavoura ao Porto de Destino)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-800">
                Leaflet GPS
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Visualização geoespacial completa das etapas de escoamento: Lavoura/CAR &rarr; Silo de Beneficiamento &rarr; Porto Brasileiro &rarr; Rota Marítima Internacional.
            </p>
          </div>
        </div>
      </div>

      {/* COMPONENTE INTERATIVO LEAFLET */}
      <MapaTrajetoLeafletInner
        processo={processo}
        produtorTemp={produtorTemp}
        armazemTemp={armazemTemp}
      />
    </div>
  );
}
