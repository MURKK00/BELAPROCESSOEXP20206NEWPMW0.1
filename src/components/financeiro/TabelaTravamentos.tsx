'use client';

import { useState } from 'react';
import { 
  deletarTravamentoAction, 
  editarTravamentoAction 
} from '@/server/actions/financeiroActions';
import { formatBRL, formatUSD, formatPTAX, parseBRLToNumber } from '@/lib/formatters';
import { Edit3, Trash2, Calendar, DollarSign, Percent, ArrowDownRight, X, Check, AlertCircle } from 'lucide-react';

export interface TravamentoItemData {
  id: string;
  dataTravamento: string | Date;
  valorUsdParcial: number | string;
  ptax: number | string;
  taxa: number;
  moedaTaxa: string;
  valorLiquido: number;
  observacaoLimpa: string;
  observacaoBruta?: string;
}

interface TabelaTravamentosProps {
  processoId: string;
  travamentos: TravamentoItemData[];
  totalUsdTravado: number;
  ptaxMedia: number;
  receitaBrutaBRL: number;
  totalTaxasBRL: number;
  receitaLiquidaBRL: number;
}

export function TabelaTravamentos({
  processoId,
  travamentos,
  totalUsdTravado,
  ptaxMedia,
  receitaBrutaBRL,
  totalTaxasBRL,
  receitaLiquidaBRL,
}: TabelaTravamentosProps) {
  // Estado para o modal de edição
  const [travaEmEdicao, setTravaEmEdicao] = useState<TravamentoItemData | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  // Campos do modal de edição
  const [editData, setEditData] = useState('');
  const [editValorUsd, setEditValorUsd] = useState('');
  const [editPtax, setEditPtax] = useState('');
  const [editTaxa, setEditTaxa] = useState('0');
  const [editMoedaTaxa, setEditMoedaTaxa] = useState<'USD' | 'BRL'>('USD');
  const [editObservacao, setEditObservacao] = useState('');

  // Ao abrir o modal de edição
  function abrirModalEdicao(t: TravamentoItemData) {
    const dataObj = new Date(t.dataTravamento);
    const dataFormatada = !isNaN(dataObj.getTime())
      ? dataObj.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const numUsd = Number(t.valorUsdParcial);
    const numPtax = Number(t.ptax);

    setTravaEmEdicao(t);
    setEditData(dataFormatada);
    setEditValorUsd(numUsd > 0 ? numUsd.toFixed(2) : '');
    setEditPtax(formatPTAX(numPtax));
    setEditTaxa(t.taxa > 0 ? t.taxa.toString() : '0');
    setEditMoedaTaxa((t.moedaTaxa as 'USD' | 'BRL') || 'USD');
    setEditObservacao(t.observacaoLimpa || '');
  }

  function fecharModalEdicao() {
    setTravaEmEdicao(null);
  }

  // Cálculos dinâmicos dentro do modal de edição
  const numEditUsd = parseBRLToNumber(editValorUsd);
  const numEditPtax = parseBRLToNumber(editPtax);
  const numEditTaxa = parseBRLToNumber(editTaxa);

  const editUsdLiquido = editMoedaTaxa === 'USD' ? Math.max(0, numEditUsd - numEditTaxa) : numEditUsd;
  const editTaxaEmBrl = editMoedaTaxa === 'USD' ? numEditTaxa * numEditPtax : numEditTaxa;
  const editValorBruto = numEditUsd * numEditPtax;
  const editValorLiquido = editMoedaTaxa === 'USD' ? editUsdLiquido * numEditPtax : Math.max(0, editValorBruto - numEditTaxa);

  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-x-auto shadow-2xs">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
              <th className="p-3">Data da Trava</th>
              <th className="p-3 text-right">Valor USD</th>
              <th className="p-3 text-right">PTAX (Taxa)</th>
              <th className="p-3 text-right">Valor Bruto (BRL)</th>
              <th className="p-3 text-right">Taxa Cobrada</th>
              <th className="p-3 text-right text-emerald-800">Valor Líquido (BRL)</th>
              <th className="p-3">Observação</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {travamentos.map((t) => {
              const usd = Number(t.valorUsdParcial);
              const ptax = Number(t.ptax);
              const bruto = usd * ptax;
              const taxaEmBrl = t.moedaTaxa === 'USD' ? t.taxa * ptax : t.taxa;
              const liquido = t.valorLiquido;
              const dataObj = new Date(t.dataTravamento);

              return (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                  <td className="p-3 text-gray-700 font-medium">
                    {!isNaN(dataObj.getTime()) ? dataObj.toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="p-3 text-right font-bold text-gray-900">{formatUSD(usd)}</td>
                  <td className="p-3 text-right font-bold text-blue-600 font-mono tracking-tight" title={`PTAX exata: ${ptax}`}>
                    {formatPTAX(ptax)}
                  </td>
                  <td className="p-3 text-right text-gray-700">{formatBRL(bruto)}</td>
                  <td className="p-3 text-right font-medium text-red-600">
                    {t.taxa > 0 
                      ? (t.moedaTaxa === 'USD' 
                          ? `- $ ${t.taxa.toFixed(2)} (- ${formatBRL(taxaEmBrl)})`
                          : `- ${formatBRL(t.taxa)}`)
                      : 'R$ 0,00'}
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-700 bg-emerald-50/30">
                    {formatBRL(liquido)}
                  </td>
                  <td className="p-3 text-gray-500 text-xs max-w-[200px] truncate" title={t.observacaoLimpa}>
                    {t.observacaoLimpa || '-'}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* BOTÃO EDITAR */}
                      <button
                        type="button"
                        onClick={() => abrirModalEdicao(t)}
                        title="Editar data, valor, PTAX ou taxa desta trava"
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* BOTÃO EXCLUIR */}
                      <form
                        action={async (formData: FormData) => {
                          if (confirm('Tem certeza que deseja excluir esta trava de câmbio?')) {
                            setExcluindoId(t.id);
                            try {
                              await deletarTravamentoAction(formData);
                            } finally {
                              setExcluindoId(null);
                            }
                          }
                        }}
                      >
                        <input type="hidden" name="travamentoId" value={t.id} />
                        <input type="hidden" name="processoId" value={processoId} />
                        <button
                          type="submit"
                          disabled={excluindoId === t.id}
                          title="Excluir trava"
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}

            {travamentos.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-400 text-sm">
                  Nenhum travamento de câmbio registrado para este processo.
                </td>
              </tr>
            )}
          </tbody>

          {travamentos.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100/80 font-bold text-xs text-gray-800 border-t-2 border-gray-200">
                <td className="p-3 uppercase">Total / Média:</td>
                <td className="p-3 text-right text-gray-900">{formatUSD(totalUsdTravado)}</td>
                <td className="p-3 text-right text-blue-700 font-mono text-sm">{formatPTAX(ptaxMedia)}</td>
                <td className="p-3 text-right text-gray-900">{formatBRL(receitaBrutaBRL)}</td>
                <td className="p-3 text-right text-red-600">
                  {totalTaxasBRL > 0 ? `- ${formatBRL(totalTaxasBRL)}` : 'R$ 0,00'}
                </td>
                <td className="p-3 text-right text-emerald-800 bg-emerald-100/50 text-sm">
                  {formatBRL(receitaLiquidaBRL)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* MODAL DE EDIÇÃO DE TRAVA */}
      {travaEmEdicao && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-fadeIn">
            {/* CABEÇALHO DO MODAL */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Editar Trava de Câmbio</h3>
                  <p className="text-xs text-gray-500">Altere a data, taxa PTAX bancária, valores ou observações.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={fecharModalEdicao}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMULÁRIO DE EDIÇÃO */}
            <form
              action={async (formData: FormData) => {
                setSalvando(true);
                try {
                  formData.set('processoId', processoId);
                  formData.set('travamentoId', travaEmEdicao.id);
                  formData.set('dataTrava', editData);
                  formData.set('valorUsdParcial', numEditUsd.toString());
                  formData.set('ptax', numEditPtax.toString());
                  formData.set('taxa', numEditTaxa.toString());
                  formData.set('moedaTaxa', editMoedaTaxa);
                  formData.set('observacao', editObservacao);

                  await editarTravamentoAction(formData);
                  fecharModalEdicao();
                } catch (err: any) {
                  alert('Erro ao atualizar a trava: ' + (err?.message || 'Erro desconhecido'));
                } finally {
                  setSalvando(false);
                }
              }}
              className="p-5 space-y-4 text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* DATA DA TRAVA */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Data da Trava
                  </label>
                  <input
                    type="date"
                    value={editData}
                    onChange={(e) => setEditData(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-semibold text-gray-900 outline-none focus:border-[#f58220] transition-colors"
                  />
                </div>

                {/* VALOR USD */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Valor USD da Trava
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editValorUsd}
                    onChange={(e) => setEditValorUsd(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-bold text-gray-900 outline-none focus:border-[#f58220] transition-colors"
                  />
                </div>
              </div>

              {/* TAXA PTAX COM SUPORTE ATÉ 7 CASAS DECIMAIS */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">
                    Taxa PTAX Negociada
                  </label>
                  <span className="text-[11px] text-blue-600 font-semibold">
                    Suporta até 7 casas (ex: 5,1500727)
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editPtax}
                  onChange={(e) => setEditPtax(e.target.value)}
                  required
                  placeholder="Ex: 5,1500727"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-bold text-blue-600 font-mono outline-none focus:border-[#f58220] transition-colors"
                />
              </div>

              {/* TAXA BANCÁRIA COBRADA */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-500" /> Tarifa / Taxa Bancária
                  </label>
                  <div className="inline-flex rounded p-0.5 bg-gray-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setEditMoedaTaxa('USD')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        editMoedaTaxa === 'USD' ? 'bg-[#f58220] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMoedaTaxa('BRL')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        editMoedaTaxa === 'BRL' ? 'bg-[#f58220] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      BRL (R$)
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editTaxa}
                    onChange={(e) => setEditTaxa(e.target.value)}
                    placeholder="0,00"
                    className="w-full border border-gray-300 rounded-lg pl-3 pr-14 py-2 text-sm bg-white font-medium text-red-600 outline-none focus:border-[#f58220] transition-colors"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-gray-400 pointer-events-none">
                    {editMoedaTaxa}
                  </span>
                </div>
              </div>

              {/* OBSERVAÇÃO */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Observação / Referência
                </label>
                <input
                  type="text"
                  value={editObservacao}
                  onChange={(e) => setEditObservacao(e.target.value)}
                  placeholder="Ex: Parcial 50% BL, taxa reduzida BB"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 outline-none focus:border-[#f58220] transition-colors"
                />
              </div>

              {/* CARD DE PRÉVIA EM TEMPO REAL */}
              {numEditUsd > 0 && numEditPtax > 0 && (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl space-y-1.5 text-xs text-blue-900">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Valor Bruto:</span>
                    <span className="font-bold text-gray-900">{formatBRL(editValorBruto)}</span>
                  </div>
                  {numEditTaxa > 0 && (
                    <div className="flex justify-between items-center text-red-700">
                      <span>Tarifa Bancária Deduzida:</span>
                      <span className="font-semibold">
                        -{editMoedaTaxa === 'USD' ? `$ ${numEditTaxa.toFixed(2)} (${formatBRL(editTaxaEmBrl)})` : formatBRL(numEditTaxa)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-blue-200 font-extrabold text-emerald-800 text-sm">
                    <span>Novo Valor Líquido (R$):</span>
                    <span>{formatBRL(editValorLiquido)}</span>
                  </div>
                </div>
              )}

              {/* BOTÕES DE AÇÃO */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={fecharModalEdicao}
                  disabled={salvando}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando || numEditUsd <= 0 || numEditPtax <= 0}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f58220] hover:bg-[#e0751a] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {salvando ? (
                    <span>Salvando alterações...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
