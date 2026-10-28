'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  Container, 
  Factory, 
  Warehouse, 
  Ship, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  ArrowRight,
  Clock,
  Sparkles,
  Upload
} from 'lucide-react';
import { ModalNovaNotaFiscal } from './ModalNovaNotaFiscal';
import { ModalDetalhesSefaz } from './ModalDetalhesSefaz';
import { ModalImportarLoteXml } from './ModalImportarLoteXml';

interface NotasFiscaisDashboardProps {
  processoId: string;
}

export function NotasFiscaisDashboard({ processoId }: NotasFiscaisDashboardProps) {
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtro de etapa ativa: 'todas' | 'etapa1' | 'etapa2' | 'etapa3' | 'etapa4'
  const [abaAtiva, setAbaAtiva] = useState<'todas' | 'etapa1' | 'etapa2' | 'etapa3' | 'etapa4'>('todas');

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [etapaParaNovaNota, setEtapaParaNovaNota] = useState<any>('ETAPA_1_ENTRADA_INDUSTRIA');
  const [notaSelecionadaSefaz, setNotaSelecionadaSefaz] = useState<any>(null);
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [etapaParaLote, setEtapaParaLote] = useState<'ETAPA_1_ENTRADA_INDUSTRIA' | 'ETAPA_2_RETORNO_ARMAZENAGEM' | 'ETAPA_3_REMESSA_REDEX'>('ETAPA_1_ENTRADA_INDUSTRIA');

  // Estados de ação
  const [sincronizandoSefaz, setSincronizandoSefaz] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [chaveCopiadaId, setChaveCopiadaId] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await fetch(`/api/negociacoes/${processoId}/notas-fiscais`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha ao carregar notas fiscais');
      }
      setDados(json.data);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [processoId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function abrirModalNova(etapa: 'ETAPA_1_ENTRADA_INDUSTRIA' | 'ETAPA_2_RETORNO_ARMAZENAGEM' | 'ETAPA_3_REMESSA_REDEX' | 'ETAPA_4_EXPORTACAO') {
    setEtapaParaNovaNota(etapa);
    setModalNovoAberto(true);
  }

  function abrirModalLoteXml(etapa: 'ETAPA_1_ENTRADA_INDUSTRIA' | 'ETAPA_2_RETORNO_ARMAZENAGEM' | 'ETAPA_3_REMESSA_REDEX') {
    setEtapaParaLote(etapa);
    setModalLoteAberto(true);
  }

  async function handleSincronizarTodasSefaz() {
    try {
      setSincronizandoSefaz(true);
      const res = await fetch(`/api/negociacoes/${processoId}/notas-fiscais/sefaz-consulta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sincronizarTodas: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha na sincronização com a SEFAZ');
      }
      setMensagemSucesso(json.message || 'Todas as NFs de exportação foram sincronizadas com a SEFAZ!');
      setTimeout(() => setMensagemSucesso(null), 4000);
      carregarDados();
    } catch (err: any) {
      alert(`Erro na sincronização: ${err.message}`);
    } finally {
      setSincronizandoSefaz(false);
    }
  }

  async function handleExcluirNota(nota: any) {
    let confirmMsg = `Tem certeza que deseja excluir a Nota Fiscal nº ${nota.numero}?`;
    if (nota.etapa === 'ETAPA_4_EXPORTACAO') {
      confirmMsg = `Atenção: Ao excluir a NF de Exportação nº ${nota.numero}, todo o peso que havia sido consumido será estornado automaticamente de volta para o saldo das respectivas NFs de Formação de Lote (Etapa 3). Deseja continuar?`;
    } else if (nota.etapa === 'ETAPA_3_REMESSA_REDEX') {
      confirmMsg = `Tem certeza que deseja excluir a NF de Formação de Lote REDEX nº ${nota.numero}? (Não será possível excluir caso já haja peso estufado em contêineres).`;
    }

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/negociacoes/${processoId}/notas-fiscais/${nota.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha ao excluir nota fiscal');
      }
      setMensagemSucesso(json.message || 'Nota Fiscal excluída com sucesso.');
      setTimeout(() => setMensagemSucesso(null), 4000);
      carregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function copiarChave(id: string, chave: string) {
    if (!chave) return;
    navigator.clipboard.writeText(chave);
    setChaveCopiadaId(id);
    setTimeout(() => setChaveCopiadaId(null), 2000);
  }

  if (loading && !dados) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Carregando módulo de Triangulação Fiscal...</p>
      </div>
    );
  }

  if (erro && !dados) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-red-800 dark:text-red-300 text-xs">
        <div className="font-bold mb-1">Erro ao carregar Notas Fiscais</div>
        <div>{erro}</div>
        <button
          onClick={carregarDados}
          className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const { resumo, etapas, processo } = dados || {};
  const { etapa1 = [], etapa2 = [], etapa3 = [], etapa4 = [] } = etapas || {};

  return (
    <div className="space-y-6">
      {/* Mensagem de Feedback Flutuante */}
      {mensagemSucesso && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{mensagemSucesso}</span>
          </div>
          <button onClick={() => setMensagemSucesso(null)} className="text-emerald-700 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {/* PAINEL DE RESUMO DA TRIANGULAÇÃO FISCAL (3 CARDS PRINCIPAIS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Indústria (Etapa 1 vs 2) */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Factory className="w-4 h-4 text-amber-500" />
              <span>1 & 2. Triangulação Indústria</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {resumo.percRetornado.toFixed(1)}% Retornado
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-500">1. Entrada Indústria:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {resumo.totalEntradaKg.toLocaleString('pt-BR')} kg
              </span>
            </div>
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-500">2. Retorno Indústria:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {resumo.totalRetornoKg.toLocaleString('pt-BR')} kg
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Saldo Pendente Retorno:</span>
              <span className={`font-mono ${resumo.saldoEntradaPendenteKg > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>
                {resumo.saldoEntradaPendenteKg.toLocaleString('pt-BR')} kg
              </span>
            </div>
          </div>

          {/* Barra de Progresso Retorno */}
          <div className="mt-3.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, resumo.percRetornado)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Armazém REDEX (Etapa 3 - Formação de Lote) */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Warehouse className="w-4 h-4 text-blue-500" />
              <span>3. Formação Lote REDEX</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold">
              {resumo.qtdRedexZeradas} zerada{resumo.qtdRedexZeradas !== 1 ? 's' : ''} / {resumo.qtdRedexAbertas} aberta{resumo.qtdRedexAbertas !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-500">Lote Emitido Total:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {resumo.totalRedexEmitidoKg.toLocaleString('pt-BR')} kg
              </span>
            </div>
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-500">Consumido em Estufagem:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {resumo.totalRedexConsumidoKg.toLocaleString('pt-BR')} kg
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Saldo Aberto p/ Estufar:</span>
              <span className={`font-mono font-bold ${resumo.totalRedexSaldoDisponivelKg > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                {resumo.totalRedexSaldoDisponivelKg.toLocaleString('pt-BR')} kg
              </span>
            </div>
          </div>

          {/* Barra de Progresso Consumo */}
          <div className="mt-3.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  resumo.totalRedexEmitidoKg > 0
                    ? Math.min(100, (resumo.totalRedexConsumidoKg / resumo.totalRedexEmitidoKg) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Card 3: Exportação & Averbação SEFAZ (Etapa 4) */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Ship className="w-4 h-4 text-emerald-500" />
              <span>4. Exportação & Averbação</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">
              {resumo.qtdExportacaoAverbada} Averbada{resumo.qtdExportacaoAverbada !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-500">Volume Exportado:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {resumo.totalExportacaoKg.toLocaleString('pt-BR')} kg
              </span>
            </div>
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-500">Contêineres com NF:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {resumo.containersComNf} de {resumo.totalContainers} contêineres
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Status Averbação SEFAZ:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {resumo.qtdExportacaoAverbada} averbada(s) / {resumo.qtdExportacaoPendenteAverbacao} pendente(s)
              </span>
            </div>
          </div>

          {/* Barra de Progresso Averbação */}
          <div className="mt-3.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  etapa4.length > 0 ? (resumo.qtdExportacaoAverbada / etapa4.length) * 100 : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* BARRA DE AÇÕES E NAVEGAÇÃO ENTRE ETAPAS JUSTIFICADA */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-2">
        {/* Filtro de Abas Sem Cortes */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'todas', label: 'Visão Geral', count: etapa1.length + etapa2.length + etapa3.length + etapa4.length },
            { id: 'etapa1', label: '1. Entrada Indústria', count: etapa1.length },
            { id: 'etapa2', label: '2. Retorno Armazenagem', count: etapa2.length },
            { id: 'etapa3', label: '3. Formação Lote REDEX', count: etapa3.length },
            { id: 'etapa4', label: '4. Exportação Contêiner', count: etapa4.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                abaAtiva === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                abaAtiva === tab.id
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Botões de Ação Direta Compactos */}
        <div className="flex items-center gap-1.5 shrink-0 justify-end flex-wrap sm:flex-nowrap">
          {/* Botão Sincronizar SEFAZ */}
          <button
            onClick={handleSincronizarTodasSefaz}
            disabled={sincronizandoSefaz || etapa4.length === 0}
            className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-40"
            title="Consulta em lote todas as NFs de exportação diretamente nos WebServices da SEFAZ"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${sincronizandoSefaz ? 'animate-spin' : ''}`} />
            <span>{sincronizandoSefaz ? 'Sincronizando...' : 'Sincronizar SEFAZ'}</span>
          </button>

          {/* Botão Importar XML (individual ou lote) */}
          <button
            onClick={() => abrirModalLoteXml(
              abaAtiva === 'etapa2' ? 'ETAPA_2_RETORNO_ARMAZENAGEM' :
              abaAtiva === 'etapa3' ? 'ETAPA_3_REMESSA_REDEX' :
              'ETAPA_1_ENTRADA_INDUSTRIA'
            )}
            className="h-8 px-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Importar e anexar NFs via arquivos XML da SEFAZ (individual ou em lote)"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Importar XML</span>
          </button>

          {/* Botão Nova Nota Fiscal */}
          <button
            onClick={() => abrirModalNova(
              abaAtiva === 'etapa2' ? 'ETAPA_2_RETORNO_ARMAZENAGEM' :
              abaAtiva === 'etapa3' ? 'ETAPA_3_REMESSA_REDEX' :
              abaAtiva === 'etapa4' ? 'ETAPA_4_EXPORTACAO' :
              'ETAPA_1_ENTRADA_INDUSTRIA'
            )}
            className="h-8 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Nota</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SEÇÃO: ETAPA 1 - ENTRADA PARA A INDÚSTRIA                            */}
      {/* ==================================================================== */}
      {(abaAtiva === 'todas' || abaAtiva === 'etapa1') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                <Factory className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Etapa 1 - NF Entrada para a Indústria
                </h3>
                <p className="text-xs text-slate-500">
                  Notas de remessa para beneficiamento e entrada da matéria-prima na indústria.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => abrirModalLoteXml('ETAPA_1_ENTRADA_INDUSTRIA')}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                title="Importar múltiplos XMLs de Entrada para a Indústria"
              >
                <Upload className="w-3 h-3 text-emerald-600" /> Importar XMLs
              </button>
              <button
                onClick={() => abrirModalNova('ETAPA_1_ENTRADA_INDUSTRIA')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Lançar Entrada
              </button>
            </div>
          </div>

          {etapa1.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Nenhuma Nota Fiscal de Entrada para a Indústria lançada.
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">NF / Série</th>
                    <th className="py-2.5 px-3">Data Emissão</th>
                    <th className="py-2.5 px-3">Emitente & Destinatário</th>
                    <th className="py-2.5 px-3">CFOP</th>
                    <th className="py-2.5 px-3">Chave de Acesso (44 dígitos)</th>
                    <th className="py-2.5 px-3 text-right">Peso Líquido</th>
                    <th className="py-2.5 px-3 text-right">Peso Bruto</th>
                    <th className="py-2.5 px-3 text-right">Valor Total R$</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  {etapa1.map((n: any) => (
                    <tr key={n.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {n.numero} <span className="text-slate-400 font-normal">/ {n.serie || '1'}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {new Date(n.dataEmissao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 max-w-[220px]">
                        <div className="truncate font-medium text-slate-800 dark:text-slate-200">{n.emitente}</div>
                        <div className="truncate text-[10px] text-slate-400">Para: {n.destinatario}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{n.cfop || '5.901'}</td>
                      <td className="py-2.5 px-3 font-mono">
                        {n.chaveAcesso ? (
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[130px] text-slate-600 dark:text-slate-400">
                              {n.chaveAcesso}
                            </span>
                            <button
                              onClick={() => copiarChave(n.id, n.chaveAcesso)}
                              className="text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Copiar chave completa"
                            >
                              {chaveCopiadaId === n.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {Number(n.pesoLiquido).toLocaleString('pt-BR')} kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {n.pesoBruto ? `${Number(n.pesoBruto).toLocaleString('pt-BR')} kg` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {n.valorTotal ? Number(n.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleExcluirNota(n)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Excluir Nota Fiscal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SEÇÃO: ETAPA 2 - RETORNO DE ARMAZENAGEM DA INDÚSTRIA                 */}
      {/* ==================================================================== */}
      {(abaAtiva === 'todas' || abaAtiva === 'etapa2') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                <Warehouse className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Etapa 2 - NF Retorno de Armazenagem da Indústria
                </h3>
                <p className="text-xs text-slate-500">
                  Notas fiscais de retorno emitidas pela indústria referenciando as entradas da Etapa 1.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => abrirModalLoteXml('ETAPA_2_RETORNO_ARMAZENAGEM')}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                title="Importar múltiplos XMLs de Retorno de Armazenagem"
              >
                <Upload className="w-3 h-3 text-amber-600" /> Importar XMLs
              </button>
              <button
                onClick={() => abrirModalNova('ETAPA_2_RETORNO_ARMAZENAGEM')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Lançar Retorno
              </button>
            </div>
          </div>

          {etapa2.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Nenhuma Nota Fiscal de Retorno de Armazenagem lançada.
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">NF / Série</th>
                    <th className="py-2.5 px-3">Data Emissão</th>
                    <th className="py-2.5 px-3">Emitente & Destinatário</th>
                    <th className="py-2.5 px-3">NFs Etapa 1 Referenciadas</th>
                    <th className="py-2.5 px-3 text-right">Peso Retornado</th>
                    <th className="py-2.5 px-3 text-right">Valor Total R$</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {etapa2.map((n: any) => (
                    <tr key={n.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {n.numero} <span className="text-slate-400 font-normal">/ {n.serie || '1'}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {new Date(n.dataEmissao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <div className="truncate font-medium text-slate-800 dark:text-slate-200">{n.emitente}</div>
                        <div className="truncate text-[10px] text-slate-400">Para: {n.destinatario}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {n.retornosComoOrigem && n.retornosComoOrigem.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {n.retornosComoOrigem.map((item: any) => (
                              <span
                                key={item.id}
                                className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[10px] font-mono font-semibold text-amber-800 dark:text-amber-300"
                              >
                                Ref. NF {item.notaEntrada?.numero || 'Entrada'}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Sem vínculo explícito</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {Number(n.pesoLiquido).toLocaleString('pt-BR')} kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {n.valorTotal ? Number(n.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleExcluirNota(n)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Excluir Nota Fiscal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SEÇÃO: ETAPA 3 - FORMAÇÃO DE LOTE NO ARMAZÉM REDEX                   */}
      {/* ==================================================================== */}
      {(abaAtiva === 'todas' || abaAtiva === 'etapa3') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                <Warehouse className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Etapa 3 - NF Formação de Lote no Armazém REDEX
                </h3>
                <p className="text-xs text-slate-500">
                  Remessa de formação de lote de exportação com controle de saldo aberto vs. abatido por contêiner.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => abrirModalLoteXml('ETAPA_3_REMESSA_REDEX')}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                title="Importar múltiplos XMLs de Formação de Lote REDEX"
              >
                <Upload className="w-3 h-3 text-blue-600" /> Importar XMLs
              </button>
              <button
                onClick={() => abrirModalNova('ETAPA_3_REMESSA_REDEX')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Lançar Lote REDEX
              </button>
            </div>
          </div>

          {etapa3.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Nenhuma Nota Fiscal de Formação de Lote REDEX lançada.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {etapa3.map((n: any) => {
                const pesoTotal = Number(n.pesoLiquido || 0);
                const saldoAtual = Number(n.saldoDisponivelKg ?? n.pesoLiquido ?? 0);
                const consumido = Math.max(0, pesoTotal - saldoAtual);
                const percConsumido = pesoTotal > 0 ? (consumido / pesoTotal) * 100 : 0;
                const zerado = n.saldoZerado || saldoAtual <= 0.001;

                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border transition-all ${
                      zerado
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-80'
                        : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/15 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                            NF nº {n.numero}
                          </span>
                          <span className="text-slate-400 text-xs">Série {n.serie || '1'}</span>
                          {zerado ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                              Saldo Zerado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] uppercase tracking-wider">
                              Saldo Aberto
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Emissão: {new Date(n.dataEmissao).toLocaleDateString('pt-BR')} · CFOP: {n.cfop || '5.501'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleExcluirNota(n)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Excluir NF"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Barra e Métricas de Saldo */}
                    <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="text-slate-500">Saldo Disponível p/ Estufar:</span>
                        <span className={`font-mono font-bold text-sm ${zerado ? 'text-slate-500' : 'text-blue-600 dark:text-blue-400'}`}>
                          {saldoAtual.toLocaleString('pt-BR')} kg
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline text-[11px] text-slate-500">
                        <span>Peso Original da Nota:</span>
                        <span className="font-mono">{pesoTotal.toLocaleString('pt-BR')} kg</span>
                      </div>
                      <div className="flex justify-between items-baseline text-[11px] text-slate-500">
                        <span>Já Consumido em Contêineres:</span>
                        <span className="font-mono">{consumido.toLocaleString('pt-BR')} kg ({percConsumido.toFixed(1)}%)</span>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${zerado ? 'bg-slate-400' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(100, percConsumido)}%` }}
                        />
                      </div>
                    </div>

                    {/* Contêineres que consumiram desta nota */}
                    {n.consumosEmExportacao && n.consumosEmExportacao.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                        <span className="text-slate-500 block mb-1 font-medium">Contêineres com baixa nesta NF:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {n.consumosEmExportacao.map((cItem: any) => (
                            <span
                              key={cItem.id}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px]"
                            >
                              Contêiner #{cItem.notaExportacao?.container?.ordem || '?'}:{' '}
                              <strong className="text-blue-600 dark:text-blue-400">
                                {Number(cItem.pesoConsumidoKg).toLocaleString('pt-BR')} kg
                              </strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SEÇÃO: ETAPA 4 - NF DE EXPORTAÇÃO VINCULADA POR CONTÊINER            */}
      {/* ==================================================================== */}
      {(abaAtiva === 'todas' || abaAtiva === 'etapa4') && (
        <div className="etapa-4-container bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0">
                <Ship className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white break-words">
                  Etapa 4 - NF de Exportação (Vinculada por Contêiner)
                </h3>
                <p className="text-xs text-slate-500 break-words mt-0.5">
                  Emissão vinculada à estufagem física real, referenciando de 1 a 3 NFs da Etapa 3 com monitoramento da SEFAZ & Averbação.
                </p>
              </div>
            </div>
            <button
              onClick={() => abrirModalNova('ETAPA_4_EXPORTACAO')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0 whitespace-nowrap self-start sm:self-center"
            >
              <Plus className="w-3.5 h-3.5" /> Lançar NF Exportação
            </button>
          </div>

          {etapa4.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Nenhuma Nota Fiscal de Exportação lançada para os contêineres desta negociação.
            </div>
          ) : (
            <div className="space-y-3 w-full">
              {etapa4.map((n: any) => {
                const isAverbada = n.statusAverbacao === 'AVERBADA';
                const isPendenteAverbacao = n.statusAverbacao === 'PENDENTE_AVERBACAO';

                return (
                  <div
                    key={n.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/40 transition-all shadow-xs w-full"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
                      {/* Lado Esquerdo: Dados da NF e Contêiner */}
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                            NF nº {n.numero}
                          </span>
                          <span className="text-slate-400 text-xs font-mono whitespace-nowrap">Série {n.serie || '1'}</span>

                          {/* Badge do Contêiner */}
                          <span className="px-2.5 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 font-bold text-xs flex items-center gap-1 break-words">
                            <Container className="w-3.5 h-3.5 shrink-0" />
                            <span>Contêiner #{n.container?.ordem || '?'} {n.container?.numeroContainer ? `(${n.container.numeroContainer})` : ''}</span>
                          </span>

                          {/* Status SEFAZ */}
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase whitespace-nowrap">
                            SEFAZ: {n.statusSefaz || 'AUTORIZADA'}
                          </span>

                          {/* Status Averbação */}
                          {isAverbada ? (
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-2xs whitespace-nowrap">
                              <ShieldCheck className="w-3 h-3 shrink-0" />
                              AVERBADA
                            </span>
                          ) : isPendenteAverbacao ? (
                            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                              <Clock className="w-3 h-3 animate-spin shrink-0" />
                              Pendente Averbação
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[10px] uppercase whitespace-nowrap">
                              Aguardando DUE
                            </span>
                          )}
                        </div>

                        {/* Metadados */}
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 break-words">
                          <span className="break-words">Emissão: <strong className="text-slate-700 dark:text-slate-300">{new Date(n.dataEmissao).toLocaleDateString('pt-BR')}</strong></span>
                          <span>·</span>
                          <span className="break-words">CFOP: <strong className="font-mono text-slate-700 dark:text-slate-300">{n.cfop || '7.101'}</strong></span>
                          <span>·</span>
                          <span className="break-words">DUE: <strong className="font-mono text-slate-800 dark:text-slate-200">{n.numeroDue || 'Em processamento'}</strong></span>
                          {n.dataAverbacao && (
                            <>
                              <span>·</span>
                              <span className="break-words">Data Averbação: <strong className="font-mono text-emerald-600">{new Date(n.dataAverbacao).toLocaleString('pt-BR')}</strong></span>
                            </>
                          )}
                        </div>

                        {/* Chave de Acesso */}
                        {n.chaveAcesso && (
                          <div className="flex items-center gap-2 pt-0.5 flex-wrap min-w-0">
                            <span className="text-[11px] text-slate-400 shrink-0">Chave SEFAZ:</span>
                            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold tracking-wider break-all">
                              {n.chaveAcesso}
                            </span>
                            <button
                              onClick={() => copiarChave(n.id, n.chaveAcesso)}
                              className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                              title="Copiar chave"
                            >
                              {chaveCopiadaId === n.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Lado Direito: Pesos, Origens REDEX e Ações */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-end gap-4 lg:gap-6 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                        {/* Origens REDEX (Até 3 NFs) */}
                        <div className="text-left sm:text-right min-w-0">
                          <span className="text-[10px] text-slate-400 block uppercase font-mono whitespace-nowrap">
                            Origem REDEX ({n.itensExportacao?.length || 0} de máx 3 NFs):
                          </span>
                          <div className="flex flex-wrap sm:justify-end gap-1 mt-1">
                            {n.itensExportacao && n.itensExportacao.length > 0 ? (
                              n.itensExportacao.map((it: any) => (
                                <span
                                  key={it.id}
                                  className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[10px] font-mono text-blue-900 dark:text-blue-300 font-semibold break-words"
                                >
                                  NF {it.notaLoteRedex?.numero || 'Lote'}:{' '}
                                  <span className="font-bold">{Number(it.pesoConsumidoKg).toLocaleString('pt-BR')} kg</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs italic">Nenhum lote vinculado</span>
                            )}
                          </div>
                        </div>

                        {/* Peso Líquido Total */}
                        <div className="text-left sm:text-right min-w-[120px] shrink-0">
                          <span className="text-[10px] text-slate-400 uppercase font-mono whitespace-nowrap">Peso Líquido Total:</span>
                          <div className="font-mono font-black text-sm text-slate-900 dark:text-white whitespace-nowrap">
                            {Number(n.pesoLiquido).toLocaleString('pt-BR')} kg
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setNotaSelecionadaSefaz(n)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                            title="Ver detalhes da transmissão SEFAZ / DUE"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Consultar SEFAZ</span>
                          </button>

                          <button
                            onClick={() => handleExcluirNota(n)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                            title="Excluir NF de exportação (estornará o saldo para o REDEX)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Nova Nota Fiscal */}
      <ModalNovaNotaFiscal
        isOpen={modalNovoAberto}
        onClose={() => setModalNovoAberto(false)}
        onSuccess={() => {
          setMensagemSucesso('Nota Fiscal registrada com sucesso no fluxo fiscal!');
          setTimeout(() => setMensagemSucesso(null), 4000);
          carregarDados();
        }}
        processoId={processoId}
        containers={processo?.containers || []}
        etapa1Notas={etapa1}
        etapa3Notas={etapa3}
        etapaInicial={etapaParaNovaNota}
      />

      {/* Modal Detalhes SEFAZ & Averbação */}
      <ModalDetalhesSefaz
        isOpen={Boolean(notaSelecionadaSefaz)}
        onClose={() => setNotaSelecionadaSefaz(null)}
        processoId={processoId}
        nota={notaSelecionadaSefaz}
        onUpdated={() => {
          carregarDados();
          setNotaSelecionadaSefaz(null);
        }}
      />

      {/* Modal Importar Lote XML (Etapas 1, 2 e 3) */}
      <ModalImportarLoteXml
        isOpen={modalLoteAberto}
        onClose={() => setModalLoteAberto(false)}
        onSuccess={() => {
          setMensagemSucesso('Lote de Notas Fiscais importado com sucesso!');
          setTimeout(() => setMensagemSucesso(null), 4000);
          carregarDados();
        }}
        processoId={processoId}
        etapa1Notas={etapa1}
        etapaInicial={etapaParaLote}
      />
    </div>
  );
}
