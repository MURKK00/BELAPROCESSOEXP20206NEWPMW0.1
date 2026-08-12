'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { StatusNegociacao } from '@prisma/client';

function parseSimNao(value: FormDataEntryValue | null): boolean | undefined {
  if (value === 'sim') return true;
  if (value === 'nao') return false;
  return undefined;
}

function parseDate(value: FormDataEntryValue | null): Date | undefined {
  const str = String(value ?? '');
  return str ? new Date(str) : undefined;
}

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

      localEstufagem: String(formData.get('localEstufagem') ?? '') || null,
      containerQtd: formData.get('containerQtd') ? Number(formData.get('containerQtd')) : null,
      containerTipo: String(formData.get('containerTipo') ?? "20' DRY"),
      embalagemTipo: String(formData.get('embalagemTipo') ?? 'Sacaria 30kg'),
      sacasPorContainer: formData.get('sacasPorContainer') ? Number(formData.get('sacasPorContainer')) : null,
      fumigacaoNecessaria: parseSimNao(formData.get('fumigacaoNecessaria')) ?? null,
      fumigacaoTipo: String(formData.get('fumigacaoTipo') ?? '') || null,
      fumigacaoTempoHoras: formData.get('fumigacaoTempoHoras') ? Number(formData.get('fumigacaoTempoHoras')) : 24,
      armador: String(formData.get('armador') ?? 'ONE'),

      estufagemInicio: parseDate(formData.get('estufagemInicio')) ?? null,
      estufagemFim: parseDate(formData.get('estufagemFim')) ?? null,
      mapaNaSequencia: parseSimNao(formData.get('mapaNaSequencia')) ?? null,
      ncm: String(formData.get('ncm') ?? '') || null,
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