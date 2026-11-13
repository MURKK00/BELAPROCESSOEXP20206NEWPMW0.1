// LOCAL FINAL DESTE ARQUIVO: src/server/actions/containerActions.ts (arquivo NOVO)

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { parseNumeroBR } from '@/lib/numeroBR';

type LinhaContainer = {
  id: string;
  numeroContainer: string;
  lacre: string;
  pesoBruto: number | string | null;
  pesoLiquido: number | string | null;
  totalSacos: number | string | null;
  tara: number | string | null;
};

export async function salvarContainersAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  const dadosJson = String(formData.get('containersJson') ?? '[]');
  const linhas: LinhaContainer[] = JSON.parse(dadosJson);

  await prisma.$transaction(async (tx) => {
    for (const linha of linhas) {
      const pBruto = parseNumeroBR(linha.pesoBruto);
      const pLiquido = parseNumeroBR(linha.pesoLiquido);
      const pTara = parseNumeroBR(linha.tara);
      const totSacosRaw = parseNumeroBR(linha.totalSacos);
      const totSacos = totSacosRaw !== null ? Math.round(totSacosRaw) : null;

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
