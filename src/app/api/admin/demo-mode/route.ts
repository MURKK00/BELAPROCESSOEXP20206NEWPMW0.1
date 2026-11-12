import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Estado em memória para ambiente de desenvolvimento/demonstração
let demoModeState = false

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  return NextResponse.json({ demoMode: demoModeState, enabled: demoModeState })
}

export async function POST(req: NextRequest) {
  try {
    // Exige sessão ativa e perfil ADMIN para ativar/desativar modo demo
    const session = await getServerSession(authOptions)
    const user = session?.user as any

    if (!session || user?.perfil !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas ADMIN pode alterar o Modo Demo.' },
        { status: 403 }
      )
    }

    // Em produção na Vercel, bloqueia ativação do modo demo para sempre usar o Supabase real
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          success: false,
          demoMode: false,
          enabled: false,
          error: 'Modo Demonstração está desativado em produção para garantir gravação real no Supabase.',
        },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    demoModeState = Boolean(body?.enabled ?? body?.demoMode)

    return NextResponse.json({
      success: true,
      demoMode: demoModeState,
      enabled: demoModeState,
      message: demoModeState ? 'Modo Demonstração ativado.' : 'Modo Produção (Supabase) ativado.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao alterar modo de demonstração.', details: error?.message },
      { status: 500 }
    )
  }
}
