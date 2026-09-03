'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

function parseSimNao(value: FormDataEntryValue | null): boolean | undefined {
  if (value === 'sim') return true;
  if (value === 'nao') return false;
  return undefined;
}

function parseDate(value: FormDataEntryValue | null): Date | undefined {
  const str = String(value ?? '');
  return str ? new Date(str) : undefined;
}

// Dicionário para deixar os nomes dos campos bonitos no Log de Auditoria
const labelsCampos: Record<string, string> = {
  clienteFinal: 'Cliente Final',
  traderIntermedio: 'Trader Intermediário',
  produto: 'Produto',
  volumeKg: 'Volume (KG)',
  incoterm: 'Incoterm',
  portoDestino: 'Porto de Destino',
  freeTimeDestino: 'Free Time (Destino)',
  redex: 'REDEX',
  valorDeclaradoUsd: 'Valor Declarado (USD)',
  bookingNumero: 'Nº do Booking',
  navio: 'Navio',
  deadlineEmbarque: 'Deadline de Embarque',
  localEstufagem: 'Local de Estufagem',
  containerQtd: 'Qtd. de Contêineres',
  containerTipo: 'Tipo de Contêiner',
  embalagemTipo: 'Tipo de Embalagem',
  sacasPorContainer: 'Sacas por Contêiner',
  fumigacaoNecessaria: 'Fumigação Necessária?',
  fumigacaoTipo: 'Tipo de Fumigação',
  fumigacaoTempoHoras: 'Tempo de Fumigação (Horas)',
  armador: 'Armador',
  estufagemInicio: 'Início da Estufagem',
  estufagemFim: 'Fim da Estufagem',
  mapaNaSequencia: 'MAPA na Sequência?',
  necessitaEtiqueta: 'Necessita Etiqueta?',
  ncm: 'NCM'
};

export async function atualizarProcessoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  
  // 1. Busca os dados antigos ANTES de atualizar para fazer a comparação
  const processoAntigo = await prisma.processo.findUnique({ where: { id: processoId } });
  if (!processoAntigo) throw new Error('Processo não encontrado');

  const deadlineStr = String(formData.get('deadlineEmbarque') ?? '');
  const containerQtd = formData.get('containerQtd') ? Number(formData.get('containerQtd')) : null;

  // 2. Monta o objeto com os dados novos que vieram da tela
  const dadosNovos = {
    clienteFinal: String(formData.get('clienteFinal') ?? ''),
    traderIntermedio: String(formData.get('traderIntermedio') ?? '') || null,
    produto: String(formData.get('produto') ?? ''),
    volumeKg: Number(formData.get('volumeKg') ?? 0),
    incoterm: String(formData.get('incoterm') ?? ''),
    portoDestino: String(formData.get('portoDestino') ?? ''),
    freeTimeDestino: String(formData.get('freeTimeDestino') ?? '') || null,
    redex: String(formData.get('redex') ?? '') || null,
    valorDeclaradoUsd: formData.get('valorDeclaradoUsd') ? Number(formData.get('valorDeclaradoUsd')) : null,
    bookingNumero: String(formData.get('bookingNumero') ?? '') || null,
    navio: String(formData.get('navio') ?? '') || null,
    deadlineEmbarque: deadlineStr ? new Date(deadlineStr + 'T12:00:00Z') : null,
    localEstufagem: String(formData.get('localEstufagem') ?? '') || null,
    containerQtd: containerQtd,
    containerTipo: String(formData.get('containerTipo') ?? "20' DRY"),
    embalagemTipo: String(formData.get('embalagemTipo') ?? 'Sacaria 30kg'),
    sacasPorContainer: formData.get('sacasPorContainer') ? Number(formData.get('sacasPorContainer')) : null,
    fumigacaoNecessaria: parseSimNao(formData.get('fumigacaoNecessaria')) ?? null,
    fumigacaoTipo: String(formData.get('fumigacaoTipo') ?? '') || null,
    fumigacaoTempoHoras: formData.get('fumigacaoTempoHoras') ? Number(formData.get('fumigacaoTempoHoras')) : 24,
    armador: String(formData.get('armador') ?? 'ONE'),
    estufagemInicio: parseDate(formData.get('estufagemInicio')) ?? null,
    estufagemFim: parseDate(formData.get('estufagemFim')) ?? null,
    mapaNaSequencia: parseSimNao(formData.get('mapaNaSequencia')) ?? null,
    necessitaEtiqueta: parseSimNao(formData.get('necessitaEtiqueta')) ?? null,
    ncm: String(formData.get('ncm') ?? '') || null,
  };

  // 3. MOTOR DE COMPARAÇÃO (DE -> PARA)
  const alteracoes: Record<string, { de: any; para: any }> = {};

  for (const [chave, valorNovo] of Object.entries(dadosNovos)) {
    let valorAntigo = (processoAntigo as any)[chave];

    // Formatações para igualar tipos e evitar falso-positivos
    if (valorAntigo && typeof valorAntigo === 'object' && 'toNumber' in valorAntigo) {
      valorAntigo = valorAntigo.toNumber(); // Prisma Decimal para Number
    }

    const strAntigo = valorAntigo instanceof Date ? valorAntigo.toISOString() : String(valorAntigo ?? '');
    const strNovo = valorNovo instanceof Date ? valorNovo.toISOString() : String(valorNovo ?? '');

    // Se mudou de verdade, registra a alteração
    if (strAntigo !== strNovo) {
      let printAntigo = valorAntigo;
      let printNovo = valorNovo;

      // Tratamentos visuais para o log ficar legível na tela
      if (valorAntigo instanceof Date) printAntigo = valorAntigo.toLocaleDateString('pt-BR');
      if (valorNovo instanceof Date) printNovo = valorNovo.toLocaleDateString('pt-BR');
      if (typeof valorAntigo === 'boolean') printAntigo = valorAntigo ? 'Sim' : 'Não';
      if (typeof valorNovo === 'boolean') printNovo = valorNovo ? 'Sim' : 'Não';

      const nomeCampo = labelsCampos[chave] || chave;
      alteracoes[nomeCampo] = { de: printAntigo, para: printNovo };
    }
  }

  // 4. Salva a atualização no banco de dados
  await prisma.processo.update({
    where: { id: processoId },
    data: dadosNovos,
  });

  // Lógica dos contêineres
  if (containerQtd && containerQtd > 0) {
    const existentes = await prisma.container.count({ where: { processoId } });
    if (existentes < containerQtd) {
      const novasLinhas = Array.from({ length: containerQtd - existentes }, (_, i) => ({
        processoId,
        ordem: existentes + i + 1,
      }));
      await prisma.container.createMany({ data: novasLinhas });
    }
  }

  // 5. Salva a Auditoria (Somente se teve alterações reais)
  if (Object.keys(alteracoes).length > 0) {
    await prisma.auditLog.create({
      data: {
        processoId,
        usuarioId: user.id,
        acao: 'PROCESSO_EDITADO',
        detalhe: 'Informações da operação atualizadas.',
        alteracoes: alteracoes // Nosso JSON mágico vai aqui!
      },
    });
  }

  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath(`/negociacoes/${processoId}/containers`);
  revalidatePath('/negociacoes');
  revalidatePath('/');
  redirect(`/negociacoes/${processoId}`);
}

export async function atualizarStatusAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const processoId = String(formData.get('processoId'));
  const novoStatus = String(formData.get('status'));

  const anterior = await prisma.processo.findUnique({ where: { id: processoId } });

  await prisma.processo.update({
    where: { id: processoId },
    data: { status: novoStatus as any },
  });

  // Aproveitando a onda, adicionei o JSON no status também!
  await prisma.auditLog.create({
    data: {
      processoId,
      usuarioId: user.id,
      acao: 'STATUS_ALTERADO',
      detalhe: 'Status da operação alterado.',
      alteracoes: {
        "Status do Processo": {
          de: anterior?.status || 'Vazio',
          para: novoStatus
        }
      }
    },
  });

  revalidatePath(`/negociacoes/${processoId}`);
  revalidatePath('/negociacoes');
  revalidatePath('/');
}