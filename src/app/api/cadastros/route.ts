import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { TipoEntidadeComercial } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const q = searchParams.get('q')?.toLowerCase();

    const where: any = { ativo: true };
    if (tipo && tipo !== 'ALL') {
      where.tipo = tipo as TipoEntidadeComercial;
    }

    const entidades = await prisma.cadastroEntidade.findMany({
      where,
      orderBy: { razaoSocial: 'asc' },
    });

    if (q) {
      const filtered = entidades.filter(
        (e) =>
          e.razaoSocial.toLowerCase().includes(q) ||
          (e.nomeFantasia && e.nomeFantasia.toLowerCase().includes(q)) ||
          (e.carNumero && e.carNumero.toLowerCase().includes(q)) ||
          (e.inscricaoEstadual && e.inscricaoEstadual.toLowerCase().includes(q)) ||
          (e.cidade && e.cidade.toLowerCase().includes(q)) ||
          (e.pais && e.pais.toLowerCase().includes(q))
      );
      return NextResponse.json(filtered);
    }

    return NextResponse.json(entidades);
  } catch (error: any) {
    console.error('Error fetching cadastros:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
