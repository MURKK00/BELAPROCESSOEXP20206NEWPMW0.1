import { STATUS_NEGOCIACAO_MAP } from '@/lib/formatters';

export function StatusBadge({ status }: { status: string }) {
  // Pega o nome formatado bonitinho (ex: "Em execução"), ou usa a própria string se não achar
  const label = STATUS_NEGOCIACAO_MAP?.[status] || status;

  // Variável para guardar as classes de cor do Tailwind
  let colorClass = '';

  switch (status) {
    case 'EMBARCADO':
      // Azul vibrante para o que já tá no mar
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
      
    case 'EM_EXECUCAO':
      // Laranja padrão da Bela Cereais para o que tá rodando
      colorClass = 'bg-[#f58220]/10 text-[#c25e13] border-[#f58220]/30'; 
      break;
      
    case 'CONCLUIDO':
      // Verde sucesso
      colorClass = 'bg-green-50 text-green-700 border-green-200';
      break;
      
    case 'CANCELADO':
    case 'CANCELADA':
      // Vermelho alerta
      colorClass = 'bg-red-50 text-red-700 border-red-200';
      break;
      
    case 'CRIADO':
    case 'PENDENTE':
      // Amarelo para quem acabou de chegar ou tá na fila
      colorClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
      break;
      
    default:
      // Cinza neutro como fallback de segurança
      colorClass = 'bg-gray-50 text-gray-700 border-gray-200'; 
      break;
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider whitespace-nowrap ${colorClass}`}>
      {label}
    </span>
  );
}