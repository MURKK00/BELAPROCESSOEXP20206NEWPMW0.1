'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 font-black text-2xl font-mono">
            500
          </div>
          <h2 className="text-xl font-black text-white mb-2">Erro Inesperado</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Ocorreu uma falha no processamento da aplicação.
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      </body>
    </html>
  );
}
