import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { verifyPassword } from '@/lib/passwordUtils';
import { registerLoginSession } from '@/lib/sessionTracker';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSchema(prisma);

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
    const termoUsername = termo.replace(/^@/, '').toUpperCase();
    const termoCpfLimpo = termo.replace(/\D/g, '');

    const orConditions: any[] = [
      { email: termoEmail },
      { username: termoUsername },
      { username: `@${termoUsername}` },
      { username: termo },
      { username: termo.toUpperCase() },
      { username: termo.toLowerCase() },
      { nome: termo },
    ];

    if (termoCpfLimpo.length >= 9) {
      orConditions.push({ cpf: termoCpfLimpo });
      orConditions.push({ cpf: termo });
    }

    // Busca o usuário no banco de dados por e-mail, username (@MNUNES ou MNUNES), CPF ou nome completo
    let usuario: any = null;
    try {
      usuario = await (prisma.usuario as any).findFirst({
        where: {
          OR: orConditions,
        },
      });
    } catch (err: any) {
      console.warn('[API Login] Erro na busca findFirst com OR amplo, tentando formato base:', err?.message);
      try {
        usuario = await (prisma.usuario as any).findFirst({
          where: {
            OR: [
              { email: termoEmail },
              { username: termoUsername },
              { username: termo },
              { nome: termo },
            ],
          },
        });
      } catch (err2: any) {
        console.warn('[API Login] Erro na busca com OR básico:', err2?.message);
      }
    }

    // Fallbacks de busca direta
    if (!usuario) {
      usuario = await (prisma.usuario as any).findUnique({
        where: { email: termoEmail },
      });
    }

    if (!usuario) {
      usuario = await (prisma.usuario as any).findFirst({
        where: { username: termoUsername },
      });
    }

    if (!usuario && termoCpfLimpo.length >= 9) {
      try {
        usuario = await (prisma.usuario as any).findFirst({
          where: {
            OR: [{ cpf: termoCpfLimpo }, { cpf: termo }],
          },
        });
      } catch {
        // Coluna cpf ainda não migrada no banco
      }
    }

    if (!usuario) {
      usuario = await (prisma.usuario as any).findFirst({
        where: { nome: termo },
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
        { success: false, error: 'Usuário bloqueado pelo administrador. Acesso não permitido.' },
        { status: 403 }
      );
    }

    // Validação da senha:
    // Se o usuário está em primeiro acesso e informou a senha padrão 'abc12345',
    // aceita a credencial e conduz para a redefinição de senha obrigatória (2x).
    const digitouPadraoPrimeiroAcesso = 
      usuario.primeiroAcesso && password === 'abc12345';

    let senhaValida = false;
    if (digitouPadraoPrimeiroAcesso) {
      senhaValida = true;
    } else if (usuario.senhaHash) {
      senhaValida = await verifyPassword(password, usuario.senhaHash);
    }

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
          cpf: (usuario as any).cpf || null,
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
      cpf: (usuario as any).cpf || null,
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
