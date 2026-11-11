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
export const HASH_BELA_2026 = '$2b$10$u27eR/YG8ttK4jdJ9DWrDuSXZwmUEKvpE2lhNtKQMQ1w4iC1yBj5O';

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


        // Garantir que o admin master exista com a senhaHash oficial de @Bela2026 e preservar todos os outros usuários
        if (!Array.isArray(parsed.usuarios) || parsed.usuarios.length === 0) {
          parsed.usuarios = [
            {
              id: 'usr_admin_master',
              nome: 'Administrador PEX',
              email: 'admin@pexagritech.com',
              username: 'ADMIN',
              senhaHash: HASH_BELA_2026,
              primeiroAcesso: false,
              papel: Papel.ADMIN,
              papeis: ['ADMIN', 'DIRETORIA', 'COMERCIAL', 'FINANCEIRO', 'ADMINISTRATIVO'],
              ativo: true,
              criadoEm: new Date('2026-11-06T00:00:00.000Z'),
              atualizadoEm: new Date('2026-11-06T00:00:00.000Z'),
            },
          ];
        } else {
          // Atualiza hash do admin master se existir na lista salva
          const adminIdx = parsed.usuarios.findIndex(
            (u: any) => u.id === 'usr_admin_master' || u.email === 'admin@pexagritech.com' || u.username === 'ADMIN'
          );
          if (adminIdx !== -1) {
            parsed.usuarios[adminIdx].senhaHash = HASH_BELA_2026;
            parsed.usuarios[adminIdx].papel = Papel.ADMIN;
          } else {
            parsed.usuarios.unshift({
              id: 'usr_admin_master',
              nome: 'Administrador PEX',
              email: 'admin@pexagritech.com',
              username: 'ADMIN',
              senhaHash: HASH_BELA_2026,
              primeiroAcesso: false,
              papel: Papel.ADMIN,
              papeis: ['ADMIN', 'DIRETORIA', 'COMERCIAL', 'FINANCEIRO', 'ADMINISTRATIVO'],
              ativo: true,
              criadoEm: new Date('2026-11-06T00:00:00.000Z'),
              atualizadoEm: new Date('2026-11-06T00:00:00.000Z'),
            });
          }

        }


        // Migração do novo checklist operacional (4 macro-etapas e 27 micro-etapas)
        const precisaMigrarChecklist = !parsed.etapasTemplate || 
          parsed.etapasTemplate.length !== CHECKLIST_ETAPAS.length || 
          !parsed.etapasTemplate.some((t: any) => t.etapa.includes('Importador'));

        if (precisaMigrarChecklist) {
          let tmplIdCounter = 1;
          const novosTemplates: any[] = [];
          for (const etapa of CHECKLIST_ETAPAS) {
            novosTemplates.push({
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
          parsed.etapasTemplate = novosTemplates;

          // Atualiza as processoEtapas de cada processo
          const novasProcessoEtapas: any[] = [];
          if (Array.isArray(parsed.processos)) {
            for (const p of parsed.processos) {
              novosTemplates.forEach((t, idx) => {
                const antiga = (parsed.processoEtapas || []).find((pe: any) => pe.processoId === p.id && pe.etapaTemplateId === t.id);
                novasProcessoEtapas.push({
                  id: `pe_${p.id}_${idx + 1}`,
                  processoId: p.id,
                  etapaTemplateId: t.id,
                  status: antiga?.status ?? 'PENDENTE',
                  concluidaEm: antiga?.concluidaEm ?? null,
                  responsavelId: antiga?.responsavelId ?? null,
                  criadoEm: new Date(),
                  atualizadoEm: new Date(),
                });
              });
            }
          }
          parsed.processoEtapas = novasProcessoEtapas;
          try {
            fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
          } catch {}
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
        id: 'usr_admin_master',
        nome: 'Administrador PEX',
        email: 'admin@pexagritech.com',
        username: 'ADMIN',
        senhaHash: '$2b$10$u27eR/YG8ttK4jdJ9DWrDuSXZwmUEKvpE2lhNtKQMQ1w4iC1yBj5O',
        primeiroAcesso: false,
        papel: Papel.ADMIN,
        papeis: ['ADMIN', 'DIRETORIA', 'COMERCIAL', 'FINANCEIRO', 'ADMINISTRATIVO'],
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

const TMP_STORAGE_FILE_PATH = path.join('/tmp', 'bela_dev_store.json');

export function saveMockStoreToFile(storeToSave?: MockStore) {
  const s = storeToSave || globalStore;
  try {
    fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(s, null, 2), 'utf-8');
  } catch (err) {
    // Se o sistema de arquivos for read-only (ex: Vercel serverless), grava em /tmp
    try {
      fs.writeFileSync(TMP_STORAGE_FILE_PATH, JSON.stringify(s, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[MockStore] Erro ao gravar /tmp/bela_dev_store.json:', e);
    }
  }
}

// Singleton global mock store
const globalStore: MockStore = (global as any).__belaMockStore || initMockStore();
if (process.env.NODE_ENV !== 'production') {
  (global as any).__belaMockStore = globalStore;
}

function carregarDadosDoDisco(): any {
  if (fs.existsSync(TMP_STORAGE_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(TMP_STORAGE_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch {}
  }
  if (fs.existsSync(STORAGE_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(STORAGE_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch {}
  }
  return null;
}

export function reloadMockStoreFromFile(): MockStore {
  const parsed = carregarDadosDoDisco();
  if (parsed && Array.isArray(parsed.processos)) {
    Object.keys(globalStore).forEach((k) => delete (globalStore as any)[k]);
    Object.assign(globalStore, parsed);
  }
  return globalStore;
}

export function getMockStore(): MockStore {
  const parsed = carregarDadosDoDisco();
  if (parsed && Array.isArray(parsed.processos)) {
    Object.assign(globalStore, parsed);
  }

  if (!Array.isArray(globalStore.notasFiscais)) globalStore.notasFiscais = [];
  if (!Array.isArray(globalStore.notasFiscaisRetorno)) globalStore.notasFiscaisRetorno = [];
  if (!Array.isArray(globalStore.notasFiscaisExportacaoItens)) globalStore.notasFiscaisExportacaoItens = [];
  if (!Array.isArray(globalStore.cadastroEntidades) || globalStore.cadastroEntidades.length === 0) {
    globalStore.cadastroEntidades = getDemoCadastrosData();
  }

  // O sistema agora opera 100% no modo real e autêntico de produção
  globalStore.isDemoMode = false;

  return globalStore;
}

const DEMO_STORAGE_FILE_PATH = path.join(process.cwd(), 'prisma', 'demo-store.json');

export function isSystemInDemoMode(): boolean {
  return false;
}

export function resetMockStore(): void {
  // Limpa todos os processos e dados operacionais mantendo estritamente apenas o administrador oficial mestre
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

  // Preserva apenas o perfil ADMIN mestre oficial
  globalStore.usuarios = [
    {
      id: 'usr_admin_master',
      nome: 'Administrador PEX',
      email: 'admin@pexagritech.com',
      username: 'ADMIN',
      senhaHash: HASH_BELA_2026,
      primeiroAcesso: false,
      papel: Papel.ADMIN,
      papeis: ['ADMIN', 'DIRETORIA', 'COMERCIAL', 'FINANCEIRO', 'ADMINISTRATIVO'],
      ativo: true,
      criadoEm: new Date('2026-11-06T00:00:00.000Z'),
      atualizadoEm: new Date('2026-11-06T00:00:00.000Z'),
    },
  ];

  saveMockStoreToFile(globalStore);

  // Também limpa o arquivo demo-store se existir para evitar recargas acidentais
  try {
    fs.writeFileSync(
      DEMO_STORAGE_FILE_PATH,
      JSON.stringify(
        {
          isDemoMode: false,
          processos: [],
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
          usuarios: globalStore.usuarios,
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch {}
}

export function enableDemoMode(): void {
  // O sistema é 100% de produção real; não injeta dados de teste
  globalStore.isDemoMode = false;
  saveMockStoreToFile(globalStore);
}

export function disableDemoMode(): void {
  resetMockStore();
}

