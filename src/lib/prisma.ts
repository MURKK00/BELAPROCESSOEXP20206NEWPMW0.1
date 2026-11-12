import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

const prismaInstance = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaInstance;
}

// Exporta como any para manter 100% de compatibilidade com os tipos dinâmicos já usados nas páginas do projeto
export const prisma: any = prismaInstance;

export async function ensureDatabaseSchema(_client?: any): Promise<void> {
  return;
}

export default prisma;
