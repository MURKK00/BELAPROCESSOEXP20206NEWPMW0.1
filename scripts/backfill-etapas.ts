import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.etapaTemplate.findMany();
  const processos = await prisma.processo.findMany({ include: { etapas: true } });

  for (const processo of processos) {
    if (processo.etapas.length > 0) continue;
    await prisma.processoEtapa.createMany({
      data: templates.map((t) => ({
        processoId: processo.id,
        etapaTemplateId: t.id,
        status: 'PENDENTE',
      })),
    });
    console.log(`Etapas criadas para ${processo.numeroProcesso}`);
  }
}

main().finally(() => prisma.$disconnect());