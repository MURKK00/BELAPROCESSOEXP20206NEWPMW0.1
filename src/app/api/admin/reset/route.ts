import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // 1. Verifica sessão real no servidor e exige perfil ADMIN
    const session = await getServerSession(authOptions)
    const user = session?.user as any

    if (!session || user?.perfil !== 'ADMIN') {
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
    await prisma.$transaction([
      prisma.mensagemChat.deleteMany({}),
      prisma.notificacao.deleteMany({}),
      prisma.historicoProcesso.deleteMany({}),
      prisma.documentoProcesso.deleteMany({}),
      prisma.etapaProcesso.deleteMany({}),
      prisma.containerProcesso.deleteMany({}),
      prisma.travamentoCambio.deleteMany({}),
      prisma.despesaProcesso.deleteMany({}),
      prisma.financeiroProcesso.deleteMany({}),
      prisma.notaFiscal.deleteMany({}),
      prisma.processo.deleteMany({}),
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
