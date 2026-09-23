import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().toLowerCase();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Buscar todos os processos com containers para buscar por número, booking, container, lacre, navio, cliente
  const processos = await prisma.processo.findMany({
    include: {
      containers: true,
      financeiro: true,
    },
    orderBy: { criadoEm: 'desc' },
  });

  const matches: Array<{
    id: string;
    numeroProcesso: string;
    clienteFinal: string;
    produto: string;
    status: string;
    bookingNumero: string | null;
    navio: string | null;
    matchReason: string;
    matchedDetail?: string;
  }> = [];

  for (const proc of processos) {
    let matched = false;
    let matchReason = '';
    let matchedDetail = '';

    const numProc = proc.numeroProcesso.toLowerCase();
    const cliente = proc.clienteFinal.toLowerCase();
    const produto = proc.produto.toLowerCase();
    const booking = (proc.bookingNumero ?? '').toLowerCase();
    const navio = (proc.navio ?? '').toLowerCase();
    const trader = (proc.traderIntermedio ?? '').toLowerCase();

    if (numProc.includes(q)) {
      matched = true;
      matchReason = 'Número do Processo';
      matchedDetail = proc.numeroProcesso;
    } else if (booking.includes(q)) {
      matched = true;
      matchReason = 'Booking';
      matchedDetail = proc.bookingNumero || '';
    } else if (cliente.includes(q)) {
      matched = true;
      matchReason = 'Cliente';
      matchedDetail = proc.clienteFinal;
    } else if (navio.includes(q)) {
      matched = true;
      matchReason = 'Navio';
      matchedDetail = proc.navio || '';
    } else if (produto.includes(q)) {
      matched = true;
      matchReason = 'Produto';
      matchedDetail = proc.produto;
    } else if (trader.includes(q)) {
      matched = true;
      matchReason = 'Trader';
      matchedDetail = proc.traderIntermedio || '';
    } else {
      // Checar se bate em algum container ou lacre
      for (const c of proc.containers) {
        const numCont = (c.numeroContainer ?? '').toLowerCase();
        const lacre = (c.lacre ?? '').toLowerCase();
        if (numCont && numCont.includes(q)) {
          matched = true;
          matchReason = 'Container';
          matchedDetail = `Container: ${c.numeroContainer}`;
          break;
        }
        if (lacre && lacre.includes(q)) {
          matched = true;
          matchReason = 'Lacre';
          matchedDetail = `Lacre: ${c.lacre} (Cont: ${c.numeroContainer || 's/n'})`;
          break;
        }
      }
    }

    if (matched) {
      matches.push({
        id: proc.id,
        numeroProcesso: proc.numeroProcesso,
        clienteFinal: proc.clienteFinal,
        produto: proc.produto,
        status: proc.status,
        bookingNumero: proc.bookingNumero,
        navio: proc.navio,
        matchReason,
        matchedDetail,
      });
    }

    if (matches.length >= 10) break;
  }

  return NextResponse.json({ results: matches });
}
