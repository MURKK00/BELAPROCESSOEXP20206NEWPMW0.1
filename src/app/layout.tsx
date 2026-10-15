import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SessionAuthProvider } from '@/components/auth/SessionAuthProvider';

export const metadata: Metadata = {
  title: 'Bela Cereais - Sistema de Exportação',
  description: 'Gestão do processo de exportação, do contrato ao fechamento bancário.',
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
