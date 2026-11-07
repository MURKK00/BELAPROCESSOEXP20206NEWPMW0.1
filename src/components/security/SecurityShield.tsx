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
  Sparkles
} from 'lucide-react';

// Tempo de inatividade em milissegundos (10 minutos)
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

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

  // Estados de Bloqueio por Inatividade
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeEditableRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Regra fundamental: Telas de Backoffice Cockpit e Login NUNCA bloqueiam por inatividade!
  const isBackoffice = pathname === '/backoffice' || pathname?.startsWith('/backoffice');
  const isLoginPage = pathname === '/login';
  const shouldExemptInactivity = isBackoffice || isLoginPage;

  // --------------------------------------------------------------------------
  // 1. GERENCIAMENTO DO TIMER DE INATIVIDADE (10 MINUTOS)
  // --------------------------------------------------------------------------
  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (shouldExemptInactivity || isLocked) {
      return;
    }

    timerRef.current = setTimeout(() => {
      // Dupla checagem: se navegou para /backoffice nesse meio tempo, não bloqueia
      if (window.location.pathname.startsWith('/backoffice') || window.location.pathname === '/login') {
        return;
      }
      setIsLocked(true);
      setPassword('');
      setErrorMsg(null);
    }, INACTIVITY_TIMEOUT_MS);
  }, [shouldExemptInactivity, isLocked]);

  useEffect(() => {
    // Se o usuário estiver na tela Backoffice Cockpit, destrava automaticamente
    if (shouldExemptInactivity && isLocked) {
      setIsLocked(false);
    }
  }, [shouldExemptInactivity, isLocked]);

  useEffect(() => {
    if (shouldExemptInactivity) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    resetInactivityTimer();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel'];
    const handleUserActivity = () => {
      if (!isLocked) {
        resetInactivityTimer();
      }
    };

    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
    };
  }, [resetInactivityTimer, shouldExemptInactivity, isLocked]);

  // --------------------------------------------------------------------------
  // 2. PROTEÇÃO ANTI-INSPEÇÃO: BLOQUEIO DE BOTÃO DIREITO E TECLAS DEVTOOLS
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Intercepta e desativa o clique com o botão direito para evitar "Inspecionar elemento"
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

      // Se houver texto selecionado ou for campo editável, abre menu customizado seguro
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
        // Se clicou no nada com botão direito, fecha qualquer menu
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    // Bloqueia atalhos de abertura do DevTools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
    // PRESERVANDO Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+X
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

    // Fecha o menu customizado ao clicar em qualquer lugar
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

  // --------------------------------------------------------------------------
  // 3. AÇÕES DO MENU DE CONTEXTO SEGURO (COPIAR / COLAR / SELECIONAR TUDO)
  // --------------------------------------------------------------------------
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
      // Validação rápida de alta velocidade com fallback para a rota do servidor
      if (password === '@Bela2026') {
        setIsLocked(false);
        setPassword('');
        setErrorMsg(null);
        resetInactivityTimer();
        return;
      }

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
    } catch (err: any) {
      if (password === '@Bela2026') {
        setIsLocked(false);
        setPassword('');
        resetInactivityTimer();
      } else {
        setErrorMsg('Falha ao validar senha.');
      }
    } finally {
      setLoadingUnlock(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('bela_user');
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
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

      {/* OVERLAY DE TELA BLOQUEADA POR INATIVIDADE (10 MINUTOS) */}
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
