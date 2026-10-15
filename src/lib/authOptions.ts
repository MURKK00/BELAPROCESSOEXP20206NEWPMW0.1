import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/passwordUtils';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'bela-cereais-export-secret-chaves-2026-seguro',
  providers: [
    CredentialsProvider({
      name: 'Credenciais',
      credentials: {
        email: { label: 'E-mail', type: 'email', placeholder: 'seu.email@belacereais.com.br' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Informe o e-mail e a senha de acesso.');
        }

        const emailNormalizado = credentials.email.trim().toLowerCase();

        // Busca o usuário no banco de dados (real ou mock)
        const usuario = await prisma.usuario.findUnique({
          where: { email: emailNormalizado },
        });

        if (!usuario) {
          throw new Error('E-mail ou senha incorretos.');
        }

        if (usuario.ativo === false) {
          throw new Error('Usuário inativo. Procure o administrador do sistema.');
        }

        // Verifica a senha criptografada com bcrypt
        const senhaValida = await verifyPassword(credentials.password, usuario.senhaHash);

        if (!senhaValida) {
          // Permite login caso a senha informada seja a senha padrão de dev se ainda não tiver hash
          if (!usuario.senhaHash && credentials.password === 'admin123') {
            return {
              id: usuario.id,
              name: usuario.nome,
              email: usuario.email,
              role: usuario.papel,
            };
          }
          throw new Error('E-mail ou senha incorretos.');
        }

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          role: usuario.papel,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'ADMIN';
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).papel = (token.role as string) || 'ADMIN';
        (session.user as any).role = (token.role as string) || 'ADMIN';
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
};
