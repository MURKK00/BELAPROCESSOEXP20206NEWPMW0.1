'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function atualizarInfoOperacaoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));

  const dados = {
    clienteFinal: String(formData.get('clienteFinal') ?? ''),
    produto: String(formData.get('produto') ?? ''),
    volumeKg: Number(formData.get('volumeKg') ?? 0),
    incoterm: String(formData.get('incoterm') ?? ''),
    portoDestino: String(formData.get('portoDestino') ?? ''),
    redex: String(formData.get('redex') ?? '') || null,
    valorDeclaradoUsd: formData.get('valorDeclaradoUsd')
      ? Number(formData.get('valorDeclaradoUsd'))
      : null,
    containerQtd: formData.get('containerQtd') ? Number(formData.get('containerQtd')) : null,
    sacasPorContainer: formData.get('sacasPorContainer')
      ? Number(formData.get('sacasPorContainer'))
      : null,
    freeTimeDestino: String(formData.get('freeTimeDestino') ?? '') || null,
    ruc: String(formData.get('ruc') ?? '') || null,
    contratoInterno: String(formData.get('contratoInterno') ?? '') || null,
  };

  await prisma.processo.update({ where: { id: processoId }, data: dados });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'INFO_OPERACAO_EDITADA',
      detalhe: 'Informações da operação atualizadas.',
    },
  });

  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
  revalidatePath('/negociacoes');
}

export async function atualizarResumoTopoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  const deadlineStr = String(formData.get('deadlineEmbarque') ?? '');
  const estufagemInicioStr = String(formData.get('estufagemInicio') ?? '');
  const estufagemFimStr = String(formData.get('estufagemFim') ?? '');

  await prisma.processo.update({
    where: { id: processoId },
    data: {
      bookingNumero: String(formData.get('bookingNumero') ?? '') || null,
      navio: String(formData.get('navio') ?? '') || null,
      estufagemInicio: estufagemInicioStr ? new Date(estufagemInicioStr + 'T12:00:00Z') : null,
      estufagemFim: estufagemFimStr ? new Date(estufagemFimStr + 'T12:00:00Z') : null,
      deadlineEmbarque: deadlineStr ? new Date(deadlineStr + 'T12:00:00Z') : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'RESUMO_TOPO_EDITADO',
      detalhe: 'Booking, navio, estufagem ou deadline atualizados.',
    },
  });

  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
  revalidatePath('/negociacoes');
  revalidatePath('/');
}