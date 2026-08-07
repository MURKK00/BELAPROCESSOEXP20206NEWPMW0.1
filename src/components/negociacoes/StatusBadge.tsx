import type { StatusNegociacao } from '@prisma/client';

const LABEL: Record<StatusNegociacao, string> = {
  PENDENTE: 'Pendente',
  EM_NEGOCIACAO: 'Em negociação',
  EMBARCADO: 'Embarcado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

const STYLES: Record<StatusNegociacao, string> = {
  PENDENTE: 'badge-criado',
  EM_NEGOCIACAO: 'badge-pendente',
  EMBARCADO: 'badge-embarcando',
  FINALIZADO: 'badge-concluido',
  CANCELADO: 'badge-alerta',
};

export function StatusBadge({ status }: { status: StatusNegociacao }) {
  return <span className={`badge ${STYLES[status]}`}>{LABEL[status]}</span>;
}