'use client';

import { useState, useTransition, useMemo } from 'react';
import { 
  FileText, 
  FileCheck2, 
  FileEdit, 
  Paperclip, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRightLeft, 
  Download, 
  ExternalLink, 
  Trash2, 
  Plus, 
  X,
  Check,
  Send,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { formatDateTimeBR } from '@/lib/formatters';
import { 
  DocumentoGrupo, 
  GRUPOS_CONFIG, 
  STATUS_DOC_CONFIG, 
  DOCUMENTOS_PACOTE_EXPORTACAO, 
  parseDocumentoGrupo 
} from '@/lib/documentosHelper';
import { 
  uploadDocumentoAction, 
  moverGrupoDocumentoAction, 
  atualizarStatusDocumentoAction, 
  excluirDocumentoAction 
} from '@/server/actions/documentoActions';

interface TipoDoc {
  id: string;
  nome: string;
  categoria: string;
  obrigatorioNoPacoteFinal: boolean;
}

interface DocumentoRaw {
  id: string;
  processoId: string;
  tipoDocumentoId: string;
  tipoDocumento: TipoDoc;
  nomeArquivo: string;
  storagePath: string;
  versao: number;
  status: string;
  uploadedEm: string | Date;
  uploadedById: string;
  uploadedBy: {
    id: string;
    nome: string;
    email: string;
  };
  descricaoOutro?: string | null;
}

interface DocumentosCockpitProps {
  processo: {
    id: string;
    numeroProcesso: string;
    clienteFinal: string;
    enderecoBuyer?: string | null;
  };
  tipos: TipoDoc[];
  documentosIniciais: DocumentoRaw[];
}

export function DocumentosCockpit({
  processo,
  tipos,
  documentosIniciais,
}: DocumentosCockpitProps) {
  const [tabAtiva, setTabAtiva] = useState<'TODOS' | DocumentoGrupo | 'CHECKLIST'>('TODOS');
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [grupoUploadSelecionado, setGrupoUploadSelecionado] = useState<DocumentoGrupo>('ORIGINAIS');
  const [tipoSelecionado, setTipoSelecionado] = useState<string>('');
  const [nomeOutro, setNomeOutro] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [menuAcoesAberto, setMenuAcoesAberto] = useState<string | null>(null);

  // Mapeia os documentos com os grupos decodificados
  const documentos = useMemo(() => {
    return documentosIniciais.map((doc) => {
      const { grupo, observacaoLimpa } = parseDocumentoGrupo(doc);
      return {
        ...doc,
        grupo,
        observacaoLimpa,
      };
    });
  }, [documentosIniciais]);

  // Contadores por grupo
  const contadores = useMemo(() => {
    const originais = documentos.filter((d) => d.grupo === 'ORIGINAIS').length;
    const drafts = documentos.filter((d) => d.grupo === 'DRAFTS').length;
    const diversos = documentos.filter((d) => d.grupo === 'DIVERSOS').length;
    const total = documentos.length;
    return { originais, drafts, diversos, total };
  }, [documentos]);

  // Checklist de prontidão do pacote do cliente
  const checklistStatus = useMemo(() => {
    const docsOriginais = documentos.filter((d) => d.grupo === 'ORIGINAIS');
    
    return DOCUMENTOS_PACOTE_EXPORTACAO.map((item) => {
      const docEncontrado = docsOriginais.find((d) => {
        const nomeTipo = d.tipoDocumento?.nome?.toLowerCase() || '';
        const nomeArq = d.nomeArquivo?.toLowerCase() || '';
        return item.nomeMatch.some((m) => nomeTipo.includes(m) || nomeArq.includes(m));
      });

      return {
        ...item,
        anexado: Boolean(docEncontrado),
        documento: docEncontrado || null,
      };
    });
  }, [documentos]);

  const obrigatoriosCount = checklistStatus.filter((c) => c.obrigatorio).length;
  const obrigatoriosProntos = checklistStatus.filter((c) => c.obrigatorio && c.anexado).length;
  const percentualProntidao = Math.round((obrigatoriosProntos / Math.max(1, obrigatoriosCount)) * 100);

  // Documentos filtrados apenas pela aba selecionada (sem busca)
  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      if (tabAtiva === 'TODOS' || tabAtiva === 'CHECKLIST') return true;
      return doc.grupo === tabAtiva;
    });
  }, [documentos, tabAtiva]);

  // Handler para mover de grupo
  const handleMoverGrupo = (documentoId: string, novoGrupo: DocumentoGrupo) => {
    setMenuAcoesAberto(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('documentoId', documentoId);
      formData.set('processoId', processo.id);
      formData.set('novoGrupo', novoGrupo);
      await moverGrupoDocumentoAction(formData);
    });
  };

  // Handler para alterar status
  const handleAlterarStatus = (documentoId: string, novoStatus: string) => {
    setMenuAcoesAberto(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('documentoId', documentoId);
      formData.set('processoId', processo.id);
      formData.set('novoStatus', novoStatus);
      await atualizarStatusDocumentoAction(formData);
    });
  };

  // Handler para excluir
  const handleExcluir = (documentoId: string, nomeArquivo: string) => {
    setMenuAcoesAberto(null);
    if (!window.confirm(`Tem certeza que deseja excluir "${nomeArquivo}"? Esta ação removerá o arquivo permanentemente.`)) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set('documentoId', documentoId);
      formData.set('processoId', processo.id);
      await excluirDocumentoAction(formData);
    });
  };

  // Abrir modal com pré-configuração
  const abrirModalUpload = (grupo: DocumentoGrupo = 'ORIGINAIS', tipoId: string = '') => {
    setGrupoUploadSelecionado(grupo);
    setTipoSelecionado(tipoId || (tipos[0]?.id ?? ''));
    setNomeOutro('');
    setModalUploadAberto(true);
  };

  return (
    <div className="space-y-6">
      
      {/* ============================================================== */}
      {/* 1. CARDS DE RESUMO E INDICADORES DO DOSSIÊ (3 COLUNAS)         */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
        
        {/* CARD 1: PACOTE DO CLIENTE */}
        <div 
          onClick={() => setTabAtiva('ORIGINAIS')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs min-h-[155px] ${
            tabAtiva === 'ORIGINAIS'
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white leading-none">
                    Pacote do Cliente
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">Documentos Oficiais</span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                {percentualProntidao}% pronto
              </span>
            </div>

            <div className="my-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {contadores.originais}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {contadores.originais === 1 ? 'original anexado' : 'originais anexados'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Documentos finais que efetivamente vão para o comprador e cobrança bancária.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Obrigatórios: <strong className="text-slate-800 dark:text-slate-200">{obrigatoriosProntos}/{obrigatoriosCount}</strong>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
              Ver checklist →
            </span>
          </div>
        </div>

        {/* CARD 2: DRAFTS & MINUTAS */}
        <div 
          onClick={() => setTabAtiva('DRAFTS')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs min-h-[155px] ${
            tabAtiva === 'DRAFTS'
              ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800 shrink-0">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white leading-none">
                    Drafts & Minutas
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">Para Validação</span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                Conferência
              </span>
            </div>

            <div className="my-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {contadores.drafts}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {contadores.drafts === 1 ? 'minuta em validação' : 'minutas em validação'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Rascunhos para alinhamento prévio com o armador, despachante e cliente.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Etapa: <strong className="text-slate-800 dark:text-slate-200">Revisão interna</strong>
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold hover:underline">
              Ver drafts →
            </span>
          </div>
        </div>

        {/* CARD 3: DOCUMENTOS DIVERSOS */}
        <div 
          onClick={() => setTabAtiva('DIVERSOS')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs min-h-[155px] ${
            tabAtiva === 'DIVERSOS'
              ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white leading-none">
                    Diversos & Apoio
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">Interno & Operação</span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                Operacional
              </span>
            </div>

            <div className="my-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {contadores.diversos}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {contadores.diversos === 1 ? 'documento interno' : 'documentos internos'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                NFs, confirmação de Booking, PGR/Buonny, tickets balança e fotos REDEX.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Finalidade: <strong className="text-slate-800 dark:text-slate-200">Apoio operacional</strong>
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Ver diversos →
            </span>
          </div>
        </div>

      </div>

      {/* AVISO DO ENDEREÇO DO IMPORTADOR */}
      {!processo.enderecoBuyer && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Atenção:</strong> O endereço do importador ({processo.clienteFinal}) ainda não foi cadastrado. Preencha na aba &quot;Importador (Buyer)&quot; para os dados constarem nos documentos gerados.
            </span>
          </div>
          <a
            href={`/negociacoes/${processo.id}/importador`}
            className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100 whitespace-nowrap ml-3"
          >
            Completar dados →
          </a>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ABAS DE NAVEGAÇÃO DOS GRUPOS & BOTÃO DE ANEXAR             */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        
        {/* Abas com espaço total garantido */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          
          {/* TODAS */}
          <button
            type="button"
            onClick={() => setTabAtiva('TODOS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              tabAtiva === 'TODOS'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Todos os Anexos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              tabAtiva === 'TODOS' ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-800'
            }`}>
              {contadores.total}
            </span>
          </button>

          {/* DOCUMENTOS ORIGINAIS (CLIENTE) */}
          <button
            type="button"
            onClick={() => setTabAtiva('ORIGINAIS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              tabAtiva === 'ORIGINAIS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Documentos Oficiais (Cliente)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              tabAtiva === 'ORIGINAIS' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
            }`}>
              {contadores.originais}
            </span>
          </button>

          {/* DRAFTS */}
          <button
            type="button"
            onClick={() => setTabAtiva('DRAFTS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              tabAtiva === 'DRAFTS'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Drafts & Minutas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              tabAtiva === 'DRAFTS' ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
            }`}>
              {contadores.drafts}
            </span>
          </button>

          {/* DIVERSOS */}
          <button
            type="button"
            onClick={() => setTabAtiva('DIVERSOS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              tabAtiva === 'DIVERSOS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Diversos / Apoio</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              tabAtiva === 'DIVERSOS' ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
            }`}>
              {contadores.diversos}
            </span>
          </button>

          {/* CHECKLIST */}
          <button
            type="button"
            onClick={() => setTabAtiva('CHECKLIST')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              tabAtiva === 'CHECKLIST'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Dossiê de Exportação</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              tabAtiva === 'CHECKLIST' ? 'bg-purple-800 text-purple-100' : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
            }`}>
              {obrigatoriosProntos}/{obrigatoriosCount}
            </span>
          </button>

        </div>

        {/* Botão de anexar documento com visual de destaque */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => abrirModalUpload(tabAtiva === 'DRAFTS' ? 'DRAFTS' : tabAtiva === 'DIVERSOS' ? 'DIVERSOS' : 'ORIGINAIS')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Anexar Documento</span>
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 3. VISUALIZAÇÃO DA ABA ATUAL                                   */}
      {/* ============================================================== */}

      {tabAtiva === 'CHECKLIST' ? (
        /* VISUALIZAÇÃO DO CHECKLIST DO PACOTE FINAL DE EXPORTAÇÃO */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Dossiê Documental de Exportação (Pacote do Cliente)
                </h4>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                Lista de conferência dos documentos essenciais que são enviados ao importador <strong>{processo.clienteFinal}</strong> e ao banco para cobrança/câmbio.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-500">Prontidão da Remessa</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {percentualProntidao}% ({obrigatoriosProntos} de {obrigatoriosCount})
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
            {checklistStatus.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.anexado ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : item.obrigatorio ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 border border-rose-200 dark:border-rose-900">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.label}
                      </span>
                      {item.obrigatorio ? (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          Obrigatório
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Opcional / Conforme contrato
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.descricao}
                    </p>

                    {item.documento && (
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          📎 {item.documento.nomeArquivo}
                        </span>
                        <span>•</span>
                        <span>Enviado por {item.documento.uploadedBy.nome}</span>
                        <span>•</span>
                        <span>{formatDateTimeBR(item.documento.uploadedEm)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {item.documento ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/documentos/${item.documento.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Visualizar</span>
                      </a>
                      <a
                        href={`/api/documentos/${item.documento.id}?download=1`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Baixar</span>
                      </a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const matchTipo = tipos.find((t) => item.nomeMatch.some((m) => t.nome.toLowerCase().includes(m)));
                        abrirModalUpload('ORIGINAIS', matchTipo ? matchTipo.id : '');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Anexar via Oficial</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TABELA PRINCIPAL DE DOCUMENTOS */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          
          {/* HEADER DA TABELA COM EXPLICAÇÃO DO GRUPO */}
          {tabAtiva !== 'TODOS' && (
            <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {GRUPOS_CONFIG[tabAtiva].titulo}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  — {GRUPOS_CONFIG[tabAtiva].descricaoCurta}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {documentosFiltrados.length} documento{documentosFiltrados.length === 1 ? '' : 's'}
              </span>
            </div>
          )}

          {documentosFiltrados.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nenhum documento cadastrado nesta seção
              </h5>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {tabAtiva === 'DRAFTS'
                  ? 'Adicione rascunhos de BL, Invoice ou Packing List para conferência e validação antes da emissão final.'
                  : tabAtiva === 'ORIGINAIS'
                  ? 'Anexe os documentos oficiais emitidos que compõem o dossiê enviado ao importador.'
                  : tabAtiva === 'DIVERSOS'
                  ? 'Anexe documentos internos de apoio (NFs, confirmação de booking, laudos e comprovantes).'
                  : 'Nenhum documento anexado neste processo ainda.'}
              </p>
              <button
                type="button"
                onClick={() => abrirModalUpload(tabAtiva === 'DRAFTS' ? 'DRAFTS' : tabAtiva === 'DIVERSOS' ? 'DIVERSOS' : 'ORIGINAIS')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Anexar Primeiro Documento</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200/80 dark:border-slate-800">
                    <th className="py-3.5 px-5">Documento & Arquivo</th>
                    <th className="py-3.5 px-4">Grupo / Separação</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Enviado Em</th>
                    <th className="py-3.5 px-4">Responsável</th>
                    <th className="py-3.5 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {documentosFiltrados.map((d) => {
                    const grupoCfg = GRUPOS_CONFIG[d.grupo] || GRUPOS_CONFIG.DIVERSOS;
                    const statusCfg = STATUS_DOC_CONFIG[d.status] || {
                      label: d.status,
                      cor: 'bg-slate-100 text-slate-700 border-slate-200',
                    };

                    const isPdf = d.nomeArquivo.toLowerCase().endsWith('.pdf');

                    return (
                      <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                        
                        {/* 1. DOCUMENTO & ARQUIVO */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 group-hover:text-emerald-600 transition-colors shrink-0">
                              {isPdf ? <FileText className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
                            </div>

                            <div className="min-w-0">
                              <a
                                href={`/api/documentos/${d.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors block truncate max-w-xs sm:max-w-sm"
                                title={d.nomeArquivo}
                              >
                                {d.nomeArquivo}
                              </a>

                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                  {d.tipoDocumento.nome}
                                </span>
                                {d.tipoDocumento.categoria === 'OUTRO' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    Personalizado
                                  </span>
                                )}
                                {d.observacaoLimpa && (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                    • {d.observacaoLimpa}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. GRUPO / SEPARAÇÃO */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${grupoCfg.badgeCor} ${grupoCfg.badgeBorda}`}>
                            {d.grupo === 'ORIGINAIS' && <FileCheck2 className="w-3 h-3" />}
                            {d.grupo === 'DRAFTS' && <FileEdit className="w-3 h-3" />}
                            {d.grupo === 'DIVERSOS' && <Paperclip className="w-3 h-3" />}
                            <span>{grupoCfg.badgeTexto}</span>
                          </span>
                        </td>

                        {/* 3. STATUS */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${statusCfg.cor}`}>
                            <span>{statusCfg.label}</span>
                          </span>
                        </td>

                        {/* 4. ENVIADO EM */}
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDateTimeBR(d.uploadedEm)}
                        </td>

                        {/* 5. RESPONSÁVEL */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                          {d.uploadedBy.nome}
                        </td>

                        {/* 6. AÇÕES */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Visualizar */}
                            <a
                              href={`/api/documentos/${d.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                              title="Visualizar documento em nova aba"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>

                            {/* Baixar */}
                            <a
                              href={`/api/documentos/${d.id}?download=1`}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                              title="Baixar arquivo"
                            >
                              <Download className="w-4 h-4" />
                            </a>

                            {/* Menu de Mover Grupo / Alterar Status */}
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() => setMenuAcoesAberto(menuAcoesAberto === d.id ? null : d.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Alterar grupo ou status"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>

                              {menuAcoesAberto === d.id && (
                                <div className="absolute right-0 mt-1 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                                  
                                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Mover para Grupo
                                  </div>

                                  {d.grupo !== 'ORIGINAIS' && (
                                    <button
                                      type="button"
                                      onClick={() => handleMoverGrupo(d.id, 'ORIGINAIS')}
                                      className="w-full text-left px-2 py-1.5 text-xs rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2"
                                    >
                                      <FileCheck2 className="w-3.5 h-3.5" />
                                      <span>Mover para Oficiais (Cliente)</span>
                                    </button>
                                  )}

                                  {d.grupo !== 'DRAFTS' && (
                                    <button
                                      type="button"
                                      onClick={() => handleMoverGrupo(d.id, 'DRAFTS')}
                                      className="w-full text-left px-2 py-1.5 text-xs rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium flex items-center gap-2"
                                    >
                                      <FileEdit className="w-3.5 h-3.5" />
                                      <span>Mover para Drafts & Minutas</span>
                                    </button>
                                  )}

                                  {d.grupo !== 'DIVERSOS' && (
                                    <button
                                      type="button"
                                      onClick={() => handleMoverGrupo(d.id, 'DIVERSOS')}
                                      className="w-full text-left px-2 py-1.5 text-xs rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium flex items-center gap-2"
                                    >
                                      <Paperclip className="w-3.5 h-3.5" />
                                      <span>Mover para Diversos / Apoio</span>
                                    </button>
                                  )}

                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                  
                                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Alterar Status
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleAlterarStatus(d.id, 'APROVADO')}
                                    className="w-full text-left px-2 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2"
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Marcar como Aprovado</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAlterarStatus(d.id, 'ENVIADO_CLIENTE')}
                                    className="w-full text-left px-2 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2"
                                  >
                                    <Send className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Enviado ao Cliente</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAlterarStatus(d.id, 'RASCUNHO')}
                                    className="w-full text-left px-2 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Marcar como Rascunho</span>
                                  </button>

                                </div>
                              )}
                            </div>

                            {/* Excluir */}
                            <button
                              type="button"
                              onClick={() => handleExcluir(d.id, d.nomeArquivo)}
                              disabled={isPending}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                              title="Excluir documento permanentemente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODAL DE UPLOAD COM SELEÇÃO CLARA DE GRUPO & OPÇÃO "OUTRO"  */}
      {/* ============================================================== */}
      {modalUploadAberto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Anexar Novo Documento
                </h4>
                <p className="text-xs text-slate-500">
                  Processo {processo.numeroProcesso} — {processo.clienteFinal}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalUploadAberto(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData) => {
                startTransition(async () => {
                  await uploadDocumentoAction(formData);
                  setModalUploadAberto(false);
                });
              }}
              className="space-y-4.5 mt-5"
            >
              <input type="hidden" name="processoId" value={processo.id} />
              <input type="hidden" name="grupo" value={grupoUploadSelecionado} />

              {/* SELEÇÃO DO GRUPO EM 3 CARDS ILUSTRADOS */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  1. Onde este documento deve ficar classificado?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  
                  {/* OPÇÃO: ORIGINAIS */}
                  <div
                    onClick={() => setGrupoUploadSelecionado('ORIGINAIS')}
                    className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                      grupoUploadSelecionado === 'ORIGINAIS'
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs mb-1">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Oficial (Cliente)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      BL Final, Invoice, Packing List e Certificados que vão para o comprador.
                    </p>
                  </div>

                  {/* OPÇÃO: DRAFTS */}
                  <div
                    onClick={() => setGrupoUploadSelecionado('DRAFTS')}
                    className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                      grupoUploadSelecionado === 'DRAFTS'
                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-extrabold text-xs mb-1">
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Draft / Minuta</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Rascunhos para conferência e validação antes da emissão definitiva.
                    </p>
                  </div>

                  {/* OPÇÃO: DIVERSOS */}
                  <div
                    onClick={() => setGrupoUploadSelecionado('DIVERSOS')}
                    className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                      grupoUploadSelecionado === 'DIVERSOS'
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-extrabold text-xs mb-1">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Diverso / Apoio</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      NFs de remessa, Booking, Buonny, tickets balança e fotos REDEX.
                    </p>
                  </div>

                </div>
              </div>

              {/* SELEÇÃO DO TIPO DE DOCUMENTO COM SUPORTE À OPÇÃO "OUTRO" */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  2. Tipo do Documento
                </label>
                <select
                  name="tipoDocumentoId"
                  value={tipoSelecionado}
                  onChange={(e) => setTipoSelecionado(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="" disabled>Selecione um tipo...</option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nome} {tipo.obrigatorioNoPacoteFinal ? '★ (Pacote Cliente)' : ''}
                    </option>
                  ))}
                  <option value="OUTRO">➕ Outro (Especificar nome personalizado...)</option>
                </select>

                {/* CAMPO ESPECÍFICO QUANDO SELECIONA "OUTRO" */}
                {tipoSelecionado === 'OUTRO' && (
                  <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 animate-in fade-in slide-in-from-top-1 duration-150 space-y-1.5">
                    <label className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                      Qual é o documento? <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nomeDocumentoOutro"
                      required
                      value={nomeOutro}
                      onChange={(e) => setNomeOutro(e.target.value)}
                      placeholder="Ex: Laudo de Aflatoxina, Seguro de Carga, Comprovante Swift..."
                      className="w-full text-xs p-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      O nome digitado será registrado como o tipo deste documento.
                    </p>
                  </div>
                )}
              </div>

              {/* SELEÇÃO DO ARQUIVO */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  3. Selecionar Arquivo (PDF, Imagem, Planilha)
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                  <input
                    type="file"
                    name="file"
                    required
                    className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-950/60 dark:file:text-emerald-300 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    Formatos suportados: PDF, JPG, PNG, XLSX, DOCX (até 25MB)
                  </p>
                </div>
              </div>

              {/* OBSERVAÇÃO / DETALHE OPCIONAL */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  4. Observação / Identificação complementar (Opcional)
                </label>
                <input
                  type="text"
                  name="observacao"
                  placeholder="Ex: Minuta v2 com dados bancários revisados / Chave da NF / Visto do comprador"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* BOTÕES */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalUploadAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isPending ? 'Enviando...' : 'Anexar Documento'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
