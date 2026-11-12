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
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/admin/health') ||
    pathname.startsWith('/api/admin/backup')
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

  // Checagem estrita de limite absoluto (12 horas)
  const authCreatedAtCookie = req.cookies.get('bela_auth_created_at')?.value;
  const tokenCreatedAt = (token as any)?.authCreatedAt;
  const authCreatedAt = Number(authCreatedAtCookie || tokenCreatedAt || 0);

  const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000;
  const isExpired12h = Boolean(authCreatedAt && (Date.now() - authCreatedAt >= ABSOLUTE_TIMEOUT_MS));

  const isAuthenticated = !isExpired12h && Boolean(token || hasBelaSessionCookie || hasNextAuthCookie || hasAuthQuery);

  // Se a sessão expirou pelas 12h absolutas e tenta acessar página protegida
  if (isExpired12h && !pathname.startsWith('/login')) {
    const expiredLoginUrl = new URL('/login', req.url);
    expiredLoginUrl.searchParams.set('reason', 'session_expired');
    const redirectRes = NextResponse.redirect(expiredLoginUrl);
    redirectRes.cookies.delete('bela_session');
    redirectRes.cookies.delete('bela_user_email');
    redirectRes.cookies.delete('bela_auth_created_at');
    redirectRes.cookies.delete('next-auth.session-token');
    redirectRes.cookies.delete('__Secure-next-auth.session-token');
    return redirectRes;
  }

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

  // Se estiver autenticado e entrou com query de autorização, garante o cookie na resposta (12 horas)
  const response = NextResponse.next();
  if (hasAuthQuery || !hasBelaSessionCookie) {
    response.cookies.set('bela_session', '1', {
      path: '/',
      maxAge: 12 * 60 * 60,
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
