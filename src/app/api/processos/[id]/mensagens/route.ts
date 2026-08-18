import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const mensagens = await prisma.chatMessage.findMany({
    where: { processoId: id },
    include: { autor: true },
    orderBy: { criadoEm: 'asc' },
  });

  return NextResponse.json({
    currentUserId: user.id,
    mensagens: mensagens.map((m) => ({
      id: m.id,
      texto: m.texto,
      criadoEm: m.criadoEm.toISOString(),
      autorId: m.autorId,
      autorNome: m.autor.nome,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const texto = String(body.texto ?? '').trim();
  if (!texto) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 });

  await prisma.chatMessage.create({
    data: { processoId: id, autorId: user.id, texto },
  });

  return NextResponse.json({ ok: true });
}