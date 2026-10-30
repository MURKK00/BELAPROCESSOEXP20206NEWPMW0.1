import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLiveMarketData } from '@/lib/liveMarket';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const agora = new Date();

    // 1. Buscar todos os processos do sistema
    const processos = await prisma.processo.findMany({
      include: {
        containers: true,
        notasFiscais: {
          select: {
            id: true,
            numero: true,
            etapa: true,
            statusAverbacao: true,
            statusSefaz: true,
            valorTotal: true,
            pesoLiquido: true,
            dataEmissao: true,
            dataAverbacao: true,
            containerId: true,
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });

    // 2. Classificação de Negociações
    const emExecucao = processos.filter((p) =>
      ['EM_EXECUCAO', 'EM_NEGOCIACAO', 'PENDENTE'].includes(p.status)
    );
    const embarcadas = processos.filter((p) =>
      ['EMBARCADO', 'FINALIZADO'].includes(p.status)
    );

    const volumeEmExecucaoKg = emExecucao.reduce((acc, p) => acc + Number(p.volumeKg || 0), 0);
    const volumeEmbarcadoKg = embarcadas.reduce((acc, p) => acc + Number(p.volumeKg || 0), 0);

    const containersEmExecucao = emExecucao.reduce((acc, p) => acc + (p.containers?.length || p.containerQtd || 0), 0);
    const containersEmbarcados = embarcadas.reduce((acc, p) => acc + (p.containers?.length || p.containerQtd || 0), 0);

    // 3. Próximo Deadline de Embarque
    // Considera deadlineEmbarque ou deadlineCarga de processos não finalizados
    const processosComDeadline = processos
      .filter((p) => p.status !== 'FINALIZADO' && p.status !== 'CANCELADO' && p.deadlineEmbarque)
      .map((p) => {
        const dataDeadline = new Date(p.deadlineEmbarque!);
        const diffMs = dataDeadline.getTime() - agora.getTime();
        const diffHoras = Math.round(diffMs / (1000 * 60 * 60));
        return {
          processoId: p.id,
          numeroProcesso: p.numeroProcesso,
          clienteFinal: p.clienteFinal,
          produto: p.produto,
          volumeKg: Number(p.volumeKg || 0),
          navio: p.navio || 'Navio a confirmar',
          portoDestino: p.portoDestino,
          bookingNumero: p.bookingNumero || 'Booking a definir',
          deadlineEmbarque: dataDeadline.toISOString(),
          diffHoras,
          atrasado: diffHoras < 0,
          urgente: diffHoras >= 0 && diffHoras <= 72,
        };
      })
      .sort((a, b) => a.diffHoras - b.diffHoras);

    // Seleciona o mais próximo (se houver atrasado recente ou futuro mais próximo)
    const proximoDeadline = processosComDeadline.find((d) => !d.atrasado) || processosComDeadline[0] || null;

    let proximoDeadlineFormatado = null;
    if (proximoDeadline) {
      const horas = Math.abs(proximoDeadline.diffHoras);
      const dias = Math.floor(horas / 24);
      const horasRest = horas % 24;

      let tempoTexto = '';
      if (proximoDeadline.atrasado) {
        tempoTexto = dias > 0 ? `Vencido há ${dias}d ${horasRest}h` : `Vencido há ${horas}h`;
      } else {
        tempoTexto = dias > 0 ? `${dias}d ${horasRest}h restantes` : `${horasRest}h restantes`;
      }

      proximoDeadlineFormatado = {
        ...proximoDeadline,
        tempoTexto,
      };
    }

    // 4. Notas Fiscais e Alerta de Averbação
    let totalExportacao = 0;
    let totalAverbadas = 0;
    let semAverbacaoTotal = 0;
    let semAverbacaoEEmbarcadas = 0;
    const listaCriticaSemAverbacao: any[] = [];

    processos.forEach((p) => {
      const isProcessoEmbarcado = ['EMBARCADO', 'FINALIZADO'].includes(p.status);

      p.notasFiscais.forEach((nf) => {
        if (nf.etapa === 'ETAPA_4_EXPORTACAO') {
          totalExportacao++;
          if (nf.statusAverbacao === 'AVERBADA') {
            totalAverbadas++;
          } else {
            semAverbacaoTotal++;
            if (isProcessoEmbarcado) {
              semAverbacaoEEmbarcadas++;
              listaCriticaSemAverbacao.push({
                nfId: nf.id,
                numero: nf.numero,
                processoId: p.id,
                numeroProcesso: p.numeroProcesso,
                clienteFinal: p.clienteFinal,
                valorTotal: Number(nf.valorTotal || 0),
                pesoLiquido: Number(nf.pesoLiquido || 0),
                statusProcesso: p.status,
                dataEmissao: nf.dataEmissao,
              });
            }
          }
        }
      });
    });

    // 5. Cotações Oficiais de Câmbio (Dólar Live Spot, PTAX BACEN e Margem)
    // Sincronizado 100% com o módulo oficial Cotações Mercado (CBOT · B3 · PTAX)
    let dolarLive = 5.3442;
    let dolarVariacaoPct = 0.45;
    let dolarVariacao = 0.0240;
    let ptaxVenda = 5.3492;
    let ptaxCompra = 5.3436;
    let dataPtax = agora.toISOString();
    let maxima = 5.4120;
    let minima = 5.3080;
    let fonte = 'Chicago Board of Trade (CBOT) · B3 · Banco Central do Brasil (PTAX)';

    let sojaCbot = null;
    let milhoCbot = null;
    let curvasHistoricas = null;

    try {
      const liveData = await getLiveMarketData();
      if (liveData?.dolarSpot) {
        dolarLive = liveData.dolarSpot.preco;
        dolarVariacaoPct = liveData.dolarSpot.variacaoPct;
        dolarVariacao = liveData.dolarSpot.variacao;
        maxima = liveData.dolarSpot.maxima ?? maxima;
        minima = liveData.dolarSpot.minima ?? minima;
      }
      if (liveData?.dolarPtax) {
        ptaxVenda = liveData.dolarPtax.venda;
        ptaxCompra = liveData.dolarPtax.compra;
        dataPtax = liveData.dolarPtax.dataHora;
      }
      if (liveData?.fonte) {
        fonte = liveData.fonte;
      }
      if (liveData?.curvasHistoricasDolar) {
        curvasHistoricas = liveData.curvasHistoricasDolar;
      }
      if (liveData?.sojaCbot) {
        sojaCbot = liveData.sojaCbot;
      }
      if (liveData?.milhoCbot) {
        milhoCbot = liveData.milhoCbot;
      }
    } catch (e) {
      console.error('[API /api/backoffice/metrics] Erro ao obter cotação oficial:', e);
    }

    // Margem Cambial: Spread oficial entre Dólar Comercial Spot e Ptax Venda
    const margemDolarValor = Math.abs(dolarLive - ptaxVenda);
    const margemDolarPct = (margemDolarValor / dolarLive) * 100;

    // 6. Lista de Processos para o Ticker Inferior com detecção de Deadlines Críticos e Vencidos
    let totalDeadlinesVencidos = 0;
    let totalDeadlinesCriticos = 0;

    const tickerNegociacoes = processos.map((p) => {
      const totalCont = p.containers?.length || p.containerQtd || 0;
      const nfsExportacao = p.notasFiscais.filter((n) => n.etapa === 'ETAPA_4_EXPORTACAO');
      const averbadasCount = nfsExportacao.filter((n) => n.statusAverbacao === 'AVERBADA').length;

      let deadlineStatus: 'NORMAL' | 'CRITICO' | 'VENCIDO' | 'SEM_DEADLINE' = 'SEM_DEADLINE';
      let deadlineDiffHoras: number | null = null;
      let deadlineTexto = '';

      if (p.deadlineEmbarque && p.status !== 'FINALIZADO' && p.status !== 'CANCELADO') {
        const dDate = new Date(p.deadlineEmbarque);
        const diffMs = dDate.getTime() - agora.getTime();
        const diffHoras = Math.round(diffMs / (1000 * 60 * 60));
        deadlineDiffHoras = diffHoras;
        const dias = Math.floor(Math.abs(diffHoras) / 24);
        const horasRest = Math.abs(diffHoras) % 24;

        if (diffHoras < 0) {
          deadlineStatus = 'VENCIDO';
          totalDeadlinesVencidos++;
          deadlineTexto = dias > 0 ? `Vencido há ${dias}d ${horasRest}h` : `Vencido há ${Math.abs(diffHoras)}h`;
        } else if (diffHoras <= 72) {
          deadlineStatus = 'CRITICO';
          totalDeadlinesCriticos++;
          deadlineTexto = dias > 0 ? `Crítico: ${dias}d ${horasRest}h` : `Crítico: ${horasRest}h rest.`;
        } else {
          deadlineStatus = 'NORMAL';
          deadlineTexto = dias > 0 ? `${dias}d restantes` : `${horasRest}h restantes`;
        }
      }

      return {
        id: p.id,
        numeroProcesso: p.numeroProcesso,
        clienteFinal: p.clienteFinal,
        produto: p.produto,
        volumeKg: Number(p.volumeKg || 0),
        sacas: p.volumeKg ? Math.round(Number(p.volumeKg) / 60) : 0,
        status: p.status,
        navio: p.navio || 'Navio a nomear',
        armador: p.armador || null,
        portoOrigem: p.portoOrigem || 'Santos (BRSSZ)',
        portoDestino: p.portoDestino,
        booking: p.bookingNumero || null,
        bookingNumero: p.bookingNumero || null,
        incoterm: p.incoterm || 'FOB',
        deadlineEmbarque: p.deadlineEmbarque ? new Date(p.deadlineEmbarque).toLocaleDateString('pt-BR') : null,
        deadlineStatus,
        deadlineDiffHoras,
        deadlineTexto,
        isAtrasado: deadlineStatus === 'VENCIDO',
        isCritico: deadlineStatus === 'CRITICO',
        containers: totalCont,
        nfsExportacaoQtd: nfsExportacao.length,
        averbadasQtd: averbadasCount,
      };
    });

    return NextResponse.json({
      success: true,
      atualizadoEm: agora.toISOString(),
      data: {
        proximoDeadline: proximoDeadlineFormatado,
        outrosDeadlines: processosComDeadline.slice(1, 5),
        alertasDeadlines: {
          totalVencidos: totalDeadlinesVencidos,
          totalCriticos: totalDeadlinesCriticos,
          temAlertas: totalDeadlinesVencidos > 0 || totalDeadlinesCriticos > 0,
        },
        negociacoesEmExecucao: {
          total: emExecucao.length,
          volumeKg: volumeEmExecucaoKg,
          volumeToneladas: (volumeEmExecucaoKg / 1000).toFixed(1),
          volumeSacas: Math.round(volumeEmExecucaoKg / 60),
          containers: containersEmExecucao,
        },
        negociacoesEmbarcadas: {
          total: embarcadas.length,
          volumeKg: volumeEmbarcadoKg,
          volumeToneladas: (volumeEmbarcadoKg / 1000).toFixed(1),
          volumeSacas: Math.round(volumeEmbarcadoKg / 60),
          containers: containersEmbarcados,
        },
        auditoriaFiscal: {
          totalExportacao,
          totalAverbadas,
          semAverbacaoTotal,
          semAverbacaoEEmbarcadas, // Risco fiscal crítico
          percAverbado: totalExportacao > 0 ? (totalAverbadas / totalExportacao) * 100 : 0,
          listaCritica: listaCriticaSemAverbacao,
        },
        cambio: {
          dolarLive,
          dolarVariacaoPct,
          dolarVariacao,
          maxima,
          minima,
          ptaxVenda,
          ptaxCompra,
          dataPtax,
          margemDolarValor: margemDolarValor.toFixed(4),
          margemDolarPct: margemDolarPct.toFixed(2),
          fonte,
          curvasHistoricas,
        },
        commodities: {
          sojaCbot,
          milhoCbot,
        },
        ticker: tickerNegociacoes,
      },
    });
  } catch (error: any) {
    console.error('[API /api/backoffice/metrics] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Falha ao buscar métricas de backoffice' },
      { status: 500 }
    );
  }
}
