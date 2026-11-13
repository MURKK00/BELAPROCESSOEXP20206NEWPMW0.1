import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getBackupConfig,
  saveBackupConfig,
  getBackupLogs,
  executarBackup,
  extrairSnapshotBanco,
  verificarEExecutarAgendamentoSeVencido,
  deleteBackup,
} from '@/lib/backupManager';

export const dynamic = 'force-dynamic';

function isAdminUser(user: any): boolean {
  if (!user) return false;
  if (user.papel === 'ADMIN' || user.role === 'ADMIN' || user.perfil === 'ADMIN') return true;
  if (Array.isArray(user.papeis) && user.papeis.includes('ADMIN')) return true;
  return false;
}

async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || !isAdminUser(user)) {
    return null;
  }
  return user;
}

export async function GET(req: NextRequest) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download');
    const action = searchParams.get('action');

    // Se o admin pediu para baixar o JSON do snapshot na hora
    if (action === 'download' || download === '1' || download === 'true') {
      const snapshot = await extrairSnapshotBanco();
      const jsonStr = JSON.stringify(snapshot, null, 2);
      const fileDate = new Date().toISOString().replace(/[:.]/g, '-');
      return new NextResponse(jsonStr, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="backup_supabase_${fileDate}.json"`,
        },
      });
    }

    await verificarEExecutarAgendamentoSeVencido();
    const config = getBackupConfig();
    const logs = getBackupLogs();

    const totalBackups = logs.length;
    const backupsSucesso = logs.filter((l) => l.status === 'SUCESSO').length;
    const totalBytesArmazenados = logs.reduce((acc, l) => acc + (l.tamanhoBytes || 0), 0);

    return NextResponse.json({
      success: true,
      config,
      logs,
      backups: logs,
      estatisticas: {
        totalBackups,
        backupsSucesso,
        totalBytesArmazenados,
        ultimoBackup: logs[0] || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar informações de backup.', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const iniciadoPor = body?.iniciadoPor || admin.nome || admin.email || 'ADMIN';
    const log = await executarBackup('MANUAL', iniciadoPor);

    return NextResponse.json({
      success: log.status === 'SUCESSO',
      log,
      backup: log,
      config: getBackupConfig(),
      logs: getBackupLogs(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao executar backup.', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const current = getBackupConfig();
    const updated = saveBackupConfig({ ...current, ...body });

    return NextResponse.json({ success: true, config: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações de backup.', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('filename');
    if (id) {
      await deleteBackup(id);
    }
    return NextResponse.json({ success: true, logs: getBackupLogs() });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao remover registro de backup.', details: error?.message },
      { status: 500 }
    );
  }
}
