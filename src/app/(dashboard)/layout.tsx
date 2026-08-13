import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-surface border-r border-border flex flex-col shrink-0">
        
        {/* NOVO CABEÇALHO COM A LOGO E O NOME DO PROJETO */}
        <div className="px-6 py-8 border-b border-border flex flex-col gap-1">
          <img 
            src="/logo-site-bela-verde.png" 
            alt="Bela Cereais" 
            className="h-10 w-auto object-contain object-left" 
          />
          <div className="text-[11px] font-bold uppercase tracking-widest text-secondary mt-1">
            Cockpit Exportações
          </div>
        </div>
        
        {/* MENU COM HOVER NAS CORES DA MARCA */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 hover:bg-primary/10 hover:text-primary font-medium text-sm transition-colors"
          >
            Visão geral
          </Link>
          <Link
            href="/negociacoes"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 hover:bg-primary/10 hover:text-primary font-medium text-sm transition-colors"
          >
            Negociações
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 font-medium text-sm cursor-not-allowed">
            Logística <span className="text-[10px] uppercase font-bold text-gray-300">em breve</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 font-medium text-sm cursor-not-allowed">
            Documentos <span className="text-[10px] uppercase font-bold text-gray-300">em breve</span>
          </div>
        </nav>
      </aside>
      
      {/* FUNDO DA TELA COM A COR 'bg' DEFINIDA NO TAILWIND */}
      <main className="flex-1 overflow-y-auto px-10 py-8 bg-bg">{children}</main>
    </div>
  );
}