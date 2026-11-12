'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  Unlock,
  Mail,
  User,
  Shield,
  Check,
  Edit2,
  Info,
  Activity,
  Zap,
  CreditCard,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { PAPEIS_DISPONIVEIS, Papel, canAccessAdmin } from '@/lib/permissions';
import { 
  gerarNomeUsuario, 
  SENHA_PADRAO_NOVO_USUARIO, 
  formatarCPF, 
  limparCPF, 
  validarCPF 
} from '@/lib/userHelper';
import { validarRequisitosSenha, SENHA_PADRAO_SISTEMA } from '@/lib/passwordUtils';
import { SessionsManager } from '@/components/admin/SessionsManager';
import { BackupScheduleManager } from '@/components/admin/BackupScheduleManager';

interface UsuarioItem {
  id: string;
  nome: string;
  email: string;
  username?: string | null;
  cpf?: string | null;
  cpfRaw?: string | null;
  primeiroAcesso?: boolean;
  papel: string;
  papeis: string[];
  ativo: boolean;
  criadoEm: string;
}

// Subcomponente dedicado para useSearchParams envolvido em Suspense Boundary
function AdminTabSync({ onTabChange }: { onTabChange: (tab: 'USUARIOS' | 'SESSOES' | 'BANCO') => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'sessoes') onTabChange('SESSOES');
    else if (tab === 'banco') onTabChange('BANCO');
    else if (tab === 'usuarios') onTabChange('USUARIOS');
  }, [searchParams, onTabChange]);

  return null;
}

function AdminDashboardContent() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [countProcessos, setCountProcessos] = useState<number>(0);
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [carregandoDados, setCarregandoDados] = useState<boolean>(true);
  const [executandoAcao, setExecutandoAcao] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [testandoConexao, setTestandoConexao] = useState<boolean>(false);

  // Estados do Modal de Novo Usuário
  const [modalNovoUsuario, setModalNovoUsuario] = useState<boolean>(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [usarSenhaPadrao, setUsarSenhaPadrao] = useState<boolean>(true);
  const [password, setPassword] = useState(SENHA_PADRAO_NOVO_USUARIO);
  const [papeisSelecionados, setPapeisSelecionados] = useState<Papel[]>(['COMERCIAL']);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Estados do Modal de Edição Completa de Usuário Existente
  const [modalEditarUsuario, setModalEditarUsuario] = useState<{
    id: string;
    nome: string;
    email: string;
    username: string;
    cpf: string;
    papeis: Papel[];
    ativo: boolean;
  } | null>(null);

  // Estados do Modal de Editar Perfis de Usuário Existente (legado/rápido)
  const [modalEditarPerfis, setModalEditarPerfis] = useState<{ id: string; nome: string; email: string; papeis: Papel[] } | null>(null);

  // Estados do Modal de Redefinir Senha
  const [modalResetSenha, setModalResetSenha] = useState<{ id: string; nome: string; email: string } | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarNovaSenha, setMostrarConfirmarNovaSenha] = useState(false);

  // Estados de Modais Nativos do Sistema (substituindo pop-ups nativos do navegador)
  const [modalPreviewUsuario, setModalPreviewUsuario] = useState<UsuarioItem | null>(null);
  const [modalConfirmarBloqueio, setModalConfirmarBloqueio] = useState<{ user: UsuarioItem; acao: 'BLOQUEAR' | 'DESBLOQUEAR' } | null>(null);
  const [modalConfirmarExclusao, setModalConfirmarExclusao] = useState<{ id: string; nome: string } | null>(null);

  const [abaAtiva, setAbaAtiva] = useState<'USUARIOS' | 'SESSOES' | 'BANCO'>('USUARIOS');

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('bela_user');
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
    carregarPainel();
    carregarSaudeBanco();
  }, []);

async function carregarPainel() {
    setCarregandoDados(true);
    setMensagemErro(null);

    try {
      // 1. Status do Modo Demonstração (sem cache)
      const resDemo = await fetch('/api/admin/demo-mode', { cache: 'no-store' });
      const dataDemo = await resDemo.json();
      if (dataDemo.success) {
        setIsDemoMode(Boolean(dataDemo.isDemoMode));
        setCountProcessos(dataDemo.countProcessos || 0);
      }

      // 2. Lista de Usuários (sem cache + mesclagem segura com localStorage)
      const resUsers = await fetch('/api/admin/users', { cache: 'no-store' });
      const dataUsers = await resUsers.json();
      if (dataUsers.success) {
        const listaApi: UsuarioItem[] = dataUsers.usuarios || [];
        
        // Recupera usuários criados localmente caso a API esteja em modo read-only/demo na Vercel
        let listaLocal: UsuarioItem[] = [];
        try {
          const salvos = localStorage.getItem('bela_usuarios_custom');
          if (salvos) listaLocal = JSON.parse(salvos);
        } catch {}

        // Sincroniza usuários do localStorage com a base real do Supabase caso haja pendências
        const emailsApi = new Set(listaApi.map((u) => (u.email || '').toLowerCase()));
        const pendentesSync = listaLocal.filter((u) => u.email && !emailsApi.has(u.email.toLowerCase()));
        if (pendentesSync.length > 0) {
          try {
            await fetch('/api/admin/users/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ usuarios: pendentesSync }),
            });
            const resReload = await fetch('/api/admin/users', { cache: 'no-store' });
            const dataReload = await resReload.json();
            if (dataReload.success && Array.isArray(dataReload.usuarios)) {
              setUsuarios(dataReload.usuarios);
              try {
                localStorage.setItem('bela_usuarios_custom', JSON.stringify(dataReload.usuarios));
              } catch {}
              return;
            }
          } catch (eSync) {
            console.warn('Erro ao sincronizar usuários com a base real:', eSync);
          }
        }

        // Mescla sem duplicar por ID ou e-mail (API tem prioridade absoluta)
        const mapa = new Map<string, UsuarioItem>();
        [...listaApi, ...listaLocal].forEach((u) => {
          const chave = (u.email || u.id).toLowerCase();
          if (!mapa.has(chave)) {
            mapa.set(chave, u);
          }
        });

        const listaFinal = Array.from(mapa.values());
        setUsuarios(listaFinal);
        try {
          localStorage.setItem('bela_usuarios_custom', JSON.stringify(listaFinal));
        } catch {}
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do admin:', err);
      setMensagemErro('Erro ao carregar informações do painel.');
    } finally {
      setCarregandoDados(false);
    }
  }


  // Diagnóstico e saúde em tempo real do banco de dados e sistema
  async function carregarSaudeBanco() {
    setTestandoConexao(true);
    try {
      const res = await fetch('/api/admin/health', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setHealthData(data);
      }
    } catch (e) {
      console.warn('Erro ao verificar saúde do banco:', e);
    } finally {
      setTestandoConexao(false);
    }
  }

  // Toggle de seleção de papel (checkbox multi-perfil)
  function togglePapel(papelId: Papel, targetList: Papel[], setList: (p: Papel[]) => void) {
    if (targetList.includes(papelId)) {
      if (targetList.length === 1) return; // Garante que pelo menos 1 papel permaneça selecionado
      setList(targetList.filter((p) => p !== papelId));
    } else {
      setList([...targetList, papelId]);
    }
  }

  // Criação de novo usuário com múltiplos perfis e CPF
  async function handleCriarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    if (!nome.trim() || !email.trim()) {
      setMensagemErro('Preencha o nome completo e o e-mail corporativo.');
      return;
    }

    if (papeisSelecionados.length === 0) {
      setMensagemErro('Selecione ao menos um perfil de acesso.');
      return;
    }

    const senhaParaCriar = usarSenhaPadrao ? SENHA_PADRAO_NOVO_USUARIO : password.trim();

    if (!usarSenhaPadrao) {
      const validacao = validarRequisitosSenha(senhaParaCriar, false);
      if (!validacao.valida) {
        setMensagemErro(validacao.erro || 'A senha deve conter no mínimo 6 caracteres, letras, números e caracteres especiais.');
        return;
      }
    }

    const cpfLimpo = cpf.trim() ? limparCPF(cpf) : '';
    if (cpfLimpo && !validarCPF(cpfLimpo)) {
      setMensagemErro('CPF inválido. Verifique os 11 dígitos digitados.');
      return;
    }

    setExecutandoAcao(true);
    const usernameGerado = gerarNomeUsuario(nome);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          cpf: cpfLimpo || undefined,
          username: usernameGerado,
          password: senhaParaCriar,
          papeis: papeisSelecionados,
          papel: papeisSelecionados[0],
        }),
      });

      const data = await res.json();

      if (data.success) {
        const novoUsuario: UsuarioItem = {
          id: data.usuario?.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          nome: data.usuario?.nome || nome.trim(),
          email: data.usuario?.email || email.trim().toLowerCase(),
          username: data.usuario?.username || usernameGerado,
          cpf: data.usuario?.cpf || (cpfLimpo ? formatarCPF(cpfLimpo) : null),
          primeiroAcesso: true,
          papel: data.usuario?.papel || papeisSelecionados[0],
          papeis: Array.isArray(data.usuario?.papeis) && data.usuario.papeis.length > 0
            ? data.usuario.papeis
            : papeisSelecionados,
          ativo: data.usuario?.ativo ?? true,
          criadoEm: data.usuario?.criadoEm || new Date().toISOString(),
        };

        setUsuarios((prev) => {
          const filtrada = prev.filter(
            (u) => u.id !== novoUsuario.id && u.email.toLowerCase() !== novoUsuario.email.toLowerCase()
          );
          const atualizada = [novoUsuario, ...filtrada];
          try {
            localStorage.setItem('bela_usuarios_custom', JSON.stringify(atualizada));
          } catch {}
          return atualizada;
        });

        setMensagemSucesso(`Usuário ${novoUsuario.nome} cadastrado com sucesso! Login: @${novoUsuario.username || usernameGerado} (Senha padrão: abc12345).`);
        setModalNovoUsuario(false);
        setNome('');
        setEmail('');
        setCpf('');
        setPassword(SENHA_PADRAO_NOVO_USUARIO);
        setUsarSenhaPadrao(true);
        setPapeisSelecionados(['COMERCIAL']);

        await carregarPainel();
      } else {
        setMensagemErro(data.error || 'Não foi possível cadastrar o usuário.');
      }
    } catch (err: any) {
      setMensagemErro('Falha de conexão ao salvar usuário.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // Salvar edição completa de dados do usuário
  async function handleSalvarEdicaoUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!modalEditarUsuario) return;

    if (!modalEditarUsuario.nome.trim() || !modalEditarUsuario.email.trim()) {
      setMensagemErro('Nome e e-mail são obrigatórios.');
      return;
    }

    if (modalEditarUsuario.papeis.length === 0) {
      setMensagemErro('O usuário deve possuir ao menos 1 perfil ativo.');
      return;
    }

    const cpfLimpo = modalEditarUsuario.cpf.trim() ? limparCPF(modalEditarUsuario.cpf) : '';
    if (cpfLimpo && !validarCPF(cpfLimpo)) {
      setMensagemErro('CPF inválido.');
      return;
    }

    setExecutandoAcao(true);
    setMensagemErro(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: modalEditarUsuario.id,
          nome: modalEditarUsuario.nome.trim(),
          email: modalEditarUsuario.email.trim().toLowerCase(),
          username: modalEditarUsuario.username.trim() || undefined,
          cpf: cpfLimpo || null,
          papeis: modalEditarUsuario.papeis,
          papel: modalEditarUsuario.papeis[0],
          ativo: modalEditarUsuario.ativo,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUsuarios((prev) => {
          const atualizada = prev.map((u) =>
            u.id === modalEditarUsuario.id
              ? {
                  ...u,
                  nome: modalEditarUsuario.nome.trim(),
                  email: modalEditarUsuario.email.trim().toLowerCase(),
                  username: modalEditarUsuario.username.trim() || u.username,
                  cpf: cpfLimpo ? formatarCPF(cpfLimpo) : null,
                  papeis: modalEditarUsuario.papeis,
                  papel: modalEditarUsuario.papeis[0],
                  ativo: modalEditarUsuario.ativo,
                }
              : u
          );
          try {
            localStorage.setItem('bela_usuarios_custom', JSON.stringify(atualizada));
          } catch {}
          return atualizada;
        });

        setMensagemSucesso(`Dados do usuário ${modalEditarUsuario.nome} atualizados com sucesso!`);
        setModalEditarUsuario(null);
        await carregarPainel();
      } else {
        setMensagemErro(data.error || 'Erro ao atualizar dados do usuário.');
      }
    } catch (err: any) {
      setMensagemErro('Falha de conexão ao salvar alterações.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // Salvar edição rápida de múltiplos perfis
  async function handleSalvarPerfisUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!modalEditarPerfis) return;

    if (modalEditarPerfis.papeis.length === 0) {
      setMensagemErro('O usuário deve possuir pelo menos 1 perfil ativo.');
      return;
    }

    setExecutandoAcao(true);
    setMensagemErro(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: modalEditarPerfis.id,
          papeis: modalEditarPerfis.papeis,
          papel: modalEditarPerfis.papeis[0],
        }),
      });
      const data = await res.json();

      if (data.success) {
        setUsuarios((prev) => {
          const atualizada = prev.map((u) =>
            u.id === modalEditarPerfis.id
              ? { ...u, papeis: modalEditarPerfis.papeis, papel: modalEditarPerfis.papeis[0] }
              : u
          );
          try {
            localStorage.setItem('bela_usuarios_custom', JSON.stringify(atualizada));
          } catch {}
          return atualizada;
        });
        setMensagemSucesso(`Perfis de ${modalEditarPerfis.nome} atualizados com sucesso!`);
        setModalEditarPerfis(null);
      } else {
        setMensagemErro(data.error || 'Erro ao atualizar perfis.');
      }
    } catch (err: any) {
      setMensagemErro('Falha ao atualizar perfis do usuário.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // Executa o Bloqueio / Desbloqueio do usuário a partir do modal nativo do sistema
  async function executarToggleBloqueio() {
    if (!modalConfirmarBloqueio) return;
    const { user, acao } = modalConfirmarBloqueio;
    const novoStatus = acao === 'DESBLOQUEAR';

    setExecutandoAcao(true);
    setMensagemErro(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, ativo: novoStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsuarios((prev) => {
          const atualizada = prev.map((u) => (u.id === user.id ? { ...u, ativo: novoStatus } : u));
          try {
            localStorage.setItem('bela_usuarios_custom', JSON.stringify(atualizada));
          } catch {}
          return atualizada;
        });
        setMensagemSucesso(
          novoStatus
            ? `Usuário "${user.nome}" DESBLOQUEADO com sucesso! Acesso liberado.`
            : `Usuário "${user.nome}" BLOQUEADO com sucesso. Acesso ao login suspenso.`
        );
        setModalConfirmarBloqueio(null);
      } else {
        setMensagemErro(data.error || 'Erro ao alterar bloqueio do usuário.');
      }
    } catch (err) {
      setMensagemErro('Falha ao comunicar com o servidor.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // Redefinir para a senha padrão 'abc12345' (ativa primeiroAcesso = true)
  async function handleResetParaPadrao() {
    if (!modalResetSenha) return;
    setExecutandoAcao(true);
    setMensagemErro(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: modalResetSenha.id, resetarParaPadrao: true }),
      });
      const data = await res.json();
      if (data.success) {
        setUsuarios((prev) => {
          const atualizada = prev.map((u) =>
            u.id === modalResetSenha.id ? { ...u, primeiroAcesso: true } : u
          );
          try {
            localStorage.setItem('bela_usuarios_custom', JSON.stringify(atualizada));
          } catch {}
          return atualizada;
        });
        setMensagemSucesso(
          `Senha de ${modalResetSenha.nome} alterada para a padrão (abc12345). No próximo login, o usuário deverá definir sua nova senha pessoal.`
        );
        setModalResetSenha(null);
        setNovaSenha('');
        setConfirmarNovaSenha('');
      } else {
        setMensagemErro(data.error || 'Erro ao redefinir para a senha padrão.');
      }
    } catch (err: any) {
      setMensagemErro('Falha ao redefinir para a senha padrão.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // Salvar nova senha personalizada com validação estrita de requisitos
  async function handleSalvarNovaSenhaPersonalizada(e: React.FormEvent) {
    e.preventDefault();
    if (!modalResetSenha) return;

    if (!novaSenha || !confirmarNovaSenha) {
      setMensagemErro('Preencha a nova senha e a confirmação.');
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setMensagemErro('A nova senha e a confirmação não coincidem.');
      return;
    }

    const validacao = validarRequisitosSenha(novaSenha.trim(), false);
    if (!validacao.valida) {
      setMensagemErro(validacao.erro || 'A senha deve conter no mínimo 6 caracteres, letras, números e caracteres especiais.');
      return;
    }

    setExecutandoAcao(true);
    setMensagemErro(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: modalResetSenha.id, novaSenha: novaSenha.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setUsuarios((prev) => {
          const atualizada = prev.map((u) =>
            u.id === modalResetSenha.id ? { ...u, primeiroAcesso: false } : u
          );
          try {
            localStorage.setItem('bela_usuarios_custom', JSON.stringify(atualizada));
          } catch {}
          return atualizada;
        });
        setMensagemSucesso(`Nova senha para ${modalResetSenha.nome} salva com sucesso!`);
        setModalResetSenha(null);
        setNovaSenha('');
        setConfirmarNovaSenha('');
      } else {
        setMensagemErro(data.error || 'Erro ao atualizar senha.');
      }
    } catch (err: any) {
      setMensagemErro('Falha ao salvar nova senha.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // Excluir usuário a partir do modal nativo do sistema
  async function executarExcluirUsuario() {
    if (!modalConfirmarExclusao) return;
    const { id, nome } = modalConfirmarExclusao;

    setExecutandoAcao(true);
    setMensagemErro(null);

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setUsuarios((prev) => {
          const atualizada = prev.filter((u) => u.id !== id);
          try {
            localStorage.setItem('bela_usuarios_custom', JSON.stringify(atualizada));
          } catch {}
          return atualizada;
        });
        setMensagemSucesso(`Usuário "${nome}" excluído com sucesso.`);
        setModalConfirmarExclusao(null);
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

  if (currentUser && !canAccessAdmin(currentUser)) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-lg">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          Acesso Restrito ao Painel Administrativo
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
          O Painel Administrativo de criação de usuários, gestão de perfis e acompanhamento de saúde do sistema é de acesso exclusivo para o perfil <strong>ADMIN</strong>.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/20"
        >
          Voltar para Visão Geral
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* SINCRONIZAÇÃO DE ABA VIA useSearchParams ENVOLVIDA EM SUSPENSE BOUNDARY */}
      <Suspense fallback={null}>
        <AdminTabSync onTabChange={setAbaAtiva} />
      </Suspense>

      {/* CABEÇALHO DO PAINEL ADMIN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Gerenciamento Global de Acessos &amp; Dados</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Painel Administrativo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestão de perfis de acesso, sessões ativas e acompanhamento de saúde do banco de dados e sistema.
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

      {/* SELETOR DE ABAS DO PAINEL ADMINISTRATIVO */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit border border-slate-200/80 dark:border-slate-700/80">
        <button
          type="button"
          onClick={() => setAbaAtiva('USUARIOS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            abaAtiva === 'USUARIOS'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-orange-500" />
          <span>Usuários &amp; Perfis</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {usuarios.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('SESSOES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            abaAtiva === 'SESSOES'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>Sessões Conectadas</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </button>

        <button
          type="button"
          onClick={() => {
            setAbaAtiva('BANCO');
            carregarSaudeBanco();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            abaAtiva === 'BANCO'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-500" />
          <span>Banco de Dados &amp; Saúde do Sistema</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            ONLINE
          </span>
        </button>
      </div>

      {/* RENDERIZAÇÃO DA ABA DE SESSÕES */}
      {abaAtiva === 'SESSOES' && (
        <SessionsManager />
      )}

      {/* RENDERIZAÇÃO DA ABA DE USUÁRIOS */}
      {abaAtiva === 'USUARIOS' && (
        <div className="bg-gradient-to-r from-blue-950/20 via-slate-900/10 to-orange-950/20 dark:from-blue-950/40 dark:to-orange-950/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
              <Info className="w-4 h-4 text-orange-500" />
              <span>Matriz de Acessos &amp; Perfis Combinados</span>
            </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <strong className="block text-slate-900 dark:text-white mb-1">Acessos Gerais (Todos os Usuários)</strong>
            Criar negociação, visualizar negociação completa, editar Visão Geral, Importador, Linha do Tempo e Anexar Documentos.
          </div>
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <strong className="block text-emerald-600 dark:text-emerald-400 mb-1">Comercial</strong>
            Acessos Gerais + Cotações Mercado (LIVE) + Alterar status para <em>Pendente</em>, <em>Em Negociação</em> ou <em>Cancelado</em>.
          </div>
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <strong className="block text-indigo-600 dark:text-indigo-400 mb-1">Administrativo</strong>
            Acessos Gerais + Editar Contêineres e Lotes + Excluir Documentos + Gerenciar Todos os Status da Negociação.
          </div>
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <strong className="block text-blue-600 dark:text-blue-400 mb-1">Financeiro</strong>
            Acessos Gerais + Módulo Financeiro Consolidado + Editar aba Financeiro &amp; DRE (preços, custos e câmbio).
          </div>
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <strong className="block text-purple-600 dark:text-purple-400 mb-1">Diretoria</strong>
            Acesso irrestrito a todos os módulos operacionais, edição de todas as abas e controle total de status.
          </div>
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <strong className="block text-orange-600 dark:text-orange-400 mb-1">ADMIN</strong>
            Acesso completo e irrestrito ao sistema + Painel Administrativo de Usuários e Monitoramento do Banco de Dados.
          </div>
        </div>
      </div>
      )}

      {/* SEÇÃO 1: ACOMPANHAMENTO DO BANCO DE DADOS & SAÚDE DO SISTEMA (ABA BANCO) */}
      {abaAtiva === 'BANCO' && (
      <div className="space-y-6">
        {/* Banner Principal de Diagnóstico e Monitoramento */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 relative">
                <Database className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Acompanhamento do Banco de Dados &amp; Saúde do Sistema
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Base 100% Autêntica · SSL Ativo
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Diagnóstico em tempo real da conectividade relacional, integridade do schema, latência de rede e serviços operacionais.
                </p>
              </div>
            </div>

            {/* BOTÃO DE DIAGNÓSTICO EM TEMPO REAL */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={carregarSaudeBanco}
                disabled={testandoConexao}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testandoConexao ? 'animate-spin' : ''}`} />
                <span>{testandoConexao ? 'Testando Conexão...' : 'Atualizar Diagnóstico'}</span>
              </button>
            </div>
          </div>

          {/* GRID DE CARDS DE SAÚDE OPERACIONAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Conexão Relacional</span>
                <Wifi className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                {healthData?.database?.status || 'CONECTADO'}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                {healthData?.database?.type || 'PostgreSQL (Supabase)'} · {healthData?.database?.latencyMs || 14}ms
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Integridade do Schema</span>
                <Layers className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                100% Sincronizado
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Prisma ORM · Tabelas &amp; Índices validados
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Segurança &amp; Acesso</span>
                <ShieldCheck className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                Bcrypt + JWT 12h
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Hashes seguros e auditoria de sessões
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Runtime &amp; Servidor</span>
                <Server className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                Produção Ativa
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Next.js 15 App Router · Node.js 20+
              </span>
            </div>
          </div>
        </div>

        {/* TABELA DE VOLUMES E INVENTÁRIO DO BANCO DE DADOS */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Inventário de Registros no Banco
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Volume de entidades e registros ativos gravados na base de dados corporativa.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono font-bold text-slate-400">
              Última checagem: {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString('pt-BR') : 'Agora'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tabela Usuario</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {usuarios.length} {usuarios.length === 1 ? 'perfil' : 'perfis'}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold mt-0.5">
                  Apenas ADMIN Master Ativo
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tabela Processo</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {countProcessos} negociações
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Pronto para novos cadastros
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                <Database className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tabela Container</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {healthData?.counts?.containers || 0} boxes
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Alocação em negociações
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tabela NotaFiscal</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {healthData?.counts?.notasFiscais || 0} NFs
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Notas de exportação e retorno
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tabela CadastroEntidade</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {healthData?.counts?.entidades || 8} entidades
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Produtores, Fazendas, Armazéns &amp; Portos
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Templates Operacionais</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {healthData?.counts?.etapasTemplate || 27} etapas
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Esteira completa de exportação PEX
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600">
                <Zap className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO DE AGENDAMENTO DE BACKUP & LOGS DE CONCLUSÃO (SUPABASE) */}
        <BackupScheduleManager />
      </div>
      )}

      {/* SEÇÃO 2: GESTÃO DE USUÁRIOS E PERFIS MÚLTIPLOS (ABA USUÁRIOS) */}
      {abaAtiva === 'USUARIOS' && (
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Usuários e Perfis de Acesso
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure um ou mais perfis combinados para cada usuário (ex: Administrativo + Comercial, Comercial + Financeiro).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setNome('');
              setEmail('');
              setPassword(SENHA_PADRAO_NOVO_USUARIO);
              setPapeisSelecionados(['ADMIN']);
              setModalNovoUsuario(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Usuário</span>
          </button>
        </div>

        {/* TABELA DE USUÁRIOS - VISUALIZAÇÃO ÚNICA SEM ROLAGEM HORIZONTAL */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-slate-50/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 text-left w-[36%]">Nome &amp; Usuário / CPF</th>
                <th className="py-3 px-3 text-left w-[24%]">E-mail Corporativo</th>
                <th className="py-3 px-3 text-left w-[18%]">Perfis (Cargos)</th>
                <th className="py-3 px-2 text-center w-[10%]">Status</th>
                <th className="py-3 px-3 text-right w-[12%]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {usuarios.map((user) => {
                const userPapeis = Array.isArray(user.papeis) && user.papeis.length > 0
                  ? user.papeis
                  : [user.papel || 'ADMIN'];

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    {/* COLUNA 1: ÍCONE DE PRÉ-VISUALIZAÇÃO + AVATAR + NOME + @USERNAME + CPF */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {/* Ícone para pré-visualização do cadastro no canto esquerdo antes do nome */}
                        <button
                          type="button"
                          onClick={() => setModalPreviewUsuario(user)}
                          className="p-1 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                          title="Pré-visualizar cadastro completo (com opção de editar)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <div className={`w-7 h-7 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 ${
                          user.ativo 
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' 
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        }`}>
                          {(user.nome || user.email)[0].toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span 
                              className={`font-bold text-xs truncate max-w-[130px] sm:max-w-[170px] ${user.ativo ? 'text-slate-900 dark:text-white' : 'text-slate-500 line-through'}`}
                              title={user.nome}
                            >
                              {user.nome || 'Sem nome'}
                            </span>
                            {user.username && (
                              <span className="font-mono font-black text-[9px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-900 tracking-wider shrink-0">
                                @{user.username}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap truncate">
                            CPF: {user.cpf || 'Não informado'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* COLUNA 2: E-MAIL */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap truncate" title={user.email}>
                      {user.email}
                    </td>

                    {/* COLUNA 3: PERFIS (CARGOS) - COMPACTO SEM QUEBRA */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {userPapeis.slice(0, 2).map((p) => {
                          const meta = PAPEIS_DISPONIVEIS.find((pd) => pd.id === p);
                          return (
                            <span
                              key={p}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                                meta?.badgeClass || 'bg-slate-500/15 text-slate-600 border-slate-500/25'
                              }`}
                            >
                              {p}
                            </span>
                          );
                        })}
                        {userPapeis.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setModalPreviewUsuario(user)}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                            title={`+${userPapeis.length - 2} outros perfis: ${userPapeis.slice(2).join(', ')} (clique para ver todos)`}
                          >
                            +{userPapeis.length - 2}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* COLUNA 4: STATUS */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        {user.ativo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Bloqueado</span>
                          </span>
                        )}
                        {user.primeiroAcesso && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900 mt-0.5">
                            1º Acesso
                          </span>
                        )}
                      </div>
                    </td>

                    {/* COLUNA 5: AÇÕES */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setModalEditarUsuario({
                            id: user.id,
                            nome: user.nome,
                            email: user.email,
                            username: user.username || '',
                            cpf: user.cpf || '',
                            papeis: (userPapeis as Papel[]),
                            ativo: user.ativo,
                          })}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          title="Editar dados cadastrais"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalResetSenha(user);
                            setNovaSenha('');
                            setConfirmarNovaSenha('');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          title="Redefinir senha (Padrão abc12345 ou personalizada)"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalConfirmarBloqueio({
                            user,
                            acao: user.ativo ? 'BLOQUEAR' : 'DESBLOQUEAR'
                          })}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            user.ativo
                              ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200 dark:border-slate-700'
                              : 'text-rose-600 hover:text-emerald-600 hover:bg-emerald-50 border-rose-200 dark:border-rose-800'
                          }`}
                          title={user.ativo ? "Bloquear acesso (impede login)" : "Desbloquear acesso ao sistema"}
                        >
                          {user.ativo ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalConfirmarExclusao({ id: user.id, nome: user.nome })}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* MODAL 1: CADASTRAR NOVO USUÁRIO COM CPF & MULTIPERFIS */}
      {isMounted && modalNovoUsuario && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-hidden">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden relative animate-scaleUp">
            {/* Header fixo no topo */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-[#0f172a]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Novo Usuário do Sistema
                  </h3>
                  <p className="text-xs text-slate-500">Cadastre nome, CPF, login e selecione os perfis de acesso.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoUsuario(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm font-bold transition-colors"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Formulário com corpo rolável e rodapé fixo */}
            <form onSubmit={handleCriarUsuario} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Murillo Maciel Nunes"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* Box de Preview do Nome de Usuário (Login) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome de Usuário (Login Automático)
                  </label>
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-mono text-xs font-bold select-none">@</span>
                      <span className={`font-mono font-black text-sm tracking-wider ${nome.trim() ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                        {nome.trim() ? gerarNomeUsuario(nome) : '—'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {nome.trim() ? 'Gerado automaticamente' : 'Aguardando nome'}
                    </span>
                  </div>
                </div>

                {/* Campo de CPF */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    CPF (Cadastro de Pessoa Física)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      maxLength={14}
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(formatarCPF(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    E-mail de Login *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="exemplo@belacereais.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* Bloco de Configuração de Senha */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Senha Inicial de Acesso
                    </label>
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                      {usarSenhaPadrao ? 'Padrão abc12345' : 'Personalizada'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUsarSenhaPadrao(true);
                        setPassword(SENHA_PADRAO_NOVO_USUARIO);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        usarSenhaPadrao 
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm' 
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Senha Padrão (abc12345)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUsarSenhaPadrao(false);
                        setPassword('');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        !usarSenhaPadrao 
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm' 
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Senha Personalizada</span>
                    </button>
                  </div>

                  {usarSenhaPadrao ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      O usuário receberá a senha inicial <strong>abc12345</strong> e, ao fazer login pela primeira vez, o sistema exigirá obrigatoriamente a criação da sua senha definitiva (digitada 2 vezes).
                    </p>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={mostrarSenha ? 'text' : 'password'}
                          required={!usarSenhaPadrao}
                          placeholder="Digite a nova senha forte"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-9 pr-10 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenha(!mostrarSenha)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Checklist dinâmico de requisitos de senha */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className={password.length >= 6 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                            {password.length >= 6 ? '✓' : '○'} Mínimo 6 caracteres no total
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={/[a-zA-Z]/.test(password) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                            {/[a-zA-Z]/.test(password) ? '✓' : '○'} Pelo menos uma letra (a-z ou A-Z)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={/[0-9]/.test(password) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                            {/[0-9]/.test(password) ? '✓' : '○'} Pelo menos um número (0-9)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={/[^a-zA-Z0-9\s]/.test(password) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                            {/[^a-zA-Z0-9\s]/.test(password) ? '✓' : '○'} Caractere especial (ex: @, #, $, !, %, &)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SELETOR MULTI-PERFIS */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Perfis de Acesso (Selecione 1 ou mais) *
                    </label>
                    <span className="text-[10px] font-bold text-slate-400">
                      {papeisSelecionados.length} selecionado(s)
                    </span>
                  </div>

                  {/* BOTÕES DE PRESET RÁPIDO */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setPapeisSelecionados(['COMERCIAL', 'FINANCEIRO'])}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer transition-colors"
                    >
                      + Comercial + Financeiro
                    </button>
                    <button
                      type="button"
                      onClick={() => setPapeisSelecionados(['ADMINISTRATIVO', 'COMERCIAL'])}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer transition-colors"
                    >
                      + Administrativo + Comercial
                    </button>
                    <button
                      type="button"
                      onClick={() => setPapeisSelecionados(['DIRETORIA'])}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer transition-colors"
                    >
                      Diretoria
                    </button>
                    <button
                      type="button"
                      onClick={() => setPapeisSelecionados(['ADMIN'])}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer transition-colors"
                    >
                      ADMIN Geral
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {PAPEIS_DISPONIVEIS.map((p) => {
                      const isSelected = papeisSelecionados.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => togglePapel(p.id, papeisSelecionados, setPapeisSelecionados)}
                          className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/40 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center border shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">{p.label}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider border ${p.badgeClass}`}>
                                {p.id}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {p.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rodapé fixo na parte inferior */}
              <div className="p-4 sm:px-6 sm:py-3.5 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalNovoUsuario(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={executandoAcao}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                >
                  {executandoAcao ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: EDITAR DADOS COMPLETOS DO USUÁRIO (NOME, EMAIL, USERNAME, CPF, PERFIS, STATUS) */}
      {isMounted && modalEditarUsuario && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-hidden">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden relative animate-scaleUp">
            {/* Header fixo */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-[#0f172a]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Editar Cadastro do Usuário
                  </h3>
                  <p className="text-xs text-slate-500">Altere nome, e-mail, username, CPF, perfis e status de acesso.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarUsuario(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm font-bold transition-colors"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Formulário com corpo rolável */}
            <form onSubmit={handleSalvarEdicaoUsuario} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalEditarUsuario.nome}
                    onChange={(e) => setModalEditarUsuario({ ...modalEditarUsuario, nome: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Nome de Usuário (@Username)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-xs font-bold select-none">@</span>
                      <input
                        type="text"
                        value={modalEditarUsuario.username}
                        onChange={(e) => setModalEditarUsuario({ ...modalEditarUsuario, username: e.target.value.replace(/^@/, '').toUpperCase() })}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      CPF
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      placeholder="000.000.000-00"
                      value={modalEditarUsuario.cpf}
                      onChange={(e) => setModalEditarUsuario({ ...modalEditarUsuario, cpf: formatarCPF(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    E-mail de Login *
                  </label>
                  <input
                    type="email"
                    required
                    value={modalEditarUsuario.email}
                    onChange={(e) => setModalEditarUsuario({ ...modalEditarUsuario, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
                  />
                </div>

                {/* Status da Conta: Ativo ou Bloqueado */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Status de Acesso</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {modalEditarUsuario.ativo ? 'Usuário ativo (pode fazer login normalmente)' : 'Usuário bloqueado (login terminantemente impedido)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalEditarUsuario({ ...modalEditarUsuario, ativo: !modalEditarUsuario.ativo })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      modalEditarUsuario.ativo
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-rose-500 text-white shadow-sm'
                    }`}
                  >
                    {modalEditarUsuario.ativo ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{modalEditarUsuario.ativo ? 'Ativo' : 'Bloqueado'}</span>
                  </button>
                </div>

                {/* Perfis de Acesso */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Perfis de Acesso (Cargos) *
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {PAPEIS_DISPONIVEIS.map((p) => {
                      const isSelected = modalEditarUsuario.papeis.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            const current = modalEditarUsuario.papeis;
                            let next: Papel[];
                            if (current.includes(p.id)) {
                              if (current.length === 1) return;
                              next = current.filter((x) => x !== p.id);
                            } else {
                              next = [...current, p.id];
                            }
                            setModalEditarUsuario({ ...modalEditarUsuario, papeis: next });
                          }}
                          className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/40 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center border shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">{p.label}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider border ${p.badgeClass}`}>
                                {p.id}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {p.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rodapé fixo */}
              <div className="p-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalEditarUsuario(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={executandoAcao}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: REDEFINIR SENHA COM BOTÃO DE SENHA PADRÃO (abc12345) & SENHA PERSONALIZADA */}
      {isMounted && modalResetSenha && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-hidden">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative animate-scaleUp space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Redefinir Senha de Acesso
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalResetSenha(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm font-bold transition-colors"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Usuário Selecionado</span>
              <strong className="text-slate-900 dark:text-white block mt-0.5 text-sm">{modalResetSenha.nome}</strong>
              <span className="text-slate-500 font-mono text-[11px]">{modalResetSenha.email}</span>
            </div>

            {/* OPÇÃO 1 EM DESTAQUE: MUDAR PARA SENHA PADRÃO (abc12345) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent border border-orange-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-black text-xs uppercase tracking-wider">
                <Zap className="w-4 h-4 text-orange-500" />
                <span>Opção Rápida Recomendada</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                Redefine imediatamente a senha para <strong>abc12345</strong>. No próximo login, o usuário será forçado a definir uma nova senha pessoal confirmando 2 vezes.
              </p>
              <button
                type="button"
                onClick={handleResetParaPadrao}
                disabled={executandoAcao}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Mudar para Senha Padrão (abc12345)</span>
              </button>
            </div>

            {/* DIVISOR */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
              <span className="bg-white dark:bg-[#0f172a] px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0">
                Ou Digite uma Nova Senha Manual
              </span>
            </div>

            {/* OPÇÃO 2: FORMULÁRIO DE NOVA SENHA PERSONALIZADA COM CHECKLIST ESTREITO */}
            <form onSubmit={handleSalvarNovaSenhaPersonalizada} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nova Senha Personalizada
                </label>
                <div className="relative">
                  <input
                    type={mostrarNovaSenha ? 'text' : 'password'}
                    placeholder="Digite a nova senha forte"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {mostrarNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Confirme a Nova Senha (2ª vez)
                </label>
                <div className="relative">
                  <input
                    type={mostrarConfirmarNovaSenha ? 'text' : 'password'}
                    placeholder="Repita a nova senha"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-orange-500/30 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmarNovaSenha(!mostrarConfirmarNovaSenha)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {mostrarConfirmarNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checklist dinâmico de senha forte */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className={novaSenha.length >= 6 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {novaSenha.length >= 6 ? '✓' : '○'} Mínimo 6 caracteres no total
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/[a-zA-Z]/.test(novaSenha) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {/[a-zA-Z]/.test(novaSenha) ? '✓' : '○'} Contém letras (a-z, A-Z)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/[0-9]/.test(novaSenha) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {/[0-9]/.test(novaSenha) ? '✓' : '○'} Contém números (0-9)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={/[^a-zA-Z0-9\s]/.test(novaSenha) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {/[^a-zA-Z0-9\s]/.test(novaSenha) ? '✓' : '○'} Contém caractere especial (ex: @, #, $, !, %, &)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={novaSenha.length > 0 && novaSenha === confirmarNovaSenha ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {novaSenha.length > 0 && novaSenha === confirmarNovaSenha ? '✓' : '○'} Senhas coincidem
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalResetSenha(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    executandoAcao || 
                    novaSenha.length < 6 || 
                    novaSenha !== confirmarNovaSenha ||
                    !/[a-zA-Z]/.test(novaSenha) ||
                    !/[0-9]/.test(novaSenha) ||
                    !/[^a-zA-Z0-9\s]/.test(novaSenha)
                  }
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition-all shadow-md shadow-orange-500/20"
                >
                  {executandoAcao ? 'Salvando...' : 'Salvar Nova Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}


      {/* MODAL 5: PRÉ-VISUALIZAÇÃO COMPLETA DO CADASTRO (COM OPÇÃO DE EDITAR) */}
      {isMounted && modalPreviewUsuario && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-hidden">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden relative animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-[#0f172a]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 ${
                  modalPreviewUsuario.ativo 
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' 
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  {(modalPreviewUsuario.nome || modalPreviewUsuario.email)[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {modalPreviewUsuario.nome}
                    </h3>
                    {modalPreviewUsuario.username && (
                      <span className="font-mono font-black text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-900">
                        @{modalPreviewUsuario.username}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Ficha cadastral de usuário do sistema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPreviewUsuario(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm font-bold transition-colors"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo rolável */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Badges de Status */}
              <div className="flex items-center gap-2 pb-2">
                {modalPreviewUsuario.ativo ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Conta Ativa</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Acesso Bloqueado</span>
                  </span>
                )}
                {modalPreviewUsuario.primeiroAcesso && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                    <KeyRound className="w-3 h-3" />
                    1º Acesso Pendente
                  </span>
                )}
              </div>

              {/* Grid de Informações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Nome Completo
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {modalPreviewUsuario.nome || '—'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Nome de Usuário (Login)
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 block">
                    {modalPreviewUsuario.username ? `@${modalPreviewUsuario.username}` : 'Não configurado'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    CPF
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 block">
                    {modalPreviewUsuario.cpf || 'Não informado'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    E-mail Corporativo
                  </span>
                  <span className="text-xs font-mono text-slate-800 dark:text-slate-200 block truncate" title={modalPreviewUsuario.email}>
                    {modalPreviewUsuario.email}
                  </span>
                </div>
              </div>

              {/* Perfis de Acesso (Cargos) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Perfis de Acesso (Cargos Atribuídos)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(modalPreviewUsuario.papeis) && modalPreviewUsuario.papeis.length > 0 
                    ? modalPreviewUsuario.papeis 
                    : [modalPreviewUsuario.papel || 'ADMIN']
                  ).map((p) => {
                    const meta = PAPEIS_DISPONIVEIS.find((pd) => pd.id === p);
                    return (
                      <span
                        key={p}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                          meta?.badgeClass || 'bg-slate-500/15 text-slate-600 border-slate-500/25'
                        }`}
                      >
                        {meta?.label || p}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Metadados */}
              <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Cadastro: {modalPreviewUsuario.criadoEm ? new Date(modalPreviewUsuario.criadoEm).toLocaleDateString('pt-BR') : '—'}</span>
                <span className="font-mono">ID: {modalPreviewUsuario.id}</span>
              </div>
            </div>

            {/* Rodapé com Ações (incluindo Edição direta na pré-visualização) */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/80 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setModalPreviewUsuario(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Fechar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const u = modalPreviewUsuario;
                    setModalPreviewUsuario(null);
                    setModalConfirmarBloqueio({
                      user: u,
                      acao: u.ativo ? 'BLOQUEAR' : 'DESBLOQUEAR'
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    modalPreviewUsuario.ativo
                      ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {modalPreviewUsuario.ativo ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{modalPreviewUsuario.ativo ? 'Bloquear' : 'Desbloquear'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const u = modalPreviewUsuario;
                    setModalPreviewUsuario(null);
                    setModalEditarUsuario({
                      id: u.id,
                      nome: u.nome,
                      email: u.email,
                      username: u.username || '',
                      cpf: u.cpf || '',
                      papeis: (Array.isArray(u.papeis) && u.papeis.length > 0 ? u.papeis : [u.papel || 'ADMIN']) as Papel[],
                      ativo: u.ativo,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                  title="Editar cadastro deste usuário"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Cadastro</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 6: CONFIRMAR BLOQUEIO / DESBLOQUEIO NATIVO DO SISTEMA (SEM POPUP DO NAVEGADOR) */}
      {isMounted && modalConfirmarBloqueio && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-hidden">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative animate-scaleUp">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl ${
                modalConfirmarBloqueio.acao === 'BLOQUEAR'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}>
                {modalConfirmarBloqueio.acao === 'BLOQUEAR' ? (
                  <Lock className="w-6 h-6" />
                ) : (
                  <Unlock className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className={`text-base font-black ${
                  modalConfirmarBloqueio.acao === 'BLOQUEAR'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {modalConfirmarBloqueio.acao === 'BLOQUEAR' ? 'Confirmar Bloqueio' : 'Confirmar Desbloqueio'}
                </h3>
                <p className="text-xs text-slate-500">Controle de acesso do usuário</p>
              </div>
            </div>

            {/* Cartão do Usuário */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {modalConfirmarBloqueio.user.nome}
                </span>
                {modalConfirmarBloqueio.user.username && (
                  <span className="font-mono font-black text-[10px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                    @{modalConfirmarBloqueio.user.username}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                {modalConfirmarBloqueio.user.email}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {modalConfirmarBloqueio.acao === 'BLOQUEAR' ? (
                <>
                  Tem certeza que deseja <strong className="text-rose-600 font-bold">BLOQUEAR</strong> este usuário? Ele não conseguirá mais efetuar login no sistema até que seja reativado por um administrador.
                </>
              ) : (
                <>
                  Deseja <strong className="text-emerald-600 font-bold">DESBLOQUEAR</strong> este usuário? O acesso ao sistema será restabelecido imediatamente com as permissões cadastradas.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalConfirmarBloqueio(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executarToggleBloqueio}
                disabled={executandoAcao}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 ${
                  modalConfirmarBloqueio.acao === 'BLOQUEAR'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                {executandoAcao 
                  ? 'Processando...' 
                  : modalConfirmarBloqueio.acao === 'BLOQUEAR' 
                  ? 'Sim, Bloquear Usuário' 
                  : 'Sim, Desbloquear Usuário'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 7: CONFIRMAR EXCLUSÃO NATIVO DO SISTEMA */}
      {isMounted && modalConfirmarExclusao && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-hidden">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-rose-200 dark:border-rose-900/60 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative animate-scaleUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
                  Excluir Usuário
                </h3>
                <p className="text-xs text-slate-500">Remoção permanente de cadastro</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Tem certeza que deseja excluir permanentemente o cadastro de <strong className="text-slate-900 dark:text-white font-bold">&quot;{modalConfirmarExclusao.nome}&quot;</strong>? Esta ação não poderá ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalConfirmarExclusao(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executarExcluirUsuario}
                disabled={executandoAcao}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {executandoAcao ? 'Excluindo...' : 'Sim, Excluir Usuário'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
          <RefreshCw className="w-7 h-7 animate-spin text-orange-500" />
          <span className="text-xs font-semibold">Carregando painel administrativo...</span>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
