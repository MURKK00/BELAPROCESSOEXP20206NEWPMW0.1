import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDateTimeBR } from '@/lib/formatters';
import { uploadDocumentoAction } from '@/server/actions/documentoActions';
import { DeleteDocumentButton } from '@/components/documentos/DeleteDocumentButton';
import { TipoDocumentoSelect } from '@/components/documentos/TipoDocumentoSelect';

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Busca os tipos no banco de dados
  let tipos = await prisma.tipoDocumento.findMany({ orderBy: { nome: 'asc' } });

  // 2. Garante que o tipo "Etiqueta" exista no banco de dados
  const temEtiqueta = tipos.some(t => t.nome === 'Etiqueta');
  if (!temEtiqueta) {
    await prisma.tipoDocumento.create({
      data: { nome: 'Etiqueta', categoria: 'ETIQUETA' }
    });
    // Busca novamente para incluir a Etiqueta recém-criada
    tipos = await prisma.tipoDocumento.findMany({ orderBy: { nome: 'asc' } });
  }

  const temOutro = tipos.some(t => t.nome === 'Outro');
  if (!temOutro) {
    await prisma.tipoDocumento.create({
      data: { nome: 'Outro', categoria: 'OUTRO' }
    });
    tipos = await prisma.tipoDocumento.findMany({ orderBy: { nome: 'asc' } });
  }
  
  // 3. Busca os dados da negociação
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

      <form
        action={uploadDocumentoAction}
        className="bg-surface border border-border rounded-2xl p-5 mb-5 flex gap-3 items-end flex-wrap"
      >
        <input type="hidden" name="processoId" value={processo.id} />
        
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Tipo de documento</label>
          <TipoDocumentoSelect tipos={tipos} />
            <option value="" disabled>Selecione um item...</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              <th className="text-left px-6 py-4 font-semibold">Documento</th>
              <th className="text-left px-6 py-4 font-semibold">Categoria</th>
              <th className="text-left px-6 py-4 font-semibold">Data/Hora</th>
              <th className="text-left px-6 py-4 font-semibold">Responsável</th>
              <th className="text-center px-6 py-4 font-semibold">Ações</th>
            </tr>
</thead>
<tbody>
  {processo.documentos.map((d) => (
    <tr key={d.id} className="border-t border-border">
      <td className="px-6 py-4 text-sm font-medium">
        {d.nomeArquivo}
        {d.descricaoOutro && (
          <div className="text-xs text-gray-400 font-normal mt-0.5">{d.descricaoOutro}</div>
        )}
      </td>
      <td className="px-6 py-4 text-sm">{d.tipoDocumento.categoria}</td>
      <td className="px-6 py-4 text-sm text-gray-500">{formatDateTimeBR(d.uploadedEm)}</td>
      <td className="px-6 py-4 text-sm">{d.uploadedBy.nome}</td>
      <td className="px-6 py-4 text-sm text-center">
        <DeleteDocumentButton documentoId={d.id} processoId={processo.id} />
      </td>
    </tr>
  ))}
</tbody>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Arquivo</label>
          <input type="file" name="file" required className="text-sm" />
        </div>
        
        <button type="submit" className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-100">
          Anexar
        </button>
      </form>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {processo.documentos.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">Nenhum documento anexado ainda.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="text-left px-6 py-4 font-semibold">Documento</th>
                <th className="text-left px-6 py-4 font-semibold">Categoria</th>
                <th className="text-left px-6 py-4 font-semibold">Data/Hora</th>
                <th className="text-left px-6 py-4 font-semibold">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {processo.documentos.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-6 py-4 text-sm font-medium">{d.nomeArquivo}</td>
                  <td className="px-6 py-4 text-sm">{d.tipoDocumento.categoria}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDateTimeBR(d.uploadedEm)}</td>
                  <td className="px-6 py-4 text-sm">{d.uploadedBy.nome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}