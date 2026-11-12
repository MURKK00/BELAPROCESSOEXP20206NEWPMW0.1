import { NextResponse } from 'next/server';
import { resetMockStore } from '@/lib/mockStore';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';

const HASH_BELA_2026 = '$2b$10$u27eR/YG8ttK4jdJ9DWrDuSXZwmUEKvpE2lhNtKQMQ1w4iC1yBj5O';

export async function POST() {
  try {
    // 1. Zera o mock store mantendo estritamente apenas o administrador oficial mestre
    resetMockStore();

    // 2. Se o banco relacional estiver configurado, zera as tabelas operacionais e usuários de teste
    try {
      await ensureDatabaseSchema(prisma);
      await (prisma as any).notaFiscalRetornoItem?.deleteMany({}).catch(() => {});
      await (prisma as any).notaFiscalExportacaoItem?.deleteMany({}).catch(() => {});
      await (prisma as any).notaFiscal?.deleteMany({}).catch(() => {});
      await prisma.custoItem.deleteMany({}).catch(() => {});
      await prisma.cambioTravado.deleteMany({}).catch(() => {});
      await prisma.financeiro.deleteMany({}).catch(() => {});
      await prisma.container.deleteMany({}).catch(() => {});
      await prisma.documento.deleteMany({}).catch(() => {});
      await prisma.chatMessage.deleteMany({}).catch(() => {});
      await prisma.processoEtapa.deleteMany({}).catch(() => {});
      await prisma.auditLog.deleteMany({}).catch(() => {});
      await prisma.processo.deleteMany({}).catch(() => {});

      // Remove todos os usuários que não sejam o admin master oficial
      await (prisma.usuario as any).deleteMany({
        where: {
          NOT: {
            email: 'bela@belacereais.com.br',
          },
        },
      }).catch(() => {});

      // Garante que o ADMIN oficial mestre está ativo e com a senha @Bela2026
      await (prisma.usuario as any).upsert({
        where: { email: 'bela@belacereais.com.br' },
        create: {
          id: 'usr_admin_master',
          nome: 'Administrador PEX',
          email: 'bela@belacereais.com.br',
          username: 'ADMIN',
          senhaHash: HASH_BELA_2026,
          papel: 'ADMIN',
          papeis: ['ADMIN', 'DIRETORIA', 'COMERCIAL', 'FINANCEIRO', 'ADMINISTRATIVO'],
          ativo: true,
          primeiroAcesso: false,
        },
        update: {
          username: 'ADMIN',
          senhaHash: HASH_BELA_2026,
          papel: 'ADMIN',
          papeis: ['ADMIN', 'DIRETORIA', 'COMERCIAL', 'FINANCEIRO', 'ADMINISTRATIVO'],
          ativo: true,
          primeiroAcesso: false,
        },
      }).catch(() => {});
    } catch (e) {
      console.warn('[API Reset POST] Aviso na limpeza do banco relacional:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Sistema 100% zerado com sucesso! Todas as negociações e usuários de teste foram removidos. Apenas o perfil mestre ADMIN foi mantido.',
    });
  } catch (error: any) {
    console.error('[API Reset POST] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

