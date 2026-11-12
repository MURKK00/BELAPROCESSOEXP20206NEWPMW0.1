export interface UserSessionRecord {
  id: string;
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
  startedAt: string;
  lastActiveAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'IDLE' | 'REVOKED' | 'EXPIRED';
  revokedAt?: string | null;
  revokedBy?: string | null;
  isCurrentSession?: boolean;
}

export interface SessionStats {
  totalActive: number;
  onlineNow: number;
  idleCount: number;
  totalRevokedToday: number;
  avgDurationMinutes: number;
  devices: { desktop: number; mobile: number; tablet: number };
  browsers: Record<string, number>;
}

const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 horas

// Armazenamento em memória global para evitar escrita em disco Read-Only na Vercel
const globalForSessions = globalThis as unknown as {
  activeUserSessions?: UserSessionRecord[];
};

function loadSessionsStore(): UserSessionRecord[] {
  if (!globalForSessions.activeUserSessions) {
    globalForSessions.activeUserSessions = [];
  }
  return globalForSessions.activeUserSessions;
}

function saveSessionsStore(sessions: UserSessionRecord[]) {
  globalForSessions.activeUserSessions = sessions;
}

export function parseUserAgent(uaString: string): {
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
} {
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

  let location = 'Brasil • Acesso Seguro PEX';
  if (
    params.ip === '127.0.0.1' ||
    params.ip === '::1' ||
    params.ip.startsWith('192.168.') ||
    params.ip.startsWith('10.')
  ) {
    location = 'Rede Corporativa PEX (Local)';
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

  const filtered = sessions.filter((s) => s.id !== params.sessionId);
  filtered.unshift(newSession);

  saveSessionsStore(filtered.slice(0, 100));
  return newSession;
}

export function touchSession(sessionId: string): boolean {
  if (!sessionId) return false;
  const sessions = loadSessionsStore();
  const index = sessions.findIndex((s) => s.id === sessionId);
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

export function isSessionRevoked(sessionId: string): boolean {
  if (!sessionId) return false;
  const sessions = loadSessionsStore();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return false;
  return session.status === 'REVOKED';
}

export function revokeSession(sessionId: string, adminIdentifier: string = 'ADMIN'): boolean {
  const sessions = loadSessionsStore();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return false;

  session.status = 'REVOKED';
  session.revokedAt = new Date().toISOString();
  session.revokedBy = adminIdentifier;

  saveSessionsStore(sessions);
  return true;
}

export function revokeAllSessionsExcept(
  currentSessionId: string | null,
  adminIdentifier: string = 'ADMIN'
): number {
  const sessions = loadSessionsStore();
  let count = 0;
  const nowIso = new Date().toISOString();

  sessions.forEach((sess) => {
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

export function listUserSessions(): UserSessionRecord[] {
  const sessions = loadSessionsStore();
  const now = Date.now();

  sessions.forEach((s) => {
    if (s.status === 'REVOKED') return;

    const expiresAtMs = new Date(s.expiresAt).getTime();
    if (now >= expiresAtMs) {
      s.status = 'EXPIRED';
      return;
    }

    const lastActiveMs = new Date(s.lastActiveAt).getTime();
    const diffMinutes = (now - lastActiveMs) / (60 * 1000);

    if (diffMinutes >= 5 && diffMinutes < 10) {
      s.status = 'IDLE';
    } else if (diffMinutes < 5) {
      s.status = 'ACTIVE';
    }
  });

  return sessions;
}

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

  sessions.forEach((s) => {
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

  const avgDurationMinutes =
    activeForAvgCount > 0 ? Math.round(totalDurationMinutes / activeForAvgCount) : 0;

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
