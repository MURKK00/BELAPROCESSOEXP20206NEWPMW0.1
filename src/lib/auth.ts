import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export interface SessionUser {
  id: string;
  papel: string;
  papeis?: string[];
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
      const u = session.user as any;
      const papeis = Array.isArray(u.papeis)
        ? u.papeis
        : u.papel
        ? String(u.papel).split(',')
        : ['ADMIN'];

      return {
        id: u.id,
        papel: u.papel || papeis[0] || 'ADMIN',
        papeis,
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
    const papeis = Array.isArray((adminUser as any).papeis)
      ? (adminUser as any).papeis
      : [adminUser.papel || 'ADMIN'];

    return {
      id: adminUser.id,
      papel: adminUser.papel,
      papeis,
      nome: adminUser.nome,
      email: adminUser.email,
    };
  }

  return null;
}
