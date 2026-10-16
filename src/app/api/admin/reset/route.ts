import { NextResponse } from 'next/server';
import { resetMockStore } from '@/lib/mockStore';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // 1. Zera o mock store
    resetMockStore();

    // 2. Se o banco relacional estiver configurado, zera as tabelas operacionais também
    try {
      await prisma.custoItem.deleteMany({}).catch(() => {});
      await prisma.cambioTravado.deleteMany({}).catch(() => {});
      await prisma.financeiro.deleteMany({}).catch(() => {});
      await prisma.container.deleteMany({}).catch(() => {});
      await prisma.documento.deleteMany({}).catch(() => {});
      await prisma.chatMessage.deleteMany({}).catch(() => {});
      await prisma.processoEtapa.deleteMany({}).catch(() => {});
      await prisma.auditLog.deleteMany({}).catch(() => {});
      await prisma.processo.deleteMany({}).catch(() => {});
    } catch (e) {
      // Ignora erro em bancos relacionais não provisionados
    }

    return NextResponse.json({
      success: true,
      message: 'Todos os lançamentos operacionais foram zerados com sucesso! O sistema está limpo.',
    });
  } catch (error: any) {
    console.error('[API Reset POST] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
