import fs from 'fs';
import path from 'path';

export interface UserSessionRecord {
  id: string; // ID único da sessão (ex: sess_xxxx)
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userPapeis: string[];
  ip: string;
  location: string;
  userAgent: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  startedAt: string; // ISO
  lastActiveAt: string; // ISO
  expiresAt: string; // ISO (12h após startedAt)
  status: 'ACTIVE' | 'IDLE' | 'REVOKED' | 'EXPIRED';
  revokedAt?: string | null;
  revokedBy?: string | null;
  isCurrentSession?: boolean;
}

export interface SessionStats {
  totalActive: number;
  onlineNow: number; // ativo nos últimos 5 min
  idleCount: number; // sem atividade entre 5 e 10 min
  totalRevokedToday: number;
  avgDurationMinutes: number;
  devices: { desktop: number; mobile: number; tablet: number };
  browsers: Record<string, number>;
}

const SESSIONS_FILE = path.join(process.cwd(), 'prisma', 'sessions-store.json');
const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 horas

export function parseUserAgent(uaString: string): { device: 'Desktop' | 'Mobile' | 'Tablet'; browser: string; os: string } {
  const ua = uaString || '';
  let device: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  if (/iPad|Tablet/i.test(ua)) device = 'Tablet';
  else if (/Mobile|Android|iPhone/i.test(ua)) device = 'Mobile';

  let browser = 'Google Chrome';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/Chrome/i.test(ua)) browser = 'Google Chrome';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

  let os = 'Windows 11';
  if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS Sonoma';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS 18';
  else if (/Android/i.test(ua)) os = 'Android 15';
  else if (/Linux/i.test(ua)) os = 'Linux Enterprise';

  return { device, browser, os };
}

function getDefaultSessions(): UserSessionRecord[] {
  const now = new Date();
  const subMinutes = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
  const plusHours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'sess_admin_master_1',
      userId: 'usr_admin_master',
      userName: 'Administrador PEX',
      userEmail: 'admin@pexagritech.com',
      userRole: 'ADMIN',
      userPapeis: ['ADMIN', 'DIRETORIA', 'COMERCIAL', 'FINANCEIRO', 'ADMINISTRATIVO'],
      ip: '177.136.241.108',
      location: 'Maringá, PR • Brasil',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36',
      device: 'Desktop',
      browser: 'Google Chrome',
      os: 'Windows 11',
      startedAt: subMinutes(42),
      lastActiveAt: subMinutes(1),
      expiresAt: plusHours(11),
      status: 'ACTIVE',
      revokedAt: null,
      revokedBy: null,
    },
    {
      id: 'sess_comercial_1',
      userId: 'usr_comercial_1',
      userName: 'Carlos Mendes',
      userEmail: 'carlos.mendes@pexagritech.com',
      userRole: 'COMERCIAL',
      userPapeis: ['COMERCIAL'],
      ip: '189.44.112.55',
      location: 'Curitiba, PR • Brasil',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      device: 'Desktop',
      browser: 'Apple Safari',
      os: 'macOS Sonoma',
      startedAt: subMinutes(115),
      lastActiveAt: subMinutes(3),
      expiresAt: plusHours(10),
      status: 'ACTIVE',
      revokedAt: null,
      revokedBy: null,
    },
    {
      id: 'sess_financeiro_1',
      userId: 'usr_financeiro_1',
      userName: 'Juliana Rocha',
      userEmail: 'juliana.rocha@pexagritech.com',
      userRole: 'FINANCEIRO',
      userPapeis: ['FINANCEIRO'],
      ip: '179.184.22.90',
      location: 'Londrina, PR • Brasil',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/131.0.0.0',
      device: 'Desktop',
      browser: 'Microsoft Edge',
      os: 'Windows 11',
      startedAt: subMinutes(190),
      lastActiveAt: subMinutes(7),
      expiresAt: plusHours(8),
      status: 'IDLE',
      revokedAt: null,
      revokedBy: null,
    },
    {
      id: 'sess_operacional_mobile',
      userId: 'usr_operacional_1',
      userName: 'Roberto Santos',
      userEmail: 'roberto.santos@pexagritech.com',
      userRole: 'ADMINISTRATIVO',
      userPapeis: ['ADMINISTRATIVO'],
      ip: '187.72.19.14',
      location: 'Paranaguá, PR • Brasil (Porto)',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      device: 'Mobile',
      browser: 'Apple Safari',
      os: 'iOS 18',
      startedAt: subMinutes(65),
      lastActiveAt: subMinutes(4),
      expiresAt: plusHours(10),
      status: 'ACTIVE',
      revokedAt: null,
      revokedBy: null,
    }
  ];
}

function loadSessionsStore(): UserSessionRecord[] {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.error('[sessionTracker] Erro ao ler sessions-store.json:', err);
  }
  const defaults = getDefaultSessions();
  saveSessionsStore(defaults);
  return defaults;
}

function saveSessionsStore(sessions: UserSessionRecord[]) {
  try {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (err) {
    console.error('[sessionTracker] Erro ao salvar sessions-store.json:', err);
  }
}

/**
 * Registra ou atualiza sessão no momento do login
 */
export function registerLoginSession(params: {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userPapeis: string[];
  ip: string;
  userAgent: string;
}): UserSessionRecord {
  const sessions = loadSessionsStore();
  const now = new Date();
  const parsed = parseUserAgent(params.userAgent);

  // Formata localização aproximada amigável para IPs locais/redes
  let location = 'Paraná • Brasil (Sede Bela Cereais)';
  if (params.ip === '127.0.0.1' || params.ip === '::1' || params.ip.startsWith('192.168.') || params.ip.startsWith('10.')) {
    location = 'Rede Corporativa PEX (Local)';
  } else if (params.ip.startsWith('177.')) {
    location = 'Maringá, PR • Brasil';
  } else if (params.ip.startsWith('189.')) {
    location = 'Curitiba, PR • Brasil';
  }

  const newSession: UserSessionRecord = {
    id: params.sessionId,
    userId: params.userId,
    userName: params.userName || 'Usuário PEX',
    userEmail: params.userEmail,
    userRole: params.userRole || 'COMERCIAL',
    userPapeis: params.userPapeis || [params.userRole || 'COMERCIAL'],
    ip: params.ip || '127.0.0.1',
    location,
    userAgent: params.userAgent || 'Navegador Web',
    device: parsed.device,
    browser: parsed.browser,
    os: parsed.os,
    startedAt: now.toISOString(),
    lastActiveAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ABSOLUTE_TIMEOUT_MS).toISOString(),
    status: 'ACTIVE',
    revokedAt: null,
    revokedBy: null,
  };

  // Remove registro anterior com mesmo ID se existir, e coloca o novo no topo
  const filtered = sessions.filter(s => s.id !== params.sessionId);
  filtered.unshift(newSession);

  // Mantém no máximo 100 registros históricos
  const trimmed = filtered.slice(0, 100);
  saveSessionsStore(trimmed);

  return newSession;
}

/**
 * Atualiza heartbeat de atividade da sessão
 */
export function touchSession(sessionId: string): boolean {
  if (!sessionId) return false;
  const sessions = loadSessionsStore();
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index === -1) return false;

  const session = sessions[index];
  if (session.status === 'REVOKED') return false;

  const now = new Date();
  const expiresAt = new Date(session.expiresAt).getTime();
  if (now.getTime() > expiresAt) {
    session.status = 'EXPIRED';
    saveSessionsStore(sessions);
    return false;
  }

  session.lastActiveAt = now.toISOString();
  session.status = 'ACTIVE';
  saveSessionsStore(sessions);
  return true;
}

/**
 * Verifica se a sessão foi revogada remotamente por um administrador
 */
export function isSessionRevoked(sessionId: string): boolean {
  if (!sessionId) return false;
  const sessions = loadSessionsStore();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return false;
  return session.status === 'REVOKED';
}

/**
 * Revoga uma sessão específica (Logoff remoto)
 */
export function revokeSession(sessionId: string, adminIdentifier: string = 'ADMIN'): boolean {
  const sessions = loadSessionsStore();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return false;

  session.status = 'REVOKED';
  session.revokedAt = new Date().toISOString();
  session.revokedBy = adminIdentifier;

  saveSessionsStore(sessions);
  return true;
}

/**
 * Revoga todas as sessões exceto a atual (Derrubar todos)
 */
export function revokeAllSessionsExcept(currentSessionId: string | null, adminIdentifier: string = 'ADMIN'): number {
  const sessions = loadSessionsStore();
  let count = 0;
  const nowIso = new Date().toISOString();

  sessions.forEach(sess => {
    if (sess.id !== currentSessionId && sess.status !== 'REVOKED' && sess.status !== 'EXPIRED') {
      sess.status = 'REVOKED';
      sess.revokedAt = nowIso;
      sess.revokedBy = adminIdentifier;
      count++;
    }
  });

  if (count > 0) {
    saveSessionsStore(sessions);
  }
  return count;
}

/**
 * Lista as sessões com status sincronizado com o tempo decorrido
 */
export function listUserSessions(): UserSessionRecord[] {
  const sessions = loadSessionsStore();
  const now = Date.now();

  let modified = false;
  sessions.forEach(s => {
    if (s.status === 'REVOKED') return;

    const expiresAtMs = new Date(s.expiresAt).getTime();
    if (now >= expiresAtMs) {
      if (s.status !== 'EXPIRED') {
        s.status = 'EXPIRED';
        modified = true;
      }
      return;
    }

    const lastActiveMs = new Date(s.lastActiveAt).getTime();
    const diffMinutes = (now - lastActiveMs) / (60 * 1000);

    if (diffMinutes >= 5 && diffMinutes < 10) {
      if (s.status !== 'IDLE') {
        s.status = 'IDLE';
        modified = true;
      }
    } else if (diffMinutes < 5) {
      if (s.status !== 'ACTIVE') {
        s.status = 'ACTIVE';
        modified = true;
      }
    }
  });

  if (modified) {
    saveSessionsStore(sessions);
  }

  return sessions;
}

/**
 * Calcula estatísticas consolidadas para os KPIs administrativos
 */
export function calculateSessionStats(sessions: UserSessionRecord[]): SessionStats {
  const now = Date.now();
  let totalActive = 0;
  let onlineNow = 0;
  let idleCount = 0;
  let totalRevokedToday = 0;
  let totalDurationMinutes = 0;
  let activeForAvgCount = 0;

  const devices = { desktop: 0, mobile: 0, tablet: 0 };
  const browsers: Record<string, number> = {};

  const todayStr = new Date().toISOString().split('T')[0];

  sessions.forEach(s => {
    if (s.device === 'Desktop') devices.desktop++;
    else if (s.device === 'Mobile') devices.mobile++;
    else if (s.device === 'Tablet') devices.tablet++;

    const b = s.browser || 'Outro';
    browsers[b] = (browsers[b] || 0) + 1;

    if (s.status === 'REVOKED') {
      if (s.revokedAt && s.revokedAt.startsWith(todayStr)) {
        totalRevokedToday++;
      }
      return;
    }

    const expiresAtMs = new Date(s.expiresAt).getTime();
    if (now >= expiresAtMs) return;

    const lastActiveMs = new Date(s.lastActiveAt).getTime();
    const startedAtMs = new Date(s.startedAt).getTime();
    const durationMin = Math.max(1, Math.round((lastActiveMs - startedAtMs) / (60 * 1000)));

    totalDurationMinutes += durationMin;
    activeForAvgCount++;

    const diffMin = (now - lastActiveMs) / (60 * 1000);
    if (diffMin < 5) {
      onlineNow++;
      totalActive++;
    } else if (diffMin < 10) {
      idleCount++;
      totalActive++;
    }
  });

  const avgDurationMinutes = activeForAvgCount > 0 ? Math.round(totalDurationMinutes / activeForAvgCount) : 0;

  return {
    totalActive,
    onlineNow,
    idleCount,
    totalRevokedToday,
    avgDurationMinutes,
    devices,
    browsers,
  };
}
