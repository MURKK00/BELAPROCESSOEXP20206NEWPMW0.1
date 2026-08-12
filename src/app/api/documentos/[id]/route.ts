import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDocumentSignedUrl } from '@/lib/storage';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const documento = await prisma.documento.findUnique({ where: { id: params.id } });
  if (!documento) {
    return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
  }

  const download = req.nextUrl.searchParams.get('download') === '1';
  const url = await getDocumentSignedUrl(documento.storagePath, { download });

  return NextResponse.redirect(url);
}