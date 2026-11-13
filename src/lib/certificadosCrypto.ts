import crypto from 'crypto';

if (typeof window !== 'undefined') {
  throw new Error('certificadosCrypto só pode ser importado no servidor.');
}

export class CertEncryptionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CertEncryptionConfigError';
  }
}

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;

function decodificarChaveMestra(): Buffer | null {
  const raw = process.env.CERT_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== KEY_LENGTH_BYTES) return null;
  return buf;
}

export function isCertEncryptionConfigured(): boolean {
  return decodificarChaveMestra() !== null;
}

export function obterChaveCriptografiaCertificados(): Buffer {
  const raw = process.env.CERT_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new CertEncryptionConfigError(
      'Variável de ambiente CERT_ENCRYPTION_KEY não configurada no servidor. Configure uma chave AES-256 de 32 bytes em base64 antes de enviar certificados.'
    );
  }
  const keyBuffer = Buffer.from(raw, 'base64');
  if (keyBuffer.length !== KEY_LENGTH_BYTES) {
    throw new CertEncryptionConfigError(
      'A variável CERT_ENCRYPTION_KEY é inválida: deve decodificar exatamente para 32 bytes em base64 (gere com: openssl rand -base64 32).'
    );
  }
  return keyBuffer;
}

function criptografarBuffer(plaintext: Buffer, key: Buffer): {
  ciphertextB64: string;
  ivB64: string;
  authTagB64: string;
} {
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertextB64: encrypted.toString('base64'),
    ivB64: iv.toString('base64'),
    authTagB64: authTag.toString('base64'),
  };
}

function descriptografarBuffer(
  ciphertextB64: string,
  ivB64: string,
  authTagB64: string,
  key: Buffer
): Buffer {
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(ciphertextB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export interface SegredosCertificadoCifrados {
  arquivoCriptografado: string;
  senhaCriptografada: string;
  iv: string;
  authTag: string;
}

/**
 * Criptografa o arquivo .pfx/.p12 e a senha em AES-256-GCM usando IVs aleatórios independentes.
 */
export function criptografarSegredosCertificado(
  pfxBuffer: Buffer,
  senha: string
): SegredosCertificadoCifrados {
  const key = obterChaveCriptografiaCertificados();

  const arquivoEnc = criptografarBuffer(pfxBuffer, key);
  const senhaEnc = criptografarBuffer(Buffer.from(senha, 'utf8'), key);

  return {
    arquivoCriptografado: arquivoEnc.ciphertextB64,
    iv: arquivoEnc.ivB64,
    authTag: arquivoEnc.authTagB64,
    // IV e AuthTag dedicados para a senha evitando reuso de nonce em AES-GCM
    senhaCriptografada: `v1:${senhaEnc.ivB64}:${senhaEnc.authTagB64}:${senhaEnc.ciphertextB64}`,
  };
}

/**
 * Descriptografa o arquivo .pfx/.p12 e a senha estritamente em memória.
 */
export function descriptografarSegredosCertificado(
  dados: SegredosCertificadoCifrados
): { pfxBuffer: Buffer; senha: string } {
  const key = obterChaveCriptografiaCertificados();

  const pfxBuffer = descriptografarBuffer(
    dados.arquivoCriptografado,
    dados.iv,
    dados.authTag,
    key
  );

  const partesSenha = String(dados.senhaCriptografada || '').split(':');
  if (partesSenha.length !== 4 || partesSenha[0] !== 'v1') {
    throw new Error('Formato de senha criptografada inválido.');
  }

  const [, senhaIvB64, senhaTagB64, senhaCipherB64] = partesSenha;
  const senhaBuffer = descriptografarBuffer(
    senhaCipherB64,
    senhaIvB64,
    senhaTagB64,
    key
  );

  return {
    pfxBuffer,
    senha: senhaBuffer.toString('utf8'),
  };
}
