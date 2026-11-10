import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/passwordUtils';
import { getUserPapeis, Papel } from '@/lib/permissions';
import { gerarNomeUsuarioUnico, SENHA_PADRAO_NOVO_USUARIO } from '@/lib/userHelper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const usuarios = await (prisma.usuario as any).findMany({
      orderBy: { criadoEm: 'desc' },
    });

    const sanitized = usuarios.map((u: any) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      username: u.username || null,
      primeiroAcesso: u.primeiroAcesso !== false,
      papel: u.papel || 'ADMIN',
      papeis: getUserPapeis(u),
      ativo: u.ativo !== false,
      criadoEm: u.criadoEm || new Date().toISOString(),
      atualizadoEm: u.atualizadoEm || new Date().toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        usuarios: sanitized,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('[API Users GET] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, email, password, papel, papeis } = body;

    if (!nome || !email) {
      return NextResponse.json(
        { success: false, error: 'Nome completo e e-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    const emailNormalizado = String(email).trim().toLowerCase();

    const existe = await (prisma.usuario as any).findUnique({
      where: { email: emailNormalizado },
    });

    if (existe) {
      return NextResponse.json(
        { success: false, error: 'Já existe um usuário cadastrado com este e-mail.' },
        { status: 400 }
      );
    }

    const senhaFinal =
      password && String(password).trim().length > 0
        ? String(password).trim()
        : SENHA_PADRAO_NOVO_USUARIO;

    if (senhaFinal.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    const todosUsuarios = await (prisma.usuario as any).findMany();

    const usernameGerado = gerarNomeUsuarioUnico(nome, todosUsuarios);

    const papeisLista: string[] =
      Array.isArray(papeis) && papeis.length > 0
        ? papeis
        : papel
        ? String(papel)
            .split(',')
            .map((p: string) => p.trim())
        : ['COMERCIAL'];

    const papeisValidos = papeisLista.filter((p: string) =>
      ['COMERCIAL', 'ADMINISTRATIVO', 'FINANCEIRO', 'DIRETORIA', 'ADMIN'].includes(p)
    );

    const papeisFinal = papeisValidos.length > 0 ? papeisValidos : ['COMERCIAL'];
    const cargoPrimario = (papeisFinal[0] as Papel) || 'COMERCIAL';

    const senhaHash = await hashPassword(senhaFinal);
    const agoraIso = new Date().toISOString();

    const novoUsuario = await (prisma.usuario as any).create({
      data: {
        nome: String(nome).trim(),
        email: emailNormalizado,
        username: usernameGerado,
        senhaHash,
        papel: cargoPrimario,
        papeis: papeisFinal,
        primeiroAcesso: true,
        ativo: true,
        criadoEm: agoraIso,
      },
    });

    return NextResponse.json({
      success: true,
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        username: novoUsuario.username || usernameGerado,
        primeiroAcesso: true,
        papel: novoUsuario.papel || cargoPrimario,
        papeis: getUserPapeis(novoUsuario).length > 0 ? getUserPapeis(novoUsuario) : papeisFinal,
        ativo: novoUsuario.ativo ?? true,
        criadoEm: novoUsuario.criadoEm || agoraIso,
      },
      message: `Usuário cadastrado com sucesso! Usuário de login: ${usernameGerado}. Senha padrão: abc12345 (redefinição obrigatória no 1º acesso).`,
    });
  } catch (error: any) {
    console.error('[API Users POST] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ativo, novaSenha, papel, papeis, nome } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof ativo === 'boolean') updateData.ativo = ativo;
    if (nome) updateData.nome = String(nome).trim();

    if (Array.isArray(papeis) && papeis.length > 0) {
      const papeisValidos = papeis.filter((p: string) =>
        ['COMERCIAL', 'ADMINISTRATIVO', 'FINANCEIRO', 'DIRETORIA', 'ADMIN'].includes(p)
      );
      if (papeisValidos.length > 0) {
        updateData.papeis = papeisValidos;
        updateData.papel = papeisValidos[0] as Papel;
      }
    } else if (papel) {
      const pArr = String(papel)
        .split(',')
        .map((p: string) => p.trim());
      updateData.papeis = pArr;
      if (['COMERCIAL', 'ADMINISTRATIVO', 'FINANCEIRO', 'DIRETORIA', 'ADMIN'].includes(pArr[0])) {
        updateData.papel = pArr[0] as Papel;
      }
    }

    if (novaSenha) {
      if (novaSenha.length < 6) {
        return NextResponse.json(
          { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' },
          { status: 400 }
        );
      }
      updateData.senhaHash = await hashPassword(novaSenha);
    }

    const usuarioAtualizado = await (prisma.usuario as any).update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
        username: usuarioAtualizado.username || null,
        papel: usuarioAtualizado.papel,
        papeis: getUserPapeis(usuarioAtualizado),
        ativo: usuarioAtualizado.ativo,
        criadoEm: usuarioAtualizado.criadoEm,
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

    const countAdmins = await (prisma.usuario as any).count({
      where: { papel: 'ADMIN', ativo: true },
    });

    const targetUser = await (prisma.usuario as any).findUnique({
      where: { id },
    });

    if (targetUser?.papel === 'ADMIN' && countAdmins <= 1) {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir o único administrador ativo do sistema.' },
        { status: 400 }
      );
    }

    await (prisma.usuario as any).delete({
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