export interface DadosComprador {
  diferente: boolean;
  // Dados do Comprador (quando diferente do Importador)
  nome?: string;
  endereco?: string;
  complemento?: string;
  cidade?: string;
  pais?: string;
  taxId?: string;
  email?: string;
  telefone?: string;
  // Nome personalizado do Importador (se diferente de clienteFinal)
  importadorNome?: string;
}

export interface DadosBancoComprador {
  nomeBanco?: string;
  enderecoBanco?: string;
  conta?: string;
  swift?: string;
  telefone?: string;
  email?: string;
  // Regras de cobrança para Carta Borderô & CAD
  temProforma?: boolean;
  diasLiquidacao?: number; // Padrão: 20 sem pro-forma, 10 com pro-forma
  multaAtrasoPerc?: number; // Padrão: 5%
  adiantamentoPerc?: number; // Padrão: 10%
}

export function parseCompradorInfo(complementoBuyerRaw?: string | null): {
  complementoLimpo: string;
  comprador: DadosComprador;
  bancoComprador: DadosBancoComprador;
} {
  let raw = complementoBuyerRaw || '';
  
  // 1. Extração de [COMPRADOR:{...}]
  let comprador: DadosComprador = {
    diferente: false,
    nome: '',
    endereco: '',
    complemento: '',
    cidade: '',
    pais: '',
    taxId: '',
    email: '',
    telefone: '',
    importadorNome: '',
  };

  const matchComprador = raw.match(/\[COMPRADOR:(\{[\s\S]*?\})\]/);
  if (matchComprador) {
    try {
      const parsed = JSON.parse(matchComprador[1]);
      raw = raw.replace(matchComprador[0], '').trim();
      comprador = {
        diferente: Boolean(parsed.diferente),
        nome: parsed.nome || '',
        endereco: parsed.endereco || '',
        complemento: parsed.complemento || '',
        cidade: parsed.cidade || '',
        pais: parsed.pais || '',
        taxId: parsed.taxId || '',
        email: parsed.email || '',
        telefone: parsed.telefone || '',
        importadorNome: parsed.importadorNome || '',
      };
    } catch (err) {
      console.warn('Erro ao decodificar tag [COMPRADOR]:', err);
    }
  }

  // 2. Extração de [BANCO_COMPRADOR:{...}]
  let bancoComprador: DadosBancoComprador = {
    nomeBanco: '',
    enderecoBanco: '',
    conta: '',
    swift: '',
    telefone: '',
    email: '',
    temProforma: false,
    diasLiquidacao: 20,
    multaAtrasoPerc: 5,
    adiantamentoPerc: 10,
  };

  const matchBanco = raw.match(/\[BANCO_COMPRADOR:(\{[\s\S]*?\})\]/);
  if (matchBanco) {
    try {
      const parsedBanco = JSON.parse(matchBanco[1]);
      raw = raw.replace(matchBanco[0], '').trim();
      const temProforma = Boolean(parsedBanco.temProforma);
      bancoComprador = {
        nomeBanco: parsedBanco.nomeBanco || '',
        enderecoBanco: parsedBanco.enderecoBanco || '',
        conta: parsedBanco.conta || '',
        swift: parsedBanco.swift || '',
        telefone: parsedBanco.telefone || '',
        email: parsedBanco.email || '',
        temProforma,
        diasLiquidacao: parsedBanco.diasLiquidacao !== undefined ? Number(parsedBanco.diasLiquidacao) : (temProforma ? 10 : 20),
        multaAtrasoPerc: parsedBanco.multaAtrasoPerc !== undefined ? Number(parsedBanco.multaAtrasoPerc) : 5,
        adiantamentoPerc: parsedBanco.adiantamentoPerc !== undefined ? Number(parsedBanco.adiantamentoPerc) : 10,
      };
    } catch (err) {
      console.warn('Erro ao decodificar tag [BANCO_COMPRADOR]:', err);
    }
  }

  return {
    complementoLimpo: raw,
    comprador,
    bancoComprador,
  };
}

export function formatComplementoWithComprador(
  complementoBase: string,
  comprador?: DadosComprador,
  bancoComprador?: DadosBancoComprador
): string {
  // Limpa preventivamente tags existentes na string base
  const { complementoLimpo, comprador: compradorExistente, bancoComprador: bancoExistente } = parseCompradorInfo(complementoBase);
  let base = (complementoLimpo || '').trim();

  const cFinal = comprador || compradorExistente;
  const bFinal = bancoComprador || bancoExistente;

  const tags: string[] = [];

  if (cFinal && cFinal.diferente) {
    const payload: DadosComprador = {
      diferente: true,
      nome: cFinal.nome?.trim() || '',
      endereco: cFinal.endereco?.trim() || '',
      complemento: cFinal.complemento?.trim() || '',
      cidade: cFinal.cidade?.trim() || '',
      pais: cFinal.pais?.trim() || '',
      taxId: cFinal.taxId?.trim() || '',
      email: cFinal.email?.trim() || '',
      telefone: cFinal.telefone?.trim() || '',
      importadorNome: cFinal.importadorNome?.trim() || '',
    };
    tags.push(`[COMPRADOR:${JSON.stringify(payload)}]`);
  }

  if (bFinal && (bFinal.nomeBanco || bFinal.conta || bFinal.swift || bFinal.enderecoBanco || bFinal.temProforma !== undefined)) {
    const payloadBanco: DadosBancoComprador = {
      nomeBanco: bFinal.nomeBanco?.trim() || '',
      enderecoBanco: bFinal.enderecoBanco?.trim() || '',
      conta: bFinal.conta?.trim() || '',
      swift: bFinal.swift?.trim() || '',
      telefone: bFinal.telefone?.trim() || '',
      email: bFinal.email?.trim() || '',
      temProforma: Boolean(bFinal.temProforma),
      diasLiquidacao: Number(bFinal.diasLiquidacao) || (bFinal.temProforma ? 10 : 20),
      multaAtrasoPerc: Number(bFinal.multaAtrasoPerc) || 5,
      adiantamentoPerc: Number(bFinal.adiantamentoPerc) || 10,
    };
    tags.push(`[BANCO_COMPRADOR:${JSON.stringify(payloadBanco)}]`);
  }

  if (tags.length === 0) {
    return base;
  }

  return base ? `${base} ${tags.join(' ')}` : tags.join(' ');
}
