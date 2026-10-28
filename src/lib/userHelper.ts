/**
 * Utilitários para gestão de usuários, geração automática de username e controle de primeiro acesso.
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
