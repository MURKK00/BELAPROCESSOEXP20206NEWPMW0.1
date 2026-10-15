import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET || 'bela-cereais-export-secret-chaves-2026-seguro';

  // Obtém o token JWT decodificado do NextAuth
  const token = await getToken({
    req,
    secret,
  });

  // Se o usuário já estiver logado e tentar acessar a página de login, redireciona para a home
  if (pathname.startsWith('/login')) {
    if (token) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Rotas de autenticação (NextAuth) e webhooks externos não devem ser bloqueados
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  // Se não estiver logado, redireciona para a página de login com callbackUrl
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    const destination = req.nextUrl.pathname + req.nextUrl.search;
    loginUrl.searchParams.set('callbackUrl', destination);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas internas do sistema, exceto:
     * - api/auth (endpoints de autenticação)
     * - _next/static (arquivos estáticos compilados)
     * - _next/image (otimização de imagens)
     * - favicon.ico (ícone do navegador)
     * - arquivos de mídia/imagens públicas (*.png, *.jpg, *.svg, *.webp, *.ico)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
