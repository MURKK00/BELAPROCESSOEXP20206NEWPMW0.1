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
  Copy,
  Star,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  salvarCadastroEntidadeAction, 
  excluirCadastroEntidadeAction, 
  toggleAtivarCadastroEntidadeAction,
  type CadastroEntidadeInput,
  type FazendaItem
} from '@/server/actions/cadastrosActions';
import type { TipoEntidadeComercial } from '@prisma/client';

export interface FazendaValidacaoDetalhe {
  fazendaId: string;
  fazendaIndex: number;
  nomePropriedade: string;
  faltandoCar: boolean;
  faltandoIE: boolean;
  faltandoNome: boolean;
}

export interface ValidacaoFazendasResult {
  valido: boolean;
  erros: string[];
  detalhes: FazendaValidacaoDetalhe[];
}

/**
 * Função de validação que verifica se todos os campos de CAR e IE
 * estão preenchidos para cada item da lista de fazendas antes de permitir salvar o produtor.
 */
export function validarFazendasProdutor(fazendasList: FazendaItem[]): ValidacaoFazendasResult {
  const erros: string[] = [];
  const detalhes: FazendaValidacaoDetalhe[] = [];

  if (!fazendasList || fazendasList.length === 0) {
    erros.push('O produtor rural precisa ter ao menos uma propriedade/fazenda cadastrada.');
    return { valido: false, erros, detalhes };
  }

  fazendasList.forEach((fz, index) => {
    const nome = fz.nomePropriedade?.trim() || `Fazenda #${index + 1}`;
    const faltandoCar = !fz.carNumero || fz.carNumero.trim() === '';
    const faltandoIE = !fz.inscricaoEstadual || fz.inscricaoEstadual.trim() === '';
    const faltandoNome = !fz.nomePropriedade || fz.nomePropriedade.trim() === '';

    if (faltandoCar || faltandoIE || faltandoNome) {
      detalhes.push({
        fazendaId: fz.id,
        fazendaIndex: index + 1,
        nomePropriedade: nome,
        faltandoCar,
        faltandoIE,
        faltandoNome,
      });

      const pendencias: string[] = [];
      if (faltandoNome) pendencias.push('Nome da Propriedade');
      if (faltandoCar) pendencias.push('CAR (Cadastro Ambiental Rural)');
      if (faltandoIE) pendencias.push('Inscrição Estadual (IE)');

      erros.push(`Fazenda #${index + 1} ("${nome}"): ${pendencias.join(' e ')} ${pendencias.length > 1 ? 'são obrigatórios' : 'é obrigatório'}.`);
    }
  });

  return {
    valido: erros.length === 0,
    erros,
    detalhes,
  };
}

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

  // Múltiplas Fazendas do Produtor Rural
  const [fazendas, setFazendas] = useState<FazendaItem[]>([]);
  const [fazendasValidacaoErros, setFazendasValidacaoErros] = useState<FazendaValidacaoDetalhe[]>([]);
  const [modalConfirmarFazendas, setModalConfirmarFazendas] = useState<boolean>(false);
  const [modalErrosFazendas, setModalErrosFazendas] = useState<string[] | null>(null);

  function handleAdicionarFazenda() {
    setFazendas((prev) => [
      ...prev,
      {
        id: `faz_${Date.now()}_${prev.length + 1}`,
        nomePropriedade: '',
        carNumero: '',
        inscricaoEstadual: '',
        municipio: prev[0]?.municipio || 'Confresa',
        uf: prev[0]?.uf || 'MT',
        coordenadasGps: '',
        areaTotalHectares: null,
        certificacoes: 'RTRS Certified, Zero Desmatamento',
        conformidadeSocioambiental: true,
        padrao: prev.length === 0,
      },
    ]);
  }

  function handleRemoverFazenda(id: string) {
    if (fazendas.length <= 1) {
      alert('O produtor rural precisa ter pelo menos 1 propriedade / fazenda cadastrada.');
      return;
    }
    setFazendas((prev) => {
      const filtradas = prev.filter((f) => f.id !== id);
      const temPadrao = filtradas.some((f) => f.padrao);
      if (!temPadrao && filtradas.length > 0) {
        filtradas[0].padrao = true;
      }
      return [...filtradas];
    });
    setFazendasValidacaoErros((prev) => prev.filter((err) => err.fazendaId !== id));
  }

  function handleDefinirFazendaPadrao(id: string) {
    setFazendas((prev) =>
      prev.map((f) => ({
        ...f,
        padrao: f.id === id,
      }))
    );
  }

  function handleAtualizarFazenda(id: string, campo: keyof FazendaItem, valor: any) {
    setFazendas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f))
    );
    // Limpa pendência em tempo real assim que o usuário digita
    setFazendasValidacaoErros((prev) =>
      prev
        .map((err) => {
          if (err.fazendaId === id) {
            if (campo === 'carNumero' && String(valor).trim()) return { ...err, faltandoCar: false };
            if (campo === 'inscricaoEstadual' && String(valor).trim()) return { ...err, faltandoIE: false };
            if (campo === 'nomePropriedade' && String(valor).trim()) return { ...err, faltandoNome: false };
          }
          return err;
        })
        .filter((err) => err.faltandoCar || err.faltandoIE || err.faltandoNome)
    );
  }

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

    if (tipo === 'PRODUTOR') {
      setFazendas([
        {
          id: `faz_${Date.now()}_1`,
          nomePropriedade: '',
          carNumero: '',
          inscricaoEstadual: '',
          municipio: 'Confresa',
          uf: 'MT',
          coordenadasGps: '',
          areaTotalHectares: null,
          certificacoes: 'RTRS, Zero Desmatamento',
          conformidadeSocioambiental: true,
          padrao: true,
        },
      ]);
    } else {
      setFazendas([]);
    }

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

    // Carregar múltiplas fazendas
    if (item.tipo === 'PRODUTOR') {
      if (Array.isArray(item.fazendas) && item.fazendas.length > 0) {
        setFazendas(item.fazendas);
      } else {
        setFazendas([
          {
            id: `faz_${Date.now()}_1`,
            nomePropriedade: item.nomePropriedade || '',
            carNumero: item.carNumero || '',
            inscricaoEstadual: item.inscricaoEstadual || '',
            municipio: item.municipio || 'Confresa',
            uf: item.uf || 'MT',
            coordenadasGps: item.coordenadasGps || '',
            areaTotalHectares: item.areaTotalHectares ? Number(item.areaTotalHectares) : null,
            certificacoes: item.certificacoes || '',
            conformidadeSocioambiental: item.conformidadeSocioambiental !== false,
            padrao: true,
          },
        ]);
      }
    } else {
      setFazendas([]);
    }

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

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setMsgErro(null);
    setMsgSucesso(null);

    if (!razaoSocial || razaoSocial.trim() === '') {
      setMsgErro('Razão Social / Nome Comercial é obrigatório.');
      return;
    }

    // Se for Produtor Rural, executa validação obrigatória de CAR e IE para cada fazenda registrada
    if (formTipo === 'PRODUTOR') {
      const validacao = validarFazendasProdutor(fazendas);
      if (!validacao.valido) {
        setFazendasValidacaoErros(validacao.detalhes);
        setModalErrosFazendas(validacao.erros);
        setMsgErro(`Atenção: existem ${validacao.erros.length} pendências obrigatórias nas propriedades rurais. Preencha todos os CARs e Inscrições Estaduais.`);
        return;
      }
      setFazendasValidacaoErros([]);

      // Se possui múltiplas fazendas (mais de 1 fazenda), abre o modal de confirmação para garantia dos dados
      if (fazendas.length > 1) {
        setModalConfirmarFazendas(true);
        return;
      }
    }

    // Grava diretamente se for fazenda única ou outra entidade
    executarSalvarReal();
  }

  async function executarSalvarReal() {
    setSalvando(true);
    setMsgErro(null);
    setMsgSucesso(null);
    setModalConfirmarFazendas(false);

    // Identifica a fazenda padrão caso seja produtor
    const fazendaPrincipal = fazendas.find((f) => f.padrao) || fazendas[0];

    const input: CadastroEntidadeInput = {
      id: editId || undefined,
      tipo: formTipo,
      razaoSocial: razaoSocial.trim(),
      nomeFantasia: nomeFantasia?.trim() || null,
      documento: documento?.trim() || null,

      inscricaoEstadual: formTipo === 'PRODUTOR' && fazendaPrincipal ? fazendaPrincipal.inscricaoEstadual : inscricaoEstadual,
      carNumero: formTipo === 'PRODUTOR' && fazendaPrincipal ? fazendaPrincipal.carNumero : carNumero,
      nomePropriedade: formTipo === 'PRODUTOR' && fazendaPrincipal ? fazendaPrincipal.nomePropriedade : nomePropriedade,
      municipio: formTipo === 'PRODUTOR' && fazendaPrincipal ? fazendaPrincipal.municipio : municipio,
      uf: formTipo === 'PRODUTOR' && fazendaPrincipal ? fazendaPrincipal.uf : uf,
      coordenadasGps: formTipo === 'PRODUTOR' && fazendaPrincipal ? fazendaPrincipal.coordenadasGps : coordenadasGps,
      areaTotalHectares:
        formTipo === 'PRODUTOR' && fazendaPrincipal
          ? (fazendaPrincipal.areaTotalHectares !== undefined && fazendaPrincipal.areaTotalHectares !== null ? Number(fazendaPrincipal.areaTotalHectares) : null)
          : (areaTotalHectares ? parseFloat(areaTotalHectares) : null),
      certificacoes: formTipo === 'PRODUTOR' && fazendaPrincipal ? fazendaPrincipal.certificacoes : certificacoes,
      conformidadeSocioambiental: formTipo === 'PRODUTOR' && fazendaPrincipal ? fazendaPrincipal.conformidadeSocioambiental : conformidadeSocioambiental,
      fazendas: formTipo === 'PRODUTOR' ? fazendas : null,

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

    const matchesRoot =
      (item.razaoSocial || '').toLowerCase().includes(q) ||
      (item.nomeFantasia || '').toLowerCase().includes(q) ||
      (item.carNumero || '').toLowerCase().includes(q) ||
      (item.inscricaoEstadual || '').toLowerCase().includes(q) ||
      (item.nomePropriedade || '').toLowerCase().includes(q) ||
      (item.documento || '').toLowerCase().includes(q) ||
      (item.municipio || '').toLowerCase().includes(q) ||
      (item.cidade || '').toLowerCase().includes(q) ||
      (item.pais || '').toLowerCase().includes(q);

    if (matchesRoot) return true;

    if (Array.isArray(item.fazendas)) {
      return item.fazendas.some(
        (fz: any) =>
          (fz.nomePropriedade || '').toLowerCase().includes(q) ||
          (fz.carNumero || '').toLowerCase().includes(q) ||
          (fz.inscricaoEstadual || '').toLowerCase().includes(q) ||
          (fz.municipio || '').toLowerCase().includes(q)
      );
    }

    return false;
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
                            <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-2 text-xs">
                              {/* HEADER DE FAZENDAS */}
                              <div className="flex items-center justify-between pb-1 border-b border-amber-200/50 dark:border-amber-800/30">
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-900 dark:text-amber-200">
                                  🌾 {item.fazendas && Array.isArray(item.fazendas) ? `${item.fazendas.length} ${item.fazendas.length > 1 ? 'Fazendas / Propriedades' : 'Propriedade Rural'}` : '1 Propriedade Rural'}
                                </span>
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                                  {item.fazendas && Array.isArray(item.fazendas) && item.fazendas.length > 1 ? 'Múltiplos CARs' : 'Origem Única'}
                                </span>
                              </div>

                              {/* FAZENDA PRINCIPAL */}
                              {item.carNumero && (
                                <div className="flex items-start gap-1.5">
                                  <span className="font-bold text-amber-900 dark:text-amber-300 shrink-0">
                                    CAR Principal:
                                  </span>
                                  <span className="font-mono text-[11px] text-amber-950 dark:text-amber-200 break-all font-semibold">
                                    {item.carNumero}
                                  </span>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400">IE Principal: </span>
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {item.inscricaoEstadual || '—'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400">Fazenda: </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                    {item.nomePropriedade || '—'}
                                  </span>
                                </div>
                              </div>

                              {/* CHIPS DE OUTRAS FAZENDAS SE HOUVER */}
                              {item.fazendas && Array.isArray(item.fazendas) && item.fazendas.length > 1 && (
                                <div className="pt-1.5 border-t border-amber-200/40 dark:border-amber-800/30">
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                                    Outras propriedades vinculadas:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {item.fazendas.filter((f: any) => !f.padrao).map((fz: any, idx: number) => (
                                      <span
                                        key={fz.id || idx}
                                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-200 border border-amber-200/70 dark:border-amber-800/50 flex items-center gap-1"
                                        title={`CAR: ${fz.carNumero} | IE: ${fz.inscricaoEstadual}`}
                                      >
                                        <span>🌾 {fz.nomePropriedade || `Fazenda #${idx + 2}`}</span>
                                        <span className="text-[9px] font-mono text-slate-400">({fz.municipio || 'MT'})</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
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

                {/* 2. DADOS ESPECÍFICOS: PRODUTOR RURAL (MÚLTIPLAS FAZENDAS, CAR & IE) */}
                {entidadeVisualizar.tipo === 'PRODUTOR' && (
                  <div className="md:col-span-2 p-4 rounded-2xl border border-amber-300/80 dark:border-amber-800/60 bg-amber-500/5 dark:bg-amber-950/20 space-y-3.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-800/40">
                      <div className="flex items-center gap-2">
                        <Tractor className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h5 className="font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                          Propriedades Rurais & Rastreabilidade do Grão
                        </h5>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        {Array.isArray(entidadeVisualizar.fazendas) && entidadeVisualizar.fazendas.length > 0
                          ? `${entidadeVisualizar.fazendas.length} ${entidadeVisualizar.fazendas.length > 1 ? 'Fazendas Cadastradas' : 'Fazenda Cadastrada'}`
                          : '1 Fazenda Cadastrada'}
                      </span>
                    </div>

                    {/* LISTA DAS FAZENDAS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(Array.isArray(entidadeVisualizar.fazendas) && entidadeVisualizar.fazendas.length > 0
                        ? entidadeVisualizar.fazendas
                        : [
                            {
                              id: 'faz_single',
                              nomePropriedade: entidadeVisualizar.nomePropriedade || 'Propriedade Principal',
                              carNumero: entidadeVisualizar.carNumero || '',
                              inscricaoEstadual: entidadeVisualizar.inscricaoEstadual || '',
                              municipio: entidadeVisualizar.municipio || 'Confresa',
                              uf: entidadeVisualizar.uf || 'MT',
                              coordenadasGps: entidadeVisualizar.coordenadasGps || '',
                              areaTotalHectares: entidadeVisualizar.areaTotalHectares || null,
                              certificacoes: entidadeVisualizar.certificacoes || '',
                              conformidadeSocioambiental: entidadeVisualizar.conformidadeSocioambiental !== false,
                              padrao: true,
                            },
                          ]
                      ).map((fz: any, idx: number) => (
                        <div
                          key={fz.id || idx}
                          className={`p-3.5 rounded-xl border transition-all ${
                            fz.padrao
                              ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80 shadow-xs'
                              : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-black text-slate-900 dark:text-white truncate text-xs">
                                🌾 {fz.nomePropriedade || `Fazenda #${idx + 1}`}
                              </span>
                            </div>
                            {fz.padrao ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                                <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" /> Principal
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">
                                #{idx + 1}
                              </span>
                            )}
                          </div>

                          {/* CAR */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">CAR:</span>
                              {fz.carNumero && (
                                <button
                                  type="button"
                                  onClick={() => copiarParaClipboard(fz.carNumero, `car_${idx}`)}
                                  className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>{copiadoTexto === `car_${idx}` ? 'Copiado!' : 'Copiar'}</span>
                                </button>
                              )}
                            </div>
                            <div className="font-mono font-bold text-[11px] text-amber-950 dark:text-amber-200 break-all bg-white/60 dark:bg-slate-950/40 p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
                              {fz.carNumero || '—'}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Inscrição Estadual:</span>
                              <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {fz.inscricaoEstadual || '—'}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Localidade:</span>
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {fz.municipio ? `${fz.municipio} - ${fz.uf || 'MT'}` : fz.uf || 'MT'}
                              </div>
                            </div>
                          </div>

                          {(fz.areaTotalHectares || fz.coordenadasGps) && (
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-300 pt-1 border-t border-amber-200/40 dark:border-amber-800/20">
                              {fz.areaTotalHectares && (
                                <div>
                                  <span className="text-slate-400">Área: </span>
                                  <strong>{Number(fz.areaTotalHectares).toLocaleString('pt-BR')} ha</strong>
                                </div>
                              )}
                              {fz.coordenadasGps && (
                                <div className="truncate">
                                  <span className="text-slate-400">GPS: </span>
                                  <strong className="font-mono">{fz.coordenadasGps}</strong>
                                </div>
                              )}
                            </div>
                          )}

                          {fz.certificacoes && (
                            <div className="mt-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                              🌱 {fz.certificacoes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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

              {/* SEÇÃO ESPECÍFICA: PRODUTOR RURAL (MÚLTIPLAS FAZENDAS COM CAR + IE) */}
              {formTipo === 'PRODUTOR' && (
                <div className="p-4 sm:p-5 rounded-2xl border border-amber-300/80 dark:border-amber-800/60 bg-amber-500/5 dark:bg-amber-950/20 space-y-4">
                  {/* CABEÇALHO DA SEÇÃO DE FAZENDAS */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-amber-800/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <Tractor className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                          2. Propriedades Rurais & Fazendas do Produtor
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                          {fazendas.length} {fazendas.length === 1 ? 'Propriedade' : 'Propriedades'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Cadastre cada fazenda com seu CAR, Inscrição Estadual (IE) e dados de localização para auditoria socioambiental e rastreabilidade do lote.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAdicionarFazenda}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Outra Fazenda</span>
                    </button>
                  </div>

                  {/* CARDS DINÂMICOS DE CADA FAZENDA */}
                  <div className="space-y-4">
                    {fazendas.map((fz, index) => {
                      const erroFz = fazendasValidacaoErros.find((e) => e.fazendaId === fz.id || e.fazendaIndex === index + 1);

                      return (
                      <div
                        key={fz.id || index}
                        className={`p-4 rounded-2xl border transition-all ${
                          erroFz
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/20 shadow-xs'
                            : fz.padrao
                            ? 'bg-white dark:bg-slate-900 border-amber-400 dark:border-amber-600/80 shadow-sm ring-2 ring-amber-400/20'
                            : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* ALERTA VISUAL DE ERRO DE VALIDAÇÃO DESTA FAZENDA */}
                        {erroFz && (
                          <div className="flex items-center gap-2 p-2.5 mb-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold animate-fadeIn">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              Pendência nesta fazenda: {erroFz.faltandoCar && 'CAR obrigatório não informado'} {erroFz.faltandoCar && erroFz.faltandoIE && '•'} {erroFz.faltandoIE && 'Inscrição Estadual (IE) obrigatória não informada'}.
                            </span>
                          </div>
                        )}

                        {/* CABEÇALHO DO CARD DA FAZENDA */}
                        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                              erroFz
                                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}>
                              #{index + 1}
                            </span>
                            <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {fz.nomePropriedade ? `Fazenda: ${fz.nomePropriedade}` : `Fazenda / Propriedade #${index + 1}`}
                            </h5>
                          </div>

                          <div className="flex items-center gap-2">
                            {fz.padrao ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" /> Fazenda Principal
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDefinirFazendaPadrao(fz.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                title="Definir esta fazenda como a origem principal/padrão deste produtor"
                              >
                                <Star className="w-3 h-3 text-slate-400" />
                                <span>Tornar Principal</span>
                              </button>
                            )}

                            {fazendas.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoverFazenda(fz.id)}
                                className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Remover esta fazenda"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* CAMPOS DA FAZENDA */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* NOME DA FAZENDA */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                              Nome da Propriedade / Fazenda / Gleba / Talhão <span className="text-[#f58220]">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: Fazenda Santa Maria - Gleba Araguaia"
                              value={fz.nomePropriedade || ''}
                              onChange={(e) => handleAtualizarFazenda(fz.id, 'nomePropriedade', e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 outline-none font-medium"
                            />
                          </div>

                          {/* CAR */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                                CAR - Cadastro Ambiental Rural da Propriedade <span className="text-[#f58220]">*</span>
                              </label>
                              {erroFz?.faltandoCar && (
                                <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Obrigatório
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="Ex: MT-5103007-6B18.C94A.5D12.44A8.B268.31E0.8921"
                              value={fz.carNumero || ''}
                              onChange={(e) => handleAtualizarFazenda(fz.id, 'carNumero', e.target.value.toUpperCase())}
                              className={`w-full font-mono uppercase px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none font-medium transition-all ${
                                erroFz?.faltandoCar
                                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30 dark:bg-rose-950/20'
                                  : 'border-amber-300 dark:border-amber-700/80 focus:ring-2 focus:ring-amber-500/40'
                              }`}
                            />
                            {erroFz?.faltandoCar && (
                              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                O CAR é indispensável para validação socioambiental e rastreabilidade desta fazenda.
                              </p>
                            )}
                          </div>

                          {/* INSCRIÇÃO ESTADUAL */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                                Inscrição Estadual (IE da Fazenda) <span className="text-[#f58220]">*</span>
                              </label>
                              {erroFz?.faltandoIE && (
                                <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Obrigatório
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="Ex: 13.456.789-0"
                              value={fz.inscricaoEstadual || ''}
                              onChange={(e) => handleAtualizarFazenda(fz.id, 'inscricaoEstadual', e.target.value)}
                              className={`w-full font-mono px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none font-medium transition-all ${
                                erroFz?.faltandoIE
                                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30 dark:bg-rose-950/20'
                                  : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#f58220]/40'
                              }`}
                            />
                            {erroFz?.faltandoIE && (
                              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                A Inscrição Estadual é indispensável para emissão de nota fiscal na SEFAZ.
                              </p>
                            )}
                          </div>

                          {/* MUNICÍPIO */}
                          <div>
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                              Município da Propriedade
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Confresa, Sinop, Canarana"
                              value={fz.municipio || ''}
                              onChange={(e) => handleAtualizarFazenda(fz.id, 'municipio', e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                            />
                          </div>

                          {/* UF */}
                          <div>
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                              UF (Estado)
                            </label>
                            <input
                              type="text"
                              maxLength={2}
                              placeholder="Ex: MT"
                              value={fz.uf || 'MT'}
                              onChange={(e) => handleAtualizarFazenda(fz.id, 'uf', e.target.value.toUpperCase())}
                              className="w-full uppercase font-mono px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                            />
                          </div>

                          {/* COORDENADAS GPS */}
                          <div>
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                              Coordenadas GPS (Latitude, Longitude)
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: -10.6439, -51.5694"
                              value={fz.coordenadasGps || ''}
                              onChange={(e) => handleAtualizarFazenda(fz.id, 'coordenadasGps', e.target.value)}
                              className="w-full font-mono px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                            />
                          </div>

                          {/* ÁREA HECTARES */}
                          <div>
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                              Área Agricultável (Hectares)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Ex: 4850.00"
                              value={fz.areaTotalHectares !== null && fz.areaTotalHectares !== undefined ? String(fz.areaTotalHectares) : ''}
                              onChange={(e) => handleAtualizarFazenda(fz.id, 'areaTotalHectares', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full font-mono px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                            />
                          </div>

                          {/* CERTIFICAÇÕES */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                              Certificações Socioambientais da Fazenda
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: GlobalGAP Pulses, RTRS Certified, Não-Transgênico (Non-GMO), Zero Desmatamento"
                              value={fz.certificacoes || ''}
                              onChange={(e) => handleAtualizarFazenda(fz.id, 'certificacoes', e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      );
                    })}
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
                      <span>Salvar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* MODAL DE ALERTA: CAR / IE PENDENTES EM FAZENDAS */}
          {modalErrosFazendas && modalErrosFazendas.length > 0 && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
              <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-rose-300 dark:border-rose-900 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scaleUp">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Validação de Propriedades Rurais Obrigatória
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Para atender às exigências de conformidade socioambiental (EUDR, Moratória da Soja) e de emissão fiscal na SEFAZ, <strong>todas as fazendas registradas</strong> precisam ter o <strong>CAR</strong> e a <strong>Inscrição Estadual (IE)</strong> preenchidos.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                  <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                    Pendências Detectadas ({modalErrosFazendas.length}):
                  </span>
                  <ul className="space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
                    {modalErrosFazendas.map((err, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <span className="font-medium">{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setModalErrosFazendas(null)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                  >
                    Voltar e Corrigir os Campos
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE CONFIRMAÇÃO: REVISÃO DE MÚLTIPLAS FAZENDAS */}
          {modalConfirmarFazendas && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
              <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-amber-300 dark:border-amber-800 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
                {/* Header fixo */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-[#0f172a]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Confirmação de Rastreabilidade & Múltiplas Fazendas
                      </h3>
                      <p className="text-xs text-slate-500">
                        {fazendas.length} propriedades rurais validadas para este produtor.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalConfirmarFazendas(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Conteúdo rolável */}
                <div className="p-5 overflow-y-auto space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-semibold">
                      Produtor: <span className="font-black text-slate-900 dark:text-white">{razaoSocial}</span>
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Todos os CARs e Inscrições Estaduais foram conferidos. Revise a relação antes de gravar definitivamente no banco de dados:
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {fazendas.map((fz, idx) => (
                      <div
                        key={fz.id || idx}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          fz.padrao
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-400 dark:border-amber-700'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-black">
                              #{idx + 1}
                            </span>
                            <span className="font-black text-xs text-slate-900 dark:text-white">
                              {fz.nomePropriedade || `Fazenda #${idx + 1}`}
                            </span>
                          </div>
                          {fz.padrao && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" /> Origem Principal
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">CAR</span>
                              <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate block">
                                {fz.carNumero}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Inscrição Estadual</span>
                              <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate block">
                                {fz.inscricaoEstadual}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                          <span>Localização: <strong>{fz.municipio || 'Confresa'} - {fz.uf || 'MT'}</strong></span>
                          {fz.areaTotalHectares && <span>Área: <strong>{fz.areaTotalHectares} ha</strong></span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer fixo */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-[#0f172a]">
                  <button
                    type="button"
                    onClick={() => setModalConfirmarFazendas(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    Voltar para Edição
                  </button>
                  <button
                    type="button"
                    onClick={executarSalvarReal}
                    disabled={salvando}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#f58220] hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    {salvando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando no Banco...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirmar e Gravar Cadastro</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
