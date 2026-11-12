import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { 
  getBackupConfig, 
  saveBackupConfig, 
  getBackupLogs, 
  saveBackupLogs,
  executarBackup, 
  extrairSnapshotBanco,
  verificarEExecutarAgendamentoSeVencido,
  BackupScheduleConfig 
} from '@/lib/backupManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    // Checagem proativa se há backup agendado pendente para rodar
    await verificarEExecutarAgendamentoSeVencido().catch(() => null);

    // Ação: Download de snapshot físico ou sob demanda
    if (action === 'download') {
      const logs = getBackupLogs();
      const logItem = id ? logs.find((l) => l.id === id) : logs[0];

      if (logItem && logItem.arquivoNome) {
        const filePath = path.join(process.cwd(), 'prisma', 'backups', logItem.arquivoNome);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="${logItem.arquivoNome}"`,
            },
          });
        }
      }

      // Se o arquivo físico não estiver em disco (ex: serverless ephemerality), gera snapshot em tempo real
      const snapshot = await extrairSnapshotBanco();
      const jsonStr = JSON.stringify(snapshot, null, 2);
      const downloadName = logItem?.arquivoNome || `backup_supabase_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

      return new NextResponse(jsonStr, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${downloadName}"`,
        },
      });
    }

    const config = getBackupConfig();
    const logs = getBackupLogs();

    const totalBackups = logs.length;
    const backupsSucesso = logs.filter((l) => l.status === 'SUCESSO').length;
    const totalBytesArmazenados = logs.reduce((acc, l) => acc + (l.tamanhoBytes || 0), 0);

    return NextResponse.json({
      success: true,
      config,
      logs,
      estatisticas: {
        totalBackups,
        backupsSucesso,
        totalBytesArmazenados,
        ultimoBackup: logs[0] || null,
      },
    });
  } catch (err: any) {
    console.error('[API Backup] Erro no GET:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao carregar dados de backup.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const tipo = body.tipo === 'AGENDADO' ? 'AGENDADO' : 'MANUAL';
    const iniciadoPor = body.iniciadoPor || 'Administrador (Painel Admin)';

    const logItem = await executarBackup(tipo, iniciadoPor);

    return NextResponse.json({
      success: logItem.status === 'SUCESSO',
      log: logItem,
      message: logItem.mensagem,
      config: getBackupConfig(),
    });
  } catch (err: any) {
    console.error('[API Backup] Erro no POST:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao executar backup do banco de dados.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const configAtual = getBackupConfig();

    const novaConfig: BackupScheduleConfig = {
      ...configAtual,
      ativo: typeof body.ativo === 'boolean' ? body.ativo : configAtual.ativo,
      frequencia: body.frequencia || configAtual.frequencia,
      horarioExecucao: body.horarioExecucao || configAtual.horarioExecucao,
      diaSemana: typeof body.diaSemana === 'number' ? body.diaSemana : configAtual.diaSemana,
      retencaoDias: Number(body.retencaoDias) || configAtual.retencaoDias,
      notificarAdminEmail: typeof body.notificarAdminEmail === 'boolean' ? body.notificarAdminEmail : configAtual.notificarAdminEmail,
      emailDestino: body.emailDestino ? String(body.emailDestino).trim().toLowerCase() : configAtual.emailDestino,
    };

    const salva = saveBackupConfig(novaConfig);

    return NextResponse.json({
      success: true,
      config: salva,
      message: 'Agendamento de backup atualizado com sucesso!',
    });
  } catch (err: any) {
    console.error('[API Backup] Erro no PATCH:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao salvar configuração do agendamento.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const logs = getBackupLogs();
      const filtrados = logs.filter((l) => l.id !== id);
      saveBackupLogs(filtrados);
      return NextResponse.json({ success: true, message: 'Log de backup excluído.' });
    }

    // Se não passar ID, limpa logs com erro mantendo os com sucesso
    const logs = getBackupLogs();
    const apenasSucessos = logs.filter((l) => l.status === 'SUCESSO');
    saveBackupLogs(apenasSucessos);

    return NextResponse.json({ success: true, message: 'Logs de erro limpos com sucesso.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Erro ao remover logs de backup.' }, { status: 500 });
  }
}
