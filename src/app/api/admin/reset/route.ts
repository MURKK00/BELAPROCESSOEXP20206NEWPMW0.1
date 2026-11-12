import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // 1. Verifica sessão real no servidor
    const session = await getServerSession()
    const user = session?.user as any

    if (!session || (user?.perfil && user?.perfil !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores autenticados podem executar esta ação.' },
        { status: 403 }
      )
    }

    // 2. Trava de segurança em produção (evita apagar dados reais na Vercel por acidente)
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_RESET !== 'true') {
      return NextResponse.json(
        {
          error:
            'Reset bloqueado em produção por segurança. Para liberar temporariamente, defina ALLOW_ADMIN_RESET=true nas variáveis da Vercel.',
        },
        { status: 403 }
      )
    }

    // 3. Executa limpeza das tabelas operacionais mantendo os usuários atuais intactos
    const db = prisma as any
    await prisma.$transaction([
      db.custoItem.deleteMany({}),
      db.cambioTravado.deleteMany({}),
      db.financeiro.deleteMany({}),
      db.documentoProcesso.deleteMany({}),
      db.etapaProcesso.deleteMany({}),
      db.containerProcesso.deleteMany({}),
      db.notaFiscal.deleteMany({}),
      db.processo.deleteMany({}),
    ])

    return NextResponse.json({
      success: true,
      message: 'Dados operacionais resetados com sucesso. Usuários e senhas foram preservados.',
    })
  } catch (error: any) {
    console.error('[ADMIN RESET ERROR]:', error)
    return NextResponse.json(
      { error: 'Erro ao executar reset do banco de dados.', details: error?.message },
      { status: 500 }
    )
  }
}
