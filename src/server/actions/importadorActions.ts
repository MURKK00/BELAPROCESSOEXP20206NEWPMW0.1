'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { formatComplementoWithComprador, parseCompradorInfo, type DadosComprador } from '@/lib/compradorHelper';
import { getSessionUser } from '@/lib/auth';
import { calcularAlteracoesCampos, registrarLogAuditoria } from '@/lib/audit';

export async function toggleCompradorDiferenteAction(
  processoId: string,
  diferente: boolean,
  dadosComprador?: Partial<DadosComprador>
) {
  if (!processoId) {
    throw new Error('ID do processo é obrigatório');
  }

  const user = await getSessionUser();

  const processo = await prisma.processo.findUnique({
    where: { id: processoId },
    select: { complementoBuyer: true, clienteFinal: true },
  });

  if (!processo) {
    throw new Error('Processo não encontrado');
  }

  const { complementoLimpo, comprador } = parseCompradorInfo(processo.complementoBuyer);

  const novoComprador: DadosComprador = {
    ...comprador,
    ...dadosComprador,
    diferente,
    nome: dadosComprador?.nome || comprador.nome || processo.clienteFinal,
    importadorNome: dadosComprador?.importadorNome || comprador.importadorNome || processo.clienteFinal,
  };

  const complementoFinal = formatComplementoWithComprador(complementoLimpo, novoComprador);

  await prisma.processo.update({
    where: { id: processoId },
    data: {
      complementoBuyer: complementoFinal || null,
    },
  });

  await registrarLogAuditoria({
    processoId,
    usuarioId: user?.id,
    acao: 'IMPORTADOR_EDITADO',
    detalhe: diferente ? 'Comprador definido como diferente do Importador/Consignee.' : 'Comprador unificado com Importador/Consignee.',
    alteracoes: {
      'Comprador Diferente do Consignee': {
        de: comprador.diferente ? 'Sim' : 'Não',
        para: diferente ? 'Sim' : 'Não',
      },
    },
  });

  try {
    revalidatePath(`/negociacoes/${processoId}/importador`);
    revalidatePath(`/negociacoes/${processoId}`);
    revalidatePath(`/negociacoes/${processoId}/auditoria`);
    revalidatePath(`/negociacoes/${processoId}/documentos`);
    revalidatePath(`/instrucao-embarque/${processoId}`);
    revalidatePath(`/etiquetas/${processoId}`);
    revalidatePath('/negociacoes');
  } catch (err) {
    // Graceful fallback when executed outside Next.js request context
  }

  return { sucesso: true, diferente };
}

export async function atualizarImportadorAction(formData: FormData) {
  const processoId = formData.get('processoId') as string;

  if (!processoId) {
    throw new Error('ID do processo é obrigatório');
  }

  const user = await getSessionUser();

  const processoAntigo = await prisma.processo.findUnique({
    where: { id: processoId },
  });

  if (!processoAntigo) {
    throw new Error('Processo não encontrado');
  }

  const compradorDiferente = formData.get('compradorDiferente') === 'true';
  const complementoBase = (formData.get('complementoBuyer') as string) || '';

  const complementoFinal = formatComplementoWithComprador(complementoBase, {
    diferente: compradorDiferente,
    nome: (formData.get('compradorNome') as string) || '',
    endereco: (formData.get('compradorEndereco') as string) || '',
    complemento: (formData.get('compradorComplemento') as string) || '',
    cidade: (formData.get('compradorCidade') as string) || '',
    pais: (formData.get('compradorPais') as string) || '',
    taxId: (formData.get('compradorTaxId') as string) || '',
    email: (formData.get('compradorEmail') as string) || '',
    telefone: (formData.get('compradorTelefone') as string) || '',
    importadorNome: (formData.get('importadorNome') as string) || '',
  });

  const novosDados = {
    enderecoBuyer: (formData.get('enderecoBuyer') as string) || null,
    complementoBuyer: complementoFinal || null,
    cidadeBuyer: (formData.get('cidadeBuyer') as string) || null,
    paisBuyer: (formData.get('paisBuyer') as string) || null,
    iecBuyer: (formData.get('iecBuyer') as string) || null,
    panBuyer: (formData.get('panBuyer') as string) || null,
    fassaiBuyer: (formData.get('fassaiBuyer') as string) || null,
    gstBuyer: (formData.get('gstBuyer') as string) || null,
    emailBuyer: (formData.get('emailBuyer') as string) || null,
    telefoneBuyer: (formData.get('telefoneBuyer') as string) || null,
  };

  const alteracoes = calcularAlteracoesCampos(processoAntigo, novosDados);

  // Atualiza os dados no banco usando as variáveis exatas do nosso schema.prisma
  await prisma.processo.update({
    where: { id: processoId },
    data: novosDados,
  });

  if (Object.keys(alteracoes).length > 0) {
    await registrarLogAuditoria({
      processoId,
      usuarioId: user?.id,
      acao: 'IMPORTADOR_EDITADO',
      detalhe: `Dados do importador/comprador atualizados (${Object.keys(alteracoes).length} campo(s)).`,
      alteracoes,
    });
  }

  // Limpa o cache para todas as telas e documentos refletirem na hora
  try {
    revalidatePath(`/negociacoes/${processoId}/importador`);
    revalidatePath(`/negociacoes/${processoId}`);
    revalidatePath(`/negociacoes/${processoId}/auditoria`);
    revalidatePath(`/negociacoes/${processoId}/documentos`);
    revalidatePath(`/instrucao-embarque/${processoId}`);
    revalidatePath(`/etiquetas/${processoId}`);
    revalidatePath('/negociacoes');
  } catch (err) {
    // Graceful fallback outside Next.js request context
  }
}
