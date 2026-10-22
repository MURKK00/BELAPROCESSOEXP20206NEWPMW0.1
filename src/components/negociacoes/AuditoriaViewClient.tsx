'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Clock, 
  User, 
  ArrowRight, 
  Edit3, 
  CheckCircle2, 
  History, 
  Filter, 
  Search, 
  Tag, 
  Box, 
  UserCheck, 
  PlusCircle,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDateTimeBR } from '@/lib/formatters';

interface LogItem {
  id: string;
  processoId: string;
  usuarioId: string;
  acao: string;
  detalhe: string;
  alteracoes: any;
  criadoEm: string | Date;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    papel?: string;
  } | null;
}

interface AuditoriaViewClientProps {
  processoId: string;
  numeroProcesso: string;
  clienteFinal: string;
  logs: LogItem[];
}

export function AuditoriaViewClient({
  processoId,
  numeroProcesso,
  clienteFinal,
  logs = [],
}: AuditoriaViewClientProps) {
  const [filtroAcao, setFiltroAcao] = useState<string>('TODOS');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Calcula estatísticas do histórico
  const stats = useMemo(() => {
    let totalCamposModificados = 0;
    const usuariosSet = new Set<string>();

    logs.forEach((log) => {
      if (log.usuario?.nome) usuariosSet.add(log.usuario.nome);
      if (log.alteracoes && typeof log.alteracoes === 'object') {
        totalCamposModificados += Object.keys(log.alteracoes).length;
      }
    });

    const ultimoLog = logs[0] ?? null;

    return {
      totalEventos: logs.length,
      totalCamposModificados,
      totalOperadores: usuariosSet.size || 1,
      ultimoRegistro: ultimoLog ? formatDateTimeBR(ultimoLog.criadoEm) : 'Nenhum',
      ultimoOperador: ultimoLog?.usuario?.nome || 'Sistema',
    };
  }, [logs]);

  // Filtra logs com base nos critérios
  const logsFiltrados = useMemo(() => {
    return logs.filter((log) => {
      // Filtro de Ação
      if (filtroAcao !== 'TODOS') {
        if (filtroAcao === 'EDICAO' && !log.acao.includes('EDITAD') && log.acao !== 'PROCESSO_EDITADO') return false;
        if (filtroAcao === 'STATUS' && !log.acao.includes('STATUS')) return false;
        if (filtroAcao === 'IMPORTADOR' && !log.acao.includes('IMPORTADOR')) return false;
        if (filtroAcao === 'CONTAINER' && !log.acao.includes('CONTAINER')) return false;
        if (filtroAcao === 'CRIACAO' && !log.acao.includes('CRIADO')) return false;
      }

      // Filtro de texto
      if (buscaTexto.trim()) {
        const q = buscaTexto.toLowerCase();
        const noDetalhe = log.detalhe?.toLowerCase().includes(q);
        const noUsuario = log.usuario?.nome?.toLowerCase().includes(q);
        const noEmail = log.usuario?.email?.toLowerCase().includes(q);
        const naAcao = log.acao?.toLowerCase().includes(q);
        
        let nosCampos = false;
        if (log.alteracoes && typeof log.alteracoes === 'object') {
          nosCampos = Object.entries(log.alteracoes).some(([campo, val]: [string, any]) => {
            return (
              campo.toLowerCase().includes(q) ||
              String(val?.de ?? '').toLowerCase().includes(q) ||
              String(val?.para ?? '').toLowerCase().includes(q)
            );
          });
        }

        return noDetalhe || noUsuario || noEmail || naAcao || nosCampos;
      }

      return true;
    });
  }, [logs, filtroAcao, buscaTexto]);

  // Ícone e cores para cada tipo de ação
  const getAcaoBadge = (acao: string) => {
    if (acao.includes('STATUS')) {
      return {
        label: 'Mudança de Status',
        icon: ArrowRight,
        colorClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        dotClass: 'bg-amber-500',
      };
    }
    if (acao.includes('IMPORTADOR')) {
      return {
        label: 'Dados do Importador',
        icon: UserCheck,
        colorClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        dotClass: 'bg-purple-500',
      };
    }
    if (acao.includes('CONTAINER')) {
      return {
        label: 'Contêineres & Lacre',
        icon: Box,
        colorClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
        dotClass: 'bg-cyan-500',
      };
    }
    if (acao.includes('CRIADO') || acao.includes('CRIACAO')) {
      return {
        label: 'Criação do Processo',
        icon: PlusCircle,
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
      };
    }
    return {
      label: 'Edição de Campos',
      icon: Edit3,
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      dotClass: 'bg-blue-500',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header com selo de Compliance & Botão de Edição */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                Trilha de Auditoria Ativa
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Processo: <strong className="text-slate-800 dark:text-slate-200">{numeroProcesso}</strong> — {clienteFinal}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-orange-500" />
              Log de Auditoria e Modificações
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Registro automático, inviolável e cronológico de cada edição efetuada. Todas as alterações gravam o operador responsável, a data/hora exata e o valor anterior versus novo valor.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/negociacoes/${processoId}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar Campos do Processo</span>
            </Link>
          </div>
        </div>

        {/* Métricas / Cards Rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total de Eventos</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{stats.totalEventos}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Ações registradas</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Campos Alterados</div>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{stats.totalCamposModificados}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Mutações de dados (De → Para)</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Última Modificação</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">{stats.ultimoRegistro}</div>
            <div className="text-[10px] text-slate-400 truncate">Por: {stats.ultimoOperador}</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Operadores Envolvidos</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.totalOperadores}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Usuários com registro</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'TODOS', label: 'Todas as Ações' },
            { id: 'EDICAO', label: 'Edições de Campo' },
            { id: 'STATUS', label: 'Status' },
            { id: 'IMPORTADOR', label: 'Importador / Buyer' },
            { id: 'CONTAINER', label: 'Contêineres' },
            { id: 'CRIACAO', label: 'Criação' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroAcao(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filtroAcao === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={buscaTexto}
            onChange={(e) => setBuscaTexto(e.target.value)}
            placeholder="Buscar por usuário, campo, valor..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Timeline com Histórico de Ações */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {logsFiltrados.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Nenhum registro encontrado</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {buscaTexto || filtroAcao !== 'TODOS'
                ? 'Nenhum evento corresponde aos filtros aplicados. Tente limpar os filtros de busca.'
                : 'Nenhuma alteração foi realizada neste processo ainda. Ao editar qualquer campo, o registro será gerado aqui automaticamente.'}
            </p>
            {(buscaTexto || filtroAcao !== 'TODOS') && (
              <button
                onClick={() => {
                  setBuscaTexto('');
                  setFiltroAcao('TODOS');
                }}
                className="mt-3 text-xs text-orange-600 font-semibold hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8">
            {/* Linha vertical conectora */}
            <div className="absolute left-[11px] sm:left-[15px] top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-800" />

            {logsFiltrados.map((log) => {
              const badge = getAcaoBadge(log.acao);
              const BadgeIcon = badge.icon;
              const hasAlteracoes =
                log.alteracoes &&
                typeof log.alteracoes === 'object' &&
                Object.keys(log.alteracoes).length > 0;
              const totalCampos = hasAlteracoes ? Object.keys(log.alteracoes).length : 0;
              const isExpanded = expandedLogId === log.id || totalCampos <= 5;

              return (
                <div key={log.id} className="relative group">
                  {/* Ponto indicador na linha do tempo */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center ${badge.dotClass}`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  {/* Card do Evento de Auditoria */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 transition-all shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Tipo de Ação */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${badge.colorClass}`}
                        >
                          <BadgeIcon className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>

                        {/* Detalhe ou resumo da ação */}
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {log.detalhe}
                        </span>
                      </div>

                      {/* Data e Hora Exata */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateTimeBR(log.criadoEm)}</span>
                      </div>
                    </div>

                    {/* DE -> PARA das alterações */}
                    {hasAlteracoes && (
                      <div className="mt-3 mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 rounded-lg overflow-hidden shadow-2xs">
                        <div className="bg-slate-100/90 dark:bg-slate-800/90 px-3.5 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-orange-500" />
                            Diferenças Detectadas ({totalCampos} campo{totalCampos > 1 ? 's' : ''})
                          </span>
                          {totalCampos > 5 && (
                            <button
                              onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              {expandedLogId === log.id ? (
                                <>
                                  <ChevronUp className="w-3 h-3" /> Recolher
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" /> Ver todos ({totalCampos})
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 uppercase tracking-wider">
                              <tr>
                                <th className="px-3.5 py-2 font-bold w-1/3">Campo Modificado</th>
                                <th className="px-3.5 py-2 font-bold text-red-600 dark:text-red-400 w-1/3">
                                  Valor Anterior (De)
                                </th>
                                <th className="px-3.5 py-2 font-bold text-emerald-600 dark:text-emerald-400 w-1/3">
                                  Novo Valor (Para)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {(isExpanded
                                ? Object.entries(log.alteracoes)
                                : Object.entries(log.alteracoes).slice(0, 5)
                              ).map(([campo, valores]: [string, any]) => {
                                const deFormatado =
                                  valores?.de === null || valores?.de === undefined || valores?.de === ''
                                    ? 'Vazio'
                                    : String(valores?.de);
                                const paraFormatado =
                                  valores?.para === null || valores?.para === undefined || valores?.para === ''
                                    ? 'Vazio'
                                    : String(valores?.para);

                                return (
                                  <tr key={campo} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                                      {campo}
                                    </td>
                                    <td className="px-3.5 py-2.5 font-medium text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20">
                                      <span className="line-through">{deFormatado}</span>
                                    </td>
                                    <td className="px-3.5 py-2.5 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center gap-1.5">
                                      <ArrowRight className="w-3 h-3 text-emerald-500 inline-block shrink-0" />
                                      <span>{paraFormatado}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Rodapé do Evento com Usuário e Detalhes de Identidade */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {(log.usuario?.nome || 'A')[0].toUpperCase()}
                        </div>
                        <span>
                          Modificado por:{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {log.usuario?.nome || 'Administrador do Sistema'}
                          </strong>
                          {log.usuario?.email && (
                            <span className="text-[11px] text-slate-400 ml-1.5 hidden sm:inline">
                              ({log.usuario.email})
                            </span>
                          )}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {log.id.slice(0, 14)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
