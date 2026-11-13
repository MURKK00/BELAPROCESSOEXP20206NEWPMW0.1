import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { seedEtapaTemplatesIdempotente } from '@/server/services/etapaTemplateService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }
    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Acesso exclusivo para ADMIN.' }, { status: 403 });
    }

    const totalTemplates = await prisma.etapaTemplate.count();
    return NextResponse.json({ success: true, totalTemplates });
  } catch (error: any) {
    console.error('[API /api/admin/seed-etapas GET] Erro:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao consultar templates de etapas.' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }
    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Acesso exclusivo para ADMIN.' }, { status: 403 });
    }

    const resultado = await seedEtapaTemplatesIdempotente();

    return NextResponse.json({
      success: true,
      ...resultado,
      message:
        resultado.templatesCriados > 0
          ? `${resultado.templatesCriados} templates de etapas criados com sucesso (total: ${resultado.templatesDepois}).`
          : `Templates já estavam sincronizados (${resultado.templatesDepois} etapas padrão).`,
    });
  } catch (error: any) {
    console.error('[API /api/admin/seed-etapas POST] Erro:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Falha ao inicializar templates do checklist.' },
      { status: 500 }
    );
  }
}
