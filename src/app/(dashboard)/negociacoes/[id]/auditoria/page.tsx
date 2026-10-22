import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AuditoriaViewClient } from '@/components/negociacoes/AuditoriaViewClient';

export default async function AuditoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      logs: {
        include: { usuario: true },
        orderBy: { criadoEm: 'desc' },
      },
    },
  });

  if (!processo) notFound();

  // Serializa logs para garantir compatibilidade com Client Component
  const logsSerializados = (processo.logs || []).map((l: any) => ({
    id: l.id,
    processoId: l.processoId,
    usuarioId: l.usuarioId,
    acao: l.acao,
    detalhe: l.detalhe,
    alteracoes: l.alteracoes ?? null,
    criadoEm: l.criadoEm instanceof Date ? l.criadoEm.toISOString() : String(l.criadoEm || new Date().toISOString()),
    usuario: l.usuario
      ? {
          id: l.usuario.id,
          nome: l.usuario.nome,
          email: l.usuario.email,
          papel: l.usuario.papel,
        }
      : {
          id: l.usuarioId || 'usr_dev_admin',
          nome: 'Administrador Bela Cereais',
          email: 'admin@belacereais.com.br',
          papel: 'ADMIN',
        },
  }));

  return (
    <AuditoriaViewClient
      processoId={processo.id}
      numeroProcesso={processo.numeroProcesso}
      clienteFinal={processo.clienteFinal}
      logs={logsSerializados}
    />
  );
}