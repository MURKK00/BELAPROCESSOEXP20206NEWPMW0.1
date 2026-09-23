'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Ship, Box, FileText, ChevronRight, X, Loader2, Command } from 'lucide-react';
import { STATUS_NEGOCIACAO_MAP } from '@/lib/formatters';

interface SearchResult {
  id: string;
  numeroProcesso: string;
  clienteFinal: string;
  produto: string;
  status: string;
  bookingNumero: string | null;
  navio: string | null;
  matchReason: string;
  matchedDetail?: string;
}

export function GlobalSpotlight() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Escutar atalho de teclado Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Foco no input ao abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Busca debounced
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Erro na busca:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (processoId: string) => {
    setOpen(false);
    router.push(`/negociacoes/${processoId}`);
  };

  const handleKeyDownNav = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex].id);
      }
    }
  };

  return (
    <>
      {/* Botão de Disparo no topo da sidebar ou header */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 rounded-lg border border-border transition-colors group"
      >
        <span className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-secondary" />
          <span>Buscar processo, container...</span>
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-gray-200 rounded text-gray-500 shadow-2xs">
          Ctrl K
        </kbd>
      </button>

      {/* Modal Spotlight */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Input Header */}
            <div className="flex items-center px-4 border-b border-border bg-gray-50/70">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Pesquisar por Processo, Booking, Container, Lacre, Navio ou Cliente..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDownNav}
                className="w-full px-3 py-4 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
              />
              {loading && <Loader2 className="w-4 h-4 text-secondary animate-spin shrink-0 mr-2" />}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Content / Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {query.length < 2 ? (
                <div className="py-10 text-center text-gray-400 text-xs">
                  <Command className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium text-gray-600">Busca Rápida Global</p>
                  <p className="mt-1">Digite ao menos 2 caracteres para localizar negociações, contêineres e lacres.</p>
                </div>
              ) : results.length === 0 && !loading ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  Nenhum resultado encontrado para &quot;<span className="font-semibold text-gray-800">{query}</span>&quot;.
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Processos Encontrados ({results.length})
                  </div>
                  {results.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition-colors ${
                        selectedIndex === idx
                          ? 'bg-amber-500/10 text-gray-900 border border-secondary/30'
                          : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-gray-100 text-gray-600 shrink-0 mt-0.5">
                          {item.matchReason === 'Container' || item.matchReason === 'Lacre' ? (
                            <Box className="w-4 h-4 text-secondary" />
                          ) : item.matchReason === 'Navio' ? (
                            <Ship className="w-4 h-4 text-blue-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-gray-700" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{item.numeroProcesso}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                              {STATUS_NEGOCIACAO_MAP[item.status] || item.status}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                              {item.matchReason}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 truncate mt-0.5">
                            <strong className="text-gray-800">{item.clienteFinal}</strong> • {item.produto}
                          </div>
                          {item.matchedDetail && (
                            <div className="text-[11px] font-mono text-secondary font-semibold mt-1">
                              ➜ {item.matchedDetail}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-gray-50 border-t border-border flex items-center justify-between text-[11px] text-gray-500">
              <span>Navegue com as setas ↑ ↓ e pressione Enter</span>
              <span>ESC para fechar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
