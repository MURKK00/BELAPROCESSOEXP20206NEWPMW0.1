import { getMockStore, saveMockStoreToFile } from './mockStore';
import { gerarNomeUsuarioUnico } from './userHelper';

function matchesWhere(item: any, where?: Record<string, any>): boolean {
  if (!where) return true;
  if (Array.isArray(where.OR)) {
    const orMatches = where.OR.some((subWhere: any) => matchesWhere(item, subWhere));
    if (!orMatches) return false;
  }
  for (const [key, val] of Object.entries(where)) {
    if (key === 'OR') continue;
    if (val === undefined) continue;
    if (key === 'id' && item.id !== val) return false;
    if (key === 'numeroProcesso' && item.numeroProcesso !== val) return false;
    if (key === 'email' && String(item.email || '').toLowerCase() !== String(val).toLowerCase()) return false;
    if (key === 'username' && String(item.username || '').toUpperCase() !== String(val).toUpperCase()) return false;
    if (key === 'nome' && item.nome !== val) return false;
    if (key === 'primeiroAcesso' && item.primeiroAcesso !== val) return false;
    if (key === 'processoId' && item.processoId !== val) return false;
    if (key === 'financeiroId' && item.financeiroId !== val) return false;
    if (key === 'categoria' && item.categoria !== val) return false;
    if (key === 'etapa' && item.etapa !== val) return false;
    if (key === 'containerId' && item.containerId !== val) return false;
    if (key === 'notaRetornoId' && item.notaRetornoId !== val) return false;
    if (key === 'notaEntradaId' && item.notaEntradaId !== val) return false;
    if (key === 'notaExportacaoId' && item.notaExportacaoId !== val) return false;
    if (key === 'notaLoteRedexId' && item.notaLoteRedexId !== val) return false;
    if (key === 'statusAverbacao' && item.statusAverbacao !== val) return false;
    if (key === 'statusSefaz' && item.statusSefaz !== val) return false;
    if (key === 'chaveAcesso' && item.chaveAcesso !== val) return false;
    if (key === 'financeiroId_categoria') {
      if (item.financeiroId !== val.financeiroId || item.categoria !== val.categoria) return false;
    }
  }
  return true;
}

const DATE_FIELDS = [
  'criadoEm',
  'atualizadoEm',
  'estufagemInicio',
  'estufagemFim',
  'deadlineEmbarque',
  'deadlineDraftBl',
  'deadlineDraftVgm',
  'deadlineCarga',
  'dataEstufagem',
  'dataRecebimento',
  'dataTravamento',
  'concluidaEm',
  'dataEmissao',
  'dataConsultaSefaz',
  'dataAverbacao',
];

function ensureDates(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  for (const f of DATE_FIELDS) {
    if (obj[f] && typeof obj[f] === 'string') {
      const d = new Date(obj[f]);
      if (!isNaN(d.getTime())) obj[f] = d;
    }
  }
  return obj;
}

function resolveProcessoIncludes(processo: any, include?: Record<string, any>) {
  if (!processo) return processo;
  const store = getMockStore();
  const copy = ensureDates({ ...processo });
  if (!include) return copy;

  if (include.etapas) {
    let etapas = store.processoEtapas.filter((e) => e.processoId === processo.id);
    if (include.etapas.include?.etapaTemplate) {
      etapas = etapas.map((e) => {
        const tmpl = store.etapasTemplate.find((t) => t.id === e.etapaTemplateId);
        let parceiro = null;
        if (include.etapas.include.etapaTemplate.include?.parceiro && tmpl?.parceiroId) {
          parceiro = store.parceiros.find((p) => p.id === tmpl.parceiroId) ?? null;
        }
        return {
          ...e,
          etapaTemplate: tmpl ? { ...tmpl, parceiro } : null,
        };
      });
    }
    if (include.etapas.orderBy?.etapaTemplate?.ordem === 'asc') {
      etapas.sort((a, b) => (a.etapaTemplate?.ordem ?? 0) - (b.etapaTemplate?.ordem ?? 0));
    }
    copy.etapas = etapas;
  }

  if (include.containers) {
    let containers = store.containers.filter((c) => c.processoId === processo.id);
    if (include.containers.orderBy?.ordem === 'asc') {
      containers.sort((a, b) => a.ordem - b.ordem);
    }
    copy.containers = containers;
  }

  if (include.financeiro) {
    const fin = store.financeiros.find((f) => f.processoId === processo.id);
    if (fin) {
      const finCopy = { ...fin };
      if (include.financeiro.include?.travamentos) {
        finCopy.travamentos = store.cambiosTravados.filter((t) => t.financeiroId === fin.id);
      }
      if (include.financeiro.include?.custos) {
        finCopy.custos = store.custosItem.filter((c) => c.financeiroId === fin.id);
      }
      copy.financeiro = finCopy;
    } else {
      copy.financeiro = null;
    }
  }

  if (include.documentos) {
    let docs = store.documentos.filter((d) => d.processoId === processo.id);
    docs = docs.map((d) => ({
      ...d,
      nomeArquivo: d.nomeArquivo || d.nome || 'documento.pdf',
      storagePath: d.storagePath || d.url || '/uploads/docs/documento.pdf',
      versao: d.versao || 1,
      status: d.status || 'EMITIDO_FINAL',
      uploadedEm: d.uploadedEm ? new Date(d.uploadedEm) : new Date(d.criadoEm || Date.now()),
      uploadedById: d.uploadedById || 'usr_dev_admin',
      tipoDocumento: store.tiposDocumento.find((td) => td.id === d.tipoDocumentoId) ?? {
        id: 'td_default',
        nome: 'Documento Geral',
        categoria: 'DOCUMENTACAO_EXPORTACAO',
        obrigatorioNoPacoteFinal: false,
      },
      uploadedBy: store.usuarios.find((u) => u.id === (d.uploadedById || d.uploadedPorId)) ?? store.usuarios[0] ?? {
        id: 'usr_dev_admin',
        nome: 'Admin (Dev)',
        email: 'dev@belacereais.local',
      },
    }));
    copy.documentos = docs;
  }

  if (include.mensagens) {
    let msgs = store.chatMessages.filter((m) => m.processoId === processo.id);
    if (include.mensagens.include?.autor) {
      msgs = msgs.map((m) => ({
        ...m,
        autor: store.usuarios.find((u) => u.id === m.autorId) ?? null,
      }));
    }
    copy.mensagens = msgs;
  }

  if (include.logs) {
    let logs = store.auditLogs.filter((l) => l.processoId === processo.id);
    if (include.logs.orderBy?.criadoEm === 'asc') {
      logs = [...logs].sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime());
    } else {
      logs = [...logs].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
    }
    if (include.logs.include?.usuario) {
      logs = logs.map((l) => ({
        ...l,
        criadoEm: l.criadoEm ? new Date(l.criadoEm) : new Date(),
        usuario: store.usuarios.find((u) => u.id === l.usuarioId) ?? store.usuarios[0] ?? {
          id: l.usuarioId || 'usr_dev_admin',
          nome: 'Administrador Bela Cereais',
          email: 'admin@belacereais.com.br',
          papel: 'ADMIN',
        },
      }));
    } else {
      logs = logs.map((l) => ({
        ...l,
        criadoEm: l.criadoEm ? new Date(l.criadoEm) : new Date(),
      }));
    }
    copy.logs = logs;
  }

  if (include.notasFiscais) {
    let nfs = store.notasFiscais.filter((n) => n.processoId === processo.id);
    copy.notasFiscais = nfs.map((nf) => resolveNotaFiscalIncludes(nf, typeof include.notasFiscais === 'object' ? include.notasFiscais.include : undefined));
  }

  return copy;
}

function resolveNotaFiscalIncludes(nf: any, include?: Record<string, any>) {
  if (!nf) return nf;
  const store = getMockStore();
  const copy = ensureDates({ ...nf });
  if (!include) return copy;

  if (include.processo) {
    const proc = store.processos.find((p) => p.id === nf.processoId);
    copy.processo = proc ? resolveProcessoIncludes(proc, typeof include.processo === 'object' ? include.processo.include : undefined) : null;
  }
  if (include.container) {
    copy.container = store.containers.find((c) => c.id === nf.containerId) ?? null;
  }
  if (include.retornosComoOrigem) {
    let retornos = store.notasFiscaisRetorno.filter((r) => r.notaRetornoId === nf.id);
    if (include.retornosComoOrigem.include?.notaEntrada) {
      retornos = retornos.map((r) => ({
        ...r,
        notaEntrada: store.notasFiscais.find((n) => n.id === r.notaEntradaId) ?? null,
      }));
    }
    copy.retornosComoOrigem = retornos;
  }
  if (include.entradasReferenciadas) {
    let entradas = store.notasFiscaisRetorno.filter((r) => r.notaEntradaId === nf.id);
    if (include.entradasReferenciadas.include?.notaRetorno) {
      entradas = entradas.map((r) => ({
        ...r,
        notaRetorno: store.notasFiscais.find((n) => n.id === r.notaRetornoId) ?? null,
      }));
    }
    copy.entradasReferenciadas = entradas;
  }
  if (include.itensExportacao) {
    let itens = store.notasFiscaisExportacaoItens.filter((it) => it.notaExportacaoId === nf.id);
    if (include.itensExportacao.include?.notaLoteRedex) {
      itens = itens.map((it) => ({
        ...it,
        notaLoteRedex: store.notasFiscais.find((n) => n.id === it.notaLoteRedexId) ?? null,
      }));
    }
    copy.itensExportacao = itens;
  }
  if (include.consumosEmExportacao) {
    let consumos = store.notasFiscaisExportacaoItens.filter((it) => it.notaLoteRedexId === nf.id);
    if (include.consumosEmExportacao.include?.notaExportacao) {
      consumos = consumos.map((it) => ({
        ...it,
        notaExportacao: store.notasFiscais.find((n) => n.id === it.notaExportacaoId) ?? null,
      }));
    }
    copy.consumosEmExportacao = consumos;
  }
  return copy;
}

export function createMockPrismaClient() {
  const store = getMockStore();

  const mockClient: any = {
    usuario: {
      findUnique: async ({ where }: any) => store.usuarios.find((u) => matchesWhere(u, where)) ?? null,
      findFirst: async ({ where }: any = {}) => store.usuarios.find((u) => matchesWhere(u, where)) ?? store.usuarios[0] ?? null,
      findMany: async ({ where, orderBy }: any = {}) => {
        let list = store.usuarios.filter((u) => matchesWhere(u, where));
        if (orderBy?.criadoEm === 'desc') {
          list = [...list].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
        } else if (orderBy?.nome === 'asc') {
          list = [...list].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
        }
        return list;
      },
      create: async ({ data }: any) => {
        let username = data.username;
        if (!username && data.nome) {
          username = gerarNomeUsuarioUnico(data.nome, store.usuarios);
        }
        const item = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          ...data,
          username: username ? String(username).toUpperCase() : undefined,
          primeiroAcesso: data.primeiroAcesso !== undefined ? data.primeiroAcesso : true,
          ativo: data.ativo !== undefined ? data.ativo : true,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        store.usuarios.push(item);
        return item;
      },
      update: async ({ where, data }: any) => {
        const item = store.usuarios.find((u) => matchesWhere(u, where));
        if (!item) throw new Error('Usuário não encontrado');
        Object.assign(item, data, { atualizadoEm: new Date() });
        return item;
      },
      delete: async ({ where }: any) => {
        const idx = store.usuarios.findIndex((u) => matchesWhere(u, where));
        if (idx !== -1) {
          return store.usuarios.splice(idx, 1)[0];
        }
        throw new Error('Usuário não encontrado para exclusão');
      },
      count: async ({ where }: any = {}) => store.usuarios.filter((u) => matchesWhere(u, where)).length,
      upsert: async ({ where, create, update }: any) => {
        let item = store.usuarios.find((u) => matchesWhere(u, where));
        if (item) {
          Object.assign(item, update, { atualizadoEm: new Date() });
          return item;
        }
        item = {
          id: `usr_${Date.now()}`,
          ...create,
          ativo: create.ativo !== undefined ? create.ativo : true,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        store.usuarios.push(item);
        return item;
      },
    },

    parceiro: {
      findMany: async ({ where }: any = {}) => store.parceiros.filter((p) => matchesWhere(p, where)),
      upsert: async ({ where, create, update }: any) => {
        let item = store.parceiros.find((p) => matchesWhere(p, where));
        if (item) {
          Object.assign(item, update);
          return item;
        }
        item = { id: `parc_${Date.now()}`, ...create, ativo: true, criadoEm: new Date() };
        store.parceiros.push(item);
        return item;
      },
    },

    tipoDocumento: {
      findMany: async ({ where, orderBy }: any = {}) => {
        let list = store.tiposDocumento.filter((t) => matchesWhere(t, where));
        if (orderBy?.nome === 'asc') list.sort((a, b) => a.nome.localeCompare(b.nome));
        return list;
      },
      findUnique: async ({ where }: any = {}) => store.tiposDocumento.find((t) => matchesWhere(t, where)) || null,
      findUniqueOrThrow: async ({ where }: any = {}) => {
        const item = store.tiposDocumento.find((t) => matchesWhere(t, where));
        if (!item) throw new Error('Tipo de documento não encontrado');
        return item;
      },
      upsert: async ({ where, create, update }: any) => {
        let item = store.tiposDocumento.find((t) => matchesWhere(t, where));
        if (item) {
          Object.assign(item, update);
          return item;
        }
        item = { id: `td_${Date.now()}`, ...create, criadoEm: new Date() };
        store.tiposDocumento.push(item);
        return item;
      },
    },

    etapaTemplate: {
      findMany: async ({ where, orderBy }: any = {}) => {
        let list = store.etapasTemplate.filter((t) => matchesWhere(t, where));
        if (orderBy?.ordem === 'asc') list.sort((a, b) => a.ordem - b.ordem);
        return list;
      },
      upsert: async ({ where, create, update }: any) => {
        let item = store.etapasTemplate.find((t) => matchesWhere(t, where));
        if (item) {
          Object.assign(item, update);
          return item;
        }
        item = { id: `tmpl_${Date.now()}`, ...create, criadoEm: new Date() };
        store.etapasTemplate.push(item);
        return item;
      },
    },

    processo: {
      findMany: async (args: any = {}) => {
        let list = store.processos.filter((p) => matchesWhere(p, args.where));
        if (args.orderBy?.criadoEm === 'desc') {
          list.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
        }
        return list.map((p) => resolveProcessoIncludes(p, args.include));
      },
      findUnique: async (args: any) => {
        const item = store.processos.find((p) => matchesWhere(p, args.where));
        if (!item) return null;
        return resolveProcessoIncludes(item, args.include);
      },
      findFirst: async (args: any = {}) => {
        const item = store.processos.find((p) => matchesWhere(p, args.where));
        if (!item) return null;
        return resolveProcessoIncludes(item, args.include);
      },
      count: async (args: any = {}) => store.processos.filter((p) => matchesWhere(p, args.where)).length,
      create: async ({ data, include }: any) => {
        const id = `proc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const { etapas, containers, financeiro, ...procData } = data;
        const newProc = {
          id,
          ...procData,
          status: 'PENDENTE',
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        store.processos.unshift(newProc);

        if (etapas?.create) {
          etapas.create.forEach((e: any, idx: number) => {
            store.processoEtapas.push({
              id: `pe_${Date.now()}_${idx}`,
              processoId: id,
              etapaTemplateId: e.etapaTemplateId,
              status: e.status ?? 'PENDENTE',
              concluidaEm: null,
              concluidaPorId: null,
              documentoId: null,
              observacao: null,
              criadoEm: new Date(),
              atualizadoEm: new Date(),
            });
          });
        }

        if (containers?.create) {
          containers.create.forEach((c: any, idx: number) => {
            store.containers.push({
              id: `cont_${id}_${c.ordem ?? idx + 1}`,
              processoId: id,
              ordem: c.ordem ?? idx + 1,
              numeroContainer: c.numeroContainer ?? '',
              lacre: c.lacre ?? '',
              pesoBruto: c.pesoBruto ?? null,
              tara: c.tara ?? null,
              tipoContainer: c.tipoContainer ?? "20' DRY",
              criadoEm: new Date(),
              atualizadoEm: new Date(),
            });
          });
        }

        if (financeiro?.create) {
          const finId = `fin_${id}`;
          const finRecord = {
            id: finId,
            processoId: id,
            precoUsd: financeiro.create.precoUsd ?? 0,
            bancoDestino: 'BB BRASIL',
            statusRecebimento: 'A_RECEBER',
            criadoEm: new Date(),
            atualizadoEm: new Date(),
          };
          store.financeiros.push(finRecord);

          if (financeiro.create.custos?.create) {
            financeiro.create.custos.create.forEach((c: any) => {
              store.custosItem.push({
                id: `custo_${finId}_${c.categoria}`,
                financeiroId: finId,
                categoria: c.categoria,
                valor: c.valor ?? 0,
                atualizadoPorId: c.atualizadoPorId ?? 'usr_dev_admin',
                atualizadoEm: new Date(),
              });
            });
          }
        }

        return resolveProcessoIncludes(newProc, include);
      },
      update: async ({ where, data, include }: any) => {
        const item = store.processos.find((p) => matchesWhere(p, where));
        if (!item) throw new Error(`Processo not found`);
        Object.assign(item, data, { atualizadoEm: new Date() });
        return resolveProcessoIncludes(item, include);
      },
      delete: async ({ where }: any) => {
        const idx = store.processos.findIndex((p) => matchesWhere(p, where));
        if (idx !== -1) {
          const deleted = store.processos.splice(idx, 1)[0];
          return deleted;
        }
        return {};
      },
    },

    processoEtapa: {
      findMany: async ({ where }: any = {}) => store.processoEtapas.filter((e) => matchesWhere(e, where)),
      findUnique: async ({ where }: any) => store.processoEtapas.find((e) => matchesWhere(e, where)) ?? null,
      update: async ({ where, data }: any) => {
        const item = store.processoEtapas.find((e) => matchesWhere(e, where));
        if (!item) throw new Error(`ProcessoEtapa not found`);
        Object.assign(item, data, { atualizadoEm: new Date() });
        return item;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        store.processoEtapas.forEach((e) => {
          if (matchesWhere(e, where)) {
            Object.assign(e, data, { atualizadoEm: new Date() });
            count++;
          }
        });
        return { count };
      },
    },

    container: {
      findMany: async ({ where, orderBy }: any = {}) => {
        let list = store.containers.filter((c) => matchesWhere(c, where));
        if (orderBy?.ordem === 'asc') list.sort((a, b) => a.ordem - b.ordem);
        return list;
      },
      count: async ({ where }: any = {}) => store.containers.filter((c) => matchesWhere(c, where)).length,
      createMany: async ({ data }: any) => {
        if (Array.isArray(data)) {
          data.forEach((c: any) => {
            store.containers.push({
              id: `cont_${c.processoId}_${c.ordem}_${Date.now()}`,
              processoId: c.processoId,
              ordem: c.ordem,
              numeroContainer: c.numeroContainer ?? '',
              lacre: c.lacre ?? '',
              pesoBruto: c.pesoBruto ?? null,
              tara: c.tara ?? null,
              tipoContainer: c.tipoContainer ?? "20' DRY",
              criadoEm: new Date(),
              atualizadoEm: new Date(),
            });
          });
        }
        return { count: data.length };
      },
      update: async ({ where, data }: any) => {
        const item = store.containers.find((c) => matchesWhere(c, where));
        if (!item) throw new Error(`Container not found`);
        Object.assign(item, data, { atualizadoEm: new Date() });
        return item;
      },
    },

    financeiro: {
      findUnique: async ({ where, include }: any) => {
        const item = store.financeiros.find((f) => matchesWhere(f, where));
        if (!item) return null;
        const copy = { ...item };
        if (include?.travamentos) {
          copy.travamentos = store.cambiosTravados.filter((t) => t.financeiroId === item.id);
        }
        if (include?.custos) {
          copy.custos = store.custosItem.filter((c) => c.financeiroId === item.id);
        }
        return copy;
      },
      create: async ({ data }: any) => {
        const id = `fin_${data.processoId || Date.now()}`;
        const item = {
          id,
          processoId: data.processoId,
          precoUsd: data.precoUsd ?? 0,
          bancoDestino: data.bancoDestino ?? 'BB BRASIL',
          statusRecebimento: data.statusRecebimento ?? 'A_RECEBER',
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        store.financeiros.push(item);
        return item;
      },
      upsert: async ({ where, create, update }: any) => {
        let item = store.financeiros.find((f) => matchesWhere(f, where));
        if (item) {
          Object.assign(item, update, { atualizadoEm: new Date() });
          return item;
        }
        item = {
          id: `fin_${create.processoId || Date.now()}`,
          processoId: create.processoId,
          precoUsd: create.precoUsd ?? 0,
          bancoDestino: create.bancoDestino ?? 'BB BRASIL',
          statusRecebimento: create.statusRecebimento ?? 'A_RECEBER',
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        store.financeiros.push(item);
        return item;
      },
    },

    cambioTravado: {
      findUnique: async ({ where }: any) => {
        return store.cambiosTravados.find((t) => matchesWhere(t, where)) || null;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `trav_${Date.now()}`,
          ...data,
          dataTravamento: data.dataTravamento ? new Date(data.dataTravamento) : new Date(),
          taxa: data.taxa !== undefined ? data.taxa : 0,
          moedaTaxa: data.moedaTaxa || 'USD',
          valorLiquido: data.valorLiquido !== undefined ? data.valorLiquido : (
            data.moedaTaxa === 'BRL'
              ? (Number(data.valorUsdParcial) * Number(data.ptax) - (Number(data.taxa) || 0))
              : ((Number(data.valorUsdParcial) - (Number(data.taxa) || 0)) * Number(data.ptax))
          ),
        };
        store.cambiosTravados.push(item);
        return item;
      },
      update: async ({ where, data }: any) => {
        const item = store.cambiosTravados.find((t) => matchesWhere(t, where));
        if (item) {
          if (data.dataTravamento) data.dataTravamento = new Date(data.dataTravamento);
          Object.assign(item, data);
          return item;
        }
        throw new Error('Travamento não encontrado');
      },
      delete: async ({ where }: any) => {
        const idx = store.cambiosTravados.findIndex((t) => matchesWhere(t, where));
        if (idx !== -1) return store.cambiosTravados.splice(idx, 1)[0];
        return {};
      },
    },

    custoItem: {
      upsert: async ({ where, create, update }: any) => {
        let item = store.custosItem.find((c) => matchesWhere(c, where));
        if (item) {
          Object.assign(item, update, { atualizadoEm: new Date() });
          return item;
        }
        item = {
          id: `custo_${create.financeiroId}_${create.categoria}`,
          ...create,
          atualizadoEm: new Date(),
        };
        store.custosItem.push(item);
        return item;
      },
    },

    documento: {
      findMany: async ({ where }: any = {}) => store.documentos.filter((d) => matchesWhere(d, where)),
      findUnique: async ({ where }: any = {}) => store.documentos.find((d) => matchesWhere(d, where)) || null,
      findUniqueOrThrow: async ({ where }: any = {}) => {
        const item = store.documentos.find((d) => matchesWhere(d, where));
        if (!item) throw new Error('Documento não encontrado');
        return item;
      },
      update: async ({ where, data }: any) => {
        const item = store.documentos.find((d) => matchesWhere(d, where));
        if (!item) throw new Error('Documento não encontrado');
        Object.assign(item, data);
        return item;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `doc_${Date.now()}`,
          ...data,
          uploadedEm: new Date(),
        };
        store.documentos.unshift(item);
        return item;
      },
      delete: async ({ where }: any) => {
        const idx = store.documentos.findIndex((d) => matchesWhere(d, where));
        if (idx !== -1) return store.documentos.splice(idx, 1)[0];
        return {};
      },
    },

    chatMessage: {
      findMany: async ({ where }: any = {}) => store.chatMessages.filter((m) => matchesWhere(m, where)),
      create: async ({ data }: any) => {
        const item = {
          id: `chat_${Date.now()}`,
          ...data,
          criadoEm: new Date(),
        };
        store.chatMessages.push(item);
        return item;
      },
    },

    auditLog: {
      findMany: async ({ where, include, orderBy }: any = {}) => {
        let list = store.auditLogs.filter((l) => matchesWhere(l, where));
        if (orderBy?.criadoEm === 'asc') {
          list = [...list].sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime());
        } else {
          list = [...list].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
        }
        return list.map((l) => {
          const item = { ...l, criadoEm: l.criadoEm ? new Date(l.criadoEm) : new Date() };
          if (include?.usuario) {
            item.usuario = store.usuarios.find((u) => u.id === l.usuarioId) ?? store.usuarios[0] ?? {
              id: l.usuarioId || 'usr_dev_admin',
              nome: 'Administrador Bela Cereais',
              email: 'admin@belacereais.com.br',
              papel: 'ADMIN',
            };
          }
          if (include?.processo) {
            item.processo = store.processos.find((p) => p.id === l.processoId) ?? null;
          }
          return item;
        });
      },
      findFirst: async ({ where, include }: any = {}) => {
        const l = store.auditLogs.find((item) => matchesWhere(item, where));
        if (!l) return null;
        const item = { ...l, criadoEm: l.criadoEm ? new Date(l.criadoEm) : new Date() };
        if (include?.usuario) {
          item.usuario = store.usuarios.find((u) => u.id === l.usuarioId) ?? store.usuarios[0] ?? null;
        }
        return item;
      },
      findUnique: async ({ where, include }: any = {}) => {
        const l = store.auditLogs.find((item) => matchesWhere(item, where));
        if (!l) return null;
        const item = { ...l, criadoEm: l.criadoEm ? new Date(l.criadoEm) : new Date() };
        if (include?.usuario) {
          item.usuario = store.usuarios.find((u) => u.id === l.usuarioId) ?? store.usuarios[0] ?? null;
        }
        return item;
      },
      count: async ({ where }: any = {}) => {
        return store.auditLogs.filter((l) => matchesWhere(l, where)).length;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ...data,
          criadoEm: data.criadoEm ? new Date(data.criadoEm) : new Date(),
        };
        store.auditLogs.unshift(item);
        return item;
      },
    },

    notaFiscal: {
      findMany: async (args: any = {}) => {
        let list = store.notasFiscais.filter((nf) => matchesWhere(nf, args.where));
        if (args.orderBy?.dataEmissao === 'desc') {
          list.sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime());
        } else if (args.orderBy?.criadoEm === 'desc') {
          list.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
        }
        return list.map((nf) => resolveNotaFiscalIncludes(nf, args.include));
      },
      findUnique: async (args: any) => {
        const item = store.notasFiscais.find((nf) => matchesWhere(nf, args.where));
        if (!item) return null;
        return resolveNotaFiscalIncludes(item, args.include);
      },
      findFirst: async (args: any = {}) => {
        const item = store.notasFiscais.find((nf) => matchesWhere(nf, args.where));
        if (!item) return null;
        return resolveNotaFiscalIncludes(item, args.include);
      },
      count: async (args: any = {}) => store.notasFiscais.filter((nf) => matchesWhere(nf, args.where)).length,
      create: async ({ data, include }: any) => {
        const id = `nf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const newItem = {
          id,
          ...data,
          saldoZerado: data.saldoZerado ?? false,
          statusSefaz: data.statusSefaz ?? 'AUTORIZADA',
          statusAverbacao: data.statusAverbacao ?? 'AGUARDANDO',
          dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : new Date(),
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        store.notasFiscais.push(newItem);
        return resolveNotaFiscalIncludes(newItem, include);
      },
      update: async ({ where, data, include }: any) => {
        const item = store.notasFiscais.find((nf) => matchesWhere(nf, where));
        if (!item) throw new Error('Nota Fiscal não encontrada');
        if (data.dataEmissao) data.dataEmissao = new Date(data.dataEmissao);
        if (data.dataConsultaSefaz) data.dataConsultaSefaz = new Date(data.dataConsultaSefaz);
        if (data.dataAverbacao) data.dataAverbacao = new Date(data.dataAverbacao);
        Object.assign(item, data, { atualizadoEm: new Date() });
        return resolveNotaFiscalIncludes(item, include);
      },
      delete: async ({ where }: any) => {
        const idx = store.notasFiscais.findIndex((nf) => matchesWhere(nf, where));
        if (idx !== -1) {
          const [deleted] = store.notasFiscais.splice(idx, 1);
          // Also clean up relations
          store.notasFiscaisRetorno = store.notasFiscaisRetorno.filter(
            (r) => r.notaRetornoId !== deleted.id && r.notaEntradaId !== deleted.id
          );
          store.notasFiscaisExportacaoItens = store.notasFiscaisExportacaoItens.filter(
            (it) => it.notaExportacaoId !== deleted.id && it.notaLoteRedexId !== deleted.id
          );
          return deleted;
        }
        return {};
      },
    },

    notaFiscalRetornoItem: {
      findMany: async ({ where }: any = {}) => store.notasFiscaisRetorno.filter((r) => matchesWhere(r, where)),
      create: async ({ data }: any) => {
        const item = {
          id: `nfr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ...data,
          criadoEm: new Date(),
        };
        store.notasFiscaisRetorno.push(item);
        return item;
      },
      deleteMany: async ({ where }: any = {}) => {
        const initialLen = store.notasFiscaisRetorno.length;
        store.notasFiscaisRetorno = store.notasFiscaisRetorno.filter((r) => !matchesWhere(r, where));
        return { count: initialLen - store.notasFiscaisRetorno.length };
      },
    },

    notaFiscalExportacaoItem: {
      findMany: async ({ where }: any = {}) => store.notasFiscaisExportacaoItens.filter((it) => matchesWhere(it, where)),
      create: async ({ data }: any) => {
        const item = {
          id: `nfe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ...data,
          criadoEm: new Date(),
        };
        store.notasFiscaisExportacaoItens.push(item);
        return item;
      },
      deleteMany: async ({ where }: any = {}) => {
        const initialLen = store.notasFiscaisExportacaoItens.length;
        store.notasFiscaisExportacaoItens = store.notasFiscaisExportacaoItens.filter((it) => !matchesWhere(it, where));
        return { count: initialLen - store.notasFiscaisExportacaoItens.length };
      },
    },

    $transaction: async (arg: any) => {
      if (typeof arg === 'function') {
        return await arg(mockClient);
      }
      if (Array.isArray(arg)) {
        return await Promise.all(arg);
      }
      return arg;
    },

    $disconnect: async () => {},
  };

  const mutationMethods = new Set(['create', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert']);

  return new Proxy(mockClient, {
    get(target, prop, receiver) {
      const orig = Reflect.get(target, prop, receiver);
      if (typeof orig === 'object' && orig !== null) {
        return new Proxy(orig, {
          get(subTarget, subProp, subReceiver) {
            const method = Reflect.get(subTarget, subProp, subReceiver);
            if (typeof method === 'function') {
              return async (...args: any[]) => {
                const res = await method.apply(subTarget, args);
                if (mutationMethods.has(String(subProp))) {
                  saveMockStoreToFile();
                }
                return res;
              };
            }
            return method;
          }
        });
      }
      return orig;
    }
  });
}
