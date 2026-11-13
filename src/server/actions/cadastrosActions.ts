"use server";

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { TipoEntidadeComercial } from '@prisma/client';
import type { FazendaItem } from '@/lib/demoCadastrosData';

export type { FazendaItem };

// --- BLOCO DE SEGURANÇA DE SESSÃO ---
async function requireSession(options?: { onlyAdmin?: boolean; blockViewer?: boolean }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!session || !user) {
    throw new Error('Sessão expirada ou usuário não autenticado. Faça login novamente.');
  }

  const role = user.papel || user.perfil || 'COMERCIAL';
  const papeis: string[] = Array.isArray(user.papeis) ? user.papeis : [role];

  if (options?.onlyAdmin && role !== 'ADMIN' && !papeis.includes('ADMIN')) {
    throw new Error('Acesso negado. Apenas administradores podem realizar esta operação.');
  }

  if (options?.blockViewer && role === 'VISUALIZADOR' && !papeis.includes('ADMIN')) {
    throw new Error('Acesso negado. Perfil de visualizador não possui permissão de escrita.');
  }

  return user;
}

export interface CadastroEntidadeInput {
  id?: string;
  tipo: 'PRODUTOR' | 'IMPORTADOR' | 'BUYER' | 'ARMAZEM';
  razaoSocial: string;
  nomeFantasia?: string | null;
  documento?: string | null;

  // Produtor Rural & Fazendas (Rastreabilidade)
  inscricaoEstadual?: string | null;
  carNumero?: string | null;
  nomePropriedade?: string | null;
  municipio?: string | null;
  uf?: string | null;
  coordenadasGps?: string | null;
  areaTotalHectares?: number | null;
  certificacoes?: string | null;
  conformidadeSocioambiental?: boolean;
  fazendas?: FazendaItem[] | null;

  // Dados Comuns & Internacionais
  pais?: string | null;
  cidade?: string | null;
  endereco?: string | null;
  complemento?: string | null;
  codigoPostal?: string | null;
  email?: string | null;
  telefone?: string | null;
  iecTaxId?: string | null;
  fassaiId?: string | null;
  panId?: string | null;
  gstId?: string | null;

  // Banco de Destino
  bancoNome?: string | null;
  bancoEndereco?: string | null;
  bancoConta?: string | null;
  bancoSwift?: string | null;
  bancoEmail?: string | null;
  bancoTelefone?: string | null;

  observacoes?: string | null;
  ativo?: boolean;
}

export async function salvarCadastroEntidadeAction(data: CadastroEntidadeInput) {
  try {
    await requireSession({ blockViewer: true });

    if (!data.razaoSocial || data.razaoSocial.trim() === '') {
      return { success: false, error: 'Razão Social / Nome Comercial é obrigatório.' };
    }

    // Processamento de Múltiplas Fazendas para Produtor Rural
    if (data.tipo === 'PRODUTOR') {
      if (Array.isArray(data.fazendas) && data.fazendas.length > 0) {
        // Validação de cada fazenda preenchida
        for (let i = 0; i < data.fazendas.length; i++) {
          const f = data.fazendas[i];
          if (!f.carNumero || f.carNumero.trim() === '') {
            return {
              success: false,
              error: `A fazenda #${i + 1} ("${f.nomePropriedade || 'Sem nome'}") precisa ter o CAR (Cadastro Ambiental Rural) preenchido.`,
            };
          }
          if (!f.inscricaoEstadual || f.inscricaoEstadual.trim() === '') {
            return {
              success: false,
              error: `A fazenda #${i + 1} ("${f.nomePropriedade || 'Sem nome'}") precisa ter a Inscrição Estadual (IE) preenchida.`,
            };
          }
        }

        // Determina a fazenda principal/padrão
        const indexPadrao = data.fazendas.findIndex((f) => f.padrao);
        const fazendaPrincipal = indexPadrao >= 0 ? data.fazendas[indexPadrao] : data.fazendas[0];

        // Normaliza flags padrão
        data.fazendas = data.fazendas.map((f, idx) => ({
          ...f,
          padrao: indexPadrao >= 0 ? idx === indexPadrao : idx === 0,
        }));

        // Sincroniza campos raiz para retrocompatibilidade com telas existentes
        data.carNumero = fazendaPrincipal.carNumero;
        data.inscricaoEstadual = fazendaPrincipal.inscricaoEstadual;
        data.nomePropriedade = fazendaPrincipal.nomePropriedade;
        data.municipio = fazendaPrincipal.municipio;
        data.uf = fazendaPrincipal.uf;
        data.coordenadasGps = fazendaPrincipal.coordenadasGps;
        data.areaTotalHectares =
          fazendaPrincipal.areaTotalHectares !== undefined && fazendaPrincipal.areaTotalHectares !== null
            ? Number(fazendaPrincipal.areaTotalHectares)
            : null;
        data.certificacoes = fazendaPrincipal.certificacoes;
        data.conformidadeSocioambiental =
          fazendaPrincipal.conformidadeSocioambiental !== undefined
            ? Boolean(fazendaPrincipal.conformidadeSocioambiental)
            : true;
      } else {
        // Modo legado sem array de fazendas
        if (!data.carNumero || data.carNumero.trim() === '') {
          return {
            success: false,
            error: 'O CAR (Cadastro Ambiental Rural) é obrigatório para cadastro de Produtor Rural e rastreabilidade do grão.',
          };
        }
        if (!data.inscricaoEstadual || data.inscricaoEstadual.trim() === '') {
          return { success: false, error: 'A Inscrição Estadual (IE) é obrigatória para o produtor rural.' };
        }

        data.fazendas = [
          {
            id: `faz_${Date.now()}`,
            nomePropriedade: data.nomePropriedade?.trim() || data.razaoSocial.trim(),
            carNumero: data.carNumero.trim(),
            inscricaoEstadual: data.inscricaoEstadual.trim(),
            municipio: data.municipio?.trim() || null,
            uf: data.uf?.trim() || 'MT',
            coordenadasGps: data.coordenadasGps?.trim() || null,
            areaTotalHectares:
              data.areaTotalHectares !== undefined && data.areaTotalHectares !== null
                ? Number(data.areaTotalHectares)
                : null,
            certificacoes: data.certificacoes?.trim() || null,
            conformidadeSocioambiental:
              data.conformidadeSocioambiental !== undefined ? Boolean(data.conformidadeSocioambiental) : true,
            padrao: true,
          },
        ];
      }
    }

    const payload: any = {
      tipo: data.tipo as TipoEntidadeComercial,
      razaoSocial: data.razaoSocial.trim(),
      nomeFantasia: data.nomeFantasia?.trim() || null,
      documento: data.documento?.trim() || null,

      inscricaoEstadual: data.inscricaoEstadual?.trim() || null,
      carNumero: data.carNumero?.trim() || null,
      nomePropriedade: data.nomePropriedade?.trim() || null,
      municipio: data.municipio?.trim() || null,
      uf: data.uf?.trim() || null,
      coordenadasGps: data.coordenadasGps?.trim() || null,
      areaTotalHectares:
        data.areaTotalHectares !== undefined && data.areaTotalHectares !== null
          ? Number(data.areaTotalHectares)
          : null,
      certificacoes: data.certificacoes?.trim() || null,
      conformidadeSocioambiental:
        data.conformidadeSocioambiental !== undefined ? Boolean(data.conformidadeSocioambiental) : true,
      fazendas:
        Array.isArray(data.fazendas) && data.fazendas.length > 0
          ? (data.fazendas as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull,

      pais: data.pais?.trim() || 'Brasil',
      cidade: data.cidade?.trim() || null,
      endereco: data.endereco?.trim() || null,
      complemento: data.complemento?.trim() || null,
      codigoPostal: data.codigoPostal?.trim() || null,
      email: data.email?.trim() || null,
      telefone: data.telefone?.trim() || null,
      iecTaxId: data.iecTaxId?.trim() || null,
      fassaiId: data.fassaiId?.trim() || null,
      panId: data.panId?.trim() || null,
      gstId: data.gstId?.trim() || null,

      bancoNome: data.bancoNome?.trim() || null,
      bancoEndereco: data.bancoEndereco?.trim() || null,
      bancoConta: data.bancoConta?.trim() || null,
      bancoSwift: data.bancoSwift ? data.bancoSwift.trim().toUpperCase() : null,
      bancoEmail: data.bancoEmail?.trim() || null,
      bancoTelefone: data.bancoTelefone?.trim() || null,

      observacoes: data.observacoes?.trim() || null,
      ativo: data.ativo !== undefined ? Boolean(data.ativo) : true,
    };

    let entidade;
    if (data.id && data.id.trim() !== '') {
      entidade = await prisma.cadastroEntidade.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      entidade = await prisma.cadastroEntidade.create({
        data: payload,
      });
    }

    revalidatePath('/');
    revalidatePath('/negociacoes');

    return { success: true, entidade };
  } catch (error: any) {
    console.error('[salvarCadastroEntidadeAction] Erro:', error);
    return { success: false, error: error?.message || 'Falha ao salvar parceiro comercial.' };
  }
}

export async function excluirCadastroEntidadeAction(id: string) {
  try {
    await requireSession({ blockViewer: true });

    await prisma.cadastroEntidade.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidatePath('/negociacoes');

    return { success: true };
  } catch (error: any) {
    console.error('[excluirCadastroEntidadeAction] Erro:', error);
    return { success: false, error: error?.message || 'Falha ao remover parceiro comercial.' };
  }
}

export async function limparTodosCadastrosAction() {
  try {
    // Ação destrutiva em massa: exige perfil ADMIN obrigatoriamente
    await requireSession({ onlyAdmin: true });

    await prisma.cadastroEntidade.deleteMany({});

    revalidatePath('/');
    revalidatePath('/cadastros');
    revalidatePath('/negociacoes');

    return { success: true };
  } catch (error: any) {
    console.error('[limparTodosCadastrosAction] Erro:', error);
    return { success: false, error: error?.message || 'Falha ao limpar cadastros.' };
  }
}

export async function toggleAtivarCadastroEntidadeAction(id: string, ativo: boolean) {
  try {
    await requireSession({ blockViewer: true });

    const updated = await prisma.cadastroEntidade.update({
      where: { id },
      data: { ativo },
    });

    revalidatePath('/');
    revalidatePath('/negociacoes');

    return { success: true, entidade: updated };
  } catch (error: any) {
    console.error('[toggleAtivarCadastroEntidadeAction] Erro:', error);
    return { success: false, error: error?.message || 'Falha ao atualizar status do cadastro.' };
  }
}

export async function buscarCadastrosAction(
  tipo?: 'PRODUTOR' | 'IMPORTADOR' | 'BUYER' | 'ARMAZEM' | 'ALL',
  termo?: string
) {
  try {
    await requireSession();

    const where: any = {};
    if (tipo && tipo !== 'ALL') {
      where.tipo = tipo as TipoEntidadeComercial;
    }

    const entidades = await prisma.cadastroEntidade.findMany({
      where,
      orderBy: { razaoSocial: 'asc' },
    });

    if (termo && termo.trim() !== '') {
      const q = termo.trim().toLowerCase();
      return entidades.filter(
        (e) =>
          e.razaoSocial.toLowerCase().includes(q) ||
          (e.nomeFantasia && e.nomeFantasia.toLowerCase().includes(q)) ||
          (e.carNumero && e.carNumero.toLowerCase().includes(q)) ||
          (e.inscricaoEstadual && e.inscricaoEstadual.toLowerCase().includes(q)) ||
          (e.cidade && e.cidade.toLowerCase().includes(q)) ||
          (e.pais && e.pais.toLowerCase().includes(q))
      );
    }

    return entidades;
  } catch (error: any) {
    console.error('[buscarCadastrosAction] Erro:', error);
    return [];
  }
}

export async function vincularProdutorTrajetoAction(
  processoId: string,
  dados: {
    produtorId?: string | null;
    fazendaId?: string | null;
    fazendaOrigemNome?: string | null;
    produtorCarCache?: string | null;
    produtorIeCache?: string | null;
    trajetoStatus?: string | null;
    siloArmazemOrigem?: string | null;
    armazemCnpj?: string | null;
    armazemUf?: string | null;
    armazemCidade?: string | null;
    armazemEndereco?: string | null;
    coletaDiretaLavoura?: boolean | null;
    armazemId?: string | null;
    terminalTransbordo?: string | null;
    laudoClassificacao?: string | null;
    distanciaRodoviariaKm?: number | null;
    emissaoCO2EstimadaKg?: number | null;
  }
) {
  try {
    await requireSession({ blockViewer: true });

    let produtorInfo: any = null;
    let fazendaEscolhida: any = null;

    if (dados.produtorId) {
      produtorInfo = await prisma.cadastroEntidade.findUnique({
        where: { id: dados.produtorId },
      });

      if (produtorInfo && Array.isArray(produtorInfo.fazendas) && produtorInfo.fazendas.length > 0) {
        if (dados.fazendaId) {
          fazendaEscolhida = produtorInfo.fazendas.find((f: any) => f.id === dados.fazendaId);
        }
        if (!fazendaEscolhida) {
          fazendaEscolhida = produtorInfo.fazendas.find((f: any) => f.padrao) || produtorInfo.fazendas[0];
        }
      }
    }

    const updated = await prisma.processo.update({
      where: { id: processoId },
      data: {
        produtorId: dados.produtorId || null,
        fazendaOrigemNome:
          dados.fazendaOrigemNome ||
          fazendaEscolhida?.nomePropriedade ||
          produtorInfo?.nomePropriedade ||
          produtorInfo?.razaoSocial ||
          null,
        produtorCarCache:
          dados.produtorCarCache ||
          fazendaEscolhida?.carNumero ||
          produtorInfo?.carNumero ||
          null,
        produtorIeCache:
          dados.produtorIeCache ||
          fazendaEscolhida?.inscricaoEstadual ||
          produtorInfo?.inscricaoEstadual ||
          null,
        trajetoStatus: dados.trajetoStatus || 'FAZENDA',
        siloArmazemOrigem: dados.siloArmazemOrigem || null,
        armazemCnpj: dados.armazemCnpj || null,
        armazemUf: dados.armazemUf || null,
        armazemCidade: dados.armazemCidade || null,
        armazemEndereco: dados.armazemEndereco || null,
        coletaDiretaLavoura: dados.coletaDiretaLavoura !== undefined ? Boolean(dados.coletaDiretaLavoura) : false,
        armazemId: dados.armazemId || null,
        terminalTransbordo: dados.terminalTransbordo || null,
        laudoClassificacao: dados.laudoClassificacao || null,
        distanciaRodoviariaKm: dados.distanciaRodoviariaKm !== undefined ? dados.distanciaRodoviariaKm : null,
        emissaoCO2EstimadaKg: dados.emissaoCO2EstimadaKg !== undefined ? dados.emissaoCO2EstimadaKg : null,
      },
    });

    revalidatePath(`/negociacoes/${processoId}`);
    revalidatePath(`/negociacoes/${processoId}/rastreabilidade`);
    revalidatePath(`/negociacoes/${processoId}/importador`);
    revalidatePath('/negociacoes');
    revalidatePath('/');

    return { success: true, processo: updated };
  } catch (error: any) {
    console.error('[vincularProdutorTrajetoAction] Erro:', error);
    return { success: false, error: error?.message || 'Falha ao vincular rastreabilidade do grão.' };
  }
}

export async function vincularImportadorProcessoAction(processoId: string, importadorId: string) {
  try {
    await requireSession({ blockViewer: true });

    const importador = await prisma.cadastroEntidade.findUnique({
      where: { id: importadorId },
    });

    if (!importador) {
      return { success: false, error: 'Importador / Buyer não localizado no banco.' };
    }

    // Monta o complementoBuyer serializado compatível com o sistema existente
    let novoComplemento = '';
    const linhas: string[] = [];
    if (importador.tipo === 'BUYER') {
      linhas.push('--- COMPRADOR / BUYER (DIFERENTE DO IMPORTADOR) ---');
      linhas.push(`NOME: ${importador.razaoSocial}`);
      if (importador.endereco) linhas.push(`ENDERECO: ${importador.endereco}`);
      if (importador.cidade) linhas.push(`CIDADE: ${importador.cidade}`);
      if (importador.pais) linhas.push(`PAIS: ${importador.pais}`);
      if (importador.iecTaxId) linhas.push(`TAX_ID: ${importador.iecTaxId}`);
      if (importador.email) linhas.push(`EMAIL: ${importador.email}`);
      if (importador.telefone) linhas.push(`TELEFONE: ${importador.telefone}`);
    }

    if (importador.bancoNome || importador.bancoSwift) {
      linhas.push('--- DADOS BANCARIOS DO COMPRADOR ---');
      if (importador.bancoNome) linhas.push(`BANCO: ${importador.bancoNome}`);
      if (importador.bancoEndereco) linhas.push(`ENDERECO_BANCO: ${importador.bancoEndereco}`);
      if (importador.bancoConta) linhas.push(`CONTA: ${importador.bancoConta}`);
      if (importador.bancoSwift) linhas.push(`SWIFT: ${importador.bancoSwift}`);
      if (importador.bancoEmail) linhas.push(`EMAIL_BANCO: ${importador.bancoEmail}`);
      if (importador.bancoTelefone) linhas.push(`TELEFONE_BANCO: ${importador.bancoTelefone}`);
    }

    novoComplemento = linhas.join('\n');

    const updated = await prisma.processo.update({
      where: { id: processoId },
      data: {
        importadorId: importador.id,
        clienteFinal: importador.razaoSocial,
        enderecoBuyer: importador.endereco || null,
        cidadeBuyer: importador.cidade || null,
        paisBuyer: importador.pais || null,
        iecBuyer: importador.iecTaxId || null,
        fassaiBuyer: importador.fassaiId || null,
        panBuyer: importador.panId || null,
        gstBuyer: importador.gstId || null,
        emailBuyer: importador.email || null,
        telefoneBuyer: importador.telefone || null,
        complementoBuyer: novoComplemento || importador.complemento || null,
      },
    });

    revalidatePath(`/negociacoes/${processoId}`);
    revalidatePath(`/negociacoes/${processoId}/importador`);
    revalidatePath(`/negociacoes/${processoId}/rastreabilidade`);
    revalidatePath('/negociacoes');
    revalidatePath('/');

    return { success: true, processo: updated, importador };
  } catch (error: any) {
    console.error('[vincularImportadorProcessoAction] Erro:', error);
    return { success: false, error: error?.message || 'Falha ao vincular importador à negociação.' };
  }
}
