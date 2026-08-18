'use client';

import { useEffect, useRef, useState } from 'react';

type Mensagem = {
  id: string;
  texto: string;
  criadoEm: string;
  autorId: string;
  autorNome: string;
};

export function ChatSidebar({ processoId }: { processoId: string }) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [naoLidas, setNaoLidas] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abertoRef = useRef(aberto);
  abertoRef.current = aberto;

  const lastReadKey = `chat-last-read-${processoId}`;

  async function carregarMensagens() {
    try {
      const res = await fetch(`/api/processos/${processoId}/mensagens`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setMensagens(data.mensagens);
      setCurrentUserId(data.currentUserId);

      if (!abertoRef.current) {
        const lastRead = Number(localStorage.getItem(lastReadKey) ?? '0');
        const novasDeOutros = data.mensagens.filter(
          (m: Mensagem) => m.autorId !== data.currentUserId && new Date(m.criadoEm).getTime() > lastRead
        );
        setNaoLidas(novasDeOutros.length);
      }
    } catch {
      // silencioso — próxima tentativa de polling resolve
    }
  }

  useEffect(() => {
    carregarMensagens();
    const interval = setInterval(carregarMensagens, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (aberto) {
      localStorage.setItem(lastReadKey, String(Date.now()));
      setNaoLidas(0);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, mensagens.length]);

  async function enviar() {
    const valor = texto.trim();
    if (!valor) return;
    setTexto('');
    await fetch(`/api/processos/${processoId}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: valor }),
    });
    carregarMensagens();
  }

  return (
    <>
      {/* Aba fixa no canto esquerdo */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40">
        <button
          onClick={() => setAberto((v) => !v)}
          className="relative bg-blue-600 text-white px-2 py-4 rounded-r-lg shadow-lg flex flex-col items-center gap-1 hover:bg-blue-700 transition-colors"
          title="Chat interno"
        >
          <span className="text-lg leading-none">{aberto ? '‹' : '›'}</span>
          <span className="text-[10px] font-semibold [writing-mode:vertical-rl] rotate-180">
            CHAT
          </span>
          {naoLidas > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {naoLidas}
            </span>
          )}
        </button>
      </div>

      {/* Painel do chat — abre do lado direito */}
      {aberto && (
        <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-base font-semibold">Chat interno (Bela Cereais)</h3>
            <button
              onClick={() => setAberto(false)}
              className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            >
              ×
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            {mensagens.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-10">Nenhuma mensagem ainda.</p>
            )}
            {mensagens.map((m) => {
              const mine = m.autorId === currentUserId;
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    mine ? 'self-end bg-blue-50 text-blue-800' : 'self-start bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between gap-3 text-[11px] opacity-70 font-semibold mb-1">
                    <span>{m.autorNome}</span>
                    <span>{new Date(m.criadoEm).toLocaleString('pt-BR')}</span>
                  </div>
                  <div>{m.texto}</div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-gray-200 flex gap-2 bg-gray-50">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  enviar();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              onClick={enviar}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}