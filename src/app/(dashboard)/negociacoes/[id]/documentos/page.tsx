import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { DocumentosCockpit } from '@/components/documentos/DocumentosCockpit';

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [tipos, processo] = await Promise.all([
    prisma.tipoDocumento.findMany({ orderBy: { nome: 'asc' } }),
    prisma.processo.findUnique({
      where: { id },
      include: {
        documentos: {
          include: { tipoDocumento: true, uploadedBy: true },
          orderBy: { uploadedEm: 'desc' },
        },
      },
    }),
  ]);

  if (!processo) notFound();

  const serializedDocs = (processo.documentos || []).map((d: any) => ({
    id: d.id,
    processoId: d.processoId,
    tipoDocumentoId: d.tipoDocumentoId,
    tipoDocumento: {
      id: d.tipoDocumento?.id || 'td_unknown',
      nome: d.tipoDocumento?.nome || 'Documento',
      categoria: d.tipoDocumento?.categoria || 'DOCUMENTACAO_EXPORTACAO',
      obrigatorioNoPacoteFinal: Boolean(d.tipoDocumento?.obrigatorioNoPacoteFinal),
    },
    nomeArquivo: d.nomeArquivo || d.nome || 'arquivo.pdf',
    storagePath: d.storagePath || d.url || '/uploads/docs/arquivo.pdf',
    versao: d.versao || 1,
    status: d.status || 'EMITIDO_FINAL',
    uploadedEm: d.uploadedEm ? (typeof d.uploadedEm === 'string' ? d.uploadedEm : d.uploadedEm.toISOString()) : new Date().toISOString(),
    uploadedById: d.uploadedById || 'usr_dev_admin',
    uploadedBy: {
      id: d.uploadedBy?.id || 'usr_dev_admin',
      nome: d.uploadedBy?.nome || 'Admin (Dev)',
      email: d.uploadedBy?.email || 'dev@belacereais.local',
    },
    descricaoOutro: d.descricaoOutro || null,
  }));

  const serializedTipos = tipos.map((t) => ({
    id: t.id,
    nome: t.nome,
    categoria: t.categoria,
    obrigatorioNoPacoteFinal: t.obrigatorioNoPacoteFinal,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Dossiê & Gerenciador de Documentos (GED)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organização completa dos documentos do processo {processo.numeroProcesso}: Oficiais do Comprador, Drafts e Anexos Diversos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/instrucao-embarque/${processo.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>📄 Instrução de Embarque</span>
          </a>
          <a
            href={`/etiquetas/${processo.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>🏷️ Etiquetas Sacaria</span>
          </a>
        </div>
      </div>

      <DocumentosCockpit
        processo={{
          id: processo.id,
          numeroProcesso: processo.numeroProcesso,
          clienteFinal: processo.clienteFinal,
          enderecoBuyer: processo.enderecoBuyer,
        }}
        tipos={serializedTipos}
        documentosIniciais={serializedDocs}
      />
    </div>
  );
}
