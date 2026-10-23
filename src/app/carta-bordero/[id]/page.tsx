import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDateBR } from '@/lib/formatters';
import { PrintButton } from '@/components/documentos/PrintButton';
import { parseCompradorInfo } from '@/lib/compradorHelper';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Edit3, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export default async function CartaBorderoPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
  });

  if (!processo) notFound();

  // Decodifica dados do Comprador e do Banco de Destino
  const { comprador, bancoComprador } = parseCompradorInfo(processo.complementoBuyer);
  const isCompradorDiferente = Boolean(comprador?.diferente);

  // Nome e endereço do sacado (Drawee)
  const draweeNome = isCompradorDiferente && comprador.nome ? comprador.nome : processo.clienteFinal;
  const draweeEndereco = isCompradorDiferente && comprador.endereco ? comprador.endereco : (processo.enderecoBuyer || 'A definir');
  const draweeTaxId = isCompradorDiferente && comprador.taxId ? comprador.taxId : (processo.iecBuyer || processo.panBuyer || processo.gstBuyer || 'A definir');

  // Cálculo do valor total USD
  const valDeclarado = processo.valorDeclaradoUsd ? Number(processo.valorDeclaradoUsd) : 0;
  const volKg = processo.volumeKg ? Number(processo.volumeKg) : 0;
  let valorTotalUsd = 0;
  if (valDeclarado > 0) {
    if (valDeclarado < 5000 && volKg > 0) {
      // Preço unitário por tonelada
      valorTotalUsd = (volKg / 1000) * valDeclarado;
    } else {
      valorTotalUsd = valDeclarado;
    }
  }

  const temProforma = Boolean(bancoComprador.temProforma);
  const diasLiquidacao = bancoComprador.diasLiquidacao ?? (temProforma ? 10 : 20);
  const multaAtrasoPerc = bancoComprador.multaAtrasoPerc ?? 5;
  const adiantamentoPerc = bancoComprador.adiantamentoPerc ?? 10;

  // Cálculo de saldo quando com pro-forma
  const valorAdiantamento = (valorTotalUsd * adiantamentoPerc) / 100;
  const valorSaldoCad = valorTotalUsd - valorAdiantamento;

  const formatUSD = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Data por extenso em português
  const hoje = new Date();
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const dataExtenso = `Cuiabá - MT, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;

  // Cláusula de juros e atraso especificada exatamente pelo usuário
  const clausulaJuros = !temProforma
    ? `100% CAD (liquidação contra apresentação de documentos) a vista com prazo máximo de liquidação de ${diasLiquidacao} dias corridos após entrega dos documentos no banco do comprador. Caso a liquidação aconteça após os ${diasLiquidacao} dias corridos de prazo da data de entrega dos documentos no banco do comprador o valor da Invoice a ser paga deve ser acrescentado de ${multaAtrasoPerc}% de multa pelo atraso.`
    : `Houve o adiantamento de ${adiantamentoPerc}% no momento do carregamento e saldo U$ ${formatUSD(valorSaldoCad)} CAD (liquidação contra apresentação de documentos) a vista com prazo máximo de liquidação de ${diasLiquidacao} dias corridos após entrega dos documentos no banco do comprador. Caso a liquidação aconteça após os ${diasLiquidacao} dias corridos de prazo da data de entrega dos documentos no banco do comprador o valor da Invoice a ser paga deve ser acrescentado de ${multaAtrasoPerc}% de multa pelo atraso.`;

  const bancoPreenchido = Boolean(bancoComprador.nomeBanco?.trim());

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4 print:p-0 print:bg-white text-slate-800">
      {/* BARRA DE FERRAMENTAS NÃO IMPRESSA */}
      <div className="max-w-[850px] mx-auto mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href={`/negociacoes/${processo.id}/documentos`}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Voltar aos Documentos"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded-md">
                  Carta Borderô Oficial
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Ref: {processo.numeroProcesso}
                </span>
              </div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                Abertura de Saque por Cobrança CAD
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/negociacoes/${processo.id}/importador`}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-4 h-4 text-orange-500" />
              <span>Editar Banco & CAD</span>
            </Link>
            <PrintButton />
          </div>
        </div>

        {/* ALERTA SE O BANCO DO COMPRADOR ESTIVER PENDENTE */}
        {!bancoPreenchido && (
          <div className="mt-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">Atenção: Os dados bancários do Comprador ainda não foram preenchidos!</span>
              <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                Você pode emitir a carta para conferência, mas lembre-se de cadastrar o Nome do Banco, Endereço, Conta e SWIFT na aba <strong>Importador (buyer)</strong> antes do envio ao Banco do Brasil.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* DOCUMENTO PRINCIPAL FORMATADO PARA A4 */}
      <div className="max-w-[850px] mx-auto bg-white p-10 sm:p-14 shadow-xl print:shadow-none print:p-8 rounded-2xl print:rounded-none border border-slate-200 print:border-none font-serif text-[13px] leading-relaxed">
        
        {/* CABEÇALHO COM LOGO BELA CEREAIS */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <Image 
              src="/logo-site-bela-verde.png" 
              alt="Bela Cereais" 
              width={160}
              height={56}
              className="h-14 w-auto object-contain"
              referrerPolicy="no-referrer"
              priority
            />
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-950 font-sans uppercase">
                Bela Cereais Comércio Ltda.
              </h2>
              <p className="text-[11px] text-slate-600 font-sans">
                CNPJ: 15.726.793/0001-06 • Cuiabá - MT - Brasil
              </p>
            </div>
          </div>
          <div className="text-right font-sans">
            <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-900 text-xs font-extrabold uppercase tracking-wider rounded">
              Carta Borderô • Cobrança CAD
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Ref: <strong className="text-slate-900">{processo.numeroProcesso}</strong>
            </p>
            <p className="text-[11px] text-slate-500">
              Data: {formatDateBR(hoje)}
            </p>
          </div>
        </div>

        {/* DESTINATÁRIO: BANCO DO BRASIL S/A */}
        <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 font-sans">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ao</p>
          <p className="text-sm font-black text-slate-900">BANCO DO BRASIL S/A</p>
          <p className="text-xs text-slate-700">Gerência de Câmbio e Comércio Exterior / São Paulo - SP</p>
          <p className="text-xs text-slate-800 mt-1 font-semibold">
            Assunto: <u>Abertura de Processo de Saque por Cobrança de Exportação - CAD (Cash Against Documents)</u>
          </p>
          <p className="text-xs text-slate-700">
            Processo de Embarque / Ref. Bela Cereais: <strong>{processo.numeroProcesso}</strong>
          </p>
        </div>

        {/* MENSAGEM DE ABERTURA */}
        <p className="mb-4 text-justify indent-6">
          Prezados Senhores, solicitamos a V.Sas. que promovam a abertura do processo de cobrança de exportação na modalidade <strong>CAD (Cash Against Documents / Saque à Vista)</strong>, encaminhando a documentação original e cópias detalhadas a seguir para o Banco Cobrador no exterior, em nome do sacado indicado.
        </p>

        {/* SEÇÃO 1: DADOS DO EXPORTADOR & FATURA */}
        <div className="mb-6 font-sans">
          <h3 className="text-xs font-black uppercase tracking-wider bg-slate-900 text-white px-3 py-1 mb-2 rounded-sm">
            1. Dados do Exportador & da Operação Comercial
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs bg-slate-50/70 p-3 rounded border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Exportador / Cedente:</span>
              <strong className="text-slate-900">BELA CEREAIS COMERCIO LTDA</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">CNPJ:</span>
              <span className="font-mono text-slate-900">15.726.793/0001-06</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Endereço:</span>
              <span className="text-slate-800">Rua A-4, Nº 20 Quadra 136 - C20 Parque Cuiabá, Cuiabá - MT, CEP 78.095-296</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Conta Corrente / IBAN de Câmbio:</span>
              <span className="font-mono font-bold text-slate-900">BR8600000000071390000330329C1</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Contato Responsável:</span>
              <span className="text-slate-900">Márcia Moratelli (Depto. Exportação / Câmbio)</span>
            </div>
            <div className="pt-1 border-t border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Fatura Comercial (Invoice N°):</span>
              <strong className="text-slate-900 font-mono">{processo.numeroProcesso}</strong>
            </div>
            <div className="pt-1 border-t border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Valor Total da Fatura (USD):</span>
              <strong className="text-emerald-700 text-sm font-mono">U$ {formatUSD(valorTotalUsd)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Modalidade de Vencimento:</span>
              <span className="font-semibold text-slate-900">À Vista (Cash Against Documents - CAD)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Relação de Vínculo:</span>
              <span className="font-semibold text-slate-900">Sem Vínculo (conforme reg. cambial)</span>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: RELAÇÃO DE DOCUMENTOS ANEXOS (9 DOCUMENTOS OFICIAIS) */}
        <div className="mb-6 font-sans">
          <h3 className="text-xs font-black uppercase tracking-wider bg-slate-900 text-white px-3 py-1 mb-2 rounded-sm">
            2. Relação de Documentos Remetidos no Borderô (Dossiê Completo)
          </h3>
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-1.5 px-3 w-8 text-center">Item</th>
                  <th className="py-1.5 px-3">Documento</th>
                  <th className="py-1.5 px-3 w-32 text-center">Via Original</th>
                  <th className="py-1.5 px-3 w-32 text-center">Cópias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-1 px-3 text-center font-bold text-slate-400">01</td>
                  <td className="py-1 px-3 font-semibold text-slate-900">Conhecimento de Embarque Marítimo (Bill of Lading - B/L)</td>
                  <td className="py-1 px-3 text-center font-mono">3 (três)</td>
                  <td className="py-1 px-3 text-center font-mono">3 Não Negociáveis</td>
                </tr>
                <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                  <td className="py-1 px-3 text-center font-bold text-slate-400">02</td>
                  <td className="py-1 px-3 font-semibold text-slate-900">Fatura Comercial (Commercial Invoice)</td>
                  <td className="py-1 px-3 text-center font-mono">3 (três) vias</td>
                  <td className="py-1 px-3 text-center font-mono">—</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-1 px-3 text-center font-bold text-slate-400">03</td>
                  <td className="py-1 px-3 font-semibold text-slate-900">Certificado de Origem (Certificate of Origin)</td>
                  <td className="py-1 px-3 text-center font-mono">1 (uma)</td>
                  <td className="py-1 px-3 text-center font-mono">1 cópia</td>
                </tr>
                <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                  <td className="py-1 px-3 text-center font-bold text-slate-400">04</td>
                  <td className="py-1 px-3 font-semibold text-slate-900">Certificado Fitossanitário Oficial (Phytosanitary Certificate - MAPA)</td>
                  <td className="py-1 px-3 text-center font-mono">1 (uma)</td>
                  <td className="py-1 px-3 text-center font-mono">1 cópia</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-1 px-3 text-center font-bold text-slate-400">05</td>
                  <td className="py-1 px-3 font-semibold text-slate-900">Romaneio de Carga (Packing List)</td>
                  <td className="py-1 px-3 text-center font-mono">3 (três) vias</td>
                  <td className="py-1 px-3 text-center font-mono">—</td>
                </tr>
                <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                  <td className="py-1 px-3 text-center font-bold text-slate-400">06</td>
                  <td className="py-1 px-3 font-semibold text-slate-900">Certificado de Qualidade / Análise (Certificate of Quality / Analysis)</td>
                  <td className="py-1 px-3 text-center font-mono">1 (uma)</td>
                  <td className="py-1 px-3 text-center font-mono">1 cópia</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-1 px-3 text-center font-bold text-slate-400">07</td>
                  <td className="py-1 px-3 font-semibold text-slate-900">Certificado de Peso (Certificate of Weight)</td>
                  <td className="py-1 px-3 text-center font-mono">1 (uma)</td>
                  <td className="py-1 px-3 text-center font-mono">1 cópia</td>
                </tr>
                <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                  <td className="py-1 px-3 text-center font-bold text-slate-400">08</td>
                  <td className="py-1 px-3 font-semibold text-slate-900">Certificado de Fumigação (Fumigation Certificate)</td>
                  <td className="py-1 px-3 text-center font-mono">1 (uma)</td>
                  <td className="py-1 px-3 text-center font-mono">1 cópia</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-1 px-3 text-center font-bold text-slate-400">09</td>
                  <td className="py-1 px-3 font-semibold text-slate-900">Relatório Fotográfico de Estufagem (Photo Loading Report)</td>
                  <td className="py-1 px-3 text-center font-mono">1 (uma) via</td>
                  <td className="py-1 px-3 text-center font-mono">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SEÇÃO 3: INSTRUÇÕES DE COBRANÇA CAD & JUROS POR ATRASO */}
        <div className="mb-6 font-sans">
          <h3 className="text-xs font-black uppercase tracking-wider bg-slate-900 text-white px-3 py-1 mb-2 rounded-sm">
            3. Instruções de Liquidação, Prazos e Cobrança de Multa/Juros
          </h3>
          <div className="p-3.5 bg-amber-50/50 border border-amber-300 rounded text-xs text-slate-900 space-y-2">
            <div>
              <span className="font-bold text-amber-950 uppercase text-[10px] block">
                Tipo de Negociação / Estrutura Cambial:
              </span>
              <span className="font-semibold text-slate-800">
                {temProforma
                  ? `Com Adiantamento Pro-forma (${adiantamentoPerc}%) + Saldo em CAD (${100 - adiantamentoPerc}%)`
                  : 'Sem Pro-forma (100% CAD à vista contra apresentação de documentos)'}
              </span>
            </div>

            <div>
              <span className="font-bold text-amber-950 uppercase text-[10px] block">
                Cobrar juros / multa por atraso (Instrução Obrigatória ao Banco Cobrador):
              </span>
              <p className="mt-1 font-serif text-[13px] italic bg-white p-2.5 rounded border border-amber-200 leading-normal text-slate-900 text-justify">
                {clausulaJuros}
              </p>
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: DADOS DO BANCO DE DESTINO & SACADO (BUYER) */}
        <div className="mb-6 font-sans">
          <h3 className="text-xs font-black uppercase tracking-wider bg-slate-900 text-white px-3 py-1 mb-2 rounded-sm">
            4. Dados do Banco de Destino (Comprador) & Sacado (Drawee)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
            {/* COLUNA ESQUERDA: DADOS DO SACADO */}
            <div className="space-y-1.5 border-r md:pr-3 border-slate-200">
              <span className="font-bold text-[10px] uppercase text-slate-500 block">
                Sacado / Comprador (Drawee / Buyer):
              </span>
              <p className="font-bold text-slate-900 text-sm">{draweeNome}</p>
              <p className="text-slate-700 leading-snug">{draweeEndereco}</p>
              <p className="text-slate-700">
                Tax ID / Reg. Fiscal: <strong className="font-mono">{draweeTaxId}</strong>
              </p>
              {processo.portoDestino && (
                <p className="text-slate-700">
                  Porto de Destino: <strong>{processo.portoDestino}</strong>
                </p>
              )}
            </div>

            {/* COLUNA DIREITA: DADOS DO BANCO COBRADOR NO DESTINO */}
            <div className="space-y-1.5 md:pl-2">
              <span className="font-bold text-[10px] uppercase text-slate-500 block">
                Banco Cobrador no Exterior (Collecting Bank):
              </span>
              {bancoPreenchido ? (
                <>
                  <p className="font-bold text-slate-900">{bancoComprador.nomeBanco}</p>
                  {bancoComprador.enderecoBanco && (
                    <p className="text-slate-700 leading-snug">{bancoComprador.enderecoBanco}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-semibold">Conta / Account:</span>
                      <span className="font-mono font-bold text-slate-900">{bancoComprador.conta || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-semibold">Código SWIFT / BIC:</span>
                      <span className="font-mono font-bold text-slate-900">{bancoComprador.swift || 'N/A'}</span>
                    </div>
                  </div>
                  {(bancoComprador.telefone || bancoComprador.email) && (
                    <div className="text-[11px] text-slate-600 pt-1">
                      {bancoComprador.telefone && <span>Tel: {bancoComprador.telefone} </span>}
                      {bancoComprador.email && <span>• Email: {bancoComprador.email}</span>}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
                  <p className="font-bold text-xs">Dados bancários do destino pendentes de cadastro</p>
                  <p className="text-[11px] mt-0.5">
                    Preencher o nome do banco, endereço e SWIFT na aba Importador (buyer).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INSTRUÇÕES GERAIS, ENCARGOS & ASSINATURA */}
        <div className="space-y-3 font-sans text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-bold uppercase text-[10px] text-slate-500 block mb-1">
              Despesas e Comissões Bancárias:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700">
              <li>Todas as despesas bancárias e tarifas no Brasil são por conta do <strong>Exportador (Bela Cereais)</strong>.</li>
              <li>Todas as despesas bancárias, comissões de cobrança e taxas no exterior são por conta do <strong>Sacado / Importador</strong> (<em>All collection charges and bank fees outside Brazil are for buyer&apos;s / drawee&apos;s account</em>).</li>
              <li><strong>Liberação dos Documentos:</strong> Efetuar a entrega dos documentos originais estritamente contra o pagamento irrevogável à vista (Documents Against Payment - D/P). Em caso de não liquidação no prazo estipulado, avisar imediatamente o Banco do Brasil via SWIFT. Não protestar sem autorização formal prévia.</li>
            </ul>
          </div>

          <div className="pt-8 pb-4 text-center font-serif">
            <p className="mb-12 text-slate-800 text-[13px]">{dataExtenso}</p>

            <div className="inline-block border-t border-slate-900 pt-2 px-12 font-sans">
              <p className="font-bold text-sm text-slate-950 uppercase">BELA CEREAIS COMÉRCIO LTDA.</p>
              <p className="text-xs text-slate-600">CNPJ: 15.726.793/0001-06</p>
              <p className="text-xs text-slate-600">Departamento de Câmbio e Exportação</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
