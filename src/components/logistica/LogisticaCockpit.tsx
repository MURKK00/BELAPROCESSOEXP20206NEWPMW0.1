'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Ship, 
  Anchor, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { formatDateBR, STATUS_NEGOCIACAO_MAP } from '@/lib/formatters';

interface LogisticaProcesso {
  id: string;
  numeroProcesso: string;
  clienteFinal: string;
  produto: string;
  volumeKg: number;
  incoterm?: string | null;
  portoOrigem?: string | null;
  portoDestino: string;
  armador?: string | null;
  navio?: string | null;
  bookingNumero?: string | null;
  deadlineEmbarque?: Date | string | null;
  dataEstufagem?: Date | string | null;
  redex?: string | null;
  containerQtd?: number | null;
  containerTipo?: string | null;
  freeTimeDestino?: string | null;
  status: string;
  containersCount: number;
  containersPreenchidos: number;
  etapas: {
    nome: string;
    status: string;
    ordem: number;
  }[];
}

interface LogisticaCockpitProps {
  processos: LogisticaProcesso[];
}

export function LogisticaCockpit({ processos }: LogisticaCockpitProps) {
  const [busca, setBusca] = useState('');
  const [filtroUrgencia, setFiltroUrgencia] = useState<'TODOS' | 'CRITICOS' | 'SEMANA' | 'EMBARCADOS'>('TODOS');
  const [filtroArmador, setFiltroArmador] = useState('TODOS');

  const armadoresUnicos = useMemo(() => {
    const list = Array.from(new Set(processos.map((p) => p.armador).filter(Boolean))) as string[];
    return list.sort();
  }, [processos]);

  // Processa dados e calcula prazos
  const processosComPrazos = useMemo(() => {
    const agora = Date.now();

    return processos.map((p) => {
      let diasRestantes: number | null = null;
      let horasRestantes: number | null = null;
      let nivelUrgencia: 'VENCIDO' | 'URGENTE' | 'ATENCAO' | 'NORMAL' | 'SEM_DATA' = 'SEM_DATA';

      if (p.deadlineEmbarque) {
        const msDeadline = new Date(p.deadlineEmbarque).getTime();
        const diffMs = msDeadline - agora;
        diasRestantes = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        horasRestantes = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffMs < 0) {
          nivelUrgencia = 'VENCIDO';
        } else if (diffMs <= 48 * 3600 * 1000) {
          nivelUrgencia = 'URGENTE'; // < 48h
        } else if (diffMs <= 7 * 24 * 3600 * 1000) {
          nivelUrgencia = 'ATENCAO'; // 3 a 7 dias
        } else {
          nivelUrgencia = 'NORMAL';
        }
      }

      // Estágio logístico aproximado
      const temBooking = Boolean(p.bookingNumero);
      const temContReais = p.containersPreenchidos > 0;
      const embarcado = p.status === 'EMBARCADO' || p.status === 'CONCLUIDO' || p.status === 'FINALIZADO';

      return {
        ...p,
        diasRestantes,
        horasRestantes,
        nivelUrgencia,
        temBooking,
        temContReais,
        embarcado,
      };
    });
  }, [processos]);

  // Contadores dos KPIs
  const kpis = useMemo(() => {
    const total = processosComPrazos.length;
    const criticos = processosComPrazos.filter((p) => p.nivelUrgencia === 'URGENTE' || p.nivelUrgencia === 'VENCIDO');
    const semana = processosComPrazos.filter((p) => p.nivelUrgencia === 'ATENCAO');
    const embarcados = processosComPrazos.filter((p) => p.embarcado);
    const pendentesBooking = processosComPrazos.filter((p) => !p.temBooking && !p.embarcado);

    return {
      total,
      criticos: criticos.length,
      semana: semana.length,
      embarcados: embarcados.length,
      pendentesBooking: pendentesBooking.length,
    };
  }, [processosComPrazos]);

  // Filtragem da lista
  const filtrados = useMemo(() => {
    return processosComPrazos.filter((p) => {
      if (filtroArmador !== 'TODOS' && p.armador !== filtroArmador) return false;

      if (filtroUrgencia === 'CRITICOS' && p.nivelUrgencia !== 'URGENTE' && p.nivelUrgencia !== 'VENCIDO') {
        return false;
      }
      if (filtroUrgencia === 'SEMANA' && p.nivelUrgencia !== 'ATENCAO') {
        return false;
      }
      if (filtroUrgencia === 'EMBARCADOS' && !p.embarcado) {
        return false;
      }

      if (busca.trim()) {
        const q = busca.toLowerCase();
        const num = p.numeroProcesso.toLowerCase();
        const navio = (p.navio || '').toLowerCase();
        const booking = (p.bookingNumero || '').toLowerCase();
        const armador = (p.armador || '').toLowerCase();
        const cliente = p.clienteFinal.toLowerCase();
        const redex = (p.redex || '').toLowerCase();

        if (
          !num.includes(q) &&
          !navio.includes(q) &&
          !booking.includes(q) &&
          !armador.includes(q) &&
          !cliente.includes(q) &&
          !redex.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [processosComPrazos, filtroArmador, filtroUrgencia, busca]);

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Ship className="w-7 h-7 text-[#f58220]" />
            <span>Radar de Logística & Deadlines de Embarque</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Controle operacional de bookings, navios, REDEX e contagem regressiva de prazos críticos.
          </p>
        </div>
      </div>

      {/* CARDS DE KPI LOGÍSTICO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Críticos */}
        <div 
          onClick={() => setFiltroUrgencia(filtroUrgencia === 'CRITICOS' ? 'TODOS' : 'CRITICOS')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filtroUrgencia === 'CRITICOS' 
              ? 'ring-2 ring-rose-500 bg-rose-50 border-rose-300' 
              : 'bg-white border-border hover:border-rose-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">🚨 Críticos (&lt; 48h / Vencidos)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700 mt-2">{kpis.criticos}</div>
          <span className="text-[11px] text-rose-600/80 font-medium">Exigem ação imediata</span>
        </div>

        {/* Próximos 7 dias */}
        <div 
          onClick={() => setFiltroUrgencia(filtroUrgencia === 'SEMANA' ? 'TODOS' : 'SEMANA')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filtroUrgencia === 'SEMANA' 
              ? 'ring-2 ring-amber-500 bg-amber-50 border-amber-300' 
              : 'bg-white border-border hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">📅 Próximos 7 Dias</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-2">{kpis.semana}</div>
          <span className="text-[11px] text-amber-700/80 font-medium">Deadlines nesta semana</span>
        </div>

        {/* Pendentes de Booking */}
        <div className="p-4 rounded-xl border bg-white border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">🎫 Sem Booking</span>
            <Layers className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-extrabold text-gray-800 mt-2">{kpis.pendentesBooking}</div>
          <span className="text-[11px] text-gray-500 font-medium">Aguardando confirmação</span>
        </div>

        {/* Já Embarcados */}
        <div 
          onClick={() => setFiltroUrgencia(filtroUrgencia === 'EMBARCADOS' ? 'TODOS' : 'EMBARCADOS')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filtroUrgencia === 'EMBARCADOS' 
              ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300' 
              : 'bg-white border-border hover:border-blue-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">🚢 Carga Embarcada</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-800 mt-2">{kpis.embarcados}</div>
          <span className="text-[11px] text-blue-600/80 font-medium">Em trânsito marítimo</span>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white border border-border rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por processo, navio, booking, armador, REDEX ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filtroArmador}
            onChange={(e) => setFiltroArmador(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white outline-none focus:border-secondary cursor-pointer"
          >
            <option value="TODOS">Todos os armadores</option>
            {armadoresUnicos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {filtroUrgencia !== 'TODOS' && (
            <button
              type="button"
              onClick={() => setFiltroUrgencia('TODOS')}
              className="text-xs text-secondary font-semibold hover:underline px-2"
            >
              Limpar filtro de urgência
            </button>
          )}
        </div>
      </div>

      {/* LISTAGEM DE PROCESSOS LOGÍSTICOS */}
      <div className="space-y-3">
        {filtrados.map((p) => {
          let badgeUrgencia = null;

          if (p.embarcado) {
            badgeUrgencia = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                <Ship className="w-3 h-3" />
                <span>Embarcado</span>
              </span>
            );
          } else if (p.nivelUrgencia === 'VENCIDO') {
            badgeUrgencia = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full text-xs font-extrabold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>DEADLINE VENCIDO</span>
              </span>
            );
          } else if (p.nivelUrgencia === 'URGENTE') {
            badgeUrgencia = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>Faltam {p.horasRestantes}h</span>
              </span>
            );
          } else if (p.nivelUrgencia === 'ATENCAO') {
            badgeUrgencia = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{p.diasRestantes} dias restantes</span>
              </span>
            );
          } else if (p.deadlineEmbarque) {
            badgeUrgencia = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                <Calendar className="w-3 h-3" />
                <span>{p.diasRestantes} dias</span>
              </span>
            );
          } else {
            badgeUrgencia = (
              <span className="px-2.5 py-1 bg-gray-50 text-gray-400 border border-gray-200 rounded-full text-xs font-medium">
                Sem deadline
              </span>
            );
          }

          return (
            <div
              key={p.id}
              className={`bg-white border rounded-xl p-5 shadow-2xs hover:shadow-md transition-all ${
                p.nivelUrgencia === 'VENCIDO'
                  ? 'border-red-300 bg-red-50/20'
                  : p.nivelUrgencia === 'URGENTE'
                  ? 'border-rose-200 bg-rose-50/10'
                  : 'border-border'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* LADO ESQUERDO: PROCESSO & CLIENTE */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Link
                      href={`/negociacoes/${p.id}`}
                      className="text-base font-extrabold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1"
                    >
                      <span>{p.numeroProcesso}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    {badgeUrgencia}
                    <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-gray-100 text-gray-600">
                      {STATUS_NEGOCIACAO_MAP[p.status] || p.status}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {(p.volumeKg / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t • {p.produto}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span>{p.clienteFinal}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500 font-normal text-xs">
                      {p.portoOrigem || 'Origem'} ➔ {p.portoDestino} ({p.incoterm || 'FOB'})
                    </span>
                  </div>
                </div>

                {/* CENTRO: INFOS MARÍTIMAS & LOGÍSTICAS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-xs">
                  {/* Armador & Navio */}
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Armador / Navio</span>
                    <strong className="text-gray-800 block truncate">{p.armador || '-'}</strong>
                    <span className="text-gray-500 truncate block">{p.navio || 'A definir'}</span>
                  </div>

                  {/* Booking */}
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Nº Booking</span>
                    <strong className={p.bookingNumero ? 'text-gray-800' : 'text-amber-600'}>
                      {p.bookingNumero || 'Pendente'}
                    </strong>
                    <span className="text-gray-500 block">
                      {p.freeTimeDestino ? `FT: ${p.freeTimeDestino}` : 'Sem free-time'}
                    </span>
                  </div>

                  {/* REDEX & Estufagem */}
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Terminal / REDEX</span>
                    <strong className="text-gray-800 block truncate">{p.redex || 'Não informado'}</strong>
                    <span className="text-gray-500 block">
                      {p.dataEstufagem ? formatDateBR(p.dataEstufagem ?? null) : 'Sem data estuf.'}
                    </span>
                  </div>

                  {/* Contêineres */}
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Contêineres</span>
                    <strong className="text-gray-800 block">
                      {p.containerQtd ? `${p.containerQtd}x ${p.containerTipo || "20' DRY"}` : '-'}
                    </strong>
                    <span className="text-gray-500 block">
                      {p.containersPreenchidos}/{p.containerQtd || 0} preenchidos
                    </span>
                  </div>
                </div>

                {/* LADO DIREITO: DEADLINE & ATALHO */}
                <div className="flex sm:flex-col justify-between sm:justify-center items-end gap-1.5 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Deadline Carga</span>
                    <span className="text-sm font-extrabold text-gray-900">
                      {formatDateBR(p.deadlineEmbarque ?? null)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/negociacoes/${p.id}`}
                      className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
                    >
                      <span>Abrir</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <div className="bg-white border border-border rounded-xl p-12 text-center text-gray-400 text-sm">
            Nenhum processo logístico localizado para os filtros informados.
          </div>
        )}
      </div>
    </div>
  );
}
