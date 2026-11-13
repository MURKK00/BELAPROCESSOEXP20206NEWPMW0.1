import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { canManageCertificados } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import {
  CertEncryptionConfigError,
  criptografarSegredosCertificado,
  isCertEncryptionConfigured,
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

export async function GET() {
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

    const [rows, auditRows] = await Promise.all([
      prisma.certificadoDigital.findMany({
        select: CERT_PUBLIC_SELECT,
        orderBy: [{ ativo: 'desc' }, { validadeFim: 'asc' }],
      }),
      prisma.auditLog.findMany({
        where: {
          acao: { startsWith: 'CERTIFICADO_' },
        },
        orderBy: { criadoEm: 'desc' },
        take: 100,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      certificados: rows.map(serializarCertificadoPublico),
      auditoria: auditRows.map((log) => ({
        id: log.id,
        certificadoId: log.certificadoId,
        acao: log.acao,
        detalhe: log.detalhe,
        alteracoes: log.alteracoes,
        criadoEm: log.criadoEm instanceof Date ? log.criadoEm.toISOString() : String(log.criadoEm),
        usuarioNome: log.usuario?.nome || log.usuario?.email || 'Usuário',
        usuarioEmail: log.usuario?.email || '',
      })),
      encryptionConfigured: isCertEncryptionConfigured(),
    });
  } catch (err: any) {
    console.error('[GET /api/certificados] Falha ao listar certificados:', err?.message || 'Erro interno');
    return NextResponse.json(
      { error: 'Erro ao carregar certificados digitais.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    // Bloqueia imediatamente se CERT_ENCRYPTION_KEY não estiver configurada
    obterChaveCriptografiaCertificados();

    const formData = await req.formData();
    const arquivo = formData.get('arquivo');
    const senhaRaw = formData.get('senha');
    const finalidadeRaw = String(formData.get('finalidade') || '').trim().toUpperCase();

    if (!arquivo || !(arquivo instanceof File)) {
      return NextResponse.json(
        { error: 'Selecione um arquivo de certificado A1 (.pfx ou .p12).' },
        { status: 400 }
      );
    }

    const nomeArquivo = arquivo.name.toLowerCase();
    if (!nomeArquivo.endsWith('.pfx') && !nomeArquivo.endsWith('.p12')) {
      return NextResponse.json(
        { error: 'Formato inválido. Apenas arquivos A1 com extensão .pfx ou .p12 são aceitos.' },
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
        { error: 'Informe a senha do certificado digital.' },
        { status: 400 }
      );
    }

    if (!FINALIDADES_VALIDAS.includes(finalidadeRaw as FinalidadeCertificado)) {
      return NextResponse.json(
        { error: 'Finalidade inválida. Selecione SEFAZ, SISCOMEX ou AMBOS.' },
        { status: 400 }
      );
    }
    const finalidade = finalidadeRaw as FinalidadeCertificado;

    const pfxBuffer = Buffer.from(await arquivo.arrayBuffer());
    const meta = extrairMetadadosCertificadoA1(pfxBuffer, senhaRaw);

    // Regra confirmada: 1 certificado ativo por documento + finalidade
    const ativoExistente = await prisma.certificadoDigital.findFirst({
      where: {
        documento: meta.documento,
        finalidade,
        ativo: true,
      },
      select: { id: true, titular: true },
    });

    if (ativoExistente) {
      return NextResponse.json(
        {
          error: `Já existe um certificado ativo para ${meta.tipo} ${formatarDocumentoCertificado(meta.documento, meta.tipo)} com finalidade ${formatarFinalidadeCertificado(finalidade)}. Use a ação "Substituir" no registro existente ou desative-o antes.`,
        },
        { status: 409 }
      );
    }

    const cifrado = criptografarSegredosCertificado(pfxBuffer, senhaRaw);

    const criado = await prisma.certificadoDigital.create({
      data: {
        tipo: meta.tipo,
        documento: meta.documento,
        titular: meta.titular,
        emissor: meta.emissor,
        validadeInicio: meta.validadeInicio,
        validadeFim: meta.validadeFim,
        finalidade,
        arquivoCriptografado: cifrado.arquivoCriptografado,
        senhaCriptografada: cifrado.senhaCriptografada,
        iv: cifrado.iv,
        authTag: cifrado.authTag,
        ativo: true,
        criadoPorId: user.id,
      },
      select: CERT_PUBLIC_SELECT,
    });

    const docFormatado = formatarDocumentoCertificado(meta.documento, meta.tipo);

    try {
      await prisma.auditLog.create({
        data: {
          processoId: null,
          certificadoId: criado.id,
          usuarioId: user.id,
          acao: 'CERTIFICADO_ENVIADO',
          detalhe: `Certificado A1 enviado: ${meta.titular} (${meta.tipo} ${docFormatado}) · ${formatarFinalidadeCertificado(finalidade)}`,
          alteracoes: {
            titular: meta.titular,
            tipo: meta.tipo,
            documento: docFormatado,
            finalidade,
            emissor: meta.emissor,
            validadeFim: meta.validadeFim.toISOString(),
          },
        },
      });
    } catch (auditErr: any) {
      console.warn('[POST /api/certificados] Falha ao gravar AuditLog:', auditErr?.message || 'Erro');
    }

    return NextResponse.json(
      { certificado: serializarCertificadoPublico(criado) },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof CertEncryptionConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof CertificadoValidationError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error('[POST /api/certificados] Falha ao cadastrar certificado:', err?.message || 'Erro interno');
    return NextResponse.json(
      { error: 'Erro interno ao processar o certificado digital.' },
      { status: 500 }
    );
  }
}
