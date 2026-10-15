import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export interface SessionUser {
  id: string;
  papel: string;
  nome?: string | null;
  email?: string | null;
}

/**
 * Obtém o usuário atualmente autenticado via sessão do NextAuth.
 * Retorna null se não houver sessão ativa.
 */
export async function getSessionUser(_req?: any): Promise<SessionUser | null> {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user && (session.user as any).id) {
      return {
        id: (session.user as any).id,
        papel: (session.user as any).papel || 'ADMIN',
        nome: session.user.name,
        email: session.user.email,
      };
    }
  } catch (error) {
    console.error('[Auth] Erro ao obter sessão do NextAuth:', error);
  }

  // Fallback de desenvolvimento caso nenhuma sessão exista ainda
  const adminUser = await prisma.usuario.findFirst({
    where: { ativo: true },
  });

  if (adminUser) {
    return {
      id: adminUser.id,
      papel: adminUser.papel,
      nome: adminUser.nome,
      email: adminUser.email,
    };
  }

  return null;
}
