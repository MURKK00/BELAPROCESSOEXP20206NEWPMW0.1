import { PrismaClient } from '@prisma/client';
import { createMockPrismaClient } from './prismaMockClient';

const isDummyDbUrl =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('host:5432') ||
  process.env.DATABASE_URL.includes('user:password@host');

let clientInstance: any;

if (isDummyDbUrl) {
  // Database not configured or using default template placeholder host -> use robust in-memory mock
  clientInstance = createMockPrismaClient();
} else {
  try {
    const realPrisma = new PrismaClient();
    const mock = createMockPrismaClient();

    // Wrap real Prisma with proxy to gracefully fall back to mock on connection errors
    clientInstance = new Proxy(realPrisma, {
      get(target, prop, receiver) {
        const origVal = Reflect.get(target, prop, receiver);
        if (typeof origVal === 'object' && origVal !== null) {
          return new Proxy(origVal, {
            get(subTarget, subProp, subReceiver) {
              const method = Reflect.get(subTarget, subProp, subReceiver);
              if (typeof method === 'function') {
                return async (...args: any[]) => {
                  try {
                    return await method.apply(subTarget, args);
                  } catch (err: any) {
                    console.warn(`[Prisma] Query failed, falling back to mock: ${String(prop)}.${String(subProp)}`, err?.message);
                    const mockModel = (mock as any)[prop];
                    if (mockModel && typeof mockModel[subProp] === 'function') {
                      return await mockModel[subProp](...args);
                    }
                    throw err;
                  }
                };
              }
              return method;
            },
          });
        }
        return origVal;
      },
    });
  } catch {
    clientInstance = createMockPrismaClient();
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma: PrismaClient = (globalForPrisma.prisma || clientInstance) as unknown as PrismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
