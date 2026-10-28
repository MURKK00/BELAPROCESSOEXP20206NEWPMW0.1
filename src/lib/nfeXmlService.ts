/**
 * Serviço especializado no processamento, extração e validação de arquivos XML de NF-e (Nota Fiscal Eletrônica).
 * Focado na extração precisa da Chave de Acesso de 44 dígitos, Valor Total da Nota,
 * CNPJ/Razão Social do Fornecedor (Emitente) e Data de Emissão para alimentação
 * e pré-visualização na tabela da aba Notas Fiscais.
 * 
 * Funciona de forma isomórfica (tanto no navegador quanto em runtime Node.js/Next.js).
 */

export interface DadosNFeExtraidos {
  /** Nome original do arquivo XML importado */
  nomeArquivo: string;
  /** Chave de acesso única da SEFAZ com 44 dígitos numéricos */
  chaveAcesso: string;
  /** Chave de acesso formatada em grupos de 4 dígitos para fácil leitura */
  chaveAcessoFormatada: string;
  /** Número da Nota Fiscal (ex: 12345) */
  numero: string;
  /** Série da Nota Fiscal (ex: 1) */
  serie: string;
  /** Data de emissão no formato ISO (YYYY-MM-DD) para persistência em banco */
  dataEmissao: string;
  /** Data de emissão formatada no padrão brasileiro (DD/MM/YYYY) para exibição na tabela */
  dataEmissaoFormatada: string;
  /** Data e hora exata da emissão se informada no XML */
  dataHoraEmissaoCompleta?: string;
  /** Valor total da NF em formato numérico (ex: 154200.50) */
  valorTotal: number;
  /** Valor total da NF formatado em moeda brasileira (ex: R$ 154.200,50) */
  valorTotalFormatado: string;
  /** Razão social ou nome do fornecedor/emitente */
  fornecedorNome: string;
  /** CNPJ ou CPF do fornecedor com máscara (ex: 12.345.678/0001-90) */
  fornecedorCnpj: string;
  /** CNPJ ou CPF do fornecedor apenas com dígitos (14 ou 11 caracteres) */
  fornecedorCnpjLimpo: string;
  /** Nome fantasia do fornecedor se houver */
  fornecedorFantasia?: string;
  /** UF do fornecedor */
  fornecedorUf?: string;
  /** Razão social do destinatário */
  destinatarioNome: string;
  /** CNPJ/CPF do destinatário formatado */
  destinatarioCnpj: string;
  /** CFOP principal identificado na operação (ex: 5.901, 7.101) */
  cfop: string;
  /** Natureza da operação (ex: Remessa para Industrialização, Exportação) */
  naturezaOperacao: string;
  /** Peso líquido total em kg */
  pesoLiquido: number;
  /** Peso bruto total em kg */
  pesoBruto: number;
  /** Quantidade de sacas / volumes transportados */
  quantidadeVolumes: number;
  /** Descrição do principal produto ou resumo de itens */
  produtoDescricao: string;
  /** Informações complementares de interesse do contribuinte */
  observacoes: string;
  /** Conteúdo raw do XML para arquivo/armazenamento */
  xmlRaw: string;
  /** Indicador de validade dos campos críticos para pré-visualização e gravação */
  valida: boolean;
  /** Mensagens ou alertas de validação (ex: campos ausentes ou divergentes) */
  alertas: string[];
}

export interface ResumoLoteNFe {
  totalArquivos: number;
  totalValidas: number;
  totalInvalidas: number;
  pesoLiquidoTotalKg: number;
  valorTotalGeral: number;
  valorTotalGeralFormatado: string;
  itens: DadosNFeExtraidos[];
}

/**
 * Utilitário de formatação de CNPJ ou CPF
 */
export function formatarCnpjOuCpf(documento: string | null | undefined): string {
  if (!documento) return '';
  const limpo = documento.replace(/\D/g, '');
  if (limpo.length === 14) {
    return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  if (limpo.length === 11) {
    return limpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  return limpo;
}

/**
 * Utilitário de formatação de Chave de Acesso de 44 dígitos
 */
export function formatarChaveAcesso(chave: string | null | undefined): string {
  if (!chave) return '';
  const limpa = chave.replace(/\D/g, '');
  if (limpa.length !== 44) return limpa;
  return limpa.replace(/(\d{4})/g, '$1 ').trim();
}

/**
 * Utilitário de formatação monetária BRL
 */
export function formatarMoedaBRL(valor: number): string {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Utilitário de formatação de data para o padrão DD/MM/YYYY
 */
export function formatarDataBR(dataIsoOuDate: string | Date | null | undefined): string {
  if (!dataIsoOuDate) return '—';
  try {
    const d = typeof dataIsoOuDate === 'string' ? new Date(dataIsoOuDate) : dataIsoOuDate;
    if (isNaN(d.getTime())) return String(dataIsoOuDate);
    // Se for string YYYY-MM-DD sem fuso, faz split para evitar deslocamento UTC
    if (typeof dataIsoOuDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dataIsoOuDate)) {
      const [ano, mes, dia] = dataIsoOuDate.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    return d.toLocaleDateString('pt-BR');
  } catch {
    return String(dataIsoOuDate);
  }
}

/**
 * Validação do dígito verificador da Chave de Acesso da NF-e (módulo 11)
 */
export function validarChaveAcessoNFe(chave: string): boolean {
  const limpa = chave.replace(/\D/g, '');
  if (limpa.length !== 44) return false;

  const base = limpa.substring(0, 43);
  const dvInformado = parseInt(limpa.substring(43), 10);

  let soma = 0;
  let peso = 2;
  for (let i = base.length - 1; i >= 0; i--) {
    soma += parseInt(base[i], 10) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }

  const resto = soma % 11;
  const dvCalculado = resto === 0 || resto === 1 ? 0 : 11 - resto;

  return dvCalculado === dvInformado;
}

/**
 * Extrai texto de tag XML com suporte nativo a DOMParser (browser) e fallback regex (Node/Edge)
 */
function extrairTagXml(xmlText: string, doc: Document | null, tagName: string, parentElement?: Element | null): string {
  if (doc) {
    const root = parentElement || doc;
    // Tenta busca direta por tagName ignorando namespace
    let el = root.getElementsByTagName(tagName)[0];
    if (!el && root.getElementsByTagNameNS) {
      el = root.getElementsByTagNameNS('*', tagName)[0];
    }
    if (el && el.textContent) {
      return el.textContent.trim();
    }
  }

  // Fallback regex (suporta tags com atributos e namespaces como <nfe:tag>)
  const escapedTag = tagName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${escapedTag}(?:\\s[^>]*)?>([^<]+)<\\/(?:[a-zA-Z0-9_]+:)?${escapedTag}>`, 'i');
  const match = xmlText.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Função principal do serviço: processa o conteúdo de um arquivo XML de NF-e
 * e devolve os dados estruturados focando em Chave, Valor, CNPJ do Fornecedor e Data de Emissão.
 */
export function processarXmlNFe(xmlText: string, nomeArquivo: string = 'nfe.xml'): DadosNFeExtraidos {
  const alertas: string[] = [];

  try {
    let doc: Document | null = null;
    if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        doc = parser.parseFromString(xmlText, 'text/xml');
      } catch {
        doc = null;
      }
    }

    // 1. Extração da CHAVE DE ACESSO (44 dígitos)
    let chave = extrairTagXml(xmlText, doc, 'chNFe');
    if (!chave) {
      // Extração pelo atributo Id da tag <infNFe Id="NFe3526...">
      const infNFeMatch = xmlText.match(/<infNFe[^>]*Id=["']NFe(\d{44})["']/i) ||
                          xmlText.match(/Id=["']NFe(\d{44})["']/i);
      if (infNFeMatch) {
        chave = infNFeMatch[1];
      }
    }
    const chaveLimpa = chave.replace(/\D/g, '');
    if (!chaveLimpa) {
      alertas.push('Chave de acesso de 44 dígitos não encontrada no XML.');
    } else if (chaveLimpa.length !== 44) {
      alertas.push(`Chave de acesso incompleta (${chaveLimpa.length} dígitos em vez de 44).`);
    }

    // 2. Extração dos DADOS DA NOTA (Número, Série, Emissão)
    const numero = extrairTagXml(xmlText, doc, 'nNF') || '0';
    const serie = extrairTagXml(xmlText, doc, 'serie') || '1';

    // Data de Emissão (<dhEmi> padrão v3.10/v4.00 ou <dEmi> legado v2.00)
    let dataEmissaoRaw = extrairTagXml(xmlText, doc, 'dhEmi') || extrairTagXml(xmlText, doc, 'dEmi') || '';
    let dataEmissao = new Date().toISOString().split('T')[0];
    let dataHoraEmissaoCompleta = dataEmissaoRaw || undefined;

    if (dataEmissaoRaw) {
      try {
        // Suporta formatos: 2026-10-28T14:30:00-03:00 ou 2026-10-28
        const datePart = dataEmissaoRaw.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          dataEmissao = datePart;
        } else {
          const parsedDate = new Date(dataEmissaoRaw);
          if (!isNaN(parsedDate.getTime())) {
            dataEmissao = parsedDate.toISOString().split('T')[0];
          }
        }
      } catch {
        alertas.push('Data de emissão em formato não reconhecido; utilizando data de hoje.');
      }
    } else {
      alertas.push('Tag de data de emissão (<dhEmi>/<dEmi>) não encontrada.');
    }

    // 3. Extração do FORNECEDOR / EMITENTE (CNPJ, Razão Social, Fantasia, UF)
    let emitParent: Element | null = null;
    if (doc) {
      emitParent = doc.getElementsByTagName('emit')[0] || 
                   (doc.getElementsByTagNameNS ? doc.getElementsByTagNameNS('*', 'emit')[0] : null);
    }

    const fornecedorNome = extrairTagXml(xmlText, doc, 'xNome', emitParent) || 'Fornecedor não informado';
    const fornecedorFantasia = extrairTagXml(xmlText, doc, 'xFant', emitParent) || undefined;
    const fornecedorUf = extrairTagXml(xmlText, doc, 'UF', emitParent) || undefined;
    const fornecedorCnpjBruto = extrairTagXml(xmlText, doc, 'CNPJ', emitParent) || 
                                extrairTagXml(xmlText, doc, 'CPF', emitParent) || '';
    const fornecedorCnpjLimpo = fornecedorCnpjBruto.replace(/\D/g, '');
    const fornecedorCnpjFormatado = formatarCnpjOuCpf(fornecedorCnpjLimpo);

    if (!fornecedorCnpjLimpo) {
      alertas.push('CNPJ/CPF do fornecedor (emitente) não localizado no XML.');
    }

    // 4. Extração do DESTINATÁRIO
    let destParent: Element | null = null;
    if (doc) {
      destParent = doc.getElementsByTagName('dest')[0] || 
                   (doc.getElementsByTagNameNS ? doc.getElementsByTagNameNS('*', 'dest')[0] : null);
    }
    const destinatarioNome = extrairTagXml(xmlText, doc, 'xNome', destParent) || 'Destinatário não informado';
    const destCnpjBruto = extrairTagXml(xmlText, doc, 'CNPJ', destParent) || 
                          extrairTagXml(xmlText, doc, 'CPF', destParent) || '';
    const destinatarioCnpj = formatarCnpjOuCpf(destCnpjBruto);

    // 5. CFOP e Natureza da Operação
    const cfop = extrairTagXml(xmlText, doc, 'CFOP') || '5.901';
    const naturezaOperacao = extrairTagXml(xmlText, doc, 'natOp') || 'Operação Fiscal';

    // 6. VALOR TOTAL DA NOTA (<vNF> dentro de <ICMSTot> / <total>)
    let totalParent: Element | null = null;
    if (doc) {
      totalParent = doc.getElementsByTagName('ICMSTot')[0] || 
                    doc.getElementsByTagName('total')[0] ||
                    (doc.getElementsByTagNameNS ? doc.getElementsByTagNameNS('*', 'ICMSTot')[0] : null);
    }
    const vNFStr = extrairTagXml(xmlText, doc, 'vNF', totalParent) || extrairTagXml(xmlText, doc, 'vNF');
    let valorTotal = vNFStr ? parseFloat(vNFStr.replace(',', '.')) : 0;
    if (isNaN(valorTotal)) valorTotal = 0;

    if (valorTotal <= 0) {
      // Tentar somar valor dos produtos <vProd> caso vNF esteja zerado
      const vProdStr = extrairTagXml(xmlText, doc, 'vProd', totalParent) || extrairTagXml(xmlText, doc, 'vProd');
      if (vProdStr) {
        const vProdParsed = parseFloat(vProdStr.replace(',', '.'));
        if (!isNaN(vProdParsed) && vProdParsed > 0) {
          valorTotal = vProdParsed;
        }
      }
    }

    if (valorTotal <= 0) {
      alertas.push('Valor total da NF (<vNF>) zerado ou não identificado.');
    }

    // 7. PESOS E VOLUMES (<transp><vol>)
    let transpParent: Element | null = null;
    if (doc) {
      transpParent = doc.getElementsByTagName('transp')[0] || 
                     (doc.getElementsByTagNameNS ? doc.getElementsByTagNameNS('*', 'transp')[0] : null);
    }
    const pesoLiquidoStr = extrairTagXml(xmlText, doc, 'pesoL', transpParent) || extrairTagXml(xmlText, doc, 'pesoL');
    const pesoBrutoStr = extrairTagXml(xmlText, doc, 'pesoB', transpParent) || extrairTagXml(xmlText, doc, 'pesoB');
    const qVolStr = extrairTagXml(xmlText, doc, 'qVol', transpParent) || extrairTagXml(xmlText, doc, 'qVol');

    let pesoLiquido = pesoLiquidoStr ? parseFloat(pesoLiquidoStr.replace(',', '.')) : 0;
    let pesoBruto = pesoBrutoStr ? parseFloat(pesoBrutoStr.replace(',', '.')) : 0;
    const quantidadeVolumes = qVolStr ? parseInt(qVolStr, 10) : 0;

    // Se peso líquido estiver zerado em transporte, tenta puxar da quantidade comercial do item (<qCom>)
    if (pesoLiquido <= 0) {
      const qComStr = extrairTagXml(xmlText, doc, 'qCom');
      if (qComStr) {
        const qComParsed = parseFloat(qComStr.replace(',', '.'));
        if (!isNaN(qComParsed) && qComParsed > 0) {
          pesoLiquido = qComParsed;
        }
      }
    }
    if (pesoBruto <= 0 && pesoLiquido > 0) {
      pesoBruto = pesoLiquido;
    }

    // 8. Produto e Observações
    const produtoDescricao = extrairTagXml(xmlText, doc, 'xProd') || 'Grãos / Cereais';
    const observacoes = extrairTagXml(xmlText, doc, 'infCpl') || '';

    // Validação geral para pré-visualização e gravação
    const valida = numero !== '0' && numero !== '' && (pesoLiquido > 0 || valorTotal > 0);

    return {
      nomeArquivo,
      chaveAcesso: chaveLimpa,
      chaveAcessoFormatada: formatarChaveAcesso(chaveLimpa),
      numero,
      serie,
      dataEmissao,
      dataEmissaoFormatada: formatarDataBR(dataEmissao),
      dataHoraEmissaoCompleta,
      valorTotal,
      valorTotalFormatado: formatarMoedaBRL(valorTotal),
      fornecedorNome,
      fornecedorCnpj: fornecedorCnpjFormatado,
      fornecedorCnpjLimpo,
      fornecedorFantasia,
      fornecedorUf,
      destinatarioNome,
      destinatarioCnpj,
      cfop,
      naturezaOperacao,
      pesoLiquido,
      pesoBruto,
      quantidadeVolumes,
      produtoDescricao,
      observacoes,
      xmlRaw: xmlText,
      valida,
      alertas,
    };
  } catch (erro: any) {
    return {
      nomeArquivo,
      chaveAcesso: '',
      chaveAcessoFormatada: '',
      numero: '0',
      serie: '1',
      dataEmissao: new Date().toISOString().split('T')[0],
      dataEmissaoFormatada: formatarDataBR(new Date()),
      valorTotal: 0,
      valorTotalFormatado: 'R$ 0,00',
      fornecedorNome: 'Erro ao analisar arquivo XML',
      fornecedorCnpj: '',
      fornecedorCnpjLimpo: '',
      destinatarioNome: '',
      destinatarioCnpj: '',
      cfop: '',
      naturezaOperacao: '',
      pesoLiquido: 0,
      pesoBruto: 0,
      quantidadeVolumes: 0,
      produtoDescricao: '',
      observacoes: '',
      xmlRaw: xmlText,
      valida: false,
      alertas: [`Falha na leitura da estrutura XML: ${erro.message || 'Arquivo corrompido'}`],
    };
  }
}

/**
 * Lê e processa um objeto File diretamente no navegador
 */
export async function processarArquivoXml(file: File): Promise<DadosNFeExtraidos> {
  const texto = await file.text();
  return processarXmlNFe(texto, file.name);
}

/**
 * Processa múltiplos arquivos XML de uma só vez (lote) e calcula totais consolidados
 */
export async function processarLoteArquivosXml(files: FileList | File[]): Promise<ResumoLoteNFe> {
  const itens: DadosNFeExtraidos[] = [];
  const listaArquivos = Array.from(files);

  for (const file of listaArquivos) {
    if (!file.name.toLowerCase().endsWith('.xml')) continue;
    try {
      const parsed = await processarArquivoXml(file);
      itens.push(parsed);
    } catch (err: any) {
      itens.push({
        nomeArquivo: file.name,
        chaveAcesso: '',
        chaveAcessoFormatada: '',
        numero: '0',
        serie: '1',
        dataEmissao: new Date().toISOString().split('T')[0],
        dataEmissaoFormatada: formatarDataBR(new Date()),
        valorTotal: 0,
        valorTotalFormatado: 'R$ 0,00',
        fornecedorNome: 'Falha na leitura do arquivo',
        fornecedorCnpj: '',
        fornecedorCnpjLimpo: '',
        destinatarioNome: '',
        destinatarioCnpj: '',
        cfop: '',
        naturezaOperacao: '',
        pesoLiquido: 0,
        pesoBruto: 0,
        quantidadeVolumes: 0,
        produtoDescricao: '',
        observacoes: '',
        xmlRaw: '',
        valida: false,
        alertas: [err.message || 'Erro inesperado ao carregar arquivo'],
      });
    }
  }

  const validas = itens.filter((it) => it.valida);
  const pesoLiquidoTotalKg = validas.reduce((acc, it) => acc + (it.pesoLiquido || 0), 0);
  const valorTotalGeral = validas.reduce((acc, it) => acc + (it.valorTotal || 0), 0);

  return {
    totalArquivos: itens.length,
    totalValidas: validas.length,
    totalInvalidas: itens.length - validas.length,
    pesoLiquidoTotalKg,
    valorTotalGeral,
    valorTotalGeralFormatado: formatarMoedaBRL(valorTotalGeral),
    itens,
  };
}

/**
 * Objeto singleton do serviço para consumo orientado a métodos
 */
export const NFeXmlService = {
  processarXml: processarXmlNFe,
  processarArquivo: processarArquivoXml,
  processarLote: processarLoteArquivosXml,
  validarChave: validarChaveAcessoNFe,
  formatarCnpj: formatarCnpjOuCpf,
  formatarChave: formatarChaveAcesso,
  formatarMoeda: formatarMoedaBRL,
  formatarData: formatarDataBR,
};
