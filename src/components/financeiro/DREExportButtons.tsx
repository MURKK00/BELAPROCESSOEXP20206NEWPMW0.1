'use client';

import { useState } from 'react';
import { Download, Printer, FileSpreadsheet } from 'lucide-react';
import { formatPTAX } from '@/lib/formatters';

interface DREExportProps {
  processo: {
    id: string;
    numeroProcesso: string;
    clienteFinal: string;
    produto: string;
    volumeKg: number | string;
    incoterm?: string | null;
    portoOrigem?: string | null;
    portoDestino?: string | null;
  };
  financeiro: {
    precoUsd: number;
    bancoDestino?: string | null;
    statusRecebimento?: string | null;
    dataRecebimento?: string | Date | null;
  };
  metricas: {
    pesoFinalTon: number;
    pesoFinalKg: number;
    precoUnitarioUsd: number;
    valorTotalUsd: number;
    totalUsdTravado: number;
    saldoUsdParaTravar: number;
    ptaxMedia: number;
    receitaBrutaBRL: number;
    totalTaxasBRL?: number;
    receitaLiquidaBRL?: number;
    totalCustosBRL: number;
    resultadoOperacionalBRL: number;
    margemLucro: number;
  };
  travamentos: Array<{
    dataTravamento: string | Date;
    valorUsdParcial: number;
    ptax: number;
    taxa?: number;
    valorLiquido?: number;
    observacao?: string | null;
  }>;
  custos: Array<{
    categoria: string;
    categoriaLabel: string;
    valor: number;
  }>;
}

export function DREExportButtons({
  processo,
  financeiro,
  metricas,
  travamentos,
  custos,
}: DREExportProps) {
  const [exportando, setExportando] = useState(false);

  // Formatação de moedas
  const fmtBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const fmtUSD = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const totalTaxas = metricas.totalTaxasBRL ?? 0;
  const receitaLiquida = metricas.receitaLiquidaBRL ?? (metricas.receitaBrutaBRL - totalTaxas);

  const dataRecebFormatada = financeiro.dataRecebimento
    ? new Date(financeiro.dataRecebimento).toLocaleDateString('pt-BR')
    : null;

  // 1. Exportação para Excel (.csv com BOM UTF-8)
  const exportarExcel = () => {
    setExportando(true);
    try {
      const rows: string[][] = [
        ['BELA CEREAIS - DEMONSTRATIVO DE RESULTADO DO PROCESSO (DRE)'],
        [`Processo:`, processo.numeroProcesso, `Data Extração:`, new Date().toLocaleDateString('pt-BR')],
        [`Cliente Final:`, processo.clienteFinal, `Produto:`, processo.produto],
        [`Incoterm:`, processo.incoterm || 'FOB', `Origem / Destino:`, `${processo.portoOrigem || '-'} -> ${processo.portoDestino || '-'}`],
        [`Banco Destino:`, financeiro.bancoDestino || 'BB BRASIL', `Status Recebimento:`, financeiro.statusRecebimento === 'RECEBIDO' ? `Recebido em ${dataRecebFormatada || '-'}` : 'A Receber'],
        [],
        ['1. RESUMO OPERACIONAL'],
        ['Item', 'Unidade', 'Valor'],
        ['Peso Real (Net Weight)', 'Ton', metricas.pesoFinalTon.toFixed(3).replace('.', ',')],
        ['Peso Real (Net Weight)', 'Kg', metricas.pesoFinalKg.toFixed(2).replace('.', ',')],
        ['Preço Unitário USD', 'USD / Ton', metricas.precoUnitarioUsd.toFixed(2).replace('.', ',')],
        ['Valor Total a Receber', 'USD', metricas.valorTotalUsd.toFixed(2).replace('.', ',')],
        ['Total USD Travado', 'USD', metricas.totalUsdTravado.toFixed(2).replace('.', ',')],
        ['Saldo USD a Travar', 'USD', metricas.saldoUsdParaTravar.toFixed(2).replace('.', ',')],
        ['PTAX Média Ponderada', 'R$ / USD', formatPTAX(metricas.ptaxMedia)],
        [],
        ['2. TRAVAMENTOS CAMBIAIS (FECHAMENTOS DE CÂMBIO)'],
        ['Data da Trava', 'Valor USD', 'PTAX', 'Valor Bruto (BRL)', 'Taxa Cobrada (BRL)', 'Valor Líquido (BRL)', 'Observação'],
      ];

      travamentos.forEach((t) => {
        const valBruto = t.valorUsdParcial * t.ptax;
        const tx = t.taxa ?? 0;
        const valLiq = t.valorLiquido ?? (valBruto - tx);
        const dt = new Date(t.dataTravamento).toLocaleDateString('pt-BR');
        rows.push([
          dt,
          t.valorUsdParcial.toFixed(2).replace('.', ','),
          formatPTAX(t.ptax),
          valBruto.toFixed(2).replace('.', ','),
          tx.toFixed(2).replace('.', ','),
          valLiq.toFixed(2).replace('.', ','),
          t.observacao || '',
        ]);
      });

      rows.push([]);
      rows.push(['3. DEMONSTRATIVO DE CUSTOS OPERACIONAIS (BRL)']);
      rows.push(['Categoria de Custo', 'Valor (R$)']);
      custos.forEach((c) => {
        rows.push([c.categoriaLabel, c.valor.toFixed(2).replace('.', ',')]);
      });
      rows.push(['TOTAL DE CUSTOS', metricas.totalCustosBRL.toFixed(2).replace('.', ',')]);

      rows.push([]);
      rows.push(['4. RESULTADO LÍQUIDO DO CONTRATO']);
      rows.push(['Receita Bruta Câmbio (BRL)', metricas.receitaBrutaBRL.toFixed(2).replace('.', ',')]);
      rows.push(['(-) Taxas Cobradas Câmbio (BRL)', totalTaxas.toFixed(2).replace('.', ',')]);
      rows.push(['(=) Receita Líquida Câmbio (BRL)', receitaLiquida.toFixed(2).replace('.', ',')]);
      rows.push(['(-) Custos Operacionais Totais (BRL)', metricas.totalCustosBRL.toFixed(2).replace('.', ',')]);
      rows.push(['(=) Resultado Operacional Líquido (BRL)', metricas.resultadoOperacionalBRL.toFixed(2).replace('.', ',')]);
      rows.push(['Margem Líquida (%)', `${metricas.margemLucro.toFixed(2).replace('.', ',')}%`]);

      // Montar CSV com BOM para o Excel abrir com acentuação correta
      const csvContent =
        '\uFEFF' +
        rows.map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `DRE_${processo.numeroProcesso}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExportando(false);
    }
  };

  // 2. Exportação / Impressão em PDF estilizado
  const imprimirPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>DRE - Processo ${processo.numeroProcesso}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; padding: 24px; margin: 0; line-height: 1.4; }
          .header { border-bottom: 2px solid #f58220; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .brand { font-size: 20px; font-weight: 900; color: #f58220; letter-spacing: -0.5px; }
          .title { font-size: 15px; font-weight: 800; color: #111827; }
          .meta { font-size: 11px; color: #6b7280; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
          .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
          .card-title { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #6b7280; margin-bottom: 4px; }
          .card-value { font-size: 15px; font-weight: 800; color: #111827; }
          .result-banner { background: ${metricas.resultadoOperacionalBRL >= 0 ? '#064e3b' : '#7f1d1d'}; color: #fff; padding: 16px 20px; border-radius: 10px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .result-value { font-size: 24px; font-weight: 900; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 24px; }
          th { text-align: left; background: #f3f4f6; padding: 8px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #4b5563; border-bottom: 1px solid #d1d5db; }
          td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .section-title { font-size: 12px; font-weight: 800; color: #111827; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 16px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Bela Cereais Export</div>
            <div class="title">Demonstrativo de Resultado do Exercício / Processo (DRE)</div>
            <div class="meta">Exportação de Grãos • Fechamento Gerencial e Cambial</div>
          </div>
          <div class="text-right">
            <div style="font-size: 16px; font-weight: 800; color: #f58220;">${processo.numeroProcesso}</div>
            <div class="meta">Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div class="meta">Status: ${financeiro.statusRecebimento === 'RECEBIDO' ? `Recebido em ${dataRecebFormatada || '-'}` : 'A Receber'}</div>
          </div>
        </div>

        <div class="result-banner">
          <div>
            <div style="font-size: 10px; text-transform: uppercase; opacity: 0.85;">Resultado Operacional Líquido</div>
            <div class="result-value">${fmtBRL(metricas.resultadoOperacionalBRL)}</div>
            <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">
              Margem Líquida da Operação: <strong>${metricas.margemLucro.toFixed(2)}%</strong>
            </div>
          </div>
          <div style="text-align: right; background: rgba(255,255,255,0.12); padding: 10px 16px; border-radius: 8px;">
            <div style="font-size: 11px; opacity: 0.9;">Receita Bruta: <strong>${fmtBRL(metricas.receitaBrutaBRL)}</strong></div>
            ${totalTaxas > 0 ? `<div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">(-) Taxas Câmbio: <strong style="color:#fca5a5;">-${fmtBRL(totalTaxas)}</strong></div>` : ''}
            <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">(=) Câmbio Líquido: <strong>${fmtBRL(receitaLiquida)}</strong></div>
            <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">(-) Total Custos: <strong>${fmtBRL(metricas.totalCustosBRL)}</strong></div>
          </div>
        </div>

        <div class="grid-4">
          <div class="card">
            <div class="card-title">Cliente & Produto</div>
            <div style="font-weight: 700; font-size: 12px;">${processo.clienteFinal}</div>
            <div style="color: #6b7280; font-size: 11px;">${processo.produto}</div>
          </div>
          <div class="card">
            <div class="card-title">Volume & Preço</div>
            <div class="card-value">${metricas.pesoFinalTon.toFixed(3)} TON</div>
            <div style="color: #6b7280; font-size: 11px;">${fmtUSD(metricas.precoUnitarioUsd)} / TON (${processo.incoterm || 'FOB'})</div>
          </div>
          <div class="card">
            <div class="card-title">Câmbio Ponderado</div>
            <div class="card-value">R$ ${formatPTAX(metricas.ptaxMedia)}</div>
            <div style="color: #6b7280; font-size: 11px;">Saldo a Travar: ${fmtUSD(metricas.saldoUsdParaTravar)}</div>
          </div>
          <div class="card">
            <div class="card-title">Liquidação / Banco</div>
            <div class="card-value" style="font-size: 13px;">${financeiro.bancoDestino || 'BB BRASIL'}</div>
            <div style="color: ${financeiro.statusRecebimento === 'RECEBIDO' ? '#059669' : '#d97706'}; font-size: 11px; font-weight: 600;">
              ${financeiro.statusRecebimento === 'RECEBIDO' ? `Liquidado (${dataRecebFormatada || '-'})` : 'Pendente de Recebimento'}
            </div>
          </div>
        </div>

        <div class="section-title">1. Fechamentos de Câmbio (Trava PTAX & Taxas Aplicadas)</div>
        <table>
          <thead>
            <tr>
              <th>Data da Trava</th>
              <th class="text-right">Valor USD</th>
              <th class="text-right">Taxa PTAX</th>
              <th class="text-right">Valor Bruto (BRL)</th>
              <th class="text-right">Taxa Cobrada (BRL)</th>
              <th class="text-right">Valor Líquido (BRL)</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            ${
              travamentos.length === 0
                ? '<tr><td colspan="7" style="text-align:center;color:#9ca3af;">Nenhum fechamento de câmbio registrado.</td></tr>'
                : travamentos
                    .map((t) => {
                      const bruto = t.valorUsdParcial * t.ptax;
                      const tx = t.taxa ?? 0;
                      const liq = t.valorLiquido ?? (bruto - tx);
                      return `
              <tr>
                <td>${new Date(t.dataTravamento).toLocaleDateString('pt-BR')}</td>
                <td class="text-right font-bold">${fmtUSD(t.valorUsdParcial)}</td>
                <td class="text-right font-mono">R$ ${formatPTAX(t.ptax)}</td>
                <td class="text-right">${fmtBRL(bruto)}</td>
                <td class="text-right" style="color: ${tx > 0 ? '#dc2626' : '#6b7280'};">${tx > 0 ? `- ${fmtBRL(tx)}` : 'R$ 0,00'}</td>
                <td class="text-right font-bold" style="color: #047857;">${fmtBRL(liq)}</td>
                <td>${t.observacao || '-'}</td>
              </tr>
            `;
                    })
                    .join('')
            }
          </tbody>
        </table>

        <div class="section-title">2. Estrutura de Custos Operacionais</div>
        <table>
          <thead>
            <tr>
              <th>Categoria de Custo</th>
              <th class="text-right">Valor Estimado / Realizado (BRL)</th>
              <th class="text-right">% s/ Receita Bruta</th>
            </tr>
          </thead>
          <tbody>
            ${custos
              .map((c) => {
                const perc = metricas.receitaBrutaBRL > 0 ? (c.valor / metricas.receitaBrutaBRL) * 100 : 0;
                return `
                <tr>
                  <td>${c.categoriaLabel}</td>
                  <td class="text-right font-bold">${fmtBRL(c.valor)}</td>
                  <td class="text-right text-gray-500">${perc.toFixed(2)}%</td>
                </tr>
              `;
              })
              .join('')}
            <tr style="background:#f9fafb; font-weight:800;">
              <td>TOTAL DE CUSTOS</td>
              <td class="text-right font-bold" style="color:#b91c1c;">${fmtBRL(metricas.totalCustosBRL)}</td>
              <td class="text-right">${metricas.receitaBrutaBRL > 0 ? ((metricas.totalCustosBRL / metricas.receitaBrutaBRL) * 100).toFixed(2) : 0}%</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 32px; border-top: 1px dashed #d1d5db; padding-top: 16px; font-size: 11px; color: #9ca3af; text-align: center;">
          Documento interno confidencial gerado pelo sistema Bela Cereais Export Cockpit.
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportarExcel}
        disabled={exportando}
        title="Baixar planilha formatada com DRE, Câmbio e Custos"
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        <span>Exportar Excel</span>
      </button>

      <button
        onClick={imprimirPDF}
        title="Imprimir ou salvar DRE em PDF"
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
      >
        <Printer className="w-3.5 h-3.5 text-gray-600" />
        <span>Imprimir DRE</span>
      </button>
    </div>
  );
}
