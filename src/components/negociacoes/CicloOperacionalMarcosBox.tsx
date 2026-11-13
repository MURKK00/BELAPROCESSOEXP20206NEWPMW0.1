'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Layers, 
  Ship, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  ExternalLink, 
  CheckSquare, 
  Sparkles,
  ArrowRight,
  FileText,
  Container,
  Receipt,
  RotateCcw,
  Plus,
  Minus,
  Star,
  Loader2
} from 'lucide-react';
import { formatDateBR } from '@/lib/formatters';
import {
  marcarEtapaAction,
  marcarLoteEtapasAction,
  avancarMarcoStatusAction,
  gerarChecklistProcessoAction,
} from '@/server/actions/etapaActions';
import { avaliarResponsividadeEtapa } from '@/lib/checklistResponsivo';

export interface CicloOperacionalMarcosBoxProps {
  processo: any;
  etapas: Array<{
    id: string;
    status: string;
    fase: string;
    etapa: string;
  }>;
  podeGerarChecklist?: boolean;
}

interface MacroEtapaDef {
  num: string;
  id: number;
  chave: string;
  label: string;
  tituloCurto: string;
  descricao: string;
  statusAssociado: string;
  identificador: (etapaNome: string, fase: string) => boolean;
}

const MACRO_ETAPAS: MacroEtapaDef[] = [
  {
    num: '01',
    id: 1,
    chave: 'NEGOCIACAO',
    label: 'Etapa 1: Negociação',
    tituloCurto: 'Negociação',
    descricao: 'Preenchimento de Importador, Rastreabilidade, E-mail Nomeação e Emissão Booking',
    statusAssociado: 'EM_NEGOCIACAO',
    identificador: (nome, fase) => {
      const n = nome.toLowerCase();
      return n.includes('importador') || n.includes('rastreabilidade') || n.includes('nomeação') || n.includes('nomeacao') || n.includes('booking') || fase === 'COMERCIAL';
    },
  },
  {
    num: '02',
    id: 2,
    chave: 'ESTUFAGEM',
    label: 'Etapa 2: Estufagem',
    tituloCurto: 'Estufagem',
    descricao: 'Transportadora, NF #1 Formação Lote, REDEX, Etiquetagem, Fumigação, Contêineres, MAPA e Drafts',
    statusAssociado: 'EM_EXECUCAO',
    identificador: (nome, fase) => {
      const n = nome.toLowerCase();
      return (
        n.includes('transportadora') ||
        n.includes('notas fiscais #1') ||
        n.includes('estufagem') ||
        n.includes('etiquetagem') ||
        n.includes('fumigação') ||
        n.includes('fumigacao') ||
        n.includes('contêiner') ||
        n.includes('conteiner') ||
        n.includes('mapa') ||
        n.includes('draft') ||
        fase === 'CARREGAMENTO_REDEX' ||
        fase === 'BOOKING_TRANSPORTE'
      ) && !n.includes('retorno') && !n.includes('#2') && !n.includes('#3') && !n.includes('booking****');
    },
  },
  {
    num: '04',
    id: 3,
    chave: 'EMBARQUE',
    label: 'Etapa 4: Embarque',
    tituloCurto: 'Embarque',
    descricao: 'Emissão de Notas Fiscais #2 Retorno de Lote e NF #3 Exportação (DU-E)',
    statusAssociado: 'EMBARCADO',
    identificador: (nome, fase) => {
      const n = nome.toLowerCase();
      return n.includes('notas fiscais #2') || n.includes('notas fiscais #3') || n.includes('retorno lote') || n.includes('exportação (du-e)') || fase === 'TERMINAL_PORTO';
    },
  },
  {
    num: '05',
    id: 4,
    chave: 'DOCUMENTACAO',
    label: 'Etapa 5: Documentação Aprovadas',
    tituloCurto: 'Documentação Aprovada',
    descricao: '12 Documentos de Exportação (DU-E, BL, Invoice, Packing List, CO, Weight, Quality, etc.) e Câmbio',
    statusAssociado: 'FINALIZADO',
    identificador: (nome, fase) => {
      const n = nome.toLowerCase();
      return (
        n.includes('***') ||
        n.includes('bl original') ||
        n.includes('invoice') ||
        n.includes('packing list') ||
        n.includes('certificate') ||
        n.includes('stuffing') ||
        n.includes('câmbio') ||
        n.includes('cambio') ||
        fase === 'DOCUMENTACAO_EXPORTACAO' ||
        fase === 'FECHAMENTO_BANCARIO'
      ) && !n.includes('#3');
    },
  },
];

export function CicloOperacionalMarcosBox({
  processo,
  etapas,
  podeGerarChecklist = false,
}: CicloOperacionalMarcosBoxProps) {
  const [painelAberto, setPainelAberto] = useState(false);
  const [gerandoChecklist, setGerandoChecklist] = useState(false);
  const [erroChecklist, setErroChecklist] = useState<string | null>(null);

  // Calcula quais tarefas pertencem a qual macro-etapa
  const marcosComTarefas = MACRO_ETAPAS.map((m) => {
    const tarefas = etapas.filter((e) => m.identificador(e.etapa, e.fase));
    
    // Adiciona avaliação de responsividade para cada tarefa
    const tarefasComResponsividade = tarefas.map((t) => {
      const resp = avaliarResponsividadeEtapa(t.etapa, processo);
      const isConcluida = t.status === 'CONCLUIDA' || resp.concluidaAutomaticamente;
      return {
        ...t,
        isConcluida,
        responsividade: resp,
      };
    });

    const total = tarefasComResponsividade.length;
    const concluidas = tarefasComResponsividade.filter((t) => t.isConcluida).length;
    const isTodasConcluidas = total > 0 && concluidas === total;

    return {
      ...m,
      tarefas: tarefasComResponsividade,
      total,
      concluidas,
      isTodasConcluidas,
    };
  });

  const router = useRouter();

  // Determina a etapa ativa no momento
  const etapaPendenteIndex = marcosComTarefas.findIndex((m) => !m.isTodasConcluidas);
  const etapaAtivaIdx = etapaPendenteIndex === -1 ? marcosComTarefas.length - 1 : etapaPendenteIndex;

  const [etapaSelecionadaIdx, setEtapaSelecionadaIdx] = useState<number>(etapaAtivaIdx);
  const etapaSelecionada = marcosComTarefas[etapaSelecionadaIdx] || marcosComTarefas[0];

  // Estado local do status da negociação para refletir a estrela imediatamente
  const [statusAtivo, setStatusAtivo] = useState<string>(() => {
    if (processo.status && processo.status !== 'PENDENTE') return processo.status;
    return 'EM_NEGOCIACAO';
  });

  const [salvandoMarco, setSalvandoMarco] = useState(false);

  useEffect(() => {
    if (processo.status) {
      setStatusAtivo(processo.status === 'PENDENTE' ? 'EM_NEGOCIACAO' : processo.status);
    }
  }, [processo.status]);

  const handleMarcarMarcoAtivo = async (idx: number, macro: MacroEtapaDef) => {
    setEtapaSelecionadaIdx(idx);
    setStatusAtivo(macro.statusAssociado);
    setSalvandoMarco(true);

    try {
      const fd = new FormData();
      fd.append('processoId', processo.id);
      fd.append('novoStatus', macro.statusAssociado);
      fd.append('nomeMarco', macro.tituloCurto);
      await avancarMarcoStatusAction(fd);
      router.refresh();
    } catch (err) {
      console.error('Erro ao atualizar marco operacional:', err);
    } finally {
      setSalvandoMarco(false);
    }
  };

  const handleGerarChecklist = async () => {
    setErroChecklist(null);
    setGerandoChecklist(true);
    try {
      const res = await gerarChecklistProcessoAction(processo.id);
      if (res?.error) {
        setErroChecklist(res.error);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setErroChecklist(err?.message || 'Erro ao gerar checklist desta negociação.');
    } finally {
      setGerandoChecklist(false);
    }
  };

  // Cálculo da tríade de deadlines para a linha inferior
  const deadlinesArr = [
    { label: 'Draft BL', data: processo.deadlineDraftBl },
    { label: 'Draft VGM', data: processo.deadlineDraftVgm },
    { label: 'Draft Carga', data: processo.deadlineCarga || processo.deadlineEmbarque },
  ]
    .filter((d) => Boolean(d.data))
    .map((d) => {
      const diffMs = new Date(d.data!).getTime() - Date.now();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      return { ...d, diffHours };
    })
    .sort((a, b) => a.diffHours - b.diffHours);

  const maisUrgente = deadlinesArr[0] ?? null;
  const deadlineCritico = maisUrgente && maisUrgente.diffHours <= 24 && maisUrgente.diffHours >= 0;
  const deadlineVencido = maisUrgente && maisUrgente.diffHours < 0;

  const isEmbarcadoOuFinalizado =
    processo.status === 'EMBARCADO' || processo.status === 'FINALIZADO' || processo.status === 'CONCLUIDO';
  const isFinalizado = processo.status === 'FINALIZADO' || processo.status === 'CONCLUIDO';

  // Total geral de etapas
  const totalGeral = etapas.length;
  const concluidasGeral = marcosComTarefas.reduce((acc, m) => acc + m.concluidas, 0);
  const percGeral = totalGeral > 0 ? Math.round((concluidasGeral / totalGeral) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm p-4 sm:p-6 mb-6 transition-all">
      {/* 1. CABEÇALHO DO BOX: CICLO OPERACIONAL & MARCOS COM PROCESSO RESUMIDO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">PEX GED</span>
                <span className="text-slate-300 dark:text-slate-600 font-light">•</span>
                <span>Ciclo Operacional &amp; Checklist</span>
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                {concluidasGeral} de {totalGeral} Concluídas ({percGeral}%)
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Navegue entre as 4 etapas operacionais e marque o checklist responsivo em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* 2. OS 4 GRANDES MARCOS EM CARDS SELECIONÁVEIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
        {marcosComTarefas.map((m, idx) => {
          const isSelected = idx === etapaSelecionadaIdx;
          const isDone = m.isTodasConcluidas;
          const isCurrentActive = idx === etapaAtivaIdx;
          const isPainelAbertoNestaEtapa = isSelected && painelAberto;
          const isMarcoAtivo = statusAtivo === m.statusAssociado || (m.chave === 'NEGOCIACAO' && (statusAtivo === 'PENDENTE' || statusAtivo === 'EM_NEGOCIACAO' || !statusAtivo));

          return (
            <div
              key={m.chave}
              role="button"
              tabIndex={0}
              onClick={() => {
                // Seleciona a etapa; mantém recolhido ou no estado atual
                setEtapaSelecionadaIdx(idx);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEtapaSelecionadaIdx(idx);
                }
              }}
              className={`text-left relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? 'ring-2 ring-[#f58220] bg-orange-50/80 dark:bg-orange-950/30 border-orange-400 dark:border-orange-600 shadow-sm'
                  : isDone
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/70 dark:border-emerald-800/60 hover:border-emerald-400'
                  : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-mono font-black ${
                  isDone 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : isSelected 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-slate-400'
                }`}>
                  {m.num}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    isDone
                      ? 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      : isSelected
                      ? 'bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {m.concluidas}/{m.total}
                  </span>

                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : isCurrentActive ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                  )}

                  {/* SÍMBOLO DE ESTRELA PARA MARCAR/SINALIZAR EM QUAL ETAPA ESTÁ A NEGOCIAÇÃO */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarcarMarcoAtivo(idx, m);
                    }}
                    title={
                      isMarcoAtivo
                        ? `Etapa atual da negociação: ${m.tituloCurto} (Sinalizada com estrela)`
                        : `Marcar ${m.tituloCurto} como a etapa atual da negociação`
                    }
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isMarcoAtivo
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-500 border border-amber-300 dark:border-amber-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-700 hover:text-amber-400 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/30'
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 transition-all ${
                        isMarcoAtivo
                          ? 'fill-amber-400 text-amber-500 scale-110 drop-shadow-xs'
                          : 'stroke-[2]'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div>
                <h3 className={`text-sm font-bold truncate ${
                  isSelected 
                    ? 'text-orange-950 dark:text-orange-200' 
                    : isDone 
                    ? 'text-emerald-950 dark:text-emerald-200' 
                    : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {m.tituloCurto}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {m.label}
                </p>
              </div>

              {/* RODAPÉ DO BOX COM ATALHO EXPANDIR/RECOLHER */}
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 text-[10px]">
                <span className="text-slate-400 font-medium">
                  {m.concluidas === m.total ? 'Etapa concluída' : `${m.total - m.concluidas} pendente(s)`}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSelected) {
                      setPainelAberto(!painelAberto);
                    } else {
                      setEtapaSelecionadaIdx(idx);
                      setPainelAberto(true);
                    }
                  }}
                  className="font-bold flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:text-orange-700 transition-colors cursor-pointer"
                >
                  <span>{isPainelAbertoNestaEtapa ? 'Recolher -' : 'Expandir +'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. PAINEL INTERATIVO DO CHECKLIST DA ETAPA SELECIONADA */}
      {painelAberto && (
        <div className="bg-slate-50/70 dark:bg-slate-850/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 mb-4 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-slate-200/60 dark:border-slate-750">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                  {etapaSelecionada.num}
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {etapaSelecionada.label}
                </h3>
                <span className="text-xs font-semibold text-slate-400">
                  ({etapaSelecionada.concluidas} de {etapaSelecionada.total} tarefas finalizadas)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {etapaSelecionada.descricao}
              </p>
            </div>

            {/* AÇÕES DE LOTE E DEFINIÇÃO DE STATUS */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleMarcarMarcoAtivo(etapaSelecionadaIdx, etapaSelecionada)}
                title="Atualizar o status global da negociação para esta etapa"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                  statusAtivo === etapaSelecionada.statusAssociado
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${statusAtivo === etapaSelecionada.statusAssociado ? 'fill-white text-white' : 'text-amber-500 fill-amber-500'}`} />
                <span>{statusAtivo === etapaSelecionada.statusAssociado ? 'Ciclo Ativo (Sinalizado)' : 'Definir como Ciclo Ativo'}</span>
              </button>

              {etapaSelecionada.tarefas.length > 0 && (
                <form action={marcarLoteEtapasAction}>
                  <input type="hidden" name="processoId" value={processo.id} />
                  <input
                    type="hidden"
                    name="etapaIds"
                    value={JSON.stringify(etapaSelecionada.tarefas.map((t) => t.id))}
                  />
                  <input
                    type="hidden"
                    name="novoStatus"
                    value={etapaSelecionada.isTodasConcluidas ? 'PENDENTE' : 'CONCLUIDA'}
                  />
                  <input type="hidden" name="nomeMarco" value={etapaSelecionada.tituloCurto} />
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      etapaSelecionada.isTodasConcluidas
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{etapaSelecionada.isTodasConcluidas ? 'Reabrir Todas' : 'Concluir Todas'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* LISTA DAS TAREFAS DA ETAPA */}
          <div className="space-y-2">
            {erroChecklist && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{erroChecklist}</span>
              </div>
            )}
            {etapaSelecionada.tarefas.length === 0 ? (
              <div className="p-5 text-center rounded-xl bg-white dark:bg-slate-800/70 border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Nenhuma tarefa gerada para esta etapa.
                </p>
                {podeGerarChecklist && (
                  <button
                    type="button"
                    onClick={handleGerarChecklist}
                    disabled={gerandoChecklist}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f58220] hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                  >
                    {gerandoChecklist ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Gerando checklist...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gerar checklist desta negociação</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              etapaSelecionada.tarefas.map((tarefa) => {
                const isDone = tarefa.isConcluida;
                const resp = tarefa.responsividade;

                return (
                  <div
                    key={tarefa.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all gap-2.5 ${
                      isDone
                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-slate-600 dark:text-slate-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-900 dark:text-white'
                    }`}
                  >
                    {/* CHECKBOX E NOME DA TAREFA */}
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <form action={marcarEtapaAction}>
                        <input type="hidden" name="etapaId" value={tarefa.id} />
                        <input type="hidden" name="processoId" value={processo.id} />
                        <input
                          type="hidden"
                          name="novoStatus"
                          value={isDone ? 'PENDENTE' : 'CONCLUIDA'}
                        />
                        <button
                          type="submit"
                          title={isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-750 hover:border-orange-500'
                          }`}
                        >
                          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      </form>

                      <div className="truncate">
                        <span
                          className={`text-xs sm:text-sm font-semibold select-none ${
                            isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {tarefa.etapa}
                        </span>
                      </div>
                    </div>

                    {/* VÍNCULOS RESPONSIVOS E ATALHOS PARA AS ABAS */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                      {resp.concluidaAutomaticamente ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{resp.motivo}</span>
                        </span>
                      ) : resp.motivo && resp.tipo !== 'MANUAL' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold text-[10px] border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{resp.motivo}</span>
                        </span>
                      ) : null}

                      {/* ATALHO PARA A ABA CORRESPONDENTE SE EXISTIR */}
                      {resp.linkAba && (
                        <Link
                          href={resp.linkAba}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition-colors cursor-pointer"
                          title={`Ir para a aba para preencher ou visualizar`}
                        >
                          <span>{resp.linkTexto || 'Acessar Aba'}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. LINHA INFERIOR: RESUMO LOGÍSTICO & ALERTA DE DEADLINE MAIS URGENTE */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Ship className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-400">Navio:</span>
            <strong className="text-slate-900 dark:text-white font-semibold">
              {processo.navio || 'A definir'}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="text-slate-400">Booking:</span>
            <strong className="text-slate-900 dark:text-white font-mono font-semibold">
              {processo.bookingNumero || 'Pendente'}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-400">Checklist Geral:</span>
            <strong className="text-slate-900 dark:text-white font-semibold">
              {concluidasGeral}/{totalGeral} ({percGeral}%)
            </strong>
          </div>
        </div>

        {/* ALERTA DO PRÓXIMO DEADLINE */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-slate-400">
            {maisUrgente ? `Próximo Prazo (${maisUrgente.label}):` : 'Deadline de Carga:'}
          </span>
          <span className="font-bold text-slate-900 dark:text-white font-mono">
            {formatDateBR(maisUrgente ? maisUrgente.data : processo.deadlineEmbarque)}
          </span>

          {isEmbarcadoOuFinalizado ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Embarcado
            </span>
          ) : deadlineVencido && maisUrgente ? (
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px] flex items-center gap-1 border border-rose-200 dark:border-rose-800 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-600" /> Atrasado
            </span>
          ) : deadlineCritico && maisUrgente ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1 border border-amber-200 dark:border-amber-800">
              <Clock className="w-3 h-3 text-amber-600" /> Faltam {maisUrgente.diffHours}h
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
