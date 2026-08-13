// LOCAL FINAL DESTE ARQUIVO: scripts/reset-checklist.ts (arquivo NOVO)
//
// Roda UMA VEZ para atualizar o checklist do banco que já está em uso, sem
// apagar as negociações existentes. O que ele faz:
//   1. Garante que os tipos de documento novos existem (ex: DU-E)
//   2. Apaga as etapas antigas (ProcessoEtapa e EtapaTemplate)
//   3. Cria as novas etapas (a partir de prisma/checklistData.ts)
//   4. Reinstancia o checklist novo em TODAS as negociações já existentes
//      (todas as caixinhas nascem como PENDENTE de novo)
//
// Como rodar (na pasta do projeto, com o terminal aberto):
//   npx tsx scripts/reset-checklist.ts

import { PrismaClient, CategoriaDocumento } from '@prisma/client';
import { CHECKLIST_ETAPAS, TIPOS_DOCUMENTO_CHECKLIST } from '../prisma/checklistData';

const prisma = new PrismaClient();

async function main() {
  console.log('1/4 — Garantindo tipos de documento necessários...');
  for (const tipo of TIPOS_DOCUMENTO_CHECKLIST) {
    await prisma.tipoDocumento.upsert({
      where: { nome: tipo.nome },
      update: {},
      create: {
        nome: tipo.nome,
        categoria: tipo.categoria as CategoriaDocumento,
        obrigatorioNoPacoteFinal: tipo.obrigatorioNoPacoteFinal ?? false,
      },
    });
  }

  console.log('2/4 — Apagando checklist antigo (ProcessoEtapa + EtapaTemplate)...');
  await prisma.processoEtapa.deleteMany({});
  await prisma.etapaTemplate.deleteMany({});

  console.log('3/4 — Criando o novo checklist (EtapaTemplate)...');
  const tiposDoc = await prisma.tipoDocumento.findMany();
  const tiposPorNome = Object.fromEntries(tiposDoc.map((x) => [x.nome, x.id]));

  for (const e of CHECKLIST_ETAPAS) {
    await prisma.etapaTemplate.create({
      data: {
        numero: e.numero,
        ordem: e.ordem,
        fase: e.fase,
        etapa: e.etapa,
        raiaResponsavel: e.raiaResponsavel,
        geraDocumento: e.geraDocumento ?? false,
        tipoDocumentoId: e.tipoDocNome ? tiposPorNome[e.tipoDocNome] : undefined,
      },
    });
  }

  console.log('4/4 — Recriando o checklist em todas as negociações existentes...');
  const templates = await prisma.etapaTemplate.findMany();
  const processos = await prisma.processo.findMany();

  for (const processo of processos) {
    await prisma.processoEtapa.createMany({
      data: templates.map((t) => ({
        processoId: processo.id,
        etapaTemplateId: t.id,
        status: 'PENDENTE',
      })),
    });
  }

  console.log(`Pronto! Checklist novo aplicado em ${processos.length} negociação(ões).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
