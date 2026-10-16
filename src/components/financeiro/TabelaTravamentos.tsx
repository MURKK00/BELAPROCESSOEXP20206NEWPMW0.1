'use client';

import { useState, useEffect } from 'react';
import { 
  deletarTravamentoAction, 
  editarTravamentoAction 
} from '@/server/actions/financeiroActions';
import { formatBRL, formatUSD, formatPTAX, parseBRLToNumber } from '@/lib/formatters';
import { Edit3, Trash2, Calendar, DollarSign, X, Check, Info, Lock } from 'lucide-react';
import { canEditFinanceiro } from '@/lib/permissions';

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
}: TabelaTravamentosProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bela_user');
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
  }, []);

  const podeEditar = !currentUser || canEditFinanceiro(currentUser);

  // Estado para o modal de edição
  const [travaEmEdicao, setTravaEmEdicao] = useState<TravamentoItemData | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  // Campos do modal de edição
  const [editData, setEditData] = useState('');
  const [editValorUsd, setEditValorUsd] = useState('');
  const [editPtax, setEditPtax] = useState('');
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
    setEditObservacao(t.observacaoLimpa || '');
  }

  function fecharModalEdicao() {
    setTravaEmEdicao(null);
  }

  // Cálculos dinâmicos dentro do modal de edição
  const numEditUsd = parseBRLToNumber(editValorUsd);
  const numEditPtax = parseBRLToNumber(editPtax);
  const editValorConvertido = numEditUsd * numEditPtax;

  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-x-auto shadow-2xs">
        <table className="w-full min-w-[700px] text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
              <th className="p-3 whitespace-nowrap">Data da Trava</th>
              <th className="p-3 text-right whitespace-nowrap">Valor USD Travado</th>
              <th className="p-3 text-right whitespace-nowrap">Taxa PTAX</th>
              <th className="p-3 text-right text-emerald-800 whitespace-nowrap">Total em Reais (BRL)</th>
              <th className="p-3 whitespace-nowrap">Observação</th>
              <th className="p-3 text-center whitespace-nowrap">Ações</th>
            </tr>
          </thead>
          <tbody>
            {travamentos.map((t) => {
              const usd = Number(t.valorUsdParcial);
              const ptax = Number(t.ptax);
              const totalConvertido = usd * ptax;
              const dataObj = new Date(t.dataTravamento);

              return (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                  <td className="p-3 text-gray-700 font-medium whitespace-nowrap">
                    {!isNaN(dataObj.getTime()) ? dataObj.toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="p-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatUSD(usd)}</td>
                  <td className="p-3 text-right font-bold text-blue-600 font-mono tracking-tight whitespace-nowrap" title={`PTAX exata: ${ptax}`}>
                    {formatPTAX(ptax)}
                  </td>
                  <td className="p-3 text-right font-black text-emerald-700 bg-emerald-50/30 whitespace-nowrap">
                    {formatBRL(totalConvertido)}
                  </td>
                  <td className="p-3 text-gray-500 text-xs max-w-[200px] truncate" title={t.observacaoLimpa}>
                    {t.observacaoLimpa || '-'}
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    {podeEditar ? (
                      <div className="flex items-center justify-center gap-1">
                        {/* BOTÃO EDITAR */}
                        <button
                          type="button"
                          onClick={() => abrirModalEdicao(t)}
                          title="Editar trava"
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
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {travamentos.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400 text-sm">
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
                <td className="p-3 text-right text-emerald-800 bg-emerald-100/50 text-sm font-black">
                  {formatBRL(receitaBrutaBRL)}
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
                  <p className="text-xs text-gray-500">Altere a data, taxa PTAX bancária, valor em Dólar ou observação.</p>
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
                  formData.set('taxa', '0');
                  formData.set('moedaTaxa', 'USD');
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

              {/* TAXA PTAX */}
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

              {/* OBSERVAÇÃO */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Observação
                </label>
                <input
                  type="text"
                  value={editObservacao}
                  onChange={(e) => setEditObservacao(e.target.value)}
                  placeholder="Ex: Trava de 50% no BB"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#f58220] transition-colors"
                />
              </div>

              {/* PAINEL DINÂMICO DE RESUMO */}
              {numEditUsd > 0 && numEditPtax > 0 && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-semibold">Total Convertido</span>
                    <span className="font-bold text-emerald-800 text-sm">{formatBRL(editValorConvertido)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block text-[10px]">Cálculo:</span>
                    <span className="font-mono text-gray-600 text-xs">${numEditUsd.toFixed(2)} × {formatPTAX(numEditPtax)}</span>
                  </div>
                </div>
              )}

              {/* BOTÕES */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={fecharModalEdicao}
                  disabled={salvando}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando || numEditUsd <= 0 || numEditPtax <= 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#f58220] hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{salvando ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
