import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import {
  calcularPrazoAverbacao,
  compararPorCriticidadeAverbacao,
  obterDataCivilSaoPaulo,
  type FaixaPrazoAverbacao,
} from '@/lib/prazoAverbacao';
import { isEtapaNotaFiscalValida, validarCfopEtapa } from '@/lib/cfopPorEtapa';

export const dynamic = 'force-dynamic';

const FAIXAS_VALIDAS: FaixaPrazoAverbacao[] = [
  'AVERBADA',
  'DENTRO_DO_PRAZO',
  'CRITICO',
  'FORA_DO_PRAZO',
];

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado. Faça login.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const processoId = searchParams.get('processoId');
    const importadorId = searchParams.get('importadorId');
    const produto = searchParams.get('produto')?.trim();
    const ano = searchParams.get('ano')?.trim();
    const etapa = searchParams.get('etapa');
    const statusAverbacao = searchParams.get('statusAverbacao');
    const faixaPrazo = searchParams.get('faixaPrazo');
    const busca = searchParams.get('busca')?.trim();

    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const pageSizeParam = parseInt(searchParams.get('pageSize') || '25', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const pageSize =
      Number.isFinite(pageSizeParam) && pageSizeParam > 0
        ? Math.min(2000, pageSizeParam)
        : 25;

    // 1. Buscar negociações para seletores e facetas de filtro (Importador, Produto, Ano)
    const processos = await prisma.processo.findMany({
      select: {
        id: true,
        numeroProcesso: true,
        clienteFinal: true,
        produto: true,
        volumeKg: true,
        portoDestino: true,
        status: true,
        criadoEm: true,
        importadorId: true,
        importador: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });

    // 2. Montar filtros combináveis (AND) no servidor
    const andConditions: any[] = [];

    if (processoId && processoId !== 'todos') {
      andConditions.push({ processoId });
    }
    if (etapa && etapa !== 'todas' && isEtapaNotaFiscalValida(etapa)) {
      andConditions.push({ etapa });
    }
    if (statusAverbacao && statusAverbacao !== 'todos') {
      andConditions.push({ statusAverbacao });
    }

    const processoConditions: any = {};
    if (importadorId && importadorId !== 'todos') {
      processoConditions.importadorId = importadorId;
    }
    if (produto && produto !== 'todos') {
      processoConditions.produto = produto;
    }
    if (ano && ano !== 'todos' && /^\d{4}$/.test(ano)) {
      const anoNum = parseInt(ano, 10);
      const inicioAno = new Date(`${anoNum}-01-01T00:00:00.000-03:00`);
      const fimAno = new Date(`${anoNum + 1}-01-01T00:00:00.000-03:00`);
      processoConditions.criadoEm = { gte: inicioAno, lt: fimAno };
    }
    if (Object.keys(processoConditions).length > 0) {
      andConditions.push({ processo: { is: processoConditions } });
    }

    if (busca) {
      andConditions.push({
        OR: [
          { numero: { contains: busca, mode: 'insensitive' } },
          { chaveAcesso: { contains: busca, mode: 'insensitive' } },
          { emitente: { contains: busca, mode: 'insensitive' } },
          { destinatario: { contains: busca, mode: 'insensitive' } },
          { numeroDue: { contains: busca, mode: 'insensitive' } },
          { cfop: { contains: busca, mode: 'insensitive' } },
          {
            processo: {
              is: {
                OR: [
                  { numeroProcesso: { contains: busca, mode: 'insensitive' } },
                  { clienteFinal: { contains: busca, mode: 'insensitive' } },
                  { produto: { contains: busca, mode: 'insensitive' } },
                ],
              },
            },
          },
          {
            container: {
              is: {
                numeroContainer: { contains: busca, mode: 'insensitive' },
              },
            },
          },
        ],
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    // 3. Consulta leve apenas de metadados para calcular KPIs, faixas de prazo (180d na Etapa 4),
    // aplicar filtro por faixaPrazo, ordenar por criticidade e paginar no servidor
    const notasMeta = await prisma.notaFiscal.findMany({
      where,
      select: {
        id: true,
        processoId: true,
        etapa: true,
        dataEmissao: true,
        statusAverbacao: true,
        pesoLiquido: true,
        valorTotal: true,
        saldoDisponivelKg: true,
        saldoZerado: true,
        containerId: true,
      },
    });

    const agora = new Date();
    const metasComPrazo = notasMeta.map((n) => ({
      ...n,
      prazo: calcularPrazoAverbacao({
        etapa: n.etapa,
        dataEmissao: n.dataEmissao,
        statusAverbacao: n.statusAverbacao,
        dataReferencia: agora,
      }),
    }));

    // Contadores clicáveis por faixa de prazo (exclusivamente Etapa 4 sobre o recorte atual sem faixaPrazo)
    const faixasPrazo = {
      AVERBADA: 0,
      DENTRO_DO_PRAZO: 0,
      CRITICO: 0,
      FORA_DO_PRAZO: 0,
    };

    for (const item of metasComPrazo) {
      if (item.prazo.aplicavel && item.prazo.faixa) {
        faixasPrazo[item.prazo.faixa] += 1;
      }
    }

    // Aplicar filtro de faixa de prazo (se selecionado)
    const faixaSelecionada =
      faixaPrazo && faixaPrazo !== 'todas' && (FAIXAS_VALIDAS as string[]).includes(faixaPrazo)
        ? (faixaPrazo as FaixaPrazoAverbacao)
        : null;

    const metasFiltradasPorFaixa = faixaSelecionada
      ? metasComPrazo.filter((item) => item.prazo.faixa === faixaSelecionada)
      : metasComPrazo;

    // Ordenação por criticidade (Vencidas -> Críticas -> Dentro do Prazo -> Averbadas -> Etapas sem prazo)
    const metasOrdenadas = [...metasFiltradasPorFaixa].sort((a, b) =>
      compararPorCriticidadeAverbacao(a, b)
    );

    const totalFiltrado = metasOrdenadas.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltrado / pageSize));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * pageSize;
    const pageMetaSlice = metasOrdenadas.slice(skip, skip + pageSize);
    const pageIds = pageMetaSlice.map((m) => m.id);

    // 4. Hidratar apenas as notas da página atual
    const notasPaginaBrutas =
      pageIds.length > 0
        ? await prisma.notaFiscal.findMany({
            where: { id: { in: pageIds } },
            include: {
              processo: {
                select: {
                  id: true,
                  numeroProcesso: true,
                  clienteFinal: true,
                  produto: true,
                  volumeKg: true,
                  status: true,
                  criadoEm: true,
                  importadorId: true,
                  importador: {
                    select: {
                      id: true,
                      razaoSocial: true,
                      nomeFantasia: true,
                    },
                  },
                },
              },
              container: true,
              retornosComoOrigem: {
                include: {
                  notaEntrada: true,
                },
              },
              entradasReferenciadas: {
                include: {
                  notaRetorno: true,
                },
              },
              itensExportacao: {
                include: {
                  notaLoteRedex: true,
                },
              },
              consumosEmExportacao: {
                include: {
                  notaExportacao: {
                    include: {
                      container: true,
                    },
                  },
                },
              },
            },
          })
        : [];

    const mapaHidratadas = new Map(notasPaginaBrutas.map((n) => [n.id, n]));
    const metaPorId = new Map(pageMetaSlice.map((m) => [m.id, m]));

    const notasPaginadas = pageIds
      .map((id) => {
        const nf = mapaHidratadas.get(id);
        if (!nf) return null;
        const meta = metaPorId.get(id);
        return {
          ...nf,
          prazoAverbacao:
            meta?.prazo ||
            calcularPrazoAverbacao({
              etapa: nf.etapa,
              dataEmissao: nf.dataEmissao,
              statusAverbacao: nf.statusAverbacao,
              dataReferencia: agora,
            }),
          cfopValidacao: validarCfopEtapa(nf.etapa, nf.cfop),
        };
      })
      .filter(Boolean);

    // 5. KPIs gerais e por etapa (Etapas 1 a 5) sobre o recorte atual
    const etapa1 = metasComPrazo.filter((n) => n.etapa === 'ETAPA_1_ENTRADA_INDUSTRIA');
    const etapa2 = metasComPrazo.filter((n) => n.etapa === 'ETAPA_2_RETORNO_ARMAZENAGEM');
    const etapa3 = metasComPrazo.filter((n) => n.etapa === 'ETAPA_3_REMESSA_REDEX');
    const etapa4 = metasComPrazo.filter((n) => n.etapa === 'ETAPA_4_EXPORTACAO');
    const etapa5 = metasComPrazo.filter((n) => n.etapa === 'ETAPA_5_AJUSTE_FISCAL');

    const totalEntradaKg = etapa1.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const totalEntradaValor = etapa1.reduce((acc, n) => acc + Number(n.valorTotal || 0), 0);

    const totalRetornoKg = etapa2.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const totalRetornoValor = etapa2.reduce((acc, n) => acc + Number(n.valorTotal || 0), 0);
    const saldoEntradaPendenteKg = Math.max(0, totalEntradaKg - totalRetornoKg);
    const percRetornado =
      totalEntradaKg > 0 ? Math.min(100, (totalRetornoKg / totalEntradaKg) * 100) : 0;

    const totalRedexEmitidoKg = etapa3.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const totalRedexSaldoDisponivelKg = etapa3.reduce(
      (acc, n) => acc + Number(n.saldoDisponivelKg || 0),
      0
    );
    const totalRedexConsumidoKg = Math.max(0, totalRedexEmitidoKg - totalRedexSaldoDisponivelKg);
    const qtdRedexZeradas = etapa3.filter(
      (n) => n.saldoZerado || Number(n.saldoDisponivelKg || 0) <= 0.001
    ).length;
    const qtdRedexAbertas = etapa3.length - qtdRedexZeradas;

    const totalExportacaoKg = etapa4.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const totalExportacaoValor = etapa4.reduce((acc, n) => acc + Number(n.valorTotal || 0), 0);
    const qtdExportacaoAverbada = etapa4.filter((n) => n.statusAverbacao === 'AVERBADA').length;
    const qtdExportacaoPendenteAverbacao = etapa4.length - qtdExportacaoAverbada;
    const percAverbado = etapa4.length > 0 ? (qtdExportacaoAverbada / etapa4.length) * 100 : 0;
    const containersComNf = new Set(etapa4.map((n) => n.containerId).filter(Boolean)).size;

    const totalAjusteFiscalKg = etapa5.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const totalAjusteFiscalValor = etapa5.reduce((acc, n) => acc + Number(n.valorTotal || 0), 0);

    const totalNotasGeral = metasComPrazo.length;
    const valorTotalGeral = metasComPrazo.reduce((acc, n) => acc + Number(n.valorTotal || 0), 0);
    const volumeTotalKgGeral = metasComPrazo.reduce(
      (acc, n) => acc + Number(n.pesoLiquido || 0),
      0
    );

    // 6. Contagem global de NFs por processo (independente de paginação) e opções de filtros disponíveis
    const contagemPorProcessoRows = await prisma.notaFiscal.groupBy({
      by: ['processoId'],
      _count: { _all: true },
    });
    const contagemPorProcesso: Record<string, number> = {};
    contagemPorProcessoRows.forEach((row) => {
      contagemPorProcesso[row.processoId] = row._count._all;
    });

    const importadoresMap = new Map<string, string>();
    const produtosSet = new Set<string>();
    const anosSet = new Set<number>();

    processos.forEach((p) => {
      if (p.importadorId && p.importador) {
        const nome = p.importador.nomeFantasia || p.importador.razaoSocial;
        if (nome) {
          importadoresMap.set(p.importadorId, nome);
        }
      }
      if (p.produto && p.produto.trim()) {
        produtosSet.add(p.produto.trim());
      }
      const dataSp = obterDataCivilSaoPaulo(p.criadoEm);
      if (dataSp?.ano) {
        anosSet.add(dataSp.ano);
      }
    });

    const importadoresDisponiveis = Array.from(importadoresMap.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const produtosDisponiveis = Array.from(produtosSet).sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    );
    const anosDisponiveis = Array.from(anosSet).sort((a, b) => b - a);

    return NextResponse.json({
      success: true,
      data: {
        notas: notasPaginadas,
        paginacao: {
          page: safePage,
          pageSize,
          totalItens: totalFiltrado,
          totalPages,
          hasNextPage: safePage < totalPages,
          hasPrevPage: safePage > 1,
        },
        faixasPrazo,
        filtrosDisponiveis: {
          importadores: importadoresDisponiveis,
          produtos: produtosDisponiveis,
          anos: anosDisponiveis,
        },
        processos: processos.map((p) => ({
          id: p.id,
          numeroProcesso: p.numeroProcesso,
          clienteFinal: p.clienteFinal,
          produto: p.produto,
          volumeKg: Number(p.volumeKg || 0),
          portoDestino: p.portoDestino,
          status: p.status,
          importadorId: p.importadorId,
          importadorNome: p.importador?.nomeFantasia || p.importador?.razaoSocial || null,
          totalNotas: contagemPorProcesso[p.id] || 0,
        })),
        resumo: {
          totalNotasGeral,
          valorTotalGeral,
          volumeTotalKgGeral,
          etapa1: {
            qtd: etapa1.length,
            volumeKg: totalEntradaKg,
            valorTotal: totalEntradaValor,
          },
          etapa2: {
            qtd: etapa2.length,
            volumeKg: totalRetornoKg,
            valorTotal: totalRetornoValor,
            saldoPendenteKg: saldoEntradaPendenteKg,
            percRetornado,
          },
          etapa3: {
            qtd: etapa3.length,
            volumeKg: totalRedexEmitidoKg,
            saldoDisponivelKg: totalRedexSaldoDisponivelKg,
            consumidoKg: totalRedexConsumidoKg,
            qtdZeradas: qtdRedexZeradas,
            qtdAbertas: qtdRedexAbertas,
          },
          etapa4: {
            qtd: etapa4.length,
            volumeKg: totalExportacaoKg,
            valorTotal: totalExportacaoValor,
            averbadas: qtdExportacaoAverbada,
            pendentesAverbacao: qtdExportacaoPendenteAverbacao,
            percAverbado,
            containersAtendidos: containersComNf,
          },
          etapa5: {
            qtd: etapa5.length,
            volumeKg: totalAjusteFiscalKg,
            valorTotal: totalAjusteFiscalValor,
          },
        },
      },
    });
  } catch (error: any) {
    console.error('[API /api/notas-fiscais] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Falha ao buscar notas fiscais' },
      { status: 500 }
    );
  }
}
