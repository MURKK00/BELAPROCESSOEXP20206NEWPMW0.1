'use client';

import { useState } from 'react';
import { ClipboardPaste, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ContainerRow {
  id: string;
  ordem: number;
  numeroContainer: string;
  lacre: string;
  pesoBruto: number | null;
  pesoLiquido: number | null;
  totalSacos: number | null;
  tara: number | null;
}

interface ImportarLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  containersAtuais: ContainerRow[];
  onAplicar: (containersAtualizados: ContainerRow[]) => void;
}

export function ImportarLoteModal({
  isOpen,
  onClose,
  containersAtuais,
  onAplicar,
}: ImportarLoteModalProps) {
  const [textoColado, setTextoColado] = useState('');
  const [previewRows, setPreviewRows] = useState<Array<Partial<ContainerRow>>>([]);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  // Função para parsear texto copiado do Excel (separado por Tab ou ponto-e-vírgula)
  const processarTexto = (raw: string) => {
    setTextoColado(raw);
    setErro(null);

    if (!raw.trim()) {
      setPreviewRows([]);
      return;
    }

    const lines = raw
      .trim()
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0);

    const parsed: Array<Partial<ContainerRow>> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Aceita separador TAB (padrão de copiar do Excel) ou vírgula/ponto-e-vírgula
      const cols = line.includes('\t') ? line.split('\t') : line.split(/[,;]/);
      const cleanCols = cols.map((c) => c.trim().replace(/^["']|["']$/g, ''));

      // Se a primeira linha parecer cabeçalho (ex: contém "container" ou "lacre"), pular
      if (
        i === 0 &&
        (cleanCols[0].toLowerCase().includes('container') ||
          cleanCols[0].toLowerCase().includes('nº') ||
          cleanCols[0].toLowerCase().includes('numero'))
      ) {
        continue;
      }

      const parseNumber = (val?: string) => {
        if (!val) return null;
        // Limpar pontos de milhar e trocar vírgula por ponto
        const cleaned = val.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      };

      const numeroContainer = cleanCols[0] || '';
      const lacre = cleanCols[1] || '';
      const pesoBruto = parseNumber(cleanCols[2]);
      const pesoLiquido = parseNumber(cleanCols[3]);
      const totalSacos = parseNumber(cleanCols[4]);
      const tara = parseNumber(cleanCols[5]);

      parsed.push({
        numeroContainer,
        lacre,
        pesoBruto,
        pesoLiquido: pesoLiquido ?? (pesoBruto && tara ? pesoBruto - tara : null),
        totalSacos,
        tara,
      });
    }

    setPreviewRows(parsed);
  };

  const handleConfirmar = () => {
    if (previewRows.length === 0) {
      setErro('Nenhum dado válido foi detectado. Cole ao menos uma linha de dados.');
      return;
    }

    // Mesclar com os containers existentes pela ordem
    const novos = containersAtuais.map((c, index) => {
      const colado = previewRows[index];
      if (!colado) return c;
      return {
        ...c,
        numeroContainer: colado.numeroContainer || c.numeroContainer,
        lacre: colado.lacre || c.lacre,
        pesoBruto: colado.pesoBruto !== null && colado.pesoBruto !== undefined ? colado.pesoBruto : c.pesoBruto,
        pesoLiquido: colado.pesoLiquido !== null && colado.pesoLiquido !== undefined ? colado.pesoLiquido : c.pesoLiquido,
        totalSacos: colado.totalSacos !== null && colado.totalSacos !== undefined ? colado.totalSacos : c.totalSacos,
        tara: colado.tara !== null && colado.tara !== undefined ? colado.tara : c.tara,
      };
    });

    onAplicar(novos);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5 text-secondary" />
            <h3 className="font-bold text-gray-900 text-base">Importação / Colagem em Lote de Contêineres</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-800 leading-relaxed">
            <strong className="font-semibold block mb-1">Como usar:</strong>
            Copie as colunas da sua planilha Excel na ordem:{' '}
            <code className="bg-blue-100/80 px-1 py-0.5 rounded font-mono text-blue-900">
              Container | Lacre | Peso Bruto | Peso Líquido | Sacos | Tara
            </code>
            . Em seguida, cole diretamente na caixa abaixo com <kbd className="px-1 py-0.5 bg-white border border-blue-300 rounded font-mono">Ctrl + V</kbd>.
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Cole aqui as linhas da sua planilha Excel:
            </label>
            <textarea
              rows={6}
              value={textoColado}
              onChange={(e) => processarTexto(e.target.value)}
              placeholder={`MSKU1234567\tML-BR101\t27200\t25000\t1000\t2200\nMSKU7654321\tML-BR102\t27200\t25000\t1000\t2200`}
              className="w-full font-mono text-xs p-3 border border-gray-300 rounded-xl outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 shadow-2xs"
            />
          </div>

          {erro && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Pré-visualização dos dados detectados */}
          {previewRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {previewRows.length} linha(s) detectada(s)
                </span>
                <span className="text-xs text-gray-500">
                  Total de contêineres no processo: {containersAtuais.length}
                </span>
              </div>
              <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-border sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Container</th>
                      <th className="px-3 py-2">Lacre</th>
                      <th className="px-3 py-2 text-right">Peso Bruto</th>
                      <th className="px-3 py-2 text-right">Peso Líquido</th>
                      <th className="px-3 py-2 text-right">Sacos</th>
                      <th className="px-3 py-2 text-right">Tara</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewRows.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-1.5 font-mono text-gray-400">#{i + 1}</td>
                        <td className="px-3 py-1.5 font-semibold text-gray-900">{r.numeroContainer || '-'}</td>
                        <td className="px-3 py-1.5">{r.lacre || '-'}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{r.pesoBruto?.toLocaleString('pt-BR') ?? '-'}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{r.pesoLiquido?.toLocaleString('pt-BR') ?? '-'}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{r.totalSacos ?? '-'}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{r.tara?.toLocaleString('pt-BR') ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={previewRows.length === 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-secondary hover:bg-amber-600 rounded-lg disabled:opacity-50 shadow-2xs"
          >
            Aplicar aos {Math.min(previewRows.length, containersAtuais.length)} Contêineres
          </button>
        </div>
      </div>
    </div>
  );
}
