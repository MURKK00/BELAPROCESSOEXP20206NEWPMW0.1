'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  CheckCircle2, 
  Clock, 
  Landmark, 
  DollarSign, 
  Percent,
  Check,
  AlertCircle,
  Search,
  Sparkles,
  X,
  Plus,
  Building2,
  Globe2,
  ChevronDown
} from 'lucide-react';
import { buscarBancos, DIRETORIO_BANCOS, type BancoInfo } from '@/lib/bancosDiretorio';
import { criarProcessoAction } from '@/server/actions/criarProcessoAction';
import { 
  Section, 
  Field, 
  SelectField, 
  PRODUTOS_FEIJAO, 
  TIPOS_FUMIGACAO, 
  PORTOS_ORIGEM_OPTIONS, 
  EMBALAGENS_OPTIONS 
} from '@/components/negociacoes/FormFields';
import { IncotermSelectField } from '@/components/negociacoes/IncotermSelectField';
import { CentralCadastrosModal } from '@/components/cadastros/CentralCadastrosModal';

export default function NovaNegociacaoPage() {
  const router = useRouter();

  // 1. Estado do Switch: Comprador diferente do importador (PRIMEIRA INFORMAÇÃO)
  const [compradorDiferente, setCompradorDiferente] = useState(false);

  // 2. Estados para Cliente Final / Importador (Consignee) com busca em formato lista
  const [clienteFinal, setClienteFinal] = useState('');
  const [importadorId, setImportadorId] = useState('');
  const [importadorSelecionado, setImportadorSelecionado] = useState<any | null>(null);
  const [importadorDropdownAberto, setImportadorDropdownAberto] = useState(false);
  const [cadastrosImportadores, setCadastrosImportadores] = useState<any[]>([]);

  // 3. Estados para Comprador (Buyer) quando diferente do importador com busca em lista
  const [compradorNome, setCompradorNome] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [buyerSelecionado, setBuyerSelecionado] = useState<any | null>(null);
  const [buyerDropdownAberto, setBuyerDropdownAberto] = useState(false);
  const [cadastrosBuyers, setCadastrosBuyers] = useState<any[]>([]);

  // Estados do Modal de Cadastros
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [modalTipoInicial, setModalTipoInicial] = useState<'IMPORTADOR' | 'BUYER'>('IMPORTADOR');
  const [modalAlvo, setModalAlvo] = useState<'IMPORTADOR' | 'BUYER'>('IMPORTADOR');

  // Refs para fechar dropdowns ao clicar fora
  const importadorRef = useRef<HTMLDivElement>(null);
  const buyerRef = useRef<HTMLDivElement>(null);

  // Estado para controlar se a fumigação é sim ou não
  const [fumigacao, setFumigacao] = useState('sim');

  // Estados para cálculo automático de sacas por contêiner
  const [volumeKg, setVolumeKg] = useState<string>('');
  const [containerQtd, setContainerQtd] = useState<string>('');
  const [embalagemTipo, setEmbalagemTipo] = useState<string>('Sacaria 30kg');
  const [sacasPorContainer, setSacasPorContainer] = useState<string>('');
  const [calculoExplicacao, setCalculoExplicacao] = useState<string>('');

  // Preço unitário declarado
  const [valorDeclaradoUsd, setValorDeclaradoUsd] = useState<string>('');

  // Estados para Condição de Pagamento e Cobrança CAD (Carta Borderô)
  const [temProforma, setTemProforma] = useState<boolean>(false);
  const [diasLiquidacao, setDiasLiquidacao] = useState<string>('20');
  const [multaAtrasoPerc, setMultaAtrasoPerc] = useState<string>('5');
  const [adiantamentoPerc, setAdiantamentoPerc] = useState<string>('10');
  
  // Dados bancários opcionais na criação
  const [mostrarDadosBanco, setMostrarDadosBanco] = useState<boolean>(false);
  const [bancoNome, setBancoNome] = useState<string>('');
  const [bancoEndereco, setBancoEndereco] = useState<string>('');
  const [bancoConta, setBancoConta] = useState<string>('');
  const [bancoSwift, setBancoSwift] = useState<string>('');

  // Máscara e sanitização para o código SWIFT
  const maskSwift = (val: string) => val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
  const swiftTrim = bancoSwift.trim().toUpperCase();
  const swiftLen = swiftTrim.length;
  const isSwiftFormatoValido = /^[A-Z0-9]+$/.test(swiftTrim);
  const isSwiftCompleto = (swiftLen === 8 || swiftLen === 11) && isSwiftFormatoValido;
  const isSwiftInvalido = swiftLen > 0 && !isSwiftCompleto;

  // Estados para busca automática no diretório bancário
  const [bancosSugeridos, setBancosSugeridos] = useState<BancoInfo[]>([]);
  const [mostrarModalBancos, setMostrarModalBancos] = useState(false);
  const [feedbackBanco, setFeedbackBanco] = useState<string | null>(null);

  // Carrega importadores e buyers cadastrados
  useEffect(() => {
    carregarCadastros();
  }, []);

  async function carregarCadastros() {
    try {
      const res = await fetch('/api/cadastros');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCadastrosImportadores(data.filter((item: any) => item.tipo === 'IMPORTADOR' || item.tipo === 'BUYER'));
          setCadastrosBuyers(data.filter((item: any) => item.tipo === 'BUYER' || item.tipo === 'IMPORTADOR'));
        }
      }
    } catch (e) {
      console.error('Erro ao carregar lista de cadastros:', e);
    }
  }

  // Listener para fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (importadorRef.current && !importadorRef.current.contains(event.target as Node)) {
        setImportadorDropdownAberto(false);
      }
      if (buyerRef.current && !buyerRef.current.contains(event.target as Node)) {
        setBuyerDropdownAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelecionarImportador(entidade: any) {
    setClienteFinal(entidade.razaoSocial || entidade.nomeFantasia || '');
    setImportadorId(entidade.id);
    setImportadorSelecionado(entidade);
    setImportadorDropdownAberto(false);

    // Se o banco ainda não estiver preenchido e a entidade tiver banco cadastrado, auto-preenche
    if (entidade.bancoNome && !bancoNome) {
      setBancoNome(entidade.bancoNome);
      if (entidade.bancoEndereco) setBancoEndereco(entidade.bancoEndereco);
      if (entidade.bancoConta) setBancoConta(entidade.bancoConta);
      if (entidade.bancoSwift) setBancoSwift(entidade.bancoSwift);
      setMostrarDadosBanco(true);
    }
  }

  function handleSelecionarBuyer(entidade: any) {
    setCompradorNome(entidade.razaoSocial || entidade.nomeFantasia || '');
    setBuyerId(entidade.id);
    setBuyerSelecionado(entidade);
    setBuyerDropdownAberto(false);

    if (entidade.bancoNome && !bancoNome) {
      setBancoNome(entidade.bancoNome);
      if (entidade.bancoEndereco) setBancoEndereco(entidade.bancoEndereco);
      if (entidade.bancoConta) setBancoConta(entidade.bancoConta);
      if (entidade.bancoSwift) setBancoSwift(entidade.bancoSwift);
      setMostrarDadosBanco(true);
    }
  }

  function abrirModalCadastro(alvo: 'IMPORTADOR' | 'BUYER') {
    setModalAlvo(alvo);
    setModalTipoInicial(alvo);
    setModalCadastroAberto(true);
    setImportadorDropdownAberto(false);
    setBuyerDropdownAberto(false);
  }

  function handleEntidadeCriadaNoModal(novaEntidade: any) {
    carregarCadastros().then(() => {
      if (modalAlvo === 'IMPORTADOR') {
        handleSelecionarImportador(novaEntidade);
      } else {
        handleSelecionarBuyer(novaEntidade);
      }
    });
  }

  // Filtra importadores pelo termo digitado
  const importadoresFiltrados = cadastrosImportadores.filter((item) => {
    const termo = clienteFinal.trim().toLowerCase();
    if (!termo) return true;
    return (
      item.razaoSocial?.toLowerCase().includes(termo) ||
      item.nomeFantasia?.toLowerCase().includes(termo) ||
      item.pais?.toLowerCase().includes(termo) ||
      item.cidade?.toLowerCase().includes(termo) ||
      item.documento?.toLowerCase().includes(termo)
    );
  });

  // Filtra buyers pelo termo digitado
  const buyersFiltrados = cadastrosBuyers.filter((item) => {
    const termo = compradorNome.trim().toLowerCase();
    if (!termo) return true;
    return (
      item.razaoSocial?.toLowerCase().includes(termo) ||
      item.nomeFantasia?.toLowerCase().includes(termo) ||
      item.pais?.toLowerCase().includes(termo) ||
      item.cidade?.toLowerCase().includes(termo) ||
      item.documento?.toLowerCase().includes(termo)
    );
  });

  function handleBuscarDadosBanco(termoBusca?: string) {
    const q = termoBusca !== undefined ? termoBusca : bancoNome;
    const resultados = buscarBancos(q);

    if (resultados.length === 1) {
      const b = resultados[0];
      setBancoNome(b.nome);
      setBancoEndereco(b.endereco);
      setBancoSwift(b.swift);
      setBancosSugeridos([]);
      setMostrarModalBancos(false);
      setFeedbackBanco(`Dados preenchidos com sucesso para ${b.nome}!`);
    } else if (resultados.length > 1) {
      setBancosSugeridos(resultados);
      setMostrarModalBancos(true);
      setFeedbackBanco(null);
    } else {
      setBancosSugeridos(DIRETORIO_BANCOS.slice(0, 8));
      setMostrarModalBancos(true);
      setFeedbackBanco(
        q.trim()
          ? `Nenhum banco encontrado para "${q}". Escolha um dos bancos internacionais abaixo:`
          : 'Selecione um banco internacional abaixo para preencher automaticamente:'
      );
    }
  }

  function handleSelecionarBanco(banco: BancoInfo) {
    setBancoNome(banco.nome);
    setBancoEndereco(banco.endereco);
    setBancoSwift(banco.swift);
    setBancosSugeridos([]);
    setMostrarModalBancos(false);
    setFeedbackBanco(`Dados preenchidos com sucesso: ${banco.nome}!`);
  }

  const handleToggleProforma = (comProforma: boolean) => {
    setTemProforma(comProforma);
    if (comProforma) {
      setDiasLiquidacao('10');
    } else {
      setDiasLiquidacao('20');
    }
  };

  useEffect(() => {
    const vol = parseFloat(volumeKg);
    const qtd = parseInt(containerQtd, 10);

    if (vol > 0 && qtd > 0) {
      const match = embalagemTipo.match(/(\d+)\s*kg/i);
      const pesoSaca = match ? parseFloat(match[1]) : 30;

      const kgPorContainer = vol / qtd;
      const sacasCalculadas = Math.round(kgPorContainer / pesoSaca);

      setSacasPorContainer(sacasCalculadas.toString());
      setCalculoExplicacao(
        `Cálculo automático: (${vol.toLocaleString('pt-BR')} kg ÷ ${qtd} ctns = ${Math.round(kgPorContainer).toLocaleString('pt-BR')} kg/ctn) ÷ ${pesoSaca} kg = ${sacasCalculadas} sacas por contêiner`
      );
    } else {
      setCalculoExplicacao('');
    }
  }, [volumeKg, containerQtd, embalagemTipo]);

  return (
    <div className="max-w-3xl">
      {/* CABEÇALHO */}
      <div className="flex items-center gap-3.5 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs group cursor-pointer"
          title="Voltar para a página anterior"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Nova negociação</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Lançamento de novo processo de exportação
          </p>
        </div>
      </div>

      <form action={criarProcessoAction} className="space-y-6">

        <Section title="Dados do contrato">
          {/* 1. PRIMEIRA INFORMAÇÃO SELECIONÁVEL: COMPRADOR (BUYER) DIFERENTE DO IMPORTADOR (CONSIGNEE) */}
          <div className={`col-span-full rounded-2xl border p-4 sm:p-4.5 transition-all duration-300 ease-in-out ${
            compradorDiferente 
              ? 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-400/80 dark:border-orange-600/80 ring-2 ring-orange-500/15 shadow-sm' 
              : 'bg-slate-50/80 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  compradorDiferente 
                    ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/30' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-black text-slate-900 dark:text-slate-100 block tracking-tight">
                    Comprador (Buyer) diferente do Importador (Consignee)
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ative se o faturamento/pagamento for emitido para uma trading ou empresa distinta da que recebe o grão no destino.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className={`text-xs font-bold transition-colors ${
                  compradorDiferente ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'
                }`}>
                  {compradorDiferente ? 'Sim' : 'Não'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={compradorDiferente}
                  onClick={() => setCompradorDiferente(!compradorDiferente)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-300 ease-in-out focus:outline-none ${
                    compradorDiferente ? 'bg-orange-500 shadow-sm shadow-orange-500/40' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${
                      compradorDiferente ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* CAMPO OCULTO ENVIADO NO FORMDATA */}
            <input
              type="hidden"
              name="compradorDiferente"
              value={compradorDiferente ? 'sim' : 'nao'}
            />
          </div>

          {/* 2. LOGO APÓS: CLIENTE FINAL / IMPORTADOR (CONSIGNEE) EM FORMATO DE LISTA COM DIGITAÇÃO E SUGESTÃO */}
          <div className="col-span-full" ref={importadorRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Cliente final / Importador (Consignee) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => abrirModalCadastro('IMPORTADOR')}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Cadastrar Importador</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                name="clienteFinal"
                value={clienteFinal}
                autoComplete="off"
                placeholder="Digite ou selecione da lista (Ex: AKSHAR AGRI INDIA / VINA AGRI...)"
                onFocus={() => setImportadorDropdownAberto(true)}
                onChange={(e) => {
                  setClienteFinal(e.target.value);
                  setImportadorId('');
                  setImportadorSelecionado(null);
                  setImportadorDropdownAberto(true);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 outline-none pr-10 font-medium"
              />
              <button
                type="button"
                onClick={() => setImportadorDropdownAberto(!importadorDropdownAberto)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${importadorDropdownAberto ? 'rotate-180' : ''}`} />
              </button>

              {/* LISTA SUSPENSA COM SUGESTÕES DO MESMO NOME / PESQUISA */}
              {importadorDropdownAberto && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      Importadores Cadastrados ({importadoresFiltrados.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setImportadorDropdownAberto(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {importadoresFiltrados.length > 0 ? (
                      importadoresFiltrados.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelecionarImportador(item)}
                          className="w-full text-left p-3 hover:bg-blue-50/70 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                              {item.razaoSocial}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Globe2 className="w-3 h-3 text-slate-400" />
                                {item.cidade ? `${item.cidade}, ` : ''}{item.pais || 'Exterior'}
                              </span>
                              {item.documento && (
                                <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  ID: {item.documento}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2 py-1 rounded-lg">
                            Selecionar
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Nenhum importador encontrado com &ldquo;{clienteFinal}&rdquo;.
                        </p>
                        <button
                          type="button"
                          onClick={() => abrirModalCadastro('IMPORTADOR')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Cadastrar &ldquo;{clienteFinal || 'Novo Importador'}&rdquo;</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* DADOS DO IMPORTADOR SELECIONADO (SE HOUVER) */}
            {importadorSelecionado && (
              <div className="mt-2 p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-700 dark:text-slate-300">
                    Importador vinculado da base: <strong className="text-slate-900 dark:text-white">{importadorSelecionado.razaoSocial}</strong> ({importadorSelecionado.pais || 'Exterior'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImportadorId('');
                    setImportadorSelecionado(null);
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Desvincular
                </button>
              </div>
            )}

            {/* INPUT OCULTO COM O ID */}
            <input type="hidden" name="importadorId" value={importadorId} />
            <input type="hidden" name="enderecoBuyer" value={importadorSelecionado?.endereco || ''} />
            <input type="hidden" name="cidadeBuyer" value={importadorSelecionado?.cidade || ''} />
            <input type="hidden" name="paisBuyer" value={importadorSelecionado?.pais || ''} />
          </div>

          {/* 3. SE COMPRADOR FOR DIFERENTE DO IMPORTADOR: CAMPO COMPRADOR (BUYER) EM FORMATO DE LISTA COM DIGITAÇÃO E SUGESTÃO */}
          {compradorDiferente && (
            <div className="col-span-full pt-1" ref={buyerRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-orange-950 dark:text-orange-200">
                  Comprador (Buyer) / Faturamento Comercial <span className="text-orange-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => abrirModalCadastro('BUYER')}
                  className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Cadastrar Comprador (Buyer)</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required={compradorDiferente}
                  name="compradorNome"
                  value={compradorNome}
                  autoComplete="off"
                  placeholder="Digite ou selecione da lista (Ex: Trading Internacional / Faturamento)"
                  onFocus={() => setBuyerDropdownAberto(true)}
                  onChange={(e) => {
                    setCompradorNome(e.target.value);
                    setBuyerId('');
                    setBuyerSelecionado(null);
                    setBuyerDropdownAberto(true);
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/40 outline-none pr-10 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setBuyerDropdownAberto(!buyerDropdownAberto)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${buyerDropdownAberto ? 'rotate-180' : ''}`} />
                </button>

                {/* LISTA SUSPENSA COM SUGESTÕES DO BUYER */}
                {buyerDropdownAberto && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/60 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-orange-50/50 dark:bg-orange-950/30 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold flex items-center gap-1.5 text-orange-800 dark:text-orange-300">
                        <Users className="w-3.5 h-3.5 text-orange-600" />
                        Compradores / Buyers Cadastrados ({buyersFiltrados.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setBuyerDropdownAberto(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {buyersFiltrados.length > 0 ? (
                        buyersFiltrados.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelecionarBuyer(item)}
                            className="w-full text-left p-3 hover:bg-orange-50/70 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 truncate">
                                {item.razaoSocial}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Globe2 className="w-3 h-3 text-slate-400" />
                                  {item.cidade ? `${item.cidade}, ` : ''}{item.pais || 'Exterior'}
                                </span>
                                {item.documento && (
                                  <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    ID: {item.documento}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="shrink-0 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900 px-2 py-1 rounded-lg">
                              Selecionar
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center space-y-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Nenhum comprador encontrado com &ldquo;{compradorNome}&rdquo;.
                          </p>
                          <button
                            type="button"
                            onClick={() => abrirModalCadastro('BUYER')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Cadastrar &ldquo;{compradorNome || 'Novo Buyer'}&rdquo;</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {buyerSelecionado && (
                <div className="mt-2 p-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 flex items-center justify-between text-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Comprador vinculado: <strong className="text-slate-900 dark:text-white">{buyerSelecionado.razaoSocial}</strong> ({buyerSelecionado.pais || 'Exterior'})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerId('');
                      setBuyerSelecionado(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Desvincular
                  </button>
                </div>
              )}
            </div>
          )}

          <Field label="Trader / Intermédio" name="traderIntermedio" placeholder="Ex: AgriTrading Partners SA" />

          <IncotermSelectField defaultValue="CFR" required />
          
          <SelectField
            label="Porto de Origem (Saída)"
            name="portoOrigem"
            required
            defaultValue="SANTOS (Santos - BRSSZ)"
            options={PORTOS_ORIGEM_OPTIONS}
          />

          <Field label="Porto de destino" name="portoDestino" placeholder="Ex: Rotterdam (NL) ou Mundra (IN)" required />
          <Field label="Free time (Destino)" name="freeTimeDestino" placeholder="Ex: 14 dias corridos" />
          
          <Field 
            label="Preço unitário declarado (USD/TON)" 
            name="valorDeclaradoUsd" 
            type="number" 
            placeholder="Ex: 880"
            value={valorDeclaradoUsd}
            onChange={(e) => setValorDeclaradoUsd(e.target.value)}
          />
        </Section>

        {/* SEÇÃO: CONDIÇÃO DE PAGAMENTO & COBRANÇA CAD (CARTA BORDERÔ) */}
        <Section title="Condição de Pagamento & Cobrança Bancária (Carta Borderô)">
          <div className="col-span-full space-y-4">
            
            {/* SELEÇÃO DO TIPO DE NEGOCIAÇÃO: SEM PRO-FORMA VS COM PRO-FORMA */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1.5">
                Modalidade de Pagamento / Pro-forma
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleProforma(false)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    !temProforma
                      ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500/80 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      Sem Pro-forma (100% CAD à vista)
                    </span>
                    {!temProforma && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    100% liquidação contra apresentação de documentos no banco do comprador (prazo padrão: 20 dias).
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleProforma(true)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    temProforma
                      ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500/80 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      Com Pro-forma (Adiantamento + Saldo CAD)
                    </span>
                    {temProforma && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Adiantamento no carregamento (ex: 10%) e saldo em CAD no banco (prazo padrão: 10 dias).
                  </span>
                </button>
              </div>

              <input type="hidden" name="temProforma" value={temProforma ? 'sim' : 'nao'} />
            </div>

            {/* PARÂMETROS DE LIQUIDAÇÃO E MULTA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Prazo de Liquidação (dias)
                </label>
                <input
                  type="number"
                  name="diasLiquidacao"
                  value={diasLiquidacao}
                  onChange={(e) => setDiasLiquidacao(e.target.value)}
                  className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold focus:border-blue-500 outline-none"
                  placeholder={temProforma ? '10' : '20'}
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Padrão: {temProforma ? '10 dias' : '20 dias'}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Multa por Atraso (%)
                </label>
                <input
                  type="number"
                  name="multaAtrasoPerc"
                  value={multaAtrasoPerc}
                  onChange={(e) => setMultaAtrasoPerc(e.target.value)}
                  className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold focus:border-blue-500 outline-none"
                  placeholder="5"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Padrão: 5% sobre a invoice
                </span>
              </div>

              {temProforma && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    % Adiantamento
                  </label>
                  <input
                    type="number"
                    name="adiantamentoPerc"
                    value={adiantamentoPerc}
                    onChange={(e) => setAdiantamentoPerc(e.target.value)}
                    className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold focus:border-blue-500 outline-none"
                    placeholder="10"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Padrão: 10% no carregamento
                  </span>
                </div>
              )}
            </div>

            {/* DADOS BANCÁRIOS OPCIONAIS */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setMostrarDadosBanco(!mostrarDadosBanco)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>
                  {mostrarDadosBanco
                    ? '▲ Ocultar dados do Banco do Comprador'
                    : '▼ Deseja preencher agora os dados do Banco do Comprador? (Opcional)'}
                </span>
              </button>

              {mostrarDadosBanco && (
                <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Nome do Banco de Destino
                      </label>
                      <button
                        type="button"
                        onClick={() => handleBuscarDadosBanco()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all shadow-2xs cursor-pointer active:scale-98"
                        title="Buscar endereço e código SWIFT automaticamente"
                      >
                        <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Buscar dados do banco</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        name="bancoNome"
                        value={bancoNome}
                        onChange={(e) => {
                          setBancoNome(e.target.value);
                          if (feedbackBanco) setFeedbackBanco(null);
                        }}
                        placeholder="Ex: TAMILNAD MERCANTILE BANK / STATE BANK OF INDIA / HDFC"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs uppercase focus:border-blue-500 outline-none"
                      />
                    </div>

                    {feedbackBanco && (
                      <div className="mt-1.5 flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 animate-fadeIn">
                        <span className="flex items-center gap-1 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {feedbackBanco}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFeedbackBanco(null)}
                          className="text-emerald-600 hover:text-emerald-800 text-xs font-bold ml-2 px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {mostrarModalBancos && (
                      <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-xl shadow-lg animate-fadeIn z-10 relative">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span>Diretório Bancário ({bancosSugeridos.length} opções disponíveis)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMostrarModalBancos(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                          {bancosSugeridos.map((banco) => (
                            <button
                              key={banco.id}
                              type="button"
                              onClick={() => handleSelecionarBanco(banco)}
                              className="w-full text-left p-2 rounded-lg hover:bg-blue-50/70 dark:hover:bg-slate-800/80 transition-colors flex items-start justify-between gap-2 group cursor-pointer"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                    {banco.nome}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-normal shrink-0">
                                    • {banco.cidade}, {banco.pais}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {banco.endereco}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400">
                                  {banco.swift}
                                </span>
                                <span className="text-[9px] text-blue-600 dark:text-blue-400 block font-semibold mt-0.5">
                                  Preencher ↵
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Endereço da Agência do Banco
                    </label>
                    <input
                      type="text"
                      name="bancoEndereco"
                      value={bancoEndereco}
                      onChange={(e) => setBancoEndereco(e.target.value)}
                      placeholder="Ex: 20, GOLAWAR AGRAHARAM ROAD, CHENNAI - 600021, INDIA"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Conta Corrente / Account No.
                    </label>
                    <input
                      type="text"
                      name="bancoConta"
                      value={bancoConta}
                      onChange={(e) => setBancoConta(e.target.value)}
                      placeholder="Ex: 008700150950284"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        SWIFT / BIC
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        {swiftLen > 0 ? `${swiftLen}/11` : '8 ou 11 alfanuméricos'}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        name="bancoSwift"
                        value={bancoSwift}
                        maxLength={11}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        onChange={(e) => setBancoSwift(maskSwift(e.target.value))}
                        onInput={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.value = maskSwift(target.value);
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const text = e.clipboardData.getData('text');
                          setBancoSwift(maskSwift(text));
                        }}
                        placeholder="Ex: TMBLINBB ou TMBLINBB008"
                        className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3 py-2 text-xs font-mono uppercase outline-none transition-all pr-8 ${
                          isSwiftCompleto
                            ? 'border-emerald-500 focus:border-emerald-500 ring-1 ring-emerald-500/30'
                            : isSwiftInvalido
                            ? 'border-amber-500 focus:border-amber-500 ring-1 ring-amber-500/30'
                            : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                        }`}
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        {isSwiftCompleto && <Check className="w-4 h-4 text-emerald-500" />}
                        {isSwiftInvalido && <AlertCircle className="w-4 h-4 text-amber-500" />}
                      </div>
                    </div>

                    {isSwiftCompleto && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                        ✓ Padrão SWIFT internacional válido ({swiftLen} caracteres).
                      </span>
                    )}
                    {isSwiftInvalido && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-1">
                        ⚠ O padrão SWIFT requer 8 ou 11 caracteres (faltam {swiftLen < 8 ? 8 - swiftLen : 11 - swiftLen} caractere{swiftLen < 8 && (8 - swiftLen) === 1 ? '' : 's'}).
                      </span>
                    )}
                    {!bancoSwift && (
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Padrão ISO 9362: 8 ou 11 dígitos alfanuméricos.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </Section>

        {/* INFORMAÇÕES DE CARGA & CONTÊINERES */}
        <Section title="Informações de Carga & Contêineres">
          <Field label="Local de estufagem / REDEX" name="localEstufagem" placeholder="Ex: CRAGEA" required />
          
          <Field
            label="Volume (KG)"
            name="volumeKg"
            type="number"
            placeholder="Ex: 250687"
            required
            value={volumeKg}
            onChange={(e) => setVolumeKg(e.target.value)}
          />

          <Field
            label="Contêineres (quantidade)"
            name="containerQtd"
            type="number"
            placeholder="Ex: 10"
            required
            value={containerQtd}
            onChange={(e) => setContainerQtd(e.target.value)}
          />

          <Field label="Tipo de contêiner" name="containerTipo" defaultValue="20' DRY" readOnly required />

          <SelectField
            label="Tipo de embalagem"
            name="embalagemTipo"
            defaultValue={embalagemTipo}
            required
            options={EMBALAGENS_OPTIONS}
            onChange={(e) => setEmbalagemTipo(e.target.value)}
          />

          <Field
            label="Quantidade por contêiner (sacas)"
            name="sacasPorContainer"
            type="number"
            placeholder="Ex: 700"
            required
            value={sacasPorContainer}
            onChange={(e) => setSacasPorContainer(e.target.value)}
            helperText={
              calculoExplicacao ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded block">
                  ✓ {calculoExplicacao}
                </span>
              ) : (
                <span className="text-[11px] text-gray-500">
                  Preencha o Volume (KG) e a Quantidade de Contêineres para cálculo automático.
                </span>
              )
            }
          />
          
          <SelectField
            label="Fumigação necessária?"
            name="fumigacaoNecessaria"
            required
            options={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]}
            onChange={(e: any) => setFumigacao(e.target.value)}
          />
          
          {fumigacao === 'sim' && (
            <>
              <SelectField
                label="Tipo de fumigação"
                name="fumigacaoTipo"
                defaultValue="Brometo"
                required
                options={TIPOS_FUMIGACAO}
              />
              <Field label="Tempo de fumigação (horas)" name="fumigacaoTempoHoras" defaultValue="24" required />
            </>
          )}
          
          <SelectField
            label="Necessita etiqueta?"
            name="necessitaEtiqueta"
            required
            options={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]}
          />
          
          <Field label="Armador" name="armador" placeholder="Ex: ONE, MSC, Maersk..." required />
          <Field label="Nº Booking (se já emitido)" name="bookingNumero" placeholder="Ex: SAOG34105800" />
          <Field label="Navio (se já designado)" name="navio" placeholder="Ex: MSC ARIES" />
          <Field label="Deadline de Embarque / Carga (se já definido)" name="deadlineCarga" type="date" />
        </Section>

        {/* CARACTERÍSTICAS & PLANEJAMENTO INICIAL */}
        <Section title="Características & Planejamento Inicial">
          <SelectField
            label="Produto"
            name="produto"
            required
            options={PRODUTOS_FEIJAO}
            placeholder="Selecione o produto"
          />
          <Field label="NCM" name="ncm" placeholder="Ex: 0713.31.90" defaultValue="0713.31.90" required />
          <Field label="Estufagem — início (se já previsto)" name="estufagemInicio" type="date" />
          <Field label="Estufagem — fim (se já previsto)" name="estufagemFim" type="date" />
          <SelectField
            label="MAPA na sequência?"
            name="mapaNaSequencia"
            options={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]}
            defaultValue="sim"
          />
        </Section>

        <div className="pt-2">
          <button
            type="submit"
            className="bg-[#1a365d] hover:bg-blue-900 text-white px-8 py-3 rounded-xl font-black text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            Lançar Negociação
          </button>
        </div>
      </form>

      {/* MODAL DE CADASTRO RÁPIDO DE IMPORTADOR / BUYER */}
      <CentralCadastrosModal
        isOpen={modalCadastroAberto}
        onClose={() => setModalCadastroAberto(false)}
        tipoInicial={modalTipoInicial}
        onEntidadeSelecionada={handleEntidadeCriadaNoModal}
        modoSelecao={true}
      />
    </div>
  );
}
