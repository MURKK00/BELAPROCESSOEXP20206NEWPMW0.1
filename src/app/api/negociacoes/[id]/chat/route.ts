import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const mensagens = await prisma.chatMessage.findMany({
      where: { processoId: id },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
          },
        },
      },
      orderBy: { criadoEm: 'asc' },
    });

    const user = await getSessionUser();

    return NextResponse.json({
      success: true,
      currentUserId: user?.id ?? null,
      mensagens,
    });
  } catch (error: any) {
    console.error('Erro ao buscar mensagens do chat:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao buscar mensagens' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: processoId } = await context.params;
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const texto = String(body.texto ?? '').trim();

    if (!texto) {
      return NextResponse.json(
        { success: false, error: 'O texto da mensagem é obrigatório' },
        { status: 400 }
      );
    }

    const novaMensagem = await prisma.chatMessage.create({
      data: {
        processoId,
        autorId: user.id,
        texto,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      mensagem: novaMensagem,
    });
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao enviar mensagem' },
      { status: 500 }
    );
  }
}
