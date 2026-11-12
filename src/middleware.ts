import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Apenas rotas realmente públicas (login, assets e autenticação do NextAuth)
const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/favicon.ico',
]

// Rotas que exigem obrigatoriamente perfil ADMIN já na barreira do middleware
const ADMIN_ONLY_PATHS = [
  '/api/admin',
  '/schema-sql',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Libera arquivos estáticos do Next.js e imagens/assets públicos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  ) {
    return NextResponse.next()
  }

  // 2. Verifica se a chave NEXTAUTH_SECRET está configurada no servidor (sem fallback fixo!)
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error('[SECURITY CRITICAL] Variável NEXTAUTH_SECRET não está configurada no ambiente.')
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Erro de configuração de segurança no servidor.' },
        { status: 500 }
      )
    }
    return new NextResponse('Erro de configuração do servidor (NEXTAUTH_SECRET ausente).', {
      status: 500,
    })
  }

  // 3. Valida exclusivamente o token JWT assinado pelo NextAuth (sem ?auth=1 e sem cookie bela_session falso)
  let token = null
  try {
    token = await getToken({ req: request, secret })
  } catch (error) {
    token = null
  }

  // 4. Se não estiver logado, bloqueia na hora
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado. Faça login.' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 5. Se a rota for de administração, exige que o usuário tenha perfil ADMIN
  const isAdminRoute = ADMIN_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  if (isAdminRoute && (token as any).perfil !== 'ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Acesso negado. Exclusivo para administradores.' },
        { status: 403 }
      )
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
