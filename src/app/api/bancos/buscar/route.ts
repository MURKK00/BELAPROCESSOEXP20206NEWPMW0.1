import { NextRequest, NextResponse } from 'next/server';
import { buscarBancos, DIRETORIO_BANCOS } from '@/lib/bancosDiretorio';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    // Retorna os principais bancos internacionais mais usados em exportação de grãos
    return NextResponse.json({
      sucesso: true,
      resultados: DIRETORIO_BANCOS.slice(0, 10),
      total: DIRETORIO_BANCOS.length,
    });
  }

  const resultados = buscarBancos(q);

  return NextResponse.json({
    sucesso: true,
    termo: q,
    resultados,
    total: resultados.length,
  });
}
