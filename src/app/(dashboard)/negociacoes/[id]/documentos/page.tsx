import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDateTimeBR } from '@/lib/formatters';
import { uploadDocumentoAction } from '@/server/actions/documentoActions';

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Busca os tipos no banco de dados
  let tipos = await prisma.tipoDocumento.findMany({ orderBy: { nome: 'asc' } });

  // ✨ A MÁGICA AQUI: Se a gaveta estiver vazia, cadastra os básicos usando AS PALAVRAS EXATAS DO SEU SCHEMA!
  if (tipos.length === 0) {
    await prisma.tipoDocumento.createMany({
      data: [
        { nome: 'Contrato', categoria: 'COMERCIAL' },
        { nome: 'Booking', categoria: 'BOOKING_TRANSPORTE' },
        { nome: 'B/L', categoria: 'BOOKING_TRANSPORTE' },
        { nome: 'Fatura / Invoice', categoria: 'FECHAMENTO_BANCARIO' },
        { nome: 'Certificado', categoria: 'DOCUMENTACAO_EXPORTACAO' },
      ],
    });
    // Busca novamente agora que a gaveta foi preenchida
    tipos = await prisma.tipoDocumento.findMany({ orderBy: { nome: 'asc' } });
  }

  // 2. Busca os dados da negociação
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
          <select name="tipoDocumentoId" className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" defaultValue="" required>
            <option value="" disabled>Selecione um item...</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>
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