import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PrintButton } from './PrintButton';

export default async function EtiquetaExportacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
  });

  if (!processo) notFound();

  // Datas
  const packingDate = processo.estufagemInicio || processo.criadoEm || new Date();
  const packingMonth = packingDate.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }).toUpperCase();
  const packingYear = packingDate.getUTCFullYear();
  
  const packingStr = `${packingMonth} ${packingYear}`;
  const expiryStr = `${packingMonth} ${packingYear + 2}`;

  return (
    <div className="min-h-screen bg-gray-300 py-10 print:py-0 print:bg-white flex flex-col items-center">
      <PrintButton />

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
        }
      `}} />

      {/* ETIQUETA LIMPA E CLÁSSICA (A4) */}
      <div className="bg-white w-[210mm] h-[297mm] shadow-2xl print:shadow-none p-[25mm] flex flex-col relative box-border mx-auto text-black font-sans">
        
        {/* LOGOS */}
        <div className="flex justify-between items-start mb-16">
          <img src="/fssai-logo.png" alt="FSSAI Logo" className="h-16 object-contain" />
          <img src="/green-dot.png" alt="Veg Green Dot" className="h-16 object-contain" />
        </div>

        {/* DADOS (GRID SEM BORDAS) */}
        <div className="flex flex-col gap-6 text-[15px] leading-relaxed tracking-wide font-semibold">
          
          <div className="grid grid-cols-[250px_15px_1fr] items-start">
            <div>IMPORTER NAME & ADDRESS</div>
            <div>:</div>
            <div className="uppercase">
              <div className="font-bold text-lg mb-1">{processo.clienteFinal}</div>
              <div className="font-normal text-gray-800">
                {processo.enderecoBuyer}
                {processo.cidadeBuyer ? `, ${processo.cidadeBuyer}` : ''}
                {processo.paisBuyer ? ` - ${processo.paisBuyer}` : ''}
              </div>
              <div className="mt-2 font-normal text-sm text-gray-700 space-y-0.5">
                {processo.iecBuyer && <div>IEC - {processo.iecBuyer}</div>}
                {processo.panBuyer && <div>PAN NO. - {processo.panBuyer}</div>}
                {processo.fassaiBuyer && <div>FSSAI - {processo.fassaiBuyer}</div>}
                {processo.gstBuyer && <div>GST NO - {processo.gstBuyer}</div>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[250px_15px_1fr] items-start">
            <div>PACKER NAME & ADDRESS</div>
            <div>:</div>
            <div className="uppercase font-normal text-gray-800">
              <div className="font-bold text-black">BELA CEREAIS COMERCIO LTDA</div>
              <div>A-4 STREET, NO. 20, BLOCK 136, PARK CUIABÁ</div>
              <div>CUIABA - MT BRAZIL ZIP CODE 78095-296</div>
            </div>
          </div>

          <div className="grid grid-cols-[250px_15px_1fr] items-start">
            <div>PACKING MONTH & YEAR</div>
            <div>:</div>
            <div className="uppercase font-bold">{packingStr}</div>
          </div>

          <div className="grid grid-cols-[250px_15px_1fr] items-start">
            <div>EXPIRY MONTH & YEAR</div>
            <div>:</div>
            <div className="uppercase font-bold">{expiryStr}</div>
          </div>

          <div className="grid grid-cols-[250px_15px_1fr] items-start mt-4">
            <div>DESCRIPTION OF GOODS</div>
            <div>:</div>
            <div className="uppercase font-bold text-lg">{processo.produto}</div>
          </div>

          <div className="grid grid-cols-[250px_15px_1fr] items-start">
            <div>NET WEIGHT</div>
            <div>:</div>
            <div className="uppercase font-bold text-lg">{processo.embalagemTipo || '30 KGS'}</div>
          </div>

          <div className="grid grid-cols-[250px_15px_1fr] items-start mt-4">
            <div>LOT NO / CODE NO / BATCH NO</div>
            <div>:</div>
            <div className="uppercase font-bold text-lg">{processo.numeroProcesso}</div>
          </div>

          <div className="grid grid-cols-[250px_15px_1fr] items-start">
            <div>COUNTRY OF ORIGIN</div>
            <div>:</div>
            <div className="uppercase font-bold text-lg">BRAZIL</div>
          </div>

          <div className="grid grid-cols-[250px_15px_1fr] items-start mt-4">
            <div>FSSAI LICENCE NO</div>
            <div>:</div>
            <div className="uppercase font-bold text-lg">{processo.fassaiBuyer || '-'}</div>
          </div>

        </div>
      </div>
    </div>
  );
}