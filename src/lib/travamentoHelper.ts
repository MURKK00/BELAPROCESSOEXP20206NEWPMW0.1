export interface ParsedTravamento {
  taxa: number;
  moedaTaxa: 'USD' | 'BRL';
  valorLiquido: number;
  observacaoLimpa: string;
}

export function formatObservacaoWithTaxa(
  observacao: string | null | undefined,
  taxa: number,
  moedaTaxa: 'USD' | 'BRL',
  valorLiquido: number
): string {
  const baseObs = (observacao || '').trim();
  if (taxa <= 0) return baseObs;
  const tag = `[TAXA:${taxa}:${moedaTaxa}:${valorLiquido.toFixed(2)}]`;
  return baseObs ? `${tag} ${baseObs}` : tag;
}

export function parseTravamentoInfo(t: {
  taxa?: any;
  moedaTaxa?: any;
  valorLiquido?: any;
  valorUsdParcial: any;
  ptax: any;
  observacao?: string | null;
}): ParsedTravamento {
  const usd = Number(t.valorUsdParcial?.toString?.() ?? t.valorUsdParcial ?? 0);
  const ptax = Number(t.ptax?.toString?.() ?? t.ptax ?? 0);
  const rawObs = t.observacao || '';

  // 1. Se os campos nativos do banco existirem e tiverem valor
  if (t.taxa !== null && t.taxa !== undefined && Number(t.taxa.toString()) > 0) {
    const taxa = Number(t.taxa.toString());
    const moedaTaxa = (t.moedaTaxa as 'USD' | 'BRL') || 'USD';
    const taxaEmBrl = moedaTaxa === 'USD' ? taxa * ptax : taxa;
    const valorLiquido = t.valorLiquido !== null && t.valorLiquido !== undefined
      ? Number(t.valorLiquido.toString())
      : (usd * ptax - taxaEmBrl);

    return {
      taxa,
      moedaTaxa,
      valorLiquido,
      observacaoLimpa: rawObs.replace(/\[TAXA:[^\]]+\]\s*/g, '').trim(),
    };
  }

  // 2. Fallback: Analisa tag [TAXA:valor:moeda:liquido] armazenada na observação
  const match = rawObs.match(/\[TAXA:([0-9.]+):([A-Z]+)(?::([0-9.]+))?\]/);
  if (match) {
    const taxa = Number(match[1]) || 0;
    const moedaTaxa = (match[2] as 'USD' | 'BRL') || 'USD';
    const taxaEmBrl = moedaTaxa === 'USD' ? taxa * ptax : taxa;
    const valorLiquido = match[3] ? Number(match[3]) : (usd * ptax - taxaEmBrl);
    const observacaoLimpa = rawObs.replace(match[0], '').trim();

    return {
      taxa,
      moedaTaxa,
      valorLiquido,
      observacaoLimpa,
    };
  }

  // 3. Padrão: sem taxa
  return {
    taxa: 0,
    moedaTaxa: 'USD',
    valorLiquido: usd * ptax,
    observacaoLimpa: rawObs,
  };
}
