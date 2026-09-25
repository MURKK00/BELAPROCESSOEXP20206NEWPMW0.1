'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
  PieChart as PieChartIcon
} from 'lucide-react';
import { formatBRL, formatUSD, formatNum } from '@/lib/formatters';
import { adicionarTravamentoAction, atualizarFinanceiroConfigAction } from '@/server/actions/financeiroActions';
import { FinanceiroGraficos } from './FinanceiroGraficos';

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
  totalCustosBRL: number;
  resultadoOperacionalBRL: number;
  margemLucro: number;
  bancoDestino: string;
  statusRecebimento: string;
  financeiroId?: string;
  travamentosCount: number;
  custosCount: number;
  custos?: FinanceiroCustoItem[];
}

interface FinanceiroDashboardClientProps {
  processos: FinanceiroProcessoItem[];
}

export function FinanceiroDashboardClient({ processos }: FinanceiroDashboardClientProps) {
  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('TODOS');
  const [filtroProduto, setFiltroProduto] = useState('TODOS');
  const [filtroBanco, setFiltroBanco] = useState('TODOS');
  const [filtroStatusRecebimento, setFiltroStatusRecebimento] = useState('TODOS');
  const [filtroStatusCambial, setFiltroStatusCambial] = useState('TODOS'); // 'TODOS' | 'ABERTO' | 'PARCIAL' | 'FECHADO'
  const [abaAtiva, setAbaAtiva] = useState<'cambio' | 'dre' | 'graficos'>('cambio');
  const [mostrarGraficosTopo, setMostrarGraficosTopo] = useState(true);

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

      // Filtro de Banco
      if (filtroBanco !== 'TODOS' && p.bancoDestino !== filtroBanco) {
        return false;
      }

      // Filtro de Status de Recebimento
      if (filtroStatusRecebimento !== 'TODOS' && p.statusRecebimento !== filtroStatusRecebimento) {
        return false;
      }

      // Filtro de Status Cambial
      if (filtroStatusCambial !== 'TODOS') {
        const pct = p.valorTotalUsd > 0 ? (p.totalUsdTravado / p.valorTotalUsd) * 100 : 0;
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

  // Cálculos consolidados sobre a lista filtrada
  const metricas = useMemo(() => {
    let valorTotalUsd = 0;
    let totalUsdTravado = 0;
    let saldoUsdParaTravar = 0;
    let receitaBrutaBRL = 0;
    let totalCustosBRL = 0;
    let somaUsdComPtax = 0;
    let somaPtaxPonderada = 0;

    let totalAReceberUsd = 0;
    let totalRecebidoUsd = 0;
    let countAReceber = 0;
    let countRecebido = 0;

    for (const p of processosFiltrados) {
      valorTotalUsd += p.valorTotalUsd;
      totalUsdTravado += p.totalUsdTravado;
      saldoUsdParaTravar += p.saldoUsdParaTravar;
      receitaBrutaBRL += p.receitaBrutaBRL;
      totalCustosBRL += p.totalCustosBRL;

      if (p.totalUsdTravado > 0 && p.ptaxMedia > 0) {
        somaUsdComPtax += p.totalUsdTravado;
        somaPtaxPonderada += p.totalUsdTravado * p.ptaxMedia;
      }

      if (p.statusRecebimento === 'RECEBIDO') {
        totalRecebidoUsd += p.valorTotalUsd;
        countRecebido++;
      } else {
        totalAReceberUsd += p.valorTotalUsd;
        countAReceber++;
      }
    }

    const ptaxMediaPonderadaGeral = somaUsdComPtax > 0 ? somaPtaxPonderada / somaUsdComPtax : 0;
    const resultadoOperacionalBRL = receitaBrutaBRL - totalCustosBRL;
    const margemMediaPercentual = receitaBrutaBRL > 0 ? (resultadoOperacionalBRL / receitaBrutaBRL) * 100 : 0;
    const percentualTravadoGeral = valorTotalUsd > 0 ? (totalUsdTravado / valorTotalUsd) * 100 : 0;

    return {
      valorTotalUsd,
      totalUsdTravado,
      saldoUsdParaTravar,
      receitaBrutaBRL,
      totalCustosBRL,
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
          p.ptaxMedia > 0 ? p.ptaxMedia.toFixed(4) : '-',
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: PENDING FX (CÂMBIO ABERTO) */}
        <div className="flex items-center gap-3.5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-4 shadow-2xs transition-all hover:shadow-md hover:border-amber-500/40">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Unlock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Pending FX (Aberto)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatUSD(metricas.saldoUsdParaTravar)}
              </span>
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block mt-0.5">
              Exposição cambial em aberto a fixar
            </span>
          </div>
        </div>

        {/* CARD 2: CÂMBIO TRAVADO (HEDGE FECHADO COM PTAX MÉDIA) */}
        <div className="flex items-center gap-3 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl p-4 shadow-2xs transition-all hover:shadow-md hover:border-emerald-500/40 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Câmbio Travado
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                {metricas.percentualTravadoGeral.toFixed(1)}%
              </span>
            </div>
            <div className="mt-0.5">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight block truncate">
                {formatUSD(metricas.totalUsdTravado)}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 truncate font-medium">
              PTAX Média Ponderada:{' '}
              <strong>{metricas.ptaxMediaPonderadaGeral > 0 ? metricas.ptaxMediaPonderadaGeral.toFixed(4) : '-'}</strong>
            </span>
          </div>
        </div>

        {/* CARD 3: PREVISÃO DE RECEITA EM REAIS (BRL) */}
        <div className="flex items-center gap-3.5 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 dark:border-blue-500/30 rounded-2xl p-4 shadow-2xs transition-all hover:shadow-md hover:border-blue-500/40">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Receita Fixada (BRL)
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatBRL(metricas.receitaBrutaBRL)}
              </span>
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block mt-0.5">
              Lucro Estimado: <strong>{formatBRL(metricas.resultadoOperacionalBRL)}</strong> ({metricas.margemMediaPercentual.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* CARD 4: LIQUIDAÇÃO BANCÁRIA */}
        <div className="flex items-center gap-3.5 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 dark:border-purple-500/30 rounded-2xl p-4 shadow-2xs transition-all hover:shadow-md hover:border-purple-500/40">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Recebimento em Aberto
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatUSD(metricas.totalAReceberUsd)}
              </span>
            </div>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium block mt-0.5">
              {metricas.countAReceber} a receber · {formatUSD(metricas.totalRecebidoUsd)} baixados
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO VISUAL: GRÁFICOS DE PIZZA (MIX DE CUSTOS) E BARRAS (DISTRIBUIÇÃO DE MARGEM) */}
      {mostrarGraficosTopo && abaAtiva !== 'graficos' && (
        <div className="transition-all animate-in fade-in duration-200">
          <FinanceiroGraficos processos={processosFiltrados} />
        </div>
      )}

      {/* BARRA DE FILTROS & ABAS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-4 transition-colors">
        {/* Abas e Filtros Rápidos */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          {/* Navegação entre Abas */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start">
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
            <button
              type="button"
              onClick={() => setAbaAtiva('graficos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                abaAtiva === 'graficos'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Gráficos & Análise Visual</span>
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
              <option value="BB BRASIL">Banco do Brasil (Brasil)</option>
              <option value="BB AMERICA">BB (América / Miami)</option>
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
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3">Processo</th>
                  <th className="px-5 py-3">Empresa / Importador</th>
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3 text-right">Volume</th>
                  <th className="px-5 py-3 text-right">Total Contrato</th>
                  <th className="px-5 py-3 text-right">Travado (Hedge)</th>
                  <th className="px-5 py-3 text-right">Pending FX (Aberto)</th>
                  <th className="px-5 py-3 text-center">Status Cambial</th>
                  <th className="px-5 py-3 text-right">PTAX Média</th>
                  <th className="px-5 py-3 text-right">Receita (BRL)</th>
                  <th className="px-5 py-3 text-center">Banco</th>
                  <th className="px-5 py-3 text-center">Ações</th>
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
                    const pctTravado = p.valorTotalUsd > 0 ? (p.totalUsdTravado / p.valorTotalUsd) * 100 : 0;
                    const isTotalmenteTravado = pctTravado >= 99.9;
                    const isParcial = pctTravado > 0.1 && pctTravado < 99.9;
                    const isAberto = pctTravado <= 0.1;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Processo */}
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/negociacoes/${p.id}/financeiro`}
                            className="font-extrabold text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1.5"
                          >
                            <span>{p.numeroProcesso}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </Link>
                        </td>

                        {/* Empresa / Importador */}
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[170px]" title={p.clienteFinal}>
                            {p.clienteFinal}
                          </span>
                        </td>

                        {/* Produto */}
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate max-w-[150px]">
                            {p.produto}
                          </span>
                        </td>

                        {/* Volume */}
                        <td className="px-5 py-3.5 text-right font-semibold">
                          <span>{formatNum(p.volumeTon, 3)} t</span>
                          {p.temContainersPreenchidos && (
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold" title="Peso aferido de containers">
                              ✓ real
                            </span>
                          )}
                        </td>

                        {/* Total Contrato */}
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                          <div>{formatUSD(p.valorTotalUsd)}</div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            @ {formatUSD(p.precoUsd)}/t
                          </span>
                        </td>

                        {/* Travado */}
                        <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatUSD(p.totalUsdTravado)}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {p.travamentosCount} trava(s)
                          </span>
                        </td>

                        {/* Pending FX (Saldo a travar) */}
                        <td className="px-5 py-3.5 text-right font-bold">
                          {p.saldoUsdParaTravar > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              {formatUSD(p.saldoUsdParaTravar)}
                            </span>
                          ) : (
                            <span className="text-slate-400">US$ 0,00</span>
                          )}
                        </td>

                        {/* Status Cambial (Progresso) */}
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isTotalmenteTravado
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                  : isParcial
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                              }`}
                            >
                              {isTotalmenteTravado ? 'Travado' : isParcial ? 'Parcial' : 'Aberto'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              {pctTravado.toFixed(1)}%
                            </span>
                          </div>
                        </td>

                        {/* PTAX Média */}
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                          {p.ptaxMedia > 0 ? `R$ ${p.ptaxMedia.toFixed(4)}` : '-'}
                        </td>

                        {/* Receita Fixada BRL */}
                        <td className="px-5 py-3.5 text-right font-extrabold text-slate-900 dark:text-white">
                          {formatBRL(p.receitaBrutaBRL)}
                        </td>

                        {/* Banco */}
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {p.bancoDestino === 'BB AMERICA' ? 'BB América' : 'BB Brasil'}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {p.saldoUsdParaTravar > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProcessoSelecionado(p);
                                  setModalTravaOpen(true);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white transition-all border border-orange-500/20 cursor-pointer"
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
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3">Processo</th>
                  <th className="px-5 py-3">Empresa / Importador</th>
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3 text-right">Volume</th>
                  <th className="px-5 py-3 text-right">Receita Bruta (BRL)</th>
                  <th className="px-5 py-3 text-right">Custos Totais (BRL)</th>
                  <th className="px-5 py-3 text-right">Resultado Operacional</th>
                  <th className="px-5 py-3 text-center">Margem (%)</th>
                  <th className="px-5 py-3 text-center">Liquidação</th>
                  <th className="px-5 py-3 text-center">Ações</th>
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
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/negociacoes/${p.id}/financeiro`}
                            className="font-extrabold text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1.5"
                          >
                            <span>{p.numeroProcesso}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </Link>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[180px]">
                            {p.clienteFinal}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate max-w-[150px]">
                            {p.produto}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right font-semibold">
                          {formatNum(p.volumeTon, 3)} t
                        </td>

                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                          {formatBRL(p.receitaBrutaBRL)}
                        </td>

                        <td className="px-5 py-3.5 text-right font-bold text-rose-600 dark:text-rose-400">
                          {formatBRL(p.totalCustosBRL)}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {p.custosCount} rubrica(s)
                          </span>
                        </td>

                        <td
                          className={`px-5 py-3.5 text-right font-extrabold ${
                            isLucro ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatBRL(p.resultadoOperacionalBRL)}
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              p.margemLucro >= 10
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                : p.margemLucro > 0
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                            }`}
                          >
                            {p.margemLucro.toFixed(1)}%
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              p.statusRecebimento === 'RECEBIDO'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {p.statusRecebimento === 'RECEBIDO' ? '✓ Liquidado' : '⏳ A Receber'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <Link
                            href={`/negociacoes/${p.id}/financeiro`}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors inline-block"
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

      {/* ABA 3: ANÁLISE GRÁFICA DEDICADA & INDICADORES (RECHARTS) */}
      {abaAtiva === 'graficos' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs transition-colors space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-orange-500" />
                <span>Painel Visual de Custos & Rentabilidade de Exportação</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gráficos analíticos dinâmicos gerados via Recharts baseados nos filtros de empresa, produto e status selecionados acima.
              </p>
            </div>
          </div>

          <FinanceiroGraficos processos={processosFiltrados} />
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Valor em USD para travar nesta parcela
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="valorUsdParcial"
                  defaultValue={processoSelecionado.saldoUsdParaTravar.toFixed(2)}
                  max={processoSelecionado.saldoUsdParaTravar}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Taxa PTAX Negociada (R$)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="ptax"
                  placeholder="Ex: 5.6540"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                />
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
