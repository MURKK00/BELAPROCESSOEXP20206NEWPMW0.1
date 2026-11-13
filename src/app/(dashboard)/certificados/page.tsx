'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileKey2,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Power,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Info,
  Clock,
  History,
  KeyRound,
} from 'lucide-react';
import {
  formatarFinalidadeCertificado,
  FinalidadeCertificado,
} from '@/lib/certificadosUtils';
import {
  ModalCertificadoForm,
  CertificadoSubstituicaoAlvo,
} from '@/components/certificados/ModalCertificadoForm';
import {
  ModalExcluirCertificado,
  CertificadoExclusaoAlvo,
} from '@/components/certificados/ModalExcluirCertificado';

interface CertificadoItem {
  id: string;
  tipo: string;
  documento: string;
  documentoFormatado: string;
  titular: string;
  emissor: string;
  validadeInicio: string;
  validadeFim: string;
  finalidade: string;
  ativo: boolean;
  diasRestantes: number;
  vencido: boolean;
  alertaAmarelo: boolean;
  rotuloValidade: string;
  criadoPorId: string;
  criadoPorNome: string;
  criadoEm: string;
  atualizadoEm: string;
}

interface AuditoriaCertificadoItem {
  id: string;
  certificadoId: string | null;
  acao: string;
  detalhe: string;
  alteracoes: any;
  criadoEm: string;
  usuarioNome: string;
  usuarioEmail: string;
}

function formatarDataBrasil(iso: string, incluirHora = false): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  if (incluirHora) {
    return d.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function rotuloAcaoAuditoria(acao: string): string {
  switch (acao) {
    case 'CERTIFICADO_ENVIADO':
      return 'Enviado';
    case 'CERTIFICADO_SUBSTITUIDO':
      return 'Substituído';
    case 'CERTIFICADO_ATIVADO':
      return 'Ativado';
    case 'CERTIFICADO_DESATIVADO':
      return 'Desativado';
    case 'CERTIFICADO_EXCLUIDO':
      return 'Excluído';
    default:
      return acao;
  }
}

export default function CertificadosDigitaisPage() {
  const [certificados, setCertificados] = useState<CertificadoItem[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaCertificadoItem[]>([]);
  const [encryptionConfigured, setEncryptionConfigured] = useState<boolean>(true);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const [abaAtiva, setAbaAtiva] = useState<'CERTIFICADOS' | 'AUDITORIA'>('CERTIFICADOS');
  const [busca, setBusca] = useState('');
  const [filtroFinalidade, setFiltroFinalidade] = useState<'TODAS' | FinalidadeCertificado>('TODAS');
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [alvoSubstituicao, setAlvoSubstituicao] =
    useState<CertificadoSubstituicaoAlvo | null>(null);
  const [alvoExclusao, setAlvoExclusao] =
    useState<CertificadoExclusaoAlvo | null>(null);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErroCarregamento(null);
    try {
      const res = await fetch('/api/certificados', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErroCarregamento(
          data?.error || 'Não foi possível carregar os certificados digitais.'
        );
        return;
      }
      setCertificados(Array.isArray(data?.certificados) ? data.certificados : []);
      setAuditoria(Array.isArray(data?.auditoria) ? data.auditoria : []);
      setEncryptionConfigured(Boolean(data?.encryptionConfigured));
    } catch {
      setErroCarregamento('Falha de comunicação ao consultar certificados digitais.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const certificadosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return certificados.filter((item) => {
      if (filtroFinalidade !== 'TODAS' && item.finalidade !== filtroFinalidade) {
        return false;
      }
      if (!termo) return true;
      return (
        item.titular.toLowerCase().includes(termo) ||
        item.documento.includes(termo.replace(/\D/g, '') || '__none__') ||
        item.documentoFormatado.toLowerCase().includes(termo) ||
        item.emissor.toLowerCase().includes(termo)
      );
    });
  }, [certificados, busca, filtroFinalidade]);

  const totais = useMemo(() => {
    const ativos = certificados.filter((c) => c.ativo).length;
    const alerta30Dias = certificados.filter(
      (c) => c.ativo && !c.vencido && c.alertaAmarelo
    ).length;
    const vencidos = certificados.filter((c) => c.vencido).length;
    return {
      total: certificados.length,
      ativos,
      alerta30Dias,
      vencidos,
    };
  }, [certificados]);

  const handleToggleAtivo = async (cert: CertificadoItem) => {
    setMensagemErro(null);
    setMensagemSucesso(null);
    setProcessandoId(cert.id);
    try {
      const res = await fetch(`/api/certificados/${cert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !cert.ativo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMensagemErro(
          data?.error || 'Não foi possível alterar o status do certificado.'
        );
        return;
      }
      setMensagemSucesso(
        `Certificado de ${cert.titular} ${!cert.ativo ? 'ativado' : 'desativado'} com sucesso.`
      );
      await carregarDados();
    } catch {
      setMensagemErro('Erro de rede ao atualizar status do certificado.');
    } finally {
      setProcessandoId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Cabeçalho principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Certificados Digitais
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Cofre criptografado de certificados A1 (e-CNPJ / e-CPF) para consultas futuras na SEFAZ e no Siscomex. Acesso exclusivo Admin e Diretoria.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMensagemErro(null);
            setAlvoSubstituicao(null);
            setModalFormAberto(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Enviar Certificado A1
        </button>
      </div>

      {/* Aviso obrigatório sobre A3 + Segurança */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
        <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Somente Certificado A1 (.pfx / .p12 até 1 MB):
          </span>{' '}
          Certificados <strong>A3 (token USB ou cartão inteligente)</strong> não permitem upload e não são suportados para automação em nuvem. Arquivos e senhas são criptografados com AES-256-GCM e jamais podem ser baixados ou visualizados após o envio.
        </div>
      </div>

      {/* Alerta se CERT_ENCRYPTION_KEY estiver ausente */}
      {!encryptionConfigured && !carregando && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-200">
          <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">
              Chave de criptografia do servidor não configurada (CERT_ENCRYPTION_KEY)
            </div>
            <p>
              Novos envios e substituições estão bloqueados até que a variável de ambiente{' '}
              <code className="font-mono px-1 py-0.5 rounded bg-red-100 dark:bg-red-900/50">
                CERT_ENCRYPTION_KEY
              </code>{' '}
              (32 bytes em base64) seja configurada no servidor.
            </p>
          </div>
        </div>
      )}

      {/* Feedback de sucesso / erro */}
      {mensagemSucesso && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensagemSucesso(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:underline font-medium shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      {mensagemErro && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{mensagemErro}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensagemErro(null)}
            className="text-red-700 dark:text-red-300 hover:underline font-medium shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Resumo limpo em linha (elevação única, sem cards aninhados) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Cadastrados
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums font-mono">
            {totais.total}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Ativos
          </div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
            {totais.ativos}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Vencendo em até 30 dias
          </div>
          <div className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400 tabular-nums font-mono">
            {totais.alerta30Dias}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Vencidos
          </div>
          <div className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400 tabular-nums font-mono">
            {totais.vencidos}
          </div>
        </div>
      </div>

      {/* Barra de abas e filtros */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 self-start">
            <button
              type="button"
              onClick={() => setAbaAtiva('CERTIFICADOS')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                abaAtiva === 'CERTIFICADOS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Certificados Cadastrados ({certificados.length})
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('AUDITORIA')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                abaAtiva === 'AUDITORIA'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Histórico de Auditoria ({auditoria.length})
            </button>
          </div>

          {abaAtiva === 'CERTIFICADOS' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar titular, CNPJ, CPF ou emissor..."
                  className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <select
                value={filtroFinalidade}
                onChange={(e) =>
                  setFiltroFinalidade(
                    e.target.value as 'TODAS' | FinalidadeCertificado
                  )
                }
                aria-label="Filtrar por finalidade"
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="TODAS">Todas as finalidades</option>
                <option value="SEFAZ">SEFAZ</option>
                <option value="SISCOMEX">Siscomex</option>
                <option value="AMBOS">SEFAZ + Siscomex</option>
              </select>

              <button
                type="button"
                onClick={carregarDados}
                disabled={carregando}
                title="Atualizar lista"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`}
                />
                Atualizar
              </button>
            </div>
          )}
        </div>

        {/* Conteúdo da Aba */}
        {carregando ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-11 rounded-lg bg-slate-100 dark:bg-slate-800/70 animate-pulse"
              />
            ))}
          </div>
        ) : erroCarregamento ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {erroCarregamento}
            </p>
            <button
              type="button"
              onClick={carregarDados}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
            >
              Tentar Novamente
            </button>
          </div>
        ) : abaAtiva === 'CERTIFICADOS' ? (
          certificadosFiltrados.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <FileKey2 className="w-9 h-9 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {certificados.length === 0
                    ? 'Nenhum certificado A1 cadastrado'
                    : 'Nenhum certificado encontrado para o filtro'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {certificados.length === 0
                    ? 'Envie o arquivo .pfx ou .p12 (e-CNPJ ou e-CPF) com sua senha para armazenar com criptografia AES-256-GCM.'
                    : 'Ajuste os termos de busca ou selecione outra finalidade.'}
                </p>
              </div>
              {certificados.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setAlvoSubstituicao(null);
                    setModalFormAberto(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Enviar Primeiro Certificado
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Titular & Emissor</th>
                    <th className="py-3 px-4">Documento</th>
                    <th className="py-3 px-4">Finalidade</th>
                    <th className="py-3 px-4">Validade</th>
                    <th className="py-3 px-4">Situação / Prazo</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {certificadosFiltrados.map((cert) => {
                    const busy = processandoId === cert.id;
                    return (
                      <tr
                        key={cert.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${
                          !cert.ativo ? 'opacity-65' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {cert.titular}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {cert.emissor} · Enviado por {cert.criadoPorNome}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                            {cert.documentoFormatado}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {cert.tipo}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                          {formatarFinalidadeCertificado(cert.finalidade)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          <div>{formatarDataBrasil(cert.validadeFim)}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Início: {formatarDataBrasil(cert.validadeInicio)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center gap-1.5 font-semibold ${
                                cert.vencido
                                  ? 'text-red-600 dark:text-red-400'
                                  : cert.alertaAmarelo
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {cert.vencido ? (
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              ) : cert.alertaAmarelo ? (
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span className="tabular-nums">
                                {cert.rotuloValidade}
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {cert.ativo ? 'Ativo' : 'Desativado'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setAlvoSubstituicao({
                                  id: cert.id,
                                  titular: cert.titular,
                                  tipo: cert.tipo,
                                  documentoFormatado: cert.documentoFormatado,
                                  finalidade: cert.finalidade,
                                });
                                setModalFormAberto(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Substituir
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleToggleAtivo(cert)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors ${
                                cert.ativo
                                  ? 'border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                  : 'border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              }`}
                            >
                              <Power className="w-3 h-3" />
                              {cert.ativo ? 'Desativar' : 'Ativar'}
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setAlvoExclusao({
                                  id: cert.id,
                                  titular: cert.titular,
                                  tipo: cert.tipo,
                                  documentoFormatado: cert.documentoFormatado,
                                  finalidade: cert.finalidade,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 text-[11px] font-medium transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : auditoria.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <History className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Nenhum registro de auditoria ainda
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Todas as operações de envio, substituição, ativação, desativação e exclusão aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {auditoria.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                  >
                    <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {formatarDataBrasil(log.criadoEm, true)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {log.usuarioNome}
                      </div>
                      {log.usuarioEmail && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {log.usuarioEmail}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200">
                      {rotuloAcaoAuditoria(log.acao)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {log.detalhe}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Envio / Substituição */}
      <ModalCertificadoForm
        isOpen={modalFormAberto}
        onClose={() => {
          setModalFormAberto(false);
          setAlvoSubstituicao(null);
        }}
        onSuccess={async (msg) => {
          setMensagemErro(null);
          setMensagemSucesso(msg);
          await carregarDados();
        }}
        certificadoParaSubstituir={alvoSubstituicao}
        encryptionConfigured={encryptionConfigured}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ModalExcluirCertificado
        alvo={alvoExclusao}
        onClose={() => setAlvoExclusao(null)}
        onConfirmado={async (msg) => {
          setMensagemErro(null);
          setMensagemSucesso(msg);
          await carregarDados();
        }}
      />
    </div>
  );
}
