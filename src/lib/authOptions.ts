import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/passwordUtils';
import { getUserPapeis } from '@/lib/permissions';
import { getMockStore } from '@/lib/mockStore';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60, // Limite absoluto de 12 horas corridas
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== 'production' ? 'bela-cereais-export-secret-chaves-2026-seguro' : undefined),
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
        const termoCpfLimpo = termo.replace(/\D/g, '');

        const orConditions: any[] = [
          { email: termoEmail },
          { username: termoUsername },
          { username: termo },
          { nome: termo },
        ];

        if (termoCpfLimpo.length >= 9) {
          orConditions.push({ cpf: termoCpfLimpo });
          orConditions.push({ cpf: termo });
        }

        // Busca o usuário por email, username, CPF ou nome completo
        let usuario: any = null;
        try {
          usuario = await (prisma.usuario as any).findFirst({
            where: {
              OR: orConditions,
            },
          });
        } catch {
          try {
            usuario = await (prisma.usuario as any).findFirst({
              where: {
                OR: [
                  { email: termoEmail },
                  { username: termoUsername },
                  { nome: termo },
                ],
              },
            });
          } catch {}
        }

        if (!usuario) {
          usuario = await (prisma.usuario as any).findUnique({
            where: { email: termoEmail },
          });
        }

        if (!usuario) {
          usuario = await (prisma.usuario as any).findFirst({
            where: { username: termoUsername },
          });
        }

        if (!usuario && termoCpfLimpo.length >= 9) {
          try {
            usuario = await (prisma.usuario as any).findFirst({
              where: {
                OR: [{ cpf: termoCpfLimpo }, { cpf: termo }],
              },
            });
          } catch {}
        }

        if (!usuario) {
          usuario = await (prisma.usuario as any).findFirst({
            where: { nome: termo },
          });
        }

        // Fallback para mock store: apenas em desenvolvimento local
        if (!usuario && process.env.NODE_ENV !== 'production') {
          try {
            const store = getMockStore();
            usuario = (store.usuarios || []).find(
              (u: any) =>
                String(u.email || '').trim().toLowerCase() === termoEmail ||
                String(u.username || '').replace(/^@/, '').trim().toUpperCase() === termoUsername ||
                String(u.nome || '').trim().toLowerCase() === termo.toLowerCase() ||
                (termoCpfLimpo.length >= 9 && String(u.cpf || '').replace(/\D/g, '') === termoCpfLimpo)
            );
          } catch {}
        }

        if (!usuario) {
          throw new Error('Credenciais inválidas. Verifique o usuário e senha.');
        }

        if (usuario.ativo === false) {
          throw new Error('Usuário bloqueado pelo administrador. Acesso não permitido.');
        }

        // Usuário em primeiro acesso NÃO recebe sessão aqui: precisa definir a senha pessoal
        // pela tela de primeiro acesso (/api/auth/primeiro-acesso) antes de entrar.
        if (usuario.primeiroAcesso !== false) {
          throw new Error('Primeiro acesso: defina sua senha pessoal na tela de login.');
        }

        const senhaValida = usuario.senhaHash
          ? await verifyPassword(credentials.password, usuario.senhaHash)
          : false;

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
          cpf: (usuario as any).cpf || null,
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
        token.username = (user as any).username || null;
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
        const role = (token.role as string) || 'COMERCIAL';
        (session.user as any).id = token.id as string;
        (session.user as any).papel = role;
        (session.user as any).role = role;
        (session.user as any).perfil = role;
        (session.user as any).papeis = (token as any).papeis || [role];
        (session.user as any).username = (token as any).username || null;
        (session.user as any).authCreatedAt = token.authCreatedAt;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
};
