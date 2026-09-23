'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Ship, Container, DollarSign, Calendar, ArrowRight, X, Clock, FileText } from 'lucide-react';

interface SearchResultItem {
  id: string;
  numeroProcesso: string;
  clienteFinal: string;
  produto: string;
  navio?: string | null;
  bookingNumero?: string | null;
  status: string;
  portoDestino: string;
  deadlineEmbarque?: string | null;
}

export function CommandBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Escuta atalho Ctrl+K ou Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Foco automático ao abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      carregarProcessos();
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Carrega listagem rápida via API
  const carregarProcessos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/busca-rapida');
      if (res.ok) {
        const data = await res.json();
        setItems(data.processos || []);
      }
    } catch {
      // Ignora erro de busca
    } finally {
      setLoading(false);
    }
  };

  const resultadosFiltrados = items.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.numeroProcesso.toLowerCase().includes(q) ||
      p.clienteFinal.toLowerCase().includes(q) ||
      p.produto.toLowerCase().includes(q) ||
      (p.navio && p.navio.toLowerCase().includes(q)) ||
      (p.bookingNumero && p.bookingNumero.toLowerCase().includes(q)) ||
      p.portoDestino.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const handleSelect = (item: SearchResultItem, targetTab?: string) => {
    setOpen(false);
    const dest = targetTab ? `/negociacoes/${item.id}/${targetTab}` : `/negociacoes/${item.id}`;
    router.push(dest);
  };

  // Navegação por teclado (Cima, Baixo, Enter)
  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < resultadosFiltrados.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : resultadosFiltrados.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (resultadosFiltrados[selectedIndex]) {
        handleSelect(resultadosFiltrados[selectedIndex]);
      }
    }
  };

  return (
    <>
      {/* BOTÃO DISPARADOR NA BARRA OU CABEÇALHO */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-full max-w-sm px-3 py-1.5 text-xs text-gray-500 bg-gray-50 hover:bg-white hover:text-gray-900 border border-gray-200 rounded-lg transition-all shadow-2xs group"
        title="Busca rápida (Ctrl + K)"
      >
        <span className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-secondary" />
          <span>Buscar processo, navio, cliente...</span>
        </span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-gray-500 bg-white border border-gray-300 rounded shadow-2xs">
          Ctrl K
        </kbd>
      </button>

      {/* MODAL OVERLAY */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* INPUT DE BUSCA */}
            <div className="relative border-b border-gray-200 flex items-center px-4">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDownList}
                placeholder="Digite o número do processo, navio, booking, cliente ou produto..."
                className="w-full py-4 pl-3 pr-8 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* LISTA DE RESULTADOS */}
            <div className="overflow-y-auto p-2 space-y-1 divide-y divide-gray-100">
              {loading && items.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Carregando processos...
                </div>
              ) : resultadosFiltrados.length > 0 ? (
                resultadosFiltrados.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                        isSelected ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-600'}`}>
                          <Ship className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-gray-900">{item.numeroProcesso}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                              {item.status}
                            </span>
                            <span className="text-xs text-gray-500 truncate">{item.produto}</span>
                          </div>
                          <div className="text-xs text-gray-500 truncate flex items-center gap-2 mt-0.5">
                            <strong className="text-gray-700 font-semibold">{item.clienteFinal}</strong>
                            <span>• Destino: {item.portoDestino}</span>
                            {item.bookingNumero && <span>• Booking: {item.bookingNumero}</span>}
                            {item.navio && <span>• Navio: {item.navio}</span>}
                          </div>
                        </div>
                      </div>

                      {/* ATALHOS RÁPIDOS DENTRO DO ITEM */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(item, 'financeiro');
                          }}
                          title="Ir direto para Financeiro / DRE"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(item, 'containers');
                          }}
                          title="Ir direto para Contêineres"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Container className="w-4 h-4" />
                        </button>
                        <ArrowRight className="w-4 h-4 text-gray-300 ml-1" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Nenhum processo localizado para &ldquo;{query}&rdquo;.
                </div>
              )}
            </div>

            {/* RODAPÉ DO MODAL */}
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-500 flex items-center justify-between">
              <span>Use <kbd className="font-semibold text-gray-700">↑</kbd> <kbd className="font-semibold text-gray-700">↓</kbd> para navegar e <kbd className="font-semibold text-gray-700">Enter</kbd> para abrir</span>
              <span>ESC para fechar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
