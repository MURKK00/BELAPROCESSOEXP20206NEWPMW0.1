import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Placeholder de autenticação. Trocar por NextAuth (Auth.js) com o adapter
 * do Prisma assim que decidirem o provedor (e-mail/senha interno, Google
 * Workspace da empresa, etc). O ponto importante da arquitetura é que
 * TODO endpoint que grava dado (POST/PATCH) chama getSessionUser() e usa o
 * id retornado para AuditLog/uploadedBy/atualizadoPor — nunca aceita esses
 * campos vindos do corpo da requisição do cliente.
 *
 * MODO DEV: enquanto o NextAuth não está plugado, retorna sempre o usuário
 * "Admin (Dev)" criado pelo seed, só para o app ser testável de ponta a
 * ponta localmente. Remover esse bypass antes de qualquer deploy real.
 */
export async function getSessionUser(_req?: NextRequest): Promise<{ id: string; papel: string } | null> {
  const devUser = await prisma.usuario.findUnique({ where: { email: 'dev@belacereais.local' } });
  if (!devUser) return null;
  return { id: devUser.id, papel: devUser.papel };
}
