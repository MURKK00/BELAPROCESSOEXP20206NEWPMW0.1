export interface BancoInfo {
  id: string;
  nome: string;
  aliases: string[];
  swift: string;
  endereco: string;
  cidade: string;
  pais: string;
}

export const DIRETORIO_BANCOS: BancoInfo[] = [
  // ÍNDIA (Grande importador de feijão, gergelim e pulses)
  {
    id: 'tmb_chennai',
    nome: 'TAMILNAD MERCANTILE BANK LTD',
    aliases: ['TMB', 'TAMILNAD', 'TAMILNAD MERCANTILE'],
    swift: 'TMBLINBB008',
    endereco: '20, GOLAWAR AGRAHARAM ROAD, CHENNAI - 600021, TAMIL NADU, INDIA',
    cidade: 'Chennai',
    pais: 'Índia',
  },
  {
    id: 'sbi_mumbai',
    nome: 'STATE BANK OF INDIA',
    aliases: ['SBI', 'STATE BANK', 'STATE BANK OF INDIA'],
    swift: 'SBININBB',
    endereco: 'STATE BANK BHAVAN, MADAME CAMA ROAD, NARIMAN POINT, MUMBAI - 400021, INDIA',
    cidade: 'Mumbai',
    pais: 'Índia',
  },
  {
    id: 'sbi_chennai',
    nome: 'STATE BANK OF INDIA - OVERSEAS BRANCH',
    aliases: ['SBI CHENNAI', 'STATE BANK CHENNAI'],
    swift: 'SBININBB214',
    endereco: '86, RAJAJI SALAI, CHENNAI - 600001, TAMIL NADU, INDIA',
    cidade: 'Chennai',
    pais: 'Índia',
  },
  {
    id: 'hdfc_mumbai',
    nome: 'HDFC BANK LIMITED',
    aliases: ['HDFC', 'HDFC BANK'],
    swift: 'HDFCINBB',
    endereco: 'HDFC BANK HOUSE, SENAPATI BAPAT MARG, LOWER PAREL (WEST), MUMBAI - 400013, INDIA',
    cidade: 'Mumbai',
    pais: 'Índia',
  },
  {
    id: 'icici_mumbai',
    nome: 'ICICI BANK LIMITED',
    aliases: ['ICICI', 'ICICI BANK'],
    swift: 'ICICINBB',
    endereco: 'ICICI BANK TOWERS, BANDRA-KURLA COMPLEX, BANDRA (EAST), MUMBAI - 400051, INDIA',
    cidade: 'Mumbai',
    pais: 'Índia',
  },
  {
    id: 'pnb_delhi',
    nome: 'PUNJAB NATIONAL BANK',
    aliases: ['PNB', 'PUNJAB NATIONAL'],
    swift: 'PUNBINBB',
    endereco: 'PLOT NO 4, SECTOR 10, DWARKA, NEW DELHI - 110075, INDIA',
    cidade: 'Nova Delhi',
    pais: 'Índia',
  },
  {
    id: 'bob_mumbai',
    nome: 'BANK OF BARODA',
    aliases: ['BOB', 'BARODA', 'BANK OF BARODA'],
    swift: 'BARBINBB',
    endereco: 'BARODA CORPORATE CENTRE, C-26, G-BLOCK, BKC, BANDRA (E), MUMBAI - 400051, INDIA',
    cidade: 'Mumbai',
    pais: 'Índia',
  },
  {
    id: 'canara_bangalore',
    nome: 'CANARA BANK',
    aliases: ['CANARA', 'CANARA BANK'],
    swift: 'CNRBINBB',
    endereco: '112, J.C. ROAD, BANGALORE - 560002, KARNATAKA, INDIA',
    cidade: 'Bangalore',
    pais: 'Índia',
  },
  {
    id: 'axis_mumbai',
    nome: 'AXIS BANK LIMITED',
    aliases: ['AXIS', 'AXIS BANK'],
    swift: 'UTIBINBB',
    endereco: 'AXIS HOUSE, C-2, WADIA INTERNATIONAL CENTRE, PANDURANG BUDHKAR MARG, WORLI, MUMBAI - 400025, INDIA',
    cidade: 'Mumbai',
    pais: 'Índia',
  },
  {
    id: 'iob_chennai',
    nome: 'INDIAN OVERSEAS BANK',
    aliases: ['IOB', 'INDIAN OVERSEAS'],
    swift: 'IOBHINBB',
    endereco: '763, ANNA SALAI, CHENNAI - 600002, TAMIL NADU, INDIA',
    cidade: 'Chennai',
    pais: 'Índia',
  },
  {
    id: 'kotak_mumbai',
    nome: 'KOTAK MAHINDRA BANK',
    aliases: ['KOTAK', 'KOTAK MAHINDRA'],
    swift: 'KKBKINBB',
    endereco: '27 BKC, C 27, G BLOCK, BANDRA KURLA COMPLEX, BANDRA (E), MUMBAI - 400051, INDIA',
    cidade: 'Mumbai',
    pais: 'Índia',
  },

  // ORIENTE MÉDIO / EMIRADOS / EGITO / TURQUIA
  {
    id: 'enbd_dubai',
    nome: 'EMIRATES NBD BANK PJSC',
    aliases: ['EMIRATES NBD', 'ENBD', 'EMIRATES BANK'],
    swift: 'EBILAEAD',
    endereco: 'BANIYAS ROAD, DEIRA, P.O. BOX 777, DUBAI, UNITED ARAB EMIRATES',
    cidade: 'Dubai',
    pais: 'Emirados Árabes Unidos',
  },
  {
    id: 'fab_abudhabi',
    nome: 'FIRST ABU DHABI BANK PJSC',
    aliases: ['FAB', 'FIRST ABU DHABI'],
    swift: 'FABUAEAD',
    endereco: 'FAB BUILDING, KHALIFA BUSINESS PARK, AL QURM, P.O. BOX 6316, ABU DHABI, UAE',
    cidade: 'Abu Dhabi',
    pais: 'Emirados Árabes Unidos',
  },
  {
    id: 'mashreq_dubai',
    nome: 'MASHREQ BANK PSC',
    aliases: ['MASHREQ', 'MASHREQ BANK'],
    swift: 'BOMLAEAD',
    endereco: 'AL UMRAN STREET, DOWNTOWN DUBAI, P.O. BOX 1250, DUBAI, UAE',
    cidade: 'Dubai',
    pais: 'Emirados Árabes Unidos',
  },
  {
    id: 'nbe_cairo',
    nome: 'NATIONAL BANK OF EGYPT',
    aliases: ['NBE', 'NATIONAL BANK OF EGYPT', 'BANCO DO EGITO'],
    swift: 'NBEGEGCX',
    endereco: '1187 CORNICHE EL NIL, BOULAK, P.O. BOX 11611, CAIRO, EGYPT',
    cidade: 'Cairo',
    pais: 'Egito',
  },
  {
    id: 'banque_misr',
    nome: 'BANQUE MISR',
    aliases: ['MISR', 'BANQUE MISR'],
    swift: 'BMISEGCA',
    endereco: '151 MOHAMED FARID STREET, DOWNTOWN, CAIRO, EGYPT',
    cidade: 'Cairo',
    pais: 'Egito',
  },
  {
    id: 'isbank_istanbul',
    nome: 'TÜRKIYE IS BANKASI A.S.',
    aliases: ['ISBANK', 'IS BANKASI', 'TURKIYE IS BANKASI'],
    swift: 'ISBKTRIS',
    endereco: 'IS KULELERI, KULE 1, 34330 LEVENT, BESIKTAS, ISTANBUL, TURKEY',
    cidade: 'Istambul',
    pais: 'Turquia',
  },
  {
    id: 'ziraat_istanbul',
    nome: 'T.C. ZIRAAT BANKASI A.S.',
    aliases: ['ZIRAAT', 'ZIRAAT BANKASI'],
    swift: 'TCZBTR2A',
    endereco: 'DOGANBEY MAH. ATATURK BULVARI NO: 8, ULUS, 06050 ANKARA, TURKEY',
    cidade: 'Ancara',
    pais: 'Turquia',
  },

  // ÁSIA / CHINA / HONG KONG / CINGAPURA / VIETNÃ
  {
    id: 'boc_beijing',
    nome: 'BANK OF CHINA',
    aliases: ['BOC', 'BANK OF CHINA', 'BANCO DA CHINA'],
    swift: 'BKCHCNBJ',
    endereco: '1 FUXINGMEN NEIDAJIE, XICHENG DISTRICT, BEIJING - 100818, CHINA',
    cidade: 'Pequim',
    pais: 'China',
  },
  {
    id: 'icbc_beijing',
    nome: 'INDUSTRIAL AND COMMERCIAL BANK OF CHINA (ICBC)',
    aliases: ['ICBC', 'INDUSTRIAL AND COMMERCIAL BANK OF CHINA'],
    swift: 'ICBKCNBJ',
    endereco: '55 FUXINGMEN NEIDAJIE, XICHENG DISTRICT, BEIJING - 100140, CHINA',
    cidade: 'Pequim',
    pais: 'China',
  },
  {
    id: 'hsbc_hk',
    nome: 'THE HONGKONG AND SHANGHAI BANKING CORP (HSBC)',
    aliases: ['HSBC', 'HSBC HONG KONG', 'HSBC BANK'],
    swift: 'HSBCHKHH',
    endereco: '1 QUEEN\'S ROAD CENTRAL, CENTRAL, HONG KONG',
    cidade: 'Hong Kong',
    pais: 'Hong Kong',
  },
  {
    id: 'dbs_singapore',
    nome: 'DBS BANK LTD',
    aliases: ['DBS', 'DBS BANK'],
    swift: 'DBSSSGSG',
    endereco: '12 MARINA BOULEVARD, MARINA BAY FINANCIAL CENTRE TOWER 3, SINGAPORE 018982',
    cidade: 'Singapura',
    pais: 'Singapura',
  },
  {
    id: 'ocbc_singapore',
    nome: 'OCBC BANK',
    aliases: ['OCBC', 'OVERSEA-CHINESE BANKING CORP'],
    swift: 'OCBCSGSG',
    endereco: '65 CHULIA STREET, OCBC CENTRE, SINGAPORE 049513',
    cidade: 'Singapura',
    pais: 'Singapura',
  },
  {
    id: 'vietcombank_hanoi',
    nome: 'JOINT STOCK COMMERCIAL BANK FOR FOREIGN TRADE OF VIETNAM (VIETCOMBANK)',
    aliases: ['VIETCOMBANK', 'VCB'],
    swift: 'BFTVVNVX',
    endereco: '198 TRAN QUANG KHAI STREET, HOAN KIEM DISTRICT, HANOI, VIETNAM',
    cidade: 'Hanói',
    pais: 'Vietnã',
  },

  // BRASIL & AMÉRICAS (Bancos de apoio e traders internacionais)
  {
    id: 'bb_brasil',
    nome: 'BANCO DO BRASIL S.A.',
    aliases: ['BANCO DO BRASIL', 'BB'],
    swift: 'BRASBRRJ',
    endereco: 'SBS QUADRA 1, BLOCO C, EDIFÍCIO SEDE III, BRASÍLIA - DF, 70073-901, BRASIL',
    cidade: 'Brasília',
    pais: 'Brasil',
  },
  {
    id: 'itau_brasil',
    nome: 'ITAÚ UNIBANCO S.A.',
    aliases: ['ITAU', 'ITAU UNIBANCO', 'ITAÚ'],
    swift: 'ITAUBRSP',
    endereco: 'PRAÇA ALFREDO EGYDIO DE SOUZA ARANHA, 100, TORRE OLAVO SETUBAL, SÃO PAULO - SP, BRASIL',
    cidade: 'São Paulo',
    pais: 'Brasil',
  },
  {
    id: 'bradesco_brasil',
    nome: 'BANCO BRADESCO S.A.',
    aliases: ['BRADESCO', 'BANCO BRADESCO'],
    swift: 'BBDEBRSP',
    endereco: 'CIDADE DE DEUS, S/N, VILA YARA, OSASCO - SP, 06029-900, BRASIL',
    cidade: 'Osasco / São Paulo',
    pais: 'Brasil',
  },
  {
    id: 'santander_brasil',
    nome: 'BANCO SANTANDER (BRASIL) S.A.',
    aliases: ['SANTANDER', 'BANCO SANTANDER'],
    swift: 'BSCHBRSP',
    endereco: 'AV. PRES. JUSCELINO KUBITSCHEK, 2041 / 2235, SÃO PAULO - SP, 04543-011, BRASIL',
    cidade: 'São Paulo',
    pais: 'Brasil',
  },
  {
    id: 'jpmorgan_ny',
    nome: 'JPMORGAN CHASE BANK, N.A.',
    aliases: ['JPMORGAN', 'JP MORGAN', 'CHASE'],
    swift: 'CHASUS33',
    endereco: '383 MADISON AVENUE, NEW YORK, NY 10017, UNITED STATES',
    cidade: 'Nova York',
    pais: 'Estados Unidos',
  },
  {
    id: 'citibank_ny',
    nome: 'CITIBANK, N.A.',
    aliases: ['CITIBANK', 'CITI', 'CITI BANK'],
    swift: 'CITIUS33',
    endereco: '388 GREENWICH STREET, NEW YORK, NY 10013, UNITED STATES',
    cidade: 'Nova York',
    pais: 'Estados Unidos',
  },
  {
    id: 'rabobank_nl',
    nome: 'COÖPERATIEVE RABOBANK U.A. (RABOBANK)',
    aliases: ['RABOBANK', 'RABO'],
    swift: 'RABONL2U',
    endereco: 'CROESELAAN 18, 3521 CB UTRECHT, THE NETHERLANDS',
    cidade: 'Utrecht',
    pais: 'Países Baixos',
  },
  {
    id: 'bnp_paris',
    nome: 'BNP PARIBAS',
    aliases: ['BNP', 'BNP PARIBAS'],
    swift: 'BNPAFRRP',
    endereco: '16 BOULEVARD DES ITALIENS, 75009 PARIS, FRANCE',
    cidade: 'Paris',
    pais: 'França',
  },
  {
    id: 'deutsche_frankfurt',
    nome: 'DEUTSCHE BANK AG',
    aliases: ['DEUTSCHE BANK', 'DB'],
    swift: 'DEUTDEDD',
    endereco: 'TAUNUSANLAGE 12, 60325 FRANKFURT AM MAIN, GERMANY',
    cidade: 'Frankfurt',
    pais: 'Alemanha',
  },
];

/**
 * Normaliza strings para busca sem acentos e em minúsculas
 */
function normalizarTexto(txt: string): string {
  return txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Busca bancos por nome, alias ou código SWIFT
 */
export function buscarBancos(termo: string): BancoInfo[] {
  const q = normalizarTexto(termo);
  if (!q) return [];

  return DIRETORIO_BANCOS.filter((b) => {
    const nomeNorm = normalizarTexto(b.nome);
    const swiftNorm = normalizarTexto(b.swift);
    const cidadeNorm = normalizarTexto(b.cidade);
    const paisNorm = normalizarTexto(b.pais);

    if (nomeNorm.includes(q) || swiftNorm.includes(q) || cidadeNorm.includes(q) || paisNorm.includes(q)) {
      return true;
    }

    return b.aliases.some((alias) => normalizarTexto(alias).includes(q));
  });
}
