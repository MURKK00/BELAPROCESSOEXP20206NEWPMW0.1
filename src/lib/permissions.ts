export type Papel = 'COMERCIAL' | 'ADMINISTRATIVO' | 'FINANCEIRO' | 'DIRETORIA' | 'ADMIN';

export interface PapelMeta {
  id: Papel;
  label: string;
  desc: string;
  badgeClass: string;
}

export const PAPEIS_DISPONIVEIS: PapelMeta[] = [
  {
    id: 'COMERCIAL',
    label: 'Comercial',
    desc: 'Negociações, Cotações Mercado e alteração de status para Pendente, Em Negociação e Cancelado',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'ADMINISTRATIVO',
    label: 'Administrativo',
    desc: 'Edição de Contêineres, gerenciamento de todos os status e exclusão de documentos',
    badgeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  },
  {
    id: 'FINANCEIRO',
    label: 'Financeiro',
    desc: 'Acesso ao módulo financeiro e edição completa da aba Financeiro & DRE (preços, custos, câmbio)',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  },
  {
    id: 'DIRETORIA',
    label: 'Diretoria',
    desc: 'Acesso irrestrito a todos os módulos, todas as abas de edição e todos os status',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  },
  {
    id: 'ADMIN',
    label: 'ADMIN',
    desc: 'Acesso total ao sistema e permissão exclusiva para o Painel Administrativo (usuários & demo)',
    badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  },
];

/**
 * Normaliza e extrai os múltiplos papéis do usuário.
 * Suporta array `papeis: string[]` ou string separada por vírgula `papel: "ADMINISTRATIVO,COMERCIAL"`.
 */
export function getUserPapeis(user: any): Papel[] {
  if (!user) return [];

  const rawList: string[] = [];

  if (Array.isArray(user.papeis)) {
    rawList.push(...user.papeis);
  } else if (typeof user.papeis === 'string') {
    rawList.push(...user.papeis.split(','));
  }

  if (typeof user.papel === 'string') {
    rawList.push(...user.papel.split(','));
  } else if (Array.isArray(user.papel)) {
    rawList.push(...user.papel);
  }

  if (typeof user.role === 'string') {
    rawList.push(...user.role.split(','));
  }

  const normalized = Array.from(
    new Set(
      rawList
        .map((p) => p.trim().toUpperCase())
        .filter((p): p is Papel =>
          ['COMERCIAL', 'ADMINISTRATIVO', 'FINANCEIRO', 'DIRETORIA', 'ADMIN'].includes(p)
        )
    )
  );

  return normalized.length > 0 ? normalized : ['ADMIN'];
}

// Verificadores rápidos de papel individual
export const hasRole = (user: any, role: Papel): boolean =>
  getUserPapeis(user).includes(role);

export const isAdmin = (user: any): boolean => hasRole(user, 'ADMIN');
export const isDiretoria = (user: any): boolean => hasRole(user, 'DIRETORIA');
export const isComercial = (user: any): boolean => hasRole(user, 'COMERCIAL');
export const isAdministrativo = (user: any): boolean => hasRole(user, 'ADMINISTRATIVO');
export const isFinanceiro = (user: any): boolean => hasRole(user, 'FINANCEIRO');

// 1. Painel Admin: Exclusivo para ADMIN
export const canAccessAdmin = (user: any): boolean => isAdmin(user);

// 2. Módulo de Cotações: Comercial + Diretoria + Admin
export const canAccessCotacoes = (user: any): boolean =>
  isAdmin(user) || isDiretoria(user) || isComercial(user);

// 3. Módulo Financeiro: Financeiro + Diretoria + Admin
export const canAccessFinanceiro = (user: any): boolean =>
  isAdmin(user) || isDiretoria(user) || isFinanceiro(user);

// 4. Edição da aba Financeiro & DRE da negociação: Financeiro + Diretoria + Admin
export const canEditFinanceiro = (user: any): boolean =>
  isAdmin(user) || isDiretoria(user) || isFinanceiro(user);

// 5. Edição de Contêineres: Administrativo + Diretoria + Admin
export const canEditContainers = (user: any): boolean =>
  isAdmin(user) || isDiretoria(user) || isAdministrativo(user);

// 6. Exclusão de Documentos: Administrativo + Diretoria + Admin
export const canDeleteDocumentos = (user: any): boolean =>
  isAdmin(user) || isDiretoria(user) || isAdministrativo(user);

// 7. Acessos Gerais: Todos podem anexar documentos, criar negociação e editar Visão Geral, Importador e Linha do Tempo
export const canUploadDocumentos = (_user: any): boolean => true;
export const canCreateNegociacao = (_user: any): boolean => true;
export const canEditVisaoGeral = (_user: any): boolean => true;
export const canEditImportador = (_user: any): boolean => true;
export const canEditLinhaTempo = (_user: any): boolean => true;

// 8. Gerenciamento de Status:
// - Administrativo, Diretoria e Admin: gerenciam todos os status
// - Comercial: pode alterar apenas para Pendente, Em Negociação e Cancelado
export const STATUS_TODOS = [
  'PENDENTE',
  'EM_NEGOCIACAO',
  'EM_EXECUCAO',
  'EMBARCADO',
  'FINALIZADO',
  'CANCELADO',
] as const;

export const STATUS_COMERCIAL = [
  'PENDENTE',
  'EM_NEGOCIACAO',
  'CANCELADO',
] as const;

export function getAllowedStatuses(user: any): string[] {
  const papeis = getUserPapeis(user);
  if (papeis.some((p) => p === 'ADMIN' || p === 'DIRETORIA' || p === 'ADMINISTRATIVO')) {
    return [...STATUS_TODOS];
  }
  if (papeis.includes('COMERCIAL')) {
    return [...STATUS_COMERCIAL];
  }
  return [];
}

export function canChangeStatus(user: any, targetStatus?: string): boolean {
  const allowed = getAllowedStatuses(user);
  if (!targetStatus) return allowed.length > 0;
  return allowed.includes(targetStatus);
}
