"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  PontoTrajeto, 
  MetricasTrajeto, 
  construirTrajetoGrao 
} from '@/lib/geoRastreabilidade';
import { 
  Tractor, 
  Warehouse, 
  Anchor, 
  Ship, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Compass, 
  Navigation,
  Globe2,
  Truck,
  Leaf,
  Clock,
  Gauge
} from 'lucide-react';

interface MapaTrajetoLeafletInnerProps {
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

const TILE_SERVERS = {
  logistica: {
    nome: 'Logística Clara',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap, &copy; CARTO',
  },
  dark: {
    nome: 'Noturno / Wallboard',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap, &copy; CARTO',
  },
  satelite: {
    nome: 'Satélite HD',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  },
};

export default function MapaTrajetoLeafletInner({
  processo,
  produtorTemp,
  armazemTemp,
}: MapaTrajetoLeafletInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [estiloMapa, setEstiloMapa] = useState<'logistica' | 'dark' | 'satelite'>('logistica');
  const [pontoAtivoId, setPontoAtivoId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mescla dados atuais do processo com seleções em tempo real do formulário
  const processoMesclado = {
    ...processo,
    produtor: produtorTemp || processo.produtor,
    fazendaOrigemNome: produtorTemp?.nomePropriedade || processo.fazendaOrigemNome,
    produtorCarCache: produtorTemp?.carNumero || processo.produtorCarCache,
    produtorIeCache: produtorTemp?.inscricaoEstadual || processo.produtorIeCache,
    siloArmazemOrigem: armazemTemp?.siloArmazemOrigem ?? processo.siloArmazemOrigem,
    armazemCnpj: armazemTemp?.armazemCnpj ?? processo.armazemCnpj,
    armazemUf: armazemTemp?.armazemUf ?? processo.armazemUf,
    armazemCidade: armazemTemp?.armazemCidade ?? processo.armazemCidade,
    armazemEndereco: armazemTemp?.armazemEndereco ?? processo.armazemEndereco,
  };

  const trajeto = construirTrajetoGrao(processoMesclado);

  // Inicializa mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Previne erro de re-inicialização no React 18
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const container = mapContainerRef.current;
    if ((container as any)._leaflet_id) {
      (container as any)._leaflet_id = null;
    }

    const map = L.map(container, {
      zoomControl: false,
      worldCopyJump: true,
      maxBoundsViscosity: 0.8,
    });

    // Controles de zoom no canto superior direito
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Camada de Tiles
    const activeTile = TILE_SERVERS[estiloMapa];
    const tileLayer = L.tileLayer(activeTile.url, {
      attribution: activeTile.attribution,
      maxZoom: 18,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    routesLayerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Atualiza Camada de Tiles ao alternar estilo
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const activeTile = TILE_SERVERS[estiloMapa];
    tileLayerRef.current = L.tileLayer(activeTile.url, {
      attribution: activeTile.attribution,
      maxZoom: 18,
    }).addTo(map);
  }, [estiloMapa]);

  // Atualiza Marcadores, Rotas e Enquadramento sempre que os dados mudarem
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current || !routesLayerGroupRef.current) return;

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    const routesGroup = routesLayerGroupRef.current;

    markersGroup.clearLayers();
    routesGroup.clearLayers();

    // 1. Desenha Linha de Rota Terrestre (Fazenda -> Armazém -> Porto Origem)
    const polyTerrestre = L.polyline(trajeto.rotaTerrestre, {
      color: '#f58220',
      weight: 4.5,
      opacity: 0.9,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round',
    });
    polyTerrestre.bindTooltip(
      `<div class="text-xs font-bold text-amber-700">🚚 Corredor Terrestre / Intermodal: ${trajeto.metricas.distanciaTerrestreKm.toLocaleString('pt-BR')} km</div>`,
      { sticky: true }
    );
    routesGroup.addLayer(polyTerrestre);

    // 2. Desenha Linha de Rota Marítima Internacional (Porto Origem -> Porto Destino)
    const polyMaritima = L.polyline(trajeto.rotaMaritima, {
      color: '#0ea5e9',
      weight: 4.5,
      opacity: 0.85,
      dashArray: '5, 10',
      lineCap: 'round',
      lineJoin: 'round',
    });
    polyMaritima.bindTooltip(
      `<div class="text-xs font-bold text-sky-700">🚢 Rota Marítima Internacional: ${trajeto.metricas.distanciaMaritimaKm.toLocaleString('pt-BR')} km (${trajeto.metricas.distanciaMaritimaMn.toLocaleString('pt-BR')} MN)</div>`,
      { sticky: true }
    );
    routesGroup.addLayer(polyMaritima);

    // Ícones SVG personalizados via DivIcon
    const getMarkerIconHtml = (ponto: PontoTrajeto, index: number) => {
      let iconSvg = '';
      if (ponto.tipo === 'FAZENDA') {
        iconSvg = `<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 13h1m16 0h1M5 19h14M7 10l2-4h6l2 4M6 13a4 4 0 108 0 4 4 0 00-8 0zm10 2a2 2 0 104 0 2 2 0 00-4 0z"/></svg>`;
      } else if (ponto.tipo === 'ARMAZEM') {
        iconSvg = `<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`;
      } else if (ponto.tipo === 'PORTO_ORIGEM') {
        iconSvg = `<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="5" r="3" stroke-width="2.5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v13m-8-7c0 4.418 3.582 8 8 8s8-3.582 8-8m-4-6h-8"/></svg>`;
      } else {
        iconSvg = `<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="2.5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`;
      }

      return `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute -inset-2 rounded-full opacity-30 animate-ping" style="background-color: ${ponto.cor};"></div>
          <div class="relative flex items-center justify-center w-9 h-9 rounded-2xl shadow-xl border-2 border-white dark:border-slate-900 transition-transform hover:scale-125" style="background-color: ${ponto.cor};">
            ${iconSvg}
          </div>
          <div class="absolute -bottom-6 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-900/90 text-white font-extrabold text-[10px] shadow-md tracking-wider border border-white/20 pointer-events-none">
            ${index + 1}. ${ponto.tipo === 'FAZENDA' ? 'Origem' : ponto.tipo === 'ARMAZEM' ? 'Silo' : ponto.tipo === 'PORTO_ORIGEM' ? 'Porto BR' : 'Destino'}
          </div>
        </div>
      `;
    };

    // 3. Adiciona Marcadores
    trajeto.pontos.forEach((ponto, idx) => {
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: getMarkerIconHtml(ponto, idx),
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([ponto.lat, ponto.lng], { icon: customIcon });

      const popupContent = `
        <div style="min-width: 210px; font-family: inherit; color: #1e293b; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="background-color: ${ponto.cor}; width: 10px; height: 10px; border-radius: 9999px; display: inline-block;"></span>
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Etapa ${idx + 1} • ${ponto.tipo}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: 900; margin: 0 0 2px 0; color: #0f172a;">${ponto.titulo}</h4>
          <p style="font-size: 11px; margin: 0 0 8px 0; color: #475569;">${ponto.subtitulo}</p>
          
          <div style="font-size: 10px; background-color: #f1f5f9; padding: 6px 8px; border-radius: 8px; line-height: 1.4;">
            ${ponto.detalhes?.car ? `<div><strong>CAR:</strong> <span style="font-family: monospace;">${ponto.detalhes.car}</span></div>` : ''}
            ${ponto.detalhes?.ie ? `<div><strong>IE:</strong> ${ponto.detalhes.ie}</div>` : ''}
            ${ponto.detalhes?.cnpj ? `<div><strong>CNPJ:</strong> ${ponto.detalhes.cnpj}</div>` : ''}
            ${ponto.detalhes?.endereco ? `<div><strong>Endereço:</strong> ${ponto.detalhes.endereco}</div>` : ''}
            ${ponto.detalhes?.booking ? `<div><strong>Booking:</strong> ${ponto.detalhes.booking}</div>` : ''}
            ${ponto.detalhes?.navio ? `<div><strong>Navio:</strong> ${ponto.detalhes.navio}</div>` : ''}
            <div style="margin-top: 4px; color: #64748b;"><strong>Coords:</strong> ${ponto.lat.toFixed(4)}, ${ponto.lng.toFixed(4)}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'custom-bela-popup',
      });

      marker.on('click', () => {
        setPontoAtivoId(ponto.id);
      });

      markersGroup.addLayer(marker);
    });

    // Enquadra todos os pontos no mapa com padding suave
    const allCoords: [number, number][] = [
      ...trajeto.rotaTerrestre,
      ...trajeto.rotaMaritima,
    ];
    const bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds, { padding: [55, 55], maxZoom: 10 });
  }, [
    processo.id,
    processoMesclado.produtorId,
    processoMesclado.armazemId,
    processoMesclado.portoOrigem,
    processoMesclado.portoDestino,
    processoMesclado.fazendaOrigemNome,
    processoMesclado.siloArmazemOrigem,
  ]);

  // Função para voar suavemente até um waypoint específico
  const focarPonto = (ponto: PontoTrajeto) => {
    if (!mapInstanceRef.current) return;
    setPontoAtivoId(ponto.id);
    mapInstanceRef.current.flyTo([ponto.lat, ponto.lng], 9, {
      duration: 1.5,
    });
  };

  // Função para enquadrar visão geral do trajeto completo
  const enquadrarTrajetoCompleto = () => {
    if (!mapInstanceRef.current) return;
    setPontoAtivoId(null);
    const allCoords: [number, number][] = [
      ...trajeto.rotaTerrestre,
      ...trajeto.rotaMaritima,
    ];
    mapInstanceRef.current.fitBounds(L.latLngBounds(allCoords), {
      padding: [50, 50],
    });
  };

  return (
    <div className={`relative flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md transition-all duration-300 ${
      isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)]' : 'h-[580px] w-full'
    }`}>
      
      {/* BARRA SUPERIOR DE CONTROLES DO MAPA */}
      <div className="absolute top-3 left-3 right-14 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* SELETOR DE PONTOS / WAYPOINTS JUMP BUTTONS */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-lg pointer-events-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={enquadrarTrajetoCompleto}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              pontoAtivoId === null
                ? 'bg-[#f58220] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Trajeto Geral</span>
          </button>

          {trajeto.pontos.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => focarPonto(p)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                pontoAtivoId === p.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: p.cor }}
              />
              <span>
                {idx + 1}. {p.tipo === 'FAZENDA' ? 'Fazenda' : p.tipo === 'ARMAZEM' ? 'Silo' : p.tipo === 'PORTO_ORIGEM' ? 'Porto BR' : 'Destino'}
              </span>
            </button>
          ))}
        </div>

        {/* ALTERNADOR DE CAMADAS DE TILES & TELA CHEIA */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Seletor de Estilo */}
          <div className="flex items-center p-1 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-lg">
            {(['logistica', 'satelite', 'dark'] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setEstiloMapa(tipo)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer capitalize ${
                  estiloMapa === tipo
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tipo === 'logistica' ? 'Logística' : tipo === 'satelite' ? 'Satélite' : 'Noturno'}
              </button>
            ))}
          </div>

          {/* Botão de Tela Cheia */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
            title={isFullscreen ? 'Reduzir tela' : 'Expandir mapa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* RECIPIENTE DO LEAFLET */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* BARRA INFERIOR COM MÉTRICAS OPERACIONAIS DO TRAJETO */}
      <div className="absolute bottom-3 left-3 right-3 z-[400] pointer-events-none">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 shadow-xl pointer-events-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            
            {/* 1. Distância Terrestre Intermodal */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Trecho Terrestre
                </div>
                <div className="font-black text-slate-900 dark:text-white truncate">
                  {trajeto.metricas.distanciaTerrestreKm.toLocaleString('pt-BR')} km
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  ~{trajeto.metricas.tempoTerrestreDias} dias de trânsito
                </div>
              </div>
            </div>

            {/* 2. Rota Marítima Internacional */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/50 dark:border-sky-900/40">
              <div className="p-1.5 rounded-lg bg-sky-500 text-white shrink-0">
                <Ship className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">
                  Rota Marítima
                </div>
                <div className="font-black text-slate-900 dark:text-white truncate">
                  {trajeto.metricas.distanciaMaritimaKm.toLocaleString('pt-BR')} km
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {trajeto.metricas.distanciaMaritimaMn.toLocaleString('pt-BR')} MN • ~{trajeto.metricas.tempoMaritimoDias} dias
                </div>
              </div>
            </div>

            {/* 3. Distância Total & Multimodal */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/40">
              <div className="p-1.5 rounded-lg bg-indigo-500 text-white shrink-0">
                <Globe2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                  Trajeto Total
                </div>
                <div className="font-black text-slate-900 dark:text-white truncate">
                  {trajeto.metricas.distanciaTotalKm.toLocaleString('pt-BR')} km
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Intermodal Completo
                </div>
              </div>
            </div>

            {/* 4. Pegada de Carbono (ESG) */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40">
              <div className="p-1.5 rounded-lg bg-emerald-500 text-white shrink-0">
                <Leaf className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Pegada CO₂ Est.
                </div>
                <div className="font-black text-slate-900 dark:text-white truncate">
                  {(trajeto.metricas.co2TotalKg / 1000).toFixed(1)} t CO₂e
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Ecoeficiência Grãos
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
