'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, RefreshCw, Lock } from 'lucide-react';
import { formatDateTimeBR } from '@/lib/formatters';
import type { ChatMessageItem } from '@/components/negociacoes/FloatingChatDrawer';

interface ChatFullPageClientProps {
  processoId: string;
  numeroProcesso: string;
  clienteFinal: string;
  mensagensIniciais: ChatMessageItem[];
  currentUserId?: string;
}

const QUICK_TAGS = [
  { label: '🚢 Draft BL enviado', text: '🚢 Draft BL enviado ao despachante para conferência com o Armador.' },
  { label: '💰 PTAX travada', text: '💰 PTAX negociada e travada junto à mesa de câmbio.' },
  { label: '📦 Estufagem iniciada', text: '📦 Estufagem iniciada no terminal/REDEX conforme planejado.' },
  { label: '⚠️ Aguardando Booking', text: '⚠️ Atenção: Aguardando armador liberar o número definitivo do Booking.' },
  { label: '📄 RUC/DU-E emitida', text: '📄 RUC vinculada e DU-E gerada no Siscomex.' },
];

export function ChatFullPageClient({
  processoId,
  numeroProcesso,
  clienteFinal,
  mensagensIniciais,
  currentUserId,
}: ChatFullPageClientProps) {
  const [mensagens, setMensagens] = useState<ChatMessageItem[]>(mensagensIniciais);
  const [activeUserId, setActiveUserId] = useState<string | undefined>(currentUserId);
  const [novoTexto, setNovoTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const carregarMensagens = async (isBackground = false) => {
    if (!isBackground) setCarregando(true);
    try {
      const res = await fetch(`/api/negociacoes/${processoId}/chat`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.currentUserId) setActiveUserId(data.currentUserId);
          setMensagens(data.mensagens);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) setCarregando(false);
    }
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [mensagens.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      carregarMensagens(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [processoId]);

  const handleEnviar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textoLimpo = novoTexto.trim();
    if (!textoLimpo || enviando) return;

    setEnviando(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessageItem = {
      id: tempId,
      texto: textoLimpo,
      criadoEm: new Date().toISOString(),
      autorId: activeUserId || 'me',
      autor: {
        id: activeUserId || 'me',
        nome: 'Você',
        email: '',
        papel: 'OPERADOR',
      },
    };

    setMensagens((prev) => [...prev, tempMsg]);
    setNovoTexto('');

    try {
      const res = await fetch(`/api/negociacoes/${processoId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: textoLimpo }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.mensagem) {
          setMensagens((prev) =>
            prev.map((m) => (m.id === tempId ? data.mensagem : m))
          );
        }
      } else {
        setMensagens((prev) => prev.filter((m) => m.id !== tempId));
        alert('Falha ao enviar a mensagem');
      }
    } catch (err) {
      setMensagens((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setEnviando(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleInsertTag = (text: string) => {
    setNovoTexto((prev) => (prev ? `${prev} ${text}` : text));
    textareaRef.current?.focus();
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl flex flex-col h-[650px] overflow-hidden transition-colors">
      
      {/* CABEÇALHO */}
      <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-white">
                Comunicação Operacional & Despacho: {numeroProcesso}
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400">
              {clienteFinal} • Canal criptografado restrito à equipe interna da Bela Cereais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => carregarMensagens(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin text-orange-400' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* LISTA DE MENSAGENS COM AUTO SCROLL */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40 dark:bg-[#0b1120]/70">
        {mensagens.length === 0 && !carregando && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-3">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nenhuma mensagem registrada
            </h3>
            <p className="text-xs max-w-sm leading-relaxed">
              Inicie a troca de recados com os operadores, traders e despachantes sobre os prazos e particularidades deste contrato.
            </p>
          </div>
        )}

        {mensagens.map((m) => {
          const isMine = m.autorId === activeUserId || m.autor?.id === activeUserId;
          const inicial = (m.autor?.nome || 'U')[0].toUpperCase();

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {!isMine && (
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black flex items-center justify-center">
                    {inicial}
                  </span>
                )}
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isMine ? 'Você' : m.autor?.nome || 'Colaborador'}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {formatDateTimeBR(m.criadoEm)}
                </span>
              </div>

              <div
                className={`max-w-[75%] px-4.5 py-3 rounded-2xl text-sm leading-relaxed shadow-xs ${
                  isMine
                    ? 'bg-orange-500 text-white rounded-tr-none font-medium'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.texto}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* RODAPÉ DO CHAT: ATALHOS RÁPIDOS EM CIMA DO CHAT BOX + INPUT */}
      <div className="bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 shrink-0">
        
        {/* CHIPS DE ATALHOS RÁPIDOS NA PARTE INFERIOR ACIMA DO BOX */}
        <div className="px-5 pt-3 pb-1 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            Atalhos:
          </span>
          {QUICK_TAGS.map((tag, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleInsertTag(tag.text)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-orange-500/10 dark:hover:bg-orange-500/20 hover:border-orange-500/30 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 font-semibold text-xs whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* INPUT INFERIOR COM ENVIO INSTANTÂNEO */}
        <div className="p-4 pt-2">
          <form onSubmit={handleEnviar} className="flex flex-col gap-2">
            <div className="relative flex items-center">
              <textarea
                ref={textareaRef}
                rows={2}
                value={novoTexto}
                onChange={(e) => setNovoTexto(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem (Pressione Enter para enviar, Shift+Enter para quebrar linha)..."
                disabled={enviando}
                className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-3.5 pr-14 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />

              <button
                type="submit"
                disabled={!novoTexto.trim() || enviando}
                className="absolute right-3 bottom-3 w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-orange-500/20"
                title="Enviar Mensagem (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
              <span>Pressione <strong className="text-slate-600 dark:text-slate-400">Enter</strong> para envio instantâneo sem recarregar</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                Visível apenas para colaboradores Bela Cereais
              </span>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
