import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDateTimeBR } from '@/lib/formatters';
import { enviarMensagemAction } from '@/server/actions/chatActions';
import { getSessionUser } from '@/lib/auth';

export default async function ChatPage({ params }: { params: { id: string } }) {
  const processo = await prisma.processo.findUnique({
    where: { id: params.id },
    include: { mensagens: { include: { autor: true }, orderBy: { criadoEm: 'asc' } } },
  });
  if (!processo) notFound();
  const user = await getSessionUser();

  return (
    <div className="bg-surface border border-border rounded-2xl flex flex-col h-[500px]">
      <div className="px-5 py-4 border-b border-border flex justify-between items-center">
        <h3 className="text-base font-semibold">Chat interno (Bela Cereais)</h3>
        <span className="text-xs text-gray-500">Visível apenas para colaboradores</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {processo.mensagens.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-10">Nenhuma mensagem ainda.</p>
        )}
        {processo.mensagens.map((m) => {
          const mine = m.autorId === user?.id;
          return (
            <div
              key={m.id}
              className={`max-w-[70%] px-4 py-3 rounded-xl text-sm ${
                mine ? 'self-end bg-blue-50 text-blue-800' : 'self-start bg-gray-100'
              }`}
            >
              <div className="flex justify-between gap-4 text-xs opacity-80 font-semibold mb-1">
                <span>{m.autor.nome}</span>
                <span>{formatDateTimeBR(m.criadoEm)}</span>
              </div>
              <div>{m.texto}</div>
            </div>
          );
        })}
      </div>
      <form action={enviarMensagemAction} className="p-5 border-t border-border flex gap-3 bg-gray-50 rounded-b-2xl">
        <input type="hidden" name="processoId" value={processo.id} />
        <input
          name="texto"
          placeholder="Digite sua mensagem (visível apenas para equipe interna)..."
          required
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-secondary"
        />
        <button
          type="submit"
          className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-100"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
