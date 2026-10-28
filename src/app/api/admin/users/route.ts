import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/passwordUtils';
import { Papel } from '@prisma/client';
import { getUserPapeis } from '@/lib/permissions';
import { gerarNomeUsuarioUnico, SENHA_PADRAO_NOVO_USUARIO } from '@/lib/userHelper';

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { criadoEm: 'desc' },
    });

    // Sanitiza removendo senhaHash da resposta e inclui múltiplos papéis e username
    const sanitized = usuarios.map((u: any) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      username: u.username || null,
      primeiroAcesso: u.primeiroAcesso !== false,
      papel: u.papel || 'ADMIN',
      papeis: getUserPapeis(u),
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
    const { nome, email, password, papel, papeis } = body;

    if (!nome || !email) {
      return NextResponse.json(
        { success: false, error: 'Nome completo e e-mail são obrigatórios.' },
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

    // Senha fornecida ou senha padrão do sistema: abc12345
    const senhaFinal = (password && String(password).trim().length > 0)
      ? String(password).trim()
      : SENHA_PADRAO_NOVO_USUARIO;

    if (senhaFinal.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    // Busca todos os usuários para garantir username único (ex: MNUNES)
    const todosUsuarios = await prisma.usuario.findMany({
      select: { id: true, username: true },
    });

    const usernameGerado = gerarNomeUsuarioUnico(nome, todosUsuarios);

    // Normaliza os múltiplos papéis selecionados
    const papeisLista: string[] = Array.isArray(papeis) && papeis.length > 0
      ? papeis
      : papel
      ? String(papel).split(',').map((p) => p.trim())
      : ['ADMIN'];

    const papeisValidos = papeisLista.filter((p) =>
      ['COMERCIAL', 'ADMINISTRATIVO', 'FINANCEIRO', 'DIRETORIA', 'ADMIN'].includes(p)
    );

    const papeisFinal = papeisValidos.length > 0 ? papeisValidos : ['ADMIN'];
    const cargoPrimario = (papeisFinal[0] as Papel) || Papel.ADMIN;

    const senhaHash = await hashPassword(senhaFinal);

    // Cria o usuário com primeiroAcesso = true (para que redefina a senha ao entrar)
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
        papel: novoUsuario.papel,
        papeis: papeisFinal,
        ativo: novoUsuario.ativo,
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
      const papeisValidos = papeis.filter((p) =>
        ['COMERCIAL', 'ADMINISTRATIVO', 'FINANCEIRO', 'DIRETORIA', 'ADMIN'].includes(p)
      );
      if (papeisValidos.length > 0) {
        updateData.papeis = papeisValidos;
        updateData.papel = papeisValidos[0] as Papel;
      }
    } else if (papel) {
      const pArr = String(papel).split(',').map((p) => p.trim());
      updateData.papeis = pArr;
      if (Object.values(Papel).includes(pArr[0] as any)) {
        updateData.papel = pArr[0] as Papel;
      }
    }

    if (novaSenha) {
      if (novaSenha.length < 6) {
        return NextResponse.json({ success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
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
        papel: usuarioAtualizado.papel,
        papeis: getUserPapeis(usuarioAtualizado),
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
