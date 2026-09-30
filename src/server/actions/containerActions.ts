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

  await prisma.$transaction(async (tx) => {
    for (const linha of linhas) {
      const pBruto = linha.pesoBruto !== null && linha.pesoBruto !== undefined && !isNaN(Number(linha.pesoBruto)) ? Number(linha.pesoBruto) : null;
      const pLiquido = linha.pesoLiquido !== null && linha.pesoLiquido !== undefined && !isNaN(Number(linha.pesoLiquido)) ? Number(linha.pesoLiquido) : null;
      const pTara = linha.tara !== null && linha.tara !== undefined && !isNaN(Number(linha.tara)) ? Number(linha.tara) : null;
      const totSacos = linha.totalSacos !== null && linha.totalSacos !== undefined && !isNaN(Number(linha.totalSacos)) ? Math.round(Number(linha.totalSacos)) : null;

      await tx.container.update({
        where: { id: linha.id },
        data: {
          numeroContainer: linha.numeroContainer?.trim() || null,
          lacre: linha.lacre?.trim() || null,
          pesoBruto: pBruto,
          pesoLiquido: pLiquido,
          totalSacos: totSacos,
          tara: pTara,
        },
      });
    }
  });

  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'CONTAINERS_ATUALIZADOS',
      detalhe: `Dados de ${linhas.length} contêiner(es) atualizados.`,
    },
  });

  revalidatePath(`/negociacoes/${processoId}/containers`);
  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
}
