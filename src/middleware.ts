import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET || 'bela-cereais-export-secret-chaves-2026-seguro';

  // Rotas de autenticação (NextAuth), cotações ao vivo, backoffice TV, bancos e webhooks externos não devem ser bloqueados
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/cotacoes') ||
    pathname.startsWith('/api/backoffice') ||
    pathname.startsWith('/api/bancos') ||
    pathname.startsWith('/api/webhooks')
  ) {
    return NextResponse.next();
  }

  // Verifica sinais de autenticação compatíveis com iframes e navegadores restritos
  const hasAuthQuery = req.nextUrl.searchParams.get('auth') === '1';
  const hasBelaSessionCookie = req.cookies.has('bela_session');
  const hasNextAuthCookie =
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token');

  let token = null;
  try {
    token = await getToken({ req, secret });
    if (!token) {
      token = await getToken({ req, secret, secureCookie: true });
    }
  } catch {
    // Ignora erro de token jwt
  }

  const isAuthenticated = Boolean(token || hasBelaSessionCookie || hasNextAuthCookie || hasAuthQuery);

  // Se o usuário já estiver logado e tentar acessar a página de login, redireciona para a home
  if (pathname.startsWith('/login')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Se não estiver logado, redireciona para a página de login com callbackUrl
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    const destination = req.nextUrl.pathname + req.nextUrl.search;
    loginUrl.searchParams.set('callbackUrl', destination);
    return NextResponse.redirect(loginUrl);
  }

  // Se estiver autenticado e entrou com query de autorização, garante o cookie na resposta
  const response = NextResponse.next();
  if (hasAuthQuery || !hasBelaSessionCookie) {
    response.cookies.set('bela_session', '1', {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'none',
      secure: true,
      httpOnly: false,
    });
  }

  return response;
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
