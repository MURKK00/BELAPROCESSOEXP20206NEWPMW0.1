'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { formatBRL } from '@/lib/formatters';

export async function atualizarCustoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const custoItemId = String(formData.get('custoItemId'));
  const processoId = String(formData.get('processoId'));
  const novoValor = Number(formData.get('valor'));

  const anterior = await prisma.custoItem.findUnique({ where: { id: custoItemId } });
  const atualizado = await prisma.custoItem.update({
    where: { id: custoItemId },
    data: { valor: novoValor, atualizadoPorId: user.id },
  });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'FINANCEIRO_EDITADO',
      detalhe: `Custo "${atualizado.categoria}" alterado de ${formatBRL(
        Number(anterior?.valor ?? 0)
      )} para ${formatBRL(Number(atualizado.valor))}.`,
    },
  });

  revalidatePath(`/negociacoes/${processoId}/financeiro`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
}

export async function atualizarPrecoPtaxAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const financeiroId = String(formData.get('financeiroId'));
  const campo = String(formData.get('campo')) as 'precoUsd' | 'ptax';
  const novoValor = Number(formData.get('novoValor'));

  const financeiro = await prisma.financeiro.update({
    where: { id: financeiroId },
    data: { [campo]: novoValor },
  });

  await prisma.auditLog.create({
    data: {
      processoId: financeiro.processoId,
      usuarioId: user.id,
      acao: 'FINANCEIRO_EDITADO',
      detalhe: `${campo === 'precoUsd' ? 'Preço unitário USD' : 'PTAX'} alterado para ${novoValor}.`,
    },
  });

  revalidatePath(`/negociacoes/${financeiro.processoId}/financeiro`);
  revalidatePath(`/negociacoes/${financeiro.processoId}/auditoria`);
}
