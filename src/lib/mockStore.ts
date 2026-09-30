import fs from 'fs';
import path from 'path';
import { Fase, TipoParceiro, CategoriaDocumento, Papel, CategoriaCusto, StatusNegociacao } from '@prisma/client';
import { CHECKLIST_ETAPAS, TIPOS_DOCUMENTO_CHECKLIST } from '../../prisma/checklistData';

export interface MockStore {
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
}

const STORAGE_FILE_PATH = path.join(process.cwd(), 'prisma', 'dev-store.json');

function initMockStore(): MockStore {
  // 1. Se existir arquivo de persistência no disco, carrega os dados salvos
  if (fs.existsSync(STORAGE_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(STORAGE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.processos)) {
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
        id: 'usr_dev_admin',
        nome: 'Admin (Dev)',
        email: 'dev@belacereais.local',
        papel: Papel.ADMIN,
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

export function getMockStore(): MockStore {
  return globalStore;
}

export function resetMockStore(): void {
  // Limpa os processos e dependências mantendo os catálogos base
  globalStore.processos = [];
  globalStore.processoEtapas = [];
  globalStore.containers = [];
  globalStore.financeiros = [];
  globalStore.custosItem = [];
  globalStore.cambiosTravados = [];
  globalStore.documentos = [];
  globalStore.chatMessages = [];
  globalStore.auditLogs = [];
  saveMockStoreToFile(globalStore);
}
