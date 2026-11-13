import { PrismaClient } from '@prisma/client';
import { createMockPrismaClient } from './prismaMockClient';

const isDummyDbUrl =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('host:5432') ||
  process.env.DATABASE_URL.includes('user:password@host');

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (isDummyDbUrl) {
    return createMockPrismaClient() as unknown as PrismaClient;
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function ensureDatabaseSchema(_client?: any): Promise<void> {
  return;
}

export default prisma;
