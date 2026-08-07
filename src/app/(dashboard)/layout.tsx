import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-surface border-r border-border flex flex-col shrink-0">
        <div className="px-6 py-6 text-lg font-extrabold text-primary border-b border-border">
          Bela Cereais
        </div>
        <nav className="flex-1 px-2.5 py-5 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium text-sm"
          >
            Visão geral
          </Link>
          <Link
            href="/negociacoes"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium text-sm"
          >
            Negociações
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 font-medium text-sm cursor-not-allowed">
            Logística <span className="text-[10px] uppercase">em breve</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 font-medium text-sm cursor-not-allowed">
            Documentos <span className="text-[10px] uppercase">em breve</span>
          </div>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto px-10 py-8">{children}</main>
    </div>
  );
}
