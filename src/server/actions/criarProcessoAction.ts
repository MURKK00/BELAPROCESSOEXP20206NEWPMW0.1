'use server';

import { redirect } from 'next/navigation';
import { criarProcesso } from '@/server/services/processoService';
import { getSessionUser } from '@/lib/auth';

export async function criarProcessoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado — rode o seed (npm run db:seed) para criar o usuário de dev.');

  const processo = await criarProcesso({
    clienteFinal: String(formData.get('clienteFinal') ?? ''),
    traderIntermedio: String(formData.get('traderIntermedio') ?? '') || undefined,
    produto: String(formData.get('produto') ?? ''),
    volumeKg: Number(formData.get('volumeKg') ?? 0),
    incoterm: String(formData.get('incoterm') ?? ''),
    portoDestino: String(formData.get('portoDestino') ?? ''),
    redex: String(formData.get('redex') ?? '') || undefined,
    valorDeclaradoUsd: formData.get('valorDeclaradoUsd')
      ? Number(formData.get('valorDeclaradoUsd'))
      : undefined,
    criadoPorId: user.id,
  });

  redirect(`/negociacoes/${processo.id}`);
}
