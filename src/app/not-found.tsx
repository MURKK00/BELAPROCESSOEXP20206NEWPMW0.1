import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
      <div className="max-w-md text-center bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 font-black text-2xl font-mono">
          404
        </div>
        <h2 className="text-xl font-black text-white mb-2">Página Não Encontrada</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          O recurso ou página solicitada não existe ou foi remanejada no sistema Bela Cereais.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all"
        >
          Voltar para Visão Geral
        </Link>
      </div>
    </div>
  );
}
