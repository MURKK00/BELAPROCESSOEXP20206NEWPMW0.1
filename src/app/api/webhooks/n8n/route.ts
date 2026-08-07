import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Endpoint que os fluxos n8n (aba "Primeiros Passos n8n" da planilha) chamam
 * quando um evento automatizável acontece — ex: certificado de fumigação
 * chegou por e-mail, DU-E foi averbada, cliente respondeu aprovando o
 * pacote de documentos.
 *
 * Fluxo sugerido no n8n: Trigger (IMAP/Webhook) -> parse -> POST aqui.
 *
 * Todo evento é gravado em WebhookEvent primeiro (mesmo se o processamento
 * falhar depois), para nunca perder rastreabilidade de automação.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-n8n-secret');
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const payload = await req.json();

  const event = await prisma.webhookEvent.create({
    data: { origem: 'n8n', evento: payload.evento ?? 'desconhecido', payload },
  });

  try {
    switch (payload.evento) {
      case 'etapa.concluida': {
        await prisma.processoEtapa.updateMany({
          where: {
            processoId: payload.processoId,
            etapaTemplate: { numero: payload.etapaNumero },
          },
          data: { status: 'CONCLUIDA', concluidoEm: new Date() },
        });
        break;
      }
      // TODO: "documento.recebido" (anexa certificado ao processo/etapa certos)
      // TODO: "cliente.aprovou_pacote" (destrava fase Fechamento Bancário)
      default:
        break;
    }

    await prisma.webhookEvent.update({ where: { id: event.id }, data: { processado: true } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { erro: err instanceof Error ? err.message : String(err) },
    });
    return NextResponse.json({ ok: false, error: 'Falha ao processar evento' }, { status: 500 });
  }
}
