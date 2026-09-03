import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDateBR, formatNum } from '@/lib/formatters';
import { PrintButton } from '@/components/documentos/PrintButton';

export default async function InstrucaoEmbarquePrintPage({ 
  params
}: { 
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
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

  const processedContainers = containers.map((c: any) => {
    // A MÁGICA: Função inteligente que vasculha o objeto procurando pela informação, não importa o nome exato da coluna!
    const findField = (keywords: string[]) => {
      const keys = Object.keys(c);
      for (const kw of keywords) {
        const found = keys.find(k => k.toLowerCase().includes(kw));
        if (found && c[found] !== null && c[found] !== undefined && String(c[found]).trim() !== '') {
          return c[found];
        }
      }
      return null;
    };

    const numStr = c.numero ?? c.codigo ?? findField(['num', 'container', 'ident']) ?? '';
    const lacreStr = c.lacre ?? c.seal ?? findField(['lacre', 'seal']) ?? '';
    
    // Procura qualquer variação de nome e puxa EXATAMENTE o que está preenchido na linha
    const bagsVal = findField(['bag', 'sac', 'qtd']) ?? processo.sacasPorContainer ?? 0;
    const netVal = findField(['net', 'liq']) ?? 0;
    const tareVal = findField(['tar']) ?? 0;
    const grossVal = findField(['gross', 'brut']) ?? 0;

    const bags = Number(bagsVal) || 0;
    const net = Number(netVal) || 0;
    const tare = Number(tareVal) || 0;
    const gross = Number(grossVal) || 0;

    const isPreenchido = (numStr.toString().trim() !== '') || (lacreStr.toString().trim() !== '');

    if (isPreenchido) {
      realTotalBags += bags;
      realTotalNet += net;
      realTotalTare += tare;
      realTotalGross += gross;
    }

    return { 
      id: c.id, 
      numStr, 
      lacreStr, 
      bagsStr: isPreenchido && bags > 0 ? bags : '',
      netStr: isPreenchido && net > 0 ? formatNum(net) : '',
      tareStr: isPreenchido && tare > 0 ? formatNum(tare) : '',
      grossStr: isPreenchido && gross > 0 ? formatNum(gross) : ''
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

      <div className="folha-a4 bg-white w-[210mm] min-h-[297mm] p-[12mm] text-[11px] font-sans text-black shadow-2xl border border-gray-300 mx-auto box-border">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-3">
          <img src="/logo-site-bela-verde.png" alt="Bela Cereais" className="w-32" />
          <div className="text-right leading-snug">
            <p className="font-bold text-sm">INSTRUÇÃO DE EMBARQUE</p>
            <p className="font-semibold">REFERENCE N°.: {processo.numeroProcesso}</p>
            <p className="font-semibold">DATE: {formatDateBR(new Date())}</p>
          </div>
        </div>

        {/* Quadros de Endereço */}
        <div className="grid grid-cols-2 gap-4 mb-4 border-b-2 border-black pb-3">
          <div className="leading-snug">
            <p className="font-bold">SELLER TO:</p>
            <p className="font-bold">BELA CEREAIS COMERCIO LTDA.</p>
            <p>CNPJ: 15.726.793/0001-06</p>
            <p>RUA A-4, Nº 20 QUADRA 136 - C20 PARQUE CUIABÁ</p>
            <p>CUIABÁ - MT - BRAZIL, ZIP CODE: 78.095-296</p>
          </div>
          <div className="leading-snug">
            <p className="font-bold">BUYER TO:</p>
            <p className="font-bold">{processo.clienteFinal}</p>
            <p className="whitespace-pre-wrap uppercase mb-0.5">{processo.enderecoBuyer || ''}</p>
            {processo.iecBuyer && <p>IEC {processo.iecBuyer}</p>}
            {processo.fassaiBuyer && <p>FASSAI-{processo.fassaiBuyer}</p>}
            {processo.panBuyer && <p>PAN NO. - {processo.panBuyer}</p>}
            {processo.gstBuyer && <p>GST NO-{processo.gstBuyer}</p>}
            {processo.emailBuyer && <p className="lowercase">{processo.emailBuyer}</p>}
            {processo.telefoneBuyer && <p>{processo.telefoneBuyer}</p>}
          </div>
        </div>

        {/* Dados do Processo */}
        <div className="grid grid-cols-2 gap-y-1 gap-x-2 mb-4 leading-snug">
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
        <table className="w-full text-center border-collapse border border-black mb-4 text-[10px]">
          <thead>
            <tr className="border-b border-black font-bold">
              <th className="border-r border-black py-1">CONTAINERS Nº</th>
              <th className="border-r border-black py-1">SEAL</th>
              <th className="border-r border-black py-1">TOTAL BAGS</th>
              <th className="border-r border-black py-1">NET WEIGHT</th>
              <th className="border-r border-black py-1">TARE</th>
              <th className="py-1">GROSS WEIGHT</th>
            </tr>
          </thead>
          <tbody>
            {processedContainers.map((c: any) => (
              <tr key={c.id} className="border-b border-gray-300">
                <td className="border-r border-black py-1 h-5">{c.numStr}</td>
                <td className="border-r border-black py-1">{c.lacreStr}</td>
                <td className="border-r border-black py-1">{c.bagsStr}</td>
                <td className="border-r border-black py-1">{c.netStr}</td>
                <td className="border-r border-black py-1">{c.tareStr}</td>
                <td className="py-1">{c.grossStr}</td>
              </tr>
            ))}
            
            {/* O Rodapé de TOTAL */}
            <tr className="font-bold border-t-2 border-black">
              <td colSpan={2} className="border-r border-black text-right pr-2 py-1">TOTAL:</td>
              <td className="border-r border-black py-1">{realTotalBags > 0 ? realTotalBags : '0'}</td>
              <td className="border-r border-black py-1">{realTotalNet > 0 ? formatNum(realTotalNet) : '0,00'}</td>
              <td className="border-r border-black py-1">{realTotalTare > 0 ? formatNum(realTotalTare) : '0,00'}</td>
              <td className="py-1">{realTotalGross > 0 ? formatNum(realTotalGross) : '0,00'}</td>
            </tr>
          </tbody>
        </table>

        {/* Rodapé e Informações Extras */}
        <div className="space-y-1 mt-auto leading-snug">
          <p><span className="font-bold">RUC:</span> {processo.ruc || 'A INFORMAR'}</p>
          <p><span className="font-bold">DUE:</span> </p>
          <p><span className="font-bold">FREE TIME AT DESTINATION:</span> {processo.freeTimeDestino || '21 free days demurrage'}</p>
          <p><span className="font-bold">NUMBER OF ORIGINAL B/Ls:</span> 03 (Three) Originals</p>
        </div>
        
      </div>
    </div>
  );
}