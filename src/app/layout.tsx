import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SessionAuthProvider } from '@/components/auth/SessionAuthProvider';

export const metadata: Metadata = {
  title: 'PEX Agritech | Inteligência em Exportação',
  description: 'PEX Agritech | Inteligência em Exportação - Plataforma de inteligência e gestão operacional de exportações agrícolas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <SessionAuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionAuthProvider>
      </body>
    </html>
  );
}
