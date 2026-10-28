import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; notaId: string }> }
) {
  try {
    const { id: processoId, notaId } = await context.params;
    const user = await getSessionUser();

    const nota = await prisma.notaFiscal.findUnique({
      where: { id: notaId },
      include: {
        itensExportacao: {
          include: {
            notaLoteRedex: true,
          },
        },
        consumosEmExportacao: {
          include: {
            notaExportacao: true,
          },
        },
        retornosComoOrigem: true,
        entradasReferenciadas: true,
      },
    });

    if (!nota || nota.processoId !== processoId) {
      return NextResponse.json(
        { success: false, error: 'Nota fiscal não encontrada nesta negociação.' },
        { status: 404 }
      );
    }

    // =========================================================================
    // REGRA DE EXCLUSÃO ETAPA 3 (FORMAÇÃO DE LOTE REDEX)
    // =========================================================================
    if (nota.etapa === 'ETAPA_3_REMESSA_REDEX') {
      const consumos = await prisma.notaFiscalExportacaoItem.findMany({
        where: { notaLoteRedexId: notaId },
      });

      if (consumos.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Bloqueado: Esta NF de Lote REDEX já teve peso estufado/consumido por ${consumos.length} NF(s) de exportação. Exclua primeiro a(s) NF(s) de Exportação vinculada(s) para estornar o saldo antes de deletar esta nota.`,
          },
          { status: 400 }
        );
      }

      await prisma.notaFiscal.delete({ where: { id: notaId } });

      try {
        await prisma.auditLog.create({
          data: {
            processoId,
            usuarioId: user?.id || 'usr_dev_admin',
            acao: 'EXCLUSAO_NF_REDEX',
            detalhe: `Excluída NF de Formação de Lote REDEX nº ${nota.numero}.`,
          },
        });
      } catch (err) {
        console.warn('Falha ao gravar audit log:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Nota Fiscal de Formação de Lote excluída com sucesso.',
      });
    }

    // =========================================================================
    // REGRA DE EXCLUSÃO ETAPA 4 (EXPORTAÇÃO) - ESTORNO AUTOMÁTICO DE SALDO
    // =========================================================================
    if (nota.etapa === 'ETAPA_4_EXPORTACAO') {
      // Buscar todos os consumos desta NF de Exportação
      const consumos = await prisma.notaFiscalExportacaoItem.findMany({
        where: { notaExportacaoId: notaId },
      });

      await prisma.$transaction(async (tx: any) => {
        // Estornar automaticamente o peso consumido de volta para as NFs da Etapa 3
        for (const item of consumos) {
          const nfEtapa3 = await tx.notaFiscal.findUnique({
            where: { id: item.notaLoteRedexId },
          });

          if (nfEtapa3) {
            const pesoConsumido = Number(item.pesoConsumidoKg || 0);
            const saldoAtual = Number(nfEtapa3.saldoDisponivelKg || 0);
            const pesoOriginal = Number(nfEtapa3.pesoLiquido || 0);
            const novoSaldo = Math.min(pesoOriginal, saldoAtual + pesoConsumido);

            await tx.notaFiscal.update({
              where: { id: nfEtapa3.id },
              data: {
                saldoDisponivelKg: novoSaldo,
                saldoZerado: novoSaldo <= 0.001,
              },
            });
          }
        }

        // Deletar os vínculos de consumo
        await tx.notaFiscalExportacaoItem.deleteMany({
          where: { notaExportacaoId: notaId },
        });

        // Deletar a NF de exportação
        await tx.notaFiscal.delete({
          where: { id: notaId },
        });
      });

      try {
        await prisma.auditLog.create({
          data: {
            processoId,
            usuarioId: user?.id || 'usr_dev_admin',
            acao: 'ESTORNO_NF_EXPORTACAO',
            detalhe: `Excluída NF de Exportação nº ${nota.numero}. Os pesos foram estornados automaticamente de volta ao saldo das respectivas NFs de lote REDEX (Etapa 3).`,
          },
        });
      } catch (err) {
        console.warn('Falha ao gravar audit log:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Nota Fiscal de Exportação excluída e saldos estornados com sucesso.',
      });
    }

    // =========================================================================
    // ETAPAS 1 E 2
    // =========================================================================
    await prisma.$transaction(async (tx: any) => {
      await tx.notaFiscalRetornoItem.deleteMany({
        where: {
          OR: [{ notaRetornoId: notaId }, { notaEntradaId: notaId }],
        },
      });

      await tx.notaFiscal.delete({
        where: { id: notaId },
      });
    });

    try {
      await prisma.auditLog.create({
        data: {
          processoId,
          usuarioId: user?.id || 'usr_dev_admin',
          acao: 'EXCLUSAO_NF',
          detalhe: `Excluída Nota Fiscal nº ${nota.numero} (${nota.etapa}).`,
        },
      });
    } catch (err) {
      console.warn('Falha ao gravar audit log:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Nota Fiscal excluída com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao excluir nota fiscal:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Falha ao excluir nota fiscal' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; notaId: string }> }
) {
  try {
    const { id: processoId, notaId } = await context.params;
    const user = await getSessionUser();
    const body = await request.json();

    const nota = await prisma.notaFiscal.findUnique({
      where: { id: notaId },
    });

    if (!nota || nota.processoId !== processoId) {
      return NextResponse.json(
        { success: false, error: 'Nota fiscal não encontrada nesta negociação.' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (body.chaveAcesso !== undefined) {
      updateData.chaveAcesso = body.chaveAcesso ? String(body.chaveAcesso).replace(/\D/g, '') : null;
    }
    if (body.numero !== undefined) updateData.numero = String(body.numero).trim();
    if (body.serie !== undefined) updateData.serie = String(body.serie).trim();
    if (body.cfop !== undefined) updateData.cfop = String(body.cfop).trim();
    if (body.emitente !== undefined) updateData.emitente = String(body.emitente).trim();
    if (body.destinatario !== undefined) updateData.destinatario = String(body.destinatario).trim();
    if (body.anexoUrl !== undefined) updateData.anexoUrl = body.anexoUrl;
    if (body.anexoNome !== undefined) updateData.anexoNome = body.anexoNome;
    if (body.observacoes !== undefined) updateData.observacoes = body.observacoes;
    if (body.statusSefaz !== undefined) updateData.statusSefaz = body.statusSefaz;
    if (body.statusAverbacao !== undefined) updateData.statusAverbacao = body.statusAverbacao;
    if (body.numeroDue !== undefined) updateData.numeroDue = body.numeroDue;
    if (body.protocoloSefaz !== undefined) updateData.protocoloSefaz = body.protocoloSefaz;
    if (body.mensagemSefaz !== undefined) updateData.mensagemSefaz = body.mensagemSefaz;

    const atualizada = await prisma.notaFiscal.update({
      where: { id: notaId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: atualizada,
      message: 'Nota fiscal atualizada com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar nota fiscal:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Falha ao atualizar nota fiscal' },
      { status: 500 }
    );
  }
}
