// LOCAL FINAL DESTE ARQUIVO: prisma/seed.ts (SUBSTITUI o arquivo atual)
//
// Popula parceiros, tipos de documento e as etapas do checklist (agora vindas
// de prisma/checklistData.ts, fonte única compartilhada com o script de reset).

import { PrismaClient, TipoParceiro, CategoriaDocumento, Papel } from '@prisma/client';
import { CHECKLIST_ETAPAS, TIPOS_DOCUMENTO_CHECKLIST } from './checklistData';

const prisma = new PrismaClient();

async function main() {
  // 0. Usuário padrão de desenvolvimento
  await prisma.usuario.upsert({
    where: { email: 'dev@belacereais.local' },
    update: {},
    create: { nome: 'Admin (Dev)', email: 'dev@belacereais.local', papel: Papel.ADMIN },
  });

  // 1. Parceiros externos
  const parceiros = await Promise.all([
    prisma.parceiro.upsert({ where: { nome: 'Buonny' }, update: {}, create: { nome: 'Buonny', tipo: TipoParceiro.GERENCIADORA_RISCO } }),
    prisma.parceiro.upsert({ where: { nome: 'CROMO' }, update: {}, create: { nome: 'CROMO', tipo: TipoParceiro.AGENTE_DESPACHANTE } }),
    prisma.parceiro.upsert({ where: { nome: 'SCAN' }, update: {}, create: { nome: 'SCAN', tipo: TipoParceiro.AGENTE_BOOKING } }),
    prisma.parceiro.upsert({ where: { nome: 'Port Inspect' }, update: {}, create: { nome: 'Port Inspect', tipo: TipoParceiro.INSPETORIA } }),
    prisma.parceiro.upsert({ where: { nome: 'SURVEY / UNICCA' }, update: {}, create: { nome: 'SURVEY / UNICCA', tipo: TipoParceiro.SURVEY_FUMIGACAO } }),
    prisma.parceiro.upsert({ where: { nome: 'AT&M' }, update: {}, create: { nome: 'AT&M', tipo: TipoParceiro.SEGURADORA } }),
    prisma.parceiro.upsert({ where: { nome: 'Banco do Brasil' }, update: {}, create: { nome: 'Banco do Brasil', tipo: TipoParceiro.BANCO } }),
    prisma.parceiro.upsert({ where: { nome: 'DHL' }, update: {}, create: { nome: 'DHL', tipo: TipoParceiro.TRANSPORTADORA_INTL } }),
    prisma.parceiro.upsert({ where: { nome: 'Fretebras' }, update: {}, create: { nome: 'Fretebras', tipo: TipoParceiro.TRANSPORTADORA } }),
  ]);

  // 2. Tipos de documento (inclui os novos usados no checklist, ex: DU-E)
  const tiposBase = [
    { nome: 'Minuta de Contrato de Compra', categoria: CategoriaDocumento.ADMINISTRATIVO },
    { nome: 'Contrato de Compra Assinado', categoria: CategoriaDocumento.ADMINISTRATIVO },
    { nome: 'Parecer de Risco (Buonny)', categoria: CategoriaDocumento.ADMINISTRATIVO },
    { nome: 'Ordem de Carregamento', categoria: CategoriaDocumento.ADMINISTRATIVO },
    { nome: 'Booking', categoria: CategoriaDocumento.BOOKING_TRANSPORTE },
    { nome: 'Borderô Bancário', categoria: CategoriaDocumento.FECHAMENTO_BANCARIO },
    { nome: 'Contrato de Câmbio', categoria: CategoriaDocumento.FECHAMENTO_BANCARIO },
  ];

  for (const t of [...tiposBase, ...TIPOS_DOCUMENTO_CHECKLIST]) {
    await prisma.tipoDocumento.upsert({
      where: { nome: t.nome },
      update: {},
      create: {
        nome: t.nome,
        categoria: t.categoria as CategoriaDocumento,
        obrigatorioNoPacoteFinal: 'obrigatorioNoPacoteFinal' in t ? Boolean((t as any).obrigatorioNoPacoteFinal) : false,
      },
    });
  }

  const tiposDoc = await prisma.tipoDocumento.findMany();
  const t = Object.fromEntries(tiposDoc.map((x) => [x.nome, x.id]));
  const p = Object.fromEntries(parceiros.map((x) => [x.nome, x.id]));
  void p; // reservado caso queira ligar parceiro a alguma etapa no futuro

  // 3. Etapas do checklist (fonte única em checklistData.ts)
  for (const e of CHECKLIST_ETAPAS) {
    await prisma.etapaTemplate.upsert({
      where: { numero: e.numero },
      update: {},
      create: {
        numero: e.numero,
        ordem: e.ordem,
        fase: e.fase,
        etapa: e.etapa,
        raiaResponsavel: e.raiaResponsavel,
        geraDocumento: e.geraDocumento ?? false,
        tipoDocumentoId: e.tipoDocNome ? t[e.tipoDocNome] : undefined,
      },
    });
  }

  console.log(`Seed concluído: ${parceiros.length} parceiros, ${tiposDoc.length} tipos de documento, ${CHECKLIST_ETAPAS.length} etapas do checklist.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
