'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Users } from 'lucide-react';
import { SessionsManager } from '@/components/admin/SessionsManager';

export default function AdminSessoesPage() {
  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* NAVEGAÇÃO DE VOLTA & CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Segurança Corporativa PEX • Sessões em Tempo Real</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Sessões Conectadas &amp; Logoff Remoto
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Painel administrativo exclusivo para monitorar conexões ativas, tempos de uso e forçar encerramento remoto.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin?tab=usuarios"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-2xs"
          >
            <Users className="w-3.5 h-3.5 text-orange-500" />
            <span>Gerenciar Usuários</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a365d] hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-md shadow-blue-950/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel Admin</span>
          </Link>
        </div>
      </div>

      {/* COMPONENTE INTERATIVO DE GESTÃO DE SESSÕES */}
      <SessionsManager />
    </div>
  );
}
