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

  // `status` vem direto do banco (enum StatusNegociacao — fonte única de verdade).
  // `progresso` é só informativo, calculado a partir do checklist de etapas.
  const comProgresso = processos.map((p) => ({
    ...p,
    progresso: deriveStatusProcesso(p.etapas),
  }));

  return NextResponse.json(comProgresso);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await req.json();
  // TODO: validar `body` com zod (ver src/lib/validations/processo.ts)

  const processo = await criarProcesso({ ...body, criadoPorId: user.id });
  return NextResponse.json(processo, { status: 201 });
}
