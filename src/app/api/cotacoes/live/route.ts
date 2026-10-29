import { NextResponse } from 'next/server';
import { getLiveMarketData } from '@/lib/liveMarket';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getLiveMarketData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API /api/cotacoes/live] Erro:', error);
    return NextResponse.json(
      { sucesso: false, erro: error.message || 'Falha ao carregar cotações' },
      { status: 500 }
    );
  }
}
