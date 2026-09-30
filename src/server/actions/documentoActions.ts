'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { uploadDocumentToStorage, deleteDocumentFromStorage } from '@/lib/storage';
import { buildManualUploadPath } from '@/lib/uploadPath';
import { 
  DocumentoGrupo, 
  formatDescricaoWithGrupo, 
  parseDocumentoGrupo 
} from '@/lib/documentosHelper';

export async function uploadDocumentoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  const tipoDocumentoId = String(formData.get('tipoDocumentoId'));
  const nomeDocumentoOutro = String(formData.get('nomeDocumentoOutro') || '').trim();
  const rawGrupo = String(formData.get('grupo') || 'ORIGINAIS');
  const grupo: DocumentoGrupo = (['ORIGINAIS', 'DRAFTS', 'DIVERSOS'].includes(rawGrupo) ? rawGrupo : 'ORIGINAIS') as DocumentoGrupo;
  
  const observacao = String(formData.get('observacao') ?? formData.get('descricaoOutro') ?? '').trim();
  const file = formData.get('file') as File;
  if (!file || file.size === 0) throw new Error('Selecione um arquivo.');

  const processo = await prisma.processo.findUniqueOrThrow({ where: { id: processoId } });

  let tipoDocumento;
  if (tipoDocumentoId === 'OUTRO' || !tipoDocumentoId) {
    const nomeFinal = nomeDocumentoOutro || 'Outro / Não especificado';
    tipoDocumento = await prisma.tipoDocumento.upsert({
      where: { nome: nomeFinal },
      update: {},
      create: {
        nome: nomeFinal,
        categoria: 'OUTRO',
        obrigatorioNoPacoteFinal: false,
      },
    });
  } else {
    tipoDocumento = await prisma.tipoDocumento.findUniqueOrThrow({ where: { id: tipoDocumentoId } });
  }

  const rawStoragePath = buildManualUploadPath({
    numeroProcesso: processo.numeroProcesso,
    categoria: tipoDocumento.categoria,
    tipoDocumentoNome: tipoDocumento.nome,
    dataUpload: new Date(),
    nomeArquivoOriginal: file.name,
  });

  const storagePath = await uploadDocumentToStorage(rawStoragePath, file);

  const descricaoOutro = formatDescricaoWithGrupo(grupo, observacao);
  const statusInicial = grupo === 'DRAFTS' ? 'RASCUNHO' : 'APROVADO';

  await prisma.documento.create({
    data: {
      processoId,
      tipoDocumentoId,
      nomeArquivo: file.name,
      storagePath,
      status: statusInicial as any,
      uploadedById: user.id,
      descricaoOutro,
    },
  });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'DOCUMENTO_ANEXADO',
      detalhe: `Documento "${file.name}" (${tipoDocumento.nome}) anexado no grupo [${grupo}].`,
    },
  });

  revalidatePath(`/negociacoes/${processoId}/documentos`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
}

export async function moverGrupoDocumentoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const documentoId = String(formData.get('documentoId'));
  const processoId = String(formData.get('processoId'));
  const novoGrupo = String(formData.get('novoGrupo')) as DocumentoGrupo;

  const documento = await prisma.documento.findUniqueOrThrow({
    where: { id: documentoId },
    include: { tipoDocumento: true },
  });

  const { observacaoLimpa } = parseDocumentoGrupo(documento);
  const novaDescricao = formatDescricaoWithGrupo(novoGrupo, observacaoLimpa);
  
  // Se virou draft, fica como RASCUNHO; se virou original/diverso, fica como APROVADO
  const novoStatus = novoGrupo === 'DRAFTS' ? 'RASCUNHO' : 'APROVADO';

  await prisma.documento.update({
    where: { id: documentoId },
    data: {
      descricaoOutro: novaDescricao,
      status: novoStatus as any,
    },
  });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'DOCUMENTO_RECLASSIFICADO',
      detalhe: `Documento "${documento.nomeArquivo}" movido para o grupo [${novoGrupo}].`,
    },
  });

  revalidatePath(`/negociacoes/${processoId}/documentos`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
}

export async function atualizarStatusDocumentoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const documentoId = String(formData.get('documentoId'));
  const processoId = String(formData.get('processoId'));
  const novoStatus = String(formData.get('novoStatus'));

  const documento = await prisma.documento.findUniqueOrThrow({
    where: { id: documentoId },
  });

  await prisma.documento.update({
    where: { id: documentoId },
    data: {
      status: novoStatus as any,
    },
  });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'DOCUMENTO_STATUS_ALTERADO',
      detalhe: `Status do documento "${documento.nomeArquivo}" alterado para ${novoStatus}.`,
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
