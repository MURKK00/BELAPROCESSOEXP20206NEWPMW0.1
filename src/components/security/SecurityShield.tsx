'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Copy, 
  ClipboardPaste, 
  Check, 
  AlertCircle, 
  LogOut, 
  Eye, 
  EyeOff,
  Clock,
  Hourglass
} from 'lucide-react';

// Constantes temporais de segurança corporativa
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos no total
const WARNING_TRIGGER_MS = 9 * 60 * 1000 + 30 * 1000; // Alerta aos 9m30s (faltando 30 segundos)
const WARNING_COUNTDOWN_SECONDS = 30; // 30 segundos de contagem regressiva
const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000; // Limite absoluto de 12 horas corridas
const HEARTBEAT_INTERVAL_MS = 4 * 60 * 1000; // Renovação silenciosa (sliding) a cada 4 minutos

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  hasSelection: boolean;
  isEditable: boolean;
  selectedText: string;
}

export function SecurityShield() {
  const pathname = usePathname();
  const router = useRouter();

  // Estados de Inatividade e Bloqueio
  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_COUNTDOWN_SECONDS);
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingUnlock, setLoadingUnlock] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Estados do Menu de Contexto Customizado (Anti-Inspeção)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    hasSelection: false,
    isEditable: false,
    selectedText: '',
  });

  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeEditableRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Regra fundamental: Telas de Backoffice Cockpit e Login NUNCA bloqueiam por inatividade!
  const isBackoffice = pathname === '/backoffice' || pathname?.startsWith('/backoffice');
  const isLoginPage = pathname === '/login';
  const shouldExemptInactivity = isBackoffice || isLoginPage;

  // --------------------------------------------------------------------------
  // 1. RENOVAÇÃO SILENCIOSA E EXPIRAÇÃO ABSOLUTA DE 12 HORAS
  // --------------------------------------------------------------------------
  const handleAbsoluteExpired = useCallback(async () => {
    try {
      localStorage.removeItem('bela_user');
      localStorage.removeItem('bela_auth_created_at');
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
    setIsIdleWarningOpen(false);
    setIsLocked(false);
    router.push('/login?reason=session_expired');
  }, [router]);

  // Checagem periódica do prazo absoluto (12h) e heartbeat de renovação silenciosa
  useEffect(() => {
    if (shouldExemptInactivity) return;

    const checkAbsoluteExpiryAndHeartbeat = async () => {
      // 1. Checa no localStorage ou cookie se já passaram 12h
      const storedCreatedAt = localStorage.getItem('bela_auth_created_at');
      const authCreatedAt = Number(storedCreatedAt || 0);

      if (authCreatedAt > 0) {
        const elapsed = Date.now() - authCreatedAt;
        if (elapsed >= ABSOLUTE_TIMEOUT_MS) {
          handleAbsoluteExpired();
          return;
        }
      }

      // 2. Heartbeat de renovação silenciosa (Sliding Window até o teto de 12h)
      if (!isLocked && document.visibilityState === 'visible') {
        try {
          const res = await fetch('/api/auth/refresh', { method: 'POST' });
          if (res.status === 401) {
            const data = await res.json().catch(() => ({}));
            if (data.revoked) {
              localStorage.removeItem('bela_user');
              localStorage.removeItem('bela_session');
              localStorage.removeItem('bela_auth_created_at');
              setIsIdleWarningOpen(false);
              setIsLocked(false);
              router.push('/login?reason=revoked_by_admin');
              return;
            }
            if (data.expired) {
              handleAbsoluteExpired();
            }
          }
        } catch {
          // Falha transitória de rede não desloga de imediato
        }
      }
    };

    // Executa verificação inicial e depois a cada 4 minutos
    checkAbsoluteExpiryAndHeartbeat();
    const interval = setInterval(checkAbsoluteExpiryAndHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [shouldExemptInactivity, isLocked, handleAbsoluteExpired, router]);

  // --------------------------------------------------------------------------
  // 2. GERENCIAMENTO DE INATIVIDADE (10 MINUTOS COM AVISO AOS 9M30S)
  // --------------------------------------------------------------------------
  const clearAllInactivityTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startWarningCountdown = useCallback(() => {
    setIsIdleWarningOpen(true);
    setCountdown(WARNING_COUNTDOWN_SECONDS);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setIsIdleWarningOpen(false);
          setIsLocked(true);
          setPassword('');
          setErrorMsg(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    clearAllInactivityTimers();

    if (shouldExemptInactivity || isLocked) {
      return;
    }

    // Se o modal de aviso estava aberto e o usuário fez uma ação explícita
    if (isIdleWarningOpen) {
      setIsIdleWarningOpen(false);
    }

    // Timer 1: Dispara o Alerta Faltando 30s (aos 9m30s de inatividade)
    warningTimerRef.current = setTimeout(() => {
      if (window.location.pathname.startsWith('/backoffice') || window.location.pathname === '/login') {
        return;
      }
      startWarningCountdown();
    }, WARNING_TRIGGER_MS);

    // Timer 2: Bloqueio definitivo aos 10 minutos caso a contagem não seja cancelada
    lockTimerRef.current = setTimeout(() => {
      if (window.location.pathname.startsWith('/backoffice') || window.location.pathname === '/login') {
        return;
      }
      setIsIdleWarningOpen(false);
      setIsLocked(true);
      setPassword('');
      setErrorMsg(null);
    }, INACTIVITY_TIMEOUT_MS);
  }, [shouldExemptInactivity, isLocked, isIdleWarningOpen, clearAllInactivityTimers, startWarningCountdown]);

  // Botão "Continuar Logado" no modal de ociosidade
  const handleContinueSession = async () => {
    setIsIdleWarningOpen(false);
    clearAllInactivityTimers();
    resetInactivityTimer();

    // Dispara renovação silenciosa em background
    try {
      await fetch('/api/auth/refresh', { method: 'POST' });
    } catch {}
  };

  useEffect(() => {
    if (shouldExemptInactivity && (isLocked || isIdleWarningOpen)) {
      setIsLocked(false);
      setIsIdleWarningOpen(false);
      clearAllInactivityTimers();
    }
  }, [shouldExemptInactivity, isLocked, isIdleWarningOpen, clearAllInactivityTimers]);

  useEffect(() => {
    if (shouldExemptInactivity) {
      clearAllInactivityTimers();
      return;
    }

    resetInactivityTimer();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel'];
    const handleUserActivity = () => {
      // Se não estiver bloqueado e o modal de aviso não estiver visível, reinicia o cronômetro
      if (!isLocked && !isIdleWarningOpen) {
        resetInactivityTimer();
      }
    };

    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    return () => {
      clearAllInactivityTimers();
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
    };
  }, [resetInactivityTimer, shouldExemptInactivity, isLocked, isIdleWarningOpen, clearAllInactivityTimers]);

  // --------------------------------------------------------------------------
  // 3. PROTEÇÃO ANTI-INSPEÇÃO: BLOQUEIO DE BOTÃO DIREITO E TECLAS DEVTOOLS
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // NUNCA abre o menu nativo do navegador com Inspecionar elemento!

      const target = e.target as HTMLElement | null;
      const selection = window.getSelection()?.toString() || '';
      const isEditable = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || (target as any)?.isContentEditable;

      if (isEditable) {
        activeEditableRef.current = target as HTMLInputElement | HTMLTextAreaElement;
      } else {
        activeEditableRef.current = null;
      }

      if (selection.trim().length > 0 || isEditable) {
        setContextMenu({
          visible: true,
          x: Math.min(e.clientX, window.innerWidth - 220),
          y: Math.min(e.clientY, window.innerHeight - 180),
          hasSelection: selection.trim().length > 0,
          isEditable: Boolean(isEditable),
          selectedText: selection,
        });
      } else {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isDevToolsShortcut =
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
        ((e.ctrlKey || e.metaKey) && ['u', 'U'].includes(e.key));

      if (isDevToolsShortcut) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleClickOutside = () => {
      setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (contextMenu.selectedText) {
        await navigator.clipboard.writeText(contextMenu.selectedText);
        showToast('Texto copiado com sucesso!');
      } else if (activeEditableRef.current) {
        const text = activeEditableRef.current.value;
        await navigator.clipboard.writeText(text);
        showToast('Conteúdo copiado!');
      }
    } catch {
      document.execCommand('copy');
      showToast('Copiado!');
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (activeEditableRef.current) {
        const el = activeEditableRef.current;
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        el.setRangeText(text, start, end, 'end');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        showToast('Texto colado!');
      }
    } catch {
      showToast('Use Ctrl+V para colar');
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleSelectAll = () => {
    if (activeEditableRef.current) {
      activeEditableRef.current.select();
    } else {
      document.execCommand('selectAll');
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const showToast = (msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // --------------------------------------------------------------------------
  // 4. DESBLOQUEIO DE TELA POR SENHA
  // --------------------------------------------------------------------------
  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password) {
      setErrorMsg('Digite a senha para desbloquear.');
      return;
    }

    setLoadingUnlock(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.success) {
        setIsLocked(false);
        setPassword('');
        setErrorMsg(null);
        resetInactivityTimer();
      } else {
        setErrorMsg(data.error || 'Senha incorreta. Verifique suas credenciais.');
      }
    } catch {
      setErrorMsg('Falha de conexão ao validar senha.');
    } finally {
      setLoadingUnlock(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('bela_user');
      localStorage.removeItem('bela_auth_created_at');
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
    setIsIdleWarningOpen(false);
    setIsLocked(false);
    router.push('/login');
  };

  return (
    <>
      {/* TOAST DE FEEDBACK DE CÓPIA / COLA */}
      {copyFeedback && (
        <div className="fixed bottom-5 right-5 z-[9999] bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 animate-fadeIn border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* MENU DE CONTEXTO CUSTOMIZADO SEGURO (APENAS COPIAR / COLAR / SELECIONAR TUDO) */}
      {contextMenu.visible && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-[9998] w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 text-xs text-slate-800 dark:text-slate-200 animate-fadeIn divide-y divide-slate-100 dark:divide-slate-800/70"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              PEX Proteção
            </span>
            <span className="text-[9px] text-slate-400">Ativa</span>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!contextMenu.hasSelection && !contextMenu.isEditable}
              className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
                contextMenu.hasSelection || contextMenu.isEditable
                  ? 'hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-900 dark:text-white'
                  : 'opacity-40 cursor-not-allowed text-slate-400'
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-blue-500" />
              <span>Copiar Texto</span>
              <span className="ml-auto text-[10px] text-slate-400 font-mono">Ctrl+C</span>
            </button>

            {contextMenu.isEditable && (
              <button
                type="button"
                onClick={handlePaste}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-emerald-500" />
                <span>Colar</span>
                <span className="ml-auto text-[10px] text-slate-400 font-mono">Ctrl+V</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSelectAll}
              className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-orange-500" />
              <span>Selecionar Tudo</span>
              <span className="ml-auto text-[10px] text-slate-400 font-mono">Ctrl+A</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: ALERTA DE OCIOSIDADE (FALTANDO 30 SEGUNDOS)                 */}
      {/* ==================================================================== */}
      {isIdleWarningOpen && !shouldExemptInactivity && !isLocked && (
        <div className="fixed inset-0 z-[99998] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-5">
            
            {/* ÍCONE DE ALERTA TEMPORAL */}
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center shadow-xs">
              <Hourglass className="w-7 h-7 animate-pulse text-amber-500" />
            </div>

            {/* MENSAGEM PRINCIPAL */}
            <div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white tracking-tight">
                Sua sessão expira em breve por falta de atividade
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Por segurança corporativa, o sistema será bloqueado caso nenhuma interação ocorra nos próximos segundos.
              </p>
            </div>

            {/* CONTAGEM REGRESSIVA VISUAL */}
            <div className="py-2.5 px-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 inline-flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Expira em:</span>
              <span className="font-mono text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {countdown < 10 ? `0${countdown}` : countdown}s
              </span>
            </div>

            {/* BOTÃO CONTINUAR LOGADO */}
            <button
              type="button"
              onClick={handleContinueSession}
              className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Continuar Logado</span>
            </button>

            {/* OPÇÃO DE LOGOFF MANUAL */}
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-medium transition-colors cursor-pointer"
            >
              Encerrar sessão agora
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: TELA BLOQUEADA POR INATIVIDADE (10 MINUTOS)                  */}
      {/* ==================================================================== */}
      {isLocked && !shouldExemptInactivity && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            
            {/* LOGOS E MARCA */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex items-center justify-center">
                <Image
                  src="/assets/aistudio/inomeado_d2e44f63.png"
                  alt="PEX Export Intelligence"
                  width={150}
                  height={45}
                  className="h-10 w-auto object-contain dark:brightness-110"
                  priority
                />
              </div>

              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-xs mt-2">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
                  Sessão Bloqueada por Inatividade
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Por segurança corporativa, o sistema foi bloqueado após 10 minutos de inatividade. Insira sua senha para retomar.
                </p>
              </div>
            </div>

            {/* FORMULÁRIO DE DESBLOQUEIO */}
            <form onSubmit={handleUnlock} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Senha de Desbloqueio
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Digite a senha"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40 pr-10 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingUnlock || !password}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
              >
                {loadingUnlock ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Validando...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Desbloquear Sessão</span>
                  </>
                )}
              </button>
            </form>

            {/* AÇÕES COMPLEMENTARES */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da Conta</span>
              </button>

              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                PEX Agritech • Licenciado para Bela Cereais
              </span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
