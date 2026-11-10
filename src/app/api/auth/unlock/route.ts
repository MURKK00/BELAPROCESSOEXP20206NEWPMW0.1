import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ success: false, error: 'Senha não informada' }, { status: 400 });
    }

    const userEmailCookie = req.cookies.get('bela_user_email')?.value;
    const emailToSearch = userEmailCookie ? decodeURIComponent(userEmailCookie).toLowerCase() : null;

    let targetUser = null;
    if (emailToSearch) {
      targetUser = await prisma.usuario.findUnique({
        where: { email: emailToSearch },
      });
    }

    if (!targetUser) {
      targetUser = await prisma.usuario.findFirst({
        where: {
          ativo: true,
        },
      });
    }

    if (targetUser?.senhaHash) {
      const match = await bcrypt.compare(password, targetUser.senhaHash);
      if (match) {
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: false, error: 'Senha incorreta' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Erro ao validar' }, { status: 500 });
  }
}
