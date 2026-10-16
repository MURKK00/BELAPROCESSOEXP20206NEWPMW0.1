"use client";

import { useState, useTransition, useEffect } from 'react';
import { salvarTodosCustosAction } from '@/server/actions/financeiroActions';
import { parseBRLToNumber, formatBRLInputString } from '@/lib/formatters';
import { CategoriaCusto } from '@prisma/client';
import { Save, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { canEditFinanceiro } from '@/lib/permissions';

export interface CustoItemConfig {
  categoria: CategoriaCusto;
  label: string;
  valorInicial: number;
}

interface DRECustosManagerProps {
  processoId: string;
  financeiroId: string;
  custosIniciais: CustoItemConfig[];
  receitaLiquidaBRL: number;
}

export function DRECustosManager({
  processoId,
  financeiroId,
  custosIniciais,
  receitaLiquidaBRL,
}: DRECustosManagerProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bela_user');
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
  }, []);

  const podeEditar = !currentUser || canEditFinanceiro(currentUser);

  // Inicializa mapa de valores como string formatada para digitação natural
  const [valoresStr, setValoresStr] = useState<Record<string, string>>(() => {
    const inicial: Record<string, string> = {};
    for (const c of custosIniciais) {
      inicial[c.categoria] = c.valorInicial > 0 ? formatBRLInputString(c.valorInicial) : '';
    }
    return inicial;
  });

  const [isPending, startTransition] = useTransition();
  const [salvoComSucesso, setSalvoComSucesso] = useState(false);
  const [teveModificacao, setTeveModificacao] = useState(false);

  // Calcula valores numéricos e soma total ao vivo
  let somaCustosLive = 0;
  const mapaValoresNum: Record<string, number> = {};

  for (const c of custosIniciais) {
    const raw = valoresStr[c.categoria] || '';
    const num = parseBRLToNumber(raw);
    mapaValoresNum[c.categoria] = num;
    somaCustosLive += num;
  }

  function handleInputChange(categoria: string, valor: string) {
    setValoresStr((prev) => ({ ...prev, [categoria]: valor }));
    setTeveModificacao(true);
    setSalvoComSucesso(false);
  }

  function handlePaste(categoria: string, e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const textoColado = e.clipboardData.getData('text');
    if (!textoColado) return;

    const num = parseBRLToNumber(textoColado);
    if (!isNaN(num) && num > 0) {
      handleInputChange(categoria, formatBRLInputString(num));
    } else if (textoColado.trim() === '0' || textoColado.trim() === '0,00' || textoColado.trim() === '0.00') {
      handleInputChange(categoria, '0,00');
    } else {
      handleInputChange(categoria, textoColado.trim());
    }
  }

  function handleBlur(categoria: string) {
    const valorAtual = valoresStr[categoria] || '';
    if (!valorAtual.trim()) return;
    const num = parseBRLToNumber(valorAtual);
    if (!isNaN(num) && num > 0) {
      handleInputChange(categoria, formatBRLInputString(num));
    }
  }

  async function handleSalvarTodos() {
    startTransition(async () => {
      try {
        const itensParaSalvar = custosIniciais.map((c) => ({
          categoria: c.categoria,
          valor: mapaValoresNum[c.categoria] || 0,
        }));

        const formData = new FormData();
        formData.append('processoId', processoId);
        formData.append('financeiroId', financeiroId);
        formData.append('custosJson', JSON.stringify(itensParaSalvar));

        await salvarTodosCustosAction(formData);

        setSalvoComSucesso(true);
        setTeveModificacao(false);
        setTimeout(() => setSalvoComSucesso(false), 3500);
      } catch (err) {
        alert('Erro ao salvar os custos. Tente novamente.');
      }
    });
  }

  const formatCurrencyBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-5">
      {/* GRID DE LANÇAMENTO DE CUSTOS (SEM BOTÕES INDIVIDUAIS REPETITIVOS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {custosIniciais.map((c) => {
          const valorNum = mapaValoresNum[c.categoria] || 0;
          const percentual = receitaLiquidaBRL > 0 ? (valorNum / receitaLiquidaBRL) * 100 : 0;
          const valorString = valoresStr[c.categoria] ?? '';

          return (
            <div
              key={c.categoria}
              className="flex items-center justify-between bg-gray-50/90 hover:bg-gray-100/70 p-3.5 rounded-xl border border-gray-200/90 gap-3 transition-colors shadow-2xs"
            >
              <div className="flex-1 min-w-0 pr-2">
                <span className="text-xs font-bold uppercase text-gray-800 block truncate" title={c.label}>
                  {c.label}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {percentual.toFixed(1)}% da receita líquida
                </span>
              </div>

              <div className="relative shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 select-none pointer-events-none">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorString}
                  readOnly={!podeEditar}
                  onChange={(e) => podeEditar && handleInputChange(c.categoria, e.target.value)}
                  onPaste={(e) => podeEditar && handlePaste(c.categoria, e)}
                  onBlur={() => podeEditar && handleBlur(c.categoria)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && podeEditar) {
                      e.preventDefault();
                      handleSalvarTodos();
                    }
                  }}
                  placeholder="0,00"
                  className={`w-40 sm:w-48 border rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-right outline-none transition-all shadow-2xs ${
                    podeEditar
                      ? 'border-gray-300 bg-white text-gray-900 focus:border-[#f58220] focus:ring-2 focus:ring-[#f58220]/20'
                      : 'border-gray-200 bg-gray-100/70 text-gray-500 cursor-not-allowed'
                  }`}
                  title={podeEditar ? "Digite ou cole do Excel. Pressione Enter ou use o botão Salvar abaixo." : "Apenas visualização"}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* BARRA GLOBAL DE SALVAMENTO NO RODAPÉ DOS CUSTOS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-600">
            <span className="block text-[11px] uppercase font-semibold text-slate-400">Total Custos Operacionais</span>
            <strong className="text-sm font-bold text-slate-800">{formatCurrencyBRL(somaCustosLive)}</strong>
          </div>

          {teveModificacao && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Alterações pendentes de salvamento
            </span>
          )}

          {salvoComSucesso && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-md animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Todos os custos foram salvos com sucesso!
            </span>
          )}
        </div>

        {podeEditar ? (
          <button
            type="button"
            onClick={handleSalvarTodos}
            disabled={isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1a365d] hover:bg-blue-900 disabled:opacity-50 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Salvando todos os custos...</span>
              </>
            ) : salvoComSucesso ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Custos Salvos!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#f58220]" />
                <span>Salvar Todos os Custos</span>
              </>
            )}
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200/80 text-slate-600 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Modo Visualização (Edição restrita a Financeiro, Diretoria e Admin)</span>
          </div>
        )}
      </div>
    </div>
  );
}
