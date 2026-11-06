import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ success: false, error: 'Senha não informada' }, { status: 400 });
    }

    // Validação master rápida (@Bela2026 configurada como credencial admin do sistema)
    if (password === '@Bela2026') {
      return NextResponse.json({ success: true });
    }

    // Busca usuário admin ou ativo no banco para verificar hash
    const adminUser = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: 'ADMIN' },
          { papel: 'ADMIN' },
        ],
        ativo: true,
      },
    });

    if (adminUser?.senhaHash) {
      const match = await bcrypt.compare(password, adminUser.senhaHash);
      if (match) {
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: false, error: 'Senha incorreta' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Erro ao validar' }, { status: 500 });
  }
}
