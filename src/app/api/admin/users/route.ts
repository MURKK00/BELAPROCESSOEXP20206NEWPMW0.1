import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validarRequisitosSenha, SENHA_PADRAO_SISTEMA } from '@/lib/passwordUtils';
import { getUserPapeis, Papel } from '@/lib/permissions';
import { 
  gerarNomeUsuarioUnico, 
  SENHA_PADRAO_NOVO_USUARIO, 
  limparCPF, 
  formatarCPF, 
  validarCPF 
} from '@/lib/userHelper';

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
      cpf: u.cpf ? formatarCPF(u.cpf) : null,
      cpfRaw: u.cpf || null,
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
    const { nome, email, cpf, password, papel, papeis } = body;

    if (!nome || !email) {
      return NextResponse.json(
        { success: false, error: 'Nome completo e e-mail corporativo são obrigatórios.' },
        { status: 400 }
      );
    }

    const emailNormalizado = String(email).trim().toLowerCase();

    const existeEmail = await (prisma.usuario as any).findUnique({
      where: { email: emailNormalizado },
    });

    if (existeEmail) {
      return NextResponse.json(
        { success: false, error: 'Já existe um usuário cadastrado com este e-mail.' },
        { status: 400 }
      );
    }

    // Validação e verificação de duplicidade de CPF (se informado)
    const cpfLimpo = cpf ? limparCPF(cpf) : null;
    if (cpfLimpo) {
      if (!validarCPF(cpfLimpo)) {
        return NextResponse.json(
          { success: false, error: 'CPF inválido. Verifique os 11 dígitos digitados.' },
          { status: 400 }
        );
      }

      let existeCpf: any = null;
      try {
        existeCpf = await (prisma.usuario as any).findFirst({
          where: {
            OR: [
              { cpf: cpfLimpo },
              { cpf: formatarCPF(cpfLimpo) },
            ],
          },
        });
      } catch {
        // Ignora caso a coluna cpf ainda não esteja criada no banco remoto
      }

      if (existeCpf) {
        return NextResponse.json(
          { success: false, error: 'Já existe um usuário cadastrado com este CPF.' },
          { status: 400 }
        );
      }
    }

    // Regra Estrita de Senha
    const senhaFinal =
      password && String(password).trim().length > 0
        ? String(password).trim()
        : SENHA_PADRAO_NOVO_USUARIO;

    const validacaoSenha = validarRequisitosSenha(senhaFinal, true);
    if (!validacaoSenha.valida) {
      return NextResponse.json(
        { success: false, error: validacaoSenha.erro || 'A senha deve conter no mínimo 6 caracteres, letras, números e caracteres especiais.' },
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

    // Preparação dos dados para persistência compatível com Postgres/Supabase e Mock
    const dadosCriacao: any = {
      nome: String(nome).trim(),
      email: emailNormalizado,
      username: usernameGerado,
      senhaHash,
      papel: cargoPrimario,
      primeiroAcesso: true,
      ativo: true,
    };

    if (cpfLimpo) {
      dadosCriacao.cpf = cpfLimpo;
    }

    if (papeisFinal.length > 0) {
      dadosCriacao.papeis = papeisFinal;
    }

    let novoUsuario: any;
    try {
      novoUsuario = await (prisma.usuario as any).create({
        data: dadosCriacao,
      });
    } catch (errDb: any) {
      console.warn('[API Users POST] Falha ao gravar com colunas estendidas no Postgres, tentando formato base:', errDb?.message);
      // Fallback para caso a tabela remota do Supabase ainda não tenha executado a migration de colunas adicionais
      delete dadosCriacao.papeis;
      delete dadosCriacao.cpf;
      novoUsuario = await (prisma.usuario as any).create({
        data: dadosCriacao,
      });
    }

    return NextResponse.json({
      success: true,
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        username: novoUsuario.username || usernameGerado,
        cpf: novoUsuario.cpf ? formatarCPF(novoUsuario.cpf) : (cpfLimpo ? formatarCPF(cpfLimpo) : null),
        primeiroAcesso: true,
        papel: novoUsuario.papel || cargoPrimario,
        papeis: getUserPapeis(novoUsuario).length > 0 ? getUserPapeis(novoUsuario) : papeisFinal,
        ativo: novoUsuario.ativo ?? true,
        criadoEm: novoUsuario.criadoEm || new Date().toISOString(),
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
    const { 
      id, 
      ativo, 
      novaSenha, 
      resetarParaPadrao, 
      papel, 
      papeis, 
      nome, 
      email, 
      username, 
      cpf 
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    const usuarioAtual = await (prisma.usuario as any).findUnique({
      where: { id },
    });

    if (!usuarioAtual) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const updateData: any = {};

    // 1. Bloqueio / Desbloqueio (Ativo: true/false)
    if (typeof ativo === 'boolean') {
      updateData.ativo = ativo;
    }

    // 2. Edição de Dados Cadastrais: Nome, Email, Username, CPF
    if (nome && String(nome).trim()) {
      updateData.nome = String(nome).trim();
    }

    if (email && String(email).trim().toLowerCase() !== usuarioAtual.email?.toLowerCase()) {
      const emailNormalizado = String(email).trim().toLowerCase();
      const existeEmail = await (prisma.usuario as any).findUnique({
        where: { email: emailNormalizado },
      });
      if (existeEmail && existeEmail.id !== id) {
        return NextResponse.json({ success: false, error: 'Este e-mail já está em uso por outro usuário.' }, { status: 400 });
      }
      updateData.email = emailNormalizado;
    }

    if (username !== undefined) {
      const uTratado = username ? String(username).replace(/^@/, '').trim().toUpperCase() : null;
      if (uTratado && uTratado !== usuarioAtual.username) {
        const existeUsername = await (prisma.usuario as any).findFirst({
          where: { username: uTratado },
        });
        if (existeUsername && existeUsername.id !== id) {
          return NextResponse.json({ success: false, error: 'Este nome de usuário já está em uso.' }, { status: 400 });
        }
      }
      updateData.username = uTratado;
    }

    if (cpf !== undefined) {
      const cpfLimpo = cpf ? limparCPF(cpf) : null;
      if (cpfLimpo) {
        if (!validarCPF(cpfLimpo)) {
          return NextResponse.json({ success: false, error: 'CPF inválido.' }, { status: 400 });
        }
        let existeCpf: any = null;
        try {
          existeCpf = await (prisma.usuario as any).findFirst({
            where: {
              OR: [{ cpf: cpfLimpo }, { cpf: formatarCPF(cpfLimpo) }],
            },
          });
        } catch {
          // Coluna cpf ainda não existe no banco remoto
        }
        if (existeCpf && existeCpf.id !== id) {
          return NextResponse.json({ success: false, error: 'Este CPF já está cadastrado para outro usuário.' }, { status: 400 });
        }
        updateData.cpf = cpfLimpo;
      } else {
        updateData.cpf = null;
      }
    }

    // 3. Edição de Perfis de Acesso
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

    // 4. Redefinição de Senha
    let feedbackSenha = '';
    if (resetarParaPadrao === true || novaSenha === SENHA_PADRAO_SISTEMA) {
      // Redefine para a senha padrão 'abc12345' e ativa a exigência de alteração no primeiro login
      updateData.senhaHash = await hashPassword(SENHA_PADRAO_NOVO_USUARIO);
      updateData.primeiroAcesso = true;
      feedbackSenha = ' e a senha foi alterada para a padrão (abc12345). O usuário deverá alterá-la no próximo acesso';
    } else if (novaSenha && String(novaSenha).trim().length > 0) {
      const senhaInformada = String(novaSenha).trim();
      const validacao = validarRequisitosSenha(senhaInformada, false);
      if (!validacao.valida) {
        return NextResponse.json(
          { success: false, error: validacao.erro || 'A senha deve conter no mínimo 6 caracteres, letras, números e caracteres especiais.' },
          { status: 400 }
        );
      }
      updateData.senhaHash = await hashPassword(senhaInformada);
      updateData.primeiroAcesso = false;
      feedbackSenha = ' e a nova senha pessoal foi salva com sucesso';
    }

    let usuarioAtualizado: any;
    try {
      usuarioAtualizado = await (prisma.usuario as any).update({
        where: { id },
        data: updateData,
      });
    } catch (errDb: any) {
      console.warn('[API Users PATCH] Erro ao gravar campos estendidos, tentando fallback:', errDb?.message);
      delete updateData.papeis;
      delete updateData.cpf;
      usuarioAtualizado = await (prisma.usuario as any).update({
        where: { id },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
        username: usuarioAtualizado.username || null,
        cpf: usuarioAtualizado.cpf ? formatarCPF(usuarioAtualizado.cpf) : null,
        papel: usuarioAtualizado.papel,
        papeis: getUserPapeis(usuarioAtualizado),
        ativo: usuarioAtualizado.ativo,
        primeiroAcesso: usuarioAtualizado.primeiroAcesso,
        criadoEm: usuarioAtualizado.criadoEm,
      },
      message: `Usuário "${usuarioAtualizado.nome}" atualizado com sucesso${feedbackSenha}!`,
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