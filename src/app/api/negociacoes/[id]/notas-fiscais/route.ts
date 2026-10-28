import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: processoId } = await context.params;

    const processo = await prisma.processo.findUnique({
      where: { id: processoId },
      include: {
        containers: { orderBy: { ordem: 'asc' } },
      },
    });

    if (!processo) {
      return NextResponse.json(
        { success: false, error: 'Negociação não encontrada' },
        { status: 404 }
      );
    }

    // Buscar todas as notas fiscais da negociação com relações completas
    const notas = await prisma.notaFiscal.findMany({
      where: { processoId },
      include: {
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

    const etapa1 = notas.filter((n) => n.etapa === 'ETAPA_1_ENTRADA_INDUSTRIA');
    const etapa2 = notas.filter((n) => n.etapa === 'ETAPA_2_RETORNO_ARMAZENAGEM');
    const etapa3 = notas.filter((n) => n.etapa === 'ETAPA_3_REMESSA_REDEX');
    const etapa4 = notas.filter((n) => n.etapa === 'ETAPA_4_EXPORTACAO');

    // Cálculos de Resumo
    const totalEntradaKg = etapa1.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const totalRetornoKg = etapa2.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const saldoEntradaPendenteKg = Math.max(0, totalEntradaKg - totalRetornoKg);
    const percRetornado = totalEntradaKg > 0 ? Math.min(100, (totalRetornoKg / totalEntradaKg) * 100) : 0;

    const totalRedexEmitidoKg = etapa3.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const totalRedexSaldoDisponivelKg = etapa3.reduce((acc, n) => acc + Number(n.saldoDisponivelKg || 0), 0);
    const totalRedexConsumidoKg = Math.max(0, totalRedexEmitidoKg - totalRedexSaldoDisponivelKg);
    const qtdRedexZeradas = etapa3.filter((n) => n.saldoZerado || Number(n.saldoDisponivelKg || 0) <= 0.001).length;
    const qtdRedexAbertas = etapa3.length - qtdRedexZeradas;

    const totalExportacaoKg = etapa4.reduce((acc, n) => acc + Number(n.pesoLiquido || 0), 0);
    const qtdExportacaoAverbada = etapa4.filter((n) => n.statusAverbacao === 'AVERBADA').length;
    const qtdExportacaoPendenteAverbacao = etapa4.length - qtdExportacaoAverbada;

    const totalContainers = processo.containers.length;
    const containersComNf = new Set(etapa4.map((n) => n.containerId).filter(Boolean)).size;

    return NextResponse.json({
      success: true,
      data: {
        processo: {
          id: processo.id,
          numeroProcesso: processo.numeroProcesso,
          volumeKg: Number(processo.volumeKg || 0),
          containers: processo.containers,
        },
        resumo: {
          totalEntradaKg,
          totalRetornoKg,
          saldoEntradaPendenteKg,
          percRetornado,
          totalRedexEmitidoKg,
          totalRedexConsumidoKg,
          totalRedexSaldoDisponivelKg,
          qtdRedexZeradas,
          qtdRedexAbertas,
          totalExportacaoKg,
          qtdExportacaoAverbada,
          qtdExportacaoPendenteAverbacao,
          totalContainers,
          containersComNf,
        },
        etapas: {
          etapa1,
          etapa2,
          etapa3,
          etapa4,
        },
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar notas fiscais:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao buscar notas fiscais da negociação' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: processoId } = await context.params;
    const user = await getSessionUser();
    const body = await request.json();

    const {
      etapa,
      numero,
      serie = '1',
      chaveAcesso,
      dataEmissao,
      emitente,
      emitenteCnpj,
      destinatario,
      destinatarioCnpj,
      cfop,
      pesoBruto,
      pesoLiquido,
      quantidadeSacas,
      valorTotal,
      anexoUrl,
      anexoNome,
      observacoes,
      // Para Etapa 2:
      referenciasEtapa1, // Array<{ notaEntradaId: string, pesoRetornadoKg?: number }>
      // Para Etapa 4:
      containerId,
      itensEtapa3, // Array<{ notaLoteRedexId: string, pesoConsumidoKg: number }>
    } = body;

    // Validações básicas obrigatórias para qualquer nota
    if (!etapa || !numero || !dataEmissao || !emitente || !destinatario) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: Etapa, Número, Data de Emissão, Emitente e Destinatário.' },
        { status: 400 }
      );
    }

    const numPesoLiquido = Number(pesoLiquido || 0);

    // =========================================================================
    // REGRA ETAPA 4 - EXPORTAÇÃO
    // =========================================================================
    if (etapa === 'ETAPA_4_EXPORTACAO') {
      if (!containerId) {
        return NextResponse.json(
          { success: false, error: 'Para a NF de Exportação (Etapa 4), o vínculo com um contêiner específico é obrigatório.' },
          { status: 400 }
        );
      }

      if (!Array.isArray(itensEtapa3) || itensEtapa3.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Informe ao menos 1 Nota Fiscal da Etapa 3 (Formação de Lote) referenciada para este contêiner.' },
          { status: 400 }
        );
      }

      // Regra de negócio estrita: De 1 até no máximo 3 Notas Fiscais da Etapa 3
      if (itensEtapa3.length > 3) {
        return NextResponse.json(
          { success: false, error: 'Bloqueado: Uma NF de Exportação pode referenciar no máximo até 3 Notas Fiscais da Etapa 3 (Formação de Lote REDEX).' },
          { status: 400 }
        );
      }

      // Validar cada nota da Etapa 3 e conferir saldo disponível
      let somaPesosConsumidos = 0;
      const notasEtapa3Validadas: Array<{ id: string; numero: string; saldoAtual: number; pesoConsumido: number }> = [];

      for (const item of itensEtapa3) {
        const pesoConsumo = Number(item.pesoConsumidoKg || 0);
        if (pesoConsumo <= 0) {
          return NextResponse.json(
            { success: false, error: 'O peso consumido de cada nota referenciada da Etapa 3 deve ser maior que 0 kg.' },
            { status: 400 }
          );
        }

        const nfEtapa3 = await prisma.notaFiscal.findUnique({
          where: { id: item.notaLoteRedexId },
        });

        if (!nfEtapa3 || nfEtapa3.etapa !== 'ETAPA_3_REMESSA_REDEX') {
          return NextResponse.json(
            { success: false, error: `Nota Fiscal de lote REDEX (${item.notaLoteRedexId}) não foi encontrada.` },
            { status: 400 }
          );
        }

        const saldoAtual = Number(nfEtapa3.saldoDisponivelKg ?? nfEtapa3.pesoLiquido ?? 0);

        // Bloquear se o peso informado para consumo for maior do que o saldo disponível atual daquela nota
        if (pesoConsumo > saldoAtual + 0.001) {
          return NextResponse.json(
            {
              success: false,
              error: `Saldo insuficiente na NF ${nfEtapa3.numero}: peso informado (${pesoConsumo.toLocaleString('pt-BR')} kg) é maior que o saldo disponível (${saldoAtual.toLocaleString('pt-BR')} kg).`,
            },
            { status: 400 }
          );
        }

        somaPesosConsumidos += pesoConsumo;
        notasEtapa3Validadas.push({
          id: nfEtapa3.id,
          numero: nfEtapa3.numero,
          saldoAtual,
          pesoConsumido: pesoConsumo,
        });
      }

      // O peso líquido da NF de Exportação deve refletir a soma dos pesos consumidos
      const pesoFinalExportacao = numPesoLiquido > 0 ? numPesoLiquido : somaPesosConsumidos;

      // Executar criação e abatimento de saldos
      const novaNfExportacao = await prisma.$transaction(async (tx: any) => {
        // 1. Criar a NF da Etapa 4
        const createdNf = await tx.notaFiscal.create({
          data: {
            processoId,
            etapa: 'ETAPA_4_EXPORTACAO',
            numero: String(numero).trim(),
            serie: String(serie || '1').trim(),
            chaveAcesso: chaveAcesso ? String(chaveAcesso).replace(/\D/g, '') : null,
            dataEmissao: new Date(dataEmissao),
            emitente: String(emitente).trim(),
            emitenteCnpj: emitenteCnpj ? String(emitenteCnpj).trim() : null,
            destinatario: String(destinatario).trim(),
            destinatarioCnpj: destinatarioCnpj ? String(destinatarioCnpj).trim() : null,
            cfop: cfop ? String(cfop).trim() : '7.101',
            pesoBruto: pesoBruto ? Number(pesoBruto) : null,
            pesoLiquido: pesoFinalExportacao,
            quantidadeSacas: quantidadeSacas ? Number(quantidadeSacas) : null,
            valorTotal: valorTotal ? Number(valorTotal) : null,
            anexoUrl: anexoUrl || null,
            anexoNome: anexoNome || null,
            containerId,
            statusSefaz: 'AUTORIZADA',
            statusAverbacao: 'AGUARDANDO',
            observacoes: observacoes || null,
          },
        });

        // 2. Abater saldos das NFs da Etapa 3 e criar itens de vínculo
        for (const itemValidado of notasEtapa3Validadas) {
          const novoSaldo = Math.max(0, itemValidado.saldoAtual - itemValidado.pesoConsumido);
          const saldoZerado = novoSaldo <= 0.001;

          await tx.notaFiscal.update({
            where: { id: itemValidado.id },
            data: {
              saldoDisponivelKg: novoSaldo,
              saldoZerado,
            },
          });

          await tx.notaFiscalExportacaoItem.create({
            data: {
              notaExportacaoId: createdNf.id,
              notaLoteRedexId: itemValidado.id,
              pesoConsumidoKg: itemValidado.pesoConsumido,
            },
          });
        }

        return createdNf;
      });

      // Registrar auditoria
      try {
        await prisma.auditLog.create({
          data: {
            processoId,
            usuarioId: user?.id || 'usr_dev_admin',
            acao: 'EMISSAO_NF_EXPORTACAO',
            detalhe: `Cadastrada NF de Exportação ${novaNfExportacao.numero} (${pesoFinalExportacao.toLocaleString('pt-BR')} kg) vinculada ao contêiner com baixa em ${notasEtapa3Validadas.length} NF(s) de lote REDEX.`,
          },
        });
      } catch (err) {
        console.warn('Falha ao gravar audit log:', err);
      }

      return NextResponse.json({
        success: true,
        data: novaNfExportacao,
        message: 'Nota Fiscal de Exportação cadastrada e saldos da Etapa 3 abatidos com sucesso.',
      });
    }

    // =========================================================================
    // REGRA ETAPA 3 - FORMAÇÃO DE LOTE REDEX
    // =========================================================================
    if (etapa === 'ETAPA_3_REMESSA_REDEX') {
      if (numPesoLiquido <= 0) {
        return NextResponse.json(
          { success: false, error: 'O peso líquido da NF de Formação de Lote deve ser maior que 0 kg.' },
          { status: 400 }
        );
      }

      // O Saldo Disponível inicia exatamente igual ao peso líquido da nota
      const novaNfEtapa3 = await prisma.notaFiscal.create({
        data: {
          processoId,
          etapa: 'ETAPA_3_REMESSA_REDEX',
          numero: String(numero).trim(),
          serie: String(serie || '1').trim(),
          chaveAcesso: chaveAcesso ? String(chaveAcesso).replace(/\D/g, '') : null,
          dataEmissao: new Date(dataEmissao),
          emitente: String(emitente).trim(),
          emitenteCnpj: emitenteCnpj ? String(emitenteCnpj).trim() : null,
          destinatario: String(destinatario).trim(),
          destinatarioCnpj: destinatarioCnpj ? String(destinatarioCnpj).trim() : null,
          cfop: cfop ? String(cfop).trim() : '5.501',
          pesoBruto: pesoBruto ? Number(pesoBruto) : null,
          pesoLiquido: numPesoLiquido,
          saldoDisponivelKg: numPesoLiquido,
          saldoZerado: false,
          quantidadeSacas: quantidadeSacas ? Number(quantidadeSacas) : null,
          valorTotal: valorTotal ? Number(valorTotal) : null,
          anexoUrl: anexoUrl || null,
          anexoNome: anexoNome || null,
          statusSefaz: 'AUTORIZADA',
          observacoes: observacoes || null,
        },
      });

      return NextResponse.json({
        success: true,
        data: novaNfEtapa3,
        message: 'Nota Fiscal de Formação de Lote (REDEX) cadastrada com saldo inicial aberto.',
      });
    }

    // =========================================================================
    // REGRA ETAPA 2 - RETORNO DE ARMAZENAGEM
    // =========================================================================
    if (etapa === 'ETAPA_2_RETORNO_ARMAZENAGEM') {
      const novaNfEtapa2 = await prisma.$transaction(async (tx: any) => {
        const createdNf = await tx.notaFiscal.create({
          data: {
            processoId,
            etapa: 'ETAPA_2_RETORNO_ARMAZENAGEM',
            numero: String(numero).trim(),
            serie: String(serie || '1').trim(),
            chaveAcesso: chaveAcesso ? String(chaveAcesso).replace(/\D/g, '') : null,
            dataEmissao: new Date(dataEmissao),
            emitente: String(emitente).trim(),
            emitenteCnpj: emitenteCnpj ? String(emitenteCnpj).trim() : null,
            destinatario: String(destinatario).trim(),
            destinatarioCnpj: destinatarioCnpj ? String(destinatarioCnpj).trim() : null,
            cfop: cfop ? String(cfop).trim() : '5.902',
            pesoBruto: pesoBruto ? Number(pesoBruto) : null,
            pesoLiquido: numPesoLiquido,
            quantidadeSacas: quantidadeSacas ? Number(quantidadeSacas) : null,
            valorTotal: valorTotal ? Number(valorTotal) : null,
            anexoUrl: anexoUrl || null,
            anexoNome: anexoNome || null,
            statusSefaz: 'AUTORIZADA',
            observacoes: observacoes || null,
          },
        });

        // Vincular notas de entrada referenciadas da Etapa 1
        if (Array.isArray(referenciasEtapa1) && referenciasEtapa1.length > 0) {
          for (const ref of referenciasEtapa1) {
            if (ref.notaEntradaId) {
              await tx.notaFiscalRetornoItem.create({
                data: {
                  notaRetornoId: createdNf.id,
                  notaEntradaId: ref.notaEntradaId,
                  pesoRetornadoKg: ref.pesoRetornadoKg ? Number(ref.pesoRetornadoKg) : null,
                },
              });
            }
          }
        }

        return createdNf;
      });

      return NextResponse.json({
        success: true,
        data: novaNfEtapa2,
        message: 'Nota Fiscal de Retorno de Armazenagem cadastrada com sucesso.',
      });
    }

    // =========================================================================
    // REGRA ETAPA 1 - ENTRADA PARA A INDÚSTRIA
    // =========================================================================
    const novaNfEtapa1 = await prisma.notaFiscal.create({
      data: {
        processoId,
        etapa: 'ETAPA_1_ENTRADA_INDUSTRIA',
        numero: String(numero).trim(),
        serie: String(serie || '1').trim(),
        chaveAcesso: chaveAcesso ? String(chaveAcesso).replace(/\D/g, '') : null,
        dataEmissao: new Date(dataEmissao),
        emitente: String(emitente).trim(),
        emitenteCnpj: emitenteCnpj ? String(emitenteCnpj).trim() : null,
        destinatario: String(destinatario).trim(),
        destinatarioCnpj: destinatarioCnpj ? String(destinatarioCnpj).trim() : null,
        cfop: cfop ? String(cfop).trim() : '5.901',
        pesoBruto: pesoBruto ? Number(pesoBruto) : null,
        pesoLiquido: numPesoLiquido,
        quantidadeSacas: quantidadeSacas ? Number(quantidadeSacas) : null,
        valorTotal: valorTotal ? Number(valorTotal) : null,
        anexoUrl: anexoUrl || null,
        anexoNome: anexoNome || null,
        statusSefaz: 'AUTORIZADA',
        observacoes: observacoes || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: novaNfEtapa1,
      message: 'Nota Fiscal de Entrada para a Indústria cadastrada com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao cadastrar nota fiscal:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Falha ao salvar nota fiscal' },
      { status: 500 }
    );
  }
}
