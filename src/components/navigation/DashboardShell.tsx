'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  const { data: session } = useSession();
  const [localUser, setLocalUser] = useState<any>(null);
  // Estado para recolher/minimizar sidebar no desktop via setinha
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Estado para abrir/fechar drawer no mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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
      document.cookie = 'bela_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
      document.cookie = 'bela_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
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
        {/* CABEÇALHO DA SIDEBAR */}
        <div className={`py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center transition-all ${
          isCollapsed ? 'px-3 justify-center flex-col gap-2' : 'px-5 justify-between'
        }`}>
          {!isCollapsed ? (
            <div className="flex flex-col items-start min-w-0">
              <div className="p-1 rounded-lg bg-white/90 dark:bg-white/95 inline-block shadow-2xs">
                <Image
                  src="/logo-site-bela-verde.png"
                  alt="Bela Cereais"
                  width={112}
                  height={28}
                  priority
                  referrerPolicy="no-referrer"
                  className="w-28 h-auto object-contain object-left"
                />
              </div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 truncate">
                Cockpit <span className="text-orange-500 dark:text-orange-400 font-black">Exportações</span>
              </div>
            </div>
          ) : (
            <div className="p-1 rounded-lg bg-white/90 dark:bg-white/95 inline-block shadow-2xs" title="Bela Cereais Cockpit">
              <Image
                src="/logo-site-bela-verde.png"
                alt="Bela Cereais"
                width={28}
                height={28}
                priority
                referrerPolicy="no-referrer"
                className="w-7 h-7 object-contain object-left"
              />
            </div>
          )}

          {/* SETINHA PARA MINIMIZAR / EXPANDIR SIDEBAR */}
          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expandir atalhos laterais' : 'Minimizar atalhos laterais'}
            aria-label={isCollapsed ? 'Expandir atalhos laterais' : 'Minimizar atalhos laterais'}
            className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 active:scale-95 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer shadow-2xs"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-orange-500" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* LISTA DE ATALHOS */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <Sidebar collapsed={isCollapsed} />
        </div>

        {/* RODAPÉ DA SIDEBAR */}
        {!isCollapsed ? (
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span className="font-mono font-medium">Bela Cereais v2.4</span>
            <button
              onClick={toggleCollapse}
              className="text-slate-400 hover:text-orange-500 flex items-center gap-1 font-semibold text-[10px] cursor-pointer"
              title="Recolher menu lateral"
            >
              <span>Minimizar</span>
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="p-2 border-t border-slate-200/80 dark:border-slate-800 flex justify-center">
            <button
              onClick={toggleCollapse}
              className="p-2 text-slate-400 hover:text-orange-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Expandir barra de atalhos"
            >
              <ChevronRight className="w-4 h-4 text-orange-500" />
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
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex flex-col items-start">
                <div className="p-1 rounded-lg bg-white/90 dark:bg-white/95 inline-block">
                  <Image
                    src="/logo-site-bela-verde.png"
                    alt="Bela Cereais"
                    width={112}
                    height={28}
                    priority
                    referrerPolicy="no-referrer"
                    className="w-28 h-auto object-contain object-left"
                  />
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Atalhos de Navegação
                </div>
              </div>

              {/* Botão de Fechar com setinha */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-orange-500 flex items-center gap-1 text-xs font-bold border border-slate-200 dark:border-slate-700"
                title="Minimizar menu"
              >
                <ChevronLeft className="w-4 h-4 text-orange-500" />
                <span>Fechar</span>
              </button>
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
                    <div className="w-7 h-7 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      {(currentUser.name || currentUser.email || 'A')[0].toUpperCase()}
                    </div>
                    <div className="truncate text-left">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {currentUser.name || 'Administrador'}
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
        <header className="h-14 border-b border-slate-200/80 dark:border-slate-800/90 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md px-3.5 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 transition-colors relative z-10">
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

            {/* IDENTIFICAÇÃO DO SISTEMA */}
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 truncate">
              <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">Bela Cereais</span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
              <span className="hidden sm:inline truncate">Gestão Operacional &amp; Financeira</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* USUÁRIO AUTENTICADO & BOTÃO SAIR */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200/80 dark:border-slate-800">
                <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700/80 text-xs">
                  <div className="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-[10px] flex items-center justify-center">
                    {(currentUser.name || currentUser.email || 'A')[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                    {currentUser.name || currentUser.email}
                  </span>
                  <div className="flex items-center gap-1">
                    {getUserPapeis(currentUser).map((p) => (
                      <span
                        key={p}
                        className={`px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider uppercase ${
                          p === 'ADMIN'
                            ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                            : p === 'FINANCEIRO'
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            : p === 'COMERCIAL'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : p === 'DIRETORIA'
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                            : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {canAccessAdmin(currentUser) && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/25 text-xs font-bold transition-all shadow-2xs"
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

        {/* CONTEÚDO PRINCIPAL COM CONTENÇÃO DE OVERFLOW RESPONSIVA */}
        <main className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7 min-w-0 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
