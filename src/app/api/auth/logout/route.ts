import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Limpa cookies de sessão
  response.cookies.delete('bela_session');
  response.cookies.delete('bela_user_email');
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('__Secure-next-auth.session-token');

  return response;
}
