import bcrypt from 'bcryptjs';

export const SENHA_PADRAO_SISTEMA = 'abc12345';

export interface ValidacaoSenhaResult {
  valida: boolean;
  temMinimo: boolean;
  temLetra: boolean;
  temNumero: boolean;
  temEspecial: boolean;
  erro?: string;
}

/**
 * Valida os requisitos de senha do sistema:
 * - Mínimo de 6 caracteres no total
 * - Deve conter letras (maiúsculas e/ou minúsculas)
 * - Deve conter números
 * - Deve conter caracteres especiais (ex: @, #, $, %, &, *, !, etc.)
 * 
 * Se permitirPadrao for true e a senha for 'abc12345', considera válida.
 */
export function validarRequisitosSenha(senha: string, permitirPadrao: boolean = false): ValidacaoSenhaResult {
  const s = String(senha || '').trim();

  if (permitirPadrao && s === SENHA_PADRAO_SISTEMA) {
    return {
      valida: true,
      temMinimo: true,
      temLetra: true,
      temNumero: true,
      temEspecial: true,
    };
  }

  const temMinimo = s.length >= 6;
  const temLetra = /[a-zA-Z]/.test(s);
  const temNumero = /[0-9]/.test(s);
  const temEspecial = /[^a-zA-Z0-9\s]/.test(s);

  const valida = temMinimo && temLetra && temNumero && temEspecial;

  let erro: string | undefined = undefined;
  if (!valida) {
    if (!temMinimo) {
      erro = 'A senha deve possuir no mínimo 6 caracteres.';
    } else if (!temLetra) {
      erro = 'A senha deve conter ao menos uma letra.';
    } else if (!temNumero) {
      erro = 'A senha deve conter ao menos um número.';
    } else if (!temEspecial) {
      erro = 'A senha deve conter ao menos um caractere especial (ex: @, #, $, %, !, &).';
    } else {
      erro = 'A senha deve conter no mínimo 6 caracteres, com letras, números e caracteres especiais.';
    }
  }

  return {
    valida,
    temMinimo,
    temLetra,
    temNumero,
    temEspecial,
    erro,
  };
}

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
