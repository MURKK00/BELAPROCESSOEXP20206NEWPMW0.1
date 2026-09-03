'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateImportadorAction(formData: FormData) {
  const id = formData.get('id') as string;
  
  await prisma.processo.update({
    where: { id },
    data: {
      enderecoBuyer: (formData.get('enderecoBuyer') as string) || null,
      iecBuyer: (formData.get('iecBuyer') as string) || null,
      fassaiBuyer: (formData.get('fassaiBuyer') as string) || null,
      panBuyer: (formData.get('panBuyer') as string) || null,
      gstBuyer: (formData.get('gstBuyer') as string) || null,
      emailBuyer: (formData.get('emailBuyer') as string) || null,
      telefoneBuyer: (formData.get('telefoneBuyer') as string) || null,
    },
  });

  revalidatePath(`/negociacoes/${id}/importador`);
  revalidatePath(`/negociacoes/${id}/documentos`);
}