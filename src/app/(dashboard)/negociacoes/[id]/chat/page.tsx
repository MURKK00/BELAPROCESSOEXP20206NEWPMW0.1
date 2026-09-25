import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { ChatFullPageClient } from '@/components/negociacoes/ChatFullPageClient';

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      mensagens: {
        include: {
          autor: {
            select: {
              id: true,
              nome: true,
              email: true,
              papel: true,
            },
          },
        },
        orderBy: { criadoEm: 'asc' },
      },
    },
  });

  if (!processo) notFound();
  const user = await getSessionUser();

  const mensagensFormatadas = processo.mensagens.map((m) => ({
    id: m.id,
    texto: m.texto,
    criadoEm: m.criadoEm.toISOString(),
    autorId: m.autorId,
    autor: {
      id: m.autor.id,
      nome: m.autor.nome,
      email: m.autor.email,
      papel: m.autor.papel,
    },
  }));

  return (
    <ChatFullPageClient
      processoId={processo.id}
      numeroProcesso={processo.numeroProcesso}
      clienteFinal={processo.clienteFinal}
      mensagensIniciais={mensagensFormatadas}
      currentUserId={user?.id}
    />
  );
}
