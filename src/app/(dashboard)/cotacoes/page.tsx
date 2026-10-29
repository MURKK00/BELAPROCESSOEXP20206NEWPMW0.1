import { WallStreetTerminalClient } from '@/components/cotacoes/WallStreetTerminalClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terminal de Cotações Wall Street | Bela Cereais Export',
  description: 'Painel interativo de cotações agro e financeiras em tempo real: Soja e Milho Chicago (CBOT), Milho B3, Farelo, Dólar, Euro e Curva Forward.',
};

export const dynamic = 'force-dynamic';

export default function CotacoesPage() {
  return <WallStreetTerminalClient />;
}
