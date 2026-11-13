import forge from 'node-forge';
import {
  MAX_CERT_UPLOAD_BYTES,
  TipoCertificado,
} from '@/lib/certificadosUtils';

if (typeof window !== 'undefined') {
  throw new Error('certificadosParser só pode ser importado no servidor.');
}

export class CertificadoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CertificadoValidationError';
  }
}

export interface MetadadosCertificadoA1 {
  tipo: TipoCertificado;
  documento: string;
  titular: string;
  emissor: string;
  validadeInicio: Date;
  validadeFim: Date;
}

const OID_ICP_BRASIL_CPF = '2.16.76.1.3.1';
const OID_ICP_BRASIL_CNPJ = '2.16.76.1.3.3';
const OID_ICP_BRASIL_RESPONSAVEL_PJ = '2.16.76.1.3.4';

function extrairTextoDeAsn1(node: forge.asn1.Asn1): string {
  if (!node) return '';
  if (typeof node.value === 'string') {
    return node.value;
  }
  if (Array.isArray(node.value)) {
    return node.value.map((child) => extrairTextoDeAsn1(child)).join('');
  }
  return '';
}

function extrairOtherNamesIcpBrasil(cert: forge.pki.Certificate): {
  cnpj?: string;
  cpf?: string;
  cpfResponsavel?: string;
} {
  const resultado: { cnpj?: string; cpf?: string; cpfResponsavel?: string } = {};
  const ext = cert.getExtension('subjectAltName') as any;
  if (!ext) return resultado;

  try {
    const rawDer =
      typeof ext.value === 'string'
        ? ext.value
        : ext.value?.bytes
          ? ext.value.bytes()
          : '';
    if (!rawDer) return resultado;

    const asn1 = forge.asn1.fromDer(rawDer);
    const entries = Array.isArray(asn1.value) ? asn1.value : [];

    for (const entry of entries) {
      // GeneralName otherName tem tagClass CONTEXT_SPECIFIC e type 0
      if (
        entry.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC &&
        entry.type === 0 &&
        Array.isArray(entry.value) &&
        entry.value.length >= 2
      ) {
        const oidNode = entry.value[0];
        const valueWrapper = entry.value[1];
        if (!oidNode || typeof oidNode.value !== 'string') continue;

        const oid = forge.asn1.derToOid(oidNode.value);
        const texto = extrairTextoDeAsn1(valueWrapper).trim();
        const digitos = texto.replace(/\D/g, '');

        if (oid === OID_ICP_BRASIL_CNPJ && digitos.length >= 14) {
          resultado.cnpj = digitos.slice(-14);
        } else if (oid === OID_ICP_BRASIL_CPF && digitos.length >= 19) {
          // Formato ICP-Brasil: DDMMAAAA (8) + CPF (11) + NIS/RG...
          resultado.cpf = digitos.slice(8, 19);
        } else if (oid === OID_ICP_BRASIL_CPF && digitos.length === 11) {
          resultado.cpf = digitos;
        } else if (oid === OID_ICP_BRASIL_RESPONSAVEL_PJ && digitos.length >= 19) {
          resultado.cpfResponsavel = digitos.slice(8, 19);
        }
      }
    }
  } catch {
    // Segue para os fallbacks de Subject se a extensão SAN tiver formato atípico
  }

  return resultado;
}

function extrairDocumentoETipo(cert: forge.pki.Certificate): {
  tipo: TipoCertificado;
  documento: string;
} | null {
  const icp = extrairOtherNamesIcpBrasil(cert);
  if (icp.cnpj && icp.cnpj.length === 14) {
    return { tipo: 'CNPJ', documento: icp.cnpj };
  }
  if (icp.cpf && icp.cpf.length === 11) {
    return { tipo: 'CPF', documento: icp.cpf };
  }

  // Fallback: SERIALNUMBER ou Common Name (padrão "EMPRESA LTDA:12345678000199" ou "NOME:12345678901")
  const serial = String(cert.subject.getField('serialNumber')?.value || '');
  const serialUpper = String(cert.subject.getField('SERIALNUMBER')?.value || '');
  const cn = String(cert.subject.getField('CN')?.value || '');

  const candidatos = [serial, serialUpper, cn];
  for (const texto of candidatos) {
    const matchCnpj = texto.match(/(?:^|[:\s-])(\d{14})(?:$|[^\d])/);
    if (matchCnpj) {
      return { tipo: 'CNPJ', documento: matchCnpj[1] };
    }
  }
  for (const texto of candidatos) {
    const matchCpf = texto.match(/(?:^|[:\s-])(\d{11})(?:$|[^\d])/);
    if (matchCpf) {
      return { tipo: 'CPF', documento: matchCpf[1] };
    }
  }

  if (icp.cpfResponsavel && icp.cpfResponsavel.length === 11) {
    return { tipo: 'CPF', documento: icp.cpfResponsavel };
  }

  return null;
}

function selecionarCertificadoFolha(
  certBags: forge.pkcs12.Bag[],
  keyBags: forge.pkcs12.Bag[]
): forge.pki.Certificate {
  const certs = certBags
    .map((bag) => bag.cert)
    .filter((c): c is forge.pki.Certificate => Boolean(c));

  if (certs.length === 0) {
    throw new CertificadoValidationError(
      'O arquivo não contém nenhum certificado X.509 válido.'
    );
  }

  const chaves = keyBags
    .map((bag) => bag.key)
    .filter((k): k is NonNullable<typeof k> => Boolean(k));

  // Tenta parear o certificado com a chave privada pelo módulo RSA
  for (const key of chaves) {
    const keyRsa = key as unknown as { n?: { toString: (radix?: number) => string } };
    if (keyRsa?.n) {
      const match = certs.find((c) => {
        const pub = c.publicKey as unknown as { n?: { toString: (radix?: number) => string } };
        return pub?.n && pub.n.toString(16) === keyRsa.n!.toString(16);
      });
      if (match) return match;
    }
  }

  // Fallback: prioriza certificado final (não-CA)
  const nonCa = certs.find((c) => {
    const bc = c.getExtension('basicConstraints') as { cA?: boolean } | null;
    return !bc?.cA;
  });

  return nonCa || certs[0];
}

function limparTitular(cnRaw: string, orgRaw: string): string {
  const base = cnRaw || orgRaw || 'Titular não identificado';
  // Remove sufixo padrão ICP-Brasil ":12345678000199" ou ":12345678901"
  return base.replace(/:\d{11,14}$/, '').trim() || base.trim();
}

export function extrairMetadadosCertificadoA1(
  pfxBuffer: Buffer,
  senha: string
): MetadadosCertificadoA1 {
  if (!pfxBuffer || pfxBuffer.length === 0) {
    throw new CertificadoValidationError('Arquivo de certificado vazio.');
  }

  if (pfxBuffer.length > MAX_CERT_UPLOAD_BYTES) {
    throw new CertificadoValidationError(
      'O arquivo do certificado excede o limite máximo permitido de 1 MB.'
    );
  }

  if (typeof senha !== 'string' || senha.length === 0) {
    throw new CertificadoValidationError(
      'Informe a senha do certificado digital A1.'
    );
  }

  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    const derBytes = pfxBuffer.toString('binary');
    const p12Asn1 = forge.asn1.fromDer(derBytes);
    p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, senha);
  } catch (err: any) {
    const msg = String(err?.message || '').toLowerCase();
    if (
      msg.includes('invalid password') ||
      msg.includes('mac could not be verified') ||
      msg.includes('pkcs#12 mac')
    ) {
      throw new CertificadoValidationError(
        'Senha incorreta para o certificado informado. Verifique e tente novamente.'
      );
    }
    throw new CertificadoValidationError(
      'Arquivo inválido ou corrompido. Envie um certificado A1 válido no formato .pfx ou .p12.'
    );
  }

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[
    forge.pki.oids.certBag
  ] || [];
  const shroudedKeyBags =
    p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
      forge.pki.oids.pkcs8ShroudedKeyBag
    ] || [];
  const plainKeyBags =
    p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] || [];
  const keyBags = [...shroudedKeyBags, ...plainKeyBags];

  if (keyBags.length === 0) {
    throw new CertificadoValidationError(
      'Este arquivo não possui chave privada embarcada (não é um certificado A1 completo). Certificados A3 em token/cartão não permitem upload.'
    );
  }

  const cert = selecionarCertificadoFolha(certBags, keyBags);

  const validadeInicio = cert.validity?.notBefore;
  const validadeFim = cert.validity?.notAfter;
  if (!validadeInicio || !validadeFim) {
    throw new CertificadoValidationError(
      'Não foi possível ler as datas de validade do certificado.'
    );
  }

  if (validadeFim.getTime() <= Date.now()) {
    const dataFormatada = validadeFim.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });
    throw new CertificadoValidationError(
      `Certificado vencido em ${dataFormatada}. O sistema bloqueia o envio de certificados expirados.`
    );
  }

  const docInfo = extrairDocumentoETipo(cert);
  if (!docInfo) {
    throw new CertificadoValidationError(
      'Não foi possível identificar um CNPJ ou CPF válido dentro do certificado enviado.'
    );
  }

  const cnSubject = String(cert.subject.getField('CN')?.value || '').trim();
  const orgSubject = String(cert.subject.getField('O')?.value || '').trim();
  const cnIssuer = String(cert.issuer.getField('CN')?.value || '').trim();
  const orgIssuer = String(cert.issuer.getField('O')?.value || '').trim();

  return {
    tipo: docInfo.tipo,
    documento: docInfo.documento,
    titular: limparTitular(cnSubject, orgSubject),
    emissor: cnIssuer || orgIssuer || 'Autoridade Certificadora não informada',
    validadeInicio,
    validadeFim,
  };
}
