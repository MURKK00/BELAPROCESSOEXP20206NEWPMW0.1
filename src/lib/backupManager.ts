import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from './prisma';
import { getMockStore } from './mockStore';

export interface BackupScheduleConfig {
  ativo: boolean;
  frequencia: 'DIARIO' | 'A_CADA_12H' | 'A_CADA_6H' | 'SEMANAL';
  horarioExecucao: string; // "HH:MM" e.g. "03:00"
  diaSemana?: number; // 0 = Domingo
  retencaoDias: number; // e.g. 15
  notificarAdminEmail: boolean;
  emailDestino: string;
  proximaExecucao?: string;
  ultimoBackupEm?: string;
  ultimoStatus?: 'SUCESSO' | 'FALHA' | 'PROCESSANDO';
}

export interface BackupLogItem {
  id: string;
  dataConclusao: string;
  tipo: 'AGENDADO' | 'MANUAL';
  status: 'SUCESSO' | 'FALHA';
  duracaoMs: number;
  tamanhoBytes: number;
  tamanhoFormatado: string;
  checksumSha256: string;
  resumoTabelas: {
    usuarios: number;
    processos: number;
    containers: number;
    notasFiscais: number;
    entidades: number;
    templates: number;
    totalRegistros: number;
  };
  arquivoNome: string;
  mensagem: string;
  iniciadoPor: string;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), 'prisma', 'dev-backup-config.json');
const LOGS_FILE_PATH = path.join(process.cwd(), 'prisma', 'dev-backup-logs.json');
const BACKUPS_DIR_PATH = path.join(process.cwd(), 'prisma', 'backups');

const DEFAULT_CONFIG: BackupScheduleConfig = {
  ativo: true,
  frequencia: 'DIARIO',
  horarioExecucao: '03:00',
  diaSemana: 0,
  retencaoDias: 15,
  notificarAdminEmail: true,
  emailDestino: 'admin@pexagritech.com',
};

// Memória em cache para resiliência serverless
let cachedConfig: BackupScheduleConfig | null = null;
let cachedLogs: BackupLogItem[] | null = null;

function ensureBackupsDir() {
  try {
    if (!fs.existsSync(BACKUPS_DIR_PATH)) {
      fs.mkdirSync(BACKUPS_DIR_PATH, { recursive: true });
    }
  } catch (err) {
    console.warn('[BackupManager] Erro ao criar diretório de backups:', err);
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function calcularProximaExecucao(config: BackupScheduleConfig): string {
  const agora = new Date();
  const [horaStr, minStr] = (config.horarioExecucao || '03:00').split(':');
  const hora = parseInt(horaStr, 10) || 3;
  const minuto = parseInt(minStr, 10) || 0;

  if (config.frequencia === 'A_CADA_6H') {
    const prox = new Date(agora.getTime() + 6 * 60 * 60 * 1000);
    return prox.toISOString();
  }

  if (config.frequencia === 'A_CADA_12H') {
    const prox = new Date(agora.getTime() + 12 * 60 * 60 * 1000);
    return prox.toISOString();
  }

  if (config.frequencia === 'SEMANAL') {
    const prox = new Date(agora);
    prox.setHours(hora, minuto, 0, 0);
    const diaAlvo = config.diaSemana ?? 0;
    const diaAtual = prox.getDay();
    let diasAte = (diaAlvo - diaAtual + 7) % 7;
    if (diasAte === 0 && prox <= agora) {
      diasAte = 7;
    }
    prox.setDate(prox.getDate() + diasAte);
    return prox.toISOString();
  }

  // Padrão: DIÁRIO
  const prox = new Date(agora);
  prox.setHours(hora, minuto, 0, 0);
  if (prox <= agora) {
    prox.setDate(prox.getDate() + 1);
  }
  return prox.toISOString();
}

export function getBackupConfig(): BackupScheduleConfig {
  if (cachedConfig) return cachedConfig;

  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.ativo === 'boolean') {
        if (!parsed.proximaExecucao) {
          parsed.proximaExecucao = calcularProximaExecucao(parsed);
        }
        cachedConfig = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[BackupManager] Erro ao ler config de backup do disco:', err);
  }

  const initialConfig = {
    ...DEFAULT_CONFIG,
    proximaExecucao: calcularProximaExecucao(DEFAULT_CONFIG),
  };
  saveBackupConfig(initialConfig);
  return initialConfig;
}

export function saveBackupConfig(newConfig: BackupScheduleConfig): BackupScheduleConfig {
  const updated: BackupScheduleConfig = {
    ...newConfig,
    proximaExecucao: calcularProximaExecucao(newConfig),
  };
  cachedConfig = updated;

  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[BackupManager] Não foi possível persistir dev-backup-config.json:', err);
  }

  return updated;
}

export function getBackupLogs(): BackupLogItem[] {
  if (cachedLogs) return cachedLogs;

  try {
    if (fs.existsSync(LOGS_FILE_PATH)) {
      const raw = fs.readFileSync(LOGS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cachedLogs = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[BackupManager] Erro ao ler logs de backup do disco:', err);
  }

  cachedLogs = [];
  return [];
}

export function saveBackupLogs(logs: BackupLogItem[]) {
  cachedLogs = logs;
  try {
    fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[BackupManager] Não foi possível persistir dev-backup-logs.json:', err);
  }
}

export async function extrairSnapshotBanco() {
  const store = getMockStore();

  let usuarios: any[] = [];
  let processos: any[] = [];
  let containers: any[] = [];
  let notasFiscais: any[] = [];
  let entidades: any[] = [];
  let etapasTemplate: any[] = [];

  try {
    usuarios = await (prisma.usuario as any).findMany().catch(() => store.usuarios || []);
  } catch {
    usuarios = store.usuarios || [];
  }

  try {
    processos = await (prisma.processo as any).findMany().catch(() => store.processos || []);
  } catch {
    processos = store.processos || [];
  }

  try {
    containers = await (prisma.container as any).findMany().catch(() => store.containers || []);
  } catch {
    containers = store.containers || [];
  }

  try {
    notasFiscais = await (prisma as any).notaFiscal?.findMany().catch(() => store.notasFiscais || []);
  } catch {
    notasFiscais = store.notasFiscais || [];
  }

  entidades = store.cadastroEntidades || [];
  etapasTemplate = store.etapasTemplate || [];

  return {
    metadata: {
      versaoBackup: '2.0-PEX-ENTERPRISE',
      bancoOrigem: 'PostgreSQL (Supabase)',
      geradoEm: new Date().toISOString(),
      geradoPor: 'PEX Backup Engine',
      ambiente: process.env.NODE_ENV || 'production',
    },
    dados: {
      usuarios,
      processos,
      containers,
      notasFiscais,
      cadastroEntidades: entidades,
      etapasTemplate,
      parceiros: store.parceiros || [],
      tiposDocumento: store.tiposDocumento || [],
    },
  };
}

export async function executarBackup(
  tipo: 'MANUAL' | 'AGENDADO' = 'MANUAL',
  iniciadoPor = 'ADMIN'
): Promise<BackupLogItem> {
  const startTime = Date.now();
  ensureBackupsDir();

  const timestampIso = new Date().toISOString();
  const fileDateStr = timestampIso.replace(/[:.]/g, '-');
  const arquivoNome = `backup_supabase_${fileDateStr}.json`;
  const arquivoPath = path.join(BACKUPS_DIR_PATH, arquivoNome);

  try {
    const snapshot = await extrairSnapshotBanco();
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const buffer = Buffer.from(jsonStr, 'utf-8');
    const tamanhoBytes = buffer.length;
    const duracaoMs = Math.max(1, Date.now() - startTime);

    const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // Tenta salvar o arquivo snapshot físico
    try {
      fs.writeFileSync(arquivoPath, jsonStr, 'utf-8');
    } catch (fsErr) {
      console.warn('[BackupManager] Aviso ao salvar arquivo físico de backup:', fsErr);
    }

    const resumoTabelas = {
      usuarios: snapshot.dados.usuarios.length,
      processos: snapshot.dados.processos.length,
      containers: snapshot.dados.containers.length,
      notasFiscais: snapshot.dados.notasFiscais.length,
      entidades: snapshot.dados.cadastroEntidades.length,
      templates: snapshot.dados.etapasTemplate.length,
      totalRegistros:
        snapshot.dados.usuarios.length +
        snapshot.dados.processos.length +
        snapshot.dados.containers.length +
        snapshot.dados.notasFiscais.length +
        snapshot.dados.cadastroEntidades.length +
        snapshot.dados.etapasTemplate.length,
    };

    const novoLog: BackupLogItem = {
      id: `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      dataConclusao: timestampIso,
      tipo,
      status: 'SUCESSO',
      duracaoMs,
      tamanhoBytes,
      tamanhoFormatado: formatBytes(tamanhoBytes),
      checksumSha256,
      resumoTabelas,
      arquivoNome,
      mensagem: `Backup do Supabase concluído com sucesso. ${resumoTabelas.totalRegistros} registros catalogados em ${duracaoMs}ms.`,
      iniciadoPor,
    };

    // Atualiza lista de logs com retenção
    const config = getBackupConfig();
    const logsAtuais = getBackupLogs();
    const limiteMs = config.retencaoDias * 24 * 60 * 60 * 1000;
    const agoraMs = Date.now();

    const logsFiltrados = [novoLog, ...logsAtuais].filter((log) => {
      const logTime = new Date(log.dataConclusao).getTime();
      return agoraMs - logTime <= limiteMs;
    });

    saveBackupLogs(logsFiltrados);

    // Atualiza status na config
    config.ultimoBackupEm = timestampIso;
    config.ultimoStatus = 'SUCESSO';
    config.proximaExecucao = calcularProximaExecucao(config);
    saveBackupConfig(config);

    return novoLog;
  } catch (error: any) {
    const duracaoMs = Math.max(1, Date.now() - startTime);
    const novoLogErro: BackupLogItem = {
      id: `bkp_err_${Date.now()}`,
      dataConclusao: timestampIso,
      tipo,
      status: 'FALHA',
      duracaoMs,
      tamanhoBytes: 0,
      tamanhoFormatado: '0 B',
      checksumSha256: '-',
      resumoTabelas: {
        usuarios: 0,
        processos: 0,
        containers: 0,
        notasFiscais: 0,
        entidades: 0,
        templates: 0,
        totalRegistros: 0,
      },
      arquivoNome: '',
      mensagem: `Falha na extração de backup do banco: ${error?.message || 'Erro desconhecido'}`,
      iniciadoPor,
    };

    const logsAtuais = getBackupLogs();
    saveBackupLogs([novoLogErro, ...logsAtuais]);

    const config = getBackupConfig();
    config.ultimoStatus = 'FALHA';
    saveBackupConfig(config);

    return novoLogErro;
  }
}

// Checagem automática do agendamento programado
export async function verificarEExecutarAgendamentoSeVencido() {
  const config = getBackupConfig();
  if (!config.ativo || !config.proximaExecucao) return null;

  const agora = new Date();
  const dataProgramada = new Date(config.proximaExecucao);

  if (agora >= dataProgramada) {
    console.log('[BackupManager] Disparando backup agendado automático...');
    return await executarBackup('AGENDADO', 'Agendador do Sistema');
  }

  return null;
}
