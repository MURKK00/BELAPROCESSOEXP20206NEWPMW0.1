import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { canManageCertificados } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import {
  CertEncryptionConfigError,
  criptografarSegredosCertificado,
  obterChaveCriptografiaCertificados,
} from '@/lib/certificadosCrypto';
import {
  CertificadoValidationError,
  extrairMetadadosCertificadoA1,
} from '@/lib/certificadosParser';
import {
  CERT_PUBLIC_SELECT,
  serializarCertificadoPublico,
} from '@/lib/certificadosServer';
import {
  FinalidadeCertificado,
  formatarDocumentoCertificado,
  formatarFinalidadeCertificado,
  MAX_CERT_UPLOAD_BYTES,
} from '@/lib/certificadosUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FINALIDADES_VALIDAS: FinalidadeCertificado[] = ['SEFAZ', 'SISCOMEX', 'AMBOS'];

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    if (!canManageCertificados(user)) {
      return NextResponse.json(
        { error: 'Acesso negado. Exclusivo para ADMIN e DIRETORIA.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const existente = await prisma.certificadoDigital.findUnique({
      where: { id },
      select: CERT_PUBLIC_SELECT,
    });

    if (!existente) {
      return NextResponse.json(
        { error: 'Certificado digital não encontrado.' },
        { status: 404 }
      );
    }

    const contentType = req.headers.get('content-type') || '';

    // Fluxo 1: Substituição do arquivo .pfx/.p12 + senha (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      obterChaveCriptografiaCertificados();

      const formData = await req.formData();
      const arquivo = formData.get('arquivo');
      const senhaRaw = formData.get('senha');
      const finalidadeForm = String(formData.get('finalidade') || existente.finalidade)
        .trim()
        .toUpperCase();

      if (!arquivo || !(arquivo instanceof File)) {
        return NextResponse.json(
          { error: 'Selecione o novo arquivo .pfx ou .p12 para substituição.' },
          { status: 400 }
        );
      }

      const nomeArquivo = arquivo.name.toLowerCase();
      if (!nomeArquivo.endsWith('.pfx') && !nomeArquivo.endsWith('.p12')) {
        return NextResponse.json(
          { error: 'Formato inválido. Apenas arquivos .pfx ou .p12 são aceitos.' },
          { status: 400 }
        );
      }

      if (arquivo.size <= 0 || arquivo.size > MAX_CERT_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: 'O arquivo deve ter tamanho entre 1 byte e 1 MB.' },
          { status: 400 }
        );
      }

      if (typeof senhaRaw !== 'string' || senhaRaw.length === 0) {
        return NextResponse.json(
          { error: 'Informe a senha do novo certificado digital.' },
          { status: 400 }
        );
      }

      if (!FINALIDADES_VALIDAS.includes(finalidadeForm as FinalidadeCertificado)) {
        return NextResponse.json(
          { error: 'Finalidade inválida. Selecione SEFAZ, SISCOMEX ou AMBOS.' },
          { status: 400 }
        );
      }
      const novaFinalidade = finalidadeForm as FinalidadeCertificado;

      const pfxBuffer = Buffer.from(await arquivo.arrayBuffer());
      const meta = extrairMetadadosCertificadoA1(pfxBuffer, senhaRaw);

      const conflito = await prisma.certificadoDigital.findFirst({
        where: {
          id: { not: id },
          documento: meta.documento,
          finalidade: novaFinalidade,
          ativo: true,
        },
        select: { id: true },
      });

      if (conflito) {
        return NextResponse.json(
          {
            error: `Já existe outro certificado ativo para ${meta.tipo} ${formatarDocumentoCertificado(meta.documento, meta.tipo)} na finalidade ${formatarFinalidadeCertificado(novaFinalidade)}.`,
          },
          { status: 409 }
        );
      }

      const cifrado = criptografarSegredosCertificado(pfxBuffer, senhaRaw);

      const atualizado = await prisma.certificadoDigital.update({
        where: { id },
        data: {
          tipo: meta.tipo,
          documento: meta.documento,
          titular: meta.titular,
          emissor: meta.emissor,
          validadeInicio: meta.validadeInicio,
          validadeFim: meta.validadeFim,
          finalidade: novaFinalidade,
          arquivoCriptografado: cifrado.arquivoCriptografado,
          senhaCriptografada: cifrado.senhaCriptografada,
          iv: cifrado.iv,
          authTag: cifrado.authTag,
          ativo: true,
        },
        select: CERT_PUBLIC_SELECT,
      });

      const docFormatado = formatarDocumentoCertificado(meta.documento, meta.tipo);

      try {
        await prisma.auditLog.create({
          data: {
            processoId: null,
            certificadoId: id,
            usuarioId: user.id,
            acao: 'CERTIFICADO_SUBSTITUIDO',
            detalhe: `Certificado substituído: ${meta.titular} (${meta.tipo} ${docFormatado}) · ${formatarFinalidadeCertificado(novaFinalidade)}`,
            alteracoes: {
              titularAnterior: existente.titular,
              titularNovo: meta.titular,
              documento: docFormatado,
              finalidadeAnterior: existente.finalidade,
              finalidadeNova: novaFinalidade,
              validadeFimNova: meta.validadeFim.toISOString(),
            },
          },
        });
      } catch (auditErr: any) {
        console.warn('[PATCH /api/certificados] Falha ao gravar AuditLog:', auditErr?.message || 'Erro');
      }

      return NextResponse.json({
        certificado: serializarCertificadoPublico(atualizado),
      });
    }

    // Fluxo 2: Ativar ou Desativar (application/json)
    const body = await req.json();
    if (typeof body?.ativo !== 'boolean') {
      return NextResponse.json(
        { error: 'Parâmetro "ativo" inválido.' },
        { status: 400 }
      );
    }

    const novoAtivo = body.ativo as boolean;

    if (novoAtivo) {
      if (new Date(existente.validadeFim).getTime() <= Date.now()) {
        return NextResponse.json(
          {
            error:
              'Não é possível reativar um certificado vencido. Utilize "Substituir" para enviar um arquivo válido.',
          },
          { status: 422 }
        );
      }

      const conflito = await prisma.certificadoDigital.findFirst({
        where: {
          id: { not: id },
          documento: existente.documento,
          finalidade: existente.finalidade,
          ativo: true,
        },
        select: { id: true },
      });

      if (conflito) {
        return NextResponse.json(
          {
            error: `Já existe outro certificado ativo para ${existente.tipo} ${formatarDocumentoCertificado(existente.documento, existente.tipo)} na finalidade ${formatarFinalidadeCertificado(existente.finalidade)}.`,
          },
          { status: 409 }
        );
      }
    }

    const atualizado = await prisma.certificadoDigital.update({
      where: { id },
      data: { ativo: novoAtivo },
      select: CERT_PUBLIC_SELECT,
    });

    const docFormatado = formatarDocumentoCertificado(
      existente.documento,
      existente.tipo
    );

    try {
      await prisma.auditLog.create({
        data: {
          processoId: null,
          certificadoId: id,
          usuarioId: user.id,
          acao: novoAtivo ? 'CERTIFICADO_ATIVADO' : 'CERTIFICADO_DESATIVADO',
          detalhe: `Certificado ${novoAtivo ? 'ativado' : 'desativado'}: ${existente.titular} (${existente.tipo} ${docFormatado})`,
          alteracoes: {
            titular: existente.titular,
            documento: docFormatado,
            finalidade: existente.finalidade,
            ativo: { de: existente.ativo ? 'Ativo' : 'Inativo', para: novoAtivo ? 'Ativo' : 'Inativo' },
          },
        },
      });
    } catch (auditErr: any) {
      console.warn('[PATCH /api/certificados] Falha ao gravar AuditLog:', auditErr?.message || 'Erro');
    }

    return NextResponse.json({
      certificado: serializarCertificadoPublico(atualizado),
    });
  } catch (err: any) {
    if (err instanceof CertEncryptionConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof CertificadoValidationError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error('[PATCH /api/certificados/[id]] Falha ao atualizar certificado:', err?.message || 'Erro interno');
    return NextResponse.json(
      { error: 'Erro ao atualizar certificado digital.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    if (!canManageCertificados(user)) {
      return NextResponse.json(
        { error: 'Acesso negado. Exclusivo para ADMIN e DIRETORIA.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const existente = await prisma.certificadoDigital.findUnique({
      where: { id },
      select: CERT_PUBLIC_SELECT,
    });

    if (!existente) {
      return NextResponse.json(
        { error: 'Certificado digital não encontrado.' },
        { status: 404 }
      );
    }

    await prisma.certificadoDigital.delete({
      where: { id },
    });

    const docFormatado = formatarDocumentoCertificado(
      existente.documento,
      existente.tipo
    );

    try {
      await prisma.auditLog.create({
        data: {
          processoId: null,
          certificadoId: id,
          usuarioId: user.id,
          acao: 'CERTIFICADO_EXCLUIDO',
          detalhe: `Certificado excluído: ${existente.titular} (${existente.tipo} ${docFormatado}) · ${formatarFinalidadeCertificado(existente.finalidade)}`,
          alteracoes: {
            titular: existente.titular,
            tipo: existente.tipo,
            documento: docFormatado,
            finalidade: existente.finalidade,
          },
        },
      });
    } catch (auditErr: any) {
      console.warn('[DELETE /api/certificados] Falha ao gravar AuditLog:', auditErr?.message || 'Erro');
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[DELETE /api/certificados/[id]] Falha ao excluir certificado:', err?.message || 'Erro interno');
    return NextResponse.json(
      { error: 'Erro ao excluir certificado digital.' },
      { status: 500 }
    );
  }
}
