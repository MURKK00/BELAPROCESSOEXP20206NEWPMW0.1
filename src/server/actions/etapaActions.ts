'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

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

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: novoStatus === 'CONCLUIDA' ? 'ETAPA_CONCLUIDA' : 'ETAPA_REABERTA',
      detalhe: `Etapa "${etapa.etapaTemplate.etapa}" marcada como ${
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
