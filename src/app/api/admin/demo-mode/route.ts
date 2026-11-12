import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isDemoModeServer, setDemoModeServer } from '@/lib/demoMode'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  return NextResponse.json({ demoMode: isDemoModeServer() })
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

    const body = await req.json()
    const enabled = Boolean(body?.enabled ?? body?.demoMode)

    setDemoModeServer(enabled)

    return NextResponse.json({
      success: true,
      demoMode: isDemoModeServer(),
      message: enabled ? 'Modo Demonstração ativado.' : 'Modo Produção (Supabase) ativado.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao alterar modo de demonstração.', details: error?.message },
      { status: 500 }
    )
  }
}
