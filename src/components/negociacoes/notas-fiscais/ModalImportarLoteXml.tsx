'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { 
  X, 
  Upload, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Layers, 
  FileCheck2, 
  Factory, 
  Warehouse, 
  Copy, 
  Check, 
  Info 
} from 'lucide-react';
import { 
  NFeXmlService, 
  processarArquivoXml, 
  formatarMoedaBRL, 
  formatarDataBR, 
  formatarCnpjOuCpf, 
  formatarChaveAcesso,
  type DadosNFeExtraidos 
} from '@/lib/nfeXmlService';

interface ModalImportarLoteXmlProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processoId: string;
  etapa1Notas: any[];
  etapaInicial?: 'ETAPA_1_ENTRADA_INDUSTRIA' | 'ETAPA_2_RETORNO_ARMAZENAGEM' | 'ETAPA_3_REMESSA_REDEX';
}

interface ItemLotePreview extends DadosNFeExtraidos {
  idTemp: string;
  selecionado: boolean;
  notaEntradaIdVinculada?: string;
}

export function ModalImportarLoteXml({
  isOpen,
  onClose,
  onSuccess,
  processoId,
  etapa1Notas,
  etapaInicial = 'ETAPA_1_ENTRADA_INDUSTRIA',
}: ModalImportarLoteXmlProps) {
  const [etapa, setEtapa] = useState<'ETAPA_1_ENTRADA_INDUSTRIA' | 'ETAPA_2_RETORNO_ARMAZENAGEM' | 'ETAPA_3_REMESSA_REDEX'>(etapaInicial);
  const [itens, setItens] = useState<ItemLotePreview[]>([]);
  const [processandoArquivos, setProcessandoArquivos] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [chaveCopiadaTempId, setChaveCopiadaTempId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Cópia rápida da Chave de Acesso de 44 dígitos da NF-e
  function copiarChave(idTemp: string, chave: string) {
    if (!chave) return;
    navigator.clipboard.writeText(chave);
    setChaveCopiadaTempId(idTemp);
    setTimeout(() => setChaveCopiadaTempId(null), 2500);
  }

  // Lógica de correspondência automática de notas de entrada para a Etapa 2
  function encontrarSugestaoEntrada(xmlData: DadosNFeExtraidos): string | undefined {
    if (etapa1Notas.length === 0) return undefined;

    const cnpjLimpoEmit = (xmlData.fornecedorCnpjLimpo || '').replace(/\D/g, '');
    const cnpjLimpoDest = (xmlData.destinatarioCnpj || '').replace(/\D/g, '');
    const emitenteNorm = (xmlData.fornecedorNome || '').toLowerCase();
    const destNorm = (xmlData.destinatarioNome || '').toLowerCase();

    // 1. Tentar por CNPJ
    for (const n1 of etapa1Notas) {
      const cnpj1Emit = (n1.emitenteCnpj || '').replace(/\D/g, '');
      const cnpj1Dest = (n1.destinatarioCnpj || '').replace(/\D/g, '');
      if (
        (cnpjLimpoEmit && cnpj1Emit && cnpjLimpoEmit === cnpj1Emit) ||
        (cnpjLimpoDest && cnpj1Emit && cnpjLimpoDest === cnpj1Emit) ||
        (cnpjLimpoEmit && cnpj1Dest && cnpjLimpoEmit === cnpj1Dest)
      ) {
        return n1.id;
      }
    }

    // 2. Tentar por nome similar
    for (const n1 of etapa1Notas) {
      const nome1Emit = (n1.emitente || '').toLowerCase();
      if (
        (emitenteNorm.length > 5 && nome1Emit.includes(emitenteNorm.substring(0, 10))) ||
        (destNorm.length > 5 && nome1Emit.includes(destNorm.substring(0, 10)))
      ) {
        return n1.id;
      }
    }

    // 3. Fallback: primeira nota da Etapa 1
    return etapa1Notas[0]?.id;
  }

  async function processarArquivosXml(files: FileList | File[]) {
    setProcessandoArquivos(true);
    setErro(null);

    const novosItens: ItemLotePreview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.xml')) continue;

      try {
        const parsed = await processarArquivoXml(file);
        const sugestao = etapa === 'ETAPA_2_RETORNO_ARMAZENAGEM' ? encontrarSugestaoEntrada(parsed) : undefined;

        novosItens.push({
          ...parsed,
          idTemp: `temp_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          selecionado: parsed.valida,
          notaEntradaIdVinculada: sugestao,
        });
      } catch (err: any) {
        console.error('Erro ao ler arquivo XML:', file.name, err);
      }
    }

    if (novosItens.length === 0) {
      setErro('Nenhum arquivo XML válido de NF-e foi identificado.');
    } else {
      setItens((prev) => [...prev, ...novosItens]);
    }

    setProcessandoArquivos(false);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processarArquivosXml(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processarArquivosXml(e.dataTransfer.files);
    }
  }

  function toggleSelecionado(idTemp: string) {
    setItens((atuais) =>
      atuais.map((it) => (it.idTemp === idTemp ? { ...it, selecionado: !it.selecionado } : it))
    );
  }

  function toggleTodosSelecionados() {
    const todosSelecionados = itens.every((it) => it.selecionado);
    setItens((atuais) => atuais.map((it) => ({ ...it, selecionado: !todosSelecionados })));
  }

  function removerItem(idTemp: string) {
    setItens((atuais) => atuais.filter((it) => it.idTemp !== idTemp));
  }

  function atualizarPesoLiquido(idTemp: string, novoPeso: number) {
    setItens((atuais) =>
      atuais.map((it) => (it.idTemp === idTemp ? { ...it, pesoLiquido: novoPeso } : it))
    );
  }

  function atualizarVinculoEtapa1(idTemp: string, notaEntradaId: string) {
    setItens((atuais) =>
      atuais.map((it) => (it.idTemp === idTemp ? { ...it, notaEntradaIdVinculada: notaEntradaId } : it))
    );
  }

  const itensSelecionados = itens.filter((it) => it.selecionado);
  const totalPesoLiquido = itensSelecionados.reduce((acc, it) => acc + (it.pesoLiquido || 0), 0);
  const totalValor = itensSelecionados.reduce((acc, it) => acc + (it.valorTotal || 0), 0);

  async function handleConfirmarImportacao() {
    if (itensSelecionados.length === 0) {
      setErro('Selecione pelo menos uma Nota Fiscal para importar.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      const payload = {
        etapa,
        notas: itensSelecionados.map((it) => ({
          numero: it.numero,
          serie: it.serie,
          chaveAcesso: it.chaveAcesso,
          dataEmissao: it.dataEmissao,
          emitente: it.fornecedorNome,
          emitenteCnpj: it.fornecedorCnpj,
          destinatario: it.destinatarioNome,
          destinatarioCnpj: it.destinatarioCnpj,
          cfop: it.cfop,
          pesoLiquido: it.pesoLiquido,
          pesoBruto: it.pesoBruto,
          quantidadeSacas: it.quantidadeVolumes,
          valorTotal: it.valorTotal,
          anexoNome: it.nomeArquivo,
          observacoes: it.observacoes,
          sugestaoNotaEntradaId: it.notaEntradaIdVinculada,
          referenciasEtapa1: it.notaEntradaIdVinculada
            ? [{ notaEntradaId: it.notaEntradaIdVinculada, pesoRetornadoKg: it.pesoLiquido }]
            : undefined,
        })),
      };

      const res = await fetch(`/api/negociacoes/${processoId}/notas-fiscais/lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao importar lote');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado na gravação do lote');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-7 max-h-[94vh] flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Importar Notas Fiscais via XML
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Anexe um ou múltiplos arquivos XML de NF-e para lançamento nas etapas da triangulação fiscal.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com rolagem */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Seletor de Etapa */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Selecione a Etapa para Lançamento do Lote:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'ETAPA_1_ENTRADA_INDUSTRIA', label: '1. Entrada Indústria', icon: Factory, desc: 'Remessas de produtores/fornecedores' },
                { id: 'ETAPA_2_RETORNO_ARMAZENAGEM', label: '2. Retorno Indústria', icon: Warehouse, desc: 'Notas de retorno com vínculo de entrada' },
                { id: 'ETAPA_3_REMESSA_REDEX', label: '3. Formação Lote REDEX', icon: Layers, desc: 'Abre saldo disponível em kg para estufagem' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = etapa === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setEtapa(item.id as any);
                      // Se mudar para Etapa 2 e já houver itens, recalcula sugestões
                      if (item.id === 'ETAPA_2_RETORNO_ARMAZENAGEM') {
                        setItens((atuais) =>
                          atuais.map((it) => ({
                            ...it,
                            notaEntradaIdVinculada: it.notaEntradaIdVinculada || encontrarSugestaoEntrada(it),
                          }))
                        );
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="font-medium leading-relaxed">{erro}</div>
            </div>
          )}

          {/* Área de Drag & Drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 bg-slate-50/50 dark:bg-slate-900/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xml,text/xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <FileCode className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Arraste e solte seus arquivos XML de NF-e aqui (individual ou em lote)
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Selecione um ou mais arquivos XML emitidos pela SEFAZ. O sistema extrairá automaticamente a chave de 44 dígitos,
              emitente, destinatário, pesos e valores.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processandoArquivos}
              className="mt-4 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 hover:bg-emerald-200/80 rounded-xl transition-all inline-flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              {processandoArquivos ? 'Lendo Arquivos...' : 'Selecionar Arquivo(s) XML'}
            </button>
          </div>

          {/* Resumo do Lote e Tabela de Pré-visualização */}
          {itens.length > 0 && (
            <div className="space-y-3">
              {/* Barra de Totais */}
              <div className="p-3.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500">Arquivos Parseados:</span>{' '}
                    <strong className="text-slate-900 dark:text-white font-mono">{itens.length}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Selecionadas p/ Gravar:</span>{' '}
                    <strong className="text-emerald-600 font-mono font-bold">{itensSelecionados.length}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono">
                  <div>
                    <span className="text-slate-500 font-sans">Peso Líquido Total:</span>{' '}
                    <strong className="text-slate-900 dark:text-white text-sm">
                      {totalPesoLiquido.toLocaleString('pt-BR')} kg
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans">Valor Total:</span>{' '}
                    <strong className="text-slate-900 dark:text-white text-sm">
                      {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Tabela de Revisão */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto no-scrollbar">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={itens.length > 0 && itens.every((it) => it.selecionado)}
                          onChange={toggleTodosSelecionados}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </th>
                      <th className="py-2.5 px-3">NF / Chave SEFAZ</th>
                      <th className="py-2.5 px-3">Data Emissão</th>
                      <th className="py-2.5 px-3">Fornecedor / CNPJ</th>
                      <th className="py-2.5 px-3 text-right">Valor Total R$</th>
                      <th className="py-2.5 px-3 text-right">Peso Líquido (kg)</th>
                      {etapa === 'ETAPA_2_RETORNO_ARMAZENAGEM' && (
                        <th className="py-2.5 px-3">NF Entrada Vinculada</th>
                      )}
                      <th className="py-2.5 px-3 text-center w-8">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {itens.map((it) => (
                      <tr
                        key={it.idTemp}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          !it.selecionado ? 'opacity-50 bg-slate-50/40 dark:bg-slate-900/40' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={it.selecionado}
                            onChange={() => toggleSelecionado(it.idTemp)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>

                        {/* 1. NF, Série e Chave de Acesso (44 dígitos) */}
                        <td className="py-2.5 px-3 font-mono">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>NF {it.numero}</span>
                            <span className="text-slate-400 font-normal text-[11px]">/ {it.serie}</span>
                            {it.alertas && it.alertas.length > 0 && (
                              <span
                                title={it.alertas.join('; ')}
                                className="inline-flex text-amber-500 cursor-help"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          {it.chaveAcesso ? (
                            <div className="flex items-center gap-1 mt-0.5" title={it.chaveAcessoFormatada || it.chaveAcesso}>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                ...{it.chaveAcesso.slice(-8)}
                              </span>
                              <button
                                type="button"
                                onClick={() => copiarChave(it.idTemp, it.chaveAcesso)}
                                className="p-0.5 text-slate-400 hover:text-emerald-600 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Copiar Chave de Acesso de 44 dígitos"
                              >
                                {chaveCopiadaTempId === it.idTemp ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-600 italic">Sem chave SEFAZ</span>
                          )}
                        </td>

                        {/* 2. Data de Emissão & CFOP */}
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {it.dataEmissaoFormatada || formatarDataBR(it.dataEmissao)}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">CFOP: {it.cfop || '5.901'}</div>
                        </td>

                        {/* 3. Fornecedor & CNPJ */}
                        <td className="py-2.5 px-3 max-w-[210px]">
                          <div className="truncate font-semibold text-slate-900 dark:text-slate-100" title={it.fornecedorNome}>
                            {it.fornecedorNome}
                          </div>
                          <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                            {it.fornecedorCnpj || 'CNPJ não informado'}
                          </div>
                        </td>

                        {/* 4. Valor Total da Nota */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          <span className={it.valorTotal > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}>
                            {it.valorTotalFormatado || formatarMoedaBRL(it.valorTotal)}
                          </span>
                        </td>

                        {/* 5. Peso Líquido (kg) */}
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="any"
                            value={it.pesoLiquido}
                            onChange={(e) => atualizarPesoLiquido(it.idTemp, parseFloat(e.target.value) || 0)}
                            className="w-24 text-xs font-mono font-bold text-right px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </td>

                        {/* Seletor de Vínculo na Etapa 2 */}
                        {etapa === 'ETAPA_2_RETORNO_ARMAZENAGEM' && (
                          <td className="py-2.5 px-3 min-w-[200px]">
                            {etapa1Notas.length === 0 ? (
                              <span className="text-amber-600 text-[11px] italic">Sem NFs na Etapa 1</span>
                            ) : (
                              <select
                                value={it.notaEntradaIdVinculada || ''}
                                onChange={(e) => atualizarVinculoEtapa1(it.idTemp, e.target.value)}
                                className="w-full text-[11px] px-2 py-1 rounded border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 font-medium"
                              >
                                <option value="">Sem vínculo</option>
                                {etapa1Notas.map((n1) => (
                                  <option key={n1.id} value={n1.id}>
                                    NF {n1.numero} ({Number(n1.pesoLiquido).toLocaleString('pt-BR')} kg - {n1.emitente})
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        )}

                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removerItem(it.idTemp)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Remover nota do lote"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {itens.length > 0 && (
              <span>
                Pronto para importar <strong>{itensSelecionados.length}</strong> de {itens.length} notas fiscais.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarImportacao}
              disabled={salvando || itensSelecionados.length === 0}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Gravando Lote...
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  Confirmar Importação do Lote ({itensSelecionados.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
