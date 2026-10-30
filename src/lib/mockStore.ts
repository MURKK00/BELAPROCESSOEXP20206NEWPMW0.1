import fs from 'fs';
import path from 'path';
import { Fase, TipoParceiro, CategoriaDocumento, Papel, CategoriaCusto, StatusNegociacao } from '@prisma/client';
import { CHECKLIST_ETAPAS, TIPOS_DOCUMENTO_CHECKLIST } from '../../prisma/checklistData';
import { getDemoNotasFiscaisData } from './demoNotasFiscaisData';
import { getDemoCadastrosData } from './demoCadastrosData';

export interface MockStore {
  isDemoMode?: boolean;
  usuarios: any[];
  parceiros: any[];
  tiposDocumento: any[];
  etapasTemplate: any[];
  processos: any[];
  processoEtapas: any[];
  containers: any[];
  financeiros: any[];
  custosItem: any[];
  cambiosTravados: any[];
  documentos: any[];
  chatMessages: any[];
  auditLogs: any[];
  notasFiscais: any[];
  notasFiscaisRetorno: any[];
  notasFiscaisExportacaoItens: any[];
  cadastroEntidades: any[];
}

const STORAGE_FILE_PATH = path.join(process.cwd(), 'prisma', 'dev-store.json');

function initMockStore(): MockStore {
  // 1. Se existir arquivo de persistência no disco, carrega os dados salvos
  if (fs.existsSync(STORAGE_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(STORAGE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.processos)) {
        // Garantir inicialização de cadastroEntidades caso ausente no json salvo
        if (!Array.isArray(parsed.cadastroEntidades) || parsed.cadastroEntidades.length === 0) {
          parsed.cadastroEntidades = getDemoCadastrosData();
          try {
            fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
          } catch {}
        }

        // Migração de dados de rastreabilidade para processos de exemplo
        if (Array.isArray(parsed.processos)) {
          let processoMudou = false;
          for (const p of parsed.processos) {
            if (p.numeroProcesso === 'BC26-005' && !p.produtorCarCache) {
              p.produtorId = 'ent_prod_1';
              p.importadorId = 'ent_imp_1';
              p.fazendaOrigemNome = 'Fazenda Santa Maria - Gleba Araguaia';
              p.produtorCarCache = 'MT-5103007-6B18.C94A.5D12.44A8.B268.31E0.8921';
              p.produtorIeCache = '13.456.789-0';
              p.trajetoStatus = 'TERMINAL_PORTUARIO';
              p.siloArmazemOrigem = 'Silo Grãos Araguaia - Confresa/MT';
              p.terminalTransbordo = 'Terminal Ferroviário Rondonópolis / Rumo';
              p.laudoClassificacao = 'Milho Pipoca Butterfly Especial - Umidade 13.2% - Pureza 99.4%';
              p.distanciaRodoviariaKm = 1680;
              p.emissaoCO2EstimadaKg = 2150.0;
              processoMudou = true;
            } else if (p.numeroProcesso === 'BC26-002' && !p.produtorCarCache) {
              p.produtorId = 'ent_prod_2';
              p.importadorId = 'ent_imp_2';
              p.fazendaOrigemNome = 'Fazenda Primavera - Talhão Safra Sul';
              p.produtorCarCache = 'MT-5107909-7C29.D81B.4E31.89C1.A119.55F2.4401';
              p.produtorIeCache = '13.987.654-2';
              p.trajetoStatus = 'EMBARCADO_NAVIO';
              p.siloArmazemOrigem = 'Armazém Grãos Sinop Central';
              p.terminalTransbordo = 'Terminal Multimodal Santos BTP';
              p.laudoClassificacao = 'Soja Não-Transgênica (IP Non-GMO) - Umidade 12.5%';
              p.distanciaRodoviariaKm = 2140;
              p.emissaoCO2EstimadaKg = 3420.0;
              processoMudou = true;
            } else if (p.numeroProcesso === 'BC26-001' && !p.produtorCarCache) {
              p.produtorId = 'ent_prod_3';
              p.importadorId = 'ent_buy_1';
              p.fazendaOrigemNome = 'Fazenda Vale Verde - Módulo Cerrado';
              p.produtorCarCache = 'TO-1718204-1A99.88F0.22D3.77E1.C810.9902.1147';
              p.produtorIeCache = '29.384.102-8';
              p.trajetoStatus = 'TRANSBORDO_RODOVIARIO';
              p.siloArmazemOrigem = 'Silo Grãos Palmas';
              p.terminalTransbordo = 'Pátio Integrado Porto Franco / VLI';
              p.laudoClassificacao = 'Feijão Preto Tipo Extra - Safra 2026';
              p.distanciaRodoviariaKm = 1120;
              p.emissaoCO2EstimadaKg = 1890.0;
              processoMudou = true;
            }
          }
          if (processoMudou) {
            try {
              fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
            } catch {}
          }
        }
        // Migração de campos novos em usuários (username e primeiroAcesso)
        if (Array.isArray(parsed.usuarios)) {
          let mudou = false;
          for (const u of parsed.usuarios) {
            if (!u.username) {
              if (u.id === 'usr_admin_principal' || u.email === 'admin@belacereais.com.br') {
                u.username = 'ACEREAIS';
              } else if (u.id === 'usr_dev_admin' || u.email === 'dev@belacereais.local') {
                u.username = 'ADEV';
              } else {
                const partes = String(u.nome || u.email.split('@')[0])
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-zA-Z0-9\s]/g, '')
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean);
                const p1 = partes[0] ? partes[0][0].toUpperCase() : 'U';
                const p2 = partes.length > 1 ? partes[partes.length - 1].toUpperCase() : 'USUARIO';
                u.username = `${p1}${p2}`;
              }
              mudou = true;
            }
            if (u.primeiroAcesso === undefined) {
              // Usuários legados existentes já têm senha definida
              u.primeiroAcesso = false;
              mudou = true;
            }
          }
          if (mudou) {
            try {
              fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
            } catch {}
          }
        }
        return parsed;
      }
    } catch (err) {
      console.warn('[MockStore] Erro ao carregar dev-store.json:', err);
    }
  }

  // 2. Cria a estrutura base limpa
  const store: MockStore = {
    usuarios: [
      {
        id: 'usr_admin_principal',
        nome: 'Administrador Bela Cereais',
        email: 'admin@belacereais.com.br',
        username: 'ACEREAIS',
        senhaHash: '$2b$10$pbhcS1a8GjPLThpTUtinN.sUhuNTjdLNfpBIU4iotF97VmbzIOnM2',
        primeiroAcesso: false,
        papel: Papel.ADMIN,
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      },
      {
        id: 'usr_dev_admin',
        nome: 'Admin (Dev)',
        email: 'dev@belacereais.local',
        username: 'ADEV',
        senhaHash: '$2b$10$pbhcS1a8GjPLThpTUtinN.sUhuNTjdLNfpBIU4iotF97VmbzIOnM2',
        primeiroAcesso: false,
        papel: Papel.ADMIN,
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      },
    ],
    parceiros: [
      { id: 'parc_1', nome: 'Buonny', tipo: TipoParceiro.GERENCIADORA_RISCO, ativo: true, criadoEm: new Date() },
      { id: 'parc_2', nome: 'CROMO', tipo: TipoParceiro.AGENTE_DESPACHANTE, ativo: true, criadoEm: new Date() },
      { id: 'parc_3', nome: 'SCAN', tipo: TipoParceiro.AGENTE_BOOKING, ativo: true, criadoEm: new Date() },
      { id: 'parc_4', nome: 'Port Inspect', tipo: TipoParceiro.INSPETORIA, ativo: true, criadoEm: new Date() },
      { id: 'parc_5', nome: 'SURVEY / UNICCA', tipo: TipoParceiro.SURVEY_FUMIGACAO, ativo: true, criadoEm: new Date() },
      { id: 'parc_6', nome: 'AT&M', tipo: TipoParceiro.SEGURADORA, ativo: true, criadoEm: new Date() },
      { id: 'parc_7', nome: 'Banco do Brasil', tipo: TipoParceiro.BANCO, ativo: true, criadoEm: new Date() },
      { id: 'parc_8', nome: 'DHL', tipo: TipoParceiro.TRANSPORTADORA_INTL, ativo: true, criadoEm: new Date() },
      { id: 'parc_9', nome: 'Fretebras', tipo: TipoParceiro.TRANSPORTADORA, ativo: true, criadoEm: new Date() },
    ],
    tiposDocumento: [],
    etapasTemplate: [],
    processos: [], // 100% limpo, sem nenhuma negociação de exemplo
    processoEtapas: [],
    containers: [],
    financeiros: [],
    custosItem: [],
    cambiosTravados: [],
    documentos: [],
    chatMessages: [],
    auditLogs: [],
    notasFiscais: [],
    notasFiscaisRetorno: [],
    notasFiscaisExportacaoItens: [],
    cadastroEntidades: getDemoCadastrosData(),
  };

  // Tipos de documento base
  const tiposBase = [
    { nome: 'Minuta de Contrato de Compra', categoria: CategoriaDocumento.ADMINISTRATIVO, obrigatorioNoPacoteFinal: false },
    { nome: 'Contrato de Compra Assinado', categoria: CategoriaDocumento.ADMINISTRATIVO, obrigatorioNoPacoteFinal: false },
    { nome: 'Parecer de Risco (Buonny)', categoria: CategoriaDocumento.ADMINISTRATIVO, obrigatorioNoPacoteFinal: false },
    { nome: 'Ordem de Carregamento', categoria: CategoriaDocumento.ADMINISTRATIVO, obrigatorioNoPacoteFinal: false },
    { nome: 'Booking', categoria: CategoriaDocumento.BOOKING_TRANSPORTE, obrigatorioNoPacoteFinal: false },
    { nome: 'Borderô Bancário', categoria: CategoriaDocumento.FECHAMENTO_BANCARIO, obrigatorioNoPacoteFinal: false },
    { nome: 'Contrato de Câmbio', categoria: CategoriaDocumento.FECHAMENTO_BANCARIO, obrigatorioNoPacoteFinal: false },
    { nome: 'Photo Report', categoria: CategoriaDocumento.REDEX_CARREGAMENTO, obrigatorioNoPacoteFinal: false },
  ];

  let docIdCounter = 1;
  const allTipos = [...tiposBase, ...TIPOS_DOCUMENTO_CHECKLIST];
  for (const t of allTipos) {
    if (!store.tiposDocumento.some((td) => td.nome === t.nome)) {
      store.tiposDocumento.push({
        id: `td_${docIdCounter++}`,
        nome: t.nome,
        categoria: t.categoria as CategoriaDocumento,
        obrigatorioNoPacoteFinal: 'obrigatorioNoPacoteFinal' in t ? Boolean(t.obrigatorioNoPacoteFinal) : false,
        criadoEm: new Date(),
      });
    }
  }

  // Etapas template do checklist operacional
  let tmplIdCounter = 1;
  for (const etapa of CHECKLIST_ETAPAS) {
    store.etapasTemplate.push({
      id: `tmpl_${tmplIdCounter++}`,
      numero: etapa.numero,
      ordem: etapa.ordem,
      fase: etapa.fase,
      etapa: etapa.etapa,
      raiaResponsavel: etapa.raiaResponsavel,
      geraDocumento: Boolean(etapa.geraDocumento),
      tipoDocNome: etapa.tipoDocNome ?? null,
      parceiroId: null,
      parceiro: null,
      criadoEm: new Date(),
    });
  }

  // Salva a estrutura limpa
  saveMockStoreToFile(store);

  return store;
}

export function saveMockStoreToFile(storeToSave?: MockStore) {
  try {
    const s = storeToSave || globalStore;
    fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(s, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[MockStore] Erro ao gravar dev-store.json:', err);
  }
}

// Singleton global mock store
const globalStore: MockStore = (global as any).__belaMockStore || initMockStore();
if (process.env.NODE_ENV !== 'production') {
  (global as any).__belaMockStore = globalStore;
}

export function reloadMockStoreFromFile(): MockStore {
  if (fs.existsSync(STORAGE_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(STORAGE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.processos)) {
        Object.keys(globalStore).forEach(k => delete (globalStore as any)[k]);
        Object.assign(globalStore, parsed);
      }
    } catch (e) {
      console.warn('[MockStore] Erro ao sincronizar dev-store.json:', e);
    }
  }
  return globalStore;
}

export function getMockStore(): MockStore {
  if (fs.existsSync(STORAGE_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(STORAGE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.processos)) {
        Object.assign(globalStore, parsed);
      }
    } catch (e) {
      console.warn('[MockStore] Erro ao sincronizar dev-store.json:', e);
    }
  }
  if (!Array.isArray(globalStore.notasFiscais)) globalStore.notasFiscais = [];
  if (!Array.isArray(globalStore.notasFiscaisRetorno)) globalStore.notasFiscaisRetorno = [];
  if (!Array.isArray(globalStore.notasFiscaisExportacaoItens)) globalStore.notasFiscaisExportacaoItens = [];
  if (!Array.isArray(globalStore.cadastroEntidades) || globalStore.cadastroEntidades.length === 0) {
    globalStore.cadastroEntidades = getDemoCadastrosData();
  }

  // Se o sistema está em modo demonstração (ou com processos de exemplo) e ainda não tem notas fiscais, injeta os dados de exemplo
  if (
    (globalStore.isDemoMode || (globalStore.processos && globalStore.processos.length > 0)) &&
    globalStore.notasFiscais.length === 0
  ) {
    const demoNfs = getDemoNotasFiscaisData();
    globalStore.notasFiscais = demoNfs.notasFiscais;
    globalStore.notasFiscaisRetorno = demoNfs.notasFiscaisRetorno;
    globalStore.notasFiscaisExportacaoItens = demoNfs.notasFiscaisExportacaoItens;
    saveMockStoreToFile(globalStore);
  }

  return globalStore;
}

const DEMO_STORAGE_FILE_PATH = path.join(process.cwd(), 'prisma', 'demo-store.json');

export function isSystemInDemoMode(): boolean {
  const store = getMockStore();
  return Boolean(store.isDemoMode || (store.processos && store.processos.length > 0));
}

export function resetMockStore(): void {
  // Limpa os processos e dependências mantendo os catálogos base e usuários
  globalStore.isDemoMode = false;
  globalStore.processos = [];
  globalStore.processoEtapas = [];
  globalStore.containers = [];
  globalStore.financeiros = [];
  globalStore.custosItem = [];
  globalStore.cambiosTravados = [];
  globalStore.documentos = [];
  globalStore.chatMessages = [];
  globalStore.auditLogs = [];
  globalStore.notasFiscais = [];
  globalStore.notasFiscaisRetorno = [];
  globalStore.notasFiscaisExportacaoItens = [];
  globalStore.cadastroEntidades = getDemoCadastrosData();
  saveMockStoreToFile(globalStore);
}

export function enableDemoMode(): void {
  const demoNfs = getDemoNotasFiscaisData();

  // 1. Tenta carregar os dados de exemplo pré-gravados em demo-store.json
  if (fs.existsSync(DEMO_STORAGE_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(DEMO_STORAGE_FILE_PATH, 'utf-8');
      const demoData = JSON.parse(raw);
      if (demoData && Array.isArray(demoData.processos)) {
        globalStore.isDemoMode = true;
        globalStore.processos = demoData.processos || [];
        globalStore.processoEtapas = demoData.processoEtapas || [];
        globalStore.containers = demoData.containers || [];
        globalStore.financeiros = demoData.financeiros || [];
        globalStore.custosItem = demoData.custosItem || [];
        globalStore.cambiosTravados = demoData.cambiosTravados || [];
        globalStore.documentos = demoData.documentos || [];
        globalStore.chatMessages = demoData.chatMessages || [];
        globalStore.auditLogs = demoData.auditLogs || [];
        globalStore.cadastroEntidades = Array.isArray(demoData.cadastroEntidades) && demoData.cadastroEntidades.length > 0
          ? demoData.cadastroEntidades
          : getDemoCadastrosData();
        
        // Carrega notas fiscais de exemplo
        globalStore.notasFiscais = (Array.isArray(demoData.notasFiscais) && demoData.notasFiscais.length > 0)
          ? demoData.notasFiscais
          : demoNfs.notasFiscais;
        globalStore.notasFiscaisRetorno = (Array.isArray(demoData.notasFiscaisRetorno) && demoData.notasFiscaisRetorno.length > 0)
          ? demoData.notasFiscaisRetorno
          : demoNfs.notasFiscaisRetorno;
        globalStore.notasFiscaisExportacaoItens = (Array.isArray(demoData.notasFiscaisExportacaoItens) && demoData.notasFiscaisExportacaoItens.length > 0)
          ? demoData.notasFiscaisExportacaoItens
          : demoNfs.notasFiscaisExportacaoItens;

        saveMockStoreToFile(globalStore);
        return;
      }
    } catch (err) {
      console.warn('[MockStore] Erro ao ler demo-store.json:', err);
    }
  }

  // Se o arquivo não existir, recria base de demonstração completa
  globalStore.isDemoMode = true;
  globalStore.notasFiscais = demoNfs.notasFiscais;
  globalStore.notasFiscaisRetorno = demoNfs.notasFiscaisRetorno;
  globalStore.notasFiscaisExportacaoItens = demoNfs.notasFiscaisExportacaoItens;
  saveMockStoreToFile(globalStore);
}

export function disableDemoMode(): void {
  resetMockStore();
}
