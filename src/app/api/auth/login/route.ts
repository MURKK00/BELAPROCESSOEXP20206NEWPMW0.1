import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/passwordUtils';
import { registerLoginSession } from '@/lib/sessionTracker';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = body.username || body.email || body.identifier;
    const { password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Informe o usuário ou e-mail e a senha de acesso.' },
        { status: 400 }
      );
    }

    const termo = String(identifier).trim();
    const termoEmail = termo.toLowerCase();
    const termoUsername = termo.toUpperCase();

    // Busca o usuário no banco de dados por e-mail ou nome de usuário (username)
    let usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: termoEmail },
          { username: termoUsername },
        ],
      },
    });

    // Fallback de segurança se findFirst não retornar
    if (!usuario) {
      usuario = await prisma.usuario.findUnique({
        where: { email: termoEmail },
      });
    }

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas. Verifique o usuário e senha.' },
        { status: 401 }
      );
    }

    if (usuario.ativo === false) {
      return NextResponse.json(
        { success: false, error: 'Usuário inativo. Procure o administrador do sistema.' },
        { status: 403 }
      );
    }

    // Validação estrita da senha com bcrypt comparando com o hash do usuário encontrado
    if (!usuario.senhaHash) {
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas. Verifique o usuário e senha.' },
        { status: 401 }
      );
    }

    const senhaValida = await verifyPassword(password, usuario.senhaHash);

    if (!senhaValida) {
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas. Verifique o usuário e senha.' },
        { status: 401 }
      );
    }

    // Se for o primeiro acesso do usuário, exige que ele defina uma nova senha digitada 2x
    if (usuario.primeiroAcesso) {
      return NextResponse.json({
        success: true,
        primeiroAcesso: true,
        user: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          username: (usuario as any).username || null,
        },
        message: 'Primeiro acesso detectado. Por favor, defina a sua nova senha pessoal.',
      });
    }

    const papelBanco = (usuario as any).papel || 'COMERCIAL';
    const papeis = [
      ...(Array.isArray((usuario as any).papeis) ? (usuario as any).papeis : []),
      ...((usuario as any).papel ? String((usuario as any).papel).split(',') : []),
    ]
      .map((p: string) => p.trim().toUpperCase())
      .filter((p: string) => ['COMERCIAL', 'ADMINISTRATIVO', 'FINANCEIRO', 'DIRETORIA', 'ADMIN'].includes(p));

    const papeisFinal = papeis.length > 0 ? Array.from(new Set(papeis)) : [papelBanco];

    const userData = {
      id: usuario.id,
      name: usuario.nome,
      email: usuario.email,
      username: (usuario as any).username || null,
      role: papelBanco,
      papel: papelBanco,
      papeis: papeisFinal,
    };

    // Cria a resposta e injeta cookies compatíveis com cross-origin iframe (SameSite=None; Secure)
    const response = NextResponse.json({
      success: true,
      user: userData,
    });

    const SESSION_MAX_AGE_12H = 12 * 60 * 60; // 12 horas corridas
    const authCreatedAt = Date.now().toString();

    // Cookie de sessão do Bela Cereais (12 horas corridas)
    response.cookies.set('bela_session', '1', {
      path: '/',
      maxAge: SESSION_MAX_AGE_12H,
      sameSite: 'none',
      secure: true,
      httpOnly: false,
    });

    response.cookies.set('bela_user_email', encodeURIComponent(usuario.email), {
      path: '/',
      maxAge: SESSION_MAX_AGE_12H,
      sameSite: 'none',
      secure: true,
      httpOnly: false,
    });

    const sessionId = `sess_${usuario.id}_${Date.now()}`;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Navegador Web';

    try {
      registerLoginSession({
        sessionId,
        userId: usuario.id,
        userName: usuario.nome,
        userEmail: usuario.email,
        userRole: userData.role,
        userPapeis: userData.papeis,
        ip,
        userAgent,
      });
    } catch (e) {
      console.error('[API Login] Erro ao registrar rastreio de sessão:', e);
    }

    response.cookies.set('bela_session_id', sessionId, {
      path: '/',
      maxAge: SESSION_MAX_AGE_12H,
      sameSite: 'none',
      secure: true,
      httpOnly: false,
    });

    response.cookies.set('bela_auth_created_at', authCreatedAt, {
      path: '/',
      maxAge: SESSION_MAX_AGE_12H,
      sameSite: 'none',
      secure: true,
      httpOnly: false,
    });

    return response;
  } catch (error: any) {
    console.error('[API Login] Erro ao autenticar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao autenticar usuário.' },
      { status: 500 }
    );
  }
}
