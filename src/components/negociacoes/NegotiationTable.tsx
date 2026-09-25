'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateBR, STATUS_NEGOCIACAO_MAP } from '@/lib/formatters';
import { atualizarStatusAction } from '@/server/actions/editarProcessoAction';
import type { Processo, ProcessoEtapa } from '@prisma/client';
import { Search, Filter, X, FileSpreadsheet, Printer, ArrowUpDown, Clock, Eye, TrendingUp, TrendingDown, ShieldCheck, AlertCircle } from 'lucide-react';
import { ProcessoDrawer, type ProcessoDrawerData } from './ProcessoDrawer';
import { NegotiationsSummaryBar } from './NegotiationsSummaryBar';

type ProcessoComEtapas = Processo & { 
  etapas: ProcessoEtapa[];
  containersTotal?: number;
  containersPreenchidos?: number;
  metricasFinanceiras?: {
    valorTotalUsd: number;
    totalUsdTravado: number;
    saldoUsdParaTravar: number;
    ptaxMedia: number;
    receitaBrutaBRL: number;
    totalCustosBRL: number;
    resultadoOperacionalBRL: number;
    margemLucro: number;
    statusRecebimento: string;
    bancoDestino: string;
  };
};

const STATUS_OPTIONS = [
  { value: 'TODOS', label: 'Todos os status' },
  ...Object.entries(STATUS_NEGOCIACAO_MAP).map(([value, label]) => ({ value, label })),
];

function getStatusColor(status: string) {
  switch (status) {
    case 'EMBARCADO':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'EM_EXECUCAO':
      return 'bg-[#f58220]/10 text-[#c25e13] border-[#f58220]/30';
    case 'FINALIZADO':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'CANCELADO':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'PENDENTE':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'EM_NEGOCIACAO':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export function NegotiationTable({ processos }: { processos: ProcessoComEtapas[] }) {
  const router = useRouter();

  // Filtros Avançados
  const [buscaTexto, setBuscaTexto] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  const [clienteFiltro, setClienteFiltro] = useState('TODOS');
  const [produtoFiltro, setProdutoFiltro] = useState('TODOS');
  const [armadorFiltro, setArmadorFiltro] = useState('TODOS');
  const [prazoFiltro, setPrazoFiltro] = useState<'TODOS' | 'URGENTES' | 'PROXIMOS'>('TODOS');
  const [ocultarCanceladas, setOcultarCanceladas] = useState(true);
  const [painelAberto, setPainelAberto] = useState(false);
  const [drawerProcesso, setDrawerProcesso] = useState<ProcessoDrawerData | null>(null);

  // Lista dinâmica de clientes, produtos e armadores presentes nos dados
  const clientesDisponiveis = useMemo(() => {
    const list = Array.from(new Set(processos.map((p) => p.clienteFinal).filter(Boolean)));
    return list.sort();
  }, [processos]);

  const produtosDisponiveis = useMemo(() => {
    const list = Array.from(new Set(processos.map((p) => p.produto).filter(Boolean)));
    return list.sort();
  }, [processos]);

  const armadoresDisponiveis = useMemo(() => {
    const list = Array.from(new Set(processos.map((p) => p.armador).filter(Boolean))) as string[];
    return list.sort();
  }, [processos]);

  // Filtragem composta
  const processosFiltrados = useMemo(() => {
    const hoje = new Date();
    const em7Dias = new Date();
    em7Dias.setDate(em7Dias.getDate() + 7);

    return processos.filter((p) => {
      // 1. Ocultar canceladas
      if (ocultarCanceladas && p.status === 'CANCELADO') return false;

      // 2. Status
      if (statusFiltro !== 'TODOS' && p.status !== statusFiltro) return false;

      // 3. Cliente Final
      if (clienteFiltro !== 'TODOS' && p.clienteFinal !== clienteFiltro) return false;

      // 4. Produto
      if (produtoFiltro !== 'TODOS' && p.produto !== produtoFiltro) return false;

      // 5. Armador
      if (armadorFiltro !== 'TODOS' && p.armador !== armadorFiltro) return false;

      // 5. Prazo / Deadline
      if (prazoFiltro === 'URGENTES') {
        if (!p.deadlineEmbarque) return false;
        const dl = new Date(p.deadlineEmbarque);
        // Menos de 48h ou vencido
        const diffHoras = (dl.getTime() - hoje.getTime()) / (1000 * 3600);
        if (diffHoras > 48) return false;
      } else if (prazoFiltro === 'PROXIMOS') {
        if (!p.deadlineEmbarque) return false;
        const dl = new Date(p.deadlineEmbarque);
        if (dl < hoje || dl > em7Dias) return false;
      }

      // 6. Busca por texto livre (Processo, Cliente, Booking, Navio, Trader)
      if (buscaTexto.trim()) {
        const q = buscaTexto.toLowerCase();
        const num = p.numeroProcesso.toLowerCase();
        const cliente = p.clienteFinal.toLowerCase();
        const booking = (p.bookingNumero ?? '').toLowerCase();
        const navio = (p.navio ?? '').toLowerCase();
        const prod = p.produto.toLowerCase();
        const trader = (p.traderIntermedio ?? '').toLowerCase();

        if (
          !num.includes(q) &&
          !cliente.includes(q) &&
          !booking.includes(q) &&
          !navio.includes(q) &&
          !prod.includes(q) &&
          !trader.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    processos,
    ocultarCanceladas,
    statusFiltro,
    produtoFiltro,
    armadorFiltro,
    prazoFiltro,
    buscaTexto,
  ]);

  const temFiltroAtivo =
    buscaTexto !== '' ||
    statusFiltro !== 'TODOS' ||
    clienteFiltro !== 'TODOS' ||
    produtoFiltro !== 'TODOS' ||
    armadorFiltro !== 'TODOS' ||
    prazoFiltro !== 'TODOS';

  const limparFiltros = () => {
    setBuscaTexto('');
    setStatusFiltro('TODOS');
    setClienteFiltro('TODOS');
    setProdutoFiltro('TODOS');
    setArmadorFiltro('TODOS');
    setPrazoFiltro('TODOS');
  };

  const handleStatusChange = async (id: string, novoStatus: string, numeroProcesso: string) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja alterar o status do processo ${numeroProcesso} para ${
        STATUS_NEGOCIACAO_MAP[novoStatus] || novoStatus
      }?`
    );
    if (confirmacao) {
      const formData = new FormData();
      formData.set('processoId', id);
      formData.set('status', novoStatus);
      await atualizarStatusAction(formData);
      router.refresh();
    }
  };

  const handleCancelar = async (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar esta negociação?')) {
      const formData = new FormData();
      formData.set('processoId', id);
      formData.set('status', 'CANCELADO');
      await atualizarStatusAction(formData);
      router.refresh();
    }
  };

  // Exportar listagem filtrada para Excel / CSV
  const exportarListagemCSV = () => {
    const rows = [
      [
        'Nº Processo',
        'Status',
        'Cliente Final',
        'Trader',
        'Produto',
        'Volume (KG)',
        'Incoterm',
        'Porto Origem',
        'Porto Destino',
        'Armador',
        'Navio',
        'Booking Nº',
        'Deadline Embarque',
      ],
      ...processosFiltrados.map((p) => [
        p.numeroProcesso,
        STATUS_NEGOCIACAO_MAP[p.status] || p.status,
        p.clienteFinal,
        p.traderIntermedio || '',
        p.produto,
        String(p.volumeKg),
        p.incoterm || '',
        p.portoOrigem || '',
        p.portoDestino || '',
        p.armador || '',
        p.navio || '',
        p.bookingNumero || '',
        p.deadlineEmbarque ? new Date(p.deadlineEmbarque).toLocaleDateString('pt-BR') : '',
      ]),
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
    link.download = `Negociacoes_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar Relatório Resumido em PDF de todas as negociações ativas/filtradas
  const exportarRelatorioPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalVolumeKg = processosFiltrados.reduce((acc, p) => acc + (Number(p.volumeKg) || 0), 0);
    const totalVolumeTon = totalVolumeKg / 1000;
    const totalProcessos = processosFiltrados.length;
    const processosAtivos = processosFiltrados.filter((p) => p.status !== 'CANCELADO').length;

    // Resumo por status
    const contagemStatus: Record<string, number> = {};
    processosFiltrados.forEach((p) => {
      const st = STATUS_NEGOCIACAO_MAP[p.status] || p.status;
      contagemStatus[st] = (contagemStatus[st] || 0) + 1;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Relatório Geral de Processos - Bela Cereais</title>
        <style>
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
          body { padding: 32px; color: #1f2937; line-height: 1.4; font-size: 11px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 14px; margin-bottom: 20px; }
          .brand { font-size: 18px; font-weight: 800; color: #166534; }
          .title { font-size: 14px; font-weight: 700; color: #111827; margin-top: 2px; }
          .meta { font-size: 10px; color: #6b7280; }
          .grid-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
          .card-title { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #6b7280; margin-bottom: 2px; }
          .card-value { font-size: 15px; font-weight: 800; color: #111827; }
          .status-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; padding: 10px 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
          .chip { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; background: #f3f4f6; color: #374151; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { text-align: left; background: #f3f4f6; padding: 6px 8px; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #4b5563; border-bottom: 1px solid #d1d5db; }
          td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
          .font-bold { font-weight: bold; }
          .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; text-transform: uppercase; }
          .badge-exec { background: #ffedd5; color: #9a3412; }
          .badge-emb { background: #dbeafe; color: #1e40af; }
          .badge-conc { background: #dcfce7; color: #166534; }
          .badge-canc { background: #fee2e2; color: #991b1b; }
          .badge-default { background: #f3f4f6; color: #374151; }
          .text-right { text-align: right; }
          @media print {
            body { padding: 0; }
            @page { size: landscape; margin: 12mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Bela Cereais Export Cockpit</div>
            <div class="title">Relatório Geral de Processos e Negociações</div>
            <div class="meta">Visão consolidada das exportações em andamento</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 700; color: #f58220;">Total: ${totalProcessos} processo(s)</div>
            <div class="meta">Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div class="meta">Filtros aplicados: ${buscaTexto ? `Busca "${buscaTexto}" | ` : ''}Status: ${statusFiltro}</div>
          </div>
        </div>

        <div class="grid-cards">
          <div class="card">
            <div class="card-title">Total de Processos</div>
            <div class="card-value">${totalProcessos}</div>
          </div>
          <div class="card">
            <div class="card-title">Processos Ativos</div>
            <div class="card-value" style="color: #166534;">${processosAtivos}</div>
          </div>
          <div class="card">
            <div class="card-title">Volume Total (Ton)</div>
            <div class="card-value">${totalVolumeTon.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} t</div>
          </div>
          <div class="card">
            <div class="card-title">Volume Total (Kg)</div>
            <div class="card-value">${totalVolumeKg.toLocaleString('pt-BR')} kg</div>
          </div>
        </div>

        <div class="status-chips">
          <span style="font-size: 10px; font-weight: 700; color: #6b7280; align-self: center;">Status:</span>
          ${Object.entries(contagemStatus)
            .map(([status, count]) => `<span class="chip">${status}: <strong>${count}</strong></span>`)
            .join('')}
        </div>

        <table>
          <thead>
            <tr>
              <th>Nº Processo</th>
              <th>Status</th>
              <th>Cliente Final</th>
              <th>Produto</th>
              <th>Volume (t)</th>
              <th>Incoterm</th>
              <th>Armador</th>
              <th>Navio</th>
              <th>Nº Booking</th>
              <th>Deadline Embarque</th>
            </tr>
          </thead>
          <tbody>
            ${processosFiltrados
              .map((p) => {
                const badgeClass =
                  p.status === 'EM_EXECUCAO'
                    ? 'badge-exec'
                    : p.status === 'EMBARCADO'
                    ? 'badge-emb'
                    : p.status === 'FINALIZADO'
                    ? 'badge-conc'
                    : p.status === 'CANCELADO'
                    ? 'badge-canc'
                    : 'badge-default';
                const volTon = (Number(p.volumeKg) || 0) / 1000;
                return `
                <tr style="${p.status === 'CANCELADO' ? 'background: #fef2f2; color: #991b1b;' : ''}">
                  <td class="font-bold">${p.numeroProcesso}</td>
                  <td><span class="badge ${badgeClass}">${STATUS_NEGOCIACAO_MAP[p.status] || p.status}</span></td>
                  <td class="font-bold">${p.clienteFinal}</td>
                  <td>${p.produto}</td>
                  <td>${volTon.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} t</td>
                  <td>${p.incoterm || 'FOB'}</td>
                  <td>${p.armador || '-'}</td>
                  <td>${p.navio || '-'}</td>
                  <td>${p.bookingNumero || '-'}</td>
                  <td>${formatDateBR(p.deadlineEmbarque)}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>

        <div style="margin-top: 24px; border-top: 1px dashed #d1d5db; padding-top: 12px; font-size: 9px; color: #9ca3af; text-align: center;">
          Documento gerado automaticamente pelo Cockpit de Exportação Bela Cereais • Uso Interno Confidencial
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (processos.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-10 text-center text-gray-500 text-sm">
        Nenhum processo ainda.{' '}
        <Link href="/negociacoes/nova" className="text-secondary font-semibold">
          Criar o primeiro
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* BARRA DE RESUMO EXECUTIVO (VOLUME ATIVO & VALOR USD TOTAL) */}
      <NegotiationsSummaryBar
        processos={processos as any}
        processosFiltrados={processosFiltrados as any}
        isFiltered={temFiltroAtivo}
      />

      {/* BARRA DE FILTROS SUPERIOR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de Busca Rápida */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar por Nº processo, cliente, produto, booking, navio..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 placeholder:text-slate-400"
            />
            {buscaTexto && (
              <button
                type="button"
                onClick={() => setBuscaTexto('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botões de Ação de Filtro */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setPainelAberto((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                painelAberto || temFiltroAtivo
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros Avançados</span>
              {temFiltroAtivo && (
                <span className="w-2 h-2 rounded-full bg-orange-500 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={exportarListagemCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors shadow-2xs"
              title="Exportar dados da tabela filtrada para Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={exportarRelatorioPDF}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-2xs"
              title="Exportar relatório consolidado de negociações em formato PDF oficial"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Exportar PDF</span>
            </button>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={ocultarCanceladas}
                onChange={(e) => setOcultarCanceladas(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded border-slate-300 dark:border-slate-600 focus:ring-orange-500 cursor-pointer accent-orange-500"
              />
              Ocultar canceladas
            </label>
          </div>
        </div>

        {/* PAINEL EXPANSÍVEL DE FILTROS AVANÇADOS */}
        {painelAberto && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-in fade-in duration-150">
            {/* Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Cliente Final
              </label>
              <select
                value={clienteFiltro}
                onChange={(e) => setClienteFiltro(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              >
                <option value="TODOS">Todos os clientes ({clientesDisponiveis.length})</option>
                {clientesDisponiveis.map((cli) => (
                  <option key={cli} value={cli}>
                    {cli}
                  </option>
                ))}
              </select>
            </div>

            {/* Produto */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Produto
              </label>
              <select
                value={produtoFiltro}
                onChange={(e) => setProdutoFiltro(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              >
                <option value="TODOS">Todos os produtos ({produtosDisponiveis.length})</option>
                {produtosDisponiveis.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
            </div>

            {/* Armador */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Armador
              </label>
              <select
                value={armadorFiltro}
                onChange={(e) => setArmadorFiltro(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              >
                <option value="TODOS">Todos os armadores</option>
                {armadoresDisponiveis.map((arm) => (
                  <option key={arm} value={arm}>
                    {arm}
                  </option>
                ))}
              </select>
            </div>

            {/* Prazo / Deadline Crítico */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Deadlines Críticos
              </label>
              <select
                value={prazoFiltro}
                onChange={(e) => setPrazoFiltro(e.target.value as any)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              >
                <option value="TODOS">Qualquer prazo</option>
                <option value="URGENTES">🚨 Vencidos ou Próximos 48h</option>
                <option value="PROXIMOS">📅 Próximos 7 dias</option>
              </select>
            </div>

            {/* Reset */}
            {temFiltroAtivo && (
              <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-bold flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpar todos os filtros</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTADOR DE RESULTADOS */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Mostrando <strong>{processosFiltrados.length}</strong> de {processos.length} processo(s)
        </span>
      </div>

      {/* TABELA DE RESULTADOS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs transition-colors">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200/90 dark:border-slate-800 font-bold">
              <th className="text-left px-6 py-4">Nº Processo</th>
              <th className="text-left px-6 py-4 whitespace-nowrap">Status</th>
              <th className="text-left px-6 py-4">Cliente</th>
              <th className="text-left px-6 py-4">Produto</th>
              <th className="text-left px-6 py-4 whitespace-nowrap">Nº Booking</th>
              <th className="text-left px-6 py-4">Deadline</th>
              <th className="text-center px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {processosFiltrados.map((p) => {
              // Calcular se o deadline está próximo (< 48h)
              let deadlineProximo = false;
              if (p.deadlineEmbarque) {
                const diffHoras = (new Date(p.deadlineEmbarque).getTime() - Date.now()) / (1000 * 3600);
                if (diffHoras >= 0 && diffHoras <= 48) deadlineProximo = true;
              }

              const mFin = p.metricasFinanceiras;
              const formatBRL = (v: number) =>
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

              const handleAbrirDrawer = () => {
                setDrawerProcesso({
                  id: p.id,
                  numeroProcesso: p.numeroProcesso,
                  clienteFinal: p.clienteFinal,
                  produto: p.produto,
                  volumeKg: Number(p.volumeKg),
                  incoterm: p.incoterm,
                  portoOrigem: p.portoOrigem,
                  portoDestino: p.portoDestino,
                  armador: p.armador,
                  navio: p.navio,
                  bookingNumero: p.bookingNumero,
                  deadlineEmbarque: p.deadlineEmbarque,
                  deadlineDraftBl: (p as any).deadlineDraftBl,
                  deadlineDraftVgm: (p as any).deadlineDraftVgm,
                  deadlineCarga: (p as any).deadlineCarga,
                  dataEstufagem: p.dataEstufagem,
                  redex: p.redex,
                  containerQtd: p.containerQtd,
                  containerTipo: p.containerTipo,
                  status: p.status,
                  valorTotalUsd: mFin?.valorTotalUsd || 0,
                  totalUsdTravado: mFin?.totalUsdTravado || 0,
                  saldoUsdParaTravar: mFin?.saldoUsdParaTravar || 0,
                  ptaxMedia: mFin?.ptaxMedia || 0,
                  receitaBrutaBRL: mFin?.receitaBrutaBRL || 0,
                  totalCustosBRL: mFin?.totalCustosBRL || 0,
                  resultadoOperacionalBRL: mFin?.resultadoOperacionalBRL || 0,
                  margemLucro: mFin?.margemLucro || 0,
                  statusRecebimento: mFin?.statusRecebimento,
                  bancoDestino: mFin?.bancoDestino,
                  containersTotal: p.containersTotal || p.containerQtd || 0,
                  containersPreenchidos: p.containersPreenchidos || 0,
                });
              };

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                    p.status === 'CANCELADO' ? 'bg-rose-500/5 dark:bg-rose-950/20' : 'bg-white dark:bg-slate-900'
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAbrirDrawer}
                        title="Abrir Prévia Rápida (Slide-over)"
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-orange-500 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/negociacoes/${p.id}`}
                        className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors flex items-center gap-1.5"
                      >
                        <span>{p.numeroProcesso}</span>
                        {deadlineProximo && (
                          <span
                            className="px-1.5 py-0.5 text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded"
                            title="Deadline de embarque nas próximas 48 horas!"
                          >
                            ⚠️ 48h
                          </span>
                        )}
                      </Link>
                    </div>
                  </td>

                  {/* Select de status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative inline-block">
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value, p.numeroProcesso)}
                        className={`pl-3 pr-6 py-1 rounded-full text-xs font-bold border uppercase tracking-wider outline-none cursor-pointer appearance-none ${getStatusColor(
                          p.status
                        )}`}
                      >
                        {STATUS_OPTIONS.filter((o) => o.value !== 'TODOS').map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center opacity-60">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <button
                      type="button"
                      onClick={handleAbrirDrawer}
                      className="text-left hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                    >
                      {p.clienteFinal}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    <div>{p.produto}</div>
                    {p.armador && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        Armador: {p.armador}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {p.bookingNumero || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                    {formatDateBR(p.deadlineEmbarque)}
                  </td>

                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleCancelar(p.id)}
                        title="Cancelar Negociação"
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {processosFiltrados.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900">
            Nenhuma negociação encontrada com os filtros selecionados.
          </div>
        )}
      </div>

      {/* DRAWER LATERAL SLIDE-OVER */}
      <ProcessoDrawer
        processo={drawerProcesso}
        onClose={() => setDrawerProcesso(null)}
      />
    </div>
  );
}
