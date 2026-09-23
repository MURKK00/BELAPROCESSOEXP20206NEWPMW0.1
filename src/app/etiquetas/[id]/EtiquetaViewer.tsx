"use client";

import { useState } from 'react';
import { EtiquetaControls } from './EtiquetaControls';

interface EtiquetaViewerProps {
  processo: {
    id: string;
    numeroProcesso: string;
    clienteFinal: string;
    produto: string;
    portoDestino: string;
    enderecoBuyer?: string | null;
    cidadeBuyer?: string | null;
    paisBuyer?: string | null;
    iecBuyer?: string | null;
    panBuyer?: string | null;
    fassaiBuyer?: string | null;
    gstBuyer?: string | null;
    embalagemTipo?: string | null;
  };
  packingStr: string;
  expiryStr: string;
  isIndiaInicial: boolean;
}

export function EtiquetaViewer({
  processo,
  packingStr,
  expiryStr,
  isIndiaInicial,
}: EtiquetaViewerProps) {
  const [padrao, setPadrao] = useState<'INDIA' | 'INTERNACIONAL_NEUTRO' | 'SEM_LOGOS'>(
    isIndiaInicial ? 'INDIA' : 'INTERNACIONAL_NEUTRO'
  );
  const [exibirLogoEmpresa, setExibirLogoEmpresa] = useState(true);

  const isIndia = padrao === 'INDIA';
  const isInternacional = padrao === 'INTERNACIONAL_NEUTRO';
  const isSemLogos = padrao === 'SEM_LOGOS';

  return (
    <>
      {/* PAINEL DE CONTROLE DE IMPRESSÃO (NÃO APARECE NA IMPRESSÃO) */}
      <EtiquetaControls
        processoId={processo.id}
        padraoAtual={padrao}
        padraoInicial={isIndiaInicial ? 'INDIA' : 'INTERNACIONAL_NEUTRO'}
        onMudancaPadrao={setPadrao}
        exibirLogoEmpresa={exibirLogoEmpresa}
        onToggleLogoEmpresa={setExibirLogoEmpresa}
      />

      {/* FOLHA DA ETIQUETA FORMATO A4 EXATO (210mm x 297mm) */}
      <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-[20mm] sm:p-[25mm] flex flex-col relative box-border mx-auto text-black font-sans print:m-0">
        
        {/* CABEÇALHO / LOGOS */}
        {isIndia ? (
          /* PADRÃO ÍNDIA: FSSAI NA ESQUERDA + VEG GREEN DOT NA DIREITA */
          <div className="flex justify-between items-start mb-14 min-h-[64px]">
            <img src="/fssai-logo.png" alt="FSSAI Logo" className="h-16 object-contain" />
            <img src="/green-dot.png" alt="Veg Green Dot" className="h-16 object-contain" />
          </div>
        ) : isInternacional ? (
          /* PADRÃO INTERNACIONAL UNIVERSAL: LOGO DA BELA CEREAIS OU IDENTIFICAÇÃO DE EXPORTAÇÃO */
          <div className="flex justify-between items-center mb-14 min-h-[64px] pb-4 border-b-2 border-gray-900">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-site-bela-verde.png" 
                alt="Bela Cereais Logo" 
                className="h-14 object-contain" 
              />
              <div>
                <span className="block font-black text-lg tracking-wider text-black">BELA CEREAIS</span>
                <span className="block text-[10px] font-bold text-gray-600 tracking-widest uppercase">
                  Agribusiness & Commodities Export
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-gray-100 text-black text-xs font-mono font-bold tracking-widest uppercase border border-gray-400">
                EXPORT CARGO SPECIFICATION
              </span>
            </div>
          </div>
        ) : (
          /* PADRÃO SEM LOGOS: CABEÇALHO PURO TEXTUAL */
          <div className="mb-14 pb-4 border-b border-gray-300">
            <span className="text-xs font-mono font-bold tracking-widest text-gray-500 uppercase">
              EXPORT SHIPPING MARK & CARGO DETAILS
            </span>
          </div>
        )}

        {/* CORPO DE DADOS DA ETIQUETA (ESTRUTURA EM GRID ALINHADA) */}
        <div className="flex flex-col gap-6 text-[15px] leading-relaxed tracking-wide font-semibold text-black">
          
          {/* 1. DADOS DO IMPORTADOR */}
          <div className="grid grid-cols-[250px_15px_1fr] items-start">
            <div>IMPORTER NAME & ADDRESS</div>
            <div>:</div>
            <div className="uppercase">
              <div className="font-bold text-lg mb-1">{processo.clienteFinal}</div>
              <div className="font-normal text-gray-800">
                {processo.enderecoBuyer && <span>{processo.enderecoBuyer}</span>}
                {processo.cidadeBuyer && <span>, {processo.cidadeBuyer}</span>}
                {processo.paisBuyer && <span> - {processo.paisBuyer}</span>}
              </div>
              <div className="mt-2 font-normal text-sm text-gray-700 space-y-0.5">
                {processo.iecBuyer && processo.iecBuyer !== 'N/A' && (
                  <div>{isIndia ? 'IEC' : 'IMPORT REG. / TAX ID'} - {processo.iecBuyer}</div>
                )}
                {processo.panBuyer && processo.panBuyer !== 'N/A' && (
                  <div>{isIndia ? 'PAN NO.' : 'COMPANY TAX ID'} - {processo.panBuyer}</div>
                )}
                {isIndia && processo.fassaiBuyer && processo.fassaiBuyer !== 'N/A' && (
                  <div>FSSAI - {processo.fassaiBuyer}</div>
                )}
                {processo.gstBuyer && processo.gstBuyer !== 'N/A' && (
                  <div>{isIndia ? 'GST NO' : 'VAT / LOCAL TAX'} - {processo.gstBuyer}</div>
                )}
              </div>
            </div>
          </div>

          {/* 2. DADOS DO EXPORTADOR (BELA CEREAIS) */}
          <div className="grid grid-cols-[250px_15px_1fr] items-start">
            <div>PACKER NAME & ADDRESS</div>
            <div>:</div>
            <div className="uppercase font-normal text-gray-800">
              <div className="font-bold text-black">BELA CEREAIS COMERCIO LTDA</div>
              <div>A-4 STREET, NO. 20, BLOCK 136, PARK CUIABÁ</div>
              <div>CUIABA - MT BRAZIL ZIP CODE 78095-296</div>
            </div>
          </div>

          {/* 3. MÊS E ANO DE ENVASE */}
          <div className="grid grid-cols-[250px_15px_1fr] items-start">
            <div>PACKING MONTH & YEAR</div>
            <div>:</div>
            <div className="uppercase font-bold">{packingStr}</div>
          </div>

          {/* 4. MÊS E ANO DE VALIDADE */}
          <div className="grid grid-cols-[250px_15px_1fr] items-start">
            <div>EXPIRY MONTH & YEAR</div>
            <div>:</div>
            <div className="uppercase font-bold">{expiryStr}</div>
          </div>

          {/* 5. DESCRIÇÃO DO PRODUTO */}
          <div className="grid grid-cols-[250px_15px_1fr] items-start mt-4">
            <div>DESCRIPTION OF GOODS</div>
            <div>:</div>
            <div className="uppercase font-bold text-lg">{processo.produto}</div>
          </div>

          {/* 6. PESO LÍQUIDO */}
          <div className="grid grid-cols-[250px_15px_1fr] items-start">
            <div>NET WEIGHT</div>
            <div>:</div>
            <div className="uppercase font-bold text-lg">{processo.embalagemTipo || '30 KGS / BAG'}</div>
          </div>

          {/* 7. LOTE / CÓDIGO DO PROCESSO */}
          <div className="grid grid-cols-[250px_15px_1fr] items-start mt-4">
            <div>LOT NO / CODE NO / BATCH NO</div>
            <div>:</div>
            <div className="uppercase font-bold text-lg">{processo.numeroProcesso}</div>
          </div>

          {/* 8. PAÍS DE ORIGEM */}
          <div className="grid grid-cols-[250px_15px_1fr] items-start">
            <div>COUNTRY OF ORIGIN</div>
            <div>:</div>
            <div className="uppercase font-bold text-lg">BRAZIL</div>
          </div>

          {/* 9. LINHA DO FSSAI: EXIBE SOMENTE NO MODELO ÍNDIA */}
          {isIndia && (
            <div className="grid grid-cols-[250px_15px_1fr] items-start mt-4">
              <div>FSSAI LICENCE NO</div>
              <div>:</div>
              <div className="uppercase font-bold text-lg">
                {processo.fassaiBuyer && processo.fassaiBuyer !== 'N/A' ? processo.fassaiBuyer : '-'}
              </div>
            </div>
          )}

        </div>

        {/* RODAPÉ DA ETIQUETA COM IDENTIFICAÇÃO DE RASTREABILIDADE */}
        <div className="mt-auto pt-10 border-t border-gray-200 flex justify-between items-end text-[10px] text-gray-500 font-mono">
          <div>
            <span>REF: {processo.numeroProcesso}</span>
            {processo.portoDestino && <span> • POD: {processo.portoDestino}</span>}
          </div>
          <div>
            <span>PRODUCE OF BRAZIL • NON-GMO NATURAL GRAINS</span>
          </div>
        </div>

      </div>
    </>
  );
}
