'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { uploadDocumentToStorage, deleteDocumentFromStorage } from '@/lib/storage';
import { buildManualUploadPath } from '@/lib/uploadPath';

export async function uploadDocumentoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  const tipoDocumentoId = String(formData.get('tipoDocumentoId'));
  const descricaoOutro = String(formData.get('descricaoOutro') ?? '') || null;
  const file = formData.get('file') as File;
  if (!file || file.size === 0) throw new Error('Selecione um arquivo.');

  const [processo, tipoDocumento] = await Promise.all([
    prisma.processo.findUniqueOrThrow({ where: { id: processoId } }),
    prisma.tipoDocumento.findUniqueOrThrow({ where: { id: tipoDocumentoId } }),
  ]);

  const storagePath = buildManualUploadPath({
    numeroProcesso: processo.numeroProcesso,
    categoria: tipoDocumento.categoria,
    tipoDocumentoNome: tipoDocumento.nome,
    dataUpload: new Date(),
    nomeArquivoOriginal: file.name,
  });

  await uploadDocumentToStorage(storagePath, file);

  await prisma.documento.create({
    data: {
      processoId,
      tipoDocumentoId,
      nomeArquivo: file.name,
      storagePath,
      status: 'APROVADO',
      uploadedById: user.id,
      descricaoOutro,
    },
  });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'DOCUMENTO_ANEXADO',
      detalhe: `Documento "${file.name}" (${tipoDocumento.nome}${descricaoOutro ? `: ${descricaoOutro}` : ''}) anexado.`,
    },
  });

  revalidatePath(`/negociacoes/${processoId}/documentos`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
}

export async function excluirDocumentoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const documentoId = String(formData.get('documentoId'));
  const processoId = String(formData.get('processoId'));

  const documento = await prisma.documento.findUniqueOrThrow({
    where: { id: documentoId },
    include: { tipoDocumento: true },
  });

  try {
    await deleteDocumentFromStorage(documento.storagePath);
  } catch (err) {
    console.error('Falha ao remover arquivo do storage:', err);
  }

  await prisma.documento.delete({ where: { id: documentoId } });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'DOCUMENTO_EXCLUIDO',
      detalhe: `Documento "${documento.nomeArquivo}" (${documento.tipoDocumento.nome}) excluído.`,
    },
  });

  revalidatePath(`/negociacoes/${processoId}/documentos`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
}