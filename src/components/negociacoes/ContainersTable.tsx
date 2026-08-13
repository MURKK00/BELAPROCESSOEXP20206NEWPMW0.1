// LOCAL FINAL DESTE ARQUIVO: src/components/negociacoes/ContainersTable.tsx (arquivo NOVO)

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { salvarContainersAction } from '@/server/actions/containerActions';

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

export function ContainersTable({
  processoId,
  containers,
}: {
  processoId: string;
  containers: ContainerRow[];
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [linhas, setLinhas] = useState<ContainerRow[]>(containers);
  const [salvando, setSalvando] = useState(false);

  const somaBruto = linhas.reduce((soma, l) => soma + (l.pesoBruto ?? 0), 0);
  const somaLiquido = linhas.reduce((soma, l) => soma + (l.pesoLiquido ?? 0), 0);

  function atualizarTexto(id: string, campo: CampoTexto, valor: string) {
    setLinhas((atuais) => atuais.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
  }

  function atualizarNumero(id: string, campo: CampoNumero, valor: string) {
    const numero = valor === '' ? null : Number(valor);
    setLinhas((atuais) => atuais.map((l) => (l.id === id ? { ...l, [campo]: numero } : l)));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const formData = new FormData();
      formData.set('processoId', processoId);
      formData.set('containersJson', JSON.stringify(linhas));
      await salvarContainersAction(formData);
      setEditando(false);
      router.refresh();
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
          <div className="text-2xl font-bold">
            {somaLiquido.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <h4 className="text-gray-500 text-sm font-medium mb-2.5">Gross weight (total)</h4>
          <div className="text-2xl font-bold">
            {somaBruto.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Contêineres</h3>
        {editando ? (
          <button
            onClick={salvar}
            disabled={salvando}
            className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-100 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : '💾 Salvar'}
          </button>
        ) : (
          <button
            onClick={() => setEditando(true)}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-50"
          >
            ✏️ Editar
          </button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
        {linhas.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">
            Nenhum contêiner cadastrado. Defina a quantidade de contêineres na edição da negociação
            (aba "Editar dados") para gerar as linhas automaticamente.
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
              {linhas.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    {editando ? (
                      <input
                        defaultValue={l.numeroContainer}
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
                        defaultValue={l.lacre}
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
                        type="number"
                        step="0.01"
                        defaultValue={l.pesoBruto ?? ''}
                        onChange={(e) => atualizarNumero(l.id, 'pesoBruto', e.target.value)}
                        onKeyDown={handleEnter}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm w-28"
                      />
                    ) : (
                      <span className="text-sm">{l.pesoBruto ?? '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editando ? (
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={l.pesoLiquido ?? ''}
                        onChange={(e) => atualizarNumero(l.id, 'pesoLiquido', e.target.value)}
                        onKeyDown={handleEnter}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm w-28"
                      />
                    ) : (
                      <span className="text-sm">{l.pesoLiquido ?? '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editando ? (
                      <input
                        type="number"
                        defaultValue={l.totalSacos ?? ''}
                        onChange={(e) => atualizarNumero(l.id, 'totalSacos', e.target.value)}
                        onKeyDown={handleEnter}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm w-24"
                      />
                    ) : (
                      <span className="text-sm">{l.totalSacos ?? '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editando ? (
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={l.tara ?? ''}
                        onChange={(e) => atualizarNumero(l.id, 'tara', e.target.value)}
                        onKeyDown={handleEnter}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm w-24"
                      />
                    ) : (
                      <span className="text-sm">{l.tara ?? '-'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
