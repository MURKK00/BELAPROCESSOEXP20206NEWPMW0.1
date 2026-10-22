import { prisma } from './prisma';
import { getSessionUser } from './auth';

// Dicionário completo e amigável para todos os campos do Processo
export const LABELS_CAMPOS: Record<string, string> = {
  clienteFinal: 'Cliente Final',
  traderIntermedio: 'Trader Intermediário',
  produto: 'Produto',
  volumeKg: 'Volume (KG)',
  incoterm: 'Incoterm',
  portoOrigem: 'Porto de Origem (Embarque)',
  portoDestino: 'Porto de Destino (Descarga)',
  freeTimeDestino: 'Free Time no Destino (Dias)',
  redex: 'REDEX / Terminal de Estufagem',
  localEstufagem: 'Local de Estufagem',
  valorDeclaradoUsd: 'Preço Declarado (USD/TON)',
  containerQtd: 'Qtd. de Contêineres',
  containerTipo: 'Tipo de Contêiner',
  embalagemTipo: 'Tipo de Embalagem',
  sacasPorContainer: 'Sacas por Contêiner',
  fumigacaoNecessaria: 'Fumigação Necessária',
  fumigacaoTipo: 'Tipo de Fumigação',
  fumigacaoTempoHoras: 'Tempo de Fumigação (Horas)',
  armador: 'Armador Marítimo',
  necessitaEtiqueta: 'Necessita Etiqueta?',
  bookingNumero: 'Nº do Booking',
  navio: 'Navio Transportador',
  estufagemInicio: 'Início da Estufagem',
  estufagemFim: 'Fim da Estufagem',
  deadlineEmbarque: 'Deadline de Embarque',
  deadlineCarga: 'Deadline de Carga (Gate)',
  deadlineDraftBl: 'Deadline Draft BL (Minuta)',
  deadlineDraftVgm: 'Deadline Draft VGM (SOLAS)',
  mapaNaSequencia: 'Inspeção MAPA na Sequência?',
  ncm: 'Classificação NCM',
  ruc: 'RUC (DUE)',
  contratoInterno: 'Contrato Interno',
  status: 'Status da Operação',
  statusCache: 'Etapa Atual do Fluxo',
  
  // Dados do Comprador / Importador
  enderecoBuyer: 'Endereço do Importador',
  cidadeBuyer: 'Cidade do Importador',
  paisBuyer: 'País do Importador',
  complementoBuyer: 'Comprador / Notificado (Consignee)',
  iecBuyer: 'IEC Code (Tax ID)',
  panBuyer: 'PAN do Comprador',
  gstBuyer: 'GST do Comprador',
  fassaiBuyer: 'Licença FASSAI',
  emailBuyer: 'E-mail do Importador',
  telefoneBuyer: 'Telefone do Importador',
  compradorDiferente: 'Comprador Diferente do Consignee',
};

export interface CampoAlteracao {
  de: string | number | boolean | null;
  para: string | number | boolean | null;
  campoKey?: string;
}

export type AlteracoesMapa = Record<string, CampoAlteracao>;

/**
 * Normaliza e formata qualquer valor para apresentação humana legível no Log
 */
export function formatarValorParaAuditoria(valor: any): string {
  if (valor === null || valor === undefined || valor === '') {
    return 'Vazio';
  }

  if (typeof valor === 'boolean') {
    return valor ? 'Sim' : 'Não';
  }

  if (valor instanceof Date || (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor) && !isNaN(Date.parse(valor)))) {
    const d = new Date(valor);
    if (!isNaN(d.getTime())) {
      // Se tiver horário com minutos significativos
      const hasTime = d.getUTCHours() > 0 || d.getUTCMinutes() > 0;
      if (hasTime && d.toISOString().includes('T') && !d.toISOString().endsWith('T00:00:00.000Z') && !d.toISOString().endsWith('T12:00:00.000Z')) {
        return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' ' + 
               d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
  }

  if (typeof valor === 'number') {
    return valor.toLocaleString('pt-BR');
  }

  if (typeof valor === 'object' && 'toNumber' in valor) {
    return Number(valor.toNumber()).toLocaleString('pt-BR');
  }

  return String(valor).trim();
}

/**
 * Compara dois objetos e extrai todas as alterações reais (DE -> PARA),
 * ignorando ruídos de tipo (como Date vs string idêntica, null vs undefined, etc.)
 */
export function calcularAlteracoesCampos(objetoAntigo: any, dadosNovos: any): AlteracoesMapa {
  const alteracoes: AlteracoesMapa = {};

  if (!objetoAntigo || !dadosNovos) return alteracoes;

  for (const [chave, rawNovo] of Object.entries(dadosNovos)) {
    // Ignora metadados internos que não representam edição de negócio
    if (['id', 'processoId', 'criadoEm', 'atualizadoEm', 'etapas', 'containers', 'financeiro', 'documentos', 'mensagens', 'logs'].includes(chave)) {
      continue;
    }

    let valorAntigoBruto = objetoAntigo[chave];
    let valorNovoBruto = rawNovo;

    // Converte Decimal do Prisma se houver
    if (valorAntigoBruto && typeof valorAntigoBruto === 'object' && 'toNumber' in valorAntigoBruto) {
      valorAntigoBruto = valorAntigoBruto.toNumber();
    }
    if (valorNovoBruto && typeof valorNovoBruto === 'object' && 'toNumber' in valorNovoBruto) {
      valorNovoBruto = (valorNovoBruto as any).toNumber();
    }

    // Normalização de string para comparação
    const normalizarParaComparar = (v: any): string => {
      if (v === null || v === undefined || v === '') return '';
      if (v instanceof Date) {
        return v.toISOString().slice(0, 10);
      }
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
        return v.slice(0, 10);
      }
      if (typeof v === 'boolean') return v ? 'true' : 'false';
      return String(v).trim();
    };

    const compAntigo = normalizarParaComparar(valorAntigoBruto);
    const compNovo = normalizarParaComparar(valorNovoBruto);

    if (compAntigo !== compNovo) {
      const nomeAmigavel = LABELS_CAMPOS[chave] || chave;
      alteracoes[nomeAmigavel] = {
        de: formatarValorParaAuditoria(valorAntigoBruto),
        para: formatarValorParaAuditoria(valorNovoBruto),
        campoKey: chave,
      };
    }
  }

  return alteracoes;
}

/**
 * Registra formalmente uma entrada no AuditLog no banco de dados.
 */
export async function registrarLogAuditoria({
  processoId,
  usuarioId,
  acao,
  detalhe,
  alteracoes,
}: {
  processoId: string;
  usuarioId?: string;
  acao: string;
  detalhe: string;
  alteracoes?: AlteracoesMapa | Record<string, any>;
}) {
  let finalUserId = usuarioId;

  if (!finalUserId) {
    try {
      const sessionUser = await getSessionUser();
      if (sessionUser?.id) finalUserId = sessionUser.id;
    } catch {
      // Ignora erro de contexto
    }
  }

  if (!finalUserId) {
    finalUserId = 'usr_admin_principal';
  }

  try {
    return await prisma.auditLog.create({
      data: {
        processoId,
        usuarioId: finalUserId,
        acao,
        detalhe,
        alteracoes: alteracoes && Object.keys(alteracoes).length > 0 ? alteracoes : undefined,
      },
    });
  } catch (err) {
    console.warn('[AuditLog] Erro ao gravar registro de auditoria:', err);
    return null;
  }
}

/**
 * Atualiza um processo e registra automaticamente o log com o usuário,
 * data e diferenças de campo.
 */
export async function atualizarProcessoComAuditoria({
  processoId,
  dadosNovos,
  usuarioId,
  acao = 'PROCESSO_EDITADO',
  detalhePersonalizado,
}: {
  processoId: string;
  dadosNovos: Record<string, any>;
  usuarioId?: string;
  acao?: string;
  detalhePersonalizado?: string;
}) {
  // 1. Busca os dados atuais do processo antes da modificação
  const processoAntigo = await prisma.processo.findUnique({
    where: { id: processoId },
  });

  if (!processoAntigo) {
    throw new Error(`Processo ${processoId} não encontrado`);
  }

  // 2. Calcula todas as alterações de campo
  const alteracoes = calcularAlteracoesCampos(processoAntigo, dadosNovos);
  const totalAlteracoes = Object.keys(alteracoes).length;

  // 3. Atualiza o processo no banco
  const processoAtualizado = await prisma.processo.update({
    where: { id: processoId },
    data: dadosNovos,
  });

  // 4. Se houver mudanças, registra o log de auditoria
  if (totalAlteracoes > 0) {
    const camposNomes = Object.keys(alteracoes).slice(0, 4).join(', ') + (totalAlteracoes > 4 ? ` e mais ${totalAlteracoes - 4} campo(s)` : '');
    const detalhe = detalhePersonalizado || `${totalAlteracoes} campo(s) alterado(s): ${camposNomes}`;

    await registrarLogAuditoria({
      processoId,
      usuarioId,
      acao,
      detalhe,
      alteracoes,
    });
  }

  return {
    processo: processoAtualizado,
    alteracoes,
    totalAlteracoes,
  };
}
