'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);

    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamic module') ||
      error?.message?.includes('Cannot find module');

    if (isChunkError && typeof window !== 'undefined') {
      const storageKey = 'chunk_reload_ts';
      const lastReload = Number(sessionStorage.getItem(storageKey) || '0');
      const now = Date.now();
      if (now - lastReload > 8000) {
        sessionStorage.setItem(storageKey, String(now));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
      <div className="max-w-md text-center bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 font-black text-2xl font-mono">
          !
        </div>
        <h2 className="text-xl font-black text-white mb-2">Ocorreu um Erro</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Ocorreu uma falha inesperada no processamento da página.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            Tentar Novamente
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
          >
            Visão Geral
          </Link>
        </div>
      </div>
    </div>
  );
}
