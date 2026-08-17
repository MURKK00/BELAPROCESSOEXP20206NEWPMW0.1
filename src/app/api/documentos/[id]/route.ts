import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDocumentSignedUrl } from '@/lib/storage';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // SEGURANÇA: Bloqueia acesso de pessoas que não estão logadas no sistema
  const user = await getSessionUser();
  if (!user) {
    return new Response('Não autorizado', { status: 401 });
  }

  const { id } = await params;

  const documento = await prisma.documento.findUnique({ where: { id } });
  if (!documento) {
    return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
  }

  const download = req.nextUrl.searchParams.get('download') === '1';
  const url = await getDocumentSignedUrl(documento.storagePath, { download });

  return NextResponse.redirect(url);
}