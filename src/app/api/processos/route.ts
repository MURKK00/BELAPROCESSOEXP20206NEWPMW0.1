import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { criarProcesso } from '@/server/services/processoService';
import { deriveStatusProcesso } from '@/lib/workflow';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const processos = await prisma.processo.findMany({
    orderBy: { deadlineEmbarque: 'asc' },
    include: { etapas: true },
  });

  // status sempre recalculado na leitura — nunca confia só no cache
  const withStatus = processos.map((p) => ({
    ...p,
    status: deriveStatusProcesso(p.etapas),
  }));

  return NextResponse.json(withStatus);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await req.json();
  // TODO: validar `body` com zod (ver src/lib/validations/processo.ts)

  const processo = await criarProcesso({ ...body, criadoPorId: user.id });
  return NextResponse.json(processo, { status: 201 });
}
