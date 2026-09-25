'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  FileText, 
  Ship, 
  Container as ContainerIcon, 
  DollarSign, 
  Check, 
  RotateCcw, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building2,
  Anchor,
  Printer,
  Sparkles
} from 'lucide-react';
import { formatDateBR } from '@/lib/formatters';
import { marcarEtapaAction, marcarLoteEtapasAction, avancarMarcoStatusAction } from '@/server/actions/etapaActions';

export interface EtapaItem {
  id: string;
  status: string;
  fase: string;
  etapa: string;
}

export interface ProcessoResumo {
  id: string;
  numeroProcesso: string;
  clienteFinal: string;
  produto: string;
  incoterm?: string | null;
  portoOrigem?: string | null;
  portoDestino: string;
  status: string;
  volumeKg: number;
  bookingNumero?: string | null;
  navio?: string | null;
  armador?: string | null;
  localEstufagem?: string | null;
  containerQtd?: number | null;
  fumigacaoNecessaria?: boolean | null;
  fumigacaoTipo?: string | null;
  fumigacaoTempoHoras?: number | null;
  deadlineEmbarque?: string | Date | null;
  deadlineDraftBl?: string | Date | null;
  deadlineDraftVgm?: string | Date | null;
  deadlineCarga?: string | Date | null;
  precoUsd?: number | null;
  bancoDestino?: string | null;
  containersCount?: number;
  containersPreenchidosCount?: number;
  totalUsdTravado?: number;
  valorTotalUsd?: number;
}

interface TimelineEtapasManagerProps {
  processo: ProcessoResumo;
  etapas: EtapaItem[];
}

interface MarcoDef {
  id: number;
  chave: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  statusAssociado: string;
  fasesAssociadas: string[];
  icon: any;
  cor: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    ring: string;
  };
}

const MARCOS: MarcoDef[] = [
  {
    id: 1,
    chave: 'CONTRATO',
    numero: '1',
    titulo: 'Contrato',
    subtitulo: 'Fechamento Comercial & Dados do Comprador',
    statusAssociado: 'EM_NEGOCIACAO',
    fasesAssociadas: ['COMERCIAL', 'PRODUTOR_VENDEDOR', 'ADMINISTRATIVO'],
    icon: FileText,
    cor: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-700 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
      ring: 'ring-blue-500',
    },
  },
  {
    id: 2,
    chave: 'BOOKING',
    numero: '2',
    titulo: 'Booking & Industrialização',
    subtitulo: 'Reserva Marítima, Industrialização & Contratação de Transporte',
    statusAssociado: 'EM_EXECUCAO',
    fasesAssociadas: ['BOOKING_TRANSPORTE'],
    icon: Anchor,
    cor: {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      border: 'border-indigo-500/30',
      text: 'text-indigo-700 dark:text-indigo-400',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300',
      ring: 'ring-indigo-500',
    },
  },
  {
    id: 3,
    chave: 'ESTUFAGEM',
    numero: '3',
    titulo: 'Estufagem',
    subtitulo: 'Beneficiamento, Ensaque, REDEX & Contêineres',
    statusAssociado: 'EM_EXECUCAO',
    fasesAssociadas: ['INDUSTRIA_BENEFICIAMENTO', 'CARREGAMENTO', 'CARREGAMENTO_REDEX'],
    icon: ContainerIcon,
    cor: {
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      border: 'border-orange-500/30',
      text: 'text-orange-700 dark:text-orange-400',
      badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
      ring: 'ring-orange-500',
    },
  },
  {
    id: 4,
    chave: 'EMBARQUE',
    numero: '4',
    titulo: 'Embarque',
    subtitulo: 'Gate Terminal, Despacho Aduaneiro & A bordo',
    statusAssociado: 'EMBARCADO',
    fasesAssociadas: ['TERMINAL_PORTO'],
    icon: Ship,
    cor: {
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-700 dark:text-cyan-400',
      badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300',
      ring: 'ring-cyan-500',
    },
  },
  {
    id: 5,
    chave: 'CAMBIO',
    numero: '5',
    titulo: 'Documentação & Câmbio',
    subtitulo: 'BL Original, Certificados & Fechamento Bancário',
    statusAssociado: 'FINALIZADO',
    fasesAssociadas: ['DOCUMENTACAO_EXPORTACAO', 'FECHAMENTO_BANCARIO'],
    icon: DollarSign,
    cor: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
      ring: 'ring-emerald-500',
    },
  },
];

export function TimelineEtapasManager({ processo, etapas }: TimelineEtapasManagerProps) {
  const [isPending, startTransition] = useTransition();

  // 1. Determina qual é o marco ativo baseado nos dados reais da negociação
  let defaultMarcoIndex = 0;
  if (processo.status === 'EM_NEGOCIACAO' || processo.status === 'PENDENTE') {
    defaultMarcoIndex = 0;
  } else if (!processo.bookingNumero) {
    defaultMarcoIndex = 1;
  } else if (processo.status === 'EM_EXECUCAO') {
    // Se tem booking mas não embarcou, está em estufagem
    defaultMarcoIndex = 2;
  } else if (processo.status === 'EMBARCADO') {
    defaultMarcoIndex = 3;
  } else if (processo.status === 'FINALIZADO') {
    defaultMarcoIndex = 4;
  } else {
    defaultMarcoIndex = 2;
  }

  // Marco que o usuário está visualizando/interagindo no momento
  const [marcoVisualizadoIndex, setMarcoVisualizadoIndex] = useState<number>(defaultMarcoIndex);

  // Mapeamento das etapas por marco
  const marcoData = MARCOS.map((m, idx) => {
    const etapasDesteMarco = etapas.filter((e) => m.fasesAssociadas.includes(e.fase));
    const total = etapasDesteMarco.length;
    const concluidas = etapasDesteMarco.filter((e) => e.status === 'CONCLUIDA').length;
    const isCompleted = (total > 0 && concluidas === total) || idx < defaultMarcoIndex;
    const isCurrent = idx === defaultMarcoIndex;

    return {
      ...m,
      etapas: etapasDesteMarco,
      total,
      concluidas,
      isCompleted,
      isCurrent,
    };
  });

  const marcoAtual = marcoData[marcoVisualizadoIndex];
  const proximoMarco = marcoVisualizadoIndex < 4 ? marcoData[marcoVisualizadoIndex + 1] : null;

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO DO GERENCIADOR DE LINHA DO TEMPO */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white p-6 rounded-3xl shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#f58220] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                Linha do Tempo
              </span>
              <span className="text-slate-400 text-xs font-semibold">
                Ciclo Oficial em 5 Grandes Marcos
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{processo.numeroProcesso}</span>
              <span className="text-slate-500 font-normal">·</span>
              <span className="text-slate-300 font-bold text-lg sm:text-xl truncate max-w-md">
                {processo.clienteFinal}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Navegue pelos 5 marcos operacionais da exportação. Veja o que já foi concluído, o que está em andamento e defina a etapa atual com um clique.
            </p>
          </div>

          {/* BADGE DO MARCO ATUAL DA OPERAÇÃO */}
          <div className="flex items-center gap-3 bg-white/10 dark:bg-black/30 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 shrink-0 self-start md:self-auto">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-lg border border-orange-500/40">
              {defaultMarcoIndex + 1}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Etapa Atual na Empresa
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <strong className="text-sm font-black text-white">
                  {MARCOS[defaultMarcoIndex]?.titulo}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* RÉGUA VISUAL DOS 5 GRANDES MARCOS (IDENTICA AO DESIGN APROVADO, AGORA EXPANDIDA E INTERATIVA) */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {marcoData.map((m, idx) => {
              const isSelected = idx === marcoVisualizadoIndex;
              const Icon = m.icon;

              return (
                <button
                  key={m.chave}
                  type="button"
                  onClick={() => setMarcoVisualizadoIndex(idx)}
                  className={`text-left p-3.5 rounded-2xl border transition-all relative overflow-hidden group cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-850 text-slate-900 dark:text-white border-orange-500 ring-2 ring-orange-500/30 shadow-lg'
                      : m.isCurrent
                      ? 'bg-orange-500/20 text-white border-orange-500/50 hover:bg-orange-500/30'
                      : m.isCompleted
                      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black ${
                        isSelected 
                          ? 'bg-orange-500 text-white' 
                          : m.isCurrent 
                          ? 'bg-orange-500 text-white' 
                          : m.isCompleted 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-white/10 text-slate-400'
                      }`}>
                        {m.numero}
                      </span>
                      <span className="font-extrabold text-xs truncate">
                        {m.titulo}
                      </span>
                    </div>

                    {/* STATUS ICON */}
                    {m.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : m.isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                    )}
                  </div>

                  {/* CONTADOR DE TAREFAS */}
                  <div className="flex items-center justify-between text-[11px] opacity-80 mt-1">
                    <span>{m.concluidas}/{m.total} tarefas</span>
                    {m.isCompleted ? (
                      <span className="text-[10px] font-bold text-emerald-400">100%</span>
                    ) : m.isCurrent ? (
                      <span className="text-[10px] font-extrabold text-orange-400">ATIVO</span>
                    ) : null}
                  </div>

                  {/* LINHA INDICADORA INFERIOR */}
                  {isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f58220] to-orange-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PAINEL DE CONTROLE DO MARCO SELECIONADO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm p-6 space-y-6">
        
        {/* CABEÇALHO DO MARCO */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${marcoAtual.cor.bg} ${marcoAtual.cor.text} flex items-center justify-center font-black text-2xl border ${marcoAtual.cor.border} shrink-0`}>
              <marcoAtual.icon className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${marcoAtual.cor.badge}`}>
                  Marco {marcoAtual.numero} de 5
                </span>
                {marcoAtual.isCurrent && (
                  <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Etapa Atual da Operação
                  </span>
                )}
                {marcoAtual.isCompleted && (
                  <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Concluído
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                {marcoAtual.numero}. {marcoAtual.titulo}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {marcoAtual.subtitulo}
              </p>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO DO MARCO */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. DEFINIR COMO ETAPA ATUAL DA EMPRESA */}
            {!marcoAtual.isCurrent && (
              <form action={avancarMarcoStatusAction}>
                <input type="hidden" name="processoId" value={processo.id} />
                <input type="hidden" name="novoStatus" value={marcoAtual.statusAssociado} />
                <input type="hidden" name="nomeMarco" value={`${marcoAtual.numero}. ${marcoAtual.titulo}`} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Atualizar o status geral do processo para este marco"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Definir como Etapa Atual</span>
                </button>
              </form>
            )}

            {/* 2. CONCLUIR TODAS AS TAREFAS DESTE MARCO */}
            {marcoAtual.concluidas < marcoAtual.total && marcoAtual.total > 0 && (
              <form action={marcarLoteEtapasAction}>
                <input type="hidden" name="processoId" value={processo.id} />
                <input type="hidden" name="etapaIds" value={JSON.stringify(marcoAtual.etapas.map((e) => e.id))} />
                <input type="hidden" name="novoStatus" value="CONCLUIDA" />
                <input type="hidden" name="nomeMarco" value={`${marcoAtual.numero}. ${marcoAtual.titulo}`} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Conclui todas as tarefas deste marco de uma só vez"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Concluir Todas ({marcoAtual.total})</span>
                </button>
              </form>
            )}

            {/* 3. REABRIR TAREFAS */}
            {marcoAtual.concluidas === marcoAtual.total && marcoAtual.total > 0 && (
              <form action={marcarLoteEtapasAction}>
                <input type="hidden" name="processoId" value={processo.id} />
                <input type="hidden" name="etapaIds" value={JSON.stringify(marcoAtual.etapas.map((e) => e.id))} />
                <input type="hidden" name="novoStatus" value="PENDENTE" />
                <input type="hidden" name="nomeMarco" value={`${marcoAtual.numero}. ${marcoAtual.titulo}`} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Reabrir todas as tarefas deste marco"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reabrir Tarefas</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* CARDS COM AS INFORMAÇÕES ESPECÍFICAS DESTE MARCO (DADOS VITAIS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {marcoAtual.chave === 'CONTRATO' && (
            <>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Comprador Final</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5 truncate">
                  {processo.clienteFinal}
                </strong>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Produto: {processo.produto}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Volume & Incoterm</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {(processo.volumeKg / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} Toneladas
                </strong>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Incoterm: {processo.incoterm || 'FOB'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Rota Logística</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {processo.portoOrigem || 'Origem'} → {processo.portoDestino}
                </strong>
                <Link
                  href={`/negociacoes/${processo.id}/importador`}
                  className="text-[11px] text-orange-600 dark:text-orange-400 font-bold hover:underline mt-1 inline-flex items-center gap-1"
                >
                  Ver cadastro do Importador →
                </Link>
              </div>
            </>
          )}

          {marcoAtual.chave === 'BOOKING' && (
            <>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Armador & Navio</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {processo.armador || 'Armador não informado'}
                </strong>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Navio: {processo.navio || 'A designar'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Número do Booking</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {processo.bookingNumero || 'Aguardando Booking'}
                </strong>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Draft BL: {formatDateBR(processo.deadlineDraftBl)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Documento Oficial</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  Instrução de Embarque
                </strong>
                <Link
                  href={`/instrucao-embarque/${processo.id}`}
                  target="_blank"
                  className="text-[11px] text-orange-600 dark:text-orange-400 font-bold hover:underline mt-1 inline-flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> Abrir para Impressão →
                </Link>
              </div>
            </>
          )}

          {marcoAtual.chave === 'ESTUFAGEM' && (
            <>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Local de Estufagem</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5 truncate">
                  {processo.localEstufagem || 'Pátio REDEX'}
                </strong>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Contêineres: {processo.containerQtd || 0} unidades
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fumigação Requerida</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {processo.fumigacaoNecessaria ? `Sim (${processo.fumigacaoTipo || 'Brometo'})` : 'Não necessária'}
                </strong>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tempo: {processo.fumigacaoTempoHoras || 24} horas
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Lacre & Etiquetas</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {processo.containersPreenchidosCount || 0} de {processo.containersCount || 0} contêineres registrados
                </strong>
                <div className="flex items-center gap-3 mt-1">
                  <Link
                    href={`/negociacoes/${processo.id}/containers`}
                    className="text-[11px] text-orange-600 dark:text-orange-400 font-bold hover:underline"
                  >
                    Gerenciar Lacre/Tara →
                  </Link>
                  <Link
                    href={`/etiquetas/${processo.id}`}
                    target="_blank"
                    className="text-[11px] text-slate-500 dark:text-slate-400 font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    <Printer className="w-3 h-3" /> Etiquetas
                  </Link>
                </div>
              </div>
            </>
          )}

          {marcoAtual.chave === 'EMBARQUE' && (
            <>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Terminal Portuário</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {processo.portoOrigem || 'Porto de Santos'}
                </strong>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Navio: {processo.navio || 'Não informado'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Deadline de Carga (Gate)</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {formatDateBR(processo.deadlineCarga || processo.deadlineEmbarque)}
                </strong>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Prazo limite de entrada
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status Aduaneiro</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {processo.status === 'EMBARCADO' ? 'Carga Embarcada a Bordo' : 'Pronto para Gate / DU-E'}
                </strong>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Destino: {processo.portoDestino}
                </span>
              </div>
            </>
          )}

          {marcoAtual.chave === 'CAMBIO' && (
            <>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Preço Unitário</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  USD {processo.precoUsd?.toFixed(2) || '0.00'} / Ton
                </strong>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Banco: {processo.bancoDestino || 'BB BRASIL'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Trava Cambial (PTAX)</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  USD {(processo.totalUsdTravado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} travados
                </strong>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Valor Contrato: USD {(processo.valorTotalUsd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cockpit Financeiro</span>
                <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  DRE & Hedge Cambial
                </strong>
                <Link
                  href={`/negociacoes/${processo.id}/financeiro`}
                  className="text-[11px] text-orange-600 dark:text-orange-400 font-bold hover:underline mt-1 inline-flex items-center gap-1"
                >
                  <DollarSign className="w-3 h-3" /> Ver DRE do Processo →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* LISTA DE TAREFAS OPERACIONAIS DO MARCO */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Checklist de Tarefas deste Marco</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-[10px] font-bold">
                {marcoAtual.concluidas} de {marcoAtual.total} concluídas
              </span>
            </h4>
          </div>

          {marcoAtual.etapas.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <p className="text-sm text-slate-500">
                Nenhuma micro-etapa configurada para este marco. As ações principais podem ser gerenciadas pelos botões acima.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {marcoAtual.etapas.map((e) => {
                const isDone = e.status === 'CONCLUIDA';

                return (
                  <div
                    key={e.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-slate-500 dark:text-slate-400'
                        : 'bg-white dark:bg-slate-850/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <form action={marcarEtapaAction}>
                        <input type="hidden" name="etapaId" value={e.id} />
                        <input type="hidden" name="processoId" value={processo.id} />
                        <input type="hidden" name="novoStatus" value={isDone ? 'PENDENTE' : 'CONCLUIDA'} />
                        <button
                          type="submit"
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-orange-500'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      </form>

                      <span className={`text-xs sm:text-sm font-medium select-none ${
                        isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}>
                        {e.etapa}
                      </span>
                    </div>

                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                      isDone
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {isDone ? 'Concluída' : 'Pendente'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* NAVEGAÇÃO ENTRE MARCOS NO RODAPÉ */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          {marcoVisualizadoIndex > 0 ? (
            <button
              type="button"
              onClick={() => setMarcoVisualizadoIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ← Marco Anterior ({MARCOS[marcoVisualizadoIndex - 1]?.titulo})
            </button>
          ) : <div />}

          {proximoMarco && (
            <button
              type="button"
              onClick={() => setMarcoVisualizadoIndex(proximoMarco.id - 1)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Ver Próximo Marco: {proximoMarco.titulo}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
