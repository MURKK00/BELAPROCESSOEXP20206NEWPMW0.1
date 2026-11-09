import { NextRequest, NextResponse } from 'next/server';
import { 
  listUserSessions, 
  calculateSessionStats, 
  revokeSession, 
  revokeAllSessionsExcept 
} from '@/lib/sessionTracker';

export async function GET(req: NextRequest) {
  try {
    const currentSessionId = req.cookies.get('bela_session_id')?.value || null;
    const rawSessions = listUserSessions();
    const stats = calculateSessionStats(rawSessions);

    // Marca visualmente qual é a sessão do próprio usuário logado que está consultando
    const sessions = rawSessions.map(s => ({
      ...s,
      isCurrentSession: Boolean(currentSessionId && s.id === currentSessionId)
    }));

    return NextResponse.json({
      success: true,
      sessions,
      stats,
      currentSessionId,
    });
  } catch (error: any) {
    console.error('[API admin/sessions GET] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar sessões ativas.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentSessionId = req.cookies.get('bela_session_id')?.value || null;
    const body = await req.json().catch(() => ({}));
    const { action, sessionId } = body;

    const adminEmail = req.cookies.get('bela_user_email')?.value || 'ADMIN';

    if (action === 'revoke') {
      if (!sessionId) {
        return NextResponse.json(
          { success: false, error: 'O identificador da sessão é obrigatório.' },
          { status: 400 }
        );
      }

      const revoked = revokeSession(sessionId, adminEmail);
      if (!revoked) {
        return NextResponse.json(
          { success: false, error: 'Sessão não encontrada para revogação.' },
          { status: 404 }
        );
      }

      const updatedSessions = listUserSessions();
      const stats = calculateSessionStats(updatedSessions);

      return NextResponse.json({
        success: true,
        message: 'Sessão revogada com sucesso. O usuário foi deslogado remotamente.',
        stats,
      });
    }

    if (action === 'revoke_all') {
      const count = revokeAllSessionsExcept(currentSessionId, adminEmail);
      const updatedSessions = listUserSessions();
      const stats = calculateSessionStats(updatedSessions);

      return NextResponse.json({
        success: true,
        message: `${count} sessões remotas foram revogadas com sucesso. Sua sessão atual foi preservada.`,
        count,
        stats,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Ação não reconhecida. Use "revoke" ou "revoke_all".' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API admin/sessions POST] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar revogação de sessão.' },
      { status: 500 }
    );
  }
}
