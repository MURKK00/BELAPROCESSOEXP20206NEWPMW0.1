import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isSessionRevoked, touchSession } from '@/lib/sessionTracker';

export const dynamic = 'force-dynamic';

const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000; // Exatamente 12 horas corridas

export async function POST(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const sessionId = cookies.get('bela_session_id')?.value;

    // VERIFICAÇÃO SE A SESSÃO FOI DERRUBADA REMOTAMENTE POR UM ADMIN
    if (sessionId && isSessionRevoked(sessionId)) {
      const response = NextResponse.json(
        {
          success: false,
          revoked: true,
          error: 'Sua sessão foi encerrada remotamente por um administrador.',
        },
        { status: 401 }
      );
      response.cookies.delete('bela_session');
      response.cookies.delete('bela_session_id');
      response.cookies.delete('bela_user_email');
      response.cookies.delete('bela_auth_created_at');
      response.cookies.set('bela_session', '', { path: '/', maxAge: 0, sameSite: 'none', secure: true });
      response.cookies.set('bela_session_id', '', { path: '/', maxAge: 0, sameSite: 'none', secure: true });
      return response;
    }

    if (sessionId) {
      touchSession(sessionId);
    }

    const hasSessionCookie = cookies.has('bela_session');
    const secret = process.env.NEXTAUTH_SECRET;
    const token = await getToken({ req, secret }).catch(() => null);

    if (!hasSessionCookie && !token) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada.' },
        { status: 401 }
      );
    }

    // Identifica o timestamp de criação da sessão
    const authCreatedAtCookie = cookies.get('bela_auth_created_at')?.value;
    const tokenCreatedAt = (token as any)?.authCreatedAt;
    
    let authCreatedAt = Number(authCreatedAtCookie || tokenCreatedAt || 0);

    // Se não existia timestamp prévio, inicializa com o momento atual
    if (!authCreatedAt || isNaN(authCreatedAt)) {
      authCreatedAt = Date.now();
    }

    const now = Date.now();
    const elapsed = now - authCreatedAt;

    // VERIFICAÇÃO DO LIMITE ABSOLUTO DE 12 HORAS (SEM RENOVAÇÃO INFINITA)
    if (elapsed >= ABSOLUTE_TIMEOUT_MS) {
      const response = NextResponse.json(
        {
          success: false,
          expired: true,
          error: 'Limite absoluto de 12 horas atingido. Faça login novamente.',
        },
        { status: 401 }
      );

      // Limpa cookies
      response.cookies.delete('bela_session');
      response.cookies.delete('bela_user_email');
      response.cookies.delete('bela_auth_created_at');
      response.cookies.delete('next-auth.session-token');
      response.cookies.delete('__Secure-next-auth.session-token');
      response.cookies.set('bela_session', '', { path: '/', maxAge: 0, sameSite: 'none', secure: true });
      response.cookies.set('bela_auth_created_at', '', { path: '/', maxAge: 0, sameSite: 'none', secure: true });

      return response;
    }

    // Calcula tempo restante até o teto absoluto de 12h
    const remainingSeconds = Math.max(60, Math.floor((ABSOLUTE_TIMEOUT_MS - elapsed) / 1000));

    const response = NextResponse.json({
      success: true,
      remainingSeconds,
      authCreatedAt,
      elapsedMs: elapsed,
    });

    // Renova a sessão deslizante SEM alterar o ponto de início (authCreatedAt fixo)
    response.cookies.set('bela_session', '1', {
      path: '/',
      maxAge: remainingSeconds,
      sameSite: 'none',
      secure: true,
      httpOnly: false,
    });

    const userEmail = cookies.get('bela_user_email')?.value || token?.email;
    if (userEmail) {
      response.cookies.set('bela_user_email', encodeURIComponent(userEmail), {
        path: '/',
        maxAge: remainingSeconds,
        sameSite: 'none',
        secure: true,
        httpOnly: false,
      });
    }

    // Preserva o timestamp original de criação para manter o teto intransponível
    response.cookies.set('bela_auth_created_at', String(authCreatedAt), {
      path: '/',
      maxAge: remainingSeconds,
      sameSite: 'none',
      secure: true,
      httpOnly: false,
    });

    if (sessionId) {
      response.cookies.set('bela_session_id', sessionId, {
        path: '/',
        maxAge: remainingSeconds,
        sameSite: 'none',
        secure: true,
        httpOnly: false,
      });
    }

    return response;
  } catch (error: any) {
    console.error('[API Refresh] Erro ao renovar sessão:', error);
    return NextResponse.json(
      { success: false, error: 'Falha interna ao renovar sessão.' },
      { status: 500 }
    );
  }
}
