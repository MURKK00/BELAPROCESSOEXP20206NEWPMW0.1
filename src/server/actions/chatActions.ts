'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function enviarMensagemAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  const texto = String(formData.get('texto') ?? '').trim();
  if (!texto) return;

  await prisma.chatMessage.create({
    data: { processoId, autorId: user.id, texto },
  });

  revalidatePath(`/negociacoes/${processoId}/chat`);
}
