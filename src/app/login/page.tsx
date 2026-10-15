'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  KeyRound,
  CheckCircle2
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!email || !password) {
      setErro('Por favor, informe o seu e-mail e sua senha de acesso.');
      return;
    }

    setCarregando(true);

    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        if (res.error === 'CredentialsSignin' || res.error.includes('CredentialsSignin')) {
          setErro('E-mail ou senha incorretos. Verifique suas credenciais.');
        } else {
          setErro(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
        }
        setCarregando(false);
      } else if (res?.ok) {
        // Redirecionamento completo para carregar sessão e passar pelo middleware imediatamente
        window.location.href = callbackUrl;
      } else {
        setErro('Não foi possível realizar o login. Tente novamente.');
        setCarregando(false);
      }
    } catch (err: any) {
      console.error('[Login] Erro ao autenticar:', err);
      setErro('Falha de conexão com o servidor de autenticação.');
      setCarregando(false);
    }
  }

  function preencherCredenciais(userEmail: string) {
    setEmail(userEmail);
    setPassword('admin123');
    setErro(null);
  }

  return (
    <div className="w-full max-w-md">
      {/* CARD PRINCIPAL DO LOGIN */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl transition-all">
        {/* LOGO E CABEÇALHO */}
        <div className="text-center mb-8">
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Controle de Acesso
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sistema Integrado de Exportação &amp; Trading Desk
          </p>
        </div>

        {/* ALERTA DE ERRO */}
        {erro && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed font-medium">{erro}</div>
          </div>
        )}

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="space-y-4.5">
          {/* CAMPO DE E-MAIL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              E-mail Corporativo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@belacereais.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

          {/* LEMBRAR DE MIM & TERMOS */}
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
                  <span>Autenticando...</span>
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

        {/* SEÇÃO INFORMATIVA COM CREDENCIAIS DE ACESSO */}
        <div className="mt-8 pt-5 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
            <KeyRound className="w-3.5 h-3.5 text-orange-500" />
            <span>Acesso Rápido (Usuário Administrador)</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => preencherCredenciais('admin@belacereais.com.br')}
              className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-orange-50/80 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-750 text-left transition-all group flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  admin@belacereais.com.br
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Senha: <code className="font-mono text-orange-600 dark:text-orange-400 font-bold">admin123</code> · Papel: ADMIN
                </span>
              </div>
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Usar credencial →
              </span>
            </button>

            <button
              type="button"
              onClick={() => preencherCredenciais('dev@belacereais.local')}
              className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-orange-50/80 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-750 text-left transition-all group flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  dev@belacereais.local
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
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
        <span>© {new Date().getFullYear()} Bela Cereais Export · Todos os direitos reservados.</span>
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
