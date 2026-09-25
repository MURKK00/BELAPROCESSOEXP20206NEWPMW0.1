'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { formatDateTimeBR } from '@/lib/formatters';

export interface ChatMessageItem {
  id: string;
  texto: string;
  criadoEm: string | Date;
  autorId: string;
  autor: {
    id: string;
    nome: string;
    email: string;
    papel: string;
  };
}

interface FloatingChatDrawerProps {
  processoId: string;
  numeroProcesso: string;
  clienteFinal: string;
  mensagensIniciais?: ChatMessageItem[];
  currentUserId?: string;
  initialOpen?: boolean;
}

const QUICK_TAGS = [
  { label: '🚢 Draft BL enviado', text: '🚢 Draft BL enviado ao despachante para conferência com o Armador.' },
  { label: '💰 PTAX travada', text: '💰 PTAX negociada e travada junto à mesa de câmbio.' },
  { label: '📦 Estufagem iniciada', text: '📦 Estufagem iniciada no terminal/REDEX conforme planejado.' },
  { label: '⚠️ Aguardando Booking', text: '⚠️ Atenção: Aguardando armador liberar o número definitivo do Booking.' },
  { label: '📄 RUC/DU-E emitida', text: '📄 RUC vinculada e DU-E gerada no Siscomex.' },
];

export function FloatingChatDrawer({
  processoId,
  numeroProcesso,
  clienteFinal,
  mensagensIniciais = [],
  currentUserId,
  initialOpen = false,
}: FloatingChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mensagens, setMensagens] = useState<ChatMessageItem[]>(mensagensIniciais);
  const [activeUserId, setActiveUserId] = useState<string | undefined>(currentUserId);
  const [novoTexto, setNovoTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carregar mensagens e checar novas periodicamente
  const carregarMensagens = async (isBackground = false) => {
    if (!isBackground) setCarregando(true);
    try {
      const res = await fetch(`/api/negociacoes/${processoId}/chat`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.currentUserId) setActiveUserId(data.currentUserId);
          
          setMensagens((prev) => {
            if (!isOpen && data.mensagens.length > prev.length) {
              setNaoLidas((c) => c + (data.mensagens.length - prev.length));
            }
            return data.mensagens;
          });
        }
      }
    } catch (e) {
      console.error('Erro ao buscar mensagens:', e);
    } finally {
      if (!isBackground) setCarregando(false);
    }
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    carregarMensagens(true);
  }, [processoId]);

  useEffect(() => {
    if (isOpen) {
      setNaoLidas(0);
      scrollToBottom(false);
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom(true);
  }, [mensagens.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      carregarMensagens(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen, processoId]);

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
        alert('Não foi possível enviar a mensagem. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro de envio:', err);
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
    <>
      {/* BOTÃO FLUTUANTE (DOCK) NO CANTO INFERIOR DIREITO */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-4 py-3 bg-[#0f172a] dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-500 text-white rounded-full shadow-2xl hover:shadow-orange-500/30 border border-slate-700/80 dark:border-orange-400/40 transition-all cursor-pointer"
            title="Abrir Chat Operacional Interno"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5 text-orange-400 dark:text-white group-hover:text-white transition-colors" />
              {naoLidas > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-rose-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#0f172a] animate-bounce">
                  {naoLidas}
                </span>
              )}
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-tight flex items-center gap-1.5">
                <span>Chat do Processo</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                  {mensagens.length}
                </span>
              </span>
              <span className="text-[10px] text-slate-300 dark:text-orange-100/90 font-medium truncate max-w-[120px]">
                {numeroProcesso}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* GAVETA FLUTUANTE LATERAL / SLIDE-OVER */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 ${
            isExpanded
              ? 'inset-y-0 right-0 w-full sm:w-[560px] md:w-[680px]'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[460px] h-[600px] max-h-[88vh]'
          }`}
        >
          <div
            className={`w-full h-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all ${
              isExpanded ? 'rounded-none sm:rounded-l-3xl border-r-0' : 'rounded-3xl'
            }`}
          >
            {/* CABEÇALHO DO CHAT */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black tracking-tight truncate text-white">
                      Chat Interno: {numeroProcesso}
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online" />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {clienteFinal} • Exclusivo Bela Cereais
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => carregarMensagens(false)}
                  title="Atualizar mensagens"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin text-orange-400' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Reduzir janela' : 'Expandir lateral'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Fechar chat"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CORPO DE MENSAGENS COM ROLAGEM */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40 dark:bg-[#0b1120]/70">
              {mensagens.length === 0 && !carregando && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nenhuma mensagem registrada
                  </h4>
                  <p className="text-xs max-w-xs leading-relaxed">
                    Utilize este canal para alinhar detalhes de despacho, travas de câmbio, armador e redex com sua equipe.
                  </p>
                </div>
              )}

              {mensagens.map((m) => {
                const isMine = m.autorId === activeUserId || m.autor?.id === activeUserId;
                const inicial = (m.autor?.nome || 'U')[0].toUpperCase();

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {!isMine && (
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black flex items-center justify-center">
                          {inicial}
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {isMine ? 'Você' : m.autor?.nome || 'Colaborador'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatDateTimeBR(m.criadoEm)}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[78%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
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

            {/* RODAPÉ DO CHAT: ATALHOS RÁPIDOS EM CIMA DO CHAT BOX + FORMULÁRIO */}
            <div className="bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 shrink-0">
              
              {/* CHIPS DE RECADOS RÁPIDOS (AGORA NA PARTE INFERIOR, LOGO ACIMA DO CHAT BOX) */}
              <div className="px-3.5 pt-2.5 pb-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider shrink-0 flex items-center gap-1 mr-0.5">
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  Atalhos:
                </span>
                {QUICK_TAGS.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertTag(tag.text)}
                    className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/80 hover:bg-orange-500/10 dark:hover:bg-orange-500/20 hover:border-orange-500/40 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 font-semibold text-[11px] whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* INPUT DE DIGITAÇÃO COM BOTÃO DE ENVIO */}
              <div className="p-3.5 pt-2">
                <form onSubmit={handleEnviar} className="flex flex-col gap-2">
                  <div className="relative flex items-center">
                    <textarea
                      ref={textareaRef}
                      rows={2}
                      value={novoTexto}
                      onChange={(e) => setNovoTexto(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Digite sua mensagem (Enter para enviar, Shift+Enter para quebra)..."
                      disabled={enviando}
                      className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-3 pr-12 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                    />

                    <button
                      type="submit"
                      disabled={!novoTexto.trim() || enviando}
                      className="absolute right-2.5 bottom-2.5 w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-orange-500/20"
                      title="Enviar Mensagem (Enter)"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-1">
                    <span>Pressione <strong className="text-slate-600 dark:text-slate-400">Enter</strong> para envio instantâneo</span>
                    <span>🔒 Equipe Bela Cereais</span>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
