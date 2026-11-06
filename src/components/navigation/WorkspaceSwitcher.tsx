'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  Building2, 
  ChevronsUpDown, 
  Check, 
  Plus, 
  Layers, 
  ShieldCheck, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface Workspace {
  id: string;
  nome: string;
  unidade: string;
  status: 'PRODUCAO' | 'SANDBOX' | 'HOMOLOGACAO';
  logo?: string;
  isAtivo?: boolean;
}

const WORKSPACES_DISPONIVEIS: Workspace[] = [
  {
    id: 'ws_bela_cereais',
    nome: 'Bela Cereais',
    unidade: 'Ambiente Produtivo • Matriz MT',
    status: 'PRODUCAO',
    logo: '/logo-site-bela-verde.png',
    isAtivo: true,
  },
  {
    id: 'ws_agroexport_santos',
    nome: 'AgroExport Global',
    unidade: 'Filial Portuária • Santos/SP',
    status: 'HOMOLOGACAO',
    isAtivo: false,
  },
  {
    id: 'ws_cerrado_trading',
    nome: 'Cerrado Grains Trading',
    unidade: 'Mesa Internacional • Dubai/EAU',
    status: 'SANDBOX',
    isAtivo: false,
  },
];

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps) {
  const [aberto, setAberto] = useState(false);
  const [workspaceSelecionado, setWorkspaceSelecionado] = useState<string>('ws_bela_cereais');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false);
    }
    if (aberto) {
      document.addEventListener('mousedown', handleClickFora);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto]);

  const workspaceAtual = WORKSPACES_DISPONIVEIS.find((w) => w.id === workspaceSelecionado) || WORKSPACES_DISPONIVEIS[0];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* BOTÃO TRIGGER EXPANDIDO */}
      {!collapsed ? (
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left cursor-pointer group ${
            aberto
              ? 'bg-slate-100/90 dark:bg-slate-800/90 border-emerald-500/40 ring-2 ring-emerald-500/20'
              : 'bg-white/95 dark:bg-slate-850/95 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 shadow-xs'
          }`}
          title="Alternar Workspace (Multi-tenant)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Logo da Bela Cereais solta sem box em volta */}
            {workspaceAtual.logo ? (
              <div className="h-8 flex items-center justify-center shrink-0 relative">
                <Image
                  src={workspaceAtual.logo}
                  alt={workspaceAtual.nome}
                  width={80}
                  height={28}
                  className="h-6.5 w-auto object-contain"
                  referrerPolicy="no-referrer"
                  priority
                />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-white dark:ring-slate-900" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 relative">
                <Building2 className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-white dark:ring-slate-900" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {workspaceAtual.nome}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[8px] font-mono font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ATIVO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate font-medium mt-0.5">
                {workspaceAtual.unidade}
              </p>
            </div>
          </div>

          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors ml-1" />
        </button>
      ) : (
        /* BOTÃO TRIGGER RECOLHIDO (COLLAPSED) */
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 relative transition-all cursor-pointer group p-1"
          title={`Workspace Ativo: ${workspaceAtual.nome} (${workspaceAtual.unidade})`}
        >
          {workspaceAtual.logo ? (
            <Image
              src={workspaceAtual.logo}
              alt={workspaceAtual.nome}
              width={38}
              height={38}
              className="h-6.5 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Building2 className="w-4 h-4" />
          )}
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-1 ring-white dark:ring-slate-900" />
        </button>
      )}

      {/* DROPDOWN FLUTUANTE MULTI-WORKSPACE */}
      {aberto && (
        <div
          className={`absolute z-50 mt-1.5 w-72 bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-100 ${
            collapsed ? 'left-full ml-3 top-0' : 'left-0 right-0 top-full'
          }`}
        >
          {/* Topo do Menu */}
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Workspaces Disponíveis
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
              Multi-Tenant
            </span>
          </div>

          {/* Lista de Workspaces */}
          <div className="space-y-1">
            {WORKSPACES_DISPONIVEIS.map((ws) => {
              const isSelecionado = ws.id === workspaceSelecionado;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    setWorkspaceSelecionado(ws.id);
                    setAberto(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer group ${
                    isSelecionado
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-slate-900 dark:text-white border border-emerald-500/30'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {ws.logo ? (
                      <div className="h-6 flex items-center justify-center shrink-0">
                        <Image
                          src={ws.logo}
                          alt={ws.nome}
                          width={65}
                          height={22}
                          className="h-5 w-auto object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelecionado
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">
                          {ws.nome}
                        </span>
                        {ws.status === 'PRODUCAO' && (
                          <span className="text-[8px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                            PROD
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {ws.unidade}
                      </p>
                    </div>
                  </div>

                  {isSelecionado && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Separador e Ação Multi-Tenant */}
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                alert('A arquitetura Multi-Tenant PEX Agritech está pronta. Em ambiente enterprise, novos clientes e workspaces são provisionados de forma isolada.');
                setAberto(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-dashed border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Conectar Novo Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
