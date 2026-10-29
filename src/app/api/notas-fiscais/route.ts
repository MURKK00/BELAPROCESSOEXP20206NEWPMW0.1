import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const processoId = searchParams.get('processoId');
    const etapa = searchParams.get('etapa');
    const statusAverbacao = searchParams.get('statusAverbacao');
    const busca = searchParams.get('busca')?.trim().toLowerCase();

    // 1. Buscar todas as negociações ativas no sistema para popular o seletor
    const processos = await prisma.processo.findMany({
      select: {
        id: true,
        numeroProcesso: true,
        clienteFinal: true,
        produto: true,
        volumeKg: true,
        portoDestino: true,
        status: true,
      },
      orderBy: { criadoEm: 'desc' },
    });

    // 2. Montar filtros para buscar as notas fiscais
    const where: any = {};
    if (processoId && processoId !== 'todos') {
      where.processoId = processoId;
    }
    if (etapa && etapa !== 'todas') {
      where.etapa = etapa;
    }
    if (statusAverbacao && statusAverbacao !== 'todos') {
      where.statusAverbacao = statusAverbacao;
    }

    // Buscar notas fiscais com todas as relações
    const todasNotas = await prisma.notaFiscal.findMany({
      where,
      include: {
        processo: {
          select: {
            id: true,
            numeroProcesso: true,
            clienteFinal: true,
            produto: true,
            volumeKg: true,
            status: true,
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
      orderBy: { dataEmissao: 'desc' },
    });

    // Se houver busca textual, filtrar
    let notasFiltradas = todasNotas;
    if (busca) {
      notasFiltradas = todasNotas.filter((n: any) => {
        const num = (n.numero || '').toLowerCase();
        const chave = (n.chaveAcesso || '').toLowerCase();
        const emitente = (n.emitente || '').toLowerCase();
        const destinatario = (n.destinatario || '').toLowerCase();
        const procNum = (n.processo?.numeroProcesso || '').toLowerCase();
        const cliente = (n.processo?.clienteFinal || '').toLowerCase();
        const containerNum = (n.container?.numeroContainer || '').toLowerCase();
        const due = (n.numeroDue || '').toLowerCase();

        return (
          num.includes(busca) ||
          chave.includes(busca) ||
          emitente.includes(busca) ||
          destinatario.includes(busca) ||
          procNum.includes(busca) ||
          cliente.includes(busca) ||
          containerNum.includes(busca) ||
          due.includes(busca)
        );
      });
    }

    // 3. Cálculos de resumo e KPIs
    const etapa1 = todasNotas.filter((n) => n.etapa === 'ETAPA_1_ENTRADA_INDUSTRIA');
    const etapa2 = todasNotas.filter((n) => n.etapa === 'ETAPA_2_RETORNO_ARMAZENAGEM');
    const etapa3 = todasNotas.filter((n) => n.etapa === 'ETAPA_3_REMESSA_REDEX');
    const etapa4 = todasNotas.filter((n) => n.etapa === 'ETAPA_4_EXPORTACAO');

    const totalEntradaKg = etapa1.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const totalEntradaValor = etapa1.reduce((acc, n) => acc + Number(n.valorTotal || 0), 0);

    const totalRetornoKg = etapa2.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const totalRetornoValor = etapa2.reduce((acc, n) => acc + Number(n.valorTotal || 0), 0);
    const saldoEntradaPendenteKg = Math.max(0, totalEntradaKg - totalRetornoKg);
    const percRetornado = totalEntradaKg > 0 ? Math.min(100, (totalRetornoKg / totalEntradaKg) * 100) : 0;

    const totalRedexEmitidoKg = etapa3.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const totalRedexSaldoDisponivelKg = etapa3.reduce((acc, n) => acc + Number(n.saldoDisponivelKg || 0), 0);
    const totalRedexConsumidoKg = Math.max(0, totalRedexEmitidoKg - totalRedexSaldoDisponivelKg);
    const qtdRedexZeradas = etapa3.filter((n) => n.saldoZerado || Number(n.saldoDisponivelKg || 0) <= 0.001).length;
    const qtdRedexAbertas = etapa3.length - qtdRedexZeradas;

    const totalExportacaoKg = etapa4.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const totalExportacaoValor = etapa4.reduce((acc, n) => acc + Number(n.valorTotal || 0), 0);
    const qtdExportacaoAverbada = etapa4.filter((n) => n.statusAverbacao === 'AVERBADA').length;
    const qtdExportacaoPendenteAverbacao = etapa4.length - qtdExportacaoAverbada;
    const percAverbado = etapa4.length > 0 ? (qtdExportacaoAverbada / etapa4.length) * 100 : 0;

    const containersComNf = new Set(etapa4.map((n) => n.containerId).filter(Boolean)).size;

    const totalNotasGeral = todasNotas.length;
    const valorTotalGeral = todasNotas.reduce((acc, n) => acc + Number(n.valorTotal || 0), 0);
    const volumeTotalKgGeral = todasNotas.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);

    // Contagem de notas por processo para badges rápidos
    const contagemPorProcesso: Record<string, number> = {};
    todasNotas.forEach((n) => {
      contagemPorProcesso[n.processoId] = (contagemPorProcesso[n.processoId] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        notas: notasFiltradas,
        processos: processos.map((p) => ({
          ...p,
          volumeKg: Number(p.volumeKg || 0),
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
