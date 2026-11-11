import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, validarRequisitosSenha } from '@/lib/passwordUtils';
import { SENHA_PADRAO_NOVO_USUARIO } from '@/lib/userHelper';
import { getUserPapeis } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, userId, novaSenha, confirmacaoSenha } = body;

    if (!novaSenha || !confirmacaoSenha) {
      return NextResponse.json(
        { success: false, error: 'Preencha a nova senha e a confirmação.' },
        { status: 400 }
      );
    }

    if (novaSenha !== confirmacaoSenha) {
      return NextResponse.json(
        { success: false, error: 'A nova senha e a confirmação não coincidem.' },
        { status: 400 }
      );
    }

    if (novaSenha.trim() === SENHA_PADRAO_NOVO_USUARIO) {
      return NextResponse.json(
        { success: false, error: 'A nova senha não pode ser igual à senha provisória padrão (abc12345). Escolha uma senha pessoal.' },
        { status: 400 }
      );
    }

    const validacao = validarRequisitosSenha(novaSenha.trim(), false);
    if (!validacao.valida) {
      return NextResponse.json(
        { success: false, error: validacao.erro || 'A senha deve conter no mínimo 6 caracteres, letras, números e caracteres especiais.' },
        { status: 400 }
      );
    }

    // Busca o usuário por ID ou por identifier (username ou email)
    let usuario: any = null;

    if (userId) {
      usuario = await prisma.usuario.findUnique({
        where: { id: String(userId) },
      });
    }

    if (!usuario && identifier) {
      const termo = String(identifier).trim();
      const termoEmail = termo.toLowerCase();
      const termoUsername = termo.replace(/^@/, '').toUpperCase();
      usuario = await prisma.usuario.findFirst({
        where: {
          OR: [
            { email: termoEmail },
            { username: termoUsername },
            { nome: termo },
          ],
        },
      });
    }

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não localizado no sistema.' },
        { status: 404 }
      );
    }

    if (usuario.ativo === false) {
      return NextResponse.json(
        { success: false, error: 'Usuário inativo. Contate o suporte.' },
        { status: 403 }
      );
    }

    // Criptografa a nova senha escolhida pelo usuário
    const novaSenhaHash = await hashPassword(novaSenha.trim());

    // Atualiza a senha e desativa o flag de primeiro acesso
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senhaHash: novaSenhaHash,
        primeiroAcesso: false,
      },
    });

    const papeis = getUserPapeis(usuarioAtualizado);

    const userData = {
      id: usuarioAtualizado.id,
      name: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      username: (usuarioAtualizado as any).username || null,
      role: usuarioAtualizado.papel || papeis[0] || 'ADMIN',
      papel: usuarioAtualizado.papel || papeis[0] || 'ADMIN',
      papeis,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Nova senha definida com sucesso! Acesso liberado.',
      user: userData,
    });

    const SESSION_MAX_AGE_12H = 12 * 60 * 60; // 12 horas corridas
    const authCreatedAt = Date.now().toString();

    // Injeta cookies de autenticação (12 horas corridas)
    response.cookies.set('bela_session', '1', {
      path: '/',
      maxAge: SESSION_MAX_AGE_12H,
      sameSite: 'none',
      secure: true,
      httpOnly: false,
    });

    response.cookies.set('bela_user_email', encodeURIComponent(usuarioAtualizado.email), {
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
    console.error('[API Primeiro Acesso] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao redefinir senha no primeiro acesso.' },
      { status: 500 }
    );
  }
}
