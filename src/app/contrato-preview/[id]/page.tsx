import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { formatDateBR } from '@/lib/formatters';
import { parseCompradorInfo, isImportadorPendente } from '@/lib/compradorHelper';
import Link from 'next/link';
import Image from 'next/image';
import { ContratoPrintControls } from '@/components/negociacoes/ContratoPrintControls';
import { ArrowLeft, FileText, AlertCircle, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const dynamic = 'force-dynamic';

export default async function ContratoPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // URL absoluta para validação instantânea via QR Code
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const verificationUrl = `${proto}://${host}/negociacoes/${id}`;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      financeiro: true,
      containers: true,
    },
  });

  if (!processo) notFound();

  // Decodifica dados complementares de comprador e banco
  const { comprador, bancoComprador } = parseCompradorInfo(processo.complementoBuyer);
  const isCompradorDiferente = Boolean(comprador?.diferente);

  // Nome e dados do comprador
  const buyerNome = isCompradorDiferente && comprador.nome ? comprador.nome : processo.clienteFinal;
  const buyerEndereco = isCompradorDiferente && comprador.endereco ? comprador.endereco : (processo.enderecoBuyer || '');
  const buyerCidade = isCompradorDiferente && comprador.cidade ? comprador.cidade : (processo.cidadeBuyer || '');
  const buyerPais = isCompradorDiferente && comprador.pais ? comprador.pais : (processo.paisBuyer || '');
  const buyerTaxId = isCompradorDiferente && comprador.taxId ? comprador.taxId : (processo.iecBuyer || processo.panBuyer || processo.gstBuyer || '');
  const buyerEmail = isCompradorDiferente && comprador.email ? comprador.email : (processo.emailBuyer || '');
  const buyerTelefone = isCompradorDiferente && comprador.telefone ? comprador.telefone : (processo.telefoneBuyer || '');

  // Dados do Importador (se diferente do comprador)
  const importadorNome = isCompradorDiferente && comprador.importadorNome ? comprador.importadorNome : processo.clienteFinal;
  const importadorEndereco = processo.enderecoBuyer || '';
  const importadorCidade = processo.cidadeBuyer || '';
  const importadorPais = processo.paisBuyer || '';
  const importadorTaxId = processo.iecBuyer || processo.panBuyer || processo.gstBuyer || '';

  // Peso negociado originalmente na negociação (conforme solicitado pelo usuário: NÃO usar o peso líquido dos contêineres aqui)
  const pesoNegociadoKg = Number(processo.volumeKg) || 0;
  const pesoNegociadoTon = pesoNegociadoKg / 1000;

  // Preço unitário por tonelada métrica negociado (sem total fixo)
  const fin = processo.financeiro;
  const precoUsd = fin?.precoUsd ? Number(fin.precoUsd) : (processo.valorDeclaradoUsd ? Number(processo.valorDeclaradoUsd) : 0);

  // Safra identificada
  const safraIdentificada = processo.produto.match(/20\d\d/)?.[0] 
    ? `Safra ${processo.produto.match(/20\d\d/)?.[0]}` 
    : 'Safra Corrente (2025/2026)';

  // Condição de pagamento
  const temProforma = Boolean(bancoComprador.temProforma);
  const diasLiquidacao = bancoComprador.diasLiquidacao ?? (temProforma ? 10 : 20);
  const adiantamentoPerc = bancoComprador.adiantamentoPerc ?? 10;

  const formatUSD = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const pendenteImportador = isImportadorPendente(processo);

  const hoje = new Date();
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const dataExtenso = `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
  const dataAtualFormatada = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white text-slate-900 py-6 sm:py-10 px-3 sm:px-6 print:py-0 print:px-0 print:m-0 transition-colors">
      
      {/* BARRA SUPERIOR DE AÇÕES (OCULTA NA IMPRESSÃO) */}
      <div className="max-w-[850px] mx-auto mb-6 print:hidden">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/negociacoes/${processo.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Voltar à Negociação</span>
            </Link>

            <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800" />

            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Confirmação de Negócio (Sales Contract Note)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Processo Ref: <strong className="font-mono text-slate-700 dark:text-slate-300">{processo.numeroProcesso}</strong> • 2 Páginas Oficiais
              </span>
            </div>
          </div>

          <ContratoPrintControls processoId={processo.id} />
        </div>

        {/* ALERTA DE DADOS DO IMPORTADOR PENDENTES */}
        {pendenteImportador && (
          <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Atenção:</strong> Os dados de endereço e registros fiscais do importador/comprador ainda não foram preenchidos.
              </span>
            </div>
            <Link
              href={`/negociacoes/${processo.id}/importador`}
              className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100 whitespace-nowrap"
            >
              Preencher agora →
            </Link>
          </div>
        )}

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span>
            📄 Documento dimensionado para exatamente <strong>2 Páginas A4</strong> com numeração minimalista no rodapé direito.
          </span>
          <span>
            💡 Ao imprimir, selecione <strong>&quot;Salvar como PDF&quot;</strong>.
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FOLHA 1 / PÁGINA 1 DE 2: DADOS COMERCIAIS, PARTES, PREÇO & PAGAMENTO */}
      {/* ========================================================================= */}
      <div 
        id="contrato-folha-1"
        className="contrato-sheet max-w-[850px] mx-auto bg-white p-7 sm:p-9 shadow-xl print:shadow-none rounded-2xl print:rounded-none border-2 border-slate-300 print:border-none font-sans text-[10px] leading-relaxed text-slate-900 mb-8 print:mb-0 flex flex-col justify-between"
      >
        <div>
          {/* CABEÇALHO OFICIAL DA EMPRESA */}
          <div className="flex items-center justify-between border-b-2 border-slate-400 pb-2 mb-2">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo-site-bela-verde.png" 
                alt="Bela Cereais Logo" 
                width={130}
                height={40}
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
                priority
              />
              <div>
                <h1 className="text-xs font-black tracking-tight text-slate-950 uppercase">
                  Bela Cereais Comércio Ltda.
                </h1>
                <p className="text-[9px] text-slate-600 font-medium leading-tight">
                  CNPJ: 15.726.793/0001-06 • Cuiabá - MT, Brasil • export@belacereais.com.br
                </p>
              </div>
            </div>

            <div className="text-right bg-slate-50 border border-slate-300 rounded px-2.5 py-1">
              <span className="text-[10px] font-black tracking-wider text-slate-950 uppercase block">
                CONFIRMAÇÃO DE NEGÓCIO
              </span>
              <p className="text-[9.5px] text-slate-700 leading-tight">
                Ref: <span className="font-mono font-black text-slate-950">{processo.numeroProcesso}</span>
              </p>
              {processo.contratoInterno && (
                <p className="text-[8.5px] text-slate-600 leading-tight">
                  Contrato: <span className="font-mono font-semibold">{processo.contratoInterno}</span>
                </p>
              )}
              <p className="text-[8.5px] text-slate-500 leading-tight">
                {dataExtenso}
              </p>
            </div>
          </div>

          {/* TÍTULO DO INSTRUMENTO JURÍDICO */}
          <div className="text-center py-1 px-2.5 mb-2 bg-slate-100 border-y-2 border-slate-400 rounded-xs">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-950">
              CONFIRMAÇÃO DE NEGÓCIO DE EXPORTAÇÃO / SALES CONTRACT NOTE
            </h2>
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">
              Compra e Venda Internacional de Mercadorias (Grãos &amp; Pulses)
            </p>
          </div>

          {/* PREÂMBULO */}
          <p className="text-[9.5px] text-slate-700 text-justify mb-2 leading-tight">
            Por este instrumento particular de Confirmação de Negócio de Exportação, o <strong>VENDEDOR (Seller)</strong> e o <strong>COMPRADOR (Buyer)</strong> abaixo qualificados ajustam e confirmam a venda e compra das mercadorias, preço unitário por tonelada métrica negociado e condições comerciais estipuladas nas seguintes cláusulas:
          </p>

          {/* CLÁUSULA 1: AS PARTES CONTRATANTES */}
          <div className="mb-2">
            <div className="bg-slate-100 border border-slate-400 px-2.5 py-1 rounded-t-md flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                  1
                </span>
                <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900">
                  As Partes Contratantes / Contracting Parties
                </h3>
              </div>
              <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                Cláusula 01
              </span>
            </div>
            
            <div className="border-x border-b border-slate-400 rounded-b-md p-2.5 bg-white text-[9.5px] leading-snug">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {/* VENDEDOR */}
                <div className="md:border-r border-slate-300 md:pr-2.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-black text-slate-900 uppercase text-[9px] bg-slate-200 px-1.5 py-0.5 rounded">
                      VENDEDOR / SELLER:
                    </span>
                    <span className="text-[8.5px] text-slate-500 font-semibold">Exportador</span>
                  </div>
                  <p className="font-black text-slate-950 text-[10px]">BELA CEREAIS COMÉRCIO LTDA.</p>
                  <p className="text-slate-700"><strong>CNPJ:</strong> 15.726.793/0001-06</p>
                  <p className="text-slate-700"><strong>Endereço:</strong> Av. Historiador Rubens de Mendonça, Cuiabá - MT, Brasil</p>
                  <p className="text-slate-700"><strong>Origem:</strong> Brasil • <strong>E-mail:</strong> export@belacereais.com.br</p>
                </div>

                {/* COMPRADOR */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-black text-slate-900 uppercase text-[9px] bg-slate-200 px-1.5 py-0.5 rounded">
                      COMPRADOR / BUYER:
                    </span>
                    <span className="text-[8.5px] text-slate-500 font-semibold">Importador</span>
                  </div>
                  <p className="font-black text-slate-950 text-[10px]">{buyerNome}</p>
                  <p className="text-slate-700">
                    <strong>Endereço:</strong> {buyerEndereco || <span className="text-amber-700 font-semibold italic">Pendente de preenchimento</span>}
                  </p>
                  <p className="text-slate-700">
                    <strong>Cidade/País:</strong> {[buyerCidade, buyerPais].filter(Boolean).join(', ') || '-'}
                  </p>
                  <p className="text-slate-700">
                    <strong>Tax ID / IEC / PAN:</strong> {buyerTaxId || '-'}
                  </p>
                  {(buyerEmail || buyerTelefone) && (
                    <p className="text-slate-700">
                      <strong>Contato:</strong> {[buyerEmail, buyerTelefone].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>

                {/* SE COMPRADOR DIFERENTE DO IMPORTADOR */}
                {isCompradorDiferente && (
                  <div className="col-span-1 md:col-span-2 pt-1.5 border-t border-slate-300 text-[9px] bg-blue-50/50 p-1.5 rounded border border-blue-200">
                    <span className="font-black text-slate-900 uppercase block mb-0.5">
                      Importador / Consignee no B/L (Destinatário Final):
                    </span>
                    <p className="text-slate-800">
                      <strong>{importadorNome}</strong> • Tax ID: {importadorTaxId || '-'} • Endereço: {importadorEndereco || '-'}, {[importadorCidade, importadorPais].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CLÁUSULA 2: MERCADORIA & ESPECIFICAÇÕES (APENAS: PRODUTO, NCM, SAFRA, PAÍS DE ORIGEM E PESO NEGOCIADO) */}
          <div className="mb-2">
            <div className="bg-slate-100 border border-slate-400 px-2.5 py-1 rounded-t-md flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                  2
                </span>
                <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900">
                  Mercadoria &amp; Especificações / Commodity
                </h3>
              </div>
              <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                Cláusula 02
              </span>
            </div>

            <div className="border-x border-b border-slate-400 rounded-b-md p-2 bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-5 border-2 border-slate-300 divide-x-2 divide-slate-300 rounded overflow-hidden">
                <div className="p-1.5 bg-slate-50/50">
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block mb-0.5">Produto</span>
                  <span className="font-black text-slate-950 text-[10px] block">{processo.produto}</span>
                </div>
                <div className="p-1.5 bg-slate-50/50">
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block mb-0.5">NCM / SH</span>
                  <span className="font-black text-slate-900 font-mono text-[10px] block">{processo.ncm || '0713.33.99'}</span>
                </div>
                <div className="p-1.5 bg-slate-50/50">
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block mb-0.5">Safra</span>
                  <span className="font-bold text-slate-900 text-[10px] block">{safraIdentificada}</span>
                </div>
                <div className="p-1.5 bg-slate-50/50">
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block mb-0.5">Origem</span>
                  <span className="font-bold text-slate-900 text-[10px] block">Brasil</span>
                </div>
                <div className="p-1.5 bg-emerald-50/70 col-span-2 sm:col-span-1">
                  <span className="text-[8.5px] font-black text-emerald-900 uppercase block mb-0.5">Peso Negociado</span>
                  <span className="font-black text-slate-950 text-[11px] block leading-tight">
                    {pesoNegociadoTon.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                  </span>
                  <span className="text-[8.5px] font-bold text-slate-600 block">
                    ({pesoNegociadoKg.toLocaleString('pt-BR')} kg)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CLÁUSULA 3: PREÇO & CONDIÇÕES COMERCIAIS (APENAS PREÇO POR TONELADA NEGOCIADO, SEM TOTAL FIXO) */}
          <div className="mb-2">
            <div className="bg-slate-100 border border-slate-400 px-2.5 py-1 rounded-t-md flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                  3
                </span>
                <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900">
                  Preço Unitário &amp; Condições Comerciais / Price &amp; Terms
                </h3>
              </div>
              <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                Cláusula 03
              </span>
            </div>

            <div className="border-x border-b border-slate-400 rounded-b-md p-2 bg-white text-[9.5px]">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 border-2 border-slate-300 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-slate-300 rounded overflow-hidden p-0">
                <div className="p-2 bg-emerald-50/60">
                  <span className="text-[8.5px] font-black text-emerald-950 uppercase block mb-0.5">Preço Unitário Negociado</span>
                  <span className="text-[11px] font-black text-emerald-900 font-mono">
                    US$ {precoUsd > 0 ? formatUSD(precoUsd) : '0.00'} / MT
                  </span>
                </div>
                <div className="p-2 bg-slate-50/50">
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block mb-0.5">Incoterm</span>
                  <span className="font-black text-slate-900 text-[10px]">{processo.incoterm || 'FOB'}</span>
                </div>
                <div className="p-2 bg-slate-50/50">
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block mb-0.5">Porto de Saída / POL</span>
                  <span className="font-bold text-slate-900 text-[10px]">{processo.portoOrigem || 'Porto de Santos - SP'}</span>
                </div>
                <div className="p-2 bg-slate-50/50">
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block mb-0.5">Porto de Destino / POD</span>
                  <span className="font-bold text-slate-900 text-[10px]">{processo.portoDestino}</span>
                </div>
              </div>

              <div className="mt-1.5 p-1.5 bg-slate-50 border-l-4 border-slate-500 border-y border-r border-slate-300 rounded-r text-[8.5px] text-slate-700 leading-tight">
                <strong>* Ajuste pelo Peso Efetivo de Estufagem:</strong> O preço é estritamente unitário por tonelada métrica (MT). O valor total definitivo será faturado com base no peso líquido real certificado após a conclusão da estufagem dos contêineres, sendo devido e pago todo o volume efetivamente embarcado.
              </div>
            </div>
          </div>

          {/* CLÁUSULA 4: CONDIÇÕES DE PAGAMENTO & INSTRUÇÕES BANCÁRIAS */}
          <div className="mb-2">
            <div className="bg-slate-100 border border-slate-400 px-2.5 py-1 rounded-t-md flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                  4
                </span>
                <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900">
                  Condições de Pagamento &amp; Instruções Bancárias / Payment Terms
                </h3>
              </div>
              <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                Cláusula 04
              </span>
            </div>

            <div className="border-x border-b border-slate-400 rounded-b-md p-2.5 bg-white text-[9.5px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 border-b-2 border-slate-300">
                <div>
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block mb-0.5">Modalidade de Pagamento</span>
                  <span className="font-black text-slate-950 text-[10px] block">
                    {temProforma 
                      ? `Adiantamento de ${adiantamentoPerc}% via T/T Pro-forma + Saldo de ${100 - adiantamentoPerc}% via CAD` 
                      : '100% via Cobrança Documentária CAD (Cash Against Documents)'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block mb-0.5">Prazo de Liquidação</span>
                  <span className="font-bold text-slate-900 text-[10px] block">
                    {diasLiquidacao} dias corridos após apresentação dos documentos ao banco do comprador.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[9px]">
                <div className="bg-slate-50/80 p-2 rounded border border-slate-300">
                  <span className="font-black text-slate-900 uppercase block mb-0.5">Banco do Comprador / Drawee Bank:</span>
                  <p className="font-black text-slate-950">{bancoComprador.nomeBanco || 'A indicar pelo comprador'}</p>
                  {bancoComprador.enderecoBanco && <p className="text-slate-700">{bancoComprador.enderecoBanco}</p>}
                  {bancoComprador.swift && <p className="text-slate-900 font-mono font-bold mt-0.5">SWIFT/BIC: {bancoComprador.swift}</p>}
                </div>
                <div className="bg-slate-50/80 p-2 rounded border border-slate-300">
                  <span className="font-black text-slate-900 uppercase block mb-0.5">Banco do Vendedor / Beneficiary Bank:</span>
                  <p className="font-black text-slate-950">Banco do Brasil S/A - Agência Câmbio e Exportação</p>
                  <p className="text-slate-700">Beneficiário: Bela Cereais Comércio Ltda. (CNPJ: 15.726.793/0001-06)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ OFICIAL DA FOLHA 1 (PÁGINA 1 DE 2) */}
        <div className="mt-auto pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
          <div className="flex items-center gap-2">
            <strong className="text-slate-900 font-bold">Bela Cereais Comércio Ltda.</strong>
            <span>•</span>
            <span>Ref: <strong className="font-mono text-slate-800">{processo.numeroProcesso}</strong></span>
            <span>•</span>
            <span>Confirmação de Negócio (Sales Contract Note)</span>
          </div>

          <div className="text-right shrink-0 leading-tight">
            <span className="text-[9.5px] font-mono font-medium text-slate-600 tracking-wider block">
              Página 1 de 2
            </span>
            <span className="text-[8.5px] font-mono text-slate-400 block mt-0.5">
              {dataAtualFormatada}
            </span>
          </div>
        </div>
      </div>

      {/* DIVISOR VISUAL ENTRE FOLHAS NA TELA (OCULTO NA IMPRESSÃO) */}
      <div className="max-w-[850px] mx-auto my-6 flex items-center justify-center gap-3 text-xs text-slate-400 font-semibold print:hidden">
        <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
        <span className="px-3.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] uppercase font-black tracking-widest border border-slate-300 dark:border-slate-700">
          Folha 2 (Página 2 de 2)
        </span>
        <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
      </div>

      {/* ========================================================================= */}
      {/* FOLHA 2 / PÁGINA 2 DE 2: LOGÍSTICA, FITO, DOCUMENTOS, ARBITRAGEM & ASSINATURAS */}
      {/* ========================================================================= */}
      <div 
        id="contrato-folha-2"
        className="contrato-sheet max-w-[850px] mx-auto bg-white p-7 sm:p-9 shadow-xl print:shadow-none rounded-2xl print:rounded-none border-2 border-slate-300 print:border-none font-sans text-[10px] leading-relaxed text-slate-900 flex flex-col justify-between"
      >
        <div>
          {/* CABEÇALHO DE CONTINUAÇÃO DA FOLHA 2 */}
          <div className="flex items-center justify-between border-b-2 border-slate-400 pb-1.5 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-950 text-xs uppercase tracking-wide">
                Bela Cereais Comércio Ltda.
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-[9.5px] text-slate-600">
                Confirmação de Negócio Ref: <strong className="font-mono text-slate-900">{processo.numeroProcesso}</strong> (Continuação)
              </span>
            </div>

            <div className="text-right text-[9.5px] text-slate-500 font-semibold">
              Data: {dataExtenso}
            </div>
          </div>

          {/* CLÁUSULA 5: LOGÍSTICA, EMBARQUE & DEADLINES */}
          <div className="mb-2">
            <div className="bg-slate-100 border border-slate-400 px-2.5 py-1 rounded-t-md flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                  5
                </span>
                <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900">
                  Logística, Embarque &amp; Deadlines / Logistics
                </h3>
              </div>
              <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                Cláusula 05
              </span>
            </div>

            <div className="border-x border-b border-slate-400 rounded-b-md p-2.5 bg-white text-[9.5px]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 border-b-2 border-slate-300">
                <div className="bg-slate-50/70 p-1.5 rounded border border-slate-200">
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block">Armador</span>
                  <span className="font-black text-slate-900 text-[10px]">{processo.armador || 'A definir'}</span>
                </div>
                <div className="bg-slate-50/70 p-1.5 rounded border border-slate-200">
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block">Nº Booking</span>
                  <span className="font-black text-slate-900 font-mono text-[10px]">{processo.bookingNumero || 'Pendente'}</span>
                </div>
                <div className="bg-slate-50/70 p-1.5 rounded border border-slate-200">
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block">Navio</span>
                  <span className="font-black text-slate-900 text-[10px]">{processo.navio || 'A designar'}</span>
                </div>
                <div className="bg-slate-50/70 p-1.5 rounded border border-slate-200">
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block">Terminal REDEX</span>
                  <span className="font-black text-slate-900 text-[10px]">{processo.localEstufagem || processo.redex || 'REDEX Santos'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1.5 text-[9px]">
                <div>
                  <span className="font-bold text-slate-600 uppercase block">Deadline de Carga / Gate:</span>
                  <span className="font-black text-slate-950">
                    {formatDateBR(processo.deadlineCarga || processo.deadlineEmbarque)}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 uppercase block">Deadline Draft B/L:</span>
                  <span className="font-black text-slate-950">{formatDateBR(processo.deadlineDraftBl)}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 uppercase block">Free Time no Destino:</span>
                  <span className="font-black text-slate-950">{processo.freeTimeDestino || 'Regras padrão armador'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CLÁUSULA 6: FITOSSANIDADE & FUMIGAÇÃO */}
          <div className="mb-2">
            <div className="bg-slate-100 border border-slate-400 px-2.5 py-1 rounded-t-md flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                  6
                </span>
                <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900">
                  Fitossanidade, Fumigação &amp; Inspeção MAPA / Phytosanitary
                </h3>
              </div>
              <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                Cláusula 06
              </span>
            </div>

            <div className="border-x border-b border-slate-400 rounded-b-md p-2.5 bg-white text-[9.5px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-2 border-b-2 border-slate-300">
                <div>
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block mb-0.5">Exigência de Fumigação</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {processo.fumigacaoNecessaria ? 'SIM, OBRIGATÓRIA' : 'NÃO EXIGIDA'}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block mb-0.5">Fumigante / Gás</span>
                  <span className="font-bold text-slate-900 text-[10px]">
                    {processo.fumigacaoTipo || 'Fosfina (PH3) / Fosfeto de Alumínio'}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] font-black text-slate-600 uppercase block mb-0.5">Tempo de Exposição</span>
                  <span className="font-bold text-slate-900 text-[10px]">
                    {processo.fumigacaoTempoHoras || 24} horas contínuas herméticas
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 text-[9px]">
                <div>
                  <span className="font-bold text-slate-600 uppercase block">Inspeção Oficial MAPA:</span>
                  <span className="font-black text-slate-950">
                    {processo.mapaNaSequencia !== false 
                      ? 'Sim, com emissão de Certificado Fitossanitário Oficial' 
                      : 'Conforme exigência aduaneira'
                    }
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 uppercase block">Etiquetagem / Marcações:</span>
                  <span className="font-black text-slate-950">
                    {processo.necessitaEtiqueta 
                      ? 'Sim, sacarias contendo etiquetas/marcações aprovadas' 
                      : 'Marcações padrão da beneficiadora'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CLÁUSULA 7: DOCUMENTOS EXIGIDOS PARA COBRANÇA */}
          <div className="mb-2">
            <div className="bg-slate-100 border border-slate-400 px-2.5 py-1 rounded-t-md flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                  7
                </span>
                <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900">
                  Documentos Exigidos para Cobrança CAD / Documents Required
                </h3>
              </div>
              <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                Cláusula 07
              </span>
            </div>

            <div className="border-x border-b border-slate-400 rounded-b-md p-2 bg-white text-[9px] text-slate-800 leading-snug">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
                <li className="flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <span>Jogo completo 3/3 Original Clean on Board Ocean Bills of Lading.</span>
                </li>
                <li className="flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <span>Fatura Comercial (Signed Commercial Invoice) em 3 vias originais.</span>
                </li>
                <li className="flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <span>Romaneio de Carga (Detailed Packing List) discriminando pesos e contêineres.</span>
                </li>
                <li className="flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <span>Certificado Fitossanitário Oficial emitido pelo MAPA.</span>
                </li>
                <li className="flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <span>Certificado Oficial de Fumigação emitido por credenciada.</span>
                </li>
                <li className="flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <span>Certificado de Classificação Vegetal e Peso por inspetora credenciada.</span>
                </li>
                <li className="flex items-center gap-1 font-medium col-span-1 sm:col-span-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <span>Certificado de Origem brasileiro (quando requerido pelo porto de destino).</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CLÁUSULA 8: CLÁUSULAS GERAIS & ARBITRAGEM */}
          <div className="mb-2">
            <div className="bg-slate-100 border border-slate-400 px-2.5 py-1 rounded-t-md flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                  8
                </span>
                <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900">
                  Cláusulas Gerais, Arbitragem &amp; Eficácia / General Provisions
                </h3>
              </div>
              <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                Cláusula 08
              </span>
            </div>

            <div className="border-x border-b border-slate-400 rounded-b-md p-2 bg-white text-[8.5px] text-slate-700 text-justify leading-tight">
              <p className="mb-0.5">
                <strong>ARBITRAGEM INTERNACIONAL:</strong> Controvérsias serão dirimidas pelas Regras Internacionais de Arbitragem de Grãos e Pulses (GAFTA / CICILS) ou foro eleito de comum acordo entre as partes. Nenhuma parte responde por eventos comprovados de Força Maior.
              </p>
              <p>
                <strong>EFICÁCIA VINCULANTE:</strong> A confirmação manifestada por troca de e-mails, aceite eletrônico, transmissão digitalizada ou assinatura física possui plena validade jurídica e executiva entre as partes.
              </p>
            </div>
          </div>

          {/* CLÁUSULA 9: TERMO DE ACEITE & ASSINATURAS */}
          <div className="mb-2">
            <div className="bg-slate-100 border border-slate-400 px-2.5 py-1 rounded-t-md flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                  9
                </span>
                <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900">
                  Termo de Aceite &amp; Assinaturas / Acceptance &amp; Signatures
                </h3>
              </div>
              <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                Cláusula 09
              </span>
            </div>

            <div className="border-x border-b border-slate-400 rounded-b-md p-2.5 bg-white">
              <p className="text-center text-[9px] font-bold text-slate-800 uppercase mb-3">
                Confirmamos e aceitamos expressamente todos os termos, especificações técnicas, preço unitário e condições comerciais aqui estipuladas.
              </p>

              <div className="grid grid-cols-2 gap-6 text-center text-[10px]">
                {/* ASSINATURA VENDEDOR */}
                <div className="border border-slate-300 rounded p-2.5 bg-slate-50/50 flex flex-col justify-between min-h-[115px]">
                  {/* Espaço amplo superior para assinatura física ou digital */}
                  <div className="h-16 flex items-end justify-center pb-1">
                    <div className="border-b-2 border-slate-900 w-4/5" />
                  </div>
                  <div>
                    <p className="font-black text-slate-950 uppercase text-[10.5px]">BELA CEREAIS COMÉRCIO LTDA.</p>
                    <p className="text-[9px] font-bold text-slate-600">Vendedor / Exporter (Seller)</p>
                    <p className="text-[8.5px] text-slate-500 mt-0.5">Assinatura Autorizada &amp; Carimbo</p>
                  </div>
                </div>

                {/* ASSINATURA COMPRADOR */}
                <div className="border border-slate-300 rounded p-2.5 bg-slate-50/50 flex flex-col justify-between min-h-[115px]">
                  {/* Espaço amplo superior para assinatura física ou digital */}
                  <div className="h-16 flex items-end justify-center pb-1">
                    <div className="border-b-2 border-slate-900 w-4/5" />
                  </div>
                  <div>
                    <p className="font-black text-slate-950 uppercase text-[10.5px]">{buyerNome}</p>
                    <p className="text-[9px] font-bold text-slate-600">Comprador / Importer (Buyer)</p>
                    <p className="text-[8.5px] text-slate-500 mt-0.5">Assinatura Autorizada &amp; Carimbo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ OFICIAL DA FOLHA 2 (PÁGINA 2 DE 2) COM QR CODE COMPACTO À ESQUERDA E NÚMERO DE PÁGINA À DIREITA */}
        <div className="mt-auto pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
          <div className="flex items-center gap-3">
            {/* QR CODE COMPACTO PARA VALIDAÇÃO DIGITAL */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg shrink-0">
              <a
                href={verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white p-0.5 rounded border border-slate-200"
                title="Escaneie para validar a negociação no sistema"
              >
                <QRCodeSVG
                  value={verificationUrl}
                  size={38}
                  level="M"
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                />
              </a>
              <div className="text-[7.5px] leading-tight text-slate-600">
                <span className="font-bold text-slate-900 uppercase flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                  Autenticidade
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Validação digital<br />Ref: {processo.numeroProcesso}
                </span>
              </div>
            </div>

            <div className="text-[8.5px] leading-tight text-slate-500">
              <p className="font-semibold text-slate-700">
                Documento oficial emitido pelo Sistema de Exportação Bela Cereais
              </p>
              <p className="text-[8px] text-slate-400 mt-0.5">
                Emissão: {dataExtenso} • Via Única Vinculante
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 leading-tight">
            <span className="text-[9.5px] font-mono font-medium text-slate-600 tracking-wider block">
              Página 2 de 2
            </span>
            <span className="text-[8.5px] font-mono text-slate-400 block mt-0.5">
              {dataAtualFormatada}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
