import { Sidebar } from '@/components/Sidebar';
import { CommandBar } from '@/components/navigation/CommandBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-surface border-r border-border flex flex-col shrink-0">
        
        {/* CABEÇALHO: Logo em tamanho equilibrado e tipografia elegante */}
        <div className="px-6 py-6 border-b border-border flex flex-col items-start">
          <img 
            src="/logo-site-bela-verde.png" 
            alt="Bela Cereais" 
            className="w-36 h-auto object-contain object-left mb-2" 
          />
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
            Cockpit <span className="text-secondary font-extrabold">Exportações</span>
          </div>
        </div>
        
        {/* MENU NOVO COM A LÓGICA DE PÁGINA ATIVA (SOMBRA E BORDA) */}
        <Sidebar />

      </aside>
      
      {/* CORPO PRINCIPAL COM BARRA SUPERIOR ELEGANTE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg">
        {/* TOPBAR COM BUSCA RÁPIDA (CTRL+K) */}
        <header className="h-14 border-b border-border/80 bg-white/70 backdrop-blur-md px-10 flex items-center justify-between shrink-0">
          <CommandBar />
          <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Sistema Operacional Conectado</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-10 py-8">{children}</main>
      </div>
    </div>
  );
}