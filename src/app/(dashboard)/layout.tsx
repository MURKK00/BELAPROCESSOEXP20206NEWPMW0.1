import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-surface border-r border-border flex flex-col shrink-0">
        
        {/* CABEÇALHO: Logo em tamanho equilibrado e tipografia elegante */}
        <div className="px-6 py-8 border-b border-border flex flex-col items-start">
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
      
      {/* FUNDO DA TELA COM A COR 'bg' DEFINIDA NO TAILWIND */}
      <main className="flex-1 overflow-y-auto px-10 py-8 bg-bg">{children}</main>
    </div>
  );
}