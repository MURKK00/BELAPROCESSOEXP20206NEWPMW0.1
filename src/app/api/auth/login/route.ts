import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/passwordUtils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Informe o e-mail e a senha de acesso.' },
        { status: 400 }
      );
    }

    const emailNormalizado = String(email).trim().toLowerCase();

    // Busca o usuário no banco de dados
    const usuario = await prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    if (usuario.ativo === false) {
      return NextResponse.json(
        { success: false, error: 'Usuário inativo. Procure o administrador do sistema.' },
        { status: 403 }
      );
    }

    // Validação de senha criptografada via bcrypt com fallback de dev
    const senhaValida = await verifyPassword(password, usuario.senhaHash);

    if (!senhaValida) {
      if (!usuario.senhaHash && password === 'admin123') {
        // Permite se a senha for admin123
      } else {
        return NextResponse.json(
          { success: false, error: 'E-mail ou senha incorretos.' },
          { status: 401 }
        );
      }
    }

    const userData = {
      id: usuario.id,
      name: usuario.nome,
      email: usuario.email,
      role: usuario.papel || 'ADMIN',
      papel: usuario.papel || 'ADMIN',
    };

    // Cria a resposta e injeta cookies compatíveis com cross-origin iframe (SameSite=None; Secure)
    const response = NextResponse.json({
      success: true,
      user: userData,
    });

    // Cookie de sessão do Bela Cereais
    response.cookies.set('bela_session', '1', {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      sameSite: 'none',
      secure: true,
      httpOnly: false, // permite leitura para detecção se necessário
    });

    response.cookies.set('bela_user_email', encodeURIComponent(usuario.email), {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
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
