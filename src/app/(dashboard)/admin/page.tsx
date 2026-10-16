'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Database, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  KeyRound, 
  UserPlus, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Power, 
  Lock,
  Mail,
  User,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';

interface UsuarioItem {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  criadoEm: string;
}

export default function AdminPage() {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [countProcessos, setCountProcessos] = useState<number>(0);
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [carregandoDados, setCarregandoDados] = useState<boolean>(true);
  const [executandoAcao, setExecutandoAcao] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Estados do Modal de Novo Usuário
  const [modalNovoUsuario, setModalNovoUsuario] = useState<boolean>(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [papel, setPapel] = useState('ADMIN');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Estados do Modal de Redefinir Senha
  const [modalResetSenha, setModalResetSenha] = useState<{ id: string; nome: string; email: string } | null>(null);
  const [novaSenha, setNovaSenha] = useState('');

  // Modal de Confirmação para Zerar
  const [modalConfirmarZerar, setModalConfirmarZerar] = useState(false);

  useEffect(() => {
    carregarPainel();
  }, []);

  async function carregarPainel() {
    setCarregandoDados(true);
    setMensagemErro(null);

    try {
      // 1. Status do Modo Demonstração
      const resDemo = await fetch('/api/admin/demo-mode');
      const dataDemo = await resDemo.json();
      if (dataDemo.success) {
        setIsDemoMode(Boolean(dataDemo.isDemoMode));
        setCountProcessos(dataDemo.countProcessos || 0);
      }

      // 2. Lista de Usuários
      const resUsers = await fetch('/api/admin/users');
      const dataUsers = await resUsers.json();
      if (dataUsers.success) {
        setUsuarios(dataUsers.usuarios || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do admin:', err);
      setMensagemErro('Erro ao carregar informações do painel.');
    } finally {
      setCarregandoDados(false);
    }
  }

  // Alterna Modo Demonstração
  async function toggleModoDemonstracao(ativar: boolean) {
    setExecutandoAcao(true);
    setMensagemSucesso(null);
    setMensagemErro(null);

    try {
      const res = await fetch('/api/admin/demo-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableDemo: ativar }),
      });
      const data = await res.json();

      if (data.success) {
        setIsDemoMode(data.isDemoMode);
        setCountProcessos(data.countProcessos);
        setMensagemSucesso(data.message);
      } else {
        setMensagemErro(data.error || 'Erro ao alternar modo demonstração.');
      }
    } catch (err: any) {
      setMensagemErro('Falha de conexão com o servidor.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // Zera todos os lançamentos
  async function executarZerarLancamentos() {
    setExecutandoAcao(true);
    setMensagemSucesso(null);
    setMensagemErro(null);
    setModalConfirmarZerar(false);

    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setIsDemoMode(false);
        setCountProcessos(0);
        setMensagemSucesso(data.message || 'Todos os lançamentos foram zerados com sucesso!');
      } else {
        setMensagemErro(data.error || 'Erro ao zerar lançamentos.');
      }
    } catch (err: any) {
      setMensagemErro('Falha de comunicação com o servidor ao zerar.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // Criação de novo usuário
  async function handleCriarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    if (!nome || !email || !password) {
      setMensagemErro('Preencha todos os campos obrigatórios.');
      return;
    }

    setExecutandoAcao(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          password,
          papel,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMensagemSucesso(`Usuário ${data.usuario.nome} cadastrado com sucesso!`);
        setModalNovoUsuario(false);
        setNome('');
        setEmail('');
        setPassword('');
        setPapel('ADMIN');
        carregarPainel();
      } else {
        setMensagemErro(data.error || 'Não foi possível cadastrar o usuário.');
      }
    } catch (err: any) {
      setMensagemErro('Falha de conexão ao salvar usuário.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // Alterna status ativo do usuário
  async function toggleStatusUsuario(id: string, ativoAtual: boolean) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ativo: !ativoAtual }),
      });
      const data = await res.json();
      if (data.success) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === id ? { ...u, ativo: !ativoAtual } : u))
        );
      }
    } catch (err) {
      console.error('Erro ao alternar status do usuário:', err);
    }
  }

  // Redefinir senha de usuário
  async function handleRedefinirSenha(e: React.FormEvent) {
    e.preventDefault();
    if (!modalResetSenha || !novaSenha) return;

    setExecutandoAcao(true);
    setMensagemErro(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: modalResetSenha.id, novaSenha }),
      });
      const data = await res.json();

      if (data.success) {
        setMensagemSucesso(`Senha de ${modalResetSenha.nome} atualizada com sucesso!`);
        setModalResetSenha(null);
        setNovaSenha('');
      } else {
        setMensagemErro(data.error || 'Erro ao atualizar senha.');
      }
    } catch (err: any) {
      setMensagemErro('Falha ao redefinir senha.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // Excluir usuário
  async function handleExcluirUsuario(id: string, nomeUsuario: string) {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o usuário "${nomeUsuario}"?`)) {
      return;
    }

    setExecutandoAcao(true);
    setMensagemErro(null);

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setUsuarios((prev) => prev.filter((u) => u.id !== id));
        setMensagemSucesso(`Usuário "${nomeUsuario}" excluído com sucesso.`);
      } else {
        setMensagemErro(data.error || 'Erro ao excluir usuário.');
      }
    } catch (err: any) {
      setMensagemErro('Falha de conexão ao excluir usuário.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  function gerarSenhaAleatoria() {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* CABEÇALHO DO PAINEL ADMIN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Área de Acesso Restrito</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Painel Administrativo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestão de usuários, controle do modo demonstração e limpeza global de lançamentos operacionais.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={carregarPainel}
            disabled={carregandoDados || executandoAcao}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregandoDados ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovoUsuario(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a365d] hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-md shadow-blue-950/20 active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* ALERTAS DE SUCESSO / ERRO */}
      {mensagemSucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{mensagemSucesso}</span>
          </div>
          <button
            onClick={() => setMensagemSucesso(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-semibold">{mensagemErro}</span>
          </div>
          <button
            onClick={() => setMensagemErro(null)}
            className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* SEÇÃO 1: MODO DEMONSTRAÇÃO & ZERAR LANÇAMENTOS */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Banner do Status Atual */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                isDemoMode
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isDemoMode ? <Sparkles className="w-6 h-6 animate-pulse" /> : <Database className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Status Operacional do Sistema
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isDemoMode
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isDemoMode ? 'Modo Demonstração (Ativo)' : 'Modo Real (Limpo / Zerado)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isDemoMode
                  ? 'O sistema está exibindo dados simulados de demonstração (ex: Meghna Group, contratos de teste) para apresentações.'
                  : 'O sistema está no modo real de produção, pronto para novos lançamentos autênticos com o banco limpo.'}
              </p>
            </div>
          </div>

          {/* BOTÕES DE CONTROLE RÁPIDO DO MODO */}
          <div className="flex flex-wrap items-center gap-3">
            {isDemoMode ? (
              <button
                type="button"
                onClick={() => toggleModoDemonstracao(false)}
                disabled={executandoAcao}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Power className="w-3.5 h-3.5 text-rose-500" />
                <span>Desativar Demonstração (Zerar Sistema)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => toggleModoDemonstracao(true)}
                disabled={executandoAcao}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Carregar Dados de Demonstração</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setModalConfirmarZerar(true)}
              disabled={executandoAcao}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Zerar Todos os Lançamentos</span>
            </button>
          </div>
        </div>

        {/* MÉTRICAS EM MINI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Negociações Ativas no Banco
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {countProcessos} {countProcessos === 1 ? 'negociação' : 'negociações'}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {countProcessos === 0 ? 'Banco 100% zerado e limpo' : 'Exibindo registros da base'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Usuários com Acesso
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {usuarios.length} cadastrados
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {usuarios.filter((u) => u.ativo).length} ativos no sistema
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Modo Atual
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {isDemoMode ? 'DEMO' : 'PRODUÇÃO'}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Alternável a qualquer momento com 1 clique
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: GESTÃO DE USUÁRIOS */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Usuários de Acesso
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerencie login, e-mail, senha criptografada e nível de acesso de cada membro da equipe.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalNovoUsuario(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Usuário</span>
          </button>
        </div>

        {/* TABELA DE USUÁRIOS */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Usuário / Nome</th>
                <th className="py-3.5 px-4">E-mail (Login)</th>
                <th className="py-3.5 px-4">Cargo / Nível</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Data Cadastro</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {usuarios.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center shrink-0">
                        {(user.nome || user.email)[0].toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {user.nome || 'Sem nome'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {user.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        user.papel === 'ADMIN'
                          ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25'
                          : user.papel === 'FINANCEIRO'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                          : user.papel === 'COMERCIAL'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                          : user.papel === 'DIRETORIA'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25'
                          : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/25'
                      }`}
                    >
                      {user.papel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => toggleStatusUsuario(user.id, user.ativo)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                        user.ativo
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}
                      title="Clique para alternar o status do usuário"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{user.ativo ? 'Ativo' : 'Inativo'}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                    {user.criadoEm ? new Date(user.criadoEm).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setModalResetSenha(user)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Redefinir senha"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirUsuario(user.id, user.nome)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CADASTRAR NOVO USUÁRIO */}
      {modalNovoUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full relative animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Novo Usuário do Sistema
                  </h3>
                  <p className="text-xs text-slate-500">Crie login, senha e defina o cargo da equipe.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoUsuario(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo Santos"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  E-mail de Login
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="carlos.santos@belacereais.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={gerarSenhaAleatoria}
                    className="text-[10px] text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
                  >
                    Gerar senha automática
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Cargo / Nível de Acesso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <select
                    value={papel}
                    onChange={(e) => setPapel(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none cursor-pointer"
                  >
                    <option value="ADMIN">ADMIN (Acesso Total &amp; Painel)</option>
                    <option value="COMERCIAL">COMERCIAL (Negociações &amp; Compras)</option>
                    <option value="FINANCEIRO">FINANCEIRO (Bancos, Câmbio &amp; Custos)</option>
                    <option value="DIRETORIA">DIRETORIA (Visão Executiva)</option>
                    <option value="ADMINISTRATIVO">ADMINISTRATIVO (Operação &amp; Docs)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoUsuario(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={executandoAcao}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                >
                  {executandoAcao ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REDEFINIR SENHA */}
      {modalResetSenha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Redefinir Senha
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalResetSenha(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Informe a nova senha para <strong className="text-slate-800 dark:text-slate-200">{modalResetSenha.nome}</strong> ({modalResetSenha.email}):
            </p>

            <form onSubmit={handleRedefinirSenha} className="space-y-4">
              <input
                type="password"
                required
                placeholder="Nova senha (mínimo 6 dígitos)"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 outline-none"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalResetSenha(null)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={executandoAcao}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMAR ZERAR LANÇAMENTOS */}
      {modalConfirmarZerar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-rose-200 dark:border-rose-900/60 shadow-2xl max-w-md w-full relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
                  Confirmar Limpeza Total
                </h3>
                <p className="text-xs text-slate-500">Zerar todos os lançamentos do sistema</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Esta ação excluirá todas as negociações, containers, dados financeiros e documentos operacionais.
              <strong className="block mt-2 text-slate-900 dark:text-white font-bold">
                Seus usuários de acesso, parceiros e templates do checklist serão 100% preservados.
              </strong>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalConfirmarZerar(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={executarZerarLancamentos}
                disabled={executandoAcao}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                Sim, Zerar Todos os Lançamentos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
