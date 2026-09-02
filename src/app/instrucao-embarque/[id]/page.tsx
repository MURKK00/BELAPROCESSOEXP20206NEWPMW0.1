import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDateBR, formatNum } from '@/lib/formatters';
import { PrintButton } from '@/components/documentos/PrintButton';

export default async function InstrucaoEmbarquePrintPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ enderecoBuyer?: string }>;
}) {
  const { id } = await params;
  
  const resolvedSearchParams = await searchParams;
  const enderecoBuyer = resolvedSearchParams.enderecoBuyer || 'ENDEREÇO NÃO INFORMADO';
  
  const processo = await prisma.processo.findUnique({
    where: { id },
    include: { containers: { orderBy: { ordem: 'asc' } } }
  });

  if (!processo) notFound();

  const qtyContainers = processo.containerQtd || 1;
  
  const containers = processo.containers && processo.containers.length > 0 
    ? processo.containers 
    : Array.from({ length: qtyContainers }, (_, i) => ({ id: `temp-${i}`, ordem: i + 1, numero: null, lacre: null, tara: null }));

  let realTotalBags = 0;
  let realTotalNet = 0;
  let realTotalTare = 0;
  let realTotalGross = 0;

  // LÓGICA ESPELHO: Puxa 100% o que está no banco. Zero cálculos inventados.
  const processedContainers = containers.map((c: any) => {
    const numStr = c.numero || c.codigo || c.numeroContainer || c.identificacao || c.container || '';
    const lacreStr = c.lacre || c.seal || '';
    
    // Tenta encontrar o valor no banco. Se não tiver nada, é null.
    const bagsVal = c.sacas ?? c.totalSacas ?? c.totalBags ?? c.quantidadeSacas ?? null;
    const netVal = c.pesoLiquido ?? c.netWeight ?? c.net ?? null;
    const tareVal = c.tara ?? c.pesoTara ?? null;
    const grossVal = c.pesoBruto ?? c.grossWeight ?? c.gross ?? null;

    const bags = Number(bagsVal) || 0;
    const net = Number(netVal) || 0;
    const tare = Number(tareVal) || 0;
    const gross = Number(grossVal) || 0;

    // Só soma nos totais os números que realmente existem
    realTotalBags += bags;
    realTotalNet += net;
    realTotalTare += tare;
    realTotalGross += gross;

    // Se tiver valor na tabela, formata. Se não tiver, deixa a célula totalmente em branco.
    return { 
      id: c.id, 
      numStr, 
      lacreStr, 
      bagsStr: bagsVal != null && String(bagsVal).trim() !== '' ? bags : '',
      netStr: netVal != null && String(netVal).trim() !== '' ? formatNum(net) : '',
      tareStr: tareVal != null && String(tareVal).trim() !== '' ? formatNum(tare) : '',
      grossStr: grossVal != null && String(grossVal).trim() !== '' ? formatNum(gross) : ''
    };
  });

  return (
    <div className="bg-gray-200 min-h-screen py-10 print:py-0 print:bg-white flex flex-col items-center print:block">
      
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .folha-a4 {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}} />

      <PrintButton />

      <div className="folha-a4 bg-white w-[210mm] min-h-[297mm] p-[15mm] text-[11px] font-sans text-black shadow-2xl border border-gray-300 mx-auto box-border">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-4">
          <img src="/logo-site-bela-verde.png" alt="Bela Cereais" className="w-48" />
          <div className="text-right">
            <p className="font-bold text-sm">INSTRUÇÃO DE EMBARQUE</p>
            <p className="font-semibold">REFERENCE N°.: {processo.numeroProcesso}</p>
            <p className="font-semibold">DATE: {formatDateBR(new Date())}</p>
          </div>
        </div>

        {/* Quadros de Endereço */}
        <div className="grid grid-cols-2 gap-4 mb-6 border-b-2 border-black pb-4">
          <div>
            <p className="font-bold">SELLER TO:</p>
            <p className="font-bold">BELA CEREAIS COMERCIO LTDA.</p>
            <p>CNPJ: 15.726.793/0001-06</p>
            <p>RUA A-4, Nº 20 QUADRA 136 - C20 PARQUE CUIABÁ</p>
            <p>CUIABÁ - MT - BRAZIL, ZIP CODE: 78.095-296</p>
          </div>
          <div>
            <p className="font-bold">BUYER TO:</p>
            <p className="font-bold">{processo.clienteFinal}</p>
            <p className="whitespace-pre-wrap uppercase">{enderecoBuyer}</p>
          </div>
        </div>

        {/* Dados do Processo */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div><span className="font-bold">INCOTERM:</span> {processo.incoterm}</div>
          <div><span className="font-bold">PORT OF LOADING:</span> Santos - SP - Brazil</div>
          <div><span className="font-bold">PORT OF DELIVERY:</span> {processo.portoDestino}</div>
          <div><span className="font-bold">FREIGHT:</span> Freight Prepaid</div>
          <div><span className="font-bold">BOOKING:</span> {processo.bookingNumero || 'A CONFIRMAR'}</div>
          <div><span className="font-bold">SHIP:</span> {processo.navio || 'A CONFIRMAR'}</div>
          <div><span className="font-bold">Nº OF CONTAINERS:</span> {qtyContainers}</div>
          <div><span className="font-bold">PACKING:</span> {processo.embalagemTipo}</div>
          <div><span className="font-bold">CONTRACT:</span> {processo.numeroProcesso}</div>
          <div><span className="font-bold">CARGO DESCRIPTION:</span> {processo.produto}</div>
          <div><span className="font-bold">NET WEIGHT:</span> {realTotalNet > 0 ? formatNum(realTotalNet) : '0,00'} KG</div>
          <div><span className="font-bold">GROSS WEIGHT:</span> {realTotalGross > 0 ? formatNum(realTotalGross) : '0,00'} KG</div>
          <div><span className="font-bold">NCM:</span> {processo.ncm || '7133190'}</div>
          <div><span className="font-bold">TOTAL BAGS:</span> {realTotalBags > 0 ? realTotalBags : '0'}</div>
        </div>

        {/* Tabela de Contêineres */}
        <table className="w-full text-center border-collapse border border-black mb-8 text-[10px]">
          <thead>
            <tr className="border-b border-black font-bold">
              <th className="border-r border-black py-1.5">CONTAINERS Nº</th>
              <th className="border-r border-black py-1.5">SEAL</th>
              <th className="border-r border-black py-1.5">TOTAL BAGS</th>
              <th className="border-r border-black py-1.5">NET WEIGHT</th>
              <th className="border-r border-black py-1.5">TARE</th>
              <th className="py-1.5">GROSS WEIGHT</th>
            </tr>
          </thead>
          <tbody>
            {processedContainers.map((c: any) => (
              <tr key={c.id} className="border-b border-gray-300">
                <td className="border-r border-black py-1.5 h-6">{c.numStr}</td>
                <td className="border-r border-black py-1.5">{c.lacreStr}</td>
                <td className="border-r border-black py-1.5">{c.bagsStr}</td>
                <td className="border-r border-black py-1.5">{c.netStr}</td>
                <td className="border-r border-black py-1.5">{c.tareStr}</td>
                <td className="py-1.5">{c.grossStr}</td>
              </tr>
            ))}
            
            {/* O Rodapé de TOTAL */}
            <tr className="font-bold border-t-2 border-black">
              <td colSpan={2} className="border-r border-black text-right pr-2 py-1.5">TOTAL:</td>
              <td className="border-r border-black py-1.5">{realTotalBags > 0 ? realTotalBags : '0'}</td>
              <td className="border-r border-black py-1.5">{realTotalNet > 0 ? formatNum(realTotalNet) : '0,00'}</td>
              <td className="border-r border-black py-1.5">{realTotalTare > 0 ? formatNum(realTotalTare) : '0,00'}</td>
              <td className="py-1.5">{realTotalGross > 0 ? formatNum(realTotalGross) : '0,00'}</td>
            </tr>
          </tbody>
        </table>

        {/* Rodapé e Informações Extras */}
        <div className="space-y-1.5 mt-auto">
          <p><span className="font-bold">RUC:</span> {processo.ruc || 'A INFORMAR'}</p>
          <p><span className="font-bold">DUE:</span> </p>
          <p><span className="font-bold">FREE TIME AT DESTINATION:</span> {processo.freeTimeDestino || '21 free days demurrage'}</p>
          <p><span className="font-bold">NUMBER OF ORIGINAL B/Ls:</span> 03 (Three) Originals</p>
        </div>
        
      </div>
    </div>
  );
}