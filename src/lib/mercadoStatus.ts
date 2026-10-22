/**
 * Utilitário de monitoramento em tempo real do status das principais praças de mercado:
 * - B3 (Brasil - Futuros Agro & Dólar)
 * - CBOT / CME (Chicago - Soja, Milho e Farelo)
 * - Câmbio Comercial Spot & PTAX BACEN
 * - NCDEX (Mumbai - Pulses & Feijão)
 * - DCE (Dalian / Xangai - Complexo Soja)
 */

export interface StatusPracaMercado {
  id: string;
  nome: string;
  sigla: string;
  pais: string;
  bandeira: string;
  cidade: string;
  timeZone: string;
  aberto: boolean;
  statusLabel: 'ABERTO' | 'FECHADO' | 'PAUSA' | 'NOTURNO';
  horarioFuncionamento: string;
  horarioLocalStr: string;
  detalheSessao: string;
  corBadge: string;
}

export interface StatusMercadoGeral {
  geralAberto: boolean;
  statusTexto: 'ABERTO' | 'FECHADO';
  badgeLabel: string;
  descricaoCurta: string;
  resumoPracas: string;
  timestamp: string;
  b3: StatusPracaMercado;
  cbot: StatusMercadoGeralCbot;
  cambio: StatusPracaMercado;
  ncdex: StatusPracaMercado;
  dce: StatusPracaMercado;
}

export interface StatusMercadoGeralCbot extends StatusPracaMercado {
  tipoPregao?: 'DIURNO' | 'NOTURNO' | 'PAUSA' | 'FECHADO';
}

function getZonedTime(date: Date, timeZone: string) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;

    const day = map.weekday || 'Mon'; // 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
    const hour = parseInt(map.hour || '0', 10);
    const minute = parseInt(map.minute || '0', 10);
    const second = parseInt(map.second || '0', 10);
    const totalMinutes = hour * 60 + minute;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

    return { day, hour, minute, second, totalMinutes, timeStr };
  } catch {
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    return {
      day: 'Mon',
      hour,
      minute,
      second: 0,
      totalMinutes: hour * 60 + minute,
      timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
    };
  }
}

export function calcularStatusMercados(agora: Date = new Date()): StatusMercadoGeral {
  // 1. B3 - SÃO PAULO (BM&F Futuros Agro: Seg-Sex 09:00 às 18:00 BRT)
  const sp = getZonedTime(agora, 'America/Sao_Paulo');
  const isDiaUtilB3 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(sp.day);
  const isHorarioB3 = sp.totalMinutes >= 540 && sp.totalMinutes < 1080; // 09:00 às 18:00
  const b3Aberto = isDiaUtilB3 && isHorarioB3;

  const b3: StatusPracaMercado = {
    id: 'b3',
    nome: 'B3 · Brasil Bolsa Balcão',
    sigla: 'B3',
    pais: 'Brasil',
    bandeira: '🇧🇷',
    cidade: 'São Paulo',
    timeZone: 'America/Sao_Paulo',
    aberto: b3Aberto,
    statusLabel: b3Aberto ? 'ABERTO' : 'FECHADO',
    horarioFuncionamento: 'Seg a Sex · 09:00 às 18:00 BRT',
    horarioLocalStr: sp.timeStr,
    detalheSessao: b3Aberto ? 'Pregão Regular Ativo' : isDiaUtilB3 ? (sp.totalMinutes < 540 ? 'Pré-abertura (Abre 09h)' : 'Pregão Encerrado') : 'Fechado no Fim de Semana',
    corBadge: b3Aberto ? 'emerald' : 'slate',
  };

  // 2. CBOT / CME - CHICAGO (Grãos Globex)
  // Domingo a Sexta: Noturno 19:00-07:45 CT | Diurno 08:30-13:20 CT | Pausa: 07:45-08:30 CT e 13:20-19:00 CT
  const chi = getZonedTime(agora, 'America/Chicago');
  let cbotAberto = false;
  let cbotSessao: 'DIURNO' | 'NOTURNO' | 'PAUSA' | 'FECHADO' = 'FECHADO';
  let cbotDetalhe = 'Mercado Fechado';

  if (chi.day === 'Sun') {
    if (chi.totalMinutes >= 1140) { // 19:00 em diante
      cbotAberto = true;
      cbotSessao = 'NOTURNO';
      cbotDetalhe = 'Sessão Noturna Aberta (Globex)';
    } else {
      cbotDetalhe = 'Abre Domingo às 19:00 CT';
    }
  } else if (['Mon', 'Tue', 'Wed', 'Thu'].includes(chi.day)) {
    if (chi.totalMinutes < 465) { // 00:00 às 07:45
      cbotAberto = true;
      cbotSessao = 'NOTURNO';
      cbotDetalhe = 'Sessão Noturna (Globex)';
    } else if (chi.totalMinutes >= 465 && chi.totalMinutes < 510) { // 07:45 às 08:30
      cbotAberto = false;
      cbotSessao = 'PAUSA';
      cbotDetalhe = 'Pausa Técnica (Abre 08:30 CT)';
    } else if (chi.totalMinutes >= 510 && chi.totalMinutes < 800) { // 08:30 às 13:20
      cbotAberto = true;
      cbotSessao = 'DIURNO';
      cbotDetalhe = 'Sessão Regular Diurna (Piso)';
    } else if (chi.totalMinutes >= 800 && chi.totalMinutes < 1140) { // 13:20 às 19:00
      cbotAberto = false;
      cbotSessao = 'PAUSA';
      cbotDetalhe = 'Intervalo Diário (Abre 19:00 CT)';
    } else { // 19:00 em diante
      cbotAberto = true;
      cbotSessao = 'NOTURNO';
      cbotDetalhe = 'Sessão Noturna Aberta';
    }
  } else if (chi.day === 'Fri') {
    if (chi.totalMinutes < 465) {
      cbotAberto = true;
      cbotSessao = 'NOTURNO';
      cbotDetalhe = 'Sessão Noturna (Globex)';
    } else if (chi.totalMinutes >= 465 && chi.totalMinutes < 510) {
      cbotAberto = false;
      cbotSessao = 'PAUSA';
      cbotDetalhe = 'Pausa Técnica (Abre 08:30 CT)';
    } else if (chi.totalMinutes >= 510 && chi.totalMinutes < 800) {
      cbotAberto = true;
      cbotSessao = 'DIURNO';
      cbotDetalhe = 'Sessão Regular de Encerramento';
    } else {
      cbotAberto = false;
      cbotSessao = 'FECHADO';
      cbotDetalhe = 'Fechado para o Final de Semana';
    }
  } else {
    // Saturday
    cbotAberto = false;
    cbotSessao = 'FECHADO';
    cbotDetalhe = 'Fechado no Fim de Semana';
  }

  const cbot: StatusMercadoGeralCbot = {
    id: 'cbot',
    nome: 'CBOT / CME Group',
    sigla: 'CBOT',
    pais: 'Estados Unidos',
    bandeira: '🇺🇸',
    cidade: 'Chicago',
    timeZone: 'America/Chicago',
    aberto: cbotAberto,
    statusLabel: cbotAberto ? (cbotSessao === 'NOTURNO' ? 'NOTURNO' : 'ABERTO') : cbotSessao === 'PAUSA' ? 'PAUSA' : 'FECHADO',
    tipoPregao: cbotSessao,
    horarioFuncionamento: 'Diurno: 08:30-13:20 CT · Noturno: 19:00-07:45 CT',
    horarioLocalStr: chi.timeStr,
    detalheSessao: cbotDetalhe,
    corBadge: cbotAberto ? 'emerald' : cbotSessao === 'PAUSA' ? 'amber' : 'slate',
  };

  // 3. CÂMBIO COMERCIAL / BACEN (Seg-Sex 09:00 às 17:00 BRT)
  const isHorarioCambio = sp.totalMinutes >= 540 && sp.totalMinutes < 1020; // 09:00 às 17:00
  const cambioAberto = isDiaUtilB3 && isHorarioCambio;

  const cambio: StatusPracaMercado = {
    id: 'cambio',
    nome: 'Câmbio Comercial & PTAX',
    sigla: 'USD/BRL',
    pais: 'Brasil',
    bandeira: '🇧🇷',
    cidade: 'Brasília / SP',
    timeZone: 'America/Sao_Paulo',
    aberto: cambioAberto,
    statusLabel: cambioAberto ? 'ABERTO' : 'FECHADO',
    horarioFuncionamento: 'Seg a Sex · 09:00 às 17:00 BRT',
    horarioLocalStr: sp.timeStr,
    detalheSessao: cambioAberto ? 'Mercado Interbancário Ativo' : isDiaUtilB3 ? (sp.totalMinutes < 540 ? 'Abre às 09:00 BRT' : 'PTAX Final Publicada') : 'Fechado no Fim de Semana',
    corBadge: cambioAberto ? 'emerald' : 'slate',
  };

  // 4. NCDEX - MUMBAI (Seg-Sex 09:00 às 17:00 IST)
  const kol = getZonedTime(agora, 'Asia/Kolkata');
  const isDiaUtilKol = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(kol.day);
  const ncdexAberto = isDiaUtilKol && kol.totalMinutes >= 540 && kol.totalMinutes < 1020;

  const ncdex: StatusPracaMercado = {
    id: 'ncdex',
    nome: 'NCDEX · National Commodity',
    sigla: 'NCDEX',
    pais: 'Índia',
    bandeira: '🇮🇳',
    cidade: 'Mumbai',
    timeZone: 'Asia/Kolkata',
    aberto: ncdexAberto,
    statusLabel: ncdexAberto ? 'ABERTO' : 'FECHADO',
    horarioFuncionamento: 'Seg a Sex · 09:00 às 17:00 IST',
    horarioLocalStr: kol.timeStr,
    detalheSessao: ncdexAberto ? 'Pregão de Pulses Ativo' : isDiaUtilKol ? (kol.totalMinutes < 540 ? 'Abre às 09:00 IST' : 'Pregão Encerrado') : 'Fechado no Fim de Semana',
    corBadge: ncdexAberto ? 'emerald' : 'slate',
  };

  // 5. DCE - XANGAI / DALIAN (Seg-Sex: 09:00-11:30 | 13:30-15:00 | 21:00-23:00 CST)
  const sha = getZonedTime(agora, 'Asia/Shanghai');
  const isDiaUtilSha = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(sha.day);
  const dceAberto = isDiaUtilSha && (
    (sha.totalMinutes >= 540 && sha.totalMinutes < 690) ||
    (sha.totalMinutes >= 810 && sha.totalMinutes < 900) ||
    (sha.totalMinutes >= 1260 && sha.totalMinutes < 1380)
  );

  const dce: StatusPracaMercado = {
    id: 'dce',
    nome: 'DCE · Dalian Commodity Exchange',
    sigla: 'DCE',
    pais: 'China',
    bandeira: '🇨🇳',
    cidade: 'Xangai / Dalian',
    timeZone: 'Asia/Shanghai',
    aberto: dceAberto,
    statusLabel: dceAberto ? 'ABERTO' : 'FECHADO',
    horarioFuncionamento: '09h-11h30 · 13h30-15h · 21h-23h CST',
    horarioLocalStr: sha.timeStr,
    detalheSessao: dceAberto ? 'Pregão Grãos & Óleos Ativo' : isDiaUtilSha ? 'Intervalo / Pré-Pregão' : 'Fechado no Fim de Semana',
    corBadge: dceAberto ? 'emerald' : 'slate',
  };

  // STATUS GERAL DO MERCADO:
  // Se B3, CBOT ou Câmbio Comercial estiverem abertos, o mercado está ativo para operações da Bela Cereais
  const geralAberto = b3Aberto || cbotAberto || cambioAberto;

  const abertasContagem = [b3Aberto, cbotAberto, cambioAberto, ncdexAberto, dceAberto].filter(Boolean).length;

  let resumoPracas = '';
  if (b3Aberto && cbotAberto) {
    resumoPracas = 'B3 São Paulo e CBOT Chicago operando';
  } else if (b3Aberto) {
    resumoPracas = 'B3 e Câmbio operando · CBOT em pausa/noturno';
  } else if (cbotAberto) {
    resumoPracas = 'CBOT Chicago operando · B3 fechada';
  } else if (ncdexAberto || dceAberto) {
    resumoPracas = 'Bolsas Asiáticas operando · Praças ocidentais fechadas';
  } else {
    resumoPracas = 'Todas as principais praças estão fechadas no momento';
  }

  return {
    geralAberto,
    statusTexto: geralAberto ? 'ABERTO' : 'FECHADO',
    badgeLabel: geralAberto ? 'MERCADO ABERTO' : 'MERCADO FECHADO',
    descricaoCurta: geralAberto
      ? `${abertasContagem} de 5 praças operando em tempo real`
      : 'Fora do horário de pregão regular',
    resumoPracas,
    timestamp: agora.toISOString(),
    b3,
    cbot,
    cambio,
    ncdex,
    dce,
  };
}
