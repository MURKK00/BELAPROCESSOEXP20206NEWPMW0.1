import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Reexporta authOptions para que qualquer arquivo possa importar de '@/lib/auth'
export { authOptions };

export interface SessionUser {
  id: string;
  papel: string;
  papeis?: string[];
  nome?: string | null;
  email?: string | null;
}

/**
 * Obtém o usuário atualmente autenticado via sessão real do NextAuth.
 * Retorna null se não houver sessão ativa (sem fallback de login automático em produção!).
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
        : u.perfil
        ? [String(u.perfil)]
        : ['VISUALIZADOR'];

      return {
        id: u.id,
        papel: u.papel || u.perfil || papeis[0] || 'VISUALIZADOR',
        papeis,
        nome: session.user.name,
        email: session.user.email,
      };
    }
  } catch (error) {
    console.error('[Auth] Erro ao obter sessão do NextAuth:', error);
  }

  return null;
}
