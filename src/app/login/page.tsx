'use client';

export const dynamic = 'force-dynamic';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  KeyRound,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Check,
  X
} from 'lucide-react';
import { SENHA_PADRAO_NOVO_USUARIO } from '@/lib/userHelper';

interface UserPrimeiroAcesso {
  id: string;
  nome: string;
  email: string;
  username?: string | null;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Estados do formulário de login padrão
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Estados do fluxo de primeiro acesso (redefinição obrigatória)
  const [emPrimeiroAcesso, setEmPrimeiroAcesso] = useState(false);
  const [usuarioPrimeiroAcesso, setUsuarioPrimeiroAcesso] = useState<UserPrimeiroAcesso | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmacaoSenha, setMostrarConfirmacaoSenha] = useState(false);

  // Validações em tempo real para o primeiro acesso
  const temSeisCaracteres = novaSenha.length >= 6;
  const senhasIguais = novaSenha.length > 0 && novaSenha === confirmacaoSenha;
  const diferentePadrao = novaSenha.trim() !== SENHA_PADRAO_NOVO_USUARIO;
  const formularioPrimeiroAcessoValido = temSeisCaracteres && senhasIguais && diferentePadrao;

  // Submissão do login inicial
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);

    const termo = identificador.trim();
    if (!termo || !password) {
      setErro('Por favor, informe seu nome de usuário (ex: MNUNES) ou e-mail e sua senha.');
      return;
    }

    setCarregando(true);

    try {
      // 1. Faz autenticação direta via API segura
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: termo,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErro(data.error || 'Usuário ou senha incorretos. Verifique suas credenciais.');
        setCarregando(false);
        return;
      }

      // Se for primeiro acesso, ativa a tela de definição de nova senha
      if (data.primeiroAcesso) {
        setUsuarioPrimeiroAcesso(data.user);
        setEmPrimeiroAcesso(true);
        setNovaSenha('');
        setConfirmacaoSenha('');
        setCarregando(false);
        return;
      }

      // 2. Grava no localStorage e nos cookies do navegador para máxima compatibilidade
      try {
        localStorage.setItem('bela_user', JSON.stringify(data.user));
        document.cookie = `bela_session=1; path=/; max-age=2592000; SameSite=None; Secure`;
        document.cookie = `bela_user_email=${encodeURIComponent(data.user.email)}; path=/; max-age=2592000; SameSite=None; Secure`;
      } catch (storageErr) {
        console.warn('Aviso ao armazenar sessão local:', storageErr);
      }

      // 3. Sincroniza sessão NextAuth em segundo plano
      try {
        await signIn('credentials', {
          email: termo,
          password,
          redirect: false,
        });
      } catch {
        // Ignora caso iframe bloqueie CSRF interno do NextAuth
      }

      // 4. Redirecionamento completo para carregar sessão e passar pelo middleware imediatamente
      const target = callbackUrl && callbackUrl !== '/login' ? callbackUrl : '/';
      const sep = target.includes('?') ? '&' : '?';
      window.location.href = `${target}${sep}auth=1`;
    } catch (err: any) {
      console.error('[Login] Erro ao autenticar:', err);
      setErro('Falha de conexão com o servidor de autenticação.');
      setCarregando(false);
    }
  }

  // Submissão do Primeiro Acesso (Definir nova senha)
  async function handleSalvarPrimeiroAcesso(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!usuarioPrimeiroAcesso) {
      setErro('Sessão expirada. Por favor, efetue login novamente.');
      setEmPrimeiroAcesso(false);
      return;
    }

    if (!novaSenha || !confirmacaoSenha) {
      setErro('Preencha a nova senha e a confirmação.');
      return;
    }

    if (novaSenha !== confirmacaoSenha) {
      setErro('A confirmação da senha não coincide com a nova senha digitada.');
      return;
    }

    if (novaSenha.length < 6) {
      setErro('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha.trim() === SENHA_PADRAO_NOVO_USUARIO) {
      setErro('A nova senha não pode ser a senha padrão provisória (abc12345).');
      return;
    }

    setCarregando(true);

    try {
      const res = await fetch('/api/auth/primeiro-acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: usuarioPrimeiroAcesso.id,
          identifier: identificador.trim(),
          novaSenha: novaSenha.trim(),
          confirmacaoSenha: confirmacaoSenha.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErro(data.error || 'Não foi possível cadastrar a nova senha.');
        setCarregando(false);
        return;
      }

      // Salva sessão localmente
      try {
        localStorage.setItem('bela_user', JSON.stringify(data.user));
        document.cookie = `bela_session=1; path=/; max-age=2592000; SameSite=None; Secure`;
        document.cookie = `bela_user_email=${encodeURIComponent(data.user.email)}; path=/; max-age=2592000; SameSite=None; Secure`;
      } catch (storageErr) {
        console.warn('Aviso ao armazenar sessão local:', storageErr);
      }

      setMensagemSucesso('Senha redefinida com sucesso! Redirecionando...');

      // Redireciona para a aplicação
      setTimeout(() => {
        const target = callbackUrl && callbackUrl !== '/login' ? callbackUrl : '/';
        const sep = target.includes('?') ? '&' : '?';
        window.location.href = `${target}${sep}auth=1`;
      }, 700);
    } catch (err: any) {
      console.error('[Primeiro Acesso] Erro:', err);
      setErro('Falha de conexão ao salvar nova senha.');
      setCarregando(false);
    }
  }

  function preencherCredenciais(loginId: string, pass = 'admin123') {
    setIdentificador(loginId);
    setPassword(pass);
    setErro(null);
    setEmPrimeiroAcesso(false);
  }

  return (
    <div className="w-full max-w-md">
      {/* CARD PRINCIPAL DO LOGIN */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl transition-all">
        {/* LOGO E CABEÇALHO */}
        <div className="text-center mb-6">
          <div className="inline-flex p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 mb-4 shadow-xs">
            <Image
              src="/logo-site-bela-verde.png"
              alt="Bela Cereais"
              width={140}
              height={36}
              priority
              referrerPolicy="no-referrer"
              className="h-9 w-auto object-contain"
            />
          </div>

          {!emPrimeiroAcesso ? (
            <>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Controle de Acesso
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Acesse com seu <strong className="text-orange-600 font-bold">Nome de Usuário</strong> ou e-mail
              </p>
            </>
          ) : (
            <div className="animate-fadeIn">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-[11px] font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Primeiro Acesso ao Sistema</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Definir Nova Senha
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Olá, <strong>{usuarioPrimeiroAcesso?.nome}</strong> ({usuarioPrimeiroAcesso?.username ? `@${usuarioPrimeiroAcesso.username}` : usuarioPrimeiroAcesso?.email}). Crie sua senha definitiva.
              </p>
            </div>
          )}
        </div>

        {/* ALERTA DE ERRO */}
        {erro && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed font-medium">{erro}</div>
          </div>
        )}

        {/* ALERTA DE SUCESSO */}
        {mensagemSucesso && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed font-medium">{mensagemSucesso}</div>
          </div>
        )}

        {/* ============================================================ */}
        {/* FLUXO 1: LOGIN PADRÃO (USUÁRIO OU EMAIL)                     */}
        {/* ============================================================ */}
        {!emPrimeiroAcesso ? (
          <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* CAMPO DE USUÁRIO OU E-MAIL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Usuário ou E-mail
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Padrão: MNUNES
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Ex: MNUNES ou admin@belacereais.com.br"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  disabled={carregando}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* CAMPO DE SENHA */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Senha
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={carregando}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* LEMBRAR DE MIM & AMBIENTE SEGURO */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#f58220] focus:ring-orange-500/20 cursor-pointer"
                />
                <span>Permanecer conectado</span>
              </label>
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ambiente Seguro</span>
              </span>
            </div>

            {/* BOTÃO ENTRAR */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-[#1a365d] hover:bg-blue-900 active:bg-[#0f2444] text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-950/20 hover:shadow-lg hover:shadow-blue-950/30 cursor-pointer disabled:opacity-50"
              >
                {carregando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando credenciais...</span>
                  </>
                ) : (
                  <>
                    <span>Acessar o Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ============================================================ */
          /* FLUXO 2: PRIMEIRO ACESSO - DEFINIR NOVA SENHA (DIGITADA 2X)  */
          /* ============================================================ */
          <form onSubmit={handleSalvarPrimeiroAcesso} className="space-y-4 animate-fadeIn">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200">
              Por segurança, ao fazer login pela primeira vez você deve definir uma nova senha pessoal confirmada duas vezes.
            </div>

            {/* CAMPO: NOVA SENHA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Digite sua nova senha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  disabled={carregando}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={mostrarNovaSenha ? 'Ocultar' : 'Exibir'}
                >
                  {mostrarNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* CAMPO: CONFIRMAR NOVA SENHA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Confirme a Nova Senha (2ª vez)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={mostrarConfirmacaoSenha ? 'text' : 'password'}
                  required
                  placeholder="Digite a mesma senha novamente"
                  value={confirmacaoSenha}
                  onChange={(e) => setConfirmacaoSenha(e.target.value)}
                  disabled={carregando}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacaoSenha(!mostrarConfirmacaoSenha)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={mostrarConfirmacaoSenha ? 'Ocultar' : 'Exibir'}
                >
                  {mostrarConfirmacaoSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* REQUISITOS DA SENHA EM TEMPO REAL */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                {temSeisCaracteres ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                )}
                <span className={temSeisCaracteres ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-500'}>
                  Mínimo de 6 caracteres
                </span>
              </div>

              <div className="flex items-center gap-2">
                {senhasIguais ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                )}
                <span className={senhasIguais ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-500'}>
                  As duas senhas são idênticas
                </span>
              </div>

              <div className="flex items-center gap-2">
                {diferentePadrao ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                )}
                <span className={diferentePadrao ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-500'}>
                  Diferente da senha inicial (abc12345)
                </span>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO DO PRIMEIRO ACESSO */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={carregando || !formularioPrimeiroAcessoValido}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-700/20 hover:shadow-lg cursor-pointer disabled:opacity-50"
              >
                {carregando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando nova senha...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Senha e Entrar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmPrimeiroAcesso(false);
                  setErro(null);
                  setPassword('');
                }}
                disabled={carregando}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao login</span>
              </button>
            </div>
          </form>
        )}

        {/* SEÇÃO INFORMATIVA COM CREDENCIAIS DE ACESSO */}
        <div className="mt-8 pt-5 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
            <KeyRound className="w-3.5 h-3.5 text-orange-500" />
            <span>Acesso Rápido para Demonstração</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => preencherCredenciais('ACEREAIS', 'admin123')}
              className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-orange-50/80 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-750 text-left transition-all group flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-orange-600 dark:text-orange-400 bg-orange-100/70 dark:bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-900">
                    ACEREAIS
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    admin@belacereais.com.br
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Senha: <code className="font-mono text-orange-600 dark:text-orange-400 font-bold">admin123</code> · Papel: ADMIN
                </span>
              </div>
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Usar credencial →
              </span>
            </button>

            <button
              type="button"
              onClick={() => preencherCredenciais('ADEV', 'admin123')}
              className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-orange-50/80 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-750 text-left transition-all group flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-orange-600 dark:text-orange-400 bg-orange-100/70 dark:bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-900">
                    ADEV
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    dev@belacereais.local
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Senha: <code className="font-mono text-orange-600 dark:text-orange-400 font-bold">admin123</code> · Papel: ADMIN
                </span>
              </div>
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Usar credencial →
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* RODAPÉ DO LOGIN */}
      <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <span>© {new Date().getFullYear()} Bela Cereais Export · Padrão de usuário: 1ª letra do nome + último sobrenome.</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/30 dark:from-[#0a0f1d] dark:via-[#0c1427] dark:to-[#070b13] relative overflow-hidden">
      {/* ELEMENTOS DECORATIVOS DE FUNDO */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={
        <div className="flex items-center justify-center p-8 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
