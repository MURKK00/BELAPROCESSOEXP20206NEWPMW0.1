'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Container,
  FileText,
  Scale,
} from 'lucide-react';
import { parseNumeroBR, formatNumeroBR, sanitizarInputNumeroBR } from '@/lib/numeroBR';
import {
  formatarCfop,
  obterCfopsPermitidos,
  obterRotuloEtapa,
  validarCfopEtapa,
  type EtapaNotaFiscalKey,
} from '@/lib/cfopPorEtapa';

interface ModalNovaNotaFiscalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processoId: string;
  containers: Array<{ id: string; ordem: number; numeroContainer?: string | null; pesoLiquido?: number | null }>;
  etapa1Notas: any[];
  etapa3Notas: any[];
  etapaInicial?: EtapaNotaFiscalKey;
}

export function ModalNovaNotaFiscal({
  isOpen,
  onClose,
  onSuccess,
  processoId,
  containers,
  etapa1Notas,
  etapa3Notas,
  etapaInicial = 'ETAPA_1_ENTRADA_INDUSTRIA',
}: ModalNovaNotaFiscalProps) {
  const [etapa, setEtapa] = useState<string>(etapaInicial);
  const [numero, setNumero] = useState('');
  const [serie, setSerie] = useState('1');
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [emitente, setEmitente] = useState('Bela Cereais Comércio Ltda.');
  const [emitenteCnpj, setEmitenteCnpj] = useState('15.726.793/0001-06');
  const [destinatario, setDestinatario] = useState('');
  const [destinatarioCnpj, setDestinatarioCnpj] = useState('');
  const [cfop, setCfop] = useState('');
  const [confirmarCfopForaPadrao, setConfirmarCfopForaPadrao] = useState(false);
  const [pedidoConfirmacaoCfop, setPedidoConfirmacaoCfop] = useState(false);
  const [pesoBruto, setPesoBruto] = useState('');
  const [pesoLiquido, setPesoLiquido] = useState('');
  const [quantidadeSacas, setQuantidadeSacas] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Etapa 2: Seleção de notas de entrada
  const [referenciasEtapa1, setReferenciasEtapa1] = useState<string[]>([]);

  // Etapa 4: Vínculo com Contêiner e até 3 NFs da Etapa 3
  const [containerId, setContainerId] = useState(containers[0]?.id || '');
  const [itensEtapa3, setItensEtapa3] = useState<Array<{ notaLoteRedexId: string; pesoConsumidoKg: string }>>([
    { notaLoteRedexId: etapa3Notas.find((n) => Number(n.saldoDisponivelKg || 0) > 0)?.id || '', pesoConsumidoKg: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const atualizarValoresPadraoPorEtapa = useCallback(
    (novaEtapa: string) => {
      setCfop('');
      setConfirmarCfopForaPadrao(false);
      setPedidoConfirmacaoCfop(false);

      if (novaEtapa === 'ETAPA_1_ENTRADA_INDUSTRIA') {
        setEmitente('Produtor / Fornecedor Parceiro');
        setEmitenteCnpj('');
        setDestinatario('Bela Cereais Indústria & Beneficiamento');
        setDestinatarioCnpj('15.726.793/0001-06');
      } else if (novaEtapa === 'ETAPA_2_RETORNO_ARMAZENAGEM') {
        setEmitente('Bela Cereais Indústria & Beneficiamento');
        setEmitenteCnpj('15.726.793/0001-06');
        setDestinatario('Bela Cereais Exportação');
        setDestinatarioCnpj('15.726.793/0001-06');
      } else if (novaEtapa === 'ETAPA_3_REMESSA_REDEX') {
        setEmitente('Bela Cereais Comércio Ltda.');
        setEmitenteCnpj('15.726.793/0001-06');
        setDestinatario('Terminal REDEX / Armazém Alfandegado');
        setDestinatarioCnpj('');
      } else if (novaEtapa === 'ETAPA_4_EXPORTACAO') {
        setEmitente('Bela Cereais Comércio Ltda.');
        setEmitenteCnpj('15.726.793/0001-06');
        setDestinatario('Comprador Internacional (Buyer)');
        setDestinatarioCnpj('');
        setItensEtapa3((atuais) => {
          if (atuais.length === 0 || !atuais[0].notaLoteRedexId) {
            const primeiraComSaldo = etapa3Notas.find((n) => Number(n.saldoDisponivelKg || 0) > 0);
            if (primeiraComSaldo) {
              return [{ notaLoteRedexId: primeiraComSaldo.id, pesoConsumidoKg: '' }];
            }
          }
          return atuais;
        });
      } else if (novaEtapa === 'ETAPA_5_AJUSTE_FISCAL') {
        setEmitente('Bela Cereais Comércio Ltda.');
        setEmitenteCnpj('15.726.793/0001-06');
        setDestinatario('');
        setDestinatarioCnpj('');
      }
    },
    [etapa3Notas]
  );

  useEffect(() => {
    if (isOpen && etapaInicial) {
      setEtapa(etapaInicial);
      setErro(null);
      atualizarValoresPadraoPorEtapa(etapaInicial);
    }
  }, [etapaInicial, isOpen, atualizarValoresPadraoPorEtapa]);

  function handleMudarEtapa(novaEtapa: string) {
    setEtapa(novaEtapa);
    setErro(null);
    atualizarValoresPadraoPorEtapa(novaEtapa);
  }

  function handleAlterarCfop(novoValor: string) {
    setCfop(novoValor);
    setConfirmarCfopForaPadrao(false);
    setPedidoConfirmacaoCfop(false);
    setErro(null);
  }

  // Manipulação de itens da Etapa 3 na Etapa 4
  function handleAdicionarItemEtapa3() {
    if (itensEtapa3.length >= 3) {
      setErro('Uma NF de Exportação pode referenciar no máximo 3 Notas Fiscais da Etapa 3 (Formação de Lote REDEX).');
      return;
    }
    const idsJaEscolhidos = new Set(itensEtapa3.map((i) => i.notaLoteRedexId));
    const proximaDisponivel = etapa3Notas.find(
      (n) => !idsJaEscolhidos.has(n.id) && Number(n.saldoDisponivelKg || 0) > 0
    );
    setItensEtapa3([
      ...itensEtapa3,
      { notaLoteRedexId: proximaDisponivel ? proximaDisponivel.id : '', pesoConsumidoKg: '' },
    ]);
  }

  function handleRemoverItemEtapa3(index: number) {
    if (itensEtapa3.length <= 1) return;
    setItensEtapa3(itensEtapa3.filter((_, i) => i !== index));
  }

  function handleAtualizarItemEtapa3(index: number, campo: 'notaLoteRedexId' | 'pesoConsumidoKg', valor: string) {
    const novos = [...itensEtapa3];
    novos[index][campo] = valor;
    setItensEtapa3(novos);

    if (campo === 'pesoConsumidoKg') {
      const soma = novos.reduce((acc, it) => acc + (parseNumeroBR(it.pesoConsumidoKg) || 0), 0);
      if (soma > 0) {
        setPesoLiquido(formatNumeroBR(soma, 2, 2));
      }
    }
  }

  const somaPesoConsumidoEtapa4 = itensEtapa3.reduce((acc, it) => acc + (parseNumeroBR(it.pesoConsumidoKg) || 0), 0);
  const cfopsPermitidosEtapa = obterCfopsPermitidos(etapa);
  const cfopValidacao = validarCfopEtapa(etapa, cfop);

  async function enviarNota(forcarConfirmacao = false) {
    setErro(null);

    if (!numero.trim()) {
      setErro('Informe o número da Nota Fiscal.');
      return;
    }

    const confirmadoEfetivo = confirmarCfopForaPadrao || forcarConfirmacao;
    if (!cfopValidacao.valido && !confirmadoEfetivo) {
      setPedidoConfirmacaoCfop(true);
      return;
    }

    if (etapa === 'ETAPA_4_EXPORTACAO') {
      if (!containerId) {
        setErro('O vínculo com um contêiner específico é obrigatório para a NF de Exportação.');
        return;
      }

      if (itensEtapa3.length === 0) {
        setErro('Vincule ao menos uma Nota Fiscal de Lote REDEX (Etapa 3).');
        return;
      }

      if (itensEtapa3.length > 3) {
        setErro('O limite máximo é de 3 Notas Fiscais da Etapa 3 referenciadas.');
        return;
      }

      for (const item of itensEtapa3) {
        if (!item.notaLoteRedexId) {
          setErro('Selecione uma Nota Fiscal da Etapa 3 para cada item.');
          return;
        }
        const peso = parseNumeroBR(item.pesoConsumidoKg);
        if (!peso || peso <= 0) {
          setErro('O peso consumido de cada nota deve ser maior que 0 kg.');
          return;
        }
        const nfEtapa3 = etapa3Notas.find((n) => n.id === item.notaLoteRedexId);
        const saldoDisponivel = Number(nfEtapa3?.saldoDisponivelKg ?? 0);
        if (peso > saldoDisponivel + 0.001) {
          setErro(
            `O peso informado (${formatNumeroBR(peso, 2, 2)} kg) para a NF ${nfEtapa3?.numero || ''} excede o saldo disponível de ${formatNumeroBR(saldoDisponivel, 2, 2)} kg.`
          );
          return;
        }
      }
    }

    const payload: any = {
      etapa,
      numero: numero.trim(),
      serie: serie.trim() || '1',
      chaveAcesso: chaveAcesso.replace(/\D/g, '') || null,
      dataEmissao,
      emitente: emitente.trim(),
      emitenteCnpj: emitenteCnpj.trim() || null,
      destinatario: destinatario.trim(),
      destinatarioCnpj: destinatarioCnpj.trim() || null,
      cfop: cfop.trim() ? formatarCfop(cfop.trim()) : null,
      confirmarCfopForaPadrao: confirmadoEfetivo,
      pesoBruto: pesoBruto ? parseNumeroBR(pesoBruto) : null,
      pesoLiquido: etapa === 'ETAPA_4_EXPORTACAO' ? somaPesoConsumidoEtapa4 : (parseNumeroBR(pesoLiquido) ?? 0),
      quantidadeSacas: quantidadeSacas ? parseNumeroBR(quantidadeSacas) : null,
      valorTotal: valorTotal ? parseNumeroBR(valorTotal) : null,
      observacoes: observacoes.trim() || null,
    };

    if (etapa === 'ETAPA_2_RETORNO_ARMAZENAGEM' && referenciasEtapa1.length > 0) {
      payload.referenciasEtapa1 = referenciasEtapa1.map((id) => ({ notaEntradaId: id }));
    }

    if (etapa === 'ETAPA_4_EXPORTACAO') {
      payload.containerId = containerId;
      payload.itensEtapa3 = itensEtapa3.map((it) => ({
        notaLoteRedexId: it.notaLoteRedexId,
        pesoConsumidoKg: parseNumeroBR(it.pesoConsumidoKg) ?? 0,
      }));
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/negociacoes/${processoId}/notas-fiscais`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.status === 422 && data?.requiresCfopConfirmation) {
        setPedidoConfirmacaoCfop(true);
        setErro(data.error || 'CFOP fora do padrão da etapa.');
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao registrar Nota Fiscal');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await enviarNota(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Lançar Nota Fiscal na Triangulação
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cadastre notas de entrada, retorno, formação de lote REDEX, exportação ou ajuste fiscal de encerramento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor de Etapas (5 Etapas) */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Selecione a Etapa da Triangulação Fiscal:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { id: 'ETAPA_1_ENTRADA_INDUSTRIA', label: '1. Entrada Indústria', tag: 'Remessa' },
              { id: 'ETAPA_2_RETORNO_ARMAZENAGEM', label: '2. Retorno Indústria', tag: 'Retorno' },
              { id: 'ETAPA_3_REMESSA_REDEX', label: '3. Formação Lote', tag: 'REDEX' },
              { id: 'ETAPA_4_EXPORTACAO', label: '4. Exportação', tag: 'Averbação' },
              { id: 'ETAPA_5_AJUSTE_FISCAL', label: '5. Ajuste Fiscal', tag: 'Baixa / Dev.' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMudarEtapa(item.id)}
                className={`px-3 py-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  etapa === item.id
                    ? item.id === 'ETAPA_5_AJUSTE_FISCAL'
                      ? 'border-violet-600 bg-violet-50/80 dark:bg-violet-950/30 text-violet-950 dark:text-violet-200 font-bold shadow-xs ring-1 ring-violet-500/20'
                      : 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs ring-1 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-semibold">{item.label}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{item.tag}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="font-medium leading-relaxed">{erro}</div>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Seção Etapa 5: Ajuste Fiscal */}
          {etapa === 'ETAPA_5_AJUSTE_FISCAL' && (
            <div className="p-3.5 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl text-xs text-violet-950 dark:text-violet-200 flex items-start gap-2.5">
              <Scale className="w-4 h-4 shrink-0 text-violet-600 dark:text-violet-400 mt-0.5" />
              <div>
                <span className="font-bold">Ajuste Fiscal de Encerramento:</span> Utilize esta etapa ao final do processo
                quando houver saldo a devolver simbolicamente (<strong className="font-mono">CFOP 2.506</strong>) ou saldo
                para baixa/ajuste de estoque (<strong className="font-mono">CFOP 5.927</strong>).
              </div>
            </div>
          )}

          {/* Seção Etapa 4: Vínculo Obrigatório com Contêiner e NFs Etapa 3 */}
          {etapa === 'ETAPA_4_EXPORTACAO' && (
            <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Container className="w-4 h-4 text-emerald-600" />
                Vínculo com Contêiner & Baixa de Saldo REDEX (Etapa 3)
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contêiner da Negociação <span className="text-red-500">*</span>
                </label>
                <select
                  value={containerId}
                  onChange={(e) => setContainerId(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Selecione o Contêiner...</option>
                  {containers.map((c) => (
                    <option key={c.id} value={c.id}>
                      Contêiner #{c.ordem} {c.numeroContainer ? `(${c.numeroContainer})` : '— Sem identificação'} · Estufado:{' '}
                      {c.pesoLiquido ? `${Number(c.pesoLiquido).toLocaleString('pt-BR')} kg` : 'Aguardando estufagem'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    NFs de Formação de Lote REDEX Utilizadas (1 até no máx. 3 NFs) <span className="text-red-500">*</span>
                  </label>
                  {itensEtapa3.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAdicionarItemEtapa3}
                      className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar outra NF do Lote (Máx 3)
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {itensEtapa3.map((item, idx) => {
                    const nfSelecionada = etapa3Notas.find((n) => n.id === item.notaLoteRedexId);
                    const saldoAtual = Number(nfSelecionada?.saldoDisponivelKg ?? 0);
                    const pesoDigitado = parseNumeroBR(item.pesoConsumidoKg) ?? 0;
                    const excedeu = pesoDigitado > saldoAtual + 0.001;

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                      >
                        <div className="flex-1">
                          <label className="block text-[10px] font-mono text-slate-500 mb-0.5">
                            NF Etapa 3 #{idx + 1}
                          </label>
                          <select
                            value={item.notaLoteRedexId}
                            onChange={(e) => handleAtualizarItemEtapa3(idx, 'notaLoteRedexId', e.target.value)}
                            required
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md outline-none"
                          >
                            <option value="">Selecione a NF de Lote...</option>
                            {etapa3Notas.map((n) => {
                              const s = Number(n.saldoDisponivelKg || 0);
                              return (
                                <option key={n.id} value={n.id} disabled={s <= 0 && n.id !== item.notaLoteRedexId}>
                                  NF nº {n.numero} · Saldo Disponível: {s.toLocaleString('pt-BR')} kg{' '}
                                  {s <= 0 ? '(Saldo Zerado)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="w-full sm:w-44">
                          <div className="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
                            <span>Peso Consumido (kg)</span>
                            <span className="font-mono text-slate-400">
                              Max: {saldoAtual.toLocaleString('pt-BR')} kg
                            </span>
                          </div>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Ex: 27.000,00"
                            value={item.pesoConsumidoKg}
                            onChange={(e) => handleAtualizarItemEtapa3(idx, 'pesoConsumidoKg', sanitizarInputNumeroBR(e.target.value))}
                            onBlur={(e) => {
                              const parsed = parseNumeroBR(e.target.value);
                              if (parsed !== null) {
                                handleAtualizarItemEtapa3(idx, 'pesoConsumidoKg', formatNumeroBR(parsed, 2, 2));
                              }
                            }}
                            required
                            className={`w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-md font-mono outline-none ${
                              excedeu
                                ? 'border-red-500 text-red-600 focus:ring-1 focus:ring-red-500'
                                : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                        </div>

                        {itensEtapa3.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoverItemEtapa3(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-500 self-center transition-colors"
                            title="Remover referência"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs px-3 py-2 bg-emerald-100/60 dark:bg-emerald-950/40 rounded-lg text-emerald-900 dark:text-emerald-200">
                  <span className="font-semibold">Peso Líquido Total da Exportação (Soma Consumida):</span>
                  <span className="font-mono font-bold text-sm">
                    {somaPesoConsumidoEtapa4.toLocaleString('pt-BR')} kg
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Seção Etapa 3: Aviso de Saldo Inicial */}
          {etapa === 'ETAPA_3_REMESSA_REDEX' && (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <span className="font-bold">Controle Automático de Saldo:</span> O Saldo Disponível desta nota iniciará
                exatamente igual ao Peso Líquido informado. Ele será abatido à medida que as NFs de Exportação (Etapa 4)
                forem emitidas por contêiner, até o zeramento total (0 kg).
              </div>
            </div>
          )}

          {/* Seção Etapa 2: Vínculo com Notas de Entrada da Indústria */}
          {etapa === 'ETAPA_2_RETORNO_ARMAZENAGEM' && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-amber-950 dark:text-amber-200">
                Vincular às Notas de Entrada na Indústria (Etapa 1):
              </label>
              {etapa1Notas.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Nenhuma NF de Entrada da Etapa 1 cadastrada ainda nesta negociação.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {etapa1Notas.map((n) => {
                    const checked = referenciasEtapa1.includes(n.id);
                    return (
                      <label
                        key={n.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          checked
                            ? 'border-amber-500 bg-amber-100/50 dark:bg-amber-900/30 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReferenciasEtapa1([...referenciasEtapa1, n.id]);
                            } else {
                              setReferenciasEtapa1(referenciasEtapa1.filter((id) => id !== n.id));
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>
                          NF {n.numero} ({Number(n.pesoLiquido).toLocaleString('pt-BR')} kg)
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Dados Fiscais da Nota */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número da NF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 10452"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Série</label>
              <input
                type="text"
                placeholder="1"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de Emissão <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Chave de Acesso 44 dígitos */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chave de Acesso NF-e (44 dígitos para consulta SEFAZ)
            </label>
            <input
              type="text"
              maxLength={44}
              placeholder="Ex: 51260415726793000106550010000104521000104520"
              value={chaveAcesso}
              onChange={(e) => setChaveAcesso(e.target.value.replace(/\D/g, ''))}
              className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono tracking-wider"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>{chaveAcesso.length}/44 dígitos digitados</span>
              {chaveAcesso.length === 44 && (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Formato válido para SEFAZ
                </span>
              )}
            </div>
          </div>

          {/* Emitente e Destinatário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Emitente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={emitente}
                onChange={(e) => setEmitente(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destinatário <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* CFOP Configurável por Etapa */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  CFOP da {obterRotuloEtapa(etapa)}
                </span>
                <p className="text-[11px] text-slate-500">
                  Selecione um CFOP padrão desta etapa ou digite o código específico da nota:
                </p>
              </div>
              {cfopValidacao.valido && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold self-start sm:self-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  CFOP padrão da etapa
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {cfopsPermitidosEtapa.map((op) => {
                const selecionado = formatarCfop(cfop) === op.codigo;
                return (
                  <button
                    key={op.codigo}
                    type="button"
                    onClick={() => handleAlterarCfop(op.codigo)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      selecionado
                        ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-500'
                    }`}
                    title={op.descricao}
                  >
                    <span className="font-mono font-bold">{op.codigo}</span>
                    <span className={`text-[10px] ${selecionado ? 'text-emerald-50' : 'text-slate-400'}`}>
                      · {op.descricao}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pesos e Valores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CFOP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={`Ex: ${cfopsPermitidosEtapa[0]?.codigo || ''}`}
                value={cfop}
                onChange={(e) => handleAlterarCfop(e.target.value)}
                onBlur={() => {
                  if (cfop.trim()) {
                    setCfop(formatarCfop(cfop));
                  }
                }}
                className={`w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg outline-none font-mono ${
                  cfopValidacao.preenchido && !cfopValidacao.valido
                    ? 'border-amber-500 text-amber-800 dark:text-amber-200'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peso Líquido (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 27.500,00"
                value={etapa === 'ETAPA_4_EXPORTACAO' ? (somaPesoConsumidoEtapa4 ? formatNumeroBR(somaPesoConsumidoEtapa4, 2, 2) : '') : pesoLiquido}
                onChange={(e) => setPesoLiquido(sanitizarInputNumeroBR(e.target.value))}
                onBlur={(e) => {
                  const parsed = parseNumeroBR(e.target.value);
                  if (parsed !== null) setPesoLiquido(formatNumeroBR(parsed, 2, 2));
                }}
                disabled={etapa === 'ETAPA_4_EXPORTACAO'}
                required
                className={`w-full text-xs px-3 py-2 border rounded-lg outline-none font-mono ${
                  etapa === 'ETAPA_4_EXPORTACAO'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peso Bruto (kg)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 27.600,00"
                value={pesoBruto}
                onChange={(e) => setPesoBruto(sanitizarInputNumeroBR(e.target.value))}
                onBlur={(e) => {
                  const parsed = parseNumeroBR(e.target.value);
                  if (parsed !== null) setPesoBruto(formatNumeroBR(parsed, 2, 2));
                }}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor Total R$</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 154.200,00"
                value={valorTotal}
                onChange={(e) => setValorTotal(sanitizarInputNumeroBR(e.target.value))}
                onBlur={(e) => {
                  const parsed = parseNumeroBR(e.target.value);
                  if (parsed !== null) setValorTotal(formatNumeroBR(parsed, 2, 2));
                }}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono"
              />
            </div>
          </div>

          {/* Alerta e Confirmação quando CFOP está fora do padrão */}
          {!cfopValidacao.valido && (cfopValidacao.preenchido || pedidoConfirmacaoCfop) && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">CFOP fora do padrão da {obterRotuloEtapa(etapa)}</div>
                  <p className="mt-0.5 leading-relaxed">
                    {cfopValidacao.motivo} Deseja anexar esta nota fiscal mesmo assim?
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={confirmarCfopForaPadrao}
                  onChange={(e) => {
                    setConfirmarCfopForaPadrao(e.target.checked);
                    if (e.target.checked) setErro(null);
                  }}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Sim, confirmar e anexar com CFOP {cfopValidacao.cfopFormatado || '(sem CFOP)'} mesmo assim</span>
              </label>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Dados Adicionais do Fisco
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Mercadoria destinada à exportação conforme regime especial..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
            />
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            {pedidoConfirmacaoCfop && !cfopValidacao.valido && !confirmarCfopForaPadrao ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setConfirmarCfopForaPadrao(true);
                  enviarNota(true);
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                {loading ? 'Salvando Nota...' : 'Anexar Mesmo Assim'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando Nota...
                  </>
                ) : (
                  'Salvar Nota Fiscal'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
