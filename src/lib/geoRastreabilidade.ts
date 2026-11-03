// Utilitários de Geocodificação e Trajeto do Grão para Rastreabilidade Bela Cereais

export interface PontoTrajeto {
  id: string;
  tipo: 'FAZENDA' | 'ARMAZEM' | 'PORTO_ORIGEM' | 'PORTO_DESTINO';
  titulo: string;
  subtitulo: string;
  lat: number;
  lng: number;
  detalhes?: {
    car?: string;
    ie?: string;
    cnpj?: string;
    endereco?: string;
    pais?: string;
    booking?: string;
    navio?: string;
  };
  icone: 'tractor' | 'warehouse' | 'anchor' | 'ship';
  cor: string;
}

export interface MetricasTrajeto {
  distanciaTerrestreKm: number;
  distanciaMaritimaKm: number;
  distanciaMaritimaMn: number;
  distanciaTotalKm: number;
  tempoTerrestreDias: number;
  tempoMaritimoDias: number;
  co2TerrestreKg: number;
  co2MaritimoKg: number;
  co2TotalKg: number;
}

// Dicionário de Coordenadas de Portos Brasileiros (Origem de Exportação)
export const PORTOS_BRASIL_COORDS: Record<string, [number, number]> = {
  SANTOS: [-23.9618, -46.2991],
  PARANAGUA: [-25.5026, -48.5085],
  IMBITUBA: [-28.2333, -48.6667],
  RIO_GRANDE: [-32.0350, -52.0986],
  ITAQUI: [-2.5761, -44.3644],
  BARCARENA: [-1.5167, -48.7500],
  VITORIA: [-20.2889, -40.2458],
  SALVADOR: [-12.9658, -38.5137],
  SUAPE: [-8.3944, -34.9667],
};

// Dicionário de Polos Agrícolas Brasileiros
export const MUNICIPIOS_AGRO_COORDS: Record<string, [number, number]> = {
  CONFRESA: [-10.6438, -51.5694],
  SINOP: [-11.8608, -55.5095],
  SORRISO: [-12.5428, -55.7211],
  LUCAS_DO_RIO_VERDE: [-13.0645, -55.9102],
  NOVA_MUTUM: [-13.8291, -56.0827],
  QUERENCIA: [-12.6074, -52.1906],
  CANARANA: [-13.1167, -52.2689],
  PRIMAVERA_DO_LESTE: [-15.5583, -54.2961],
  CAMPO_VERDE: [-15.5458, -55.1656],
  RONDONOPOLIS: [-16.4674, -54.6368],
  CUIABA: [-15.6014, -56.0979],
  BARRA_DO_GARCAS: [-15.8928, -52.2567],
  AGUA_BOA: [-14.0531, -52.1606],
  PALMAS: [-10.2491, -48.3243],
  PORTO_NACIONAL: [-10.7081, -48.4172],
  RIO_VERDE: [-17.7925, -50.9192],
  JATAI: [-17.8814, -51.7144],
  CASCAVEL: [-24.9578, -53.4595],
  LONDRINA: [-23.3103, -51.1628],
  MARINGA: [-23.4210, -51.9331],
  DOURADOS: [-22.2211, -54.8056],
  BARREIRAS: [-12.1449, -44.9964],
  LUIS_EDUARDO_MAGALHAES: [-12.0967, -45.7958],
};

// Dicionário de Portos de Destino Internacional
export const PORTOS_INTERNACIONAIS_COORDS: Record<string, [number, number]> = {
  HAI_PHONG: [20.8449, 106.6881],
  HO_CHI_MINH: [10.7626, 106.7725],
  JEBEL_ALI: [24.9857, 55.0273],
  CHITTAGONG: [22.2500, 91.8000],
  MUNDRA: [22.7444, 69.7058],
  NHAVA_SHEVA: [18.9499, 72.9515],
  CHENNAI: [13.0827, 80.2707],
  KOLKATA: [22.5726, 88.3639],
  ROTTERDAM: [51.9500, 4.1333],
  ANTWERP: [51.2194, 4.4025],
  HAMBURG: [53.5511, 9.9937],
  VALENCIA: [39.4444, -0.3250],
  ALGECIRAS: [36.1408, -5.4562],
  SHANGHAI: [31.2304, 121.4737],
  QINGDAO: [36.0671, 120.3826],
  NINGBO: [29.8683, 121.5440],
  DAMMAM: [26.4207, 50.0888],
  KARACHI: [24.8607, 67.0011],
  COLOMBO: [6.9271, 79.8612],
  SINGAPORE: [1.3521, 103.8198],
  BUSAN: [35.1796, 129.0756],
  YOKOHAMA: [35.4437, 139.6380],
  ALEXANDRIA: [31.2001, 29.9187],
};

/**
 * Normaliza strings para busca em dicionários de coordenadas
 */
function normalizar(str: string): string {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Converte string GPS "-10.6432, -51.5698" em tupla [lat, lng]
 */
export function parseGpsCoords(gpsStr?: string | null): [number, number] | null {
  if (!gpsStr) return null;
  const parts = gpsStr.split(/[,;\s]+/).map((p) => parseFloat(p.trim()));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const [lat, lng] = parts;
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return [lat, lng];
    }
  }
  return null;
}

/**
 * Encontra coordenadas para um município agro brasileiro
 */
export function resolverCoordsAgro(municipio?: string | null, uf?: string | null): [number, number] {
  if (municipio) {
    const key = normalizar(municipio);
    for (const [k, coords] of Object.entries(MUNICIPIOS_AGRO_COORDS)) {
      if (key.includes(k) || k.includes(key)) {
        return coords;
      }
    }
  }
  
  if (uf) {
    const ufUpper = uf.toUpperCase().trim();
    if (ufUpper === 'MT') return [-12.5428, -55.7211]; // Sorriso / Coração MT
    if (ufUpper === 'TO') return [-10.2491, -48.3243]; // Palmas
    if (ufUpper === 'GO') return [-17.7925, -50.9192]; // Rio Verde
    if (ufUpper === 'PR') return [-24.9578, -53.4595]; // Cascavel
    if (ufUpper === 'MS') return [-22.2211, -54.8056]; // Dourados
    if (ufUpper === 'BA') return [-12.1449, -44.9964]; // Barreiras
  }

  // Padrão Bela Cereais: Confresa - MT (Norte Araguaia)
  return [-10.6438, -51.5694];
}

/**
 * Encontra coordenadas de porto brasileiro de saída
 */
export function resolverPortoBrasil(portoNome?: string | null): [number, number] {
  if (portoNome) {
    const key = normalizar(portoNome);
    for (const [k, coords] of Object.entries(PORTOS_BRASIL_COORDS)) {
      if (key.includes(k)) {
        return coords;
      }
    }
  }
  // Padrão: Porto de Santos
  return PORTOS_BRASIL_COORDS.SANTOS;
}

/**
 * Encontra coordenadas de porto internacional de destino
 */
export function resolverPortoDestino(portoNome?: string | null): [number, number] {
  if (portoNome) {
    const key = normalizar(portoNome);
    for (const [k, coords] of Object.entries(PORTOS_INTERNACIONAIS_COORDS)) {
      if (key.includes(k)) {
        return coords;
      }
    }
    // Verificações específicas por país/cidade comum
    if (key.includes('VIET') || key.includes('PHONG')) return PORTOS_INTERNACIONAIS_COORDS.HAI_PHONG;
    if (key.includes('DUBAI') || key.includes('JEBEL') || key.includes('EAU') || key.includes('UAE')) return PORTOS_INTERNACIONAIS_COORDS.JEBEL_ALI;
    if (key.includes('BANGLADESH') || key.includes('CHITTAGONG') || key.includes('DHAKA')) return PORTOS_INTERNACIONAIS_COORDS.CHITTAGONG;
    if (key.includes('MUNDRA')) return PORTOS_INTERNACIONAIS_COORDS.MUNDRA;
    if (key.includes('INDIA') || key.includes('MUMBAI') || key.includes('NHAVA')) return PORTOS_INTERNACIONAIS_COORDS.NHAVA_SHEVA;
    if (key.includes('CHINA') || key.includes('SHANGHAI')) return PORTOS_INTERNACIONAIS_COORDS.SHANGHAI;
    if (key.includes('ROTTERDAM') || key.includes('HOLANDA') || key.includes('NETHERLANDS')) return PORTOS_INTERNACIONAIS_COORDS.ROTTERDAM;
    if (key.includes('ESPANHA') || key.includes('VALENCIA')) return PORTOS_INTERNACIONAIS_COORDS.VALENCIA;
    if (key.includes('BELGICA') || key.includes('ANTWERP')) return PORTOS_INTERNACIONAIS_COORDS.ANTWERP;
  }
  // Padrão: Hai Phong (Vietnã)
  return PORTOS_INTERNACIONAIS_COORDS.HAI_PHONG;
}

/**
 * Calcula distância entre dois pontos (Haversine) em km
 */
export function calcularDistanciaKm(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const dLng = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[0] * Math.PI) / 180) *
      Math.cos((coord2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Gera pontos intermediários de rota marítima realista (contornando os oceanos)
 */
export function gerarRotaMaritima(origem: [number, number], destino: [number, number]): [number, number][] {
  const pontos: [number, number][] = [origem];

  // Se o destino fica na Europa (latitude positiva > 30, longitude entre -10 e 15)
  if (destino[0] > 30 && destino[1] >= -15 && destino[1] <= 15) {
    pontos.push([-15.0, -35.0]); // Atlântico Tropical Leste
    pontos.push([5.0, -28.0]);   // Linha do Equador / Canal de Cabo Verde
    pontos.push([25.0, -20.0]);  // Canárias
    if (destino[0] > 45) {
      pontos.push([48.0, -6.0]); // Entrada Canal da Mancha / Golfo da Biscaia
    } else {
      pontos.push([36.0, -7.0]); // Estreito de Gibraltar
    }
  } 
  // Se o destino fica no Oriente Médio, Índia ou Sudeste Asiático (Ásia / Oceano Índico)
  else if (destino[1] > 40) {
    pontos.push([-30.0, -35.0]); // Atlântico Sul
    pontos.push([-35.0, -10.0]); // Corredor Sul Atlântico
    pontos.push([-36.5, 18.5]);  // Cabo da Boa Esperança (África do Sul)
    pontos.push([-25.0, 48.0]);  // Oceano Índico Sul
    
    if (destino[1] < 60) {
      // Golfo Pérsico / Mar Vermelho (Jebel Ali, Dammam)
      pontos.push([12.0, 52.0]); // Golfo de Áden / Mar Arábico
      pontos.push([22.0, 60.0]); // Entrada Estreito de Ormuz
    } else if (destino[1] < 85) {
      // Índia (Nhava Sheva, Mundra, etc.)
      pontos.push([5.0, 68.0]);  // Mar da Arábia
    } else {
      // Sudeste Asiático / Vietnã / China
      pontos.push([-5.0, 85.0]); // Sul de Sri Lanka
      pontos.push([5.5, 95.0]);  // Entrada Estreito de Malaca
      pontos.push([1.3, 104.0]); // Singapura
      pontos.push([10.0, 109.0]);// Mar do Sul da China
    }
  } else {
    // Rota direta ponderada com curvatura esférica
    const midLat = (origem[0] + destino[0]) / 2;
    const midLng = (origem[1] + destino[1]) / 2;
    pontos.push([midLat - 3, midLng]);
  }

  pontos.push(destino);
  return pontos;
}

/**
 * Constrói o grafo completo de pontos e calcula métricas operacionais
 */
export function construirTrajetoGrao(processo: any): {
  pontos: PontoTrajeto[];
  rotaTerrestre: [number, number][];
  rotaMaritima: [number, number][];
  metricas: MetricasTrajeto;
} {
  // 1. Ponto Fazenda / Produtor
  let coordsFazenda: [number, number];
  if (processo.produtor?.coordenadasGps) {
    coordsFazenda = parseGpsCoords(processo.produtor.coordenadasGps) || resolverCoordsAgro(processo.produtor.municipio, processo.produtor.uf);
  } else {
    coordsFazenda = resolverCoordsAgro(processo.produtor?.municipio, processo.produtor?.uf);
  }

  const pontoFazenda: PontoTrajeto = {
    id: 'ponto-fazenda',
    tipo: 'FAZENDA',
    titulo: processo.fazendaOrigemNome || processo.produtor?.nomePropriedade || 'Fazenda de Origem',
    subtitulo: `${processo.produtor?.razaoSocial || 'Produtor Rural'} (${processo.produtor?.municipio || 'Confresa'} - ${processo.produtor?.uf || 'MT'})`,
    lat: coordsFazenda[0],
    lng: coordsFazenda[1],
    detalhes: {
      car: processo.produtorCarCache || processo.produtor?.carNumero || 'CAR não informado',
      ie: processo.produtorIeCache || processo.produtor?.inscricaoEstadual || 'IE não informada',
      pais: 'Brasil',
    },
    icone: 'tractor',
    cor: '#eab308', // Amber
  };

  // 2. Ponto Silo / Armazém de Beneficiamento
  let coordsArmazem: [number, number];
  if (processo.armazemCidade || processo.armazemUf) {
    const c = resolverCoordsAgro(processo.armazemCidade, processo.armazemUf);
    // Se coincidir exatamente com a fazenda, aplica um leve offset de 8km para visualização
    if (Math.abs(c[0] - coordsFazenda[0]) < 0.05 && Math.abs(c[1] - coordsFazenda[1]) < 0.05) {
      coordsArmazem = [c[0] - 0.08, c[1] + 0.06];
    } else {
      coordsArmazem = c;
    }
  } else {
    // Armazém regional próximo à fazenda
    coordsArmazem = [coordsFazenda[0] - 0.06, coordsFazenda[1] + 0.05];
  }

  const pontoArmazem: PontoTrajeto = {
    id: 'ponto-armazem',
    tipo: 'ARMAZEM',
    titulo: processo.siloArmazemOrigem || 'Silo & Armazém de Beneficiamento',
    subtitulo: `${processo.armazemCidade || 'Polo Regional'} - ${processo.armazemUf || 'MT'}`,
    lat: coordsArmazem[0],
    lng: coordsArmazem[1],
    detalhes: {
      cnpj: processo.armazemCnpj || 'CNPJ não informado',
      endereco: processo.armazemEndereco || 'Distrito Agroindustrial',
      pais: 'Brasil',
    },
    icone: 'warehouse',
    cor: '#3b82f6', // Blue
  };

  // 3. Ponto Porto de Origem (Brasil)
  const coordsPortoOrigem = resolverPortoBrasil(processo.portoOrigem);
  const nomePortoOrigem = processo.portoOrigem || 'Porto de Santos (BRSSZ)';

  const pontoPortoOrigem: PontoTrajeto = {
    id: 'ponto-porto-origem',
    tipo: 'PORTO_ORIGEM',
    titulo: nomePortoOrigem,
    subtitulo: 'Terminal Marítimo de Exportação',
    lat: coordsPortoOrigem[0],
    lng: coordsPortoOrigem[1],
    detalhes: {
      booking: processo.bookingNumero || 'Aguardando Booking',
      navio: processo.navio || 'Embarque Contêineres',
      pais: 'Brasil',
    },
    icone: 'anchor',
    cor: '#06b6d4', // Cyan
  };

  // 4. Ponto Porto de Destino Internacional
  const coordsPortoDestino = resolverPortoDestino(processo.portoDestino);
  const nomePortoDestino = processo.portoDestino || 'Hai Phong (VNHPH - Vietnã)';

  const pontoPortoDestino: PontoTrajeto = {
    id: 'ponto-porto-destino',
    tipo: 'PORTO_DESTINO',
    titulo: nomePortoDestino,
    subtitulo: processo.clienteFinal ? `Cliente: ${processo.clienteFinal}` : 'Desembarque Internacional',
    lat: coordsPortoDestino[0],
    lng: coordsPortoDestino[1],
    detalhes: {
      pais: processo.paisBuyer || 'Destino Internacional',
      navio: processo.navio || 'Navio Porta-Contêiner',
    },
    icone: 'ship',
    cor: '#10b981', // Emerald
  };

  // Rotas
  const rotaTerrestre: [number, number][] = [coordsFazenda, coordsArmazem, coordsPortoOrigem];
  const rotaMaritima = gerarRotaMaritima(coordsPortoOrigem, coordsPortoDestino);

  // Cálculos de Distâncias
  const distFazendaArmazem = calcularDistanciaKm(coordsFazenda, coordsArmazem);
  const distArmazemPorto = Math.round(calcularDistanciaKm(coordsArmazem, coordsPortoOrigem) * 1.25); // Rodovia real tem sinuosidade ~25%
  const distanciaTerrestreKm = distFazendaArmazem + distArmazemPorto;

  let distanciaMaritimaKm = 0;
  for (let i = 0; i < rotaMaritima.length - 1; i++) {
    distanciaMaritimaKm += calcularDistanciaKm(rotaMaritima[i], rotaMaritima[i + 1]);
  }
  const distanciaMaritimaMn = Math.round(distanciaMaritimaKm * 0.539957);
  const distanciaTotalKm = distanciaTerrestreKm + distanciaMaritimaKm;

  // Tempos estimados de trânsito
  const tempoTerrestreDias = Math.max(2, Math.round(distanciaTerrestreKm / 450)); // Média 450 km/dia com transbordo
  const tempoMaritimoDias = Math.max(12, Math.round(distanciaMaritimaKm / 750)); // Média ~16 nós cargueiro

  // Pegada de carbono (volumeKg / 1000 = toneladas)
  const toneladas = (processo.volumeKg ? Number(processo.volumeKg) : 27000) / 1000;
  // 0.035 kg CO2 por ton.km rodoviário intermodal + 0.012 kg CO2 por ton.km marítimo
  const co2TerrestreKg = Math.round(distanciaTerrestreKm * toneladas * 0.038);
  const co2MaritimoKg = Math.round(distanciaMaritimaKm * toneladas * 0.012);
  const co2TotalKg = co2TerrestreKg + co2MaritimoKg;

  return {
    pontos: [pontoFazenda, pontoArmazem, pontoPortoOrigem, pontoPortoDestino],
    rotaTerrestre,
    rotaMaritima,
    metricas: {
      distanciaTerrestreKm,
      distanciaMaritimaKm,
      distanciaMaritimaMn,
      distanciaTotalKm,
      tempoTerrestreDias,
      tempoMaritimoDias,
      co2TerrestreKg,
      co2MaritimoKg,
      co2TotalKg,
    },
  };
}
