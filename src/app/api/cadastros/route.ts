import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { TipoEntidadeComercial } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const q = searchParams.get('q')?.toLowerCase();
    const incluirInativos = searchParams.get('incluirInativos') === 'true';

    const where: any = {};
    if (!incluirInativos) {
      where.ativo = true;
    }
    if (tipo && tipo !== 'ALL') {
      where.tipo = tipo as TipoEntidadeComercial;
    }

    const entidades = await prisma.cadastroEntidade.findMany({
      where,
      orderBy: { razaoSocial: 'asc' },
    });

    if (q) {
      const filtered = entidades.filter((e: any) => {
        const matchesRoot =
          e.razaoSocial.toLowerCase().includes(q) ||
          (e.nomeFantasia && e.nomeFantasia.toLowerCase().includes(q)) ||
          (e.carNumero && e.carNumero.toLowerCase().includes(q)) ||
          (e.inscricaoEstadual && e.inscricaoEstadual.toLowerCase().includes(q)) ||
          (e.nomePropriedade && e.nomePropriedade.toLowerCase().includes(q)) ||
          (e.cidade && e.cidade.toLowerCase().includes(q)) ||
          (e.pais && e.pais.toLowerCase().includes(q));

        if (matchesRoot) return true;

        if (Array.isArray(e.fazendas)) {
          return e.fazendas.some(
            (fz: any) =>
              (fz.nomePropriedade && fz.nomePropriedade.toLowerCase().includes(q)) ||
              (fz.carNumero && fz.carNumero.toLowerCase().includes(q)) ||
              (fz.inscricaoEstadual && fz.inscricaoEstadual.toLowerCase().includes(q)) ||
              (fz.municipio && fz.municipio.toLowerCase().includes(q))
          );
        }

        return false;
      });
      return NextResponse.json(filtered);
    }

    return NextResponse.json(entidades);
  } catch (error: any) {
    console.error('Error fetching cadastros:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
