export interface UfBrasilOption {
  sigla: string;
  nome: string;
}

export const UFS_BRASIL: UfBrasilOption[] = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

export const UFS_BRASIL_SIGLAS = new Set(UFS_BRASIL.map((u) => u.sigla));

export function normalizarTextoGeo(valor?: string | null): string {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function ehBrasil(pais?: string | null): boolean {
  const norm = normalizarTextoGeo(pais);
  return norm === 'brasil' || norm === 'brazil' || norm === 'br';
}

export function formatarCep(valor?: string | null): string {
  const digits = String(valor || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

export function limparCep(valor?: string | null): string {
  return String(valor || '').replace(/\D/g, '').slice(0, 8);
}

export function encontrarMatchNaLista(valor: string | null | undefined, lista: string[]): string | null {
  const alvo = normalizarTextoGeo(valor);
  if (!alvo) return null;
  for (const item of lista) {
    if (normalizarTextoGeo(item) === alvo) {
      return item;
    }
  }
  return null;
}

// Códigos ISO-3166-1 alpha-2 completos para geração da lista de países em pt-BR via Intl.DisplayNames
const ISO_COUNTRIES: string[] = [
  'BR', 'AF', 'ZA', 'AL', 'DE', 'AD', 'AO', 'AI', 'AQ', 'AG', 'SA', 'DZ', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ',
  'BS', 'BH', 'BD', 'BB', 'BE', 'BZ', 'BJ', 'BM', 'BY', 'BO', 'BA', 'BW', 'BN', 'BG', 'BF', 'BI', 'BT', 'CV',
  'CM', 'KH', 'CA', 'QA', 'KZ', 'TD', 'CL', 'CN', 'CY', 'CO', 'KM', 'CG', 'CD', 'KP', 'KR', 'CI', 'CR', 'HR',
  'CU', 'CW', 'DK', 'DJ', 'DM', 'EG', 'SV', 'AE', 'EC', 'ER', 'SK', 'SI', 'ES', 'US', 'EE', 'SZ', 'ET', 'FJ',
  'PH', 'FI', 'FR', 'GA', 'GM', 'GH', 'GE', 'GI', 'GD', 'GR', 'GL', 'GP', 'GU', 'GT', 'GG', 'GY', 'GF', 'GN',
  'GQ', 'GW', 'HT', 'HN', 'HK', 'HU', 'YE', 'BV', 'CX', 'IM', 'NF', 'AX', 'KY', 'CC', 'CK', 'FO', 'GS', 'HM',
  'FK', 'MP', 'MH', 'UM', 'PN', 'SB', 'TC', 'VG', 'VI', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IS', 'IL', 'IT', 'JM',
  'JP', 'JE', 'JO', 'KW', 'LA', 'LS', 'LV', 'LB', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MK', 'MG', 'MY', 'MW',
  'MV', 'ML', 'MT', 'MA', 'MQ', 'MU', 'MR', 'YT', 'MX', 'MM', 'FM', 'MZ', 'MD', 'MC', 'MN', 'ME', 'MS', 'NA',
  'NR', 'NP', 'NI', 'NE', 'NG', 'NU', 'NO', 'NC', 'NZ', 'OM', 'NL', 'PW', 'PS', 'PA', 'PG', 'PK', 'PY', 'PE',
  'PF', 'PL', 'PR', 'PT', 'KE', 'KG', 'KI', 'GB', 'CF', 'DO', 'CZ', 'RE', 'RO', 'RW', 'RU', 'EH', 'PM', 'WS',
  'AS', 'SM', 'SH', 'LC', 'BL', 'KN', 'MF', 'ST', 'VC', 'SN', 'SL', 'RS', 'SC', 'SG', 'SX', 'SY', 'SO', 'LK',
  'SD', 'SS', 'SE', 'CH', 'SR', 'SJ', 'TH', 'TW', 'TJ', 'TZ', 'TF', 'IO', 'TL', 'TG', 'TK', 'TO', 'TT', 'TN',
  'TM', 'TR', 'TV', 'UA', 'UG', 'UY', 'UZ', 'VU', 'VA', 'VE', 'VN', 'WF', 'ZM', 'ZW',
];

const COUNTRY_EXTRA_ALIASES: Record<string, string[]> = {
  BR: ['brasil', 'brazil', 'br'],
  US: ['usa', 'eua', 'estados unidos', 'estados unidos da america', 'united states'],
  AE: ['eau', 'uae', 'emirados arabes', 'emirados arabes unidos', 'united arab emirates'],
  GB: ['uk', 'reino unido', 'inglaterra', 'united kingdom', 'great britain'],
  VN: ['vietna', 'vietnam', 'viet nam'],
  IN: ['india'],
  SG: ['singapura', 'cingapura', 'singapore'],
  CN: ['china'],
  SA: ['arabia saudita', 'saudi arabia'],
  BD: ['bangladesh'],
  EG: ['egito', 'egypt'],
  TR: ['turquia', 'turkey', 'turkiye'],
  KR: ['coreia do sul', 'south korea'],
  JP: ['japao', 'japan'],
  NL: ['holanda', 'paises baixos', 'netherlands'],
  DE: ['alemanha', 'germany'],
  FR: ['franca', 'france'],
  ES: ['espanha', 'spain'],
  IT: ['italia', 'italy'],
  PT: ['portugal'],
  MY: ['malasia', 'malaysia'],
  ID: ['indonesia'],
  TH: ['tailandia', 'thailand'],
  PK: ['paquistao', 'pakistan'],
  LK: ['sri lanka'],
  MA: ['marrocos', 'morocco'],
  DZ: ['argelia', 'algeria'],
  IR: ['ira', 'iran'],
  IQ: ['iraque', 'iraq'],
};

export interface PaisOption {
  iso: string;
  nome: string;
  enName: string;
  searchTerms: string;
}

let cachedPaises: PaisOption[] | null = null;

export function obterListaPaises(): PaisOption[] {
  if (cachedPaises) return cachedPaises;

  let displayPt: Intl.DisplayNames | null = null;
  let displayEn: Intl.DisplayNames | null = null;
  try {
    displayPt = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
    displayEn = new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    displayPt = null;
    displayEn = null;
  }

  const seenIso = new Set<string>();
  const lista: PaisOption[] = [];

  for (const iso of ISO_COUNTRIES) {
    if (seenIso.has(iso)) continue;
    seenIso.add(iso);

    const nomePt = displayPt?.of(iso) || iso;
    const nomeEn = displayEn?.of(iso) || nomePt;
    if (!nomePt || nomePt === iso && !COUNTRY_EXTRA_ALIASES[iso]) continue;

    const aliases = COUNTRY_EXTRA_ALIASES[iso] || [];
    const searchTerms = Array.from(
      new Set([nomePt, nomeEn, iso, ...aliases].map((t) => normalizarTextoGeo(t)))
    ).join(' ');

    lista.push({
      iso,
      nome: iso === 'BR' ? 'Brasil' : nomePt,
      enName: nomeEn,
      searchTerms,
    });
  }

  const brasil = lista.find((p) => p.iso === 'BR') || {
    iso: 'BR',
    nome: 'Brasil',
    enName: 'Brazil',
    searchTerms: 'brasil brazil br',
  };

  const demais = lista
    .filter((p) => p.iso !== 'BR')
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  cachedPaises = [brasil, ...demais];
  return cachedPaises;
}

export function resolverPaisMatch(valorSalvo?: string | null): PaisOption | null {
  const norm = normalizarTextoGeo(valorSalvo);
  if (!norm) return null;

  const paises = obterListaPaises();
  for (const pais of paises) {
    if (normalizarTextoGeo(pais.nome) === norm) return pais;
    if (normalizarTextoGeo(pais.enName) === norm) return pais;
    if (normalizarTextoGeo(pais.iso) === norm) return pais;
    const aliases = COUNTRY_EXTRA_ALIASES[pais.iso] || [];
    if (aliases.some((alias) => normalizarTextoGeo(alias) === norm)) return pais;
  }
  return null;
}

// Cache em memória de municípios por UF (IBGE)
const ibgeMunicipiosCache = new Map<string, string[]>();
const ibgeInFlight = new Map<string, Promise<string[]>>();

export async function buscarMunicipiosIbge(uf: string): Promise<string[]> {
  const ufUpper = String(uf || '').trim().toUpperCase();
  if (!UFS_BRASIL_SIGLAS.has(ufUpper)) {
    return [];
  }

  const cached = ibgeMunicipiosCache.get(ufUpper);
  if (cached) {
    return cached;
  }

  const inFlight = ibgeInFlight.get(ufUpper);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufUpper}/municipios`,
        { signal: controller.signal }
      );
      if (!res.ok) {
        throw new Error(`Falha ao consultar municípios do IBGE (${res.status}).`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Resposta inesperada da API do IBGE.');
      }

      const nomes = Array.from(
        new Set(
          data
            .map((m: any) => (typeof m?.nome === 'string' ? m.nome.trim() : ''))
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

      ibgeMunicipiosCache.set(ufUpper, nomes);
      return nomes;
    } finally {
      clearTimeout(timer);
      ibgeInFlight.delete(ufUpper);
    }
  })();

  ibgeInFlight.set(ufUpper, promise);
  return promise;
}

// Cache em memória para cidades internacionais via import dinâmico de country-state-city
const cidadesPaisCache = new Map<string, string[]>();

export async function buscarCidadesPorPais(paisValor: string): Promise<string[]> {
  const paisMatch = resolverPaisMatch(paisValor);
  let isoCode = paisMatch?.iso || '';

  const { Country, City } = await import('country-state-city');

  if (!isoCode) {
    const norm = normalizarTextoGeo(paisValor);
    if (!norm) return [];
    const foundCountry = Country.getAllCountries().find(
      (c) =>
        normalizarTextoGeo(c.name) === norm ||
        normalizarTextoGeo(c.isoCode) === norm
    );
    isoCode = foundCountry?.isoCode || '';
  }

  if (!isoCode) return [];

  const cached = cidadesPaisCache.get(isoCode);
  if (cached) return cached;

  const rawCities = City.getCitiesOfCountry(isoCode) || [];
  const uniqueNames = Array.from(
    new Set(
      rawCities
        .map((c) => (typeof c.name === 'string' ? c.name.trim() : ''))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  cidadesPaisCache.set(isoCode, uniqueNames);
  return uniqueNames;
}
