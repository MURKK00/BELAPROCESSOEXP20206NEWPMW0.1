import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-slate-100 transition-colors">
      <aside className="w-64 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800 flex flex-col shrink-0 transition-colors">
        
        {/* CABEÇALHO: Logo em tamanho equilibrado e tipografia elegante */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col items-start">
          <div className="p-1 rounded-lg bg-white/90 dark:bg-white/95 inline-block">
            <img 
              src="/logo-site-bela-verde.png" 
              alt="Bela Cereais" 
              className="w-32 h-auto object-contain object-left" 
            />
          </div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
            Cockpit <span className="text-secondary dark:text-orange-400 font-black">Exportações</span>
          </div>
        </div>
        
        {/* MENU LATERAL */}
        <Sidebar />

      </aside>
      
      {/* CORPO PRINCIPAL COM BARRA SUPERIOR ELEGANTE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/70 dark:bg-[#090d16] transition-colors">
        {/* TOPBAR ELEGANTE */}
        <header className="h-14 border-b border-slate-200/80 dark:border-slate-800/90 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md px-8 flex items-center justify-between shrink-0 transition-colors">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">Bela Cereais</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Gestão Operacional & Financeira</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>Sistema Online</span>
            </div>

            {/* SELETOR DE MODO CLARO / ESCURO */}
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-7">{children}</main>
      </div>
    </div>
  );
}