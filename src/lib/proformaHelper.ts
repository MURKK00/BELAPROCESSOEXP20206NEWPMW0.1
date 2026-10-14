export interface DadosProformaRecebimento {
  temProforma: boolean;
  bancoLimpo: string;

  // Parcela 1: Pro-forma / Entrada Antecipada
  valorProformaBrutoUsd: number;
  taxaProformaUsd: number;
  valorProformaLiquidoUsd: number;
  statusProforma: 'A_RECEBER' | 'RECEBIDO';
  dataProforma: string | null; // YYYY-MM-DD

  // Parcela 2: Saldo Restante / Pagamento Final
  valorSaldoBrutoUsd: number;
  taxaSaldoUsd: number;
  valorSaldoLiquidoUsd: number;
  statusSaldo: 'A_RECEBER' | 'RECEBIDO';
  dataSaldo: string | null; // YYYY-MM-DD

  // Pagamento Único (quando temProforma é false)
  valorUnicoBrutoUsd: number;
  taxaUnicoUsd: number;
  valorUnicoLiquidoUsd: number;
  statusUnico: 'A_RECEBER' | 'RECEBIDO';
  dataUnico: string | null;

  // Totais consolidados da operação
  totalBrutoUsd: number;
  totalTaxasUsd: number;
  totalLiquidoUsd: number;

  // Status consolidado do fluxo
  statusGeral: 'A_RECEBER' | 'PROFORMA_RECEBIDA' | 'RECEBIDO';
}

export function limparNomeBanco(nome?: string | null): string {
  if (!nome) return 'Banco do Brasil';
  // Remove qualquer tag técnica [PROFORMA:...]
  const semTag = nome.replace(/\[PROFORMA:[^\]]+\]/g, '').trim();
  // Remove qualquer coisa após o hífen '-' conforme solicitado pelo usuário
  const semHifen = semTag.split('-')[0].trim();
  if (semHifen === 'BB BRASIL') return 'Banco do Brasil';
  if (semHifen === 'BB AMERICA') return 'BB América';
  return semHifen || 'Banco do Brasil';
}

export function parseRecebimentoProformaInfo(
  bancoDestinoRaw?: string | null,
  statusRecebimentoRaw?: string | null,
  dataRecebimentoRaw?: string | Date | null,
  valorTotalContratoUsd?: number
): DadosProformaRecebimento {
  const rawBanco = bancoDestinoRaw || 'BB BRASIL';
  const match = rawBanco.match(/\[PROFORMA:({.*?})\]/);

  const formatIsoDate = (d?: string | Date | null) => {
    if (!d) return null;
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toISOString().split('T')[0];
  };

  const defaultDataRecebimento = formatIsoDate(dataRecebimentoRaw);
  const totalContratoUsd = Number(valorTotalContratoUsd || 0);

  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      const rawBancoLimpo = rawBanco.replace(match[0], '').trim() || 'BB BRASIL';
      const bancoLimpo = limparNomeBanco(rawBancoLimpo);
      const temProforma = Boolean(parsed.temProforma);

      // Pro-forma
      const valorProformaBrutoUsd = Number(parsed.valorProformaBrutoUsd ?? parsed.valorProformaUsd ?? 0);
      const taxaProformaUsd = Number(parsed.taxaProformaUsd ?? 0);
      const valorProformaLiquidoUsd = Math.max(0, valorProformaBrutoUsd - taxaProformaUsd);
      const statusProforma = parsed.statusProforma === 'RECEBIDO' ? 'RECEBIDO' : 'A_RECEBER';
      const dataProforma = parsed.dataProforma || (statusProforma === 'RECEBIDO' ? defaultDataRecebimento : null);

      // Saldo
      const valorSaldoBrutoCalculado = Math.max(0, totalContratoUsd - valorProformaBrutoUsd);
      const valorSaldoBrutoUsd = Number(parsed.valorSaldoBrutoUsd || valorSaldoBrutoCalculado);
      const taxaSaldoUsd = Number(parsed.taxaSaldoUsd ?? 0);
      const valorSaldoLiquidoUsd = Math.max(0, valorSaldoBrutoUsd - taxaSaldoUsd);
      const statusSaldo = parsed.statusSaldo === 'RECEBIDO' ? 'RECEBIDO' : 'A_RECEBER';
      const dataSaldo = parsed.dataSaldo || (statusSaldo === 'RECEBIDO' ? defaultDataRecebimento : null);

      // Pagamento Único
      const valorUnicoBrutoUsd = Number(parsed.valorUnicoBrutoUsd || totalContratoUsd);
      const taxaUnicoUsd = Number(parsed.taxaUnicoUsd ?? 0);
      const valorUnicoLiquidoUsd = Math.max(0, valorUnicoBrutoUsd - taxaUnicoUsd);
      const statusUnico = (parsed.statusUnico === 'RECEBIDO' || statusRecebimentoRaw === 'RECEBIDO') ? 'RECEBIDO' : 'A_RECEBER';
      const dataUnico = parsed.dataUnico || (statusUnico === 'RECEBIDO' ? defaultDataRecebimento : null);

      let statusGeral: 'A_RECEBER' | 'PROFORMA_RECEBIDA' | 'RECEBIDO' = 'A_RECEBER';
      let totalBruto = 0;
      let totalTaxas = 0;
      let totalLiquido = 0;

      if (temProforma) {
        totalBruto = valorProformaBrutoUsd + valorSaldoBrutoUsd;
        totalTaxas = taxaProformaUsd + taxaSaldoUsd;
        totalLiquido = valorProformaLiquidoUsd + valorSaldoLiquidoUsd;

        if (statusProforma === 'RECEBIDO' && statusSaldo === 'RECEBIDO') {
          statusGeral = 'RECEBIDO';
        } else if (statusProforma === 'RECEBIDO') {
          statusGeral = 'PROFORMA_RECEBIDA';
        } else {
          statusGeral = 'A_RECEBER';
        }
      } else {
        totalBruto = valorUnicoBrutoUsd;
        totalTaxas = taxaUnicoUsd;
        totalLiquido = valorUnicoLiquidoUsd;
        statusGeral = statusUnico;
      }

      return {
        temProforma,
        bancoLimpo,
        valorProformaBrutoUsd,
        taxaProformaUsd,
        valorProformaLiquidoUsd,
        statusProforma,
        dataProforma,
        valorSaldoBrutoUsd,
        taxaSaldoUsd,
        valorSaldoLiquidoUsd,
        statusSaldo,
        dataSaldo,
        valorUnicoBrutoUsd,
        taxaUnicoUsd,
        valorUnicoLiquidoUsd,
        statusUnico,
        dataUnico,
        totalBrutoUsd: totalBruto,
        totalTaxasUsd: totalTaxas,
        totalLiquidoUsd: totalLiquido,
        statusGeral,
      };
    } catch (err) {
      console.warn('Erro ao decodificar tag [PROFORMA]:', err);
    }
  }

  // Padrão inicial sem tag
  const bancoLimpo = limparNomeBanco(rawBanco);
  const statusGeral = statusRecebimentoRaw === 'RECEBIDO' ? 'RECEBIDO' : 'A_RECEBER';

  return {
    temProforma: false,
    bancoLimpo,
    valorProformaBrutoUsd: 0,
    taxaProformaUsd: 0,
    valorProformaLiquidoUsd: 0,
    statusProforma: 'A_RECEBER',
    dataProforma: null,
    valorSaldoBrutoUsd: totalContratoUsd,
    taxaSaldoUsd: 0,
    valorSaldoLiquidoUsd: totalContratoUsd,
    statusSaldo: statusGeral,
    dataSaldo: defaultDataRecebimento,
    valorUnicoBrutoUsd: totalContratoUsd,
    taxaUnicoUsd: 0,
    valorUnicoLiquidoUsd: totalContratoUsd,
    statusUnico: statusGeral,
    dataUnico: defaultDataRecebimento,
    totalBrutoUsd: totalContratoUsd,
    totalTaxasUsd: 0,
    totalLiquidoUsd: totalContratoUsd,
    statusGeral,
  };
}

export function formatBancoDestinoWithProforma(
  bancoBase: string,
  config: {
    temProforma: boolean;
    // Pro-forma
    valorProformaBrutoUsd?: number;
    taxaProformaUsd?: number;
    statusProforma?: 'A_RECEBER' | 'RECEBIDO';
    dataProforma?: string | null;
    // Saldo
    valorSaldoBrutoUsd?: number;
    taxaSaldoUsd?: number;
    statusSaldo?: 'A_RECEBER' | 'RECEBIDO';
    dataSaldo?: string | null;
    // Pagamento Único
    valorUnicoBrutoUsd?: number;
    taxaUnicoUsd?: number;
    statusUnico?: 'A_RECEBER' | 'RECEBIDO';
    dataUnico?: string | null;
  }
): string {
  const base = (bancoBase || 'BB BRASIL').replace(/\[PROFORMA:[^\]]+\]/g, '').trim() || 'BB BRASIL';

  const payload = {
    temProforma: Boolean(config.temProforma),
    // Pro-forma
    valorProformaBrutoUsd: Number(config.valorProformaBrutoUsd || 0),
    taxaProformaUsd: Number(config.taxaProformaUsd || 0),
    statusProforma: config.statusProforma || 'A_RECEBER',
    dataProforma: config.dataProforma || null,
    // Saldo
    valorSaldoBrutoUsd: Number(config.valorSaldoBrutoUsd || 0),
    taxaSaldoUsd: Number(config.taxaSaldoUsd || 0),
    statusSaldo: config.statusSaldo || 'A_RECEBER',
    dataSaldo: config.dataSaldo || null,
    // Único
    valorUnicoBrutoUsd: Number(config.valorUnicoBrutoUsd || 0),
    taxaUnicoUsd: Number(config.taxaUnicoUsd || 0),
    statusUnico: config.statusUnico || 'A_RECEBER',
    dataUnico: config.dataUnico || null,
  };

  return `${base} [PROFORMA:${JSON.stringify(payload)}]`;
}
