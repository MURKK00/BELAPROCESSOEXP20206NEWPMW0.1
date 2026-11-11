import { PrismaClient } from '@prisma/client';
import { createMockPrismaClient } from './prismaMockClient';

const isDummyDbUrl =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('host:5432') ||
  process.env.DATABASE_URL.includes('user:password@host');

let schemaSyncPromise: Promise<void> | null = null;

export async function ensureDatabaseSchema(client: any): Promise<void> {
  if (!client || typeof client.$executeRawUnsafe !== 'function') return;
  if (schemaSyncPromise) return schemaSyncPromise;

  schemaSyncPromise = (async () => {
    try {
      await client.$executeRawUnsafe(`
        ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "username" TEXT;
        ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "senhaHash" TEXT;
        ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
        ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "primeiroAcesso" BOOLEAN NOT NULL DEFAULT true;
        ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "papeis" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
        ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "imagem" TEXT;
        ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Usuario_username_key') THEN
            CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Usuario_cpf_key') THEN
            CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario"("cpf");
          END IF;
        END $$;
      `);
      console.log('[Prisma] Auto-migration: Schema Usuario sincronizado com sucesso no Supabase PostgreSQL.');
    } catch (err: any) {
      console.warn('[Prisma] Auto-migration aviso:', err?.message);
    }
  })();

  return schemaSyncPromise;
}

let clientInstance: any;

if (isDummyDbUrl) {
  // Database not configured or using default template placeholder host -> use robust in-memory mock
  clientInstance = createMockPrismaClient();
} else {
  try {
    const realPrisma = new PrismaClient();
    const mock = createMockPrismaClient();

    // Dispara a sincronização de schema em segundo plano assim que conecta ao Supabase
    ensureDatabaseSchema(realPrisma).catch(() => {});

    // Wrap real Prisma with proxy to gracefully fall back to mock on connection errors
    clientInstance = new Proxy(realPrisma, {
      get(target, prop, receiver) {
        if (prop === '$transaction') {
          return async (arg: any) => {
            if (Array.isArray(arg)) {
              try {
                return await Promise.all(arg);
              } catch (err: any) {
                console.warn('[Prisma] $transaction array failed, falling back to mock:', err?.message);
                return await (mock as any).$transaction(arg);
              }
            }
            try {
              return await (target as any).$transaction(arg);
            } catch (err: any) {
              console.warn('[Prisma] $transaction callback failed, falling back to mock:', err?.message);
              return await (mock as any).$transaction(arg);
            }
          };
        }

        const origVal = Reflect.get(target, prop, receiver);
        if (typeof origVal === 'function') {
          return origVal.bind(target);
        }
        if (typeof origVal === 'object' && origVal !== null) {
          return new Proxy(origVal, {
            get(subTarget, subProp, subReceiver) {
              const method = Reflect.get(subTarget, subProp, subReceiver);
              if (typeof method === 'function') {
                return async (...args: any[]) => {
                  try {
                    return await method.apply(subTarget, args);
                  } catch (err: any) {
                    const errMsg = String(err?.message || '');
                    console.warn(`[Prisma] Query failed: ${String(prop)}.${String(subProp)} - ${errMsg}`);

                    // Se for erro de coluna inexistente no Postgres, executa a sincronização do schema e tenta novamente
                    if (errMsg.includes('does not exist') || errMsg.includes('column') || errMsg.includes('coluna')) {
                      try {
                        await ensureDatabaseSchema(realPrisma);
                        return await method.apply(subTarget, args);
                      } catch (retryErr: any) {
                        console.warn(`[Prisma] Retry após sincronizar schema falhou:`, retryErr?.message);
                      }
                    }

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
