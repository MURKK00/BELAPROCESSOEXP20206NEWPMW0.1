import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Limpa cookies de sessão
  response.cookies.delete('bela_session');
  response.cookies.delete('bela_user_email');
  response.cookies.delete('bela_auth_created_at');
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('__Secure-next-auth.session-token');

  // Sobrescreve com expiração retroativa para garantir limpeza cross-origin
  response.cookies.set('bela_session', '', { path: '/', maxAge: 0, sameSite: 'none', secure: true });
  response.cookies.set('bela_user_email', '', { path: '/', maxAge: 0, sameSite: 'none', secure: true });
  response.cookies.set('bela_auth_created_at', '', { path: '/', maxAge: 0, sameSite: 'none', secure: true });

  return response;
}
