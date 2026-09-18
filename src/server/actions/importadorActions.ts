"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function atualizarImportadorAction(formData: FormData) {
  const processoId = formData.get('processoId') as string;

  if (!processoId) {
    throw new Error('ID do processo é obrigatório');
  }

  // Atualiza os dados no banco usando as variáveis exatas do nosso schema.prisma
  await prisma.processo.update({
    where: { id: processoId },
    data: {
      enderecoBuyer: formData.get('enderecoBuyer') as string || null,
      complementoBuyer: formData.get('complementoBuyer') as string || null,
      cidadeBuyer: formData.get('cidadeBuyer') as string || null,
      paisBuyer: formData.get('paisBuyer') as string || null,
      iecBuyer: formData.get('iecBuyer') as string || null,
      panBuyer: formData.get('panBuyer') as string || null,
      fassaiBuyer: formData.get('fassaiBuyer') as string || null,
      gstBuyer: formData.get('gstBuyer') as string || null,
      emailBuyer: formData.get('emailBuyer') as string || null,
      telefoneBuyer: formData.get('telefoneBuyer') as string || null,
    }
  });

  // Limpa o cache para a tela atualizar na hora
  revalidatePath(`/negociacoes/${processoId}`);
}