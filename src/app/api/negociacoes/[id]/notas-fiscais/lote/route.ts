import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { parseNumeroBR } from '@/lib/numeroBR';
import { formatarCfop, obterRotuloEtapa, validarCfopEtapa } from '@/lib/cfopPorEtapa';

export const dynamic = 'force-dynamic';

const ETAPAS_LOTE_PERMITIDAS = [
  'ETAPA_1_ENTRADA_INDUSTRIA',
  'ETAPA_2_RETORNO_ARMAZENAGEM',
  'ETAPA_3_REMESSA_REDEX',
  'ETAPA_5_AJUSTE_FISCAL',
];

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado. Faça login.' },
        { status: 401 }
      );
    }

    const { id: processoId } = await context.params;
    const body = await request.json();

    const { etapa, notas, confirmarCfopForaPadrao = false } = body;

    if (!etapa || !ETAPAS_LOTE_PERMITIDAS.includes(etapa)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Etapa inválida para lançamento em lote. O lançamento em lote é permitido para as Etapas 1, 2, 3 e 5 (Ajuste Fiscal).',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(notas) || notas.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma nota fiscal informada no lote.' },
        { status: 400 }
      );
    }

    // Validar CFOPs de todas as notas do lote antes de gravar
    const itensDivergentes: Array<{
      numero: string;
      cfopInformado: string;
      motivo: string;
    }> = [];

    for (const item of notas) {
      const cfopCheck = validarCfopEtapa(etapa, item.cfop);
      const itemConfirmado = Boolean(confirmarCfopForaPadrao || item.confirmarCfopForaPadrao);
      if (!cfopCheck.valido && !itemConfirmado) {
        itensDivergentes.push({
          numero: String(item.numero || 'S/N'),
          cfopInformado: cfopCheck.cfopFormatado || '(vazio)',
          motivo: cfopCheck.motivo || 'CFOP fora do padrão da etapa.',
        });
      }
    }

    if (itensDivergentes.length > 0) {
      const resumoNfs = itensDivergentes
        .slice(0, 5)
        .map((d) => `NF ${d.numero} (CFOP ${d.cfopInformado})`)
        .join(', ');
      const permitidos = validarCfopEtapa(etapa, '').permitidosCodigos.join(', ');
      return NextResponse.json(
        {
          success: false,
          requiresCfopConfirmation: true,
          error: `${itensDivergentes.length} NF(s) com CFOP fora do padrão de ${obterRotuloEtapa(etapa)} (${resumoNfs}). Esperado: ${permitidos}. Deseja anexar mesmo assim?`,
          itensDivergentes,
          cfopsPermitidos: validarCfopEtapa(etapa, '').permitidos,
        },
        { status: 422 }
      );
    }

    const processo = await prisma.processo.findUnique({
      where: { id: processoId },
    });

    if (!processo) {
      return NextResponse.json(
        { success: false, error: 'Negociação não encontrada.' },
        { status: 404 }
      );
    }

    // Buscar chaves já existentes na negociação para evitar duplicações
    const notasExistentes = await prisma.notaFiscal.findMany({
      where: { processoId },
      select: { id: true, numero: true, chaveAcesso: true },
    });
    const chavesExistentes = new Set(notasExistentes.map((n) => n.chaveAcesso).filter(Boolean));

    const notasCriadas = await prisma.$transaction(async (tx: any) => {
      const criadas = [];

      for (const item of notas) {
        const chaveLimpa = (item.chaveAcesso || '').replace(/\D/g, '') || null;

        // Se já existe uma nota com a mesma chave, ignora para evitar duplicação
        if (chaveLimpa && chavesExistentes.has(chaveLimpa)) {
          console.warn(`[Lote XML] NF com chave ${chaveLimpa} já existe. Pulando duplicação.`);
          continue;
        }

        const pesoLiquidoNum = parseNumeroBR(item.pesoLiquido) ?? 0;
        const pesoBrutoNum = parseNumeroBR(item.pesoBruto);
        const valorTotalNum = parseNumeroBR(item.valorTotal);
        const sacasParsed = parseNumeroBR(item.quantidadeSacas);
        const sacasNum = sacasParsed !== null ? Math.round(sacasParsed) : null;
        const cfopLimpo = item.cfop ? formatarCfop(item.cfop) || null : null;

        const novaNota = await tx.notaFiscal.create({
          data: {
            processoId,
            etapa,
            numero: String(item.numero || '0').trim(),
            serie: String(item.serie || '1').trim(),
            chaveAcesso: chaveLimpa,
            dataEmissao: item.dataEmissao ? new Date(item.dataEmissao) : new Date(),
            emitente: String(item.emitente || 'Emitente').trim(),
            emitenteCnpj: item.emitenteCnpj ? String(item.emitenteCnpj).trim() : null,
            destinatario: String(item.destinatario || 'Destinatário').trim(),
            destinatarioCnpj: item.destinatarioCnpj ? String(item.destinatarioCnpj).trim() : null,
            cfop: cfopLimpo,
            pesoLiquido: pesoLiquidoNum,
            pesoBruto: pesoBrutoNum,
            quantidadeSacas: sacasNum,
            valorTotal: valorTotalNum,
            anexoUrl: item.anexoUrl || null,
            anexoNome: item.anexoNome || (item.nomeArquivo || `nfe_${item.numero}.xml`),
            observacoes: item.observacoes ? String(item.observacoes).trim() : null,
            statusSefaz: 'AUTORIZADA',
            statusAverbacao: 'AGUARDANDO',

            // Se for Etapa 3, o saldo disponível inicia exatamente igual ao peso líquido
            saldoDisponivelKg: etapa === 'ETAPA_3_REMESSA_REDEX' ? pesoLiquidoNum : null,
            saldoZerado: false,
          },
        });

        // Se for Etapa 2 e houver notas de entrada referenciadas:
        if (etapa === 'ETAPA_2_RETORNO_ARMAZENAGEM') {
          const refs = item.referenciasEtapa1;
          if (Array.isArray(refs) && refs.length > 0) {
            for (const ref of refs) {
              const notaEntradaId = typeof ref === 'string' ? ref : ref.notaEntradaId;
              if (notaEntradaId) {
                await tx.notaFiscalRetornoItem.create({
                  data: {
                    notaRetornoId: novaNota.id,
                    notaEntradaId,
                    pesoRetornadoKg:
                      typeof ref === 'object' && ref.pesoRetornadoKg
                        ? (parseNumeroBR(ref.pesoRetornadoKg) ?? pesoLiquidoNum)
                        : pesoLiquidoNum,
                  },
                });
              }
            }
          } else if (item.sugestaoNotaEntradaId) {
            await tx.notaFiscalRetornoItem.create({
              data: {
                notaRetornoId: novaNota.id,
                notaEntradaId: item.sugestaoNotaEntradaId,
                pesoRetornadoKg: pesoLiquidoNum,
              },
            });
          }
        }

        criadas.push(novaNota);
        if (chaveLimpa) chavesExistentes.add(chaveLimpa);
      }

      return criadas;
    });

    // Gravar auditoria
    try {
      const etapaNome = obterRotuloEtapa(etapa);

      await prisma.auditLog.create({
        data: {
          processoId,
          usuarioId: user.id,
          acao: 'IMPORTACAO_LOTE_XML_NF',
          detalhe: `Importado lote de ${notasCriadas.length} Nota(s) Fiscal(is) via arquivo(s) XML na ${etapaNome}.`,
        },
      });
    } catch (err) {
      console.warn('Falha ao gravar audit log:', err);
    }

    return NextResponse.json({
      success: true,
      totalCriadas: notasCriadas.length,
      message: `${notasCriadas.length} Nota(s) Fiscal(is) importada(s) com sucesso na ${obterRotuloEtapa(etapa)}!`,
      notas: notasCriadas,
    });
  } catch (error: any) {
    console.error('Erro ao importar lote de notas fiscais:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Falha ao salvar lote de notas fiscais' },
      { status: 500 }
    );
  }
}
