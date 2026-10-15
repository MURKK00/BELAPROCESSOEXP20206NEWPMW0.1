import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/passwordUtils';
import { Papel } from '@prisma/client';

async function main() {
  console.log('[Seed Admin] Iniciando criação do usuário admin no banco...');

  const senhaPadrao = 'admin123';
  const senhaHash = await hashPassword(senhaPadrao);

  // 1. Usuário Admin Principal
  const adminPrincipal = await prisma.usuario.upsert({
    where: { email: 'admin@belacereais.com.br' },
    update: {
      nome: 'Administrador Bela Cereais',
      senhaHash,
      papel: Papel.ADMIN,
      ativo: true,
    },
    create: {
      nome: 'Administrador Bela Cereais',
      email: 'admin@belacereais.com.br',
      senhaHash,
      papel: Papel.ADMIN,
      ativo: true,
    },
  });

  console.log(`[Seed Admin] Usuário admin principal garantido: ${adminPrincipal.email} (ID: ${adminPrincipal.id})`);

  // 2. Usuário Dev Admin
  const adminDev = await prisma.usuario.upsert({
    where: { email: 'dev@belacereais.local' },
    update: {
      nome: 'Admin (Dev)',
      senhaHash,
      papel: Papel.ADMIN,
      ativo: true,
    },
    create: {
      nome: 'Admin (Dev)',
      email: 'dev@belacereais.local',
      senhaHash,
      papel: Papel.ADMIN,
      ativo: true,
    },
  });

  console.log(`[Seed Admin] Usuário admin dev garantido: ${adminDev.email} (ID: ${adminDev.id})`);
  console.log('[Seed Admin] Concluído com sucesso! Senha padrão de acesso: admin123');
}

main()
  .catch((e) => {
    console.error('[Seed Admin] Erro ao criar usuário admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    if (typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
    }
  });
