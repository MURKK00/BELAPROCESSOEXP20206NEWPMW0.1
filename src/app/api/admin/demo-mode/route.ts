import { NextRequest, NextResponse } from 'next/server';
import { isSystemInDemoMode, enableDemoMode, disableDemoMode, getMockStore } from '@/lib/mockStore';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const isDemo = isSystemInDemoMode();
    const store = getMockStore();
    const countProcessos = store.processos?.length || 0;
    const countUsuarios = store.usuarios?.length || 0;

    return NextResponse.json({
      success: true,
      isDemoMode: isDemo,
      countProcessos,
      countUsuarios,
    });
  } catch (error: any) {
    console.error('[API Demo Mode GET] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enableDemo } = body;

    if (enableDemo) {
      enableDemoMode();
    } else {
      disableDemoMode();
    }

    const isDemo = isSystemInDemoMode();
    const store = getMockStore();

    return NextResponse.json({
      success: true,
      isDemoMode: isDemo,
      countProcessos: store.processos?.length || 0,
      message: enableDemo
        ? 'Modo de Demonstração ativado com sucesso! Dados de exemplo carregados.'
        : 'Modo de Demonstração desativado! Sistema zerado para lançamentos reais.',
    });
  } catch (error: any) {
    console.error('[API Demo Mode POST] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
