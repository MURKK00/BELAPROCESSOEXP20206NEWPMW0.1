'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Factory, 
  Warehouse, 
  Ship, 
  Layers, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  ArrowUpRight, 
  TrendingUp, 
  Calendar, 
  Hash, 
  Building2, 
  UserCheck, 
  Container, 
  X, 
  SlidersHorizontal,
  ChevronRight,
  Info
} from 'lucide-react';

interface ProcessoInfo {
  id: string;
  numeroProcesso: string;
  clienteFinal: string;
  produto: string;
  volumeKg: number;
  portoDestino?: string;
  status: string;
  totalNotas: number;
}

interface NotaFiscalItem {
  id: string;
  processoId: string;
  etapa: 'ETAPA_1_ENTRADA_INDUSTRIA' | 'ETAPA_2_RETORNO_ARMAZENAGEM' | 'ETAPA_3_REMESSA_REDEX' | 'ETAPA_4_EXPORTACAO';
  numero: string;
  serie?: string;
  chaveAcesso?: string;
  dataEmissao: string;
  emitente: string;
  emitenteCnpj?: string;
  destinatario: string;
  destinatarioCnpj?: string;
  cfop?: string;
  pesoLiquido: number;
  pesoBruto?: number;
  quantidadeSacas?: number;
  valorTotal?: number;
  saldoDisponivelKg?: number;
  saldoZerado?: boolean;
  containerId?: string;
  statusSefaz: string;
  protocoloSefaz?: string;
  dataConsultaSefaz?: string;
  mensagemSefaz?: string;
  statusAverbacao: 'AGUARDANDO' | 'PENDENTE_AVERBACAO' | 'AVERBADA' | 'REJEITADA';
  dataAverbacao?: string;
  numeroDue?: string;
  observacoes?: string;
  criadoEm: string;
  processo?: ProcessoInfo;
  container?: {
    id: string;
    numeroContainer?: string;
    lacre?: string;
  };
  retornosComoOrigem?: any[];
  entradasReferenciadas?: any[];
  itensExportacao?: any[];
  consumosEmExportacao?: any[];
}

export default function ModuloNotasFiscaisPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [notas, setNotas] = useState<NotaFiscalItem[]>([]);
  const [processos, setProcessos] = useState<ProcessoInfo[]>([]);
  const [resumo, setResumo] = useState<any>(null);

  // Filtros
  const [filtroProcesso, setFiltroProcesso] = useState<string>('todos');
  const [filtroEtapa, setFiltroEtapa] = useState<string>('todas');
  const [filtroStatusAverbacao, setFiltroStatusAverbacao] = useState<string>('todos');
  const [busca, setBusca] = useState<string>('');
  const [modoVisualizacao, setModoVisualizacao] = useState<'tabela' | 'cards'>('tabela');

  // Estados de ação & Modal de Detalhes
  const [sincronizandoSefaz, setSincronizandoSefaz] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [chaveCopiadaId, setChaveCopiadaId] = useState<string | null>(null);
  const [notaDetalhes, setNotaDetalhes] = useState<NotaFiscalItem | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const params = new URLSearchParams();
      if (filtroProcesso && filtroProcesso !== 'todos') params.append('processoId', filtroProcesso);
      if (filtroEtapa && filtroEtapa !== 'todas') params.append('etapa', filtroEtapa);
      if (filtroStatusAverbacao && filtroStatusAverbacao !== 'todos') params.append('statusAverbacao', filtroStatusAverbacao);
      if (busca) params.append('busca', busca);

      const res = await fetch(`/api/notas-fiscais?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha ao buscar notas fiscais');
      }

      setNotas(json.data.notas || []);
      setProcessos(json.data.processos || []);
      setResumo(json.data.resumo || null);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar dados do módulo fiscal');
    } finally {
      setLoading(false);
    }
  }, [filtroProcesso, filtroEtapa, filtroStatusAverbacao, busca]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Copiar Chave NFe
  function copiarChave(id: string, chave?: string) {
    if (!chave) return;
    navigator.clipboard.writeText(chave);
    setChaveCopiadaId(id);
    setTimeout(() => setChaveCopiadaId(null), 2000);
  }

  // Sincronização geral com SEFAZ
  async function handleSincronizarTodasSefaz() {
    try {
      setSincronizandoSefaz(true);
      // Se houver processo selecionado, sincroniza ele; senão sincroniza todos os ativos
      const procAlvo = filtroProcesso !== 'todos' ? filtroProcesso : processos[0]?.id;
      if (!procAlvo) {
        alert('Nenhuma negociação disponível para sincronizar.');
        return;
      }

      const res = await fetch(`/api/negociacoes/${procAlvo}/notas-fiscais/sefaz-consulta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sincronizarTodas: true }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha ao consultar SEFAZ');
      }

      setMensagemSucesso('Consulta SEFAZ realizada com sucesso! Status de averbação e autorização atualizados.');
      setTimeout(() => setMensagemSucesso(null), 4000);
      carregarDados();
    } catch (err: any) {
      alert(`Erro na sincronização: ${err.message}`);
    } finally {
      setSincronizandoSefaz(false);
    }
  }

  // Exportar relatório em CSV
  function exportarCsv() {
    if (notas.length === 0) {
      alert('Não há notas fiscais para exportar com os filtros atuais.');
      return;
    }

    const headers = [
      'Negociação',
      'Etapa',
      'Número NF',
      'Série',
      'Chave Acesso',
      'Data Emissão',
      'Data Vinculação Sistema',
      'Emitente',
      'Destinatário',
      'Volume Líquido (kg)',
      'Valor Total (R$)',
      'Status SEFAZ',
      'Status Averbação',
      'Data Averbação',
      'Protocolo SEFAZ / DUE',
      'Contêiner Vinculado'
    ];

    const rows = notas.map((n) => [
      `"${n.processo?.numeroProcesso || n.processoId}"`,
      `"${n.etapa}"`,
      `"${n.numero}"`,
      `"${n.serie || '1'}"`,
      `"${n.chaveAcesso || ''}"`,
      `"${n.dataEmissao ? new Date(n.dataEmissao).toLocaleDateString('pt-BR') : ''}"`,
      `"${n.criadoEm ? new Date(n.criadoEm).toLocaleString('pt-BR') : ''}"`,
      `"${n.emitente || ''}"`,
      `"${n.destinatario || ''}"`,
      Number(n.pesoLiquido || 0).toFixed(2),
      Number(n.valorTotal || 0).toFixed(2),
      `"${n.statusSefaz || ''}"`,
      `"${n.statusAverbacao || ''}"`,
      `"${n.dataAverbacao ? new Date(n.dataAverbacao).toLocaleString('pt-BR') : ''}"`,
      `"${n.numeroDue || n.protocoloSefaz || ''}"`,
      `"${n.container?.numeroContainer || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `notas_fiscais_bela_cereais_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Obter detalhes da negociação atualmente selecionada (se for uma específica)
  const processoSelecionado = useMemo(() => {
    if (filtroProcesso === 'todos') return null;
    return processos.find((p) => p.id === filtroProcesso) || null;
  }, [filtroProcesso, processos]);

  // Configurações visuais por etapa
  function getEtapaBadge(etapa: string) {
    switch (etapa) {
      case 'ETAPA_1_ENTRADA_INDUSTRIA':
        return {
          label: '1. Entrada Indústria',
          short: 'Etapa 1',
          bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
          icon: Factory,
          color: 'text-amber-600 dark:text-amber-400',
        };
      case 'ETAPA_2_RETORNO_ARMAZENAGEM':
        return {
          label: '2. Retorno Armazenagem',
          short: 'Etapa 2',
          bg: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
          icon: Warehouse,
          color: 'text-orange-600 dark:text-orange-400',
        };
      case 'ETAPA_3_REMESSA_REDEX':
        return {
          label: '3. Formação Lote REDEX',
          short: 'Etapa 3',
          bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
          icon: Layers,
          color: 'text-blue-600 dark:text-blue-400',
        };
      case 'ETAPA_4_EXPORTACAO':
        return {
          label: '4. Exportação Contêiner',
          short: 'Etapa 4',
          bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          icon: Ship,
          color: 'text-emerald-600 dark:text-emerald-400',
        };
      default:
        return {
          label: etapa,
          short: etapa,
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: FileText,
          color: 'text-slate-600',
        };
    }
  }

  // Formatador de data e tempo relativo de vinculação
  function formatDataVinculacao(dataIso: string) {
    if (!dataIso) return { dataFormatada: '—', relativo: '' };
    const date = new Date(dataIso);
    const dataFormatada = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const diffMs = Date.now() - date.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let relativo = '';
    if (diffDias === 0) relativo = 'Hoje';
    else if (diffDias === 1) relativo = 'Ontem';
    else if (diffDias < 30) relativo = `há ${diffDias} dias`;
    else relativo = `há ${Math.floor(diffDias / 30)} mês(es)`;

    return { dataFormatada, relativo };
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* 1. CABEÇALHO DO MÓDULO */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Acompanhamento Fiscal das Negociações
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                Cockpit NFe
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Acompanhe quantas notas foram emitidas em cada etapa, quando foram vinculadas no sistema e o status de averbação SEFAZ.
            </p>
          </div>
        </div>

        {/* Botões de Ação Superior */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={carregarDados}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Atualizar dados fiscais"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={handleSincronizarTodasSefaz}
            disabled={sincronizandoSefaz}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Sincronizar averbação e autorização com a SEFAZ"
          >
            <ShieldCheck className={`w-4 h-4 text-emerald-600 ${sincronizandoSefaz ? 'animate-bounce' : ''}`} />
            <span>{sincronizandoSefaz ? 'Sincronizando...' : 'Sincronizar SEFAZ'}</span>
          </button>

          <button
            type="button"
            onClick={exportarCsv}
            disabled={notas.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Exportar notas em planilha CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Mensagem Flutuante de Sucesso */}
      {mensagemSucesso && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{mensagemSucesso}</span>
          </div>
          <button 
            type="button"
            onClick={() => setMensagemSucesso(null)} 
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. BARRA DE SELEÇÃO DE NEGOCIAÇÃO E CONTEXTO */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-500" />
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Filtrar por Negociação (Processo)
            </label>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filtroProcesso}
              onChange={(e) => setFiltroProcesso(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none cursor-pointer"
            >
              <option value="todos">🌐 Todas as Negociações ({processos.length} cadastradas)</option>
              {processos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numeroProcesso} — {p.clienteFinal} ({p.produto} • {Number(p.volumeKg).toLocaleString('pt-BR')} kg) [{p.totalNotas} NFs]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Card de Contexto quando uma negociação específica é selecionada */}
        {processoSelecionado && (
          <div className="mt-2 p-3.5 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/25 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span>{processoSelecionado.numeroProcesso}</span>
              </div>
              <span className="text-slate-400">|</span>
              <div className="text-slate-600 dark:text-slate-300">
                Importador: <strong className="text-slate-900 dark:text-white">{processoSelecionado.clienteFinal}</strong>
              </div>
              <span className="text-slate-400">|</span>
              <div className="text-slate-600 dark:text-slate-300">
                Volume Contratado: <strong className="text-slate-900 dark:text-white">{Number(processoSelecionado.volumeKg).toLocaleString('pt-BR')} kg</strong>
              </div>
              {processoSelecionado.portoDestino && (
                <>
                  <span className="text-slate-400">|</span>
                  <div className="text-slate-600 dark:text-slate-300">
                    Porto Destino: <strong className="text-slate-900 dark:text-white">{processoSelecionado.portoDestino}</strong>
                  </div>
                </>
              )}
            </div>

            <Link
              href={`/negociacoes/${processoSelecionado.id}/notas-fiscais`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
            >
              <span>Gerenciar nesta Negociação</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* 3. CARDS DE INDICADORES (KPIS POR ETAPA & AVERBAÇÃO) */}
      {resumo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Etapa 1 - Entrada Indústria */}
          <div className="p-5 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Factory className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  1. Entrada Indústria
                </span>
              </div>
              <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60">
                {resumo.etapa1.qtd} NFs
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {Number(resumo.etapa1.volumeKg || 0).toLocaleString('pt-BR')} <span className="text-xs font-bold text-slate-400">kg</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Valor Total Fiscal:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                R$ {Number(resumo.etapa1.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Card 2: Etapa 2 - Retorno Armazenagem */}
          <div className="p-5 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <Warehouse className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  2. Retorno Armazenagem
                </span>
              </div>
              <span className="text-xs font-black font-mono text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/60">
                {resumo.etapa2.qtd} NFs
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {Number(resumo.etapa2.volumeKg || 0).toLocaleString('pt-BR')} <span className="text-xs font-bold text-slate-400">kg</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Saldo Pendente Retorno:</span>
              <span className={`font-mono font-bold ${resumo.etapa2.saldoPendenteKg > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {Number(resumo.etapa2.saldoPendenteKg || 0).toLocaleString('pt-BR')} kg
              </span>
            </div>
            {/* Barra de progresso */}
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-orange-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, resumo.etapa2.percRetornado || 0)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Etapa 3 - Formação Lote REDEX */}
          <div className="p-5 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  3. Lote REDEX (Santos)
                </span>
              </div>
              <span className="text-xs font-black font-mono text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60">
                {resumo.etapa3.qtd} NFs
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {Number(resumo.etapa3.volumeKg || 0).toLocaleString('pt-BR')} <span className="text-xs font-bold text-slate-400">kg</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Saldo Aberto p/ Estufar:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {Number(resumo.etapa3.saldoDisponivelKg || 0).toLocaleString('pt-BR')} kg
              </span>
            </div>
            {/* Status Lotes */}
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>{resumo.etapa3.qtdZeradas} zerada(s)</span>
              <span>{resumo.etapa3.qtdAbertas} aberta(s)</span>
            </div>
          </div>

          {/* Card 4: Etapa 4 - Exportação & Averbação SEFAZ */}
          <div className="p-5 bg-white dark:bg-[#0f172a] rounded-2xl border border-emerald-500/30 dark:border-emerald-800/60 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/30 dark:from-[#0f172a] dark:to-emerald-950/10">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Ship className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  4. Exportação &amp; Averbação
                </span>
              </div>
              <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800">
                {resumo.etapa4.qtd} NFs
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                {resumo.etapa4.averbadas} <span className="text-xs font-bold text-slate-500">Averbada(s)</span>
              </div>
              <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                {resumo.etapa4.pendentesAverbacao} pendente(s)
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{resumo.etapa4.percAverbado.toFixed(0)}% Averbado SEFAZ</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {resumo.etapa4.containersAtendidos} contêiner(es)
              </span>
            </div>
            {/* Barra de progresso averbação */}
            <div className="mt-2 w-full bg-emerald-100 dark:bg-emerald-950 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${resumo.etapa4.percAverbado}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. BARRA DE FILTROS, ABAS E PESQUISA */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Abas das Etapas */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto no-scrollbar">
            {[
              { id: 'todas', label: 'Todas as NFs', count: resumo?.totalNotasGeral || 0 },
              { id: 'ETAPA_1_ENTRADA_INDUSTRIA', label: '1. Entrada Indústria', count: resumo?.etapa1?.qtd || 0 },
              { id: 'ETAPA_2_RETORNO_ARMAZENAGEM', label: '2. Retorno Armazenagem', count: resumo?.etapa2?.qtd || 0 },
              { id: 'ETAPA_3_REMESSA_REDEX', label: '3. Lote REDEX', count: resumo?.etapa3?.qtd || 0 },
              { id: 'ETAPA_4_EXPORTACAO', label: '4. Exportação / Contêiner', count: resumo?.etapa4?.qtd || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroEtapa(tab.id)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  filtroEtapa === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filtroEtapa === tab.id
                    ? 'bg-orange-500 text-white font-bold'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Alternador de Modo de Exibição (Tabela vs Cards) */}
          <div className="flex items-center gap-1.5 self-end lg:self-auto">
            <button
              type="button"
              onClick={() => setModoVisualizacao('tabela')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                modoVisualizacao === 'tabela'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Visão Tabela
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacao('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                modoVisualizacao === 'cards'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Visão Cards
            </button>
          </div>
        </div>

        {/* Linha de Filtro Rápido de Averbação e Campo de Busca */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Averbação:
            </span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'AVERBADA', label: '🛡️ Averbadas SEFAZ' },
              { id: 'PENDENTE_AVERBACAO', label: '⏳ Pendentes de Averbação' },
              { id: 'AGUARDANDO', label: 'Aguardando' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFiltroStatusAverbacao(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filtroStatusAverbacao === st.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Campo de Busca Textual */}
          <div className="relative min-w-[260px] sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por NF, Chave, Fornecedor, Contêiner..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none text-slate-900 dark:text-slate-100"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. LISTA DE NOTAS FISCAIS (TABELA OU CARDS) */}
      {loading && notas.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-orange-500/30 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Carregando acompanhamento de Notas Fiscais...</p>
        </div>
      ) : erro && notas.length === 0 ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-red-800 dark:text-red-300 text-xs">
          <div className="font-bold mb-1">Falha ao carregar notas fiscais</div>
          <div>{erro}</div>
          <button
            onClick={carregarDados}
            className="mt-3 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      ) : notas.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Nenhuma Nota Fiscal encontrada com os filtros selecionados
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tente remover os filtros de busca ou selecionar outra negociação no menu superior.
          </p>
          {(filtroProcesso !== 'todos' || filtroEtapa !== 'todas' || filtroStatusAverbacao !== 'todos' || busca) && (
            <button
              type="button"
              onClick={() => {
                setFiltroProcesso('todos');
                setFiltroEtapa('todas');
                setFiltroStatusAverbacao('todos');
                setBusca('');
              }}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              Limpar Todos os Filtros
            </button>
          )}
        </div>
      ) : modoVisualizacao === 'tabela' ? (
        /* VISÃO TABELA COMPLETA */
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Nota / Chave</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Etapa Fiscal</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Negociação (Processo)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Emissão &amp; Vinculação</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Emitente &amp; Destinatário</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-right">Volume (kg) &amp; Valor</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Vínculo Operacional</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status Averbação / SEFAZ</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {notas.map((nota) => {
                  const etapaConfig = getEtapaBadge(nota.etapa);
                  const EtapaIcon = etapaConfig.icon;
                  const vinc = formatDataVinculacao(nota.criadoEm);
                  const isAverbada = nota.statusAverbacao === 'AVERBADA';
                  const isPendenteAverbacao = nota.etapa === 'ETAPA_4_EXPORTACAO' && !isAverbada;

                  return (
                    <tr key={nota.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* 1. NOTA / SÉRIE / CHAVE */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                            NF nº {nota.numero}
                          </span>
                          {nota.serie && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              (série {nota.serie})
                            </span>
                          )}
                        </div>

                        {nota.chaveAcesso ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-mono text-slate-500 truncate max-w-[150px]" title={nota.chaveAcesso}>
                              {nota.chaveAcesso.slice(0, 6)}...{nota.chaveAcesso.slice(-6)}
                            </span>
                            <button
                              type="button"
                              onClick={() => copiarChave(nota.id, nota.chaveAcesso)}
                              className="text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer p-0.5"
                              title="Copiar Chave de Acesso NFe completa (44 dígitos)"
                            >
                              {chaveCopiadaId === nota.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Sem chave</span>
                        )}
                      </td>

                      {/* 2. ETAPA */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${etapaConfig.bg}`}>
                          <EtapaIcon className="w-3.5 h-3.5" />
                          <span>{etapaConfig.short}</span>
                        </span>
                      </td>

                      {/* 3. NEGOCIAÇÃO */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/negociacoes/${nota.processoId}/notas-fiscais`}
                          className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                          title="Abrir detalhes fiscais desta negociação"
                        >
                          <span>{nota.processo?.numeroProcesso || nota.processoId}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                          {nota.processo?.clienteFinal || 'Bela Cereais'}
                        </div>
                      </td>

                      {/* 4. EMISSÃO & VINCULAÇÃO */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          Emitida: {nota.dataEmissao ? new Date(nota.dataEmissao).toLocaleDateString('pt-BR') : '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1" title={`Vinculada ao sistema em: ${vinc.dataFormatada}`}>
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Vinculada {vinc.relativo}</span>
                        </div>
                      </td>

                      {/* 5. EMITENTE & DESTINATÁRIO */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-900 dark:text-white truncate" title={nota.emitente}>
                          {nota.emitente}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5" title={`Destino: ${nota.destinatario}`}>
                          → {nota.destinatario}
                        </div>
                      </td>

                      {/* 6. VOLUME (KG) & VALOR */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {Number(nota.pesoLiquido || 0).toLocaleString('pt-BR')} kg
                        </div>
                        {nota.valorTotal !== undefined && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            R$ {Number(nota.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* 7. VÍNCULO OPERACIONAL */}
                      <td className="py-3.5 px-4">
                        {nota.etapa === 'ETAPA_4_EXPORTACAO' && (
                          nota.container ? (
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono font-bold">
                              <Container className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{nota.container.numeroContainer || 'Contêiner vinculado'}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                              Sem contêiner vinculado
                            </span>
                          )
                        )}

                        {nota.etapa === 'ETAPA_3_REMESSA_REDEX' && (
                          <div>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              nota.saldoZerado || Number(nota.saldoDisponivelKg || 0) <= 0
                                ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            }`}>
                              Saldo: {Number(nota.saldoDisponivelKg || 0).toLocaleString('pt-BR')} kg
                            </span>
                          </div>
                        )}

                        {nota.etapa === 'ETAPA_2_RETORNO_ARMAZENAGEM' && (
                          <div className="text-[10px] text-slate-500">
                            {nota.retornosComoOrigem && nota.retornosComoOrigem.length > 0 ? (
                              <span>Vinculada à NF Entrada #{nota.retornosComoOrigem[0]?.notaEntrada?.numero || '—'}</span>
                            ) : (
                              <span>Retorno Simbólico</span>
                            )}
                          </div>
                        )}

                        {nota.etapa === 'ETAPA_1_ENTRADA_INDUSTRIA' && (
                          <span className="text-[10px] text-slate-400">Origem Cooperativa/Produtor</span>
                        )}
                      </td>

                      {/* 8. STATUS AVERBAÇÃO / SEFAZ */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {nota.etapa === 'ETAPA_4_EXPORTACAO' ? (
                          isAverbada ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Averbada SEFAZ</span>
                              </span>
                              {nota.dataAverbacao && (
                                <div className="text-[9px] text-slate-400 font-mono">
                                  {new Date(nota.dataAverbacao).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                <Clock className="w-3 h-3" />
                                <span>Pendente Averbação</span>
                              </span>
                            </div>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Autorizada</span>
                          </span>
                        )}
                      </td>

                      {/* 9. AÇÕES */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setNotaDetalhes(nota)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-500 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                          title="Ver detalhes completos da NF e SEFAZ"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISÃO CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notas.map((nota) => {
            const etapaConfig = getEtapaBadge(nota.etapa);
            const EtapaIcon = etapaConfig.icon;
            const vinc = formatDataVinculacao(nota.criadoEm);
            const isAverbada = nota.statusAverbacao === 'AVERBADA';

            return (
              <div
                key={nota.id}
                className="p-5 bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-orange-500/40 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[10px] font-bold border ${etapaConfig.bg}`}>
                      <EtapaIcon className="w-3.5 h-3.5" />
                      <span>{etapaConfig.label}</span>
                    </span>

                    <span className="text-[10px] font-mono text-slate-400">
                      Processo: <strong>{nota.processo?.numeroProcesso || nota.processoId}</strong>
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-black text-slate-900 dark:text-white font-mono">
                        NF nº {nota.numero}
                      </h4>
                      <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                        {Number(nota.pesoLiquido || 0).toLocaleString('pt-BR')} kg
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 truncate mt-1">
                      Emitente: <strong className="text-slate-800 dark:text-slate-200">{nota.emitente}</strong>
                    </div>

                    {nota.chaveAcesso && (
                      <div className="flex items-center gap-1.5 mt-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] font-mono text-slate-500 truncate flex-1">
                          {nota.chaveAcesso}
                        </span>
                        <button
                          type="button"
                          onClick={() => copiarChave(nota.id, nota.chaveAcesso)}
                          className="text-slate-400 hover:text-orange-600 p-0.5 cursor-pointer"
                        >
                          {chaveCopiadaId === nota.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Vinculada {vinc.relativo}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {nota.etapa === 'ETAPA_4_EXPORTACAO' && (
                      isAverbada ? (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          🛡️ Averbada
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          ⏳ Pendente
                        </span>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => setNotaDetalhes(nota)}
                      className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. MODAL DETALHES COMPLETOS DA NOTA FISCAL & AVERBAÇÃO */}
      {notaDetalhes && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-hidden">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden relative animate-scaleUp">
            {/* Header fixo */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-[#0f172a]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Detalhes da Nota Fiscal nº {notaDetalhes.numero}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Processo: {notaDetalhes.processo?.numeroProcesso || notaDetalhes.processoId} • {getEtapaBadge(notaDetalhes.etapa).label}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNotaDetalhes(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm font-bold transition-colors"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo rolável */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Box de Chave de Acesso NFe */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Chave de Acesso NFe (44 dígitos)
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 break-all select-all">
                    {notaDetalhes.chaveAcesso || 'Chave não informada'}
                  </span>
                  {notaDetalhes.chaveAcesso && (
                    <button
                      type="button"
                      onClick={() => copiarChave(notaDetalhes.id, notaDetalhes.chaveAcesso)}
                      className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-orange-500 cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      {chaveCopiadaId === notaDetalhes.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status de Averbação e SEFAZ */}
              {notaDetalhes.etapa === 'ETAPA_4_EXPORTACAO' && (
                <div className={`p-4 rounded-2xl border ${
                  notaDetalhes.statusAverbacao === 'AVERBADA'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-black text-sm">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>
                        Status: {notaDetalhes.statusAverbacao === 'AVERBADA' ? 'Averbada na SEFAZ' : 'Pendente de Averbação'}
                      </span>
                    </div>
                    {notaDetalhes.dataAverbacao && (
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {new Date(notaDetalhes.dataAverbacao).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {notaDetalhes.numeroDue && (
                      <div>DUE Vinculada: <strong className="font-mono text-slate-900 dark:text-white">{notaDetalhes.numeroDue}</strong></div>
                    )}
                    {notaDetalhes.protocoloSefaz && (
                      <div>Protocolo SEFAZ: <strong className="font-mono text-slate-900 dark:text-white">{notaDetalhes.protocoloSefaz}</strong></div>
                    )}
                    {notaDetalhes.mensagemSefaz && (
                      <div className="italic text-[11px] mt-1 text-slate-500">{notaDetalhes.mensagemSefaz}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Grid com Dados Operacionais */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Data de Emissão</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {notaDetalhes.dataEmissao ? new Date(notaDetalhes.dataEmissao).toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Data de Vinculação no Sistema</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {notaDetalhes.criadoEm ? new Date(notaDetalhes.criadoEm).toLocaleString('pt-BR') : '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Volume Líquido</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {Number(notaDetalhes.pesoLiquido || 0).toLocaleString('pt-BR')} kg
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Valor Total da NF</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                    R$ {Number(notaDetalhes.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Emitente & Destinatário */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Emitente</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{notaDetalhes.emitente}</div>
                  {notaDetalhes.emitenteCnpj && (
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">CNPJ: {notaDetalhes.emitenteCnpj}</div>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Destinatário</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{notaDetalhes.destinatario}</div>
                  {notaDetalhes.destinatarioCnpj && (
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">CNPJ/ID: {notaDetalhes.destinatarioCnpj}</div>
                  )}
                </div>
              </div>

              {/* Vínculo com Contêiner */}
              {notaDetalhes.container && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                    <Container className="w-4 h-4" />
                    <span>Contêiner Vinculado: {notaDetalhes.container.numeroContainer || 'Sem identificador'}</span>
                  </div>
                  {notaDetalhes.container.lacre && (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
                      Lacre: {notaDetalhes.container.lacre}
                    </div>
                  )}
                </div>
              )}

              {/* Observações */}
              {notaDetalhes.observacoes && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Observações da NF</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{notaDetalhes.observacoes}</p>
                </div>
              )}
            </div>

            {/* Rodapé fixo */}
            <div className="p-4 sm:px-6 sm:py-3.5 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
              <Link
                href={`/negociacoes/${notaDetalhes.processoId}/notas-fiscais`}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
              >
                <span>Ir para a Negociação</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setNotaDetalhes(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
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
