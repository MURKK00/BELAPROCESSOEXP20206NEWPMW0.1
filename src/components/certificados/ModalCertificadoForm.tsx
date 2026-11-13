'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Eye,
  EyeOff,
  FileKey2,
  AlertTriangle,
  Lock,
  Loader2,
  Info,
} from 'lucide-react';
import {
  FINALIDADES_CERTIFICADO,
  FinalidadeCertificado,
  MAX_CERT_UPLOAD_BYTES,
} from '@/lib/certificadosUtils';

export interface CertificadoSubstituicaoAlvo {
  id: string;
  titular: string;
  tipo: string;
  documentoFormatado: string;
  finalidade: string;
}

interface ModalCertificadoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (mensagem: string) => void;
  certificadoParaSubstituir?: CertificadoSubstituicaoAlvo | null;
  encryptionConfigured: boolean;
}

export function ModalCertificadoForm({
  isOpen,
  onClose,
  onSuccess,
  certificadoParaSubstituir,
  encryptionConfigured,
}: ModalCertificadoFormProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [finalidade, setFinalidade] = useState<FinalidadeCertificado>('SEFAZ');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const modoSubstituicao = Boolean(certificadoParaSubstituir);

  useEffect(() => {
    if (isOpen) {
      setArquivo(null);
      setSenha('');
      setMostrarSenha(false);
      setErro(null);
      if (
        certificadoParaSubstituir?.finalidade === 'SEFAZ' ||
        certificadoParaSubstituir?.finalidade === 'SISCOMEX' ||
        certificadoParaSubstituir?.finalidade === 'AMBOS'
      ) {
        setFinalidade(certificadoParaSubstituir.finalidade);
      } else {
        setFinalidade('SEFAZ');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, certificadoParaSubstituir]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErro(null);
    const selecionado = e.target.files?.[0] || null;
    if (!selecionado) {
      setArquivo(null);
      return;
    }

    const lower = selecionado.name.toLowerCase();
    if (!lower.endsWith('.pfx') && !lower.endsWith('.p12')) {
      setArquivo(null);
      setErro(
        'Formato inválido. Selecione apenas arquivos de certificado A1 (.pfx ou .p12).'
      );
      return;
    }

    if (selecionado.size <= 0 || selecionado.size > MAX_CERT_UPLOAD_BYTES) {
      setArquivo(null);
      setErro('O arquivo excede o limite máximo de 1 MB.');
      return;
    }

    setArquivo(selecionado);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!encryptionConfigured) {
      setErro(
        'A variável CERT_ENCRYPTION_KEY não está configurada no servidor. Configure a chave antes de enviar certificados.'
      );
      return;
    }

    if (!arquivo) {
      setErro('Selecione um arquivo .pfx ou .p12.');
      return;
    }

    if (!senha) {
      setErro('Informe a senha do certificado digital.');
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('senha', senha);
      formData.append('finalidade', finalidade);

      const url = modoSubstituicao
        ? `/api/certificados/${certificadoParaSubstituir!.id}`
        : '/api/certificados';
      const method = modoSubstituicao ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(
          data?.error ||
            'Não foi possível validar e armazenar o certificado digital.'
        );
        return;
      }

      setSenha('');
      setArquivo(null);
      onSuccess(
        modoSubstituicao
          ? `Certificado de ${data?.certificado?.titular || certificadoParaSubstituir?.titular} substituído com sucesso.`
          : `Certificado de ${data?.certificado?.titular || 'titular'} validado e armazenado com segurança.`
      );
      onClose();
    } catch {
      setErro('Erro de comunicação com o servidor ao enviar o certificado.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-certificado-titulo"
    >
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileKey2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="modal-certificado-titulo"
                className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate"
              >
                {modoSubstituicao
                  ? 'Substituir Certificado Digital A1'
                  : 'Enviar Certificado Digital A1'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {modoSubstituicao
                  ? `${certificadoParaSubstituir?.titular} · ${certificadoParaSubstituir?.documentoFormatado}`
                  : 'Arquivo .pfx ou .p12 (máx. 1 MB) com extração automática'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            aria-label="Fechar janela"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Aviso sobre A3 e criptografia */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-xs text-slate-600 dark:text-slate-300">
            <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Aceita somente certificados <strong>A1 (.pfx / .p12)</strong> com chave privada embarcada.{' '}
              <strong>Certificados A3 (token USB ou cartão)</strong> não permitem upload. O arquivo e a senha são criptografados com AES-256-GCM no servidor e nunca ficam expostos.
            </p>
          </div>

          {!encryptionConfigured && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Upload bloqueado: a variável <code>CERT_ENCRYPTION_KEY</code> não está definida no ambiente do servidor.
              </p>
            </div>
          )}

          {erro && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{erro}</p>
            </div>
          )}

          {/* Arquivo .pfx / .p12 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Arquivo do Certificado A1 (.pfx ou .p12)
            </label>
            <label className="flex flex-col items-center justify-center gap-1.5 px-4 py-5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-colors cursor-pointer">
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 text-center">
                {arquivo
                  ? `${arquivo.name} (${(arquivo.size / 1024).toFixed(1)} KB)`
                  : 'Clique para selecionar arquivo .pfx ou .p12 (até 1 MB)'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pfx,.p12,application/x-pkcs12"
                onChange={handleFileChange}
                className="sr-only"
                disabled={enviando}
              />
            </label>
          </div>

          {/* Senha */}
          <div>
            <label
              htmlFor="cert-senha"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Senha do Certificado
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="cert-senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => {
                  setErro(null);
                  setSenha(e.target.value);
                }}
                placeholder="Digite a senha que abre o arquivo .pfx/.p12"
                autoComplete="new-password"
                disabled={enviando}
                className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((prev) => !prev)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Visualizar senha'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {mostrarSenha ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Finalidade */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Finalidade de Uso
            </span>
            <div className="grid grid-cols-3 gap-2">
              {FINALIDADES_CERTIFICADO.map((item) => {
                const selecionado = finalidade === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={enviando}
                    onClick={() => setFinalidade(item.id)}
                    className={`px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      selecionado
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="text-xs font-semibold whitespace-nowrap">
                      {item.id === 'AMBOS' ? 'Ambos' : item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {item.id === 'AMBOS' ? 'SEFAZ e Siscomex' : item.id === 'SEFAZ' ? 'NF-e / DF-e' : 'Portal Único'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || !encryptionConfigured}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors whitespace-nowrap"
            >
              {enviando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {enviando
                ? 'Validando e Criptografando...'
                : modoSubstituicao
                  ? 'Confirmar Substituição'
                  : 'Validar e Salvar Certificado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
