import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDateTimeBR } from '@/lib/formatters';
import { uploadDocumentoAction } from '@/server/actions/documentoActions';
import { DeleteDocumentButton } from '@/components/documentos/DeleteDocumentButton';
import { TipoDocumentoSelect } from '@/components/documentos/TipoDocumentoSelect';

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const tipos = await prisma.tipoDocumento.findMany({ orderBy: { nome: 'asc' } });

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: { documentos: { include: { tipoDocumento: true, uploadedBy: true }, orderBy: { uploadedEm: 'desc' } } },
  });

  if (!processo) notFound();

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold">Gerenciador de documentos (GED)</h3>
      </div>

      {/* NOVO BLOCO: GERADOR DE DOCUMENTOS COM INPUT DE ENDEREÇO */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-5 flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-gray-700">Gerar Documentos Padrão</h4>
        
        {/* Usamos um form com target="_blank" para abrir na nova aba enviando o endereço na URL */}
        <form action={`/instrucao-embarque/${processo.id}`} target="_blank" className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1.5 w-full max-w-md">
            <label className="text-xs font-semibold text-gray-500">Endereço do Comprador (Buyer)</label>
            <textarea 
              name="enderecoBuyer" 
              required 
              rows={2}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full resize-none outline-none focus:border-[#F58025]" 
              placeholder="Ex: 3 KUMMAL AMMAN KOIL STREET...&#10;CHENNAI TAMAILNADU 600081 INDIA"
            ></textarea>
          </div>
          
          <button type="submit" className="bg-[#F58025] text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-[#d66b1a] transition-colors inline-flex items-center gap-2 h-fit mb-0.5">
            📄 Gerar Instrução de Embarque
          </button>
        </form>
      </div>

      {/* FORMULÁRIO DE UPLOAD */}
      <form
        action={uploadDocumentoAction}
        className="bg-surface border border-border rounded-2xl p-5 mb-5 flex gap-3 items-start flex-wrap"
      >
        <input type="hidden" name="processoId" value={processo.id} />

        <div className="flex flex-col gap-1.5 w-64">
          <TipoDocumentoSelect tipos={tipos} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Arquivo</label>
          <input type="file" name="file" required className="text-sm mt-2" />
        </div>

        <div className="flex items-end h-full mt-6">
          <button type="submit" className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-100">
            Anexar
          </button>
        </div>
      </form>

      {/* TABELA DE DOCUMENTOS ANEXADOS */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {processo.documentos.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">Nenhum documento anexado ainda.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="text-left px-6 py-4 font-semibold">Documento</th>
                {/* Alterado de Categoria para Tipo de Documento */}
                <th className="text-left px-6 py-4 font-semibold">Tipo de Documento</th>
                <th className="text-left px-6 py-4 font-semibold">Data/Hora</th>
                <th className="text-left px-6 py-4 font-semibold">Responsável</th>
                <th className="text-center px-6 py-4 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {processo.documentos.map((d: any) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-6 py-4 text-sm font-medium">
                    {d.nomeArquivo}
                    {d.descricaoOutro && (
                      <div className="text-xs text-gray-400 font-normal mt-0.5">{d.descricaoOutro}</div>
                    )}
                  </td>
                  {/* Aqui nós mudamos de d.tipoDocumento.categoria para d.tipoDocumento.nome */}
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700">{d.tipoDocumento.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDateTimeBR(d.uploadedEm)}</td>
                  <td className="px-6 py-4 text-sm">{d.uploadedBy.nome}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-3">
                      <a
                        href={`/api/documentos/${d.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                        title="Abrir documento em nova aba"
                      >
                        Visualizar
                      </a>
                      <a
                        href={`/api/documentos/${d.id}?download=1`}
                        className="text-gray-600 hover:text-gray-900 font-semibold"
                        title="Baixar documento"
                      >
                        Baixar
                      </a>
                      <DeleteDocumentButton documentoId={d.id} processoId={processo.id} />
                    </div>
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