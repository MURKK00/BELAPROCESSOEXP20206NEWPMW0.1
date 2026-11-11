/**
 * Utilitários para gestão de usuários, geração automática de username, CPF e controle de primeiro acesso.
 * 
 * Regra de Negócio:
 * - Padrão de nome de usuário: primeira letra do primeiro nome acompanhada do último sobrenome em maiúsculas.
 *   Exemplo: "Murillo Maciel Nunes" -> "MNUNES"
 * - Senha padrão inicial para novos usuários: "abc12345"
 * - Primeiro acesso: usuário é obrigado a definir uma nova senha (digitada 2 vezes para confirmação).
 */

export const SENHA_PADRAO_NOVO_USUARIO = 'abc12345';

/**
 * Gera o nome de usuário (username) no padrão da Bela Cereais:
 * Primeira letra do primeiro nome + último sobrenome (tudo em maiúsculas, sem acentos ou caracteres especiais).
 * 
 * @param nomeCompleto Nome completo do usuário (ex: "Murillo Maciel Nunes")
 * @returns Username gerado (ex: "MNUNES")
 */
export function gerarNomeUsuario(nomeCompleto: string): string {
  if (!nomeCompleto || typeof nomeCompleto !== 'string') return '';

  // 1. Remove acentuação e caracteres não alfanuméricos
  const limpo = nomeCompleto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim();

  const partes = limpo.split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  if (partes.length === 1) return partes[0].toUpperCase();

  // Primeira letra do primeiro nome
  const primeiraLetra = partes[0].charAt(0).toUpperCase();

  // Último sobrenome
  const ultimoSobrenome = partes[partes.length - 1].toUpperCase();

  return `${primeiraLetra}${ultimoSobrenome}`;
}

/**
 * Garante que o username gerado seja único na base de dados, adicionando sufixo numérico em caso de colisão.
 * Ex: se "MNUNES" já existir, gera "MNUNES2", "MNUNES3", etc.
 */
export function gerarNomeUsuarioUnico(
  nomeCompleto: string,
  usuariosExistentes: Array<{ id?: string; username?: string | null }> = [],
  usuarioIdAtual?: string
): string {
  const base = gerarNomeUsuario(nomeCompleto) || 'USUARIO';
  const usernamesOcupados = new Set(
    usuariosExistentes
      .filter((u) => u.id !== usuarioIdAtual && u.username)
      .map((u) => String(u.username).trim().toUpperCase())
  );

  if (!usernamesOcupados.has(base)) {
    return base;
  }

  let contador = 2;
  while (usernamesOcupados.has(`${base}${contador}`)) {
    contador++;
  }

  return `${base}${contador}`;
}

/**
 * Limpa o CPF mantendo apenas dígitos numéricos.
 */
export function limparCPF(cpf?: string | null): string {
  if (!cpf) return '';
  return String(cpf).replace(/\D/g, '');
}

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export function formatarCPF(cpf?: string | null): string {
  const limpo = limparCPF(cpf);
  if (!limpo) return '';
  if (limpo.length <= 3) return limpo;
  if (limpo.length <= 6) return `${limpo.slice(0, 3)}.${limpo.slice(3)}`;
  if (limpo.length <= 9) return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6)}`;
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9, 11)}`;
}

/**
 * Validação dos dígitos verificadores do CPF brasileiro.
 */
export function validarCPF(cpf?: string | null): boolean {
  const limpo = limparCPF(cpf);
  if (!limpo || limpo.length !== 11) return false;

  // Rejeita sequências repetidas (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(limpo.substring(i - 1, i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(9, 10), 10)) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(limpo.substring(i - 1, i), 10) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(10, 11), 10)) return false;

  return true;
}
