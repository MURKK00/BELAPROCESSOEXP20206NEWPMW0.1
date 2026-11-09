'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  LayoutDashboard, 
  Handshake, 
  DollarSign, 
  TrendingUp,
  Sparkles,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';
import { getUserPapeis, canAccessAdmin } from '@/lib/permissions';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const isBackoffice = pathname === '/backoffice';
  const { data: session } = useSession();
  const [localUser, setLocalUser] = useState<any>(null);
  // Estado para recolher/minimizar sidebar no desktop via setinha
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Estado para abrir/fechar drawer no mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleFs = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  useEffect(() => {
    setMounted(true);
    // Recupera usuário salvo no localStorage (resiliente para iframes com cookies restritos)
    try {
      const savedUser = localStorage.getItem('bela_user');
      if (savedUser) setLocalUser(JSON.parse(savedUser));
    } catch {}

    // Recupera preferência do usuário salva no navegador
    try {
      const saved = localStorage.getItem('sidebar_minimizada');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Ignora erro em ambientes sem localStorage
    }
  }, []);

  const currentUser = session?.user || localUser;

  async function handleLogout() {
    try {
      localStorage.removeItem('bela_user');
      localStorage.removeItem('bela_auth_created_at');
      document.cookie = 'bela_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
      document.cookie = 'bela_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
      document.cookie = 'bela_auth_created_at=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}

    try {
      await signOut({ redirect: false });
    } catch {}

    window.location.href = '/login';
  }

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_minimizada', String(next));
      } catch {
        // Ignora erro
      }
      return next;
    });
  };

  if (isBackoffice && isFullscreen) {
    return (
      <main className="w-screen h-screen overflow-hidden bg-[#060913] text-slate-100">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-slate-100 transition-colors">
      {/* ========================================================================= */}
      {/* 1. SIDEBAR DESKTOP (COM SETINHA PARA APARECER E MINIMIZAR)                 */}
      {/* ========================================================================= */}
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 relative select-none ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* CABEÇALHO DA SIDEBAR / CONTROLE DE MINIMIZAR */}
        <div className={`py-2 px-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center transition-all ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          {!isCollapsed && (
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500 font-mono">
              Workspace Ativo
            </span>
          )}

          {/* SETINHA PARA MINIMIZAR / EXPANDIR SIDEBAR */}
          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expandir atalhos laterais' : 'Minimizar atalhos laterais'}
            aria-label={isCollapsed ? 'Expandir atalhos laterais' : 'Minimizar atalhos laterais'}
            className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer shadow-2xs"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-emerald-500" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* COMPONENTE DE SELEÇÃO / SWITCHER DE WORKSPACE COM A LOGO DA BELA */}
        <div className={`py-2.5 border-b border-slate-100 dark:border-slate-800/80 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <WorkspaceSwitcher collapsed={isCollapsed} />
        </div>

        {/* LISTA DE ATALHOS */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <Sidebar collapsed={isCollapsed} />
        </div>

        {/* RODAPÉ DA SIDEBAR: LOGO PEX SOLTA E MINIMALISTA LÁ EM BAIXO */}
        {!isCollapsed ? (
          <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {/* Logo da PEX solta sem box em volta, minimalista */}
              <Image
                src="/assets/aistudio/text1_6cce1f30.png"
                alt="PEX Agritech"
                width={65}
                height={20}
                className="h-4 w-auto object-contain opacity-85"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={toggleCollapse}
                className="text-slate-400 hover:text-emerald-500 flex items-center gap-0.5 font-semibold text-[9px] cursor-pointer"
                title="Recolher menu lateral"
              >
                <span>Minimizar</span>
                <ChevronLeft className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-col gap-0.5 text-[9px] text-slate-400">
              <span className="font-semibold text-slate-600 dark:text-slate-300 leading-tight">
                Powered by <strong className="text-emerald-600 dark:text-emerald-400 font-bold">PEX Agritech</strong>
              </span>
              <span>Licenciado para Bela Cereais</span>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-col items-center gap-2">
            <Image
              src="/assets/aistudio/text1_6cce1f30.png"
              alt="PEX"
              width={30}
              height={14}
              className="h-3 w-auto object-contain opacity-75"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={toggleCollapse}
              className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Expandir barra de atalhos"
            >
              <ChevronRight className="w-4 h-4 text-emerald-500" />
            </button>
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* 2. DRAWER MOBILE OVERLAY COM ATALHOS                                      */}
      {/* ========================================================================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Escuro */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Gaveta Lateral Deslizante */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#0f172a] h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 dark:border-slate-800 animate-slideRight">
            {/* Topo do Drawer Mobile */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500 font-mono">
                Workspace Ativo
              </span>

              {/* Botão de Fechar com setinha */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 flex items-center gap-1 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="Fechar menu"
              >
                <ChevronLeft className="w-4 h-4 text-emerald-500" />
                <span>Fechar</span>
              </button>
            </div>

            {/* Switcher de Workspace no Mobile */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <WorkspaceSwitcher collapsed={false} />
            </div>

            {/* Menu Links com auto-fechamento ao clicar */}
            <div className="flex-1 overflow-y-auto p-2">
              <Sidebar onItemClick={() => setIsMobileOpen(false)} />
            </div>

            {/* Rodapé Mobile */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sistema Online</span>
                </div>
                <ThemeToggle />
              </div>

              {/* Informações do Usuário no Mobile & Botão Sair */}
              {currentUser && (
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      {(currentUser.name || 'A')[0].toUpperCase()}
                    </div>
                    <div className="truncate text-left">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {currentUser.name || 'Administrador PEX'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 transition-colors shrink-0 cursor-pointer"
                    title="Sair do sistema"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CORPO PRINCIPAL DO SISTEMA COM RESPONSIVIDADE TOUCH MOBILE            */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/70 dark:bg-[#090d16] transition-colors">
        {/* TOPBAR ELEGANTE COM BOTÃO DE ATALHOS NO MOBILE E EXPANDIR DESKTOP */}
        <header className="h-14 border-b border-slate-200/80 dark:border-slate-800/90 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md px-3.5 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 transition-colors relative z-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* BOTÃO MOBILE: ABRE MENU DE ATALHOS COM SETINHA */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25 text-xs font-bold hover:bg-orange-500/20 active:scale-95 transition-all shadow-2xs shrink-0"
              title="Abrir menu de atalhos das páginas"
            >
              <Menu className="w-4 h-4" />
              <span>Atalhos</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* BOTÃO DESKTOP QUANDO MINIMIZADO: EXPANDIR MENU */}
            {isCollapsed && (
              <button
                type="button"
                onClick={toggleCollapse}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25 text-xs font-bold hover:bg-orange-500/20 active:scale-95 transition-all shadow-2xs shrink-0"
                title="Expandir barra de atalhos das páginas"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Atalhos</span>
              </button>
            )}

            {/* EMPRESA ATIVA NO MOMENTO: BELA CEREAIS */}
            <div className="text-xs font-medium flex items-center gap-2 truncate">
              <span className="font-black text-sm text-slate-900 dark:text-white whitespace-nowrap flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Bela Cereais</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* USUÁRIO AUTENTICADO & BOTÃO SAIR */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200/80 dark:border-slate-800">
                <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/80 text-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center">
                    {(currentUser.name || 'A')[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                    {currentUser.name || 'Administrador PEX'}
                  </span>
                </div>

                {canAccessAdmin(currentUser) && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold transition-all shadow-2xs"
                    title="Painel Administrativo (Demo & Usuários)"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Painel Admin</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/50 dark:text-slate-300 dark:hover:text-rose-400 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/50 transition-all cursor-pointer shadow-2xs"
                  title="Sair do sistema (Logout)"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            )}

            {/* SELETOR DE MODO CLARO / ESCURO */}
            <ThemeToggle />
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL COM CONTENÇÃO DE OVERFLOW RESPONSIVA E CHANCELA */}
        <main className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7 min-w-0 max-w-full overflow-x-hidden flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>

          {/* CHANCELA E RODAPÉ DA APLICAÇÃO */}
          <footer className="mt-8 pt-4 pb-2 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            Powered by <strong className="text-emerald-600 dark:text-emerald-400 font-bold">PEX Agritech</strong> • Licenciado para <span className="font-semibold text-slate-600 dark:text-slate-300">Bela Cereais</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
