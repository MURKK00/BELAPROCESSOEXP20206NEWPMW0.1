// LOCAL FINAL DESTE ARQUIVO: src/components/negociacoes/ContainersTable.tsx (arquivo NOVO)

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardPaste, AlertCircle } from 'lucide-react';
import { salvarContainersAction } from '@/server/actions/containerActions';
import { canEditContainers } from '@/lib/permissions';
import { parseNumeroBR, formatNumeroBR, sanitizarInputNumeroBR } from '@/lib/numeroBR';
import { ImportarLoteModal } from './ImportarLoteModal';

type ContainerRow = {
  id: string;
  ordem: number;
  numeroContainer: string;
  lacre: string;
  pesoBruto: number | null;
  pesoLiquido: number | null;
  totalSacos: number | null;
  tara: number | null;
};

type CampoTexto = 'numeroContainer' | 'lacre';
type CampoNumero = 'pesoBruto' | 'pesoLiquido' | 'totalSacos' | 'tara';
type TextosLinhaMap = Record<string, Record<CampoNumero, string>>;

function buildTextosMap(rows: ContainerRow[]): TextosLinhaMap {
  const map: TextosLinhaMap = {};
  for (const r of rows) {
    map[r.id] = {
      pesoBruto: formatNumeroBR(r.pesoBruto, 2, 2),
      pesoLiquido: formatNumeroBR(r.pesoLiquido, 2, 2),
      totalSacos: formatNumeroBR(r.totalSacos, 0, 0),
      tara: formatNumeroBR(r.tara, 2, 2),
    };
  }
  return map;
}

export function ContainersTable({
  processoId,
  containers,
}: {
  processoId: string;
  containers: ContainerRow[];
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [linhas, setLinhas] = useState<ContainerRow[]>(containers);
  const [textosInputs, setTextosInputs] = useState<TextosLinhaMap>(() => buildTextosMap(containers));
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bela_user');
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
  }, []);

  const podeEditarContainers = !currentUser || canEditContainers(currentUser);

  const somaBruto = linhas.reduce((soma, l) => soma + (l.pesoBruto ?? 0), 0);
  const somaLiquido = linhas.reduce((soma, l) => soma + (l.pesoLiquido ?? 0), 0);

  function atualizarTexto(id: string, campo: CampoTexto, valor: string) {
    setLinhas((atuais) => atuais.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
  }

  function atualizarNumero(id: string, campo: CampoNumero, valorBruto: string) {
    const valor = sanitizarInputNumeroBR(valorBruto);
    const parsed = parseNumeroBR(valor);
    const numero = campo === 'totalSacos' && parsed !== null ? Math.round(parsed) : parsed;

    let liquidoRecalculadoTexto: string | null = null;

    setLinhas((atuais) =>
      atuais.map((l) => {
        if (l.id !== id) return l;
        const atualizado = { ...l, [campo]: numero };
        // Se alterou pesoBruto ou tara e o outro existir, recalcula pesoLiquido automaticamente
        if (campo === 'pesoBruto' && atualizado.tara !== null && atualizado.tara !== undefined) {
          const liquido = Number(((numero ?? 0) - atualizado.tara).toFixed(3));
          atualizado.pesoLiquido = liquido;
          liquidoRecalculadoTexto = formatNumeroBR(liquido, 2, 2);
        } else if (campo === 'tara' && atualizado.pesoBruto !== null && atualizado.pesoBruto !== undefined) {
          const liquido = Number((atualizado.pesoBruto - (numero ?? 0)).toFixed(3));
          atualizado.pesoLiquido = liquido;
          liquidoRecalculadoTexto = formatNumeroBR(liquido, 2, 2);
        }
        return atualizado;
      })
    );

    setTextosInputs((prev) => {
      const atualLinha = prev[id] ?? { pesoBruto: '', pesoLiquido: '', totalSacos: '', tara: '' };
      return {
        ...prev,
        [id]: {
          ...atualLinha,
          [campo]: valor,
          ...(liquidoRecalculadoTexto !== null ? { pesoLiquido: liquidoRecalculadoTexto } : {}),
        },
      };
    });
  }

  function formatarAoSair(id: string, campo: CampoNumero) {
    const textoAtual = textosInputs[id]?.[campo] ?? '';
    const num = parseNumeroBR(textoAtual);
    const formatado =
      num === null
        ? ''
        : campo === 'totalSacos'
        ? formatNumeroBR(Math.round(num), 0, 0)
        : formatNumeroBR(num, 2, 2);

    setTextosInputs((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { pesoBruto: '', pesoLiquido: '', totalSacos: '', tara: '' }),
        [campo]: formatado,
      },
    }));
  }

  function handleIniciarEdicao() {
    setErroSalvar(null);
    setTextosInputs(buildTextosMap(linhas));
    setEditando(true);
  }

  function handleAplicarLote(novosContainers: ContainerRow[]) {
    setErroSalvar(null);
    setLinhas(novosContainers);
    setTextosInputs(buildTextosMap(novosContainers));
    setEditando(true);
  }

  async function salvar() {
    setSalvando(true);
    setErroSalvar(null);
    try {
      const formData = new FormData();
      formData.set('processoId', processoId);
      formData.set('containersJson', JSON.stringify(linhas));
      await salvarContainersAction(formData);
      setTextosInputs(buildTextosMap(linhas));
      setEditando(false);
      router.refresh();
    } catch (err: any) {
      setErroSalvar(err?.message || 'Não foi possível salvar os contêineres.');
    } finally {
      setSalvando(false);
    }
  }

  function handleEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      salvar();
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <h4 className="text-gray-500 text-sm font-medium mb-2.5">Net weight (total)</h4>
          <div className="text-2xl font-bold font-mono tabular-nums">
            {formatNumeroBR(somaLiquido, 2, 3) || '0,00'} kg
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <h4 className="text-gray-500 text-sm font-medium mb-2.5">Gross weight (total)</h4>
          <div className="text-2xl font-bold font-mono tabular-nums">
            {formatNumeroBR(somaBruto, 2, 3) || '0,00'} kg
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">PEX Box &amp; Tracking</h3>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            Contêineres, RUC &amp; Free Time
          </span>
        </div>
        <div className="flex items-center gap-2">
          {podeEditarContainers ? (
            <>
              <button
                type="button"
                onClick={() => setModalLoteAberto(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-secondary bg-amber-50 hover:bg-amber-100 border border-secondary/30 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Colar linhas copiadas do Excel diretamente"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Colar do Excel (Lote)</span>
              </button>

              {editando ? (
                <button
                  onClick={salvar}
                  disabled={salvando}
                  className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? 'Salvando...' : '💾 Salvar'}
                </button>
              ) : (
                <button
                  onClick={handleIniciarEdicao}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-50 cursor-pointer"
                >
                  ✏️ Editar
                </button>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              Modo Visualização (Edição restrita a Administrativo, Diretoria e Admin)
            </span>
          )}
        </div>
      </div>

      {erroSalvar && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erroSalvar}</span>
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
        {linhas.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">
            Nenhum contêiner cadastrado. Defina a quantidade de contêineres na edição da negociação
            (aba &quot;Editar dados&quot;) para gerar as linhas automaticamente.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase whitespace-nowrap">
                <th className="text-left px-4 py-3 font-semibold">Containers Nº</th>
                <th className="text-left px-4 py-3 font-semibold">Seal</th>
                <th className="text-left px-4 py-3 font-semibold">Gross weight</th>
                <th className="text-left px-4 py-3 font-semibold">Net weight</th>
                <th className="text-left px-4 py-3 font-semibold">Total bags</th>
                <th className="text-left px-4 py-3 font-semibold">Tare</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const txt = textosInputs[l.id] ?? {
                  pesoBruto: formatNumeroBR(l.pesoBruto, 2, 2),
                  pesoLiquido: formatNumeroBR(l.pesoLiquido, 2, 2),
                  totalSacos: formatNumeroBR(l.totalSacos, 0, 0),
                  tara: formatNumeroBR(l.tara, 2, 2),
                };

                return (
                  <tr key={l.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      {editando ? (
                        <input
                          value={l.numeroContainer}
                          onChange={(e) => atualizarTexto(l.id, 'numeroContainer', e.target.value)}
                          onKeyDown={handleEnter}
                          placeholder={`Contêiner ${l.ordem}`}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm w-32"
                        />
                      ) : (
                        <span className="text-sm">{l.numeroContainer || `Contêiner ${l.ordem}`}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editando ? (
                        <input
                          value={l.lacre}
                          onChange={(e) => atualizarTexto(l.id, 'lacre', e.target.value)}
                          onKeyDown={handleEnter}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm w-28"
                        />
                      ) : (
                        <span className="text-sm">{l.lacre || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editando ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={txt.pesoBruto}
                          onChange={(e) => atualizarNumero(l.id, 'pesoBruto', e.target.value)}
                          onBlur={() => formatarAoSair(l.id, 'pesoBruto')}
                          onKeyDown={handleEnter}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm w-28 font-mono tabular-nums text-right"
                        />
                      ) : (
                        <span className="text-sm font-mono tabular-nums">
                          {l.pesoBruto !== null && l.pesoBruto !== undefined ? formatNumeroBR(l.pesoBruto, 2, 2) : '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editando ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={txt.pesoLiquido}
                          onChange={(e) => atualizarNumero(l.id, 'pesoLiquido', e.target.value)}
                          onBlur={() => formatarAoSair(l.id, 'pesoLiquido')}
                          onKeyDown={handleEnter}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm w-28 font-mono tabular-nums text-right"
                        />
                      ) : (
                        <span className="text-sm font-mono tabular-nums">
                          {l.pesoLiquido !== null && l.pesoLiquido !== undefined ? formatNumeroBR(l.pesoLiquido, 2, 2) : '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editando ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={txt.totalSacos}
                          onChange={(e) => atualizarNumero(l.id, 'totalSacos', e.target.value)}
                          onBlur={() => formatarAoSair(l.id, 'totalSacos')}
                          onKeyDown={handleEnter}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm w-24 font-mono tabular-nums text-right"
                        />
                      ) : (
                        <span className="text-sm font-mono tabular-nums">
                          {l.totalSacos !== null && l.totalSacos !== undefined ? formatNumeroBR(l.totalSacos, 0, 0) : '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editando ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={txt.tara}
                          onChange={(e) => atualizarNumero(l.id, 'tara', e.target.value)}
                          onBlur={() => formatarAoSair(l.id, 'tara')}
                          onKeyDown={handleEnter}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm w-24 font-mono tabular-nums text-right"
                        />
                      ) : (
                        <span className="text-sm font-mono tabular-nums">
                          {l.tara !== null && l.tara !== undefined ? formatNumeroBR(l.tara, 2, 2) : '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE IMPORTAÇÃO / COLAGEM EM LOTE */}
      <ImportarLoteModal
        isOpen={modalLoteAberto}
        onClose={() => setModalLoteAberto(false)}
        containersAtuais={linhas}
        onAplicar={handleAplicarLote}
      />
    </div>
  );
}
