import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EtiquetaViewer } from './EtiquetaViewer';

export default async function EtiquetaExportacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
  });

  if (!processo) notFound();

  // Datas de Packing e Validade
  const packingDate = processo.estufagemInicio || processo.criadoEm || new Date();
  const packingMonth = packingDate.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }).toUpperCase();
  const packingYear = packingDate.getUTCFullYear();
  
  const packingStr = `${packingMonth} ${packingYear}`;
  const expiryStr = `${packingMonth} ${packingYear + 2}`;

  // Verifica se o destino parece ser a Índia para carregar o padrão indiano como recomendação inicial
  const destinoUpper = ((processo.portoDestino || '') + ' ' + (processo.paisBuyer || '')).toUpperCase();
  const isIndiaInicial = destinoUpper.includes('INDIA') || 
                         destinoUpper.includes('MUNDRA') || 
                         destinoUpper.includes('NHAVA') || 
                         destinoUpper.includes('CHENNAI') || 
                         destinoUpper.includes('KOLKATA') || 
                         Boolean(processo.fassaiBuyer && processo.fassaiBuyer !== 'N/A');

  return (
    <div className="min-h-screen bg-gray-200/80 py-8 print:py-0 print:bg-white flex flex-col items-center">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
        }
      `}} />

      <EtiquetaViewer
        processo={processo}
        packingStr={packingStr}
        expiryStr={expiryStr}
        isIndiaInicial={isIndiaInicial}
      />
    </div>
  );
}
