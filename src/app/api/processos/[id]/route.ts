import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { atualizarProcessoComAuditoria } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      etapas: {
        include: { etapaTemplate: true },
        orderBy: { etapaTemplate: { ordem: 'asc' } },
      },
      containers: { orderBy: { ordem: 'asc' } },
      financeiro: {
        include: {
          travamentos: true,
          custos: true,
        },
      },
      documentos: true,
      logs: {
        include: { usuario: true },
        orderBy: { criadoEm: 'desc' },
      },
    },
  });

  if (!processo) {
    return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 });
  }

  return NextResponse.json(processo);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser(req);

  try {
    const body = await req.json();

    const resultado = await atualizarProcessoComAuditoria({
      processoId: id,
      dadosNovos: body,
      usuarioId: user?.id,
      acao: 'PROCESSO_EDITADO',
    });

    return NextResponse.json(resultado);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao atualizar processo' },
      { status: 500 }
    );
  }
}
