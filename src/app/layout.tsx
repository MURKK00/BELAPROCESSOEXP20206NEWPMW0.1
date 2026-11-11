import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SessionAuthProvider } from '@/components/auth/SessionAuthProvider';
import { SecurityShield } from '@/components/security/SecurityShield';

export const metadata: Metadata = {
  title: 'PEX Agritech | Inteligência em Exportação',
  description: 'PEX Agritech | Inteligência em Exportação - Plataforma de inteligência e gestão operacional de exportações agrícolas.',
  icons: {
    icon: [
      { url: '/pex-favicon.svg', type: 'image/svg+xml' },
      { url: '/pex-logo.png', type: 'image/png' },
    ],
    shortcut: '/pex-favicon.svg',
    apple: '/pex-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <SessionAuthProvider>
          <ThemeProvider>
            <SecurityShield />
            {children}
          </ThemeProvider>
        </SessionAuthProvider>
      </body>
    </html>
  );
}
