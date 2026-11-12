import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  listBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  getBackupConfig,
  saveBackupConfig,
  getBackupLogs,
} from '@/lib/backupManager'

export const dynamic = 'force-dynamic'

// Função auxiliar para garantir que apenas ADMIN acesse qualquer método desta rota
async function checkAdminAuth() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.perfil !== 'ADMIN') {
    return null
  }
  return user
}

export async function GET() {
  const admin = await checkAdminAuth()
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }

  try {
    const [backups, config, logs] = await Promise.all([
      listBackups(),
      getBackupConfig(),
      getBackupLogs(),
    ])
    return NextResponse.json({ backups, config, logs })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao carregar informações de backup.', details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const admin = await checkAdminAuth()
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const action = body?.action || 'create'

    if (action === 'restore') {
      if (!body?.filename) {
        return NextResponse.json({ error: 'Nome do arquivo de backup é obrigatório.' }, { status: 400 })
      }
      const result = await restoreBackup(body.filename)
      return NextResponse.json(result)
    }

    const backup = await createBackup(body?.label || `Manual (${admin.nome || 'ADMIN'})`)
    return NextResponse.json({ success: true, backup })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao processar operação de backup.', details: error?.message },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await checkAdminAuth()
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const updatedConfig = await saveBackupConfig(body)
    return NextResponse.json({ success: true, config: updatedConfig })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações de backup.', details: error?.message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await checkAdminAuth()
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename') || searchParams.get('file')

    if (!filename) {
      return NextResponse.json({ error: 'Arquivo não informado.' }, { status: 400 })
    }

    await deleteBackup(filename)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao excluir arquivo de backup.', details: error?.message },
      { status: 500 }
    )
  }
}
