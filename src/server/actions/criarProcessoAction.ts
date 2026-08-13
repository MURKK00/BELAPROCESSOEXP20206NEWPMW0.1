'use server';

import { redirect } from 'next/navigation';
import { criarProcesso } from '@/server/services/processoService';
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

export async function criarProcessoAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado — rode o seed (npm run db:seed) para criar o usuário de dev.');

  const processo = await criarProcesso({
    clienteFinal: String(formData.get('clienteFinal') ?? ''),
    traderIntermedio: String(formData.get('traderIntermedio') ?? '') || undefined,
    produto: String(formData.get('produto') ?? ''),
    volumeKg: Number(formData.get('volumeKg') ?? 0),
    incoterm: String(formData.get('incoterm') ?? ''),
    portoDestino: String(formData.get('portoDestino') ?? ''),
    redex: String(formData.get('redex') ?? '') || undefined,
    valorDeclaradoUsd: formData.get('valorDeclaradoUsd')
      ? Number(formData.get('valorDeclaradoUsd'))
      : undefined,

    localEstufagem: String(formData.get('localEstufagem') ?? '') || undefined,
    containerQtd: formData.get('containerQtd') ? Number(formData.get('containerQtd')) : undefined,
    containerTipo: String(formData.get('containerTipo') ?? "20' DRY"),
    embalagemTipo: String(formData.get('embalagemTipo') ?? 'Sacaria 30kg'),
    sacasPorContainer: formData.get('sacasPorContainer') ? Number(formData.get('sacasPorContainer')) : undefined,
    fumigacaoNecessaria: parseSimNao(formData.get('fumigacaoNecessaria')),
    fumigacaoTipo: String(formData.get('fumigacaoTipo') ?? '') || undefined,
    fumigacaoTempoHoras: formData.get('fumigacaoTempoHoras') ? Number(formData.get('fumigacaoTempoHoras')) : 24,
    armador: String(formData.get('armador') ?? 'ONE'),

    // Salvando a Etiqueta aqui:
    necessitaEtiqueta: parseSimNao(formData.get('necessitaEtiqueta')),

    estufagemInicio: parseDate(formData.get('estufagemInicio')),
    estufagemFim: parseDate(formData.get('estufagemFim')),
    mapaNaSequencia: parseSimNao(formData.get('mapaNaSequencia')),
    ncm: String(formData.get('ncm') ?? '') || undefined,

    criadoPorId: user.id,
  });

  redirect(`/negociacoes/${processo.id}`);
}