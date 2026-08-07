'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function atualizarProcessoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  const deadlineStr = String(formData.get('deadlineEmbarque') ?? '');

  await prisma.processo.update({
    where: { id: processoId },
    data: {
      clienteFinal: String(formData.get('clienteFinal') ?? ''),
      traderIntermedio: String(formData.get('traderIntermedio') ?? '') || null,
      produto: String(formData.get('produto') ?? ''),
      volumeKg: Number(formData.get('volumeKg') ?? 0),
      incoterm: String(formData.get('incoterm') ?? ''),
      portoDestino: String(formData.get('portoDestino') ?? ''),
      redex: String(formData.get('redex') ?? '') || null,
      valorDeclaradoUsd: formData.get('valorDeclaradoUsd')
        ? Number(formData.get('valorDeclaradoUsd'))
        : null,
      bookingNumero: String(formData.get('bookingNumero') ?? '') || null,
      navio: String(formData.get('navio') ?? '') || null,
      deadlineEmbarque: deadlineStr ? new Date(deadlineStr) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'PROCESSO_EDITADO',
      detalhe: 'Dados do processo atualizados (cadastro / booking / navio / deadline).',
    },
  });

  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath('/negociacoes');
  revalidatePath('/');
  redirect(`/negociacoes/${processoId}`);
}

export async function atualizarStatusAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  const novoStatus = String(formData.get('status'));

  const anterior = await prisma.processo.findUnique({ where: { id: processoId } });

  await prisma.processo.update({
    where: { id: processoId },
    data: { status: novoStatus as any },
  });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'STATUS_ALTERADO',
      detalhe: `Status alterado de "${anterior?.status}" para "${novoStatus}".`,
    },
  });

  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath('/negociacoes');
  revalidatePath('/');
}