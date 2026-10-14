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

export function parseCompradorInfo(complementoBuyerRaw?: string | null): {
  complementoLimpo: string;
  comprador: DadosComprador;
} {
  const raw = complementoBuyerRaw || '';
  // Utiliza [\s\S]*? para aceitar qualquer caractere inclusive eventuais quebras de linha
  const match = raw.match(/\[COMPRADOR:(\{[\s\S]*?\})\]/);

  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      const complementoLimpo = raw.replace(match[0], '').trim();
      return {
        complementoLimpo,
        comprador: {
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
        },
      };
    } catch (err) {
      console.warn('Erro ao decodificar tag [COMPRADOR]:', err);
    }
  }

  return {
    complementoLimpo: raw,
    comprador: {
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
    },
  };
}

export function formatComplementoWithComprador(
  complementoBase: string,
  comprador: DadosComprador
): string {
  // Limpa preventivamente qualquer tag [COMPRADOR:...] existente na string base
  const { complementoLimpo } = parseCompradorInfo(complementoBase);
  const base = (complementoLimpo || '').trim();

  if (!comprador.diferente) {
    return base;
  }

  const payload: DadosComprador = {
    diferente: true,
    nome: comprador.nome?.trim() || '',
    endereco: comprador.endereco?.trim() || '',
    complemento: comprador.complemento?.trim() || '',
    cidade: comprador.cidade?.trim() || '',
    pais: comprador.pais?.trim() || '',
    taxId: comprador.taxId?.trim() || '',
    email: comprador.email?.trim() || '',
    telefone: comprador.telefone?.trim() || '',
    importadorNome: comprador.importadorNome?.trim() || '',
  };

  const tag = `[COMPRADOR:${JSON.stringify(payload)}]`;
  return base ? `${base} ${tag}` : tag;
}
