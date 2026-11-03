"use client";

import { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Search, 
  Building2, 
  Tractor, 
  Globe2, 
  Warehouse,
  ShieldCheck, 
  Edit3, 
  Trash2, 
  Check, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  FileText, 
  Landmark, 
  Mail, 
  Phone, 
  Compass,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Eye,
  Power,
  Copy
} from 'lucide-react';
import { 
  salvarCadastroEntidadeAction, 
  excluirCadastroEntidadeAction, 
  toggleAtivarCadastroEntidadeAction,
  type CadastroEntidadeInput 
} from '@/server/actions/cadastrosActions';
import type { TipoEntidadeComercial } from '@prisma/client';

interface CentralCadastrosModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoInicial?: 'PRODUTOR' | 'IMPORTADOR' | 'BUYER' | 'ARMAZEM' | 'ALL';
  onEntidadeSelecionada?: (entidade: any) => void;
  modoSelecao?: boolean;
}

export function CentralCadastrosModal({
  isOpen,
  onClose,
  tipoInicial = 'PRODUTOR',
  onEntidadeSelecionada,
  modoSelecao = false,
}: CentralCadastrosModalProps) {
  const [tabAtiva, setTabAtiva] = useState<'PRODUTOR' | 'IMPORTADOR' | 'BUYER' | 'ARMAZEM' | 'ALL'>(tipoInicial);
  const [viewMode, setViewMode] = useState<'LISTA' | 'FORM' | 'VISUALIZAR'>('LISTA');
  const [entidadeVisualizar, setEntidadeVisualizar] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [entidades, setEntidades] = useState<any[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [msgErro, setMsgErro] = useState<string | null>(null);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);
  const [copiadoTexto, setCopiadoTexto] = useState<string | null>(null);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [formTipo, setFormTipo] = useState<'PRODUTOR' | 'IMPORTADOR' | 'BUYER' | 'ARMAZEM'>('PRODUTOR');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [documento, setDocumento] = useState('');
  
  // Produtor & Armazém específico
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [carNumero, setCarNumero] = useState('');
  const [nomePropriedade, setNomePropriedade] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [uf, setUf] = useState('MT');
  const [coordenadasGps, setCoordenadasGps] = useState('');
  const [areaTotalHectares, setAreaTotalHectares] = useState('');
  const [certificacoes, setCertificacoes] = useState('');
  const [conformidadeSocioambiental, setConformidadeSocioambiental] = useState(true);

  // Importador / Buyer específico
  const [pais, setPais] = useState('Brasil');
  const [cidade, setCidade] = useState('');
  const [endereco, setEndereco] = useState('');
  const [complemento, setComplemento] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [iecTaxId, setIecTaxId] = useState('');
  const [fassaiId, setFassaiId] = useState('');
  const [panId, setPanId] = useState('');
  const [gstId, setGstId] = useState('');

  // Banco
  const [bancoNome, setBancoNome] = useState('');
  const [bancoEndereco, setBancoEndereco] = useState('');
  const [bancoConta, setBancoConta] = useState('');
  const [bancoSwift, setBancoSwift] = useState('');
  const [bancoEmail, setBancoEmail] = useState('');
  const [bancoTelefone, setBancoTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Garante que SEMPRE que o modal abrir ou for reaberto, volte ao painel de listagem
  useEffect(() => {
    if (isOpen) {
      setViewMode('LISTA');
      setEntidadeVisualizar(null);
      carregarEntidades();
      if (tipoInicial !== 'ALL') {
        setTabAtiva(tipoInicial);
        setFormTipo(tipoInicial as any);
      }
    }
  }, [isOpen, tipoInicial]);

  function handleCloseModal() {
    setViewMode('LISTA');
    setEntidadeVisualizar(null);
    onClose();
  }

  async function carregarEntidades() {
    setLoading(true);
    setMsgErro(null);
    try {
      const res = await fetch('/api/cadastros?incluirInativos=true');
      if (res.ok) {
        const data = await res.json();
        setEntidades(Array.isArray(data) ? data : []);
      }
    } catch (e: any) {
      setMsgErro('Erro ao carregar registros: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleNovo(tipo: 'PRODUTOR' | 'IMPORTADOR' | 'BUYER' | 'ARMAZEM') {
    setEditId(null);
    setFormTipo(tipo);
    setRazaoSocial('');
    setNomeFantasia('');
    setDocumento('');
    setInscricaoEstadual('');
    setCarNumero('');
    setNomePropriedade('');
    setMunicipio(tipo === 'PRODUTOR' || tipo === 'ARMAZEM' ? 'Confresa' : '');
    setUf(tipo === 'PRODUTOR' || tipo === 'ARMAZEM' ? 'MT' : '');
    setCoordenadasGps('');
    setAreaTotalHectares('');
    setCertificacoes(tipo === 'PRODUTOR' ? 'RTRS, Zero Desmatamento' : tipo === 'ARMAZEM' ? 'Credenciado MAPA' : '');
    setConformidadeSocioambiental(true);

    setPais(tipo === 'PRODUTOR' || tipo === 'ARMAZEM' ? 'Brasil' : 'Vietnã');
    setCidade('');
    setEndereco('');
    setComplemento('');
    setCodigoPostal('');
    setEmail('');
    setTelefone('');
    setIecTaxId('');
    setFassaiId('');
    setPanId('');
    setGstId('');

    setBancoNome('');
    setBancoEndereco('');
    setBancoConta('');
    setBancoSwift('');
    setBancoEmail('');
    setBancoTelefone('');
    setObservacoes('');

    setMsgErro(null);
    setMsgSucesso(null);
    setViewMode('FORM');
  }

  function handleVisualizar(item: any) {
    setEntidadeVisualizar(item);
    setViewMode('VISUALIZAR');
  }

  function handleEditar(item: any) {
    setEditId(item.id);
    setFormTipo(item.tipo);
    setRazaoSocial(item.razaoSocial || '');
    setNomeFantasia(item.nomeFantasia || '');
    setDocumento(item.documento || '');
    setInscricaoEstadual(item.inscricaoEstadual || '');
    setCarNumero(item.carNumero || '');
    setNomePropriedade(item.nomePropriedade || '');
    setMunicipio(item.municipio || '');
    setUf(item.uf || 'MT');
    setCoordenadasGps(item.coordenadasGps || '');
    setAreaTotalHectares(item.areaTotalHectares ? String(item.areaTotalHectares) : '');
    setCertificacoes(item.certificacoes || '');
    setConformidadeSocioambiental(item.conformidadeSocioambiental !== false);

    setPais(item.pais || (item.tipo === 'PRODUTOR' || item.tipo === 'ARMAZEM' ? 'Brasil' : ''));
    setCidade(item.cidade || '');
    setEndereco(item.endereco || '');
    setComplemento(item.complemento || '');
    setCodigoPostal(item.codigoPostal || '');
    setEmail(item.email || '');
    setTelefone(item.telefone || '');
    setIecTaxId(item.iecTaxId || '');
    setFassaiId(item.fassaiId || '');
    setPanId(item.panId || '');
    setGstId(item.gstId || '');

    setBancoNome(item.bancoNome || '');
    setBancoEndereco(item.bancoEndereco || '');
    setBancoConta(item.bancoConta || '');
    setBancoSwift(item.bancoSwift || '');
    setBancoEmail(item.bancoEmail || '');
    setBancoTelefone(item.bancoTelefone || '');
    setObservacoes(item.observacoes || '');

    setMsgErro(null);
    setMsgSucesso(null);
    setViewMode('FORM');
  }

  async function handleToggleAtivo(id: string, ativoAtual: boolean, nome: string) {
    const acao = ativoAtual ? 'desativar' : 'reativar';
    if (!confirm(`Deseja realmente ${acao} o cadastro de "${nome}"?`)) return;

    setLoading(true);
    const res = await toggleAtivarCadastroEntidadeAction(id, !ativoAtual);
    if (res.success) {
      await carregarEntidades();
      if (entidadeVisualizar && entidadeVisualizar.id === id) {
        setEntidadeVisualizar({ ...entidadeVisualizar, ativo: !ativoAtual });
      }
    } else {
      alert(res.error || 'Falha ao atualizar status.');
    }
    setLoading(false);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMsgErro(null);
    setMsgSucesso(null);

    const input: CadastroEntidadeInput = {
      id: editId || undefined,
      tipo: formTipo,
      razaoSocial,
      nomeFantasia,
      documento,

      inscricaoEstadual,
      carNumero,
      nomePropriedade,
      municipio,
      uf,
      coordenadasGps,
      areaTotalHectares: areaTotalHectares ? parseFloat(areaTotalHectares) : null,
      certificacoes,
      conformidadeSocioambiental,

      pais,
      cidade,
      endereco,
      complemento,
      codigoPostal,
      email,
      telefone,
      iecTaxId,
      fassaiId,
      panId,
      gstId,

      bancoNome,
      bancoEndereco,
      bancoConta,
      bancoSwift,
      bancoEmail,
      bancoTelefone,
      observacoes,
    };

    const res = await salvarCadastroEntidadeAction(input);
    setSalvando(false);

    if (res.success && res.entidade) {
      setMsgSucesso('Cadastro salvo com sucesso no banco de dados!');
      await carregarEntidades();
      if (onEntidadeSelecionada) {
        onEntidadeSelecionada(res.entidade);
      }
      setTimeout(() => {
        setViewMode('LISTA');
        setMsgSucesso(null);
      }, 700);
    } else {
      setMsgErro(res.error || 'Erro ao salvar o parceiro.');
    }
  }

  async function handleExcluir(id: string, nome: string) {
    if (!confirm(`Confirma a exclusão definitiva de "${nome}" da base de cadastros?`)) return;
    setLoading(true);
    const res = await excluirCadastroEntidadeAction(id);
    if (res.success) {
      await carregarEntidades();
      if (viewMode === 'VISUALIZAR') setViewMode('LISTA');
    } else {
      alert(res.error || 'Falha ao excluir parceiro.');
    }
    setLoading(false);
  }

  function copiarParaClipboard(texto: string, rotulo: string) {
    navigator.clipboard.writeText(texto);
    setCopiadoTexto(rotulo);
    setTimeout(() => setCopiadoTexto(null), 2000);
  }

  if (!isOpen) return null;

  // Filtragem
  const entidadesFiltradas = entidades.filter((item) => {
    if (tabAtiva !== 'ALL' && item.tipo !== tabAtiva) return false;
    if (!termoBusca) return true;
    const q = termoBusca.toLowerCase();
    return (
      (item.razaoSocial || '').toLowerCase().includes(q) ||
      (item.nomeFantasia || '').toLowerCase().includes(q) ||
      (item.carNumero || '').toLowerCase().includes(q) ||
      (item.inscricaoEstadual || '').toLowerCase().includes(q) ||
      (item.nomePropriedade || '').toLowerCase().includes(q) ||
      (item.documento || '').toLowerCase().includes(q) ||
      (item.municipio || '').toLowerCase().includes(q) ||
      (item.cidade || '').toLowerCase().includes(q) ||
      (item.pais || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#f58220]/10 text-[#f58220] border border-[#f58220]/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Central de Cadastros & Parceiros do Grão
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> CAR & Armazéns
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Produtores Rurais (CAR / IE), Silos / Armazéns, Importadores e Buyers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'LISTA' ? (
              <button
                type="button"
                onClick={() => handleNovo(tabAtiva === 'ALL' ? 'PRODUTOR' : tabAtiva)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f58220] hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Cadastro</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setViewMode('LISTA');
                  setEntidadeVisualizar(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Voltar à Lista
              </button>
            )}
            <button
              type="button"
              onClick={handleCloseModal}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK MENSAGENS */}
        {msgErro && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{msgErro}</span>
          </div>
        )}
        {msgSucesso && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{msgSucesso}</span>
          </div>
        )}

        {/* CORPO DO MODAL */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {viewMode === 'LISTA' ? (
            <>
              {/* TABS SELECTOR & FILTROS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setTabAtiva('PRODUTOR')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tabAtiva === 'PRODUTOR'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Tractor className="w-3.5 h-3.5 text-amber-500" />
                    <span>Produtores ({entidades.filter(e => e.tipo === 'PRODUTOR').length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabAtiva('ARMAZEM')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tabAtiva === 'ARMAZEM'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Warehouse className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Armazéns / Silos ({entidades.filter(e => e.tipo === 'ARMAZEM').length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabAtiva('IMPORTADOR')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tabAtiva === 'IMPORTADOR'
                        ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-purple-500" />
                    <span>Importadores ({entidades.filter(e => e.tipo === 'IMPORTADOR').length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabAtiva('BUYER')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tabAtiva === 'BUYER'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Globe2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Buyers ({entidades.filter(e => e.tipo === 'BUYER').length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabAtiva('ALL')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tabAtiva === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Todos ({entidades.length})</span>
                  </button>
                </div>

                {/* BUSCA RÁPIDA */}
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por razão, CAR, CNPJ, cidade..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f58220]/40"
                  />
                  {termoBusca && (
                    <button
                      type="button"
                      onClick={() => setTermoBusca('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* LISTAGEM DOS CARDS DE ENTIDADES */}
              {loading ? (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#f58220]" />
                  <span>Carregando base de cadastros...</span>
                </div>
              ) : entidadesFiltradas.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Tractor className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Nenhum cadastro encontrado
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {termoBusca
                      ? 'Nenhum resultado corresponde à busca informada.'
                      : 'Clique no botão "+ Novo Cadastro" para adicionar o primeiro registro.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNovo(tabAtiva === 'ALL' ? 'PRODUTOR' : tabAtiva)}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f58220] hover:bg-orange-600 text-white font-bold text-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Novo Parceiro</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entidadesFiltradas.map((item) => {
                    const isProdutor = item.tipo === 'PRODUTOR';
                    const isArmazem = item.tipo === 'ARMAZEM';
                    const isImportador = item.tipo === 'IMPORTADOR';

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border shadow-xs transition-all flex flex-col justify-between gap-3 group ${
                          !item.ativo
                            ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 opacity-75'
                            : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-[#f58220]/40'
                        }`}
                      >
                        <div>
                          {/* BADGES SUPERIORES & STATUS ATIVO/INATIVO */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                isProdutor
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : isArmazem
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : isImportador
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              }`}
                            >
                              {isProdutor ? (
                                <Tractor className="w-3 h-3" />
                              ) : isArmazem ? (
                                <Warehouse className="w-3 h-3" />
                              ) : isImportador ? (
                                <Building2 className="w-3 h-3" />
                              ) : (
                                <Globe2 className="w-3 h-3" />
                              )}
                              <span>
                                {isProdutor ? 'Produtor Rural' : isArmazem ? 'Silo / Armazém' : item.tipo}
                              </span>
                            </span>

                            <div className="flex items-center gap-1.5">
                              {item.ativo ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  <Check className="w-3 h-3" /> Ativo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  Desativado
                                </span>
                              )}
                            </div>
                          </div>

                          {/* RAZÃO SOCIAL & NOME FANTASIA */}
                          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                            {item.razaoSocial}
                          </h4>
                          {item.nomeFantasia && item.nomeFantasia !== item.razaoSocial && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.nomeFantasia}
                            </p>
                          )}

                          {/* DADOS ESPECÍFICOS DE PRODUTOR RURAL (CAR & IE) */}
                          {isProdutor ? (
                            <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-1.5 text-xs">
                              {item.carNumero && (
                                <div className="flex items-start gap-1.5">
                                  <span className="font-bold text-amber-900 dark:text-amber-300 shrink-0">
                                    CAR:
                                  </span>
                                  <span className="font-mono text-[11px] text-amber-950 dark:text-amber-200 break-all">
                                    {item.carNumero}
                                  </span>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400">Inscr. Estadual: </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {item.inscricaoEstadual || '—'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400">Fazenda: </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {item.nomePropriedade || '—'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                                <MapPin className="w-3 h-3 text-[#f58220] shrink-0" />
                                <span>{item.municipio ? `${item.municipio} - ${item.uf || 'MT'}` : 'Localidade não informada'}</span>
                              </div>
                            </div>
                          ) : isArmazem ? (
                            /* DADOS DO ARMAZÉM / SILO */
                            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-1.5 text-xs">
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400">CNPJ Armazém: </span>
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {item.documento || 'Não informado'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400">Local: </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {item.cidade ? `${item.cidade} - ${item.uf || 'MT'}` : item.uf || 'MT'}
                                  </span>
                                </div>
                              </div>
                              {item.endereco && (
                                <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                                  <span>{item.endereco}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* DADOS DE IMPORTADOR / BUYER */
                            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs">
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                                <MapPin className="w-3 h-3 text-purple-500 shrink-0" />
                                <span>{item.cidade ? `${item.cidade}, ${item.pais}` : item.pais || 'Exterior'}</span>
                              </div>
                              {item.iecTaxId && (
                                <div className="text-[11px]">
                                  <span className="text-slate-400">Tax ID / IEC: </span>
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                    {item.iecTaxId}
                                  </span>
                                </div>
                              )}
                              {item.bancoNome && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  🏦 {item.bancoNome}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* BOTÕES DE AÇÃO: VISUALIZAR, EDITAR, DESATIVAR, EXCLUIR */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleVisualizar(item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Visualizar dados completos"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                              <span>Visualizar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditar(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Editar cadastro"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAtivo(item.id, item.ativo, item.razaoSocial)}
                              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                item.ativo
                                  ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              }`}
                              title={item.ativo ? 'Desativar este cadastro' : 'Reativar este cadastro'}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span>{item.ativo ? 'Desativar' : 'Ativar'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluir(item.id, item.razaoSocial)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs transition-colors cursor-pointer"
                              title="Excluir cadastro da base"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {modoSelecao && onEntidadeSelecionada && (
                            <button
                              type="button"
                              onClick={() => {
                                onEntidadeSelecionada(item);
                                handleCloseModal();
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#f58220] hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Selecionar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : viewMode === 'VISUALIZAR' && entidadeVisualizar ? (
            /* VISUALIZADOR DETALHADO DO CADASTRO (LEITURA LIMPA) */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {entidadeVisualizar.razaoSocial}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        entidadeVisualizar.ativo ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {entidadeVisualizar.ativo ? 'Ativo' : 'Desativado'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tipo: <strong>{entidadeVisualizar.tipo === 'PRODUTOR' ? 'Produtor Rural' : entidadeVisualizar.tipo === 'ARMAZEM' ? 'Silo / Armazém' : entidadeVisualizar.tipo}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditar(entidadeVisualizar)}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#f58220] hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Cadastro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAtivo(entidadeVisualizar.id, entidadeVisualizar.ativo, entidadeVisualizar.razaoSocial)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{entidadeVisualizar.ativo ? 'Desativar' : 'Ativar'}</span>
                  </button>
                </div>
              </div>

              {/* DETALHES POR SEÇÃO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. DADOS DE IDENTIFICAÇÃO */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5 text-xs">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Identificação & Registro
                  </h5>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Razão Social:</span>
                    <div className="font-black text-slate-900 dark:text-white">{entidadeVisualizar.razaoSocial}</div>
                  </div>
                  {entidadeVisualizar.nomeFantasia && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Nome Fantasia:</span>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{entidadeVisualizar.nomeFantasia}</div>
                    </div>
                  )}
                  {entidadeVisualizar.documento && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">CNPJ / CPF / Tax ID:</span>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{entidadeVisualizar.documento}</div>
                    </div>
                  )}
                </div>

                {/* 2. DADOS ESPECÍFICOS: PRODUTOR RURAL (CAR & IE) */}
                {entidadeVisualizar.tipo === 'PRODUTOR' && (
                  <div className="p-4 rounded-2xl border border-amber-300/80 dark:border-amber-800/60 bg-amber-500/5 dark:bg-amber-950/20 space-y-2.5 text-xs">
                    <h5 className="font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                      Rastreabilidade do Grão & Fazenda
                    </h5>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">CAR da Propriedade:</span>
                        {entidadeVisualizar.carNumero && (
                          <button
                            type="button"
                            onClick={() => copiarParaClipboard(entidadeVisualizar.carNumero, 'car')}
                            className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiadoTexto === 'car' ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        )}
                      </div>
                      <div className="font-mono font-bold text-amber-950 dark:text-amber-200 break-all">
                        {entidadeVisualizar.carNumero || '—'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Inscrição Estadual:</span>
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{entidadeVisualizar.inscricaoEstadual || '—'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Fazenda / Gleba:</span>
                        <div className="font-bold text-slate-900 dark:text-white">{entidadeVisualizar.nomePropriedade || '—'}</div>
                      </div>
                    </div>
                    {entidadeVisualizar.coordenadasGps && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Coordenadas GPS:</span>
                        <div className="font-mono text-slate-800 dark:text-slate-200">{entidadeVisualizar.coordenadasGps}</div>
                      </div>
                    )}
                    {entidadeVisualizar.certificacoes && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Certificações:</span>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">{entidadeVisualizar.certificacoes}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. DADOS ESPECÍFICOS: ARMAZÉM / SILO */}
                {entidadeVisualizar.tipo === 'ARMAZEM' && (
                  <div className="p-4 rounded-2xl border border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-2.5 text-xs">
                    <h5 className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">
                      Dados da Unidade Armazenadora
                    </h5>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">CNPJ do Armazém:</span>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{entidadeVisualizar.documento || 'Não informado'}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">UF / Estado:</span>
                        <div className="font-bold text-slate-900 dark:text-white">{entidadeVisualizar.uf || 'MT'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Município:</span>
                        <div className="font-bold text-slate-900 dark:text-white">{entidadeVisualizar.cidade || entidadeVisualizar.municipio || '—'}</div>
                      </div>
                    </div>
                    {entidadeVisualizar.endereco && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Endereço da Unidade:</span>
                        <div className="text-slate-800 dark:text-slate-200">{entidadeVisualizar.endereco}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. DADOS ESPECÍFICOS: IMPORTADOR / BUYER (FISCAL & BANCO) */}
                {(entidadeVisualizar.tipo === 'IMPORTADOR' || entidadeVisualizar.tipo === 'BUYER') && (
                  <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-500/5 dark:bg-purple-950/20 space-y-2.5 text-xs">
                    <h5 className="font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wide">
                      Identificadores Fiscais & Aduaneiros
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">IEC / Tax ID:</span>
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{entidadeVisualizar.iecTaxId || '—'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">FASSAI / Sanitário:</span>
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{entidadeVisualizar.fassaiId || '—'}</div>
                      </div>
                    </div>
                    {entidadeVisualizar.bancoNome && (
                      <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/40">
                        <span className="text-slate-500 dark:text-slate-400">Banco de Destino:</span>
                        <div className="font-bold text-slate-900 dark:text-white">{entidadeVisualizar.bancoNome}</div>
                        {entidadeVisualizar.bancoSwift && (
                          <div className="font-mono text-purple-700 dark:text-purple-300 text-[11px] mt-0.5">
                            SWIFT: {entidadeVisualizar.bancoSwift}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. LOCALIZAÇÃO E CONTATO */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5 text-xs">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Localização & Contato
                  </h5>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Local:</span>
                    <div className="text-slate-800 dark:text-slate-200">
                      {entidadeVisualizar.cidade ? `${entidadeVisualizar.cidade}, ` : ''}{entidadeVisualizar.pais || 'Brasil'}
                    </div>
                  </div>
                  {entidadeVisualizar.endereco && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Endereço:</span>
                      <div className="text-slate-800 dark:text-slate-200">{entidadeVisualizar.endereco}</div>
                    </div>
                  )}
                  {entidadeVisualizar.email && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">E-mail:</span>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{entidadeVisualizar.email}</div>
                    </div>
                  )}
                  {entidadeVisualizar.telefone && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Telefone:</span>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{entidadeVisualizar.telefone}</div>
                    </div>
                  )}
                </div>
              </div>

              {entidadeVisualizar.observacoes && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Observações Adicionais:</span>
                  <p className="text-slate-600 dark:text-slate-400">{entidadeVisualizar.observacoes}</p>
                </div>
              )}
            </div>
          ) : (
            /* FORMULÁRIO DINÂMICO DE CADASTRO / EDIÇÃO */
            <form onSubmit={handleSalvar} className="space-y-5">
              {/* SELETOR DE PERFIL (TIPO) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tipo de Cadastro <span className="text-[#f58220]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipo('PRODUTOR');
                      if (pais !== 'Brasil') setPais('Brasil');
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      formTipo === 'PRODUTOR'
                        ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 shrink-0">
                      <Tractor className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">Produtor Rural</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        CAR & IE da Propriedade
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormTipo('ARMAZEM');
                      if (pais !== 'Brasil') setPais('Brasil');
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      formTipo === 'ARMAZEM'
                        ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 shrink-0">
                      <Warehouse className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">Armazém / Silo</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Armazenagem & CNPJ
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTipo('IMPORTADOR')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      formTipo === 'IMPORTADOR'
                        ? 'border-purple-500 bg-purple-500/10 dark:bg-purple-500/15 ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-600 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">Importador</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Consignatário & Aduaneiro
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTipo('BUYER')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      formTipo === 'BUYER'
                        ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/15 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-600 shrink-0">
                      <Globe2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">Comprador (Buyer)</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Comprador Fatura / Trading
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* CAMPOS COMUNS DE IDENTIFICAÇÃO */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  1. Identificação Principal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {formTipo === 'ARMAZEM' ? 'Nome do Silo / Armazém (Razão Social)' : 'Razão Social / Nome Completo'} <span className="text-[#f58220]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        formTipo === 'PRODUTOR' 
                          ? 'Ex: Agropecuária Bela Vista Ltda' 
                          : formTipo === 'ARMAZEM'
                          ? 'Ex: Silo e Armazém Grãos Araguaia Ltda'
                          : 'Ex: Vina Agri Commodities Joint Stock Company'
                      }
                      value={razaoSocial}
                      onChange={(e) => setRazaoSocial(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome Fantasia / Unidade
                    </label>
                    <input
                      type="text"
                      placeholder={formTipo === 'PRODUTOR' ? 'Ex: Fazenda Santa Maria' : formTipo === 'ARMAZEM' ? 'Ex: Silo Central Confresa' : 'Ex: Vina Agri Vietnam'}
                      value={nomeFantasia}
                      onChange={(e) => setNomeFantasia(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {formTipo === 'ARMAZEM' ? 'CNPJ do Armazém' : 'CNPJ / CPF / Tax Registration ID'}
                    </label>
                    <input
                      type="text"
                      placeholder={formTipo === 'ARMAZEM' ? 'Ex: 08.912.430/0001-55' : 'Ex: 04.821.903/0001-44'}
                      value={documento}
                      onChange={(e) => setDocumento(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO ESPECÍFICA: PRODUTOR RURAL (CAR & IE) */}
              {formTipo === 'PRODUTOR' && (
                <div className="p-4 rounded-2xl border border-amber-300/80 dark:border-amber-800/60 bg-amber-500/5 dark:bg-amber-950/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tractor className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                        2. Rastreabilidade & Origem do Grão (CAR & Inscrição Estadual)
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      Obrigatórios p/ Trajeto
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        CAR - Cadastro Ambiental Rural da Propriedade <span className="text-[#f58220]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: MT-5103007-6B18.C94A.5D12.44A8.B268.31E0.8921"
                        value={carNumero}
                        onChange={(e) => setCarNumero(e.target.value.toUpperCase())}
                        className="w-full font-mono px-3 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Inscrição Estadual (IE) <span className="text-[#f58220]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 13.456.789-0"
                        value={inscricaoEstadual}
                        onChange={(e) => setInscricaoEstadual(e.target.value)}
                        className="w-full font-mono px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Nome da Propriedade / Fazenda / Gleba
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Fazenda Santa Maria - Gleba Araguaia"
                        value={nomePropriedade}
                        onChange={(e) => setNomePropriedade(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Município de Origem
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Confresa"
                        value={municipio}
                        onChange={(e) => setMunicipio(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        UF (Estado)
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="Ex: MT"
                        value={uf}
                        onChange={(e) => setUf(e.target.value.toUpperCase())}
                        className="w-full uppercase font-mono px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Coordenadas GPS (Latitude, Longitude)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: -10.6439, -51.5694"
                        value={coordenadasGps}
                        onChange={(e) => setCoordenadasGps(e.target.value)}
                        className="w-full font-mono px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Área Agricultável (Hectares)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 4850.00"
                        value={areaTotalHectares}
                        onChange={(e) => setAreaTotalHectares(e.target.value)}
                        className="w-full font-mono px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Certificações Socioambientais
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: RTRS Certified, ProTerra, Não-Transgênico (Non-GMO)"
                        value={certificacoes}
                        onChange={(e) => setCertificacoes(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SEÇÃO ESPECÍFICA: ARMAZÉM / SILO */}
              {formTipo === 'ARMAZEM' && (
                <div className="p-4 rounded-2xl border border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-4">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                      2. Dados de Localização do Silo / Armazém
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        UF (Estado) <span className="text-[#f58220]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        placeholder="Ex: MT"
                        value={uf}
                        onChange={(e) => setUf(e.target.value.toUpperCase())}
                        className="w-full uppercase font-mono px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Cidade / Município <span className="text-[#f58220]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Confresa ou Sinop"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Endereço / Rodovia / Setor Industrial <span className="text-[#f58220]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Rodovia BR-158, Km 120, Distrito Agroindustrial"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SEÇÃO ENDEREÇO & CONTATO INTERNACIONAL (IMPORTADOR / BUYER) */}
              {(formTipo === 'IMPORTADOR' || formTipo === 'BUYER') && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    2. Localização & Documentos Internacionais
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        País de Destino
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Vietnã, Índia, EAU"
                        value={pais}
                        onChange={(e) => setPais(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Hai Phong, Dhaka, Dubai"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Endereço Completo
                      </label>
                      <input
                        type="text"
                        placeholder="Logradouro, número, bairro ou zona industrial"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        IEC / Tax Registration (Internacional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: VN0315891244"
                        value={iecTaxId}
                        onChange={(e) => setIecTaxId(e.target.value)}
                        className="w-full font-mono px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        FASSAI (Índia/Ásia)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: VN-IMP-9812"
                        value={fassaiId}
                        onChange={(e) => setFassaiId(e.target.value)}
                        className="w-full font-mono px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DADOS DE CONTATO GERAIS */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  3. Contatos & Observações
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail Comercial / Operacional
                    </label>
                    <input
                      type="email"
                      placeholder="Ex: operacoes@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Telefone / Celular
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: +55 66 3564-1180"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Observações Adicionais
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Informações contratuais, detalhes de acesso logístico ou observações fiscais"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* BOTÕES DE SALVAR */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('LISTA')}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#f58220] hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando Dados...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar no Banco de Dados</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
