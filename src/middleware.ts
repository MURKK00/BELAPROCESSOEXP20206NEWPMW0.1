import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { canAccessBackoffice, isAdmin, isBackofficeTvOnly } from '@/lib/permissions'

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/api/webhooks', // n8n: autenticado por N8N_WEBHOOK_SECRET dentro da própria rota
  '/favicon.ico',
]

const ADMIN_ONLY_PATHS = [
  '/api/admin',
  '/schema-sql',
]

function isUserAdmin(token: any): boolean {
  if (!token) return false
  if (token.papel === 'ADMIN' || token.perfil === 'ADMIN' || token.role === 'ADMIN') return true
  if (isAdmin(token)) return true
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

  const secret =
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== 'production' ? 'bela-cereais-export-secret-chaves-2026-seguro' : undefined)

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
    token = await getToken({ req: request, secret, cookieName: 'next-auth.session-token' })
    if (!token) {
      token = await getToken({ req: request, secret })
    }
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

  // Proteção estrita da rota Backoffice TV e API de métricas (somente ADMIN e BACKOFFICE_TV)
  const isBackofficePage = pathname === '/backoffice' || pathname.startsWith('/backoffice/')
  const isBackofficeApi = pathname === '/api/backoffice' || pathname.startsWith('/api/backoffice/')

  if (isBackofficeApi && !canAccessBackoffice(token)) {
    return NextResponse.json(
      { error: 'Acesso negado ao Backoffice TV.' },
      { status: 403 }
    )
  }

  if (isBackofficePage && !canAccessBackoffice(token)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Isolamento para perfil exclusivo BACKOFFICE_TV: mantém acesso apenas ao /backoffice e APIs necessárias
  if (isBackofficeTvOnly(token)) {
    const isCotacoesApi = pathname === '/api/cotacoes' || pathname.startsWith('/api/cotacoes/')
    if (pathname.startsWith('/api/')) {
      if (!isBackofficeApi && !isCotacoesApi) {
        return NextResponse.json(
          { error: 'Acesso restrito ao módulo Backoffice TV.' },
          { status: 403 }
        )
      }
    } else if (!isBackofficePage) {
      return NextResponse.redirect(new URL('/backoffice', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
