'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { canAccessFinanceiro } from '@/lib/permissions';
import { 
  Scale, 
  DollarSign, 
  Lock, 
  Unlock, 
  Landmark, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  ArrowRight, 
  Layers, 
  ExternalLink,
  PlusCircle,
  FileSpreadsheet,
  X,
  Building2,
  Package,
  RotateCcw,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatBRL, formatUSD, formatNum, formatPTAX } from '@/lib/formatters';
import { adicionarTravamentoAction, atualizarFinanceiroConfigAction } from '@/server/actions/financeiroActions';
import { FinanceiroGraficos } from './FinanceiroGraficos';
import { limparNomeBanco } from '@/lib/proformaHelper';

export interface FinanceiroCustoItem {
  categoria: string;
  categoriaLabel: string;
  valor: number;
}

export interface FinanceiroProcessoItem {
  id: string;
  numeroProcesso: string;
  clienteFinal: string;
  produto: string;
  status: string;
  volumeTon: number;
  volumeKg: number;
  temContainersPreenchidos?: boolean;
  precoUsd: number;
  valorTotalUsd: number;
  totalUsdTravado: number;
  saldoUsdParaTravar: number;
  ptaxMedia: number;
  receitaBrutaBRL: number;
  totalTaxasBRL?: number;
  receitaLiquidaBRL?: number;
  totalCustosBRL: number;
  resultadoOperacionalBRL: number;
  margemLucro: number;
  proporcaoTravada?: number;
  custoProporcionalTravado?: number;
  resultadoTravadoBRL?: number;
  margemTravada?: number;
  receitaProjetadaTotalBRL?: number;
  resultadoProjetadoTotalBRL?: number;
  margemProjetadaTotal?: number;
  bancoDestino: string;
  bancoLimpo?: string;
  statusRecebimento: string;
  dataRecebimento?: string | null;
  totalLiquidoUsd: number;
  totalTaxasUsd: number;
  totalBrutoUsd: number;
  temProforma?: boolean;
  statusProforma?: string;
  dataProforma?: string | null;
  statusSaldo?: string;
  dataSaldo?: string | null;
  statusGeralRecebimento?: 'A_RECEBER' | 'PROFORMA_RECEBIDA' | 'RECEBIDO';
  financeiroId?: string;
  travamentosCount: number;
  custosCount: number;
  custos?: FinanceiroCustoItem[];
}

interface FinanceiroDashboardClientProps {
  processos: FinanceiroProcessoItem[];
}

export function FinanceiroDashboardClient({ processos }: FinanceiroDashboardClientProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bela_user');
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
  }, []);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('TODOS');
  const [filtroProduto, setFiltroProduto] = useState('TODOS');
  const [filtroBanco, setFiltroBanco] = useState('TODOS');
  const [filtroStatusRecebimento, setFiltroStatusRecebimento] = useState('TODOS');
  const [filtroStatusCambial, setFiltroStatusCambial] = useState('TODOS'); // 'TODOS' | 'ABERTO' | 'PARCIAL' | 'FECHADO'
  const [abaAtiva, setAbaAtiva] = useState<'cambio' | 'recebimentos' | 'dre'>('cambio');
  const [filtroSubRecebimento, setFiltroSubRecebimento] = useState<'TODOS' | 'RECEBIDOS' | 'A_RECEBER'>('TODOS');
  const [mostrarGraficosTopo, setMostrarGraficosTopo] = useState(true);
  const [detalhesReceitaAberto, setDetalhesReceitaAberto] = useState(false);

  // Modal para registro rápido de trava PTAX
  const [modalTravaOpen, setModalTravaOpen] = useState(false);
  const [processoSelecionado, setProcessoSelecionado] = useState<FinanceiroProcessoItem | null>(null);

  // Lista dinâmica de Empresas (Cliente Final / Importador)
  const empresasDisponiveis = useMemo(() => {
    const list = Array.from(new Set(processos.map((p) => p.clienteFinal).filter(Boolean)));
    return list.sort((a, b) => a.localeCompare(b));
  }, [processos]);

  // Lista dinâmica de Produtos
  const produtosDisponiveis = useMemo(() => {
    const list = Array.from(new Set(processos.map((p) => p.produto).filter(Boolean)));
    return list.sort((a, b) => a.localeCompare(b));
  }, [processos]);

  // Filtragem dos processos
  const processosFiltrados = useMemo(() => {
    return processos.filter((p) => {
      // Busca textual livre
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const match = 
          p.numeroProcesso.toLowerCase().includes(termo) ||
          p.clienteFinal.toLowerCase().includes(termo) ||
          p.produto.toLowerCase().includes(termo);
        if (!match) return false;
      }

      // Filtro por Empresa (Cliente Final)
      if (filtroEmpresa !== 'TODOS' && p.clienteFinal !== filtroEmpresa) {
        return false;
      }

      // Filtro por Produto
      if (filtroProduto !== 'TODOS' && p.produto !== filtroProduto) {
        return false;
      }

      // Filtro de Banco (compara valor limpo e cru)
      if (filtroBanco !== 'TODOS') {
        const bancoPadrao = limparNomeBanco(p.bancoDestino);
        if (p.bancoDestino !== filtroBanco && bancoPadrao !== filtroBanco && !p.bancoDestino.startsWith(filtroBanco)) {
          return false;
        }
      }

      // Filtro de Status de Recebimento
      if (filtroStatusRecebimento !== 'TODOS') {
        const isRec = p.statusGeralRecebimento === 'RECEBIDO' || p.statusRecebimento === 'RECEBIDO';
        if (filtroStatusRecebimento === 'RECEBIDO' && !isRec) return false;
        if (filtroStatusRecebimento === 'A_RECEBER' && isRec) return false;
      }

      // Filtro de Status Cambial (utiliza valor líquido para cálculo)
      if (filtroStatusCambial !== 'TODOS') {
        const valLiq = (p.totalLiquidoUsd && p.totalLiquidoUsd > 0) ? p.totalLiquidoUsd : p.valorTotalUsd;
        const pct = valLiq > 0 ? (p.totalUsdTravado / valLiq) * 100 : 0;
        if (filtroStatusCambial === 'FECHADO' && pct < 99.9) return false;
        if (filtroStatusCambial === 'ABERTO' && pct > 0.1) return false;
        if (filtroStatusCambial === 'PARCIAL' && (pct <= 0.1 || pct >= 99.9)) return false;
      }

      return true;
    });
  }, [
    processos, 
    busca, 
    filtroEmpresa, 
    filtroProduto, 
    filtroBanco, 
    filtroStatusRecebimento, 
    filtroStatusCambial
  ]);

  // Lista filtrada para aba de Recebimentos
  const processosRecebimentos = useMemo(() => {
    return processosFiltrados.filter((p) => {
      const isLiquidado = p.statusGeralRecebimento === 'RECEBIDO' || p.statusRecebimento === 'RECEBIDO';
      if (filtroSubRecebimento === 'RECEBIDOS') return isLiquidado;
      if (filtroSubRecebimento === 'A_RECEBER') return !isLiquidado;
      return true;
    });
  }, [processosFiltrados, filtroSubRecebimento]);

  const temFiltroAtivo = 
    busca.trim() !== '' ||
    filtroEmpresa !== 'TODOS' ||
    filtroProduto !== 'TODOS' ||
    filtroBanco !== 'TODOS' ||
    filtroStatusRecebimento !== 'TODOS' ||
    filtroStatusCambial !== 'TODOS';

  const limparFiltros = () => {
    setBusca('');
    setFiltroEmpresa('TODOS');
    setFiltroProduto('TODOS');
    setFiltroBanco('TODOS');
    setFiltroStatusRecebimento('TODOS');
    setFiltroStatusCambial('TODOS');
  };

  // Cálculos consolidados sobre a lista filtrada (usando valor LÍQUIDO efetivo)
  const metricas = useMemo(() => {
    let valorTotalUsd = 0;
    let totalLiquidoGeralUsd = 0;
    let totalUsdTravado = 0;
    let saldoUsdParaTravar = 0;
    let receitaBrutaBRL = 0;
    let totalTaxasBRL = 0;
    let receitaLiquidaBRL = 0;
    let totalCustosBRL = 0;
    let custoProporcionalTravado = 0;
    let receitaProjetadaTotalBRL = 0;
    let somaUsdComPtax = 0;
    let somaPtaxPonderada = 0;

    let totalAReceberUsd = 0;
    let totalRecebidoUsd = 0;
    let countAReceber = 0;
    let countRecebido = 0;

    for (const p of processosFiltrados) {
      const valLiq = p.totalLiquidoUsd > 0 ? p.totalLiquidoUsd : p.valorTotalUsd;
      valorTotalUsd += p.valorTotalUsd;
      totalLiquidoGeralUsd += valLiq;
      totalUsdTravado += p.totalUsdTravado;
      saldoUsdParaTravar += p.saldoUsdParaTravar;
      receitaBrutaBRL += p.receitaBrutaBRL;

      const recLiq = p.receitaLiquidaBRL ?? (p.totalTaxasBRL ? p.receitaBrutaBRL - p.totalTaxasBRL : p.receitaBrutaBRL);
      const taxa = p.totalTaxasBRL ?? 0;
      receitaLiquidaBRL += recLiq;
      totalTaxasBRL += taxa;

      totalCustosBRL += p.totalCustosBRL;

      const prop = valLiq > 0 ? Math.min(1, p.totalUsdTravado / valLiq) : 0;
      const custoProp = p.custoProporcionalTravado ?? (p.totalCustosBRL * prop);
      custoProporcionalTravado += custoProp;

      const ptaxRef = p.ptaxMedia > 0 ? p.ptaxMedia : 5.45;
      const recProj = p.receitaProjetadaTotalBRL ?? (recLiq + (p.saldoUsdParaTravar * ptaxRef));
      receitaProjetadaTotalBRL += recProj;

      if (p.totalUsdTravado > 0 && p.ptaxMedia > 0) {
        somaUsdComPtax += p.totalUsdTravado;
        somaPtaxPonderada += p.totalUsdTravado * p.ptaxMedia;
      }

      // Soma de recebimento usando o valor LÍQUIDO efetivo (sem as taxas bancárias descontadas)
      const isRecebido = p.statusGeralRecebimento === 'RECEBIDO' || p.statusRecebimento === 'RECEBIDO';
      if (isRecebido) {
        totalRecebidoUsd += valLiq;
        countRecebido++;
      } else {
        totalAReceberUsd += valLiq;
        countAReceber++;
      }
    }

    const ptaxMediaPonderadaGeral = somaUsdComPtax > 0 ? somaPtaxPonderada / somaUsdComPtax : 0;
    const percentualTravadoGeral = totalLiquidoGeralUsd > 0 ? (totalUsdTravado / totalLiquidoGeralUsd) * 100 : 0;

    // 1. Margem e Lucro REALIZADOS da Parcela Travada (justo e exato, sem distorção por custos de saldo aberto)
    const resultadoTravadoBRL = receitaLiquidaBRL - custoProporcionalTravado;
    const margemTravadaPercentual = receitaLiquidaBRL > 0 ? (resultadoTravadoBRL / receitaLiquidaBRL) * 100 : 0;

    // 2. Margem e Lucro PROJETADOS para a operação 100% concluída (fechando o saldo em aberto)
    const resultadoProjetadoTotalBRL = receitaProjetadaTotalBRL - totalCustosBRL;
    const margemProjetadaTotalPercentual = receitaProjetadaTotalBRL > 0 ? (resultadoProjetadoTotalBRL / receitaProjetadaTotalBRL) * 100 : 0;

    // 3. Resultado Imediato Contábil
    const resultadoOperacionalBRL = receitaLiquidaBRL - totalCustosBRL;
    const margemMediaPercentual = receitaLiquidaBRL > 0 ? (resultadoOperacionalBRL / receitaLiquidaBRL) * 100 : 0;

    return {
      valorTotalUsd,
      totalUsdTravado,
      saldoUsdParaTravar,
      receitaBrutaBRL,
      totalTaxasBRL,
      receitaLiquidaBRL,
      totalCustosBRL,
      custoProporcionalTravado,
      resultadoTravadoBRL,
      margemTravadaPercentual,
      receitaProjetadaTotalBRL,
      resultadoProjetadoTotalBRL,
      margemProjetadaTotalPercentual,
      resultadoOperacionalBRL,
      margemMediaPercentual,
      ptaxMediaPonderadaGeral,
      percentualTravadoGeral,
      totalAReceberUsd,
      totalRecebidoUsd,
      countAReceber,
      countRecebido,
    };
  }, [processosFiltrados]);

  // Exportar resumo para CSV
  const exportarCSV = () => {
    const headers = [
      'Processo',
      'Empresa / Importador',
      'Produto',
      'Volume (Ton)',
      'Preco Unit (USD)',
      'Valor Contrato (USD)',
      'Total Travado (USD)',
      'Saldo a Travar (USD)',
      '% Travado',
      'PTAX Media',
      'Receita Bruta (BRL)',
      'Custos (BRL)',
      'Resultado (BRL)',
      'Margem',
      'Banco Destino',
      'Status Recebimento',
    ];

    const rows = [
      headers,
      ...processosFiltrados.map((p) => {
        const pct = p.valorTotalUsd > 0 ? (p.totalUsdTravado / p.valorTotalUsd) * 100 : 0;
        return [
          p.numeroProcesso,
          p.clienteFinal,
          p.produto,
          p.volumeTon.toFixed(3),
          p.precoUsd.toFixed(2),
          p.valorTotalUsd.toFixed(2),
          p.totalUsdTravado.toFixed(2),
          p.saldoUsdParaTravar.toFixed(2),
          pct.toFixed(1) + '%',
          p.ptaxMedia > 0 ? formatPTAX(p.ptaxMedia) : '-',
          p.receitaBrutaBRL.toFixed(2),
          p.totalCustosBRL.toFixed(2),
          p.resultadoOperacionalBRL.toFixed(2),
          p.margemLucro.toFixed(2) + '%',
          p.bancoDestino,
          p.statusRecebimento,
        ];
      }),
    ];

    const csvContent =
      '\uFEFF' +
      rows
        .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cockpit_Financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (currentUser && !canAccessFinanceiro(currentUser)) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-lg">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          Módulo Financeiro Restrito
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
          O módulo financeiro consolidado é de acesso exclusivo para os perfis <strong>Financeiro</strong>, <strong>Diretoria</strong> e <strong>ADMIN</strong>.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/20"
        >
          Voltar para Visão Geral
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cockpit Financeiro & Câmbio</h2>
            <span className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Confidencial
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe exposição cambial (Pending FX), fechamentos de travas PTAX, margens operacionais e liquidações bancárias por empresa e produto.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMostrarGraficosTopo(!mostrarGraficosTopo)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
              mostrarGraficosTopo
                ? 'border-orange-500/40 bg-orange-50/70 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
            title={mostrarGraficosTopo ? "Ocultar painel de gráficos" : "Exibir painel de gráficos"}
          >
            <PieChartIcon className="w-4 h-4 text-orange-500" />
            <span>{mostrarGraficosTopo ? 'Ocultar Gráficos' : 'Exibir Gráficos'}</span>
          </button>

          <button
            type="button"
            onClick={exportarCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exportar Planilha</span>
          </button>
        </div>
      </div>

      {/* 4 CARDS PRINCIPAIS DE METRICAS EXECUTIVAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CARD 1: PENDING FX (CÂMBIO ABERTO) */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Unlock className="w-4 h-4" />
                </span>
                <span>Pending FX</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0">
                Aberto
              </span>
            </div>

            <div className="text-2xl sm:text-[25px] font-black text-slate-900 dark:text-white tracking-tight my-2">
              {formatUSD(metricas.saldoUsdParaTravar)}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-amber-500/15 dark:border-amber-500/20 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Exposição Cambial:</span>
            <strong className="text-amber-700 dark:text-amber-400">A fixar hedge</strong>
          </div>
        </div>

        {/* CARD 2: CÂMBIO TRAVADO (HEDGE FECHADO COM PTAX MÉDIA) */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Lock className="w-4 h-4" />
                </span>
                <span>Câmbio Travado</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                {metricas.percentualTravadoGeral.toFixed(1)}% coberto
              </span>
            </div>

            <div className="text-2xl sm:text-[25px] font-black text-slate-900 dark:text-white tracking-tight my-2">
              {formatUSD(metricas.totalUsdTravado)}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-emerald-500/15 dark:border-emerald-500/20 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>PTAX Ponderada:</span>
            <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
              {metricas.ptaxMediaPonderadaGeral > 0 ? formatPTAX(metricas.ptaxMediaPonderadaGeral) : '-'}
            </strong>
          </div>
        </div>

        {/* CARD 3: PREVISÃO DE RECEITA EM REAIS (BRL) */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 dark:border-blue-500/30 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span>Receita Fixada (BRL)</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                  metricas.margemTravadaPercentual >= 0
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                }`}
                title={metricas.percentualTravadoGeral < 99.9 ? "Margem real calculada proporcionalmente ao volume já travado" : "Margem com 100% do câmbio fixado"}
              >
                {metricas.margemTravadaPercentual >= 0 ? '+' : ''}{metricas.margemTravadaPercentual.toFixed(1)}% margem
              </span>
            </div>

            <div className="text-2xl sm:text-[25px] font-black text-slate-900 dark:text-white tracking-tight my-2">
              {formatBRL(metricas.receitaLiquidaBRL)}
            </div>
          </div>

          {/* RODAPÉ PADRONIZADO COM FLECHA DE EXPANSÃO */}
          <div className="pt-3 mt-2 border-t border-blue-500/15 dark:border-blue-500/20 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Lucro Realizado:</span>
              <div className="flex items-center gap-1.5">
                <strong className={metricas.resultadoTravadoBRL >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                  {metricas.resultadoTravadoBRL >= 0 ? '+' : ''}{formatBRL(metricas.resultadoTravadoBRL)}
                </strong>
                <button
                  type="button"
                  onClick={() => setDetalhesReceitaAberto(!detalhesReceitaAberto)}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-500/10 rounded transition-colors cursor-pointer"
                  title={detalhesReceitaAberto ? "Minimizar detalhes" : "Expandir projeção e taxas"}
                >
                  {detalhesReceitaAberto ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* CAMPOS EXPANSÍVEIS (SÓ APARECEM SE O USUÁRIO CLICAR NA FLECHA) */}
            {detalhesReceitaAberto && (
              <div className="mt-2.5 pt-2 border-t border-blue-500/10 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 animate-fadeIn">
                {metricas.totalTaxasBRL > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Taxas Deduzidas:</span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      -{formatBRL(metricas.totalTaxasBRL)} (Bruto: {formatBRL(metricas.receitaBrutaBRL)})
                    </span>
                  </div>
                )}
                {metricas.percentualTravadoGeral < 99.9 && metricas.saldoUsdParaTravar > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Lucro Proj. (100%):</span>
                    <strong className={metricas.resultadoProjetadoTotalBRL >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                      {metricas.resultadoProjetadoTotalBRL >= 0 ? '+' : ''}{formatBRL(metricas.resultadoProjetadoTotalBRL)} ({metricas.margemProjetadaTotalPercentual.toFixed(1)}%)
                    </strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CARD 4: LIQUIDAÇÃO BANCÁRIA */}
        <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 dark:border-purple-500/30 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-purple-500/40 transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  <Landmark className="w-4 h-4" />
                </span>
                <span>Recebimento</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 shrink-0">
                {metricas.countAReceber} a receber
              </span>
            </div>

            <div className="text-2xl sm:text-[25px] font-black text-slate-900 dark:text-white tracking-tight my-2">
              {formatUSD(metricas.totalAReceberUsd)}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-purple-500/15 dark:border-purple-500/20 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Liquidado:</span>
            <strong className="text-purple-700 dark:text-purple-400 font-bold">
              {formatUSD(metricas.totalRecebidoUsd)}
            </strong>
          </div>
        </div>
      </div>

      {/* SEÇÃO VISUAL: GRÁFICOS DE PIZZA (MIX DE CUSTOS) E BARRAS (DISTRIBUIÇÃO DE MARGEM) */}
      {mostrarGraficosTopo && (
        <div className="transition-all animate-in fade-in duration-200">
          <FinanceiroGraficos processos={processosFiltrados} />
        </div>
      )}

      {/* BARRA DE FILTROS & ABAS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-4 transition-colors">
        {/* Abas e Filtros Rápidos */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          {/* Navegação entre Abas */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start flex-wrap">
            <button
              type="button"
              onClick={() => setAbaAtiva('cambio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                abaAtiva === 'cambio'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-orange-500" />
              <span>Painel de Travamento Cambial</span>
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('recebimentos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                abaAtiva === 'recebimentos'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Recebimentos (Liquidado vs A Receber)</span>
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('dre')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                abaAtiva === 'dre'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Mini-DRE & Custos Operacionais</span>
            </button>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>
              Mostrando <strong>{processosFiltrados.length}</strong> de {processos.length} processos
            </span>
            {temFiltroAtivo && (
              <button
                type="button"
                onClick={limparFiltros}
                className="flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline font-bold cursor-pointer"
                title="Limpar todos os filtros ativos"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Campos de Filtros: Busca + Empresa + Produto + Câmbio + Banco + Liquidação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Busca textual */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar processo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-7 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 2. Filtro Empresa (Cliente Final / Importador) */}
          <div className="relative">
            <select
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              className={`w-full py-2 px-3 text-xs border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium truncate ${
                filtroEmpresa !== 'TODOS'
                  ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 font-bold'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
              title="Filtrar por Empresa / Importador"
            >
              <option value="TODOS">🏢 Todas as empresas</option>
              {empresasDisponiveis.map((emp) => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filtro Produto */}
          <div className="relative">
            <select
              value={filtroProduto}
              onChange={(e) => setFiltroProduto(e.target.value)}
              className={`w-full py-2 px-3 text-xs border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium truncate ${
                filtroProduto !== 'TODOS'
                  ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 font-bold'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
              title="Filtrar por Produto"
            >
              <option value="TODOS">🌾 Todos os produtos</option>
              {produtosDisponiveis.map((prod) => (
                <option key={prod} value={prod}>
                  {prod}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Filtro Status Cambial */}
          <div>
            <select
              value={filtroStatusCambial}
              onChange={(e) => setFiltroStatusCambial(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
            >
              <option value="TODOS">Todos status cambiais</option>
              <option value="ABERTO">🔓 100% Aberto (Sem trava)</option>
              <option value="PARCIAL">⚠️ Parcialmente Travado</option>
              <option value="FECHADO">🔒 100% Travado (Hedge)</option>
            </select>
          </div>

          {/* 5. Filtro Banco */}
          <div>
            <select
              value={filtroBanco}
              onChange={(e) => setFiltroBanco(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
            >
              <option value="TODOS">Todos os bancos</option>
              <option value="BB BRASIL">Banco do Brasil</option>
              <option value="BB AMERICA">BB América</option>
            </select>
          </div>

          {/* 6. Filtro Liquidação */}
          <div>
            <select
              value={filtroStatusRecebimento}
              onChange={(e) => setFiltroStatusRecebimento(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
            >
              <option value="TODOS">Todas as liquidações</option>
              <option value="A_RECEBER">⏳ A Receber</option>
              <option value="RECEBIDO">✓ Liquidado</option>
            </select>
          </div>
        </div>
      </div>

      {/* ABA 1: PAINEL DE TRAVAMENTO CAMBIAL */}
      {abaAtiva === 'cambio' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monitoramento de Exposição & Travamentos Cambiais</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe o nível de hedge de cada contrato, registre novas travas PTAX ou acesse a DRE completa.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 whitespace-nowrap min-w-[140px]">Processo</th>
                  <th className="px-5 py-3 whitespace-nowrap min-w-[180px]">Empresa / Importador</th>
                  <th className="px-5 py-3 whitespace-nowrap min-w-[140px]">Produto</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[110px]">Volume</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[130px]">Líquido a Travar ($)</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[120px]">Travado (Hedge)</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[130px]">Pending FX (Aberto)</th>
                  <th className="px-5 py-3 text-center whitespace-nowrap min-w-[120px]">Status Cambial</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[110px]">PTAX Média</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[130px]">Receita (BRL)</th>
                  <th className="px-5 py-3 text-center whitespace-nowrap min-w-[120px]">Banco</th>
                  <th className="px-5 py-3 text-center whitespace-nowrap min-w-[100px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {processosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-5 py-12 text-center text-slate-400">
                      Nenhum processo encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  processosFiltrados.map((p) => {
                    const valLiq = p.totalLiquidoUsd > 0 ? p.totalLiquidoUsd : p.valorTotalUsd;
                    const pctTravado = valLiq > 0 ? (p.totalUsdTravado / valLiq) * 100 : 0;
                    const isTotalmenteTravado = pctTravado >= 99.9;
                    const isParcial = pctTravado > 0.1 && pctTravado < 99.9;
                    const isAberto = pctTravado <= 0.1;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Processo */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Link
                            href={`/negociacoes/${p.id}/financeiro`}
                            className="font-extrabold text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <span className="font-mono tracking-tight">{p.numeroProcesso}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          </Link>
                        </td>

                        {/* Empresa / Importador */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[170px]" title={p.clienteFinal}>
                            {p.clienteFinal}
                          </span>
                        </td>

                        {/* Produto */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate max-w-[150px]">
                            {p.produto}
                          </span>
                        </td>

                        {/* Volume */}
                        <td className="px-5 py-3.5 text-right font-semibold whitespace-nowrap">
                          <span className="inline-block whitespace-nowrap">{formatNum(p.volumeTon, 3)} t</span>
                          {p.temContainersPreenchidos && (
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap" title="Peso aferido de containers">
                              ✓ real
                            </span>
                          )}
                        </td>

                        {/* Total Líquido ($) */}
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <div>{formatUSD(valLiq)}</div>
                          {p.totalTaxasUsd && p.totalTaxasUsd > 0 ? (
                            <span className="text-[10px] text-slate-400 font-normal block whitespace-nowrap">
                              Bruto: {formatUSD(p.totalBrutoUsd > 0 ? p.totalBrutoUsd : p.valorTotalUsd)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal block whitespace-nowrap">
                              @ {formatUSD(p.precoUsd)}/t
                            </span>
                          )}
                        </td>

                        {/* Travado */}
                        <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          <div>{formatUSD(p.totalUsdTravado)}</div>
                          <span className="block text-[10px] text-slate-400 font-normal whitespace-nowrap">
                            {p.travamentosCount} trava(s)
                          </span>
                        </td>

                        {/* Pending FX (Saldo a travar) */}
                        <td className="px-5 py-3.5 text-right font-bold whitespace-nowrap">
                          {p.saldoUsdParaTravar > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 whitespace-nowrap">
                              {formatUSD(p.saldoUsdParaTravar)}
                            </span>
                          ) : (
                            <span className="text-slate-400 whitespace-nowrap">US$ 0,00</span>
                          )}
                        </td>

                        {/* Status Cambial (Progresso) */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1 whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                                isTotalmenteTravado
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                  : isParcial
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                              }`}
                            >
                              {isTotalmenteTravado ? 'Travado' : isParcial ? 'Parcial' : 'Aberto'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                              {pctTravado.toFixed(1)}%
                            </span>
                          </div>
                        </td>

                        {/* PTAX Média */}
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">
                          {p.ptaxMedia > 0 ? `R$ ${formatPTAX(p.ptaxMedia)}` : '-'}
                        </td>

                        {/* Receita Fixada BRL */}
                        <td className="px-5 py-3.5 text-right font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                          <div>{formatBRL(p.receitaLiquidaBRL ?? p.receitaBrutaBRL)}</div>
                          {p.totalTaxasBRL && p.totalTaxasBRL > 0 ? (
                            <span className="text-[10px] text-slate-400 font-normal block whitespace-nowrap" title={`Receita Bruta: ${formatBRL(p.receitaBrutaBRL)} - Taxas: ${formatBRL(p.totalTaxasBRL)}`}>
                              Bruto: {formatBRL(p.receitaBrutaBRL)}
                            </span>
                          ) : null}
                        </td>

                        {/* Banco */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            {limparNomeBanco(p.bancoDestino)}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                            {p.saldoUsdParaTravar > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProcessoSelecionado(p);
                                  setModalTravaOpen(true);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white transition-all border border-orange-500/20 cursor-pointer whitespace-nowrap"
                                title="Registrar trava PTAX rápida"
                              >
                                + Trava
                              </button>
                            )}

                            <Link
                              href={`/negociacoes/${p.id}/financeiro`}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Ver DRE completa do processo"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
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
      )}

      {/* ABA 2: MINI-DRE & CUSTOS OPERACIONAIS */}
      {abaAtiva === 'dre' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">DRE Gerencial Consolidada por Processo</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Demonstrativo de Resultado do Exercício com receitas fixadas, custos operacionais e margem de contribuição.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 whitespace-nowrap min-w-[140px]">Processo</th>
                  <th className="px-5 py-3 whitespace-nowrap min-w-[180px]">Empresa / Importador</th>
                  <th className="px-5 py-3 whitespace-nowrap min-w-[140px]">Produto</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[110px]">Volume</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[130px]">Receita Bruta (BRL)</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[130px]">Custos Totais (BRL)</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[140px]">Resultado Operacional</th>
                  <th className="px-5 py-3 text-center whitespace-nowrap min-w-[110px]">Margem (%)</th>
                  <th className="px-5 py-3 text-center whitespace-nowrap min-w-[120px]">Liquidação</th>
                  <th className="px-5 py-3 text-center whitespace-nowrap min-w-[90px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {processosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-slate-400">
                      Nenhum processo encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  processosFiltrados.map((p) => {
                    const isLucro = p.resultadoOperacionalBRL >= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Processo */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Link
                            href={`/negociacoes/${p.id}/financeiro`}
                            className="font-extrabold text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <span className="font-mono tracking-tight">{p.numeroProcesso}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          </Link>
                        </td>

                        {/* Empresa / Importador */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[180px]">
                            {p.clienteFinal}
                          </span>
                        </td>

                        {/* Produto */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate max-w-[150px]">
                            {p.produto}
                          </span>
                        </td>

                        {/* Volume */}
                        <td className="px-5 py-3.5 text-right font-semibold whitespace-nowrap">
                          <span className="inline-block whitespace-nowrap">{formatNum(p.volumeTon, 3)} t</span>
                        </td>

                        {/* Receita Bruta (BRL) */}
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <div>{formatBRL(p.receitaLiquidaBRL ?? p.receitaBrutaBRL)}</div>
                          {p.totalTaxasBRL && p.totalTaxasBRL > 0 ? (
                            <span className="text-[10px] text-slate-400 font-normal block whitespace-nowrap">
                              Bruto: {formatBRL(p.receitaBrutaBRL)}
                            </span>
                          ) : null}
                        </td>

                        {/* Custos Totais (BRL) */}
                        <td className="px-5 py-3.5 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          <div>{formatBRL(p.totalCustosBRL)}</div>
                          <span className="block text-[10px] text-slate-400 font-normal whitespace-nowrap">
                            {p.custosCount} rubrica(s)
                          </span>
                        </td>

                        {/* Resultado Operacional */}
                        <td
                          className={`px-5 py-3.5 text-right font-extrabold whitespace-nowrap ${
                            (p.saldoUsdParaTravar > 0 ? (p.resultadoTravadoBRL ?? p.resultadoOperacionalBRL) : p.resultadoOperacionalBRL) >= 0
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          <div>
                            {formatBRL(p.saldoUsdParaTravar > 0 ? (p.resultadoTravadoBRL ?? p.resultadoOperacionalBRL) : p.resultadoOperacionalBRL)}
                          </div>
                          {p.saldoUsdParaTravar > 0 && p.resultadoProjetadoTotalBRL !== undefined && (
                            <span className="block text-[10px] text-slate-400 font-normal whitespace-nowrap" title="Projeção para quando 100% do contrato for travado em câmbio">
                              Proj: {formatBRL(p.resultadoProjetadoTotalBRL)}
                            </span>
                          )}
                        </td>

                        {/* Margem (%) */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          {(() => {
                            const margemExibida = p.saldoUsdParaTravar > 0 
                              ? (p.margemTravada ?? p.margemLucro) 
                              : p.margemLucro;

                            return (
                              <div className="flex flex-col items-center whitespace-nowrap">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap ${
                                    margemExibida >= 10
                                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                      : margemExibida > 0
                                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                                  }`}
                                  title={p.saldoUsdParaTravar > 0 ? "Margem real calculada sobre a fatia de volume já travada" : "Margem final"}
                                >
                                  {margemExibida.toFixed(1)}%
                                </span>
                                {p.saldoUsdParaTravar > 0 && (
                                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 whitespace-nowrap">
                                    trava real
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Liquidação */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          {(() => {
                            const isLiquidado = p.statusGeralRecebimento === 'RECEBIDO' || p.statusRecebimento === 'RECEBIDO';
                            const isEntrada = p.statusGeralRecebimento === 'PROFORMA_RECEBIDA';
                            return (
                              <span
                                className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${
                                  isLiquidado
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                    : isEntrada
                                    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                }`}
                              >
                                {isLiquidado ? '✓ Liquidado' : isEntrada ? '⚡ Entrada' : '⏳ A Receber'}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Ações */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <Link
                            href={`/negociacoes/${p.id}/financeiro`}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors inline-block whitespace-nowrap"
                          >
                            Ver DRE
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA: RECEBIMENTOS & FLUXO (RECEBIDO VS A RECEBER) */}
      {abaAtiva === 'recebimentos' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Fluxo de Liquidações: Recebidos vs A Receber</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe as divisas creditadas e pendentes em cada contrato, com separação de taxas bancárias e status de liquidação.
              </p>
            </div>

            {/* Sub-filtros rápidos: Todos / Já Recebidos / A Receber */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setFiltroSubRecebimento('TODOS')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filtroSubRecebimento === 'TODOS'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos ({processosFiltrados.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroSubRecebimento('RECEBIDOS')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filtroSubRecebimento === 'RECEBIDOS'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Já Recebidos ({metricas.countRecebido})</span>
              </button>
              <button
                type="button"
                onClick={() => setFiltroSubRecebimento('A_RECEBER')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filtroSubRecebimento === 'A_RECEBER'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>A Receber ({metricas.countAReceber})</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 whitespace-nowrap min-w-[140px]">Processo</th>
                  <th className="px-5 py-3 whitespace-nowrap min-w-[180px]">Empresa / Importador</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[120px]">Valor Bruto ($)</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[100px]">(-) Taxas ($)</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap min-w-[130px]">(=) Líquido Efetivo ($)</th>
                  <th className="px-5 py-3 text-center whitespace-nowrap min-w-[140px]">Condição</th>
                  <th className="px-5 py-3 text-center whitespace-nowrap min-w-[140px]">Status Pagamento</th>
                  <th className="px-5 py-3 text-center whitespace-nowrap min-w-[130px]">Data Recebimento</th>
                  <th className="px-5 py-3 text-center whitespace-nowrap min-w-[130px]">Banco</th>
                  <th className="px-5 py-3 text-center whitespace-nowrap min-w-[90px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {processosRecebimentos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-slate-400">
                      Nenhum processo nesta categoria de recebimento.
                    </td>
                  </tr>
                ) : (
                  processosRecebimentos.map((p) => {
                    const isTotalmenteRecebido = p.statusGeralRecebimento === 'RECEBIDO' || p.statusRecebimento === 'RECEBIDO';
                    const isEntradaPaga = p.statusGeralRecebimento === 'PROFORMA_RECEBIDA';
                    const valBruto = p.totalBrutoUsd > 0 ? p.totalBrutoUsd : p.valorTotalUsd;
                    const taxas = p.totalTaxasUsd || 0;
                    const valLiquido = p.totalLiquidoUsd > 0 ? p.totalLiquidoUsd : (valBruto - taxas);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Processo */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Link
                            href={`/negociacoes/${p.id}/financeiro`}
                            className="font-extrabold text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <span className="font-mono tracking-tight">{p.numeroProcesso}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          </Link>
                        </td>

                        {/* Empresa / Importador */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[180px]" title={p.clienteFinal}>
                            {p.clienteFinal}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                            {p.produto}
                          </span>
                        </td>

                        {/* Valor Bruto */}
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {formatUSD(valBruto)}
                        </td>

                        {/* Taxas Bancárias */}
                        <td className="px-5 py-3.5 text-right font-medium whitespace-nowrap">
                          {taxas > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">
                              -{formatUSD(taxas)}
                            </span>
                          ) : (
                            <span className="text-slate-400 whitespace-nowrap">$0.00</span>
                          )}
                        </td>

                        {/* Líquido Efetivo */}
                        <td className="px-5 py-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatUSD(valLiquido)}
                        </td>

                        {/* Condição */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            {p.temProforma ? 'Pro-forma + Saldo' : 'Pagamento Único'}
                          </span>
                        </td>

                        {/* Status Pagamento */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                              isTotalmenteRecebido
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                : isEntradaPaga
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                            }`}
                          >
                            {isTotalmenteRecebido ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="whitespace-nowrap">100% Recebido</span>
                              </>
                            ) : isEntradaPaga ? (
                              <>
                                <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                                <span className="whitespace-nowrap">Entrada Paga</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="whitespace-nowrap">A Receber</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Data Recebimento */}
                        <td className="px-5 py-3.5 text-center text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {isTotalmenteRecebido ? (
                            <span className="whitespace-nowrap">{p.dataSaldo || p.dataRecebimento || p.dataProforma || 'Liquidado'}</span>
                          ) : isEntradaPaga ? (
                            <span className="whitespace-nowrap">Entrada: {p.dataProforma || '-'}</span>
                          ) : (
                            <span className="text-slate-400 whitespace-nowrap">Pendente</span>
                          )}
                        </td>

                        {/* Banco */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            {limparNomeBanco(p.bancoDestino)}
                          </span>
                        </td>

                        {/* Ação */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <Link
                            href={`/negociacoes/${p.id}/financeiro`}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors inline-block whitespace-nowrap"
                          >
                            Gerenciar
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PARA REGISTRO RÁPIDO DE TRAVA PTAX */}
      {modalTravaOpen && processoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Registrar Trava de Câmbio (Hedge)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Processo {processoSelecionado.numeroProcesso} · {processoSelecionado.clienteFinal}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalTravaOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await adicionarTravamentoAction(formData);
                setModalTravaOpen(false);
                window.location.reload();
              }}
              className="space-y-4"
            >
              <input type="hidden" name="processoId" value={processoSelecionado.id} />
              {processoSelecionado.financeiroId && (
                <input type="hidden" name="financeiroId" value={processoSelecionado.financeiroId} />
              )}

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor Total do Contrato:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {formatUSD(processoSelecionado.valorTotalUsd)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Já Travado:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {formatUSD(processoSelecionado.totalUsdTravado)}
                  </strong>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-1">
                  <span className="text-slate-700 dark:text-slate-300 font-bold">Saldo Disponível:</span>
                  <strong className="text-orange-600 dark:text-orange-400 font-black">
                    {formatUSD(processoSelecionado.saldoUsdParaTravar)}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Trava
                  </label>
                  <input
                    type="date"
                    name="dataTrava"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Valor USD da parcela
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="valorUsdParcial"
                    defaultValue={processoSelecionado.saldoUsdParaTravar.toFixed(2)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Taxa PTAX Negociada (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="ptax"
                    placeholder="Ex: 5,1500727"
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 text-blue-600 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Taxa Cobrada / Tarifa (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="taxa"
                    defaultValue="0"
                    placeholder="0,00"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 text-red-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observação / Referência
                </label>
                <input
                  type="text"
                  name="observacao"
                  placeholder="Ex: Trava de 50% ref. ao Booking"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalTravaOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md shadow-orange-500/20"
                >
                  Confirmar Trava PTAX
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
