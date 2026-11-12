import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/favicon.ico',
]

const ADMIN_ONLY_PATHS = [
  '/api/admin',
  '/schema-sql',
]

function isUserAdmin(token: any): boolean {
  if (!token) return false
  if (token.papel === 'ADMIN' || token.perfil === 'ADMIN' || token.role === 'ADMIN') return true
  if (Array.isArray(token.papeis) && token.papeis.includes('ADMIN')) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  ) {
    return NextResponse.next()
  }

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

  let token = null
  try {
    token = await getToken({ req: request, secret })
  } catch {
    token = null
  }

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado. Faça login.' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const isAdminRoute = ADMIN_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  if (isAdminRoute && !isUserAdmin(token)) {
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
