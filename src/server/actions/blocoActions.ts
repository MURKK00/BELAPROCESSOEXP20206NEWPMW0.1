'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// Dicionário atualizado: no log vai aparecer "Porto de Origem", mas no banco ele grava na coluna incoterm
const labelsCampos: Record<string, string> = {
  clienteFinal: 'Cliente Final',
  produto: 'Produto',
  volumeKg: 'Volume (KG)',
  portoOrigem: 'Porto de Origem',
  portoDestino: 'Porto de Destino',
  redex: 'REDEX',
  valorDeclaradoUsd: 'Valor Declarado (USD)',
  containerQtd: 'Qtd. de Contêineres',
  sacasPorContainer: 'Sacas por Contêiner',
  freeTimeDestino: 'Free Time (Destino)',
  ruc: 'RUC',
  contratoInterno: 'Contrato Interno',
  bookingNumero: 'Nº do Booking',
  navio: 'Navio',
  estufagemInicio: 'Início da Estufagem',
  estufagemFim: 'Fim da Estufagem',
  deadlineEmbarque: 'Deadline de Embarque',
};

// Função auxiliar para comparar e gerar as alterações
function gerarAlteracoes(dadosAntigos: any, dadosNovos: any) {
  const alteracoes: Record<string, { de: any; para: any }> = {};

  for (const [chave, valorNovo] of Object.entries(dadosNovos)) {
    let valorAntigo = dadosAntigos[chave];

    // Converte Decimal do Prisma para número normal
    if (valorAntigo && typeof valorAntigo === 'object' && 'toNumber' in valorAntigo) {
      valorAntigo = valorAntigo.toNumber();
    }

    // Compara datas e textos de forma segura
    const strAntigo = valorAntigo instanceof Date ? valorAntigo.toISOString() : String(valorAntigo ?? '');
    const strNovo = valorNovo instanceof Date ? valorNovo.toISOString() : String(valorNovo ?? '');

    if (strAntigo !== strNovo) {
      const nomeCampo = labelsCampos[chave] || chave;
      
      // Formata datas para o visual ficar bonito no Log (DD/MM/AAAA)
      let printAntigo = valorAntigo;
      let printNovo = valorNovo;
      if (valorAntigo instanceof Date) printAntigo = valorAntigo.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      if (valorNovo instanceof Date) printNovo = valorNovo.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

      alteracoes[nomeCampo] = { de: printAntigo, para: printNovo };
    }
  }
  return alteracoes;
}

export async function atualizarInfoOperacaoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));

  // 1. Busca os dados ANTES de atualizar
  const processoAntigo = await prisma.processo.findUnique({ where: { id: processoId } });
  if (!processoAntigo) throw new Error('Processo não encontrado');

  // 2. Monta os dados NOVOS (mapeando portoOrigem da tela para a coluna incoterm do banco)
  const dados = {
    clienteFinal: String(formData.get('clienteFinal') ?? ''),
    produto: String(formData.get('produto') ?? ''),
    volumeKg: Number(formData.get('volumeKg') ?? 0),
    portoOrigem: String(formData.get('portoOrigem') ?? ''),
    portoDestino: String(formData.get('portoDestino') ?? ''),
    redex: String(formData.get('redex') ?? '') || null,
    valorDeclaradoUsd: formData.get('valorDeclaradoUsd') ? Number(formData.get('valorDeclaradoUsd')) : null,
    containerQtd: formData.get('containerQtd') ? Number(formData.get('containerQtd')) : null,
    sacasPorContainer: formData.get('sacasPorContainer') ? Number(formData.get('sacasPorContainer')) : null,
    freeTimeDestino: String(formData.get('freeTimeDestino') ?? '') || null,
    ruc: String(formData.get('ruc') ?? '') || null,
    contratoInterno: String(formData.get('contratoInterno') ?? '') || null,
  };

  // 3. Compara
  const alteracoes = gerarAlteracoes(processoAntigo, dados);

  // 4. Salva no banco
  await prisma.processo.update({ where: { id: processoId }, data: dados });

  // 5. Salva a Auditoria só se teve mudança
  if (Object.keys(alteracoes).length > 0) {
    await prisma.auditLog.create({
      data: {
        processoId,
        usuarioId: user.id,
        acao: 'INFO_OPERACAO_EDITADA',
        detalhe: 'Informações da operação atualizadas.',
        alteracoes,
      },
    });
  }

  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
  revalidatePath('/negociacoes');
}

export async function atualizarResumoTopoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  const deadlineStr = String(formData.get('deadlineEmbarque') ?? '');
  const estufagemInicioStr = String(formData.get('estufagemInicio') ?? '');
  const estufagemFimStr = String(formData.get('estufagemFim') ?? '');

  // 1. Busca os dados ANTES
  const processoAntigo = await prisma.processo.findUnique({ where: { id: processoId } });
  if (!processoAntigo) throw new Error('Processo não encontrado');

  // 2. Monta os dados NOVOS
  const dados = {
    bookingNumero: String(formData.get('bookingNumero') ?? '') || null,
    navio: String(formData.get('navio') ?? '') || null,
    estufagemInicio: estufagemInicioStr ? new Date(estufagemInicioStr + 'T12:00:00Z') : null,
    estufagemFim: estufagemFimStr ? new Date(estufagemFimStr + 'T12:00:00Z') : null,
    deadlineEmbarque: deadlineStr ? new Date(deadlineStr + 'T12:00:00Z') : null,
  };

  // 3. Compara
  const alteracoes = gerarAlteracoes(processoAntigo, dados);

  // 4. Salva no banco
  await prisma.processo.update({ where: { id: processoId }, data: dados });

  // 5. Salva a Auditoria só se teve mudança
  if (Object.keys(alteracoes).length > 0) {
    await prisma.auditLog.create({
      data: {
        processoId,
        usuarioId: user.id,
        acao: 'RESUMO_TOPO_EDITADO',
        detalhe: 'Booking, navio, estufagem ou deadline atualizados.',
        alteracoes,
      },
    });
  }

  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/negociacoes/${processoId}/auditoria`);
  revalidatePath('/negociacoes');
  revalidatePath('/');
}