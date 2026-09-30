"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CategoriaCusto } from '@prisma/client';
import { formatObservacaoWithTaxa } from '@/lib/travamentoHelper';
import { parseBRLToNumber } from '@/lib/formatters';

// Salva automaticamente o banco, o status de recebimento ou a data de recebimento ao alterar
export async function atualizarFinanceiroConfigAction(
  processoId: string, 
  dados: { bancoDestino?: string; statusRecebimento?: string; dataRecebimento?: string | null }
) {
  if (!processoId) return;

  const updateData: any = {};
  if (dados.bancoDestino !== undefined) updateData.bancoDestino = dados.bancoDestino;
  if (dados.statusRecebimento !== undefined) updateData.statusRecebimento = dados.statusRecebimento;
  
  if (dados.dataRecebimento !== undefined) {
    if (dados.dataRecebimento) {
      updateData.dataRecebimento = new Date(dados.dataRecebimento + (dados.dataRecebimento.includes('T') ? '' : 'T12:00:00Z'));
    } else {
      updateData.dataRecebimento = null;
    }
  }

  try {
    await prisma.financeiro.upsert({
      where: { processoId },
      update: updateData,
      create: {
        processoId,
        precoUsd: 0,
        bancoDestino: dados.bancoDestino || 'BB BRASIL',
        statusRecebimento: dados.statusRecebimento || 'A_RECEBER',
        dataRecebimento: updateData.dataRecebimento ?? null,
      } as any
    });
  } catch (err: any) {
    console.warn('[Financeiro] Falha com dataRecebimento, tentando fallback:', err?.message);
    const fallbackUpdate = { ...updateData };
    delete fallbackUpdate.dataRecebimento;
    await prisma.financeiro.upsert({
      where: { processoId },
      update: fallbackUpdate,
      create: {
        processoId,
        precoUsd: 0,
        bancoDestino: dados.bancoDestino || 'BB BRASIL',
        statusRecebimento: dados.statusRecebimento || 'A_RECEBER',
      }
    });
  }

  revalidatePath(`/negociacoes/${processoId}/financeiro`);
  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/financeiro`);
}

export async function salvarBancoDestinoAction(formData: FormData) {
  const processoId = formData.get('processoId') as string;
  const bancoDestino = formData.get('bancoDestino') as string;
  if (!processoId) return;

  await atualizarFinanceiroConfigAction(processoId, { bancoDestino });
}

export async function adicionarTravamentoAction(formData: FormData) {
  const processoId = formData.get('processoId') as string;
  let financeiroId = formData.get('financeiroId') as string;
  const valorUsdParcial = parseBRLToNumber(formData.get('valorUsdParcial'));
  const ptax = parseBRLToNumber(formData.get('ptax'));
  const taxa = parseBRLToNumber(formData.get('taxa'));
  const moedaTaxa = (formData.get('moedaTaxa') as string) || 'USD';
  const dataTravaRaw = formData.get('dataTrava') as string;
  const observacao = (formData.get('observacao') as string) || '';

  if (!financeiroId && processoId) {
    const fin = await prisma.financeiro.findUnique({ where: { processoId } });
    if (fin) {
      financeiroId = fin.id;
    } else {
      const novo = await prisma.financeiro.create({
        data: { processoId, precoUsd: 0, bancoDestino: 'BB BRASIL', statusRecebimento: 'A_RECEBER' }
      });
      financeiroId = novo.id;
    }
  }

  if (!financeiroId || !valorUsdParcial || !ptax) return;

  const dataTravamento = dataTravaRaw
    ? new Date(dataTravaRaw + (dataTravaRaw.includes('T') ? '' : 'T12:00:00Z'))
    : new Date();

  // Se taxa for em USD: (USD - TaxaUSD) * PTAX
  // Se taxa for em BRL: (USD * PTAX) - TaxaBRL
  const valorLiquido = moedaTaxa === 'USD'
    ? Math.max(0, valorUsdParcial - taxa) * ptax
    : Math.max(0, (valorUsdParcial * ptax) - taxa);

  const observacaoComTag = formatObservacaoWithTaxa(observacao, taxa, moedaTaxa as any, valorLiquido);

  try {
    await prisma.cambioTravado.create({
      data: { 
        financeiroId, 
        valorUsdParcial, 
        ptax,
        taxa,
        moedaTaxa,
        valorLiquido,
        dataTravamento,
        observacao: observacaoComTag,
      } as any
    });
  } catch (err: any) {
    console.warn('[Financeiro] Falha ao gravar colunas taxa/moedaTaxa no banco, utilizando fallback na observação:', err?.message);
    await prisma.cambioTravado.create({
      data: { 
        financeiroId, 
        valorUsdParcial, 
        ptax,
        dataTravamento,
        observacao: observacaoComTag,
      }
    });
  }

  revalidatePath(`/negociacoes/${processoId}/financeiro`);
  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/financeiro`);
}

export async function deletarTravamentoAction(formData: FormData) {
  const travamentoId = formData.get('travamentoId') as string;
  const processoId = formData.get('processoId') as string;
  if (!travamentoId) return;

  await prisma.cambioTravado.delete({ where: { id: travamentoId } });
  revalidatePath(`/negociacoes/${processoId}/financeiro`);
  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/financeiro`);
}

export async function editarTravamentoAction(formData: FormData) {
  const travamentoId = formData.get('travamentoId') as string;
  const processoId = formData.get('processoId') as string;
  const valorUsdParcial = parseBRLToNumber(formData.get('valorUsdParcial'));
  const ptax = parseBRLToNumber(formData.get('ptax'));
  const taxa = parseBRLToNumber(formData.get('taxa'));
  const moedaTaxa = (formData.get('moedaTaxa') as string) || 'USD';
  const dataTravaRaw = formData.get('dataTrava') as string;
  const observacao = (formData.get('observacao') as string) || '';

  if (!travamentoId || !processoId || !valorUsdParcial || !ptax) return;

  const dataTravamento = dataTravaRaw
    ? new Date(dataTravaRaw + (dataTravaRaw.includes('T') ? '' : 'T12:00:00Z'))
    : new Date();

  const valorLiquido = moedaTaxa === 'USD'
    ? Math.max(0, valorUsdParcial - taxa) * ptax
    : Math.max(0, (valorUsdParcial * ptax) - taxa);

  const observacaoComTag = formatObservacaoWithTaxa(observacao, taxa, moedaTaxa as any, valorLiquido);

  try {
    await prisma.cambioTravado.update({
      where: { id: travamentoId },
      data: {
        valorUsdParcial,
        ptax,
        taxa,
        moedaTaxa,
        valorLiquido,
        dataTravamento,
        observacao: observacaoComTag,
      } as any,
    });
  } catch (err: any) {
    console.warn('[Financeiro] Falha ao atualizar colunas taxa/moedaTaxa, usando fallback:', err?.message);
    await prisma.cambioTravado.update({
      where: { id: travamentoId },
      data: {
        valorUsdParcial,
        ptax,
        dataTravamento,
        observacao: observacaoComTag,
      },
    });
  }

  revalidatePath(`/negociacoes/${processoId}/financeiro`);
  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/financeiro`);
}

export async function salvarCustoAction(formData: FormData) {
  const processoId = formData.get('processoId') as string;
  const financeiroId = formData.get('financeiroId') as string;
  const categoria = formData.get('categoria') as CategoriaCusto;
  const valor = parseBRLToNumber(formData.get('valor'));

  if (!financeiroId || !categoria) return;

  let usuario = await prisma.usuario.findFirst();
  if (!usuario) throw new Error("Nenhum usuário cadastrado.");

  await prisma.custoItem.upsert({
    where: { financeiroId_categoria: { financeiroId, categoria } },
    update: { valor },
    create: { financeiroId, categoria, valor, atualizadoPorId: usuario.id }
  });

  revalidatePath(`/negociacoes/${processoId}/financeiro`);
  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/financeiro`);
}
