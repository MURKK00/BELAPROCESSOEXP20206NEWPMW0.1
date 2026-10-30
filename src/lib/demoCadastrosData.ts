export interface CadastroEntidadeItem {
  id: string;
  tipo: 'PRODUTOR' | 'IMPORTADOR' | 'BUYER';
  razaoSocial: string;
  nomeFantasia?: string | null;
  documento?: string | null;

  // Produtor Rural & Fazenda (Rastreabilidade)
  inscricaoEstadual?: string | null;
  carNumero?: string | null;
  nomePropriedade?: string | null;
  municipio?: string | null;
  uf?: string | null;
  coordenadasGps?: string | null;
  areaTotalHectares?: number | null;
  certificacoes?: string | null;
  conformidadeSocioambiental?: boolean;

  // Dados Internacionais & Contato
  pais?: string | null;
  cidade?: string | null;
  endereco?: string | null;
  complemento?: string | null;
  codigoPostal?: string | null;
  email?: string | null;
  telefone?: string | null;
  iecTaxId?: string | null;
  fassaiId?: string | null;
  panId?: string | null;
  gstId?: string | null;

  // Banco de Destino
  bancoNome?: string | null;
  bancoEndereco?: string | null;
  bancoConta?: string | null;
  bancoSwift?: string | null;
  bancoEmail?: string | null;
  bancoTelefone?: string | null;

  observacoes?: string | null;
  ativo: boolean;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
}

export function getDemoCadastrosData(): CadastroEntidadeItem[] {
  const agora = new Date().toISOString();

  return [
    {
      id: 'ent_prod_1',
      tipo: 'PRODUTOR',
      razaoSocial: 'Agropecuária Bela Vista Ltda - Fazenda Santa Maria',
      nomeFantasia: 'Fazenda Santa Maria',
      documento: '04.821.903/0001-44',
      inscricaoEstadual: '13.456.789-0',
      carNumero: 'MT-5103007-6B18.C94A.5D12.44A8.B268.31E0.8921',
      nomePropriedade: 'Fazenda Santa Maria - Gleba Araguaia',
      municipio: 'Confresa',
      uf: 'MT',
      coordenadasGps: '-10.6439, -51.5694',
      areaTotalHectares: 4850.0,
      certificacoes: 'RTRS Certified, ProTerra, Não-Transgênico (Non-GMO), Zero Desmatamento 2008+',
      conformidadeSocioambiental: true,
      pais: 'Brasil',
      cidade: 'Confresa',
      endereco: 'Rodovia MT-430, Km 42 - Zona Rural',
      email: 'origens@agrobelavista.com.br',
      telefone: '+55 66 3564-1180',
      observacoes: 'Propriedade auditada com CAR ativo e sem sobreposição em terras indígenas ou áreas embargadas pelo IBAMA.',
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'ent_prod_2',
      tipo: 'PRODUTOR',
      razaoSocial: 'Grupo Agrícola Rio Bonito - Fazenda Primavera',
      nomeFantasia: 'Fazenda Primavera',
      documento: '18.329.110/0001-72',
      inscricaoEstadual: '13.987.654-2',
      carNumero: 'MT-5107909-7C29.D81B.4E31.89C1.A119.55F2.4401',
      nomePropriedade: 'Fazenda Primavera - Talhão Safra Sul',
      municipio: 'Sinop',
      uf: 'MT',
      coordenadasGps: '-11.8542, -55.5110',
      areaTotalHectares: 6200.0,
      certificacoes: 'Soja Plus, RTRS, Rastreabilidade EUDR Compliant 2024',
      conformidadeSocioambiental: true,
      pais: 'Brasil',
      cidade: 'Sinop',
      endereco: 'Estrada da Virgínia, Km 18',
      email: 'contato@gruporiobonito.com.br',
      telefone: '+55 66 3531-9020',
      observacoes: 'Gleba com monitoramento geoespacial via satélite ativo.',
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'ent_prod_3',
      tipo: 'PRODUTOR',
      razaoSocial: 'Agro Industrial Vale do Tocantins S/A',
      nomeFantasia: 'Fazenda Vale Verde',
      documento: '22.451.980/0001-19',
      inscricaoEstadual: '29.384.102-8',
      carNumero: 'TO-1718204-1A99.88F0.22D3.77E1.C810.9902.1147',
      nomePropriedade: 'Fazenda Vale Verde - Módulo Cerrado',
      municipio: 'Palmas',
      uf: 'TO',
      coordenadasGps: '-10.1844, -48.3336',
      areaTotalHectares: 3400.0,
      certificacoes: 'Grãos Sustentáveis Cerrado, Agricultura Regenerativa',
      conformidadeSocioambiental: true,
      pais: 'Brasil',
      cidade: 'Palmas',
      endereco: 'Rodovia TO-050, Km 12',
      email: 'graos@valetocantins.agr.br',
      telefone: '+55 63 3218-4400',
      observacoes: 'Fornecedor cadastrado para feijão carioca e milho grão com escoamento pelo Corredor Norte.',
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'ent_imp_1',
      tipo: 'IMPORTADOR',
      razaoSocial: 'Vina Agri Commodities Joint Stock Company',
      nomeFantasia: 'Vina Agri Vietnam',
      documento: 'VN-0315891244',
      pais: 'Vietnã',
      cidade: 'Hai Phong',
      endereco: 'Dinh Vu Industrial Zone, Dong Hai 2 Ward, Hai An District',
      complemento: 'Building PortTech, Suite 402',
      codigoPostal: '180000',
      email: 'procurement@vina-agri.vn',
      telefone: '+84 225 382 9911',
      iecTaxId: 'VN0315891244',
      fassaiId: 'VN-IMP-9812',
      panId: 'NOT-APPLICABLE',
      gstId: 'NOT-APPLICABLE',
      bancoNome: 'Vietcombank - Joint Stock Commercial Bank for Foreign Trade of Vietnam',
      bancoEndereco: '11 Le Hong Phong, Dong Khe, Ngo Quyen, Hai Phong, Vietnam',
      bancoConta: '0011004392819',
      bancoSwift: 'BFTVVNVX',
      bancoEmail: 'tradefinance@vietcombank.com.vn',
      bancoTelefone: '+84 225 385 2400',
      observacoes: 'Principal importador de milho de pipoca para mercado do Sudeste Asiático.',
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'ent_imp_2',
      tipo: 'IMPORTADOR',
      razaoSocial: 'Meghna Group of Industries (MGI)',
      nomeFantasia: 'Meghna Grains & Agro',
      documento: 'BD-BIN-000291823',
      pais: 'Bangladesh',
      cidade: 'Dhaka',
      endereco: 'House 15, Road 34, Gulshan-1',
      complemento: 'Meghna House Executive Tower',
      codigoPostal: '1212',
      email: 'commodities@meghnagroup.biz',
      telefone: '+880 2 988 5621',
      iecTaxId: 'BD-IEC-882190',
      fassaiId: 'BSTI-AGRO-772',
      panId: 'TIN-44910284',
      gstId: 'BIN-000291823',
      bancoNome: 'Standard Chartered Bank Bangladesh',
      bancoEndereco: '67 Gulshan Avenue, Dhaka 1212, Bangladesh',
      bancoConta: '01-1184920-01',
      bancoSwift: 'SCBLBDDX',
      bancoEmail: 'bd.trade@sc.com',
      bancoTelefone: '+880 2 883 3003',
      observacoes: 'Consignatário tradicional de soja não transgênica e farelo de soja.',
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'ent_buy_1',
      tipo: 'BUYER',
      razaoSocial: 'Al Dahra Global Trading LLC',
      nomeFantasia: 'Al Dahra Agriculture',
      documento: 'AE-TRN-100293819200003',
      pais: 'Emirados Árabes Unidos',
      cidade: 'Dubai',
      endereco: 'Al Maryah Tower, Floor 14, Al Maryah Island',
      complemento: 'Jebel Ali Free Zone Gate 4',
      codigoPostal: 'PO BOX 12389',
      email: 'trade@aldahra.com',
      telefone: '+971 2 656 5000',
      iecTaxId: 'AE-JAFZA-9921',
      bancoNome: 'First Abu Dhabi Bank (FAB)',
      bancoEndereco: 'FAB Headquarters, Khalifa Business Park, Al Qurm, Abu Dhabi, UAE',
      bancoConta: 'AE440300000012938472910',
      bancoSwift: 'FABAAEAD',
      bancoEmail: 'tradesservices@bankfab.com',
      bancoTelefone: '+971 2 616 1111',
      observacoes: 'Conglomerado internacional com operações de originação e fornecimento alimentar para o Oriente Médio.',
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'ent_imp_3',
      tipo: 'IMPORTADOR',
      razaoSocial: 'Anadolu Agro Import & Trade Corp',
      nomeFantasia: 'Anadolu Grains',
      documento: 'TR-VKN-3920194821',
      pais: 'Turquia',
      cidade: 'Mersin',
      endereco: 'Atatürk Caddesi, Liman Mah. No: 142/5',
      complemento: 'Mersin Port Logistics Center',
      codigoPostal: '33010',
      email: 'import@anadoluagro.com.tr',
      telefone: '+90 324 238 9000',
      iecTaxId: 'TR-MSR-88410',
      bancoNome: 'Ziraat Bankası - Mersin Commercial Branch',
      bancoEndereco: 'İsmet İnönü Bulvarı No: 45, Mersin, Turkey',
      bancoConta: 'TR330001000200300400500601',
      bancoSwift: 'TCZBTR2A',
      bancoEmail: 'mersin.dis.ticaret@ziraatbank.com.tr',
      bancoTelefone: '+90 324 233 1122',
      observacoes: 'Importador especializado em leguminosas e feijões (Carioca e Preto).',
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  ];
}
