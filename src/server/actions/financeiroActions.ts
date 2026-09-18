"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CategoriaCusto } from '@prisma/client';

// Salva automaticamente o banco ou o status de recebimento ao alterar
export async function atualizarFinanceiroConfigAction(
  processoId: string, 
  dados: { bancoDestino?: string; statusRecebimento?: string }
) {
  if (!processoId) return;

  await prisma.financeiro.upsert({
    where: { processoId },
    update: dados,
    create: {
      processoId,
      precoUsd: 0,
      bancoDestino: dados.bancoDestino || 'BB BRASIL',
      statusRecebimento: dados.statusRecebimento || 'A_RECEBER'
    }
  });

  revalidatePath(`/negociacoes/${processoId}/financeiro`);
}

export async function adicionarTravamentoAction(formData: FormData) {
  const processoId = formData.get('processoId') as string;
  const financeiroId = formData.get('financeiroId') as string;
  const valorUsdParcial = Number(formData.get('valorUsdParcial'));
  const ptax = Number(formData.get('ptax'));
  const observacao = formData.get('observacao') as string;

  if (!financeiroId || !valorUsdParcial || !ptax) return;

  await prisma.cambioTravado.create({
    data: { 
      financeiroId, 
      valorUsdParcial, 
      ptax, 
      observacao 
    }
  });
  revalidatePath(`/negociacoes/${processoId}/financeiro`);
}

export async function deletarTravamentoAction(formData: FormData) {
  const travamentoId = formData.get('travamentoId') as string;
  const processoId = formData.get('processoId') as string;
  if (!travamentoId) return;

  await prisma.cambioTravado.delete({ where: { id: travamentoId } });
  revalidatePath(`/negociacoes/${processoId}/financeiro`);
}

export async function salvarCustoAction(formData: FormData) {
  const processoId = formData.get('processoId') as string;
  const financeiroId = formData.get('financeiroId') as string;
  const categoria = formData.get('categoria') as CategoriaCusto;
  const valor = Number(formData.get('valor')) || 0;

  if (!financeiroId || !categoria) return;

  let usuario = await prisma.usuario.findFirst();
  if (!usuario) throw new Error("Nenhum usuário cadastrado.");

  await prisma.custoItem.upsert({
    where: { financeiroId_categoria: { financeiroId, categoria } },
    update: { valor },
    create: { financeiroId, categoria, valor, atualizadoPorId: usuario.id }
  });

  revalidatePath(`/negociacoes/${processoId}/financeiro`);
}