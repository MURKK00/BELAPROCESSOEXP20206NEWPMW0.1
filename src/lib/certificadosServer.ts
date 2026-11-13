import { prisma } from '@/lib/prisma';
import { descriptografarSegredosCertificado } from '@/lib/certificadosCrypto';
import {
  classificarValidadeCertificado,
  FinalidadeCertificado,
  formatarDocumentoCertificado,
  normalizarDocumentoCertificado,
} from '@/lib/certificadosUtils';

if (typeof window !== 'undefined') {
  throw new Error('certificadosServer só pode ser importado no servidor.');
}

/**
 * Seleção explícita de campos públicos — garante que arquivoCriptografado,
 * senhaCriptografada, iv e authTag NUNCA sejam carregados para listagens ou APIs.
 */
export const CERT_PUBLIC_SELECT = {
  id: true,
  tipo: true,
  documento: true,
  titular: true,
  emissor: true,
  validadeInicio: true,
  validadeFim: true,
  finalidade: true,
  ativo: true,
  criadoPorId: true,
  criadoEm: true,
  atualizadoEm: true,
  criadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
} as const;

export interface CertificadoPublicoDTO {
  id: string;
  tipo: string;
  documento: string;
  documentoFormatado: string;
  titular: string;
  emissor: string;
  validadeInicio: string;
  validadeFim: string;
  finalidade: string;
  ativo: boolean;
  diasRestantes: number;
  vencido: boolean;
  alertaAmarelo: boolean;
  rotuloValidade: string;
  criadoPorId: string;
  criadoPorNome: string;
  criadoEm: string;
  atualizadoEm: string;
}

export function serializarCertificadoPublico(row: any): CertificadoPublicoDTO {
  const statusValidade = classificarValidadeCertificado(row.validadeFim);
  return {
    id: row.id,
    tipo: row.tipo,
    documento: row.documento,
    documentoFormatado: formatarDocumentoCertificado(row.documento, row.tipo),
    titular: row.titular,
    emissor: row.emissor,
    validadeInicio:
      row.validadeInicio instanceof Date
        ? row.validadeInicio.toISOString()
        : String(row.validadeInicio),
    validadeFim:
      row.validadeFim instanceof Date
        ? row.validadeFim.toISOString()
        : String(row.validadeFim),
    finalidade: row.finalidade,
    ativo: Boolean(row.ativo),
    diasRestantes: statusValidade.diasRestantes,
    vencido: statusValidade.vencido,
    alertaAmarelo: statusValidade.alertaAmarelo,
    rotuloValidade: statusValidade.rotulo,
    criadoPorId: row.criadoPorId,
    criadoPorNome: row.criadoPor?.nome || row.criadoPor?.email || 'Usuário',
    criadoEm:
      row.criadoEm instanceof Date ? row.criadoEm.toISOString() : String(row.criadoEm),
    atualizadoEm:
      row.atualizadoEm instanceof Date
        ? row.atualizadoEm.toISOString()
        : String(row.atualizadoEm),
  };
}

export interface CertificadoDescriptografadoParaUso {
  id: string;
  tipo: string;
  documento: string;
  titular: string;
  emissor: string;
  finalidade: string;
  validadeInicio: Date;
  validadeFim: Date;
  pfxBuffer: Buffer;
  senha: string;
}

/**
 * Uso exclusivo server-side para futuras integrações SEFAZ / Siscomex.
 * Recupera um certificado ativo e válido pelo CNPJ/CPF e descriptografa
 * o arquivo .pfx/.p12 e a senha apenas em memória.
 */
export async function obterCertificadoParaUso(
  documento: string,
  finalidade?: FinalidadeCertificado
): Promise<CertificadoDescriptografadoParaUso | null> {
  const docNormalizado = normalizarDocumentoCertificado(documento);
  if (!docNormalizado) return null;

  const agora = new Date();
  const finalidadesAceitas =
    finalidade && finalidade !== 'AMBOS' ? [finalidade, 'AMBOS'] : undefined;

  const candidatos = await prisma.certificadoDigital.findMany({
    where: {
      documento: docNormalizado,
      ativo: true,
      validadeFim: { gt: agora },
      ...(finalidadesAceitas ? { finalidade: { in: finalidadesAceitas } } : {}),
    },
    orderBy: [{ validadeFim: 'desc' }],
  });

  if (candidatos.length === 0) return null;

  // Se uma finalidade específica foi pedida, prioriza match exato antes de 'AMBOS'
  const selecionado =
    (finalidade && candidatos.find((c) => c.finalidade === finalidade)) ||
    candidatos[0];

  const { pfxBuffer, senha } = descriptografarSegredosCertificado({
    arquivoCriptografado: selecionado.arquivoCriptografado,
    senhaCriptografada: selecionado.senhaCriptografada,
    iv: selecionado.iv,
    authTag: selecionado.authTag,
  });

  return {
    id: selecionado.id,
    tipo: selecionado.tipo,
    documento: selecionado.documento,
    titular: selecionado.titular,
    emissor: selecionado.emissor,
    finalidade: selecionado.finalidade,
    validadeInicio: selecionado.validadeInicio,
    validadeFim: selecionado.validadeFim,
    pfxBuffer,
    senha,
  };
}
