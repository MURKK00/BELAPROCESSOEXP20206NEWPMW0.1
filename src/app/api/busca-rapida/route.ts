import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const processos = await prisma.processo.findMany({
      select: {
        id: true,
        numeroProcesso: true,
        clienteFinal: true,
        produto: true,
        navio: true,
        bookingNumero: true,
        status: true,
        portoDestino: true,
        deadlineEmbarque: true,
      },
      orderBy: { criadoEm: 'desc' },
      take: 60,
    });

    const formatados = processos.map((p) => ({
      ...p,
      deadlineEmbarque: p.deadlineEmbarque ? p.deadlineEmbarque.toISOString() : null,
    }));

    return NextResponse.json({ processos: formatados });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar processos' }, { status: 500 });
  }
}
