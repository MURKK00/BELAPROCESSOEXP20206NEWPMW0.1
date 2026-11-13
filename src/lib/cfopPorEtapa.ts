/**
 * Configuração centralizada e facilmente editável de CFOPs permitidos por Etapa Fiscal.
 * Para adicionar novos CFOPs a qualquer etapa (inclusive Etapa 5 - Ajuste Fiscal),
 * basta incluir um item { codigo, descricao } na lista da etapa correspondente.
 */

export type EtapaNotaFiscalKey =
  | 'ETAPA_1_ENTRADA_INDUSTRIA'
  | 'ETAPA_2_RETORNO_ARMAZENAGEM'
  | 'ETAPA_3_REMESSA_REDEX'
  | 'ETAPA_4_EXPORTACAO'
  | 'ETAPA_5_AJUSTE_FISCAL';

export interface CfopOpcao {
  codigo: string;
  descricao: string;
}

export const ETAPAS_NOTA_FISCAL_VALIDAS: EtapaNotaFiscalKey[] = [
  'ETAPA_1_ENTRADA_INDUSTRIA',
  'ETAPA_2_RETORNO_ARMAZENAGEM',
  'ETAPA_3_REMESSA_REDEX',
  'ETAPA_4_EXPORTACAO',
  'ETAPA_5_AJUSTE_FISCAL',
];

export const ROTULOS_ETAPA_NF: Record<EtapaNotaFiscalKey, string> = {
  ETAPA_1_ENTRADA_INDUSTRIA: 'Etapa 1 - Entrada Indústria',
  ETAPA_2_RETORNO_ARMAZENAGEM: 'Etapa 2 - Retorno Armazenagem',
  ETAPA_3_REMESSA_REDEX: 'Etapa 3 - Formação Lote REDEX',
  ETAPA_4_EXPORTACAO: 'Etapa 4 - Exportação',
  ETAPA_5_AJUSTE_FISCAL: 'Etapa 5 - Ajuste Fiscal',
};

export const CFOPS_POR_ETAPA: Record<EtapaNotaFiscalKey, CfopOpcao[]> = {
  ETAPA_1_ENTRADA_INDUSTRIA: [
    { codigo: '1.901', descricao: 'Entrada para industrialização por encomenda' },
    { codigo: '1.905', descricao: 'Entrada de mercadoria para depósito em armazém/depósito' },
    { codigo: '5.901', descricao: 'Remessa para industrialização por encomenda' },
    { codigo: '5.902', descricao: 'Retorno de mercadoria utilizada na industrialização' },
    { codigo: '5.903', descricao: 'Retorno de mercadoria recebida e não aplicada no processo' },
  ],
  ETAPA_2_RETORNO_ARMAZENAGEM: [
    { codigo: '5.906', descricao: 'Retorno de mercadoria depositada em armazém geral / depósito' },
  ],
  ETAPA_3_REMESSA_REDEX: [
    { codigo: '6.505', descricao: 'Remessa para formação de lote de exportação (REDEX)' },
  ],
  ETAPA_4_EXPORTACAO: [
    { codigo: '7.504', descricao: 'Exportação de mercadoria objeto de formação de lote' },
  ],
  ETAPA_5_AJUSTE_FISCAL: [
    { codigo: '5.927', descricao: 'Baixa de estoque' },
    { codigo: '2.506', descricao: 'Devolução simbólica de lote de exportação' },
  ],
};

export function normalizarCfopDigitos(cfop?: string | null): string {
  if (!cfop) return '';
  return String(cfop).replace(/\D/g, '');
}

export function formatarCfop(cfop?: string | null): string {
  if (!cfop) return '';
  const trimmed = String(cfop).trim();
  if (!trimmed) return '';
  const digitos = normalizarCfopDigitos(trimmed);
  if (digitos.length === 4) {
    return `${digitos[0]}.${digitos.slice(1)}`;
  }
  return trimmed;
}

export function isEtapaNotaFiscalValida(etapa: string): etapa is EtapaNotaFiscalKey {
  return (ETAPAS_NOTA_FISCAL_VALIDAS as string[]).includes(etapa);
}

export function obterCfopsPermitidos(etapa: string): CfopOpcao[] {
  if (!isEtapaNotaFiscalValida(etapa)) return [];
  return CFOPS_POR_ETAPA[etapa] || [];
}

export function obterRotuloEtapa(etapa: string): string {
  if (isEtapaNotaFiscalValida(etapa)) {
    return ROTULOS_ETAPA_NF[etapa];
  }
  return etapa;
}

export interface ResultadoValidacaoCfop {
  valido: boolean;
  preenchido: boolean;
  cfopNormalizado: string;
  cfopFormatado: string;
  permitidos: CfopOpcao[];
  permitidosCodigos: string[];
  descricaoEncontrada?: string;
  motivo?: string;
}

export function validarCfopEtapa(
  etapa: string,
  cfop?: string | null
): ResultadoValidacaoCfop {
  const permitidos = obterCfopsPermitidos(etapa);
  const permitidosCodigos = permitidos.map((p) => p.codigo);
  const digitos = normalizarCfopDigitos(cfop);
  const formatado = formatarCfop(cfop);
  const rotuloEtapa = obterRotuloEtapa(etapa);

  if (!digitos) {
    return {
      valido: false,
      preenchido: false,
      cfopNormalizado: '',
      cfopFormatado: formatado,
      permitidos,
      permitidosCodigos,
      motivo:
        permitidosCodigos.length > 0
          ? `CFOP não informado. Para ${rotuloEtapa}, o padrão esperado é: ${permitidosCodigos.join(', ')}.`
          : 'CFOP não informado.',
    };
  }

  const match = permitidos.find((p) => normalizarCfopDigitos(p.codigo) === digitos);
  if (match) {
    return {
      valido: true,
      preenchido: true,
      cfopNormalizado: digitos,
      cfopFormatado: match.codigo,
      permitidos,
      permitidosCodigos,
      descricaoEncontrada: match.descricao,
    };
  }

  return {
    valido: false,
    preenchido: true,
    cfopNormalizado: digitos,
    cfopFormatado: formatado,
    permitidos,
    permitidosCodigos,
    motivo:
      permitidosCodigos.length > 0
        ? `CFOP ${formatado} não pertence ao padrão da ${rotuloEtapa} (esperado: ${permitidosCodigos.join(', ')}).`
        : `CFOP ${formatado} fora do padrão configurado.`,
  };
}
