import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

// Reutiliza a instância existente para não esgotar conexões em ambiente Serverless (Vercel)
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Mantida apenas como no-op (vazia) para não quebrar imports existentes em outros arquivos.
 * As migrações de banco devem rodar via `prisma migrate deploy` no build, nunca em cold start.
 */
export async function ensureDatabaseSchema(_client?: any): Promise<void> {
  return;
}

export default prisma;
