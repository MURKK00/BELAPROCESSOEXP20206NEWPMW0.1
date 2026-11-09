'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Users, 
  Laptop, 
  Smartphone, 
  Tablet, 
  ShieldAlert, 
  LogOut, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Globe, 
  ShieldCheck, 
  Search,
  Filter,
  Check,
  PowerOff
} from 'lucide-react';
import { UserSessionRecord, SessionStats } from '@/lib/sessionTracker';

export function SessionsManager() {
  const [sessions, setSessions] = useState<UserSessionRecord[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [executingAction, setExecutingAction] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ACTIVE' | 'IDLE' | 'REVOKED'>('TODOS');
  const [busca, setBusca] = useState<string>('');
  
  // Modais de confirmação
  const [revokingSession, setRevokingSession] = useState<UserSessionRecord | null>(null);
  const [modalRevokeAll, setModalRevokeAll] = useState<boolean>(false);

  const carregarSessoes = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch('/api/admin/sessions');
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setStats(data.stats || null);
        setCurrentSessionId(data.currentSessionId || null);
      } else {
        if (!isSilent) setFeedback({ type: 'error', message: data.error || 'Falha ao carregar sessões.' });
      }
    } catch {
      if (!isSilent) setFeedback({ type: 'error', message: 'Erro de conexão com o servidor.' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarSessoes();
    // Atualização automática a cada 20 segundos
    const timer = setInterval(() => {
      carregarSessoes(true);
    }, 20000);
    return () => clearInterval(timer);
  }, [carregarSessoes]);

  async function handleRevokeSession(session: UserSessionRecord) {
    setExecutingAction(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', sessionId: session.id }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ 
          type: 'success', 
          message: `Sessão de ${session.userName} (${session.userEmail}) encerrada com sucesso.` 
        });
        setRevokingSession(null);
        carregarSessoes(true);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Erro ao revogar sessão.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha de comunicação com o servidor.' });
    } finally {
      setExecutingAction(false);
    }
  }

  async function handleRevokeAllSessions() {
    setExecutingAction(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke_all' }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ 
          type: 'success', 
          message: data.message || 'Todas as outras sessões foram encerradas com sucesso.' 
        });
        setModalRevokeAll(false);
        carregarSessoes(true);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Erro ao revogar todas as sessões.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha de comunicação com o servidor.' });
    } finally {
      setExecutingAction(false);
    }
  }

  // Formatação de data/hora amigável
  function formatTime(isoString: string) {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '--';
    }
  }

  function formatRelative(isoString: string) {
    if (!isoString) return '--';
    try {
      const diffMin = Math.round((Date.now() - new Date(isoString).getTime()) / (60 * 1000));
      if (diffMin < 1) return 'Agora mesmo';
      if (diffMin === 1) return 'Há 1 minuto';
      if (diffMin < 60) return `Há ${diffMin} minutos`;
      const diffHours = Math.floor(diffMin / 60);
      return `Há ${diffHours}h ${diffMin % 60}m`;
    } catch {
      return '--';
    }
  }

  function formatRemaining12h(expiresAtIso: string) {
    try {
      const diffMs = new Date(expiresAtIso).getTime() - Date.now();
      if (diffMs <= 0) return 'Expirada';
      const hours = Math.floor(diffMs / (60 * 60 * 1000));
      const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
      return `${hours}h ${mins}m restantes`;
    } catch {
      return '--';
    }
  }

  // Filtragem de sessões
  const sessoesFiltradas = sessions.filter(sess => {
    if (filtroStatus === 'ACTIVE' && sess.status !== 'ACTIVE') return false;
    if (filtroStatus === 'IDLE' && sess.status !== 'IDLE') return false;
    if (filtroStatus === 'REVOKED' && sess.status !== 'REVOKED') return false;

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const matchNome = sess.userName?.toLowerCase().includes(termo);
      const matchEmail = sess.userEmail?.toLowerCase().includes(termo);
      const matchIp = sess.ip?.toLowerCase().includes(termo);
      const matchRole = sess.userRole?.toLowerCase().includes(termo);
      const matchDevice = sess.device?.toLowerCase().includes(termo);
      const matchBrowser = sess.browser?.toLowerCase().includes(termo);
      return matchNome || matchEmail || matchIp || matchRole || matchDevice || matchBrowser;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MÓDULO DE SESSÕES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/20 via-slate-900/10 to-teal-950/20 dark:from-emerald-950/30 dark:to-slate-900/40 p-5 rounded-3xl border border-emerald-500/20">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-xs">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Monitoramento &amp; Controle de Sessões Ativas
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Tempo Real
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualize quem está conectado no sistema Bela Cereais, tempo de atividade e execute logoff remoto por segurança.
            </p>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO RÁPIDA */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => carregarSessoes(false)}
            disabled={loading || executingAction}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Atualizar sessões em tempo real"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setModalRevokeAll(true)}
            disabled={executingAction || Boolean(stats && stats.totalActive <= 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-900/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PowerOff className="w-3.5 h-3.5" />
            <span>Derrubar Todas as Sessões</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK MENSAGEM */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* CARDS DE ESTATÍSTICAS (KPIS) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Online Agora */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Online Agora</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats?.onlineNow ?? '--'}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              ativos &lt; 5 min
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Conexões em tempo real</span>
          </div>
        </div>

        {/* KPI 2: Sessões Ociosas */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Em Ociosidade</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats?.idleCount ?? '--'}
            </span>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              5 a 10 min
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Aviso de bloqueio disparado
          </div>
        </div>

        {/* KPI 3: Tempo Médio de Navegação */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Duração Média</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats?.avgDurationMinutes ? `${stats.avgDurationMinutes}m` : '--'}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              por sessão
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Teto absoluto de 12 horas
          </div>
        </div>

        {/* KPI 4: Desconexões Forçadas */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Revogadas Hoje</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalRevokedToday ?? 0}
            </span>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              logoff remoto
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Ação administrativa de segurança
          </div>
        </div>
      </div>

      {/* DISPOSITIVOS & NAVEGADORES */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
              <Laptop className="w-4 h-4 text-slate-400" />
              <span>Aparelhos Conectados</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200">
                <Laptop className="w-3.5 h-3.5 text-blue-500" />
                {stats.devices.desktop} Desktop
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200">
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                {stats.devices.mobile} Mobile
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200">
                <Tablet className="w-3.5 h-3.5 text-purple-500" />
                {stats.devices.tablet} Tablet
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Navegadores Principais</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {Object.entries(stats.browsers).slice(0, 3).map(([browser, count]) => (
                <span
                  key={browser}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shrink-0"
                >
                  {browser}: <strong>{count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TABELA DE SESSÕES & BARRA DE FERRAMENTAS */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* BARRA DE FILTROS E BUSCA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* BUSCA */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por usuário, e-mail, IP ou aparelho..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* FILTRO DE STATUS */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setFiltroStatus('TODOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroStatus === 'TODOS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('ACTIVE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroStatus === 'ACTIVE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online ({sessions.filter(s => s.status === 'ACTIVE').length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('IDLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroStatus === 'IDLE'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Ociosos ({sessions.filter(s => s.status === 'IDLE').length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('REVOKED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroStatus === 'REVOKED'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Revogados ({sessions.filter(s => s.status === 'REVOKED').length})
            </button>
          </div>
        </div>

        {/* TABELA DE CONEXÕES */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Aparelho &amp; Navegador</th>
                <th className="py-3 px-4">IP &amp; Localização</th>
                <th className="py-3 px-4">Login &amp; Atividade</th>
                <th className="py-3 px-4">Teto 12 Horas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>Carregando conexões ativas...</span>
                  </td>
                </tr>
              ) : sessoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">Nenhuma sessão encontrada para os filtros atuais.</p>
                  </td>
                </tr>
              ) : (
                sessoesFiltradas.map((sess) => {
                  const rem = formatRemaining12h(sess.expiresAt);
                  const isCurrent = sess.isCurrentSession;

                  return (
                    <tr
                      key={sess.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''
                      }`}
                    >
                      {/* USUÁRIO */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              sess.status === 'ACTIVE'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : sess.status === 'IDLE'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {(sess.userName || sess.userEmail || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {sess.userName}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[9px] font-black uppercase">
                                  Você
                                </span>
                              )}
                            </div>
                            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                              {sess.userEmail}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {sess.userPapeis?.map((papel) => (
                                <span
                                  key={papel}
                                  className="text-[9px] px-1.5 py-0.2 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                >
                                  {papel}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* APARELHO & NAVEGADOR */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {sess.device === 'Mobile' ? (
                              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                            ) : sess.device === 'Tablet' ? (
                              <Tablet className="w-3.5 h-3.5 text-purple-500" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {sess.browser}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {sess.os} • {sess.device}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* IP & LOCALIZAÇÃO */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                          {sess.ip}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{sess.location}</span>
                        </div>
                      </td>

                      {/* LOGIN & ÚLTIMA ATIVIDADE */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Login: {formatTime(sess.startedAt)}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Ativo: {formatRelative(sess.lastActiveAt)}
                        </span>
                      </td>

                      {/* TETO 12H */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                          Expira às {formatTime(sess.expiresAt)}
                        </span>
                        <span
                          className={`text-[10px] font-bold block mt-0.5 ${
                            sess.status === 'EXPIRED'
                              ? 'text-rose-500'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {rem}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-4">
                        {sess.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Online
                          </span>
                        )}
                        {sess.status === 'IDLE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Ociosa
                          </span>
                        )}
                        {sess.status === 'REVOKED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            Revogada
                          </span>
                        )}
                        {sess.status === 'EXPIRED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Expirada
                          </span>
                        )}
                      </td>

                      {/* AÇÃO (REVOGAR LOGOFF REMOTO) */}
                      <td className="py-3.5 px-4 text-right">
                        {sess.status === 'REVOKED' ? (
                          <span className="text-[11px] text-slate-400 italic">Desconectado</span>
                        ) : isCurrent ? (
                          <span className="text-[11px] text-slate-400 font-semibold">Sessão Atual</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRevokingSession(sess)}
                            disabled={executingAction}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            title="Encerrar sessão deste usuário agora"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Forçar Logoff</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CONFIRMAR LOGOFF REMOTO ESPECÍFICO */}
      {revokingSession && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-rose-200 dark:border-rose-900/60 shadow-2xl max-w-md w-full relative animate-scaleUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
                  Confirmar Logoff Remoto
                </h3>
                <p className="text-xs text-slate-500">Desconectar usuário imediatamente</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Você está prestes a forçar o encerramento da sessão ativa de:
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Usuário:</span>
                <span className="font-bold text-slate-900 dark:text-white">{revokingSession.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">E-mail:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{revokingSession.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Aparelho:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{revokingSession.device} • {revokingSession.browser}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IP:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{revokingSession.ip}</span>
              </div>
            </div>

            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mb-6">
              O usuário será redirecionado automaticamente para a tela de login na próxima requisição ou verificação em background.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRevokingSession(null)}
                disabled={executingAction}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRevokeSession(revokingSession)}
                disabled={executingAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {executingAction ? 'Encerrando...' : 'Sim, Forçar Logoff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAR DERRUBAR TODAS AS OUTRAS SESSÕES */}
      {modalRevokeAll && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-rose-200 dark:border-rose-900/60 shadow-2xl max-w-md w-full relative animate-scaleUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600">
                <PowerOff className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
                  Derrubar Todas as Sessões Remotas
                </h3>
                <p className="text-xs text-slate-500">Desconectar todos os outros usuários</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Esta ação forçará o logoff imediato de <strong>todos os outros usuários conectados</strong> em qualquer computador, tablet ou celular.
              <strong className="block mt-2 text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ A sua sessão atual de administrador será preservada e você não será deslogado.
              </strong>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalRevokeAll(false)}
                disabled={executingAction}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRevokeAllSessions}
                disabled={executingAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {executingAction ? 'Processando...' : 'Confirmar e Derrubar Todos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
