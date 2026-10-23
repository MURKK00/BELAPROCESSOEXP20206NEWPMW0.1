'use client';

import { useState, useEffect } from 'react';
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
  X
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

export default function NovaNegociacaoPage() {
  const router = useRouter();

  // Estado para controlar se o comprador é diferente do importador
  const [compradorDiferente, setCompradorDiferente] = useState(false);
  const [clienteFinal, setClienteFinal] = useState('');

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
  
  // Dados bancários opcionais na criação (podem ser preenchidos ou finalizados na aba Importador)
  const [mostrarDadosBanco, setMostrarDadosBanco] = useState<boolean>(false);
  const [bancoNome, setBancoNome] = useState<string>('');
  const [bancoEndereco, setBancoEndereco] = useState<string>('');
  const [bancoConta, setBancoConta] = useState<string>('');
  const [bancoSwift, setBancoSwift] = useState<string>('');

  // Máscara e sanitização para o código SWIFT (apenas letras maiúsculas e números, máx 11 caracteres)
  const maskSwift = (val: string) => val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);

  // Validação em tempo real do SWIFT/BIC (ISO 9362: 8 ou 11 caracteres alfanuméricos)
  const swiftTrim = bancoSwift.trim().toUpperCase();
  const swiftLen = swiftTrim.length;
  const isSwiftFormatoValido = /^[A-Z0-9]+$/.test(swiftTrim);
  const isSwiftCompleto = (swiftLen === 8 || swiftLen === 11) && isSwiftFormatoValido;
  const isSwiftInvalido = swiftLen > 0 && !isSwiftCompleto;

  // Estados para busca automática no diretório bancário
  const [bancosSugeridos, setBancosSugeridos] = useState<BancoInfo[]>([]);
  const [mostrarModalBancos, setMostrarModalBancos] = useState(false);
  const [feedbackBanco, setFeedbackBanco] = useState<string | null>(null);

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
      // Se não encontrou ou termo vazio, exibe sugestões de bancos populares de comércio exterior
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

  // Quando alterna pro-forma, ajusta os dias de liquidação padrão (20 para sem pro-forma, 10 para com pro-forma)
  const handleToggleProforma = (comProforma: boolean) => {
    setTemProforma(comProforma);
    if (comProforma) {
      setDiasLiquidacao('10');
    } else {
      setDiasLiquidacao('20');
    }
  };

  // Efeito para cálculo automático: volumeKg / containerQtd / pesoSaca
  useEffect(() => {
    const vol = parseFloat(volumeKg);
    const qtd = parseInt(containerQtd, 10);

    if (vol > 0 && qtd > 0) {
      // Extrai o peso da saca da embalagem (ex: 30 de "Sacaria 30kg", default 30)
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
      {/* CABEÇALHO COM SETINHA DE VOLTAR */}
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
          <Field
            label="Cliente final"
            name="clienteFinal"
            placeholder="Ex: AKSHAR AGRI INDIA PRIVATE LIMITED"
            required
            value={clienteFinal}
            onChange={(e) => setClienteFinal(e.target.value)}
          />
          <Field label="Trader / Intermédio" name="traderIntermedio" placeholder="Ex: AgriTrading Partners SA" />

          {/* PERGUNTA: O COMPRADOR (BUYER) É DIFERENTE DO IMPORTADOR (CONSIGNEE)? */}
          <div className={`col-span-full rounded-xl border p-3.5 sm:p-4 transition-all duration-300 ease-in-out ${
            compradorDiferente 
              ? 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-400/80 dark:border-orange-600/80 ring-2 ring-orange-500/15 shadow-sm' 
              : 'bg-slate-50/80 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  compradorDiferente 
                    ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/30' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block tracking-tight">
                    Comprador (Buyer) diferente do Importador (Consignee)
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Ative se o faturamento for para trading ou empresa distinta da que recebe no destino.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[11px] font-bold transition-colors ${
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

          <IncotermSelectField defaultValue="CFR" required />
          
          {/* Porto de Origem como lista suspensa */}
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

        {/* NOVA SEÇÃO: CONDIÇÃO DE PAGAMENTO & COBRANÇA CAD (CARTA BORDERÔ) */}
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

              {/* INPUTS OCULTOS / ENVIADOS NO FORMDATA */}
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

            {/* OPÇÃO DE INFORMAR DADOS BANCÁRIOS DO COMPRADOR AGORA OU DEPOIS */}
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
                        title="Buscar endereço e código SWIFT automaticamente com base no nome do banco"
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

                    {/* Feedback inline caso preenchido */}
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

                    {/* Dropdown de seleção de bancos sugeridos / encontrados */}
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

                    {/* Feedback em tempo real */}
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

        <Section title="Informações de Carga & Contêineres">
          <Field label="Local de estufagem / REDEX" name="localEstufagem" placeholder="Ex: CRAGEA" required />
          
          {/* Volume Contratado (KG) */}
          <Field
            label="Volume (KG)"
            name="volumeKg"
            type="number"
            placeholder="Ex: 250687"
            required
            value={volumeKg}
            onChange={(e) => setVolumeKg(e.target.value)}
          />

          {/* Quantidade de Contêineres */}
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

          {/* Tipo de Embalagem */}
          <SelectField
            label="Tipo de embalagem"
            name="embalagemTipo"
            defaultValue={embalagemTipo}
            required
            options={EMBALAGENS_OPTIONS}
            onChange={(e) => setEmbalagemTipo(e.target.value)}
          />

          {/* Quantidade por Contêiner (Calculado automaticamente, mas editável) */}
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
          
          {/* Só mostra esses campos se a fumigação for SIM */}
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
            className="bg-[#1a365d] hover:bg-blue-900 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-2xs cursor-pointer"
          >
            Lançar Negociação
          </button>
        </div>
      </form>
    </div>
  );
}
