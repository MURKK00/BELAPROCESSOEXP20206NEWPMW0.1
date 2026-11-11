import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { hashPassword } from '@/lib/passwordUtils';
import { SENHA_PADRAO_NOVO_USUARIO, limparCPF, formatarCPF } from '@/lib/userHelper';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSchema(prisma);

    const body = await req.json();
    const { usuarios } = body;

    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'Nenhum usuário para sincronizar.' });
    }

    let sincronizados = 0;
    const defaultHash = await hashPassword(SENHA_PADRAO_NOVO_USUARIO);

    for (const u of usuarios) {
      if (!u.email) continue;
      const emailNorm = String(u.email).trim().toLowerCase();
      const usernameNorm = u.username 
        ? String(u.username).replace(/^@/, '').trim().toUpperCase() 
        : null;
      const cpfLimpo = u.cpf ? limparCPF(u.cpf) : null;

      // Verifica se o usuário já existe no banco real
      let existe = await (prisma.usuario as any).findUnique({
        where: { email: emailNorm },
      });

      if (!existe && usernameNorm) {
        existe = await (prisma.usuario as any).findFirst({
          where: { username: usernameNorm },
        });
      }

      if (!existe) {
        // Insere o usuário na base de dados real
        const dadosInsert: any = {
          nome: u.nome || usernameNorm || 'Usuário',
          email: emailNorm,
          username: usernameNorm,
          senhaHash: defaultHash,
          papel: u.papel || (Array.isArray(u.papeis) && u.papeis[0]) || 'COMERCIAL',
          papeis: Array.isArray(u.papeis) && u.papeis.length > 0 ? u.papeis : [u.papel || 'COMERCIAL'],
          primeiroAcesso: u.primeiroAcesso !== undefined ? u.primeiroAcesso : true,
          ativo: u.ativo !== undefined ? u.ativo : true,
        };
        if (cpfLimpo) dadosInsert.cpf = cpfLimpo;

        try {
          await (prisma.usuario as any).create({
            data: dadosInsert,
          });
          sincronizados++;
        } catch (err: any) {
          console.warn('[Sync Users] Falha ao inserir usuário:', u.email, err?.message);
        }
      } else {
        // Atualiza campos faltantes (username, cpf, ativo)
        const updateData: any = {};
        if (usernameNorm && !existe.username) updateData.username = usernameNorm;
        if (cpfLimpo && !existe.cpf) updateData.cpf = cpfLimpo;
        if (u.ativo !== undefined && existe.ativo !== u.ativo) updateData.ativo = u.ativo;
        if (Array.isArray(u.papeis) && u.papeis.length > 0 && (!existe.papeis || existe.papeis.length === 0)) {
          updateData.papeis = u.papeis;
        }

        if (Object.keys(updateData).length > 0) {
          try {
            await (prisma.usuario as any).update({
              where: { id: existe.id },
              data: updateData,
            });
            sincronizados++;
          } catch (err: any) {
            console.warn('[Sync Users] Falha ao atualizar usuário:', u.email, err?.message);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: sincronizados,
      message: `${sincronizados} usuário(s) sincronizado(s) com a base de dados real.`,
    });
  } catch (error: any) {
    console.error('[Sync Users] Erro geral:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
