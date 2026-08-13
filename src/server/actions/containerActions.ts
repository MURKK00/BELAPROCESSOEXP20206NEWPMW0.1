// LOCAL FINAL DESTE ARQUIVO: src/server/actions/containerActions.ts (arquivo NOVO)

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

type LinhaContainer = {
  id: string;
  numeroContainer: string;
  lacre: string;
  pesoBruto: number | null;
  pesoLiquido: number | null;
  totalSacos: number | null;
  tara: number | null;
};

export async function salvarContainersAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  const dadosJson = String(formData.get('containersJson') ?? '[]');
  const linhas: LinhaContainer[] = JSON.parse(dadosJson);

  await prisma.$transaction(
    linhas.map((linha) =>
      prisma.container.update({
        where: { id: linha.id },
        data: {
          numeroContainer: linha.numeroContainer || null,
          lacre: linha.lacre || null,
          pesoBruto: linha.pesoBruto ?? null,
          pesoLiquido: linha.pesoLiquido ?? null,
          totalSacos: linha.totalSacos ?? null,
          tara: linha.tara ?? null,
        },
      })
    )
  );

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'CONTAINERS_ATUALIZADOS',
      detalhe: `Dados de ${linhas.length} contêiner(es) atualizados.`,
    },
  });

  revalidatePath(`/negociacoes/${processoId}/containers`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
}
