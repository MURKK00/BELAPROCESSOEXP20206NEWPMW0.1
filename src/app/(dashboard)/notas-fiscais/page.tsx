'use client';

import React, { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  FileSpreadsheet,
  FileText,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
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
  Building2,
  Container,
  Scale,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import {
  formatarDataCivilBR,
  formatarTextoDiasRestantes,
  type FaixaPrazoAverbacao,
  type InfoPrazoAverbacao,
} from '@/lib/prazoAverbacao';
import { formatarCfop, type EtapaNotaFiscalKey, type ResultadoValidacaoCfop } from '@/lib/cfopPorEtapa';

interface ProcessoInfo {
  id: string;
  numeroProcesso: string;
  clienteFinal: string;
  produto: string;
  volumeKg: number;
  portoDestino?: string;
  status: string;
  importadorId?: string | null;
  importadorNome?: string | null;
  totalNotas: number;
}

interface NotaFiscalItem {
  id: string;
  processoId: string;
  etapa: EtapaNotaFiscalKey;
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
  prazoAverbacao?: InfoPrazoAverbacao;
  cfopValidacao?: ResultadoValidacaoCfop;
  processo?: ProcessoInfo & {
    importador?: {
      id: string;
      razaoSocial: string;
      nomeFantasia?: string | null;
    } | null;
  };
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

interface PaginacaoInfo {
  page: number;
  pageSize: number;
  totalItens: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FaixasPrazoResumo {
  AVERBADA: number;
  DENTRO_DO_PRAZO: number;
  CRITICO: number;
  FORA_DO_PRAZO: number;
}

interface FiltrosDisponiveis {
  importadores: Array<{ id: string; nome: string }>;
  produtos: string[];
  anos: number[];
}

function ModuloNotasFiscaisContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Ler filtros diretamente da URL (compartilhável)
  const filtroProcesso = searchParams.get('processoId') || 'todos';
  const filtroImportador = searchParams.get('importadorId') || 'todos';
  const filtroProduto = searchParams.get('produto') || 'todos';
  const filtroAno = searchParams.get('ano') || 'todos';
  const filtroEtapa = searchParams.get('etapa') || 'todas';
  const filtroStatusAverbacao = searchParams.get('statusAverbacao') || 'todos';
  const filtroFaixaPrazo = searchParams.get('faixaPrazo') || 'todas';
  const buscaUrl = searchParams.get('busca') || '';
  const pageUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSizeUrl = Math.max(10, Math.min(100, parseInt(searchParams.get('pageSize') || '25', 10) || 25));

  const [buscaInput, setBuscaInput] = useState(buscaUrl);
  const [modoVisualizacao, setModoVisualizacao] = useState<'tabela' | 'cards'>('tabela');

  const [loading, setLoading] = useState(true);
  const [exportandoCsv, setExportandoCsv] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [notas, setNotas] = useState<NotaFiscalItem[]>([]);
  const [processos, setProcessos] = useState<ProcessoInfo[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [faixasPrazo, setFaixasPrazo] = useState<FaixasPrazoResumo>({
    AVERBADA: 0,
    DENTRO_DO_PRAZO: 0,
    CRITICO: 0,
    FORA_DO_PRAZO: 0,
  });
  const [filtrosDisponiveis, setFiltrosDisponiveis] = useState<FiltrosDisponiveis>({
    importadores: [],
    produtos: [],
    anos: [],
  });
  const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
    page: 1,
    pageSize: 25,
    totalItens: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Estados de ação & Modal de Detalhes
  const [sincronizandoSefaz, setSincronizandoSefaz] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [chaveCopiadaId, setChaveCopiadaId] = useState<string | null>(null);
  const [notaDetalhes, setNotaDetalhes] = useState<NotaFiscalItem | null>(null);

  // Sincronizar campo de busca quando a URL mudar externamente
  useEffect(() => {
    setBuscaInput(buscaUrl);
  }, [buscaUrl]);

  const atualizarUrlParams = useCallback(
    (updates: Record<string, string | number | null | undefined>, resetPage = true) => {
      const next = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, val]) => {
        const str = val === null || val === undefined ? '' : String(val).trim();
        if (!str || str === 'todos' || str === 'todas') {
          next.delete(key);
        } else {
          next.set(key, str);
        }
      });

      if (resetPage && !('page' in updates)) {
        next.delete('page');
      }

      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Debounce da busca textual para não recarregar a cada tecla
  useEffect(() => {
    if (buscaInput === buscaUrl) return;
    const timer = setTimeout(() => {
      atualizarUrlParams({ busca: buscaInput || null }, true);
    }, 320);
    return () => clearTimeout(timer);
  }, [buscaInput, buscaUrl, atualizarUrlParams]);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const params = new URLSearchParams();
      if (filtroProcesso !== 'todos') params.set('processoId', filtroProcesso);
      if (filtroImportador !== 'todos') params.set('importadorId', filtroImportador);
      if (filtroProduto !== 'todos') params.set('produto', filtroProduto);
      if (filtroAno !== 'todos') params.set('ano', filtroAno);
      if (filtroEtapa !== 'todas') params.set('etapa', filtroEtapa);
      if (filtroStatusAverbacao !== 'todos') params.set('statusAverbacao', filtroStatusAverbacao);
      if (filtroFaixaPrazo !== 'todas') params.set('faixaPrazo', filtroFaixaPrazo);
      if (buscaUrl) params.set('busca', buscaUrl);
      params.set('page', String(pageUrl));
      params.set('pageSize', String(pageSizeUrl));

      const res = await fetch(`/api/notas-fiscais?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha ao buscar notas fiscais');
      }

      setNotas(json.data.notas || []);
      setProcessos(json.data.processos || []);
      setResumo(json.data.resumo || null);
      if (json.data.faixasPrazo) setFaixasPrazo(json.data.faixasPrazo);
      if (json.data.filtrosDisponiveis) setFiltrosDisponiveis(json.data.filtrosDisponiveis);
      if (json.data.paginacao) setPaginacao(json.data.paginacao);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar dados do módulo fiscal');
    } finally {
      setLoading(false);
    }
  }, [
    filtroProcesso,
    filtroImportador,
    filtroProduto,
    filtroAno,
    filtroEtapa,
    filtroStatusAverbacao,
    filtroFaixaPrazo,
    buscaUrl,
    pageUrl,
    pageSizeUrl,
  ]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function limparTodosFiltros() {
    setBuscaInput('');
    router.replace(pathname, { scroll: false });
  }

  const possuiFiltrosAtivos =
    filtroProcesso !== 'todos' ||
    filtroImportador !== 'todos' ||
    filtroProduto !== 'todos' ||
    filtroAno !== 'todos' ||
    filtroEtapa !== 'todas' ||
    filtroStatusAverbacao !== 'todos' ||
    filtroFaixaPrazo !== 'todas' ||
    Boolean(buscaUrl);

  function copiarChave(id: string, chave?: string) {
    if (!chave) return;
    navigator.clipboard.writeText(chave);
    setChaveCopiadaId(id);
    setTimeout(() => setChaveCopiadaId(null), 2000);
  }

  async function handleSincronizarTodasSefaz() {
    try {
      setSincronizandoSefaz(true);
      const procAlvo = filtroProcesso !== 'todos' ? filtroProcesso : processos[0]?.id;
      if (!procAlvo) {
        setErro('Nenhuma negociação disponível para sincronizar.');
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
      setErro(`Erro na sincronização: ${err.message}`);
    } finally {
      setSincronizandoSefaz(false);
    }
  }

  async function exportarCsv() {
    try {
      setExportandoCsv(true);
      const params = new URLSearchParams();
      if (filtroProcesso !== 'todos') params.set('processoId', filtroProcesso);
      if (filtroImportador !== 'todos') params.set('importadorId', filtroImportador);
      if (filtroProduto !== 'todos') params.set('produto', filtroProduto);
      if (filtroAno !== 'todos') params.set('ano', filtroAno);
      if (filtroEtapa !== 'todas') params.set('etapa', filtroEtapa);
      if (filtroStatusAverbacao !== 'todos') params.set('statusAverbacao', filtroStatusAverbacao);
      if (filtroFaixaPrazo !== 'todas') params.set('faixaPrazo', filtroFaixaPrazo);
      if (buscaUrl) params.set('busca', buscaUrl);
      params.set('page', '1');
      params.set('pageSize', '2000');

      const res = await fetch(`/api/notas-fiscais?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha ao exportar notas fiscais');
      }

      const notasExportacao: NotaFiscalItem[] = json.data?.notas || [];
      if (notasExportacao.length === 0) {
        setErro('Não há notas fiscais para exportar com os filtros atuais.');
        return;
      }

      const headers = [
        'Negociação',
        'Importador',
        'Produto',
        'Etapa',
        'Número NF',
        'Série',
        'CFOP',
        'Conformidade CFOP',
        'Chave Acesso',
        'Data Emissão',
        'Data Vinculação Sistema',
        'Emitente',
        'Destinatário',
        'Volume Líquido (kg)',
        'Valor Total (R$)',
        'Status SEFAZ',
        'Status Averbação',
        'Faixa Prazo 180d',
        'Dias Restantes',
        'Data Limite Averbação',
        'ICMS a Recolher',
        'Data Averbação',
        'Protocolo SEFAZ / DUE',
        'Contêiner Vinculado',
      ];

      const rows = notasExportacao.map((n) => {
        const importadorLabel =
          n.processo?.importador?.nomeFantasia ||
          n.processo?.importador?.razaoSocial ||
          n.processo?.clienteFinal ||
          '';
        return [
          `"${n.processo?.numeroProcesso || n.processoId}"`,
          `"${importadorLabel}"`,
          `"${n.processo?.produto || ''}"`,
          `"${n.etapa}"`,
          `"${n.numero}"`,
          `"${n.serie || '1'}"`,
          `"${n.cfop ? formatarCfop(n.cfop) : ''}"`,
          `"${n.cfopValidacao?.valido ? 'Conforme' : 'Fora do padrão'}"`,
          `"${n.chaveAcesso || ''}"`,
          `"${n.dataEmissao ? new Date(n.dataEmissao).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : ''}"`,
          `"${n.criadoEm ? new Date(n.criadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : ''}"`,
          `"${n.emitente || ''}"`,
          `"${n.destinatario || ''}"`,
          Number(n.pesoLiquido || 0).toFixed(2),
          Number(n.valorTotal || 0).toFixed(2),
          `"${n.statusSefaz || ''}"`,
          `"${n.statusAverbacao || ''}"`,
          `"${n.prazoAverbacao?.faixa || 'N/A'}"`,
          `"${formatarTextoDiasRestantes(n.prazoAverbacao)}"`,
          `"${formatarDataCivilBR(n.prazoAverbacao?.dataLimiteIso)}"`,
          `"${n.prazoAverbacao?.icmsARecolher ? 'SIM' : 'NÃO'}"`,
          `"${n.dataAverbacao ? new Date(n.dataAverbacao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : ''}"`,
          `"${n.numeroDue || n.protocoloSefaz || ''}"`,
          `"${n.container?.numeroContainer || ''}"`,
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `notas_fiscais_bela_cereais_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setErro(err.message || 'Erro ao exportar CSV');
    } finally {
      setExportandoCsv(false);
    }
  }

  const processoSelecionado = useMemo(() => {
    if (filtroProcesso === 'todos') return null;
    return processos.find((p) => p.id === filtroProcesso) || null;
  }, [filtroProcesso, processos]);

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
      case 'ETAPA_5_AJUSTE_FISCAL':
        return {
          label: '5. Ajuste Fiscal',
          short: 'Etapa 5',
          bg: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
          icon: Scale,
          color: 'text-violet-600 dark:text-violet-400',
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

  function renderCelulaDiasRestantes(prazo?: InfoPrazoAverbacao) {
    if (!prazo || !prazo.aplicavel) {
      return <span className="text-[11px] text-slate-400 font-mono">—</span>;
    }

    if (prazo.faixa === 'AVERBADA') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span>Averbada</span>
        </span>
      );
    }

    if (prazo.faixa === 'FORA_DO_PRAZO') {
      return (
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/40 text-[10px] font-black">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>{formatarTextoDiasRestantes(prazo)}</span>
          </div>
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
              ICMS a recolher
            </span>
          </div>
          {prazo.dataLimiteIso && (
            <div className="text-[10px] text-slate-400 font-mono">
              Venceu em {formatarDataCivilBR(prazo.dataLimiteIso)}
            </div>
          )}
        </div>
      );
    }

    if (prazo.faixa === 'CRITICO') {
      return (
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[10px] font-black">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{formatarTextoDiasRestantes(prazo)}</span>
          </span>
          {prazo.dataLimiteIso && (
            <div className="text-[10px] text-slate-400 font-mono">
              Limite: {formatarDataCivilBR(prazo.dataLimiteIso)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-0.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-[10px] font-bold">
          <span>{formatarTextoDiasRestantes(prazo)}</span>
        </span>
        {prazo.dataLimiteIso && (
          <div className="text-[10px] text-slate-400 font-mono">
            Limite: {formatarDataCivilBR(prazo.dataLimiteIso)}
          </div>
        )}
      </div>
    );
  }

  function formatDataVinculacao(dataIso: string) {
    if (!dataIso) return { dataFormatada: '—', relativo: '' };
    const date = new Date(dataIso);
    const dataFormatada = date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const diffMs = Date.now() - date.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let relativo = '';
    if (diffDias <= 0) relativo = 'Hoje';
    else if (diffDias === 1) relativo = 'Ontem';
    else if (diffDias < 30) relativo = `há ${diffDias} dias`;
    else relativo = `há ${Math.floor(diffDias / 30)} mês(es)`;

    return { dataFormatada, relativo };
  }

  function toggleFaixaPrazo(faixa: FaixaPrazoAverbacao) {
    const proximo = filtroFaixaPrazo === faixa ? 'todas' : faixa;
    atualizarUrlParams({ faixaPrazo: proximo }, true);
  }

  const inicioItem =
    paginacao.totalItens === 0 ? 0 : (paginacao.page - 1) * paginacao.pageSize + 1;
  const fimItem = Math.min(paginacao.totalItens, paginacao.page * paginacao.pageSize);

  return (
    <div className="space-y-6 max-w-full">
      {/* 1. CABEÇALHO DO MÓDULO */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Monitor Fiscal &amp; Averbações
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                5 Etapas · Prazo 180d
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Controle completo das 5 etapas fiscais (incluindo Ajuste Fiscal), prazo legal de 180 dias para averbação da Etapa 4 e conformidade de CFOP.
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
            disabled={exportandoCsv || paginacao.totalItens === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Exportar todas as notas filtradas em planilha CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportandoCsv ? 'Exportando...' : 'Exportar CSV'}</span>
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

      {/* Erro Visível */}
      {erro && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-red-800 dark:text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{erro}</span>
          </div>
          <button
            type="button"
            onClick={carregarDados}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold cursor-pointer shrink-0"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* 2. CARDS CLICÁVEIS DE PRAZO DE AVERBAÇÃO (180 DIAS — ETAPA 4) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Prazo Legal de Averbação (180 dias a partir da emissão da NF Etapa 4 — Clique para filtrar)
          </span>
          {filtroFaixaPrazo !== 'todas' && (
            <button
              type="button"
              onClick={() => atualizarUrlParams({ faixaPrazo: 'todas' }, true)}
              className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            >
              Limpar faixa selecionada
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* AVERBADA */}
          <button
            type="button"
            onClick={() => toggleFaixaPrazo('AVERBADA')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              filtroFaixaPrazo === 'AVERBADA'
                ? 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-emerald-500/30 shadow-sm'
                : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Averbada
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Sem prazo
              </span>
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
              {faixasPrazo.AVERBADA}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">NF(s) Etapa 4 averbada(s) na SEFAZ</p>
          </button>

          {/* DENTRO DO PRAZO */}
          <button
            type="button"
            onClick={() => toggleFaixaPrazo('DENTRO_DO_PRAZO')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              filtroFaixaPrazo === 'DENTRO_DO_PRAZO'
                ? 'border-sky-600 bg-sky-50/90 dark:bg-sky-950/40 ring-2 ring-sky-500/30 shadow-sm'
                : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] hover:border-sky-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                Dentro do Prazo
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                &gt; 5 dias
              </span>
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-sky-700 dark:text-sky-300">
              {faixasPrazo.DENTRO_DO_PRAZO}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Não averbadas com mais de 5 dias restantes</p>
          </button>

          {/* CRÍTICO */}
          <button
            type="button"
            onClick={() => toggleFaixaPrazo('CRITICO')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              filtroFaixaPrazo === 'CRITICO'
                ? 'border-amber-600 bg-amber-50/90 dark:bg-amber-950/40 ring-2 ring-amber-500/30 shadow-sm'
                : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Crítico
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                0 a 5 dias
              </span>
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-amber-700 dark:text-amber-300">
              {faixasPrazo.CRITICO}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Faltam de 0 a 5 dias para vencer 180d</p>
          </button>

          {/* FORA DO PRAZO */}
          <button
            type="button"
            onClick={() => toggleFaixaPrazo('FORA_DO_PRAZO')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              filtroFaixaPrazo === 'FORA_DO_PRAZO'
                ? 'border-red-600 bg-red-50/90 dark:bg-red-950/40 ring-2 ring-red-500/30 shadow-sm'
                : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] hover:border-red-400'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Fora do Prazo
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-red-600 text-white tracking-wider">
                ICMS a recolher
              </span>
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-red-600 dark:text-red-400">
              {faixasPrazo.FORA_DO_PRAZO}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Passou de 180 dias sem averbação</p>
          </button>
        </div>
      </div>

      {/* 3. CARDS DE INDICADORES (KPIS POR ETAPA 1 A 5) */}
      {resumo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Card 1: Etapa 1 */}
          <div className="p-4 sm:p-5 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Factory className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  1. Entrada Indústria
                </span>
              </div>
              <span className="text-[11px] font-black font-mono text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60">
                {resumo.etapa1.qtd} NFs
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {Number(resumo.etapa1.volumeKg || 0).toLocaleString('pt-BR')} <span className="text-xs font-bold text-slate-400">kg</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Valor Fiscal:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                R$ {Number(resumo.etapa1.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Card 2: Etapa 2 */}
          <div className="p-4 sm:p-5 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <Warehouse className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  2. Retorno Armaz.
                </span>
              </div>
              <span className="text-[11px] font-black font-mono text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/60">
                {resumo.etapa2.qtd} NFs
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {Number(resumo.etapa2.volumeKg || 0).toLocaleString('pt-BR')} <span className="text-xs font-bold text-slate-400">kg</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Pendente Retorno:</span>
              <span className={`font-mono font-bold ${resumo.etapa2.saldoPendenteKg > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {Number(resumo.etapa2.saldoPendenteKg || 0).toLocaleString('pt-BR')} kg
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-orange-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, resumo.etapa2.percRetornado || 0)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Etapa 3 */}
          <div className="p-4 sm:p-5 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  3. Lote REDEX
                </span>
              </div>
              <span className="text-[11px] font-black font-mono text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60">
                {resumo.etapa3.qtd} NFs
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {Number(resumo.etapa3.volumeKg || 0).toLocaleString('pt-BR')} <span className="text-xs font-bold text-slate-400">kg</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Saldo Aberto:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {Number(resumo.etapa3.saldoDisponivelKg || 0).toLocaleString('pt-BR')} kg
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>{resumo.etapa3.qtdZeradas} zerada(s)</span>
              <span>{resumo.etapa3.qtdAbertas} aberta(s)</span>
            </div>
          </div>

          {/* Card 4: Etapa 4 */}
          <div className="p-4 sm:p-5 bg-white dark:bg-[#0f172a] rounded-2xl border border-emerald-500/30 dark:border-emerald-800/60 shadow-xs bg-gradient-to-br from-white to-emerald-50/30 dark:from-[#0f172a] dark:to-emerald-950/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Ship className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  4. Exportação
                </span>
              </div>
              <span className="text-[11px] font-black font-mono text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800">
                {resumo.etapa4.qtd} NFs
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                {resumo.etapa4.averbadas} <span className="text-xs font-bold text-slate-500">Averbada(s)</span>
              </div>
              <span className="text-[11px] font-bold font-mono text-amber-600 dark:text-amber-400">
                {resumo.etapa4.pendentesAverbacao} pendente(s)
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{resumo.etapa4.percAverbado.toFixed(0)}%</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {resumo.etapa4.containersAtendidos} contêiner(es)
              </span>
            </div>
            <div className="mt-2 w-full bg-emerald-100 dark:bg-emerald-950 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${resumo.etapa4.percAverbado}%` }}
              />
            </div>
          </div>

          {/* Card 5: Etapa 5 - Ajuste Fiscal */}
          <div className="p-4 sm:p-5 bg-white dark:bg-[#0f172a] rounded-2xl border border-violet-500/30 dark:border-violet-800/60 shadow-xs bg-gradient-to-br from-white to-violet-50/30 dark:from-[#0f172a] dark:to-violet-950/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Scale className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-violet-900 dark:text-violet-200">
                  5. Ajuste Fiscal
                </span>
              </div>
              <span className="text-[11px] font-black font-mono text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-md bg-violet-100/80 dark:bg-violet-950/80 border border-violet-300 dark:border-violet-800">
                {resumo.etapa5?.qtd || 0} NFs
              </span>
            </div>
            <div className="text-xl font-black text-violet-800 dark:text-violet-300 tracking-tight">
              {Number(resumo.etapa5?.volumeKg || 0).toLocaleString('pt-BR')} <span className="text-xs font-bold text-slate-400">kg</span>
            </div>
            <div className="mt-2 pt-2 border-t border-violet-100 dark:border-violet-900/50 flex items-center justify-between text-[11px] text-slate-500">
              <span>Baixa / Dev. Simb.:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                R$ {Number(resumo.etapa5?.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. BARRA DE FILTROS AVANÇADOS COMBINÁVEIS (AND) E ABAS DAS 5 ETAPAS */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Linha 1: Filtros Estruturais Combináveis (Importador, Produto, Ano, Negociação) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Importador
            </label>
            <select
              value={filtroImportador}
              onChange={(e) => atualizarUrlParams({ importadorId: e.target.value }, true)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer"
            >
              <option value="todos">Todos os Importadores</option>
              {filtrosDisponiveis.importadores.map((imp) => (
                <option key={imp.id} value={imp.id}>
                  {imp.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Produto
            </label>
            <select
              value={filtroProduto}
              onChange={(e) => atualizarUrlParams({ produto: e.target.value }, true)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer"
            >
              <option value="todos">Todos os Produtos</option>
              {filtrosDisponiveis.produtos.map((prod) => (
                <option key={prod} value={prod}>
                  {prod}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Ano da Negociação
            </label>
            <select
              value={filtroAno}
              onChange={(e) => atualizarUrlParams({ ano: e.target.value }, true)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer"
            >
              <option value="todos">Todos os Anos</option>
              {filtrosDisponiveis.anos.map((ano) => (
                <option key={ano} value={String(ano)}>
                  {ano}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-orange-500" />
              Negociação (Processo)
            </label>
            <select
              value={filtroProcesso}
              onChange={(e) => atualizarUrlParams({ processoId: e.target.value }, true)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer"
            >
              <option value="todos">Todas as Negociações ({processos.length})</option>
              {processos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numeroProcesso} — {p.clienteFinal} [{p.totalNotas} NFs]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contexto da negociação selecionada */}
        {processoSelecionado && (
          <div className="p-3.5 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/25 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span>{processoSelecionado.numeroProcesso}</span>
              </div>
              <span className="text-slate-400">|</span>
              <div className="text-slate-600 dark:text-slate-300">
                Importador: <strong className="text-slate-900 dark:text-white">{processoSelecionado.importadorNome || processoSelecionado.clienteFinal}</strong>
              </div>
              <span className="text-slate-400">|</span>
              <div className="text-slate-600 dark:text-slate-300">
                Produto: <strong className="text-slate-900 dark:text-white">{processoSelecionado.produto}</strong>
              </div>
              <span className="text-slate-400">|</span>
              <div className="text-slate-600 dark:text-slate-300">
                Volume Contratado: <strong className="text-slate-900 dark:text-white">{Number(processoSelecionado.volumeKg).toLocaleString('pt-BR')} kg</strong>
              </div>
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

        {/* Linha 2: Abas das 5 Etapas e Alternador Tabela/Cards */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto no-scrollbar">
            {[
              { id: 'todas', label: 'Todas as NFs', count: resumo?.totalNotasGeral || 0 },
              { id: 'ETAPA_1_ENTRADA_INDUSTRIA', label: '1. Entrada Indústria', count: resumo?.etapa1?.qtd || 0 },
              { id: 'ETAPA_2_RETORNO_ARMAZENAGEM', label: '2. Retorno Armazenagem', count: resumo?.etapa2?.qtd || 0 },
              { id: 'ETAPA_3_REMESSA_REDEX', label: '3. Lote REDEX', count: resumo?.etapa3?.qtd || 0 },
              { id: 'ETAPA_4_EXPORTACAO', label: '4. Exportação / Contêiner', count: resumo?.etapa4?.qtd || 0 },
              { id: 'ETAPA_5_AJUSTE_FISCAL', label: '5. Ajuste Fiscal', count: resumo?.etapa5?.qtd || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => atualizarUrlParams({ etapa: tab.id }, true)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  filtroEtapa === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    filtroEtapa === tab.id
                      ? 'bg-orange-500 text-white font-bold'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

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

        {/* Linha 3: Situação de Averbação, Faixa de Prazo, Busca Textual e Limpar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Averbação:
            </span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'AVERBADA', label: 'Averbadas' },
              { id: 'PENDENTE_AVERBACAO', label: 'Pendentes' },
              { id: 'AGUARDANDO', label: 'Aguardando' },
              { id: 'REJEITADA', label: 'Rejeitadas' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => atualizarUrlParams({ statusAverbacao: st.id }, true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filtroStatusAverbacao === st.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}

            {possuiFiltrosAtivos && (
              <button
                type="button"
                onClick={limparTodosFiltros}
                className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Limpar filtros
              </button>
            )}
          </div>

          {/* Campo de Busca Textual */}
          <div className="relative min-w-[260px] lg:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por NF, Chave, CFOP, Emitente, Contêiner, DUE..."
              value={buscaInput}
              onChange={(e) => setBuscaInput(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none text-slate-900 dark:text-slate-100"
            />
            {buscaInput && (
              <button
                type="button"
                onClick={() => {
                  setBuscaInput('');
                  atualizarUrlParams({ busca: null }, true);
                }}
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
      ) : notas.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Nenhuma Nota Fiscal encontrada com os filtros selecionados
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tente remover alguns filtros ou selecionar outra faixa/negociação.
          </p>
          {possuiFiltrosAtivos && (
            <button
              type="button"
              onClick={limparTodosFiltros}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              Limpar Todos os Filtros
            </button>
          )}
        </div>
      ) : modoVisualizacao === 'tabela' ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Nota / CFOP / Chave</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Etapa Fiscal</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Negociação / Importador</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Emissão &amp; Vinculação</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Emitente &amp; Destinatário</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-right">Volume (kg) &amp; Valor</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Vínculo Operacional</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status Averbação / SEFAZ</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Dias restantes (180d)</th>
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
                  const importadorNome =
                    nota.processo?.importador?.nomeFantasia ||
                    nota.processo?.importador?.razaoSocial ||
                    nota.processo?.clienteFinal ||
                    'Bela Cereais';
                  const cfopExibicao = nota.cfop ? formatarCfop(nota.cfop) : '—';
                  const cfopValido = nota.cfopValidacao?.valido ?? true;

                  return (
                    <tr
                      key={nota.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        nota.prazoAverbacao?.faixa === 'FORA_DO_PRAZO'
                          ? 'bg-red-50/30 dark:bg-red-950/10'
                          : nota.prazoAverbacao?.faixa === 'CRITICO'
                          ? 'bg-amber-50/30 dark:bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* 1. NOTA / CFOP / CHAVE */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                            NF nº {nota.numero}
                          </span>
                          {nota.serie && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              (série {nota.serie})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                            CFOP {cfopExibicao}
                          </span>
                          {!cfopValido && (
                            <span
                              title={nota.cfopValidacao?.motivo || 'CFOP fora do padrão da etapa'}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[9px] font-bold cursor-help"
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Fora do padrão
                            </span>
                          )}
                        </div>

                        {nota.chaveAcesso ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]" title={nota.chaveAcesso}>
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
                          <span className="text-[10px] text-slate-400 italic block mt-0.5">Sem chave</span>
                        )}
                      </td>

                      {/* 2. ETAPA */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${etapaConfig.bg}`}>
                          <EtapaIcon className="w-3.5 h-3.5" />
                          <span>{etapaConfig.short}</span>
                        </span>
                      </td>

                      {/* 3. NEGOCIAÇÃO / IMPORTADOR / PRODUTO */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/negociacoes/${nota.processoId}/notas-fiscais`}
                          className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                          title="Abrir detalhes fiscais desta negociação"
                        >
                          <span>{nota.processo?.numeroProcesso || nota.processoId}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]" title={importadorNome}>
                          {importadorNome}
                        </div>
                        {nota.processo?.produto && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {nota.processo.produto}
                          </div>
                        )}
                      </td>

                      {/* 4. EMISSÃO & VINCULAÇÃO */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          Emitida: {nota.dataEmissao ? new Date(nota.dataEmissao).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1" title={`Vinculada ao sistema em: ${vinc.dataFormatada}`}>
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Vinculada {vinc.relativo}</span>
                        </div>
                      </td>

                      {/* 5. EMITENTE & DESTINATÁRIO */}
                      <td className="py-3.5 px-4 max-w-[190px]">
                        <div className="font-bold text-slate-900 dark:text-white truncate" title={nota.emitente}>
                          {nota.emitente}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5" title={`Destino: ${nota.destinatario}`}>
                          → {nota.destinatario}
                        </div>
                      </td>

                      {/* 6. VOLUME (KG) & VALOR */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
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
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              nota.saldoZerado || Number(nota.saldoDisponivelKg || 0) <= 0
                                ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            Saldo: {Number(nota.saldoDisponivelKg || 0).toLocaleString('pt-BR')} kg
                          </span>
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

                        {nota.etapa === 'ETAPA_5_AJUSTE_FISCAL' && (
                          <span className="text-[10px] font-medium text-violet-700 dark:text-violet-300">
                            {nota.cfopValidacao?.descricaoEncontrada || 'Ajuste Fiscal de Encerramento'}
                          </span>
                        )}
                      </td>

                      {/* 8. STATUS AVERBAÇÃO / SEFAZ */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {nota.etapa === 'ETAPA_4_EXPORTACAO' ? (
                          isAverbada ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                                <ShieldCheck className="w-3 h-3" />
                                Averbada SEFAZ
                              </span>
                              {nota.numeroDue && (
                                <div className="text-[10px] font-mono text-slate-500">
                                  DUE: {nota.numeroDue}
                                </div>
                              )}
                            </div>
                          ) : isPendenteAverbacao ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                              <Clock className="w-3 h-3" />
                              {nota.statusAverbacao === 'REJEITADA' ? 'Rejeitada' : 'Pendente Averbação'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[10px]">
                              Aguardando DUE
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[10px]">
                            SEFAZ: {nota.statusSefaz || 'AUTORIZADA'}
                          </span>
                        )}
                      </td>

                      {/* 9. DIAS RESTANTES (180 DIAS - ETAPA 4) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderCelulaDiasRestantes(nota.prazoAverbacao)}
                      </td>

                      {/* 10. AÇÕES */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
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

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        CFOP {nota.cfop ? formatarCfop(nota.cfop) : '—'}
                      </span>
                      {nota.cfopValidacao && !nota.cfopValidacao.valido && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[9px] font-bold">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Fora do padrão
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 truncate mt-1.5">
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

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Vinculada {vinc.relativo}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {nota.etapa === 'ETAPA_4_EXPORTACAO' && renderCelulaDiasRestantes(nota.prazoAverbacao)}

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

      {/* 6. RODAPÉ DE PAGINAÇÃO NO SERVIDOR */}
      {paginacao.totalItens > 0 && (
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl px-4 py-3 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 dark:text-slate-400 flex items-center gap-3 flex-wrap">
            <span>
              Mostrando <strong className="text-slate-900 dark:text-white">{inicioItem}</strong> a{' '}
              <strong className="text-slate-900 dark:text-white">{fimItem}</strong> de{' '}
              <strong className="text-slate-900 dark:text-white">{paginacao.totalItens}</strong> notas
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]">Por página:</span>
              <select
                value={String(pageSizeUrl)}
                onChange={(e) => atualizarUrlParams({ pageSize: e.target.value }, true)}
                className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {[15, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!paginacao.hasPrevPage || loading}
              onClick={() => atualizarUrlParams({ page: paginacao.page - 1 }, false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>

            <span className="px-3 py-1.5 font-mono font-bold text-slate-700 dark:text-slate-200">
              Página {paginacao.page} de {paginacao.totalPages}
            </span>

            <button
              type="button"
              disabled={!paginacao.hasNextPage || loading}
              onClick={() => atualizarUrlParams({ page: paginacao.page + 1 }, false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
            >
              Próxima
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 7. MODAL DETALHES COMPLETOS DA NOTA FISCAL & AVERBAÇÃO */}
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

              {/* Status de Averbação, Prazo 180d e SEFAZ */}
              {notaDetalhes.etapa === 'ETAPA_4_EXPORTACAO' && (
                <div
                  className={`p-4 rounded-2xl border ${
                    notaDetalhes.prazoAverbacao?.faixa === 'FORA_DO_PRAZO'
                      ? 'bg-red-500/10 border-red-500/40 text-red-950 dark:text-red-100'
                      : notaDetalhes.statusAverbacao === 'AVERBADA'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2 font-black text-sm">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>
                        Status: {notaDetalhes.statusAverbacao === 'AVERBADA' ? 'Averbada na SEFAZ' : 'Pendente de Averbação'}
                      </span>
                    </div>
                    {renderCelulaDiasRestantes(notaDetalhes.prazoAverbacao)}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {notaDetalhes.numeroDue && (
                      <div>DUE Vinculada: <strong className="font-mono text-slate-900 dark:text-white">{notaDetalhes.numeroDue}</strong></div>
                    )}
                    {notaDetalhes.protocoloSefaz && (
                      <div>Protocolo SEFAZ: <strong className="font-mono text-slate-900 dark:text-white">{notaDetalhes.protocoloSefaz}</strong></div>
                    )}
                    {notaDetalhes.dataAverbacao && (
                      <div>Data Averbação: <strong className="font-mono">{new Date(notaDetalhes.dataAverbacao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</strong></div>
                    )}
                    {notaDetalhes.mensagemSefaz && (
                      <div className="italic text-[11px] mt-1 text-slate-500">{notaDetalhes.mensagemSefaz}</div>
                    )}
                  </div>
                </div>
              )}

              {/* CFOP e Conformidade */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">CFOP</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {notaDetalhes.cfop ? formatarCfop(notaDetalhes.cfop) : 'Não informado'}
                  </span>
                  {notaDetalhes.cfopValidacao?.descricaoEncontrada && (
                    <span className="text-slate-500 ml-1.5">
                      — {notaDetalhes.cfopValidacao.descricaoEncontrada}
                    </span>
                  )}
                </div>
                {notaDetalhes.cfopValidacao && !notaDetalhes.cfopValidacao.valido && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    CFOP fora do padrão
                  </span>
                )}
              </div>

              {/* Grid com Dados Operacionais */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Data de Emissão</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {notaDetalhes.dataEmissao ? new Date(notaDetalhes.dataEmissao).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Data de Vinculação no Sistema</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {notaDetalhes.criadoEm ? new Date(notaDetalhes.criadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'}
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

export default function ModuloNotasFiscaisPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-orange-500/30 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Carregando Monitor Fiscal...</p>
        </div>
      }
    >
      <ModuloNotasFiscaisContent />
    </Suspense>
  );
}
