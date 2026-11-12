import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') === '1';

    const sqlPath = path.join(process.cwd(), 'prisma', 'supabase-schema.sql');
    if (!fs.existsSync(sqlPath)) {
      return NextResponse.json({ error: 'Arquivo SQL não encontrado.' }, { status: 404 });
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    if (download) {
      return new NextResponse(sqlContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/sql',
          'Content-Disposition': 'attachment; filename="supabase-schema-pex.sql"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      sql: sqlContent,
      totalLines: sqlContent.split('\n').length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
