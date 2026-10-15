import bcrypt from 'bcryptjs';

/**
 * Gera o hash criptográfico seguro da senha usando bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compara a senha em texto puro com o hash gravado no banco de dados.
 */
export async function verifyPassword(password: string, hash?: string | null): Promise<boolean> {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('[Auth] Erro ao comparar senha:', error);
    return false;
  }
}
