import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/passwordUtils';
import { getUserPapeis } from '@/lib/permissions';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60, // Limite absoluto de 12 horas corridas
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'bela-cereais-export-secret-chaves-2026-seguro',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credenciais',
      credentials: {
        email: { label: 'Usuário ou E-mail', type: 'text', placeholder: 'Usuário ou e-mail' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = credentials?.email;
        if (!identifier || !credentials?.password) {
          throw new Error('Informe o usuário ou e-mail e a senha de acesso.');
        }

        const termo = identifier.trim();
        const termoEmail = termo.toLowerCase();
        const termoUsername = termo.replace(/^@/, '').toUpperCase();

        // Busca o usuário por email, username ou nome completo
        let usuario = await prisma.usuario.findFirst({
          where: {
            OR: [
              { email: termoEmail },
              { username: termoUsername },
              { nome: termo },
            ],
          },
        });

        if (!usuario) {
          usuario = await prisma.usuario.findUnique({
            where: { email: termoEmail },
          });
        }

        if (!usuario) {
          usuario = await prisma.usuario.findFirst({
            where: { username: termoUsername },
          });
        }

        if (!usuario) {
          usuario = await prisma.usuario.findFirst({
            where: { nome: termo },
          });
        }

        if (!usuario) {
          throw new Error('Credenciais inválidas. Verifique o usuário e senha.');
        }

        if (usuario.ativo === false) {
          throw new Error('Usuário inativo. Procure o administrador do sistema.');
        }

        if (!usuario.senhaHash) {
          throw new Error('Credenciais inválidas. Verifique o usuário e senha.');
        }

        // Verifica a senha criptografada estritamente com bcrypt para este usuário
        const senhaValida = await verifyPassword(credentials.password, usuario.senhaHash);

        if (!senhaValida) {
          throw new Error('Credenciais inválidas. Verifique o usuário e senha.');
        }

        const papeis = getUserPapeis(usuario);
        const papelBanco = usuario.papel || papeis[0] || 'COMERCIAL';

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          username: (usuario as any).username || null,
          role: papelBanco,
          papel: papelBanco,
          papeis,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || (user as any).papel || 'COMERCIAL';
        token.papeis = (user as any).papeis || [token.role];
        token.name = user.name;
        token.email = user.email;
        token.authCreatedAt = Date.now();
      }
      // Verificação estrita de Limite Absoluto de 12 horas
      if (token?.authCreatedAt && typeof token.authCreatedAt === 'number') {
        const elapsed = Date.now() - token.authCreatedAt;
        if (elapsed > 12 * 60 * 60 * 1000) {
          // Token expirado absolutamente
          return {} as any;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.id) {
        (session.user as any).id = token.id as string;
        (session.user as any).papel = (token.role as string) || 'COMERCIAL';
        (session.user as any).role = (token.role as string) || 'COMERCIAL';
        (session.user as any).papeis = (token as any).papeis || [(token.role as string) || 'COMERCIAL'];
        (session.user as any).authCreatedAt = token.authCreatedAt;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
};
