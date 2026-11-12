'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Settings, 
  Play, 
  ShieldCheck, 
  HardDrive, 
  FileText, 
  Copy, 
  Check, 
  Eye, 
  Mail, 
  Layers, 
  Users, 
  Sparkles,
  Archive,
  ArrowUpRight
} from 'lucide-react';
import { BackupScheduleConfig, BackupLogItem } from '@/lib/backupManager';

export function BackupScheduleManager() {
  const [config, setConfig] = useState<BackupScheduleConfig | null>(null);
  const [logs, setLogs] = useState<BackupLogItem[]>([]);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [executandoBackup, setExecutandoBackup] = useState<boolean>(false);
  const [salvandoConfig, setSalvandoConfig] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [copiadoHash, setCopiadoHash] = useState<string | null>(null);

  // Estados de Modais
  const [modalConfig, setModalConfig] = useState<boolean>(false);
  const [modalLogDetalhe, setModalLogDetalhe] = useState<BackupLogItem | null>(null);

  // Formulário de Configuração
  const [formAtivo, setFormAtivo] = useState<boolean>(true);
  const [formFrequencia, setFormFrequencia] = useState<'DIARIO' | 'A_CADA_12H' | 'A_CADA_6H' | 'SEMANAL'>('DIARIO');
  const [formHorario, setFormHorario] = useState<string>('03:00');
  const [formDiaSemana, setFormDiaSemana] = useState<number>(0);
  const [formRetencao, setFormRetencao] = useState<number>(15);
  const [formNotificar, setFormNotificar] = useState<boolean>(true);
  const [formEmail, setFormEmail] = useState<string>('admin@pexagritech.com');

  const carregarDadosBackup = React.useCallback(async () => {
    setCarregando(true);
    setMensagemErro(null);
    try {
      const res = await fetch('/api/admin/backup', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setLogs(data.logs || []);
        setEstatisticas(data.estatisticas || null);

        // Preenche o formulário com dados atuais
        if (data.config) {
          setFormAtivo(Boolean(data.config.ativo));
          setFormFrequencia(data.config.frequencia || 'DIARIO');
          setFormHorario(data.config.horarioExecucao || '03:00');
          setFormDiaSemana(data.config.diaSemana ?? 0);
          setFormRetencao(data.config.retencaoDias || 15);
          setFormNotificar(Boolean(data.config.notificarAdminEmail));
          setFormEmail(data.config.emailDestino || 'admin@pexagritech.com');
        }
      } else {
        setMensagemErro(data.error || 'Erro ao carregar status do backup.');
      }
    } catch (err: any) {
      console.warn('Erro ao consultar /api/admin/backup:', err);
      setMensagemErro('Não foi possível carregar os registros de backup.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosBackup();
  }, [carregarDadosBackup]);

  async function executarBackupImediato(tipo: 'MANUAL' | 'AGENDADO' = 'MANUAL', iniciadoPor?: string) {
    setExecutandoBackup(true);
    setMensagemSucesso(null);
    setMensagemErro(null);

    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          iniciadoPor: iniciadoPor || 'Administrador PEX',
        }),
      });

      const data = await res.json();
      if (data.success && data.log) {
        setLogs((prev) => [data.log, ...prev]);
        if (data.config) setConfig(data.config);
        setMensagemSucesso(
          `Backup do Supabase gerado com sucesso! ${data.log.resumoTabelas?.totalRegistros || 0} registros catalogados em ${data.log.duracaoMs}ms (${data.log.tamanhoFormatado}).`
        );
      } else {
        setMensagemErro(data.error || data.message || 'Falha ao executar backup do banco de dados.');
      }
    } catch (err: any) {
      setMensagemErro('Falha de conexão ao disparar backup.');
    } finally {
      setExecutandoBackup(false);
    }
  }

  async function handleSalvarAgendamento(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoConfig(true);
    setMensagemErro(null);

    try {
      const res = await fetch('/api/admin/backup', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ativo: formAtivo,
          frequencia: formFrequencia,
          horarioExecucao: formHorario,
          diaSemana: Number(formDiaSemana),
          retencaoDias: Number(formRetencao),
          notificarAdminEmail: formNotificar,
          emailDestino: formEmail.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        setMensagemSucesso('Agendamento de backup atualizado com sucesso!');
        setModalConfig(false);
      } else {
        setMensagemErro(data.error || 'Erro ao salvar configuração do agendamento.');
      }
    } catch (err) {
      setMensagemErro('Erro de conexão ao salvar configuração.');
    } finally {
      setSalvandoConfig(false);
    }
  }

  function copiarParaClipboard(texto: string, id: string) {
    try {
      navigator.clipboard.writeText(texto);
      setCopiadoHash(id);
      setTimeout(() => setCopiadoHash(null), 2500);
    } catch {}
  }

  function formatarDataHora(isoString: string) {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  }

  function getFrequenciaLabel(freq?: string) {
    switch (freq) {
      case 'A_CADA_6H':
        return 'A cada 6 horas';
      case 'A_CADA_12H':
        return 'A cada 12 horas';
      case 'SEMANAL':
        return 'Semanal (Domingos)';
      case 'DIARIO':
      default:
        return 'Diário (Às 03:00)';
    }
  }

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL DO AGENDAMENTO DE BACKUP */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 relative">
              <Archive className="w-6 h-6" />
              {config?.ativo && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Agendamento de Backup &amp; Logs de Conclusão
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  config?.ativo
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                }`}>
                  {config?.ativo ? 'Agendador Ativo' : 'Agendamento Pausado'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Supabase PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Rotina automatizada de snapshots da base de dados com integridade SHA-256 e feed de logs para auditoria no painel.
              </p>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO: EXECUTAR BACKUP AGORA E CONFIGURAR AGENDAMENTO */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setModalConfig(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configurar Agendamento</span>
            </button>

            <button
              type="button"
              onClick={() => executarBackupImediato('MANUAL', 'Administrador PEX')}
              disabled={executandoBackup}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${executandoBackup ? 'animate-spin' : ''}`} />
              <span>{executandoBackup ? 'Extraindo Backup...' : 'Fazer Backup Agora'}</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK DE SUCESSO OU ERRO */}
        {mensagemSucesso && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">{mensagemSucesso}</span>
            </div>
            <button
              onClick={() => setMensagemSucesso(null)}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {mensagemErro && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="font-semibold">{mensagemErro}</span>
            </div>
            <button
              onClick={() => setMensagemErro(null)}
              className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* CARDS DE STATUS DO AGENDAMENTO E SAÚDE DO BACKUP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Frequência Programada</span>
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {getFrequenciaLabel(config?.frequencia)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Horário base: {config?.horarioExecucao || '03:00'} · Retenção: {config?.retencaoDias || 15} dias
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Próxima Execução</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 truncate">
              {config?.proximaExecucao ? formatarDataHora(config.proximaExecucao) : 'Automática'}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Disparo agendado no servidor
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Último Backup</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">
              {logs[0]?.dataConclusao ? formatarDataHora(logs[0].dataConclusao) : 'Ainda não realizado'}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              {logs[0]?.tamanhoFormatado ? `${logs[0].tamanhoFormatado} · ${logs[0].duracaoMs}ms` : 'Aguardando primeiro ciclo'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Histórico de Snapshots</span>
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              {logs.filter(l => l.status === 'SUCESSO').length} concluídos com 100% integridade
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO DA TABELA DE LOGS DE CONCLUSÃO */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Logs de Conclusão do Backup
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auditoria detalhada de cada snapshot gerado, duração, tamanho dos dados e integridade SHA-256.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={carregarDadosBackup}
              disabled={carregando}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
              <span>Atualizar Logs</span>
            </button>

            <a
              href="/api/admin/backup?action=download"
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all border border-blue-200 dark:border-blue-800 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Último Snapshot</span>
            </a>
          </div>
        </div>

        {/* TABELA DE LOGS */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-slate-50/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 text-left w-[24%]">Data / Hora de Conclusão</th>
                <th className="py-3 px-3 text-left w-[14%]">Tipo &amp; Origem</th>
                <th className="py-3 px-2 text-center w-[12%]">Status</th>
                <th className="py-3 px-3 text-left w-[18%]">Métricas &amp; Tamanho</th>
                <th className="py-3 px-3 text-left w-[20%]">Checksum SHA-256</th>
                <th className="py-3 px-3 text-right w-[12%]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum log de backup registrado no momento. Clique em &quot;Fazer Backup Agora&quot; para disparar a primeira rotina.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSucesso = log.status === 'SUCESSO';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      {/* COLUNA 1: DATA E HORA DE CONCLUSÃO */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${isSucesso ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 dark:text-white block font-mono">
                              {formatarDataHora(log.dataConclusao)}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate" title={log.arquivoNome}>
                              {log.arquivoNome || 'snapshot.json'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* COLUNA 2: TIPO E INICIADO POR */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.tipo === 'AGENDADO'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                        }`}>
                          {log.tipo === 'AGENDADO' ? <Clock className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                          <span>{log.tipo}</span>
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 truncate" title={log.iniciadoPor}>
                          {log.iniciadoPor || 'Admin'}
                        </span>
                      </td>

                      {/* COLUNA 3: STATUS */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isSucesso
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        }`}>
                          {isSucesso ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          <span>{log.status}</span>
                        </span>
                      </td>

                      {/* COLUNA 4: MÉTRICAS & TAMANHO */}
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {log.tamanhoFormatado || '0 B'} · {log.duracaoMs}ms
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {log.resumoTabelas?.totalRegistros ?? 0} registros catalogados
                        </span>
                      </td>

                      {/* COLUNA 5: CHECKSUM SHA-256 COM CÓPIA */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="truncate max-w-[110px]" title={log.checksumSha256}>
                            {log.checksumSha256 ? `${log.checksumSha256.substring(0, 12)}...` : '-'}
                          </span>
                          {log.checksumSha256 && log.checksumSha256 !== '-' && (
                            <button
                              type="button"
                              onClick={() => copiarParaClipboard(log.checksumSha256, log.id)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              title="Copiar Hash SHA-256 completo"
                            >
                              {copiadoHash === log.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* COLUNA 6: AÇÕES */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setModalLogDetalhe(log)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Ver detalhes do log"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`/api/admin/backup?action=download&id=${log.id}`}
                            download
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Baixar Snapshot (.json)"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIGURAÇÃO DE AGENDAMENTO */}
      {modalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Configurar Agendamento de Backup
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Defina a periodicidade e regras de retenção automática.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalConfig(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarAgendamento} className="space-y-4">
              {/* TOGGLE ATIVO / PAUSADO */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Backup Automático Ativo
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Executa periodicamente sem necessidade de intervenção manual.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAtivo}
                    onChange={(e) => setFormAtivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* FREQUÊNCIA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Frequência de Execução
                </label>
                <select
                  value={formFrequencia}
                  onChange={(e) => setFormFrequencia(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="DIARIO">Diário (Uma vez ao dia no horário selecionado)</option>
                  <option value="A_CADA_12H">A cada 12 Horas (Duas vezes ao dia)</option>
                  <option value="A_CADA_6H">A cada 6 Horas (Quatro vezes ao dia)</option>
                  <option value="SEMANAL">Semanal (Todo domingo)</option>
                </select>
              </div>

              {/* HORÁRIO DE EXECUÇÃO */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Horário Preferencial
                  </label>
                  <input
                    type="time"
                    value={formHorario}
                    onChange={(e) => setFormHorario(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Retenção de Snapshots
                  </label>
                  <select
                    value={formRetencao}
                    onChange={(e) => setFormRetencao(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value={7}>Manter últimos 7 dias</option>
                    <option value={15}>Manter últimos 15 dias (Recomendado)</option>
                    <option value={30}>Manter últimos 30 dias</option>
                    <option value={60}>Manter últimos 60 dias</option>
                  </select>
                </div>
              </div>

              {/* NOTIFICAÇÃO POR E-MAIL */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    <span>Notificar conclusão por e-mail</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={formNotificar}
                    onChange={(e) => setFormNotificar(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                </div>
                {formNotificar && (
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="admin@pexagritech.com"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalConfig(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {salvandoConfig ? 'Salvando...' : 'Salvar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DO LOG DE CONCLUSÃO */}
      {modalLogDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 max-w-xl w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Detalhes do Log de Conclusão de Backup
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {modalLogDetalhe.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalLogDetalhe(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Data &amp; Hora</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatarDataHora(modalLogDetalhe.dataConclusao)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Disparado Por</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {modalLogDetalhe.iniciadoPor} ({modalLogDetalhe.tipo})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Duração &amp; Tamanho</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {modalLogDetalhe.duracaoMs}ms · {modalLogDetalhe.tamanhoFormatado}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status do Snapshot</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {modalLogDetalhe.status} (Integridade Validada)
                  </span>
                </div>
              </div>

              {/* DETALHAMENTO DE TABELAS */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Inventário de Entidades no Snapshot
                </span>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[9px]">USUÁRIOS</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {modalLogDetalhe.resumoTabelas?.usuarios ?? 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[9px]">PROCESSOS</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {modalLogDetalhe.resumoTabelas?.processos ?? 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[9px]">CONTAINERS</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {modalLogDetalhe.resumoTabelas?.containers ?? 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[9px]">NOTAS FISCAIS</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {modalLogDetalhe.resumoTabelas?.notasFiscais ?? 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[9px]">ENTIDADES</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {modalLogDetalhe.resumoTabelas?.entidades ?? 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[9px]">TEMPLATES</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {modalLogDetalhe.resumoTabelas?.templates ?? 27}
                    </span>
                  </div>
                </div>
              </div>

              {/* CHECKSUM */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Assinatura Criptográfica SHA-256
                </span>
                <div className="font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all select-all">
                  {modalLogDetalhe.checksumSha256}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                &quot;{modalLogDetalhe.mensagem}&quot;
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <a
                href={`/api/admin/backup?action=download&id=${modalLogDetalhe.id}`}
                download
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Snapshot (.json)</span>
              </a>

              <button
                type="button"
                onClick={() => setModalLogDetalhe(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
