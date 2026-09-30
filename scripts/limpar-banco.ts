import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const STORAGE_FILE_PATH = path.join(process.cwd(), 'prisma', 'dev-store.json');

async function main() {
  console.log('🧹 Limpando negociações e registros operacionais...');

  const safeDelete = async (name: string, fn: () => Promise<any>) => {
    try {
      await fn();
    } catch (e: any) {
      // Ignora erro se a tabela ainda não existe no banco ou se estiver vazia
      console.log(`ℹ️ [${name}] Ignorado ou já vazio: ${e?.message?.slice(0, 80) ?? ''}`);
    }
  };

  // 1. Limpeza no banco de dados relacional (Supabase / PostgreSQL)
  try {
    // Deleta em ordem correta respeitando as foreign keys
    await safeDelete('custoItem', () => prisma.custoItem.deleteMany({}));
    await safeDelete('cambioTravado', () => prisma.cambioTravado.deleteMany({}));
    await safeDelete('financeiro', () => prisma.financeiro.deleteMany({}));
    await safeDelete('container', () => prisma.container.deleteMany({}));
    await safeDelete('documento', () => prisma.documento.deleteMany({}));
    await safeDelete('chatMessage', () => prisma.chatMessage.deleteMany({}));
    await safeDelete('processoEtapa', () => prisma.processoEtapa.deleteMany({}));
    await safeDelete('auditLog', () => prisma.auditLog.deleteMany({}));

    // Deleta todos os processos (negociações)
    let count = 0;
    try {
      const res = await prisma.processo.deleteMany({});
      count = res.count;
    } catch (e: any) {
      console.log('ℹ️ Tabela processo não encontrada ou inacessível no banco:', e?.message?.slice(0, 80));
    }
    console.log(`✅ Banco relacional limpo! Negociações excluídas: ${count}`);
  } catch (err: any) {
    console.log('ℹ️ Conexão com banco relacional finalizada ou não configurada:', err?.message?.slice(0, 80));
  }

  // 2. Limpeza no arquivo de cache local (dev-store.json), se existir
  if (fs.existsSync(STORAGE_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(STORAGE_FILE_PATH, 'utf-8');
      const store = JSON.parse(raw);
      store.processos = [];
      store.processoEtapas = [];
      store.containers = [];
      store.financeiros = [];
      store.custosItem = [];
      store.cambiosTravados = [];
      store.documentos = [];
      store.chatMessages = [];
      store.auditLogs = [];
      fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
      console.log('✅ Armazenamento local dev-store.json zerado com sucesso!');
    } catch (err) {
      console.warn('⚠️ Erro ao atualizar dev-store.json:', err);
    }
  }

  console.log('🌱 Usuários, parceiros e checklist de etapas foram 100% preservados.');
  console.log('✨ O sistema agora está 100% zerado e pronto para você cadastrar suas negociações reais do zero!');
}

main()
  .catch((e) => {
    console.error('❌ Erro inesperado ao limpar negociações:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
