import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/passwordUtils';
import { Papel } from '@prisma/client';

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { criadoEm: 'desc' },
    });

    // Sanitiza removendo senhaHash da resposta
    const sanitized = usuarios.map((u: any) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      papel: u.papel || 'ADMIN',
      ativo: u.ativo !== false,
      criadoEm: u.criadoEm,
      atualizadoEm: u.atualizadoEm,
    }));

    return NextResponse.json({
      success: true,
      usuarios: sanitized,
    });
  } catch (error: any) {
    console.error('[API Users GET] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, email, password, papel } = body;

    if (!nome || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Nome completo, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const emailNormalizado = String(email).trim().toLowerCase();

    // Verifica se já existe usuário com este e-mail
    const existe = await prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (existe) {
      return NextResponse.json(
        { success: false, error: 'Já existe um usuário cadastrado com este e-mail.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    const senhaHash = await hashPassword(password);
    const cargoValido = Object.values(Papel).includes(papel) ? papel : Papel.ADMIN;

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: String(nome).trim(),
        email: emailNormalizado,
        senhaHash,
        papel: cargoValido,
        ativo: true,
      },
    });

    return NextResponse.json({
      success: true,
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        papel: novoUsuario.papel,
        ativo: novoUsuario.ativo,
      },
      message: 'Usuário cadastrado com sucesso!',
    });
  } catch (error: any) {
    console.error('[API Users POST] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ativo, novaSenha, papel, nome } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof ativo === 'boolean') updateData.ativo = ativo;
    if (papel && Object.values(Papel).includes(papel)) updateData.papel = papel;
    if (nome) updateData.nome = String(nome).trim();

    if (novaSenha) {
      if (novaSenha.length < 6) {
        return NextResponse.json({ success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
      }
      updateData.senhaHash = await hashPassword(novaSenha);
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
        papel: usuarioAtualizado.papel,
        ativo: usuarioAtualizado.ativo,
      },
      message: 'Usuário atualizado com sucesso!',
    });
  } catch (error: any) {
    console.error('[API Users PATCH] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    // Protege contra exclusão do admin principal se for o único
    const countAdmins = await prisma.usuario.count({
      where: { papel: Papel.ADMIN, ativo: true },
    });

    const targetUser = await prisma.usuario.findUnique({
      where: { id },
    });

    if (targetUser?.papel === Papel.ADMIN && countAdmins <= 1) {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir o único administrador ativo do sistema.' },
        { status: 400 }
      );
    }

    await prisma.usuario.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso.',
    });
  } catch (error: any) {
    console.error('[API Users DELETE] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
