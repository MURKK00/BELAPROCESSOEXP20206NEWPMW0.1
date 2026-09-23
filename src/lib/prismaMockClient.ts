import { getMockStore } from './mockStore';

function matchesWhere(item: any, where?: Record<string, any>): boolean {
  if (!where) return true;
  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;
    if (key === 'id' && item.id !== val) return false;
    if (key === 'numeroProcesso' && item.numeroProcesso !== val) return false;
    if (key === 'email' && item.email !== val) return false;
    if (key === 'nome' && item.nome !== val) return false;
    if (key === 'processoId' && item.processoId !== val) return false;
    if (key === 'financeiroId' && item.financeiroId !== val) return false;
    if (key === 'categoria' && item.categoria !== val) return false;
    if (key === 'financeiroId_categoria') {
      if (item.financeiroId !== val.financeiroId || item.categoria !== val.categoria) return false;
    }
  }
  return true;
}

function resolveProcessoIncludes(processo: any, include?: Record<string, any>) {
  if (!include || !processo) return processo;
  const store = getMockStore();
  const copy = { ...processo };

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
    if (include.documentos.include?.tipoDocumento) {
      docs = docs.map((d) => ({
        ...d,
        tipoDocumento: store.tiposDocumento.find((td) => td.id === d.tipoDocumentoId) ?? null,
        uploadedBy: store.usuarios.find((u) => u.id === d.uploadedPorId) ?? null,
      }));
    }
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
    if (include.logs.include?.usuario) {
      logs = logs.map((l) => ({
        ...l,
        usuario: store.usuarios.find((u) => u.id === l.usuarioId) ?? null,
      }));
    }
    copy.logs = logs;
  }

  return copy;
}

export function createMockPrismaClient() {
  const store = getMockStore();

  const mockClient: any = {
    usuario: {
      findUnique: async ({ where }: any) => store.usuarios.find((u) => matchesWhere(u, where)) ?? null,
      findFirst: async ({ where }: any = {}) => store.usuarios.find((u) => matchesWhere(u, where)) ?? store.usuarios[0] ?? null,
      upsert: async ({ where, create, update }: any) => {
        let item = store.usuarios.find((u) => matchesWhere(u, where));
        if (item) {
          Object.assign(item, update);
          return item;
        }
        item = { id: `usr_${Date.now()}`, ...create, criadoEm: new Date(), atualizadoEm: new Date() };
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
      create: async ({ data }: any) => {
        const item = {
          id: `trav_${Date.now()}`,
          ...data,
          dataTravamento: new Date(),
        };
        store.cambiosTravados.push(item);
        return item;
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
      create: async ({ data }: any) => {
        const item = {
          id: `audit_${Date.now()}`,
          ...data,
          criadoEm: new Date(),
        };
        store.auditLogs.unshift(item);
        return item;
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

  return mockClient;
}
