'use server';

import { redirect } from 'next/navigation';
import { criarProcesso } from '@/server/services/processoService';
import { getSessionUser } from '@/lib/auth';
import { formatComplementoWithComprador } from '@/lib/compradorHelper';

function parseSimNao(value: FormDataEntryValue | null): boolean | undefined {
  if (value === 'sim') return true;
  if (value === 'nao') return false;
  return undefined;
}

function parseDate(value: FormDataEntryValue | null): Date | undefined {
  const str = String(value ?? '');
  return str ? new Date(str) : undefined;
}

function mensagemErroLancamento(e: any): string {
  const code = e?.code as string | undefined;
  if (code === 'P2003') {
    return 'Importador ou usuário não encontrado no banco de dados. Reabra a lista, selecione o importador novamente (ou cadastre-o) e tente de novo.';
  }
  if (code === 'P2002') {
    return 'Já existe uma negociação com esses dados (número duplicado). Tente lançar novamente.';
  }
  if (code === 'P2022' || code === 'P2021') {
    return 'O banco de dados está desatualizado (coluna ou tabela ausente). Avise o administrador do sistema.';
  }
  const ultimaLinha = String(e?.message || 'erro desconhecido').trim().split('\n').filter(Boolean).pop();
  return `Falha ao lançar a negociação${code ? ` (${code})` : ''}: ${ultimaLinha}`;
}

export async function criarProcessoAction(formData: FormData): Promise<{ error: string } | undefined> {
  const user = await getSessionUser();
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' };

  const compradorDiferente = formData.get('compradorDiferente') === 'sim';
  const clienteFinal = String(formData.get('clienteFinal') ?? '').trim();
  const compradorNome = String(formData.get('compradorNome') ?? '').trim();
  const importadorId = String(formData.get('importadorId') ?? '').trim() || undefined;
  const enderecoBuyer = String(formData.get('enderecoBuyer') ?? '').trim() || undefined;
  const cidadeBuyer = String(formData.get('cidadeBuyer') ?? '').trim() || undefined;
  const paisBuyer = String(formData.get('paisBuyer') ?? '').trim() || undefined;

  const temProforma = formData.get('temProforma') === 'sim' || formData.get('temProforma') === 'true';
  const diasLiquidacao = Number(formData.get('diasLiquidacao')) || (temProforma ? 10 : 20);
  const multaAtrasoPerc = Number(formData.get('multaAtrasoPerc')) || 5;
  const adiantamentoPerc = Number(formData.get('adiantamentoPerc')) || 10;
  const bancoNome = String(formData.get('bancoNome') ?? '').trim();
  const bancoEndereco = String(formData.get('bancoEndereco') ?? '').trim();
  const bancoConta = String(formData.get('bancoConta') ?? '').trim();
  const bancoSwift = String(formData.get('bancoSwift') ?? '').trim();

  // Salva a marcação de comprador diferente e as regras de cobrança CAD / Carta Borderô
  const complementoBuyer = formatComplementoWithComprador(
    '',
    {
      diferente: compradorDiferente,
      nome: compradorNome,
      importadorNome: clienteFinal,
    },
    {
      nomeBanco: bancoNome,
      enderecoBanco: bancoEndereco,
      conta: bancoConta,
      swift: bancoSwift,
      temProforma,
      diasLiquidacao,
      multaAtrasoPerc,
      adiantamentoPerc,
    }
  );

  let processoId: string;
  try {
  const processo = await criarProcesso({
    clienteFinal,
    importadorId,
    enderecoBuyer,
    cidadeBuyer,
    paisBuyer,
    traderIntermedio: String(formData.get('traderIntermedio') ?? '') || undefined,
    produto: String(formData.get('produto') ?? ''),
    volumeKg: Number(formData.get('volumeKg') ?? 0),
    incoterm: String(formData.get('incoterm') ?? 'CFR'),
    portoOrigem: String(formData.get('portoOrigem') ?? ''),
    portoDestino: String(formData.get('portoDestino') ?? ''),
    freeTimeDestino: String(formData.get('freeTimeDestino') ?? '') || undefined,
    redex: String(formData.get('redex') || formData.get('localEstufagem') || '') || undefined,
    valorDeclaradoUsd: formData.get('valorDeclaradoUsd')
      ? Number(formData.get('valorDeclaradoUsd'))
      : undefined,

    localEstufagem: String(formData.get('localEstufagem') || formData.get('redex') || '') || undefined,
    containerQtd: formData.get('containerQtd') ? Number(formData.get('containerQtd')) : undefined,
    containerTipo: String(formData.get('containerTipo') ?? "20' DRY"),
    embalagemTipo: String(formData.get('embalagemTipo') ?? 'Sacaria 30kg'),
    sacasPorContainer: formData.get('sacasPorContainer') ? Number(formData.get('sacasPorContainer')) : undefined,
    fumigacaoNecessaria: parseSimNao(formData.get('fumigacaoNecessaria')),
    fumigacaoTipo: String(formData.get('fumigacaoTipo') ?? '') || undefined,
    fumigacaoTempoHoras: formData.get('fumigacaoTempoHoras') ? Number(formData.get('fumigacaoTempoHoras')) : 24,
    armador: String(formData.get('armador') ?? 'ONE'),
    bookingNumero: String(formData.get('bookingNumero') ?? '') || undefined,
    navio: String(formData.get('navio') ?? '') || undefined,
    deadlineDraftBl: parseDate(formData.get('deadlineDraftBl')),
    deadlineDraftVgm: parseDate(formData.get('deadlineDraftVgm')),
    deadlineCarga: parseDate(formData.get('deadlineCarga')) || parseDate(formData.get('deadlineEmbarque')),

    necessitaEtiqueta: parseSimNao(formData.get('necessitaEtiqueta')),

    estufagemInicio: parseDate(formData.get('estufagemInicio')),
    estufagemFim: parseDate(formData.get('estufagemFim')),
    mapaNaSequencia: parseSimNao(formData.get('mapaNaSequencia')),
    ncm: String(formData.get('ncm') ?? '') || undefined,
    complementoBuyer,

    criadoPorId: user.id,
  });
  processoId = processo.id;
  } catch (e: any) {
    console.error('[criarProcessoAction] Erro ao criar processo:', e);
    return { error: mensagemErroLancamento(e) };
  }

  // redirect() fica fora do try/catch (ele funciona lançando uma exceção interna do Next)
  redirect(`/negociacoes/${processoId}`);
}