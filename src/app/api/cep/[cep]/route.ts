import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

const REQUEST_TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer);
  }
}

function formatarCepSaida(digits: string): string {
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function montarEndereco(logradouro: string, bairro: string): string {
  return [logradouro, bairro].filter(Boolean).join(' - ');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cep: string }> }
) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json(
      { error: 'Sessão expirada ou usuário não autenticado. Faça login novamente.' },
      { status: 401 }
    );
  }

  const { cep } = await params;
  const digits = decodeURIComponent(cep || '').replace(/\D/g, '');

  if (!/^\d{8}$/.test(digits)) {
    return NextResponse.json(
      { error: 'CEP com formato inválido. Informe 8 dígitos numéricos (ex: 78652-000).' },
      { status: 400 }
    );
  }

  let viaCepNotFound = false;
  let brasilApiNotFound = false;

  // 1. Tentativa primária: ViaCEP
  try {
    const resViaCep = await fetchWithTimeout(`https://viacep.com.br/ws/${digits}/json/`);
    if (resViaCep.ok) {
      const data = await resViaCep.json();
      if (data && (data.erro === true || data.erro === 'true')) {
        viaCepNotFound = true;
      } else if (data && (data.localidade || data.uf)) {
        const logradouro = typeof data.logradouro === 'string' ? data.logradouro.trim() : '';
        const bairro = typeof data.bairro === 'string' ? data.bairro.trim() : '';
        const complemento = typeof data.complemento === 'string' ? data.complemento.trim() : '';
        const cidade = typeof data.localidade === 'string' ? data.localidade.trim() : '';
        const uf = typeof data.uf === 'string' ? data.uf.trim().toUpperCase() : '';

        return NextResponse.json({
          cep: formatarCepSaida(digits),
          logradouro,
          bairro,
          endereco: montarEndereco(logradouro, bairro),
          complemento,
          cidade,
          uf,
          fonte: 'viacep',
        });
      }
    }
  } catch (err) {
    console.warn('[API CEP] Falha ou timeout ao consultar ViaCEP:', err);
  }

  // 2. Fallback: BrasilAPI v2
  try {
    const resBrasilApi = await fetchWithTimeout(`https://brasilapi.com.br/api/cep/v2/${digits}`);
    if (resBrasilApi.ok) {
      const data = await resBrasilApi.json();
      if (data && (data.city || data.state)) {
        const logradouro = typeof data.street === 'string' ? data.street.trim() : '';
        const bairro = typeof data.neighborhood === 'string' ? data.neighborhood.trim() : '';
        const cidade = typeof data.city === 'string' ? data.city.trim() : '';
        const uf = typeof data.state === 'string' ? data.state.trim().toUpperCase() : '';

        return NextResponse.json({
          cep: formatarCepSaida(digits),
          logradouro,
          bairro,
          endereco: montarEndereco(logradouro, bairro),
          complemento: '',
          cidade,
          uf,
          fonte: 'brasilapi',
        });
      }
    } else if (resBrasilApi.status === 404) {
      brasilApiNotFound = true;
    }
  } catch (err) {
    console.warn('[API CEP] Falha ou timeout ao consultar BrasilAPI:', err);
  }

  if (viaCepNotFound || brasilApiNotFound) {
    return NextResponse.json(
      { error: 'CEP não encontrado. Verifique os dígitos informados ou preencha o endereço manualmente.' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { error: 'Não foi possível consultar o CEP no momento (tempo limite excedido ou serviço indisponível).' },
    { status: 502 }
  );
}
