/**
 * Parser resiliente de XML de NF-e (Nota Fiscal Eletrônica - Padrão Nacional SEFAZ)
 * Suporta XMLs diretos da SEFAZ (<nfeProc> ou <NFe>) tanto no navegador quanto no Node.js.
 * Utiliza o NFeXmlService para extração focada em Chave de Acesso, Valor, CNPJ do Fornecedor e Data de Emissão.
 */

import {
  processarXmlNFe,
  DadosNFeExtraidos,
  formatarCnpjOuCpf,
  formatarMoedaBRL,
  formatarDataBR,
  formatarChaveAcesso,
  validarChaveAcessoNFe,
} from './nfeXmlService';

export interface ParsedNFeData {
  nomeArquivo: string;
  chaveAcesso: string;
  chaveAcessoFormatada?: string;
  numero: string;
  serie: string;
  dataEmissao: string;
  dataEmissaoFormatada?: string;
  emitente: string;
  emitenteCnpj: string;
  destinatario: string;
  destinatarioCnpj: string;
  cfop: string;
  pesoLiquido: number;
  pesoBruto: number;
  quantidadeSacas: number;
  valorTotal: number;
  valorTotalFormatado?: string;
  produtoDescricao: string;
  observacoes: string;
  xmlRaw: string;
  valida: boolean;
  mensagemValidacao?: string;
  alertas?: string[];
  // Para sugestão automática na Etapa 2
  sugestaoNotaEntradaId?: string;
}

export function parseNFeXml(xmlText: string, nomeArquivo: string): ParsedNFeData {
  const dados = processarXmlNFe(xmlText, nomeArquivo);

  return {
    nomeArquivo: dados.nomeArquivo,
    chaveAcesso: dados.chaveAcesso,
    chaveAcessoFormatada: dados.chaveAcessoFormatada,
    numero: dados.numero,
    serie: dados.serie,
    dataEmissao: dados.dataEmissao,
    dataEmissaoFormatada: dados.dataEmissaoFormatada,
    emitente: dados.fornecedorNome,
    emitenteCnpj: dados.fornecedorCnpj,
    destinatario: dados.destinatarioNome,
    destinatarioCnpj: dados.destinatarioCnpj,
    cfop: dados.cfop,
    pesoLiquido: dados.pesoLiquido,
    pesoBruto: dados.pesoBruto,
    quantidadeSacas: dados.quantidadeVolumes,
    valorTotal: dados.valorTotal,
    valorTotalFormatado: dados.valorTotalFormatado,
    produtoDescricao: dados.produtoDescricao,
    observacoes: dados.observacoes,
    xmlRaw: dados.xmlRaw,
    valida: dados.valida,
    mensagemValidacao: dados.alertas.length > 0 ? dados.alertas.join('; ') : undefined,
    alertas: dados.alertas,
  };
}

export {
  formatarCnpjOuCpf,
  formatarMoedaBRL,
  formatarDataBR,
  formatarChaveAcesso,
  validarChaveAcessoNFe,
};
export type { DadosNFeExtraidos };
