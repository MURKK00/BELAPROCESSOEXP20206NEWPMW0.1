'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { isAdmin, isDiretoria } from '@/lib/permissions';
import { seedEtapaTemplatesIdempotente } from '@/server/services/etapaTemplateService';

/**
 * Marca/desmarca uma etapa do checklist. Ao contrário do rascunho HTML,
 * o log de auditoria é criado aqui, no servidor, a partir do usuário da
 * sessão — nunca vem pronto do client.
 */
export async function marcarEtapaAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const etapaId = String(formData.get('etapaId'));
  const processoId = String(formData.get('processoId'));
  const novoStatus = String(formData.get('novoStatus')) as 'CONCLUIDA' | 'PENDENTE';

  const etapa = await prisma.processoEtapa.update({
    where: { id: etapaId },
    data: {
      status: novoStatus,
      concluidoEm: novoStatus === 'CONCLUIDA' ? new Date() : null,
      responsavelId: user.id,
    },
    include: { etapaTemplate: true },
  });

  const nomeEtapa = etapa?.etapaTemplate?.etapa || 'Etapa Operacional';

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: novoStatus === 'CONCLUIDA' ? 'ETAPA_CONCLUIDA' : 'ETAPA_REABERTA',
      detalhe: `Etapa "${nomeEtapa}" marcada como ${
        novoStatus === 'CONCLUIDA' ? 'concluída' : 'pendente'
      }.`,
    },
  });

  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/negociacoes/${processoId}/checklist`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
  revalidatePath('/');
  revalidatePath('/negociacoes');
}

/**
 * Conclui ou reabre todas as etapas pertencentes a um macro-marco de uma só vez
 */
export async function marcarLoteEtapasAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  const etapaIdsJson = String(formData.get('etapaIds'));
  const novoStatus = String(formData.get('novoStatus')) as 'CONCLUIDA' | 'PENDENTE';
  const nomeMarco = String(formData.get('nomeMarco') || 'Marco Operacional');

  let etapaIds: string[] = [];
  try {
    etapaIds = JSON.parse(etapaIdsJson);
  } catch {
    return;
  }

  if (etapaIds.length === 0) return;

  await prisma.processoEtapa.updateMany({
    where: {
      id: { in: etapaIds },
      processoId: processoId,
    },
    data: {
      status: novoStatus,
      concluidoEm: novoStatus === 'CONCLUIDA' ? new Date() : null,
      responsavelId: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: novoStatus === 'CONCLUIDA' ? 'MARCO_CONCLUIDO' : 'MARCO_REABERTO',
      detalhe: `${nomeMarco}: ${etapaIds.length} tarefas marcadas como ${novoStatus === 'CONCLUIDA' ? 'concluídas' : 'pendentes'}.`,
    },
  });

  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/negociacoes/${processoId}/checklist`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
  revalidatePath('/');
  revalidatePath('/negociacoes');
}

/**
 * Permite avançar ou definir diretamente o Marco do Processo
 */
export async function avancarMarcoStatusAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  const novoStatus = String(formData.get('novoStatus'));
  const nomeMarco = String(formData.get('nomeMarco'));

  const anterior = await prisma.processo.findUnique({
    where: { id: processoId },
    select: { status: true },
  });

  await prisma.processo.update({
    where: { id: processoId },
    data: { status: novoStatus as any },
  });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'STATUS_ALTERADO',
      detalhe: `Marco operacional alterado para "${nomeMarco}" (Status: ${novoStatus}).`,
      alteracoes: {
        'Status do Processo': {
          de: anterior?.status || 'Não definido',
          para: novoStatus,
        },
      },
    },
  });

  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/negociacoes/${processoId}/checklist`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
  revalidatePath('/negociacoes');
  revalidatePath('/');
}

/**
 * Gera de forma idempotente as etapas faltantes do checklist para uma negociação.
 * Permitido apenas para ADMIN ou DIRETORIA. Se EtapaTemplate estiver vazia e o
 * usuário for ADMIN, executa o seed idempotente antes de gerar as tarefas.
 */
export async function gerarChecklistProcessoAction(processoId: string): Promise<{
  success?: boolean;
  criadas?: number;
  error?: string;
}> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { error: 'Sessão expirada ou usuário não autenticado. Faça login novamente.' };
    }

    const userIsAdmin = isAdmin(user);
    const userIsDiretoria = isDiretoria(user);
    if (!userIsAdmin && !userIsDiretoria) {
      return { error: 'Permissão negada. Apenas ADMIN ou DIRETORIA podem gerar o checklist.' };
    }

    const processo = await prisma.processo.findUnique({
      where: { id: processoId },
      select: { id: true, numeroProcesso: true },
    });
    if (!processo) {
      return { error: 'Negociação não encontrada.' };
    }

    let templates = await prisma.etapaTemplate.findMany({
      orderBy: { ordem: 'asc' },
    });

    if (templates.length === 0) {
      if (userIsAdmin) {
        await seedEtapaTemplatesIdempotente();
        templates = await prisma.etapaTemplate.findMany({
          orderBy: { ordem: 'asc' },
        });
      } else {
        return {
          error:
            'Nenhum template de etapa está cadastrado no banco de dados. Solicite a um ADMIN para inicializar os templates ou clicar em gerar checklist.',
        };
      }
    }

    if (templates.length === 0) {
      return { error: 'Não foi possível carregar os templates padrão de checklist.' };
    }

    const existentes = await prisma.processoEtapa.findMany({
      where: { processoId },
      select: { etapaTemplateId: true },
    });
    const existentesSet = new Set(existentes.map((e) => e.etapaTemplateId));

    const faltantes = templates.filter((t) => !existentesSet.has(t.id));

    if (faltantes.length > 0) {
      await prisma.processoEtapa.createMany({
        data: faltantes.map((t) => ({
          processoId,
          etapaTemplateId: t.id,
          status: 'PENDENTE' as const,
        })),
        skipDuplicates: true,
      });

      await prisma.auditLog.create({
        data: {
          processoId,
          usuarioId: user.id,
          acao: 'CHECKLIST_GERADO',
          detalhe: `Checklist gerado sob demanda: ${faltantes.length} tarefa(s) criada(s) para o processo ${processo.numeroProcesso}.`,
        },
      });
    }

    revalidatePath(`/negociacoes/${processoId}`);
    revalidatePath(`/negociacoes/${processoId}/checklist`);
    revalidatePath(`/negociacoes/${processoId}/auditoria`);
    revalidatePath('/negociacoes');
    revalidatePath('/');

    return { success: true, criadas: faltantes.length };
  } catch (err: any) {
    console.error('[gerarChecklistProcessoAction] Erro:', err);
    return { error: err?.message || 'Erro ao gerar checklist desta negociação.' };
  }
}

