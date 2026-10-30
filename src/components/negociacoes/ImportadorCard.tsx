"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { atualizarImportadorAction, toggleCompradorDiferenteAction } from '@/server/actions/importadorActions';
import type { Processo } from '@prisma/client';
import { parseCompradorInfo } from '@/lib/compradorHelper';
import { 
  Building2, 
  MapPin, 
  FileText, 
  Mail, 
  Phone, 
  Check, 
  Globe2, 
  Info,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Landmark,
  FileSpreadsheet,
  Search,
  Sparkles,
  X,
  Plus
} from 'lucide-react';
import { buscarBancos, DIRETORIO_BANCOS, type BancoInfo } from '@/lib/bancosDiretorio';
import { CentralCadastrosModal } from '@/components/cadastros/CentralCadastrosModal';

interface ImportadorCardProps {
  processo: Processo;
}

export function ImportadorCard({ processo }: ImportadorCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [salvandoToggle, setSalvandoToggle] = useState(false);
  const [toggleMsg, setToggleMsg] = useState<string | null>(null);

  // Vínculo com a Central de Cadastros de Importadores / Buyers
  const [selectedImportadorId, setSelectedImportadorId] = useState<string>((processo as any).importadorId || '');
  const [listaImportadores, setListaImportadores] = useState<any[]>([]);
  const [modalImportadorAberto, setModalImportadorAberto] = useState(false);
  const [sincronizarCatalogo, setSincronizarCatalogo] = useState(true);

  // Extrai informações salvas de Comprador e Banco de Destino
  const { complementoLimpo, comprador, bancoComprador } = parseCompradorInfo(processo.complementoBuyer);

  // Estados dos campos do Importador / Consignee
  const [clienteFinalVal, setClienteFinalVal] = useState(processo.clienteFinal || '');
  const [enderecoBuyerVal, setEnderecoBuyerVal] = useState(processo.enderecoBuyer || '');
  const [complementoBuyerVal, setComplementoBuyerVal] = useState(complementoLimpo || '');
  const [cidadeBuyerVal, setCidadeBuyerVal] = useState(processo.cidadeBuyer || '');
  const [paisBuyerVal, setPaisBuyerVal] = useState(processo.paisBuyer || '');
  const [iecBuyerVal, setIecBuyerVal] = useState(processo.iecBuyer || '');
  const [fassaiBuyerVal, setFassaiBuyerVal] = useState(processo.fassaiBuyer || '');
  const [panBuyerVal, setPanBuyerVal] = useState(processo.panBuyer || '');
  const [gstBuyerVal, setGstBuyerVal] = useState(processo.gstBuyer || '');
  const [emailBuyerVal, setEmailBuyerVal] = useState(processo.emailBuyer || '');
  const [telefoneBuyerVal, setTelefoneBuyerVal] = useState(processo.telefoneBuyer || '');

  // Controle se o comprador é diferente do importador
  const [compradorDiferente, setCompradorDiferente] = useState<boolean>(comprador.diferente);

  // Estado dos campos do Comprador (Buyer) quando diferente
  const [compradorNome, setCompradorNome] = useState(comprador.nome || '');
  const [compradorEndereco, setCompradorEndereco] = useState(comprador.endereco || '');
  const [compradorComplemento, setCompradorComplemento] = useState(comprador.complemento || '');
  const [compradorCidade, setCompradorCidade] = useState(comprador.cidade || '');
  const [compradorPais, setCompradorPais] = useState(comprador.pais || '');
  const [compradorTaxId, setCompradorTaxId] = useState(comprador.taxId || '');
  const [compradorEmail, setCompradorEmail] = useState(comprador.email || '');
  const [compradorTelefone, setCompradorTelefone] = useState(comprador.telefone || '');

  useEffect(() => {
    carregarImportadores();
  }, []);

  async function carregarImportadores() {
    try {
      const res = await fetch('/api/cadastros');
      if (res.ok) {
        const data = await res.json();
        const apenasInternacionais = (Array.isArray(data) ? data : []).filter(
          (e: any) => e.tipo === 'IMPORTADOR' || e.tipo === 'BUYER'
        );
        setListaImportadores(apenasInternacionais);
      }
    } catch (e) {
      console.warn('Erro ao carregar lista de importadores:', e);
    }
  }

  function handleSelecionarImportador(entidadeId: string) {
    setSelectedImportadorId(entidadeId);
    const ent = listaImportadores.find((item) => item.id === entidadeId);
    if (!ent) return;

    setClienteFinalVal(ent.razaoSocial);
    setImportadorNome(ent.razaoSocial);
    if (ent.endereco) setEnderecoBuyerVal(ent.endereco);
    if (ent.complemento) setComplementoBuyerVal(ent.complemento);
    if (ent.cidade) setCidadeBuyerVal(ent.cidade);
    if (ent.pais) setPaisBuyerVal(ent.pais);
    if (ent.iecTaxId) setIecBuyerVal(ent.iecTaxId);
    if (ent.fassaiId) setFassaiBuyerVal(ent.fassaiId);
    if (ent.panId) setPanBuyerVal(ent.panId);
    if (ent.gstId) setGstBuyerVal(ent.gstId);
    if (ent.email) setEmailBuyerVal(ent.email);
    if (ent.telefone) setTelefoneBuyerVal(ent.telefone);

    if (ent.bancoNome) setBancoNome(ent.bancoNome);
    if (ent.bancoEndereco) setBancoEndereco(ent.bancoEndereco);
    if (ent.bancoConta) setBancoConta(ent.bancoConta);
    if (ent.bancoSwift) setBancoSwift(ent.bancoSwift);
    if (ent.bancoEmail) setBancoEmail(ent.bancoEmail);
    if (ent.bancoTelefone) setBancoTelefone(ent.bancoTelefone);

    if (ent.tipo === 'BUYER' && !compradorDiferente) {
      setCompradorDiferente(true);
      setCompradorNome(ent.razaoSocial);
      if (ent.endereco) setCompradorEndereco(ent.endereco);
      if (ent.cidade) setCompradorCidade(ent.cidade);
      if (ent.pais) setCompradorPais(ent.pais);
      if (ent.iecTaxId) setCompradorTaxId(ent.iecTaxId);
      if (ent.email) setCompradorEmail(ent.email);
      if (ent.telefone) setCompradorTelefone(ent.telefone);
    }
  }

  function handleImportadorCriadoModal(novaEnt: any) {
    carregarImportadores().then(() => {
      handleSelecionarImportador(novaEnt.id);
    });
  }

  // Estado dos Dados do Banco de Destino (Comprador)
  const [bancoNome, setBancoNome] = useState(bancoComprador.nomeBanco || '');
  const [bancoEndereco, setBancoEndereco] = useState(bancoComprador.enderecoBanco || '');
  const [bancoConta, setBancoConta] = useState(bancoComprador.conta || '');
  const [bancoSwift, setBancoSwift] = useState(bancoComprador.swift || '');
  const [bancoTelefone, setBancoTelefone] = useState(bancoComprador.telefone || '');
  const [bancoEmail, setBancoEmail] = useState(bancoComprador.email || '');

  // Máscara e sanitização para o código SWIFT (apenas letras maiúsculas e números, máx 11 caracteres)
  const maskSwift = (val: string) => (val || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);

  // Validação em tempo real do SWIFT/BIC (ISO 9362: 8 ou 11 caracteres alfanuméricos)
  const swiftTrim = (bancoSwift || '').trim().toUpperCase();
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

  // Regras de Cobrança / Carta Borderô
  const [temProforma, setTemProforma] = useState<boolean>(Boolean(bancoComprador.temProforma));
  const [diasLiquidacao, setDiasLiquidacao] = useState<number>(bancoComprador.diasLiquidacao ?? (bancoComprador.temProforma ? 10 : 20));
  const [multaAtrasoPerc, setMultaAtrasoPerc] = useState<number>(bancoComprador.multaAtrasoPerc ?? 5);
  const [adiantamentoPerc, setAdiantamentoPerc] = useState<number>(bancoComprador.adiantamentoPerc ?? 10);

  // Nome do Importador (se diferente, pode ser editável)
  const [importadorNome, setImportadorNome] = useState(comprador.importadorNome || processo.clienteFinal);

  // Alterna e salva imediatamente no banco ao clicar no switch
  async function handleToggleDiferente(novoValor: boolean) {
    setCompradorDiferente(novoValor);
    setSalvandoToggle(true);
    try {
      await toggleCompradorDiferenteAction(processo.id, novoValor, {
        nome: compradorNome || processo.clienteFinal,
        importadorNome: importadorNome || processo.clienteFinal,
        endereco: compradorEndereco,
        complemento: compradorComplemento,
        cidade: compradorCidade,
        pais: compradorPais,
        taxId: compradorTaxId,
        email: compradorEmail,
        telefone: compradorTelefone,
      });
      setToggleMsg(novoValor ? 'Opção salva: Comprador e Importador separados' : 'Opção salva: Mesma empresa');
      router.refresh();
      setTimeout(() => setToggleMsg(null), 3500);
    } catch (err) {
      console.error('Erro ao salvar opção:', err);
      alert('Erro ao salvar alteração. Tente novamente.');
    } finally {
      setSalvandoToggle(false);
    }
  }

  // Perfil / Região de destino para pré-configurar rótulos e placeholders internacionais
  const destinoUpper = ((processo.portoDestino || '') + ' ' + (processo.paisBuyer || '')).toUpperCase();
  const perfilInicial = destinoUpper.includes('INDIA') || destinoUpper.includes('MUNDRA') || destinoUpper.includes('NHAVA') || destinoUpper.includes('CHENNAI') || destinoUpper.includes('KOLKATA')
    ? 'INDIA'
    : destinoUpper.includes('ROTTERDAM') || destinoUpper.includes('HAMBURG') || destinoUpper.includes('ANTWERP') || destinoUpper.includes('VALENCIA') || destinoUpper.includes('GENOA') || destinoUpper.includes('EUROPA')
    ? 'EUROPA'
    : destinoUpper.includes('CHINA') || destinoUpper.includes('QINGDAO') || destinoUpper.includes('SHANGHAI') || destinoUpper.includes('NINGBO') || destinoUpper.includes('VIETNAM') || destinoUpper.includes('TURKEY')
    ? 'ASIA_ORIENTAL'
    : 'GLOBAL';

  const [perfilRegiao, setPerfilRegiao] = useState<'GLOBAL' | 'INDIA' | 'EUROPA' | 'ASIA_ORIENTAL'>(perfilInicial);

  // Checkboxes "Não aplicável / Não informado" para o Importador
  const [naoTemComplemento, setNaoTemComplemento] = useState(
    complementoLimpo === 'N/A' || complementoLimpo === 'NÃO APLICÁVEL'
  );
  const [naoTemSecundario, setNaoTemSecundario] = useState(
    processo.panBuyer === 'N/A' || processo.panBuyer === 'NÃO APLICÁVEL'
  );
  const [naoTemSanitaria, setNaoTemSanitaria] = useState(
    processo.fassaiBuyer === 'N/A' || processo.fassaiBuyer === 'NÃO APLICÁVEL'
  );
  const [naoTemEstadual, setNaoTemEstadual] = useState(
    processo.gstBuyer === 'N/A' || processo.gstBuyer === 'NÃO APLICÁVEL'
  );
  const [naoTemTelefone, setNaoTemTelefone] = useState(
    processo.telefoneBuyer === 'N/A' || processo.telefoneBuyer === 'NÃO APLICÁVEL'
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSucesso(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('processoId', processo.id);
    formData.append('compradorDiferente', compradorDiferente ? 'true' : 'false');

    // Se comprador diferente estiver ativo, anexa os dados do comprador
    if (compradorDiferente) {
      formData.set('importadorNome', importadorNome);
      formData.set('compradorNome', compradorNome);
      formData.set('compradorEndereco', compradorEndereco);
      formData.set('compradorComplemento', compradorComplemento);
      formData.set('compradorCidade', compradorCidade);
      formData.set('compradorPais', compradorPais);
      formData.set('compradorTaxId', compradorTaxId);
      formData.set('compradorEmail', compradorEmail);
      formData.set('compradorTelefone', compradorTelefone);
    }

    // Ajusta os valores caso os checkboxes estejam marcados
    if (naoTemComplemento) {
      formData.set('complementoBuyer', 'N/A');
    }
    if (naoTemSecundario) {
      formData.set('panBuyer', 'N/A');
    }
    if (naoTemSanitaria) {
      formData.set('fassaiBuyer', 'N/A');
    }
    if (naoTemEstadual) {
      formData.set('gstBuyer', 'N/A');
    }
    if (naoTemTelefone) {
      formData.set('telefoneBuyer', 'N/A');
    }
    
    try {
      await atualizarImportadorAction(formData);
      router.refresh();
      setSucesso(true);
      setTimeout(() => setSucesso(false), 4000);
    } catch (error) {
      alert('❌ Erro ao salvar os dados do importador/comprador.');
    } finally {
      setLoading(false);
    }
  }

  // Definições contextuais de rótulos por região para orientar o operador
  const labelsRegiao = {
    GLOBAL: {
      titulo: 'Padrão Internacional Global',
      docPrincipal: 'Registro Aduaneiro / Tax ID / EORI',
      docPrincipalHint: 'Código oficial de importação do país de destino (Ex: Tax ID, USCI, EORI, RFC, IEC).',
      docPrincipalPlaceholder: 'Ex: TAX ID / VAT / REGISTRO ADUANEIRO',
      docSecundario: 'CNPJ Local / Tax ID Corporativo (PAN)',
      docSecundarioHint: 'Número de cadastro fiscal da empresa perante o fisco federal do país.',
      docSecundarioPlaceholder: 'Ex: ID Fiscal da Empresa / PAN',
      docSanitario: 'Licença Sanitária / FDA / FSSAI / Reg. Alimentos',
      docSanitarioHint: 'Licença fitossanitária ou autorização do Ministério da Agricultura/Saúde do destino.',
      docSanitarioPlaceholder: 'Ex: Licença Sanitária / FSSAI / FDA',
      docEstadual: 'Inscrição Estadual / IVA / VAT / GSTIN',
      docEstadualHint: 'Registro de imposto sobre consumo/estadual do comprador.',
      docEstadualPlaceholder: 'Ex: VAT / GST / Inscrição Estadual',
    },
    INDIA: {
      titulo: 'Índia (Customs & ICEGATE)',
      docPrincipal: 'IEC Code (Import Export Code - DGFT)',
      docPrincipalHint: 'Código emitido pela DGFT indiana (10 dígitos). Fundamental para desembaraço.',
      docPrincipalPlaceholder: 'Ex: 0588001234 / ABOFA6762G',
      docSecundario: 'PAN NO. (Permanent Account Number)',
      docSecundarioHint: 'Identificador fiscal federal da Índia (10 dígitos alfanuméricos).',
      docSecundarioPlaceholder: 'Ex: AAVCA0504D',
      docSanitario: 'FSSAI License (Food Safety)',
      docSanitarioHint: 'Licença de importação de grãos/alimentos (14 dígitos).',
      docSanitarioPlaceholder: 'Ex: 10019022009383',
      docEstadual: 'GSTIN NO. (Goods and Services Tax)',
      docEstadualHint: 'Inscrição de imposto estadual indiano (15 dígitos com código de estado).',
      docEstadualPlaceholder: 'Ex: 24AAVCA0504D1Z4',
    },
    EUROPA: {
      titulo: 'União Europeia (UE / UK)',
      docPrincipal: 'EORI Number (Economic Operators Reg.)',
      docPrincipalHint: 'Número EORI para trâmites alfandegários nos portos da União Europeia.',
      docPrincipalPlaceholder: 'Ex: NL123456789 / DE987654321',
      docSecundario: 'VAT Number (Tax / NIF Europeu)',
      docSecundarioHint: 'Número de identificação fiscal para IVA intracomunitário ou nacional.',
      docSecundarioPlaceholder: 'Ex: NL801234567B01',
      docSanitario: 'Reg. Fitossanitário TRACES / EU Food Reg.',
      docSanitarioHint: 'Registro do importador no sistema TRACES-NT / Saúde Vegetal europeia.',
      docSanitarioPlaceholder: 'Ex: TRACES / EU Health Reg',
      docEstadual: 'Registro Comercial / Local Tax ID',
      docEstadualHint: 'Câmara de comércio ou registro regional.',
      docEstadualPlaceholder: 'Ex: KvK (Holanda) / HRB (Alemanha)',
    },
    ASIA_ORIENTAL: {
      titulo: 'Ásia & Oriente Médio (China, Vietnã, Turquia, Emirados)',
      docPrincipal: 'USCI / Tax ID Aduaneiro / CR Code',
      docPrincipalHint: 'Código Unificado de Crédito Social (China - 18 dígitos) ou Tax ID nacional.',
      docPrincipalPlaceholder: 'Ex: 91110000XXXXXXXXXX / CR No.',
      docSecundario: 'Código Aduaneiro / Custom Reg. Number',
      docSecundarioHint: 'Registro alfandegário de 10 dígitos (GACC China / Customs Coreano).',
      docSecundarioPlaceholder: 'Ex: 3101980000 (GACC 10 dígitos)',
      docSanitario: 'GACC Single Window / Reg. Fito Destino',
      docSanitarioHint: 'Registro sanitário no portal aduaneiro de importação de grãos.',
      docSanitarioPlaceholder: 'Ex: GACC Import Permit / Cert Fito',
      docEstadual: 'Commercial License / VAT ID',
      docEstadualHint: 'Alvará comercial ou identificador tributário.',
      docEstadualPlaceholder: 'Ex: Trade License / VAT ID',
    },
  }[perfilRegiao];

  return (
    <div className="bg-slate-50/40 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xs space-y-6">
      
      {/* CABEÇALHO GLOBAL UNIVERSAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {compradorDiferente 
                ? 'Identificação: Importador (Consignee) & Comprador (Buyer)' 
                : 'Dados do Importador (Buyer / Consignee)'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Padrão internacional para emissão automática do <strong>Draft BL, Certificado Fitossanitário e Fatura Comercial</strong>.
          </p>
        </div>

        {sucesso && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn shrink-0">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>Dados salvos com sucesso!</span>
          </div>
        )}
      </div>

      {/* BOX DE SEPARAÇÃO: COMPRADOR É DIFERENTE DO IMPORTADOR? */}
      <div className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-300 ease-in-out ${
        compradorDiferente 
          ? 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-400/80 dark:border-orange-600/80 ring-2 ring-orange-500/15 shadow-sm' 
          : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${
              compradorDiferente 
                ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/30' 
                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Comprador (Buyer) diferente do Importador (Consignee)
                </span>
                {salvandoToggle && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold animate-pulse">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Salvando...
                  </span>
                )}
                {toggleMsg && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold animate-fadeIn">
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                    {toggleMsg}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Ative se o faturamento comercial for para trading ou entidade distinta da que recebe a carga no destino.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <a
              href={`/instrucao-embarque/${processo.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 font-medium transition-colors"
              title="Abrir a Instrução de Embarque em nova aba para conferência"
            >
              <span>Ver Instrução</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold transition-colors ${
                compradorDiferente 
                  ? 'text-orange-600 dark:text-orange-400' 
                  : 'text-slate-400'
              }`}>
                {compradorDiferente ? 'Sim' : 'Não'}
              </span>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={compradorDiferente}
                  disabled={salvandoToggle}
                  onChange={(e) => handleToggleDiferente(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full transition-all duration-300 ease-in-out p-0.5 relative peer-focus:outline-none ${
                  compradorDiferente ? 'bg-orange-500 shadow-sm shadow-orange-500/40' : 'bg-slate-300 dark:bg-slate-700'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                    compradorDiferente ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* AVISO DE CADASTRO PENDENTE QUANDO COMPRADOR DIFERENTE E DADOS AINDA NÃO PREENCHIDOS */}
      {compradorDiferente && !compradorNome && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs shadow-2xs animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-sm text-amber-900 dark:text-amber-300">
              Comprador e Importador separados: preencha os dados de cada entidade
            </span>
            <span className="text-[11px] text-amber-800 dark:text-amber-400/90 block">
              Preencha os blocos abaixo para garantir a conformidade documental entre a fatura e o Bill of Lading (BL).
            </span>
          </div>
        </div>
      )}

      {/* SELETOR DE PRESET / CONTEXTO REGIONAL DO IMPORTADOR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <Globe2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
              Regras Aduaneiras do Destino: {labelsRegiao.titulo}
            </span>
            <span className="text-[11px] text-slate-400 block truncate">
              Exemplos e máscaras adaptados para {processo.portoDestino || 'Porto de Destino'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          {(
            [
              { id: 'GLOBAL', label: 'Universal' },
              { id: 'INDIA', label: 'Índia' },
              { id: 'EUROPA', label: 'Europa' },
              { id: 'ASIA_ORIENTAL', label: 'Ásia / Outros' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPerfilRegiao(item.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                perfilRegiao === item.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="compradorDiferente" value={compradorDiferente ? 'true' : 'false'} />
        <input type="hidden" name="importadorId" value={selectedImportadorId} />
        <input type="hidden" name="sincronizarCatalogo" value={sincronizarCatalogo ? 'true' : 'false'} />
        <input type="hidden" name="clienteFinal" value={clienteFinalVal} />

        {/* BARRA DE VÍNCULO RÁPIDO COM A CENTRAL DE CADASTROS */}
        <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 dark:border-purple-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                Vincular Importador / Buyer Cadastrado
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Selecione um parceiro internacional pré-cadastrado ou adicione um novo diretamente.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={selectedImportadorId}
              onChange={(e) => handleSelecionarImportador(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/30 outline-none max-w-xs font-semibold cursor-pointer"
            >
              <option value="">— Selecionar Parceiro da Base —</option>
              {listaImportadores.map((imp) => (
                <option key={imp.id} value={imp.id}>
                  {imp.razaoSocial} ({imp.pais || 'Exterior'})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setModalImportadorAberto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Importador</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CARD 1: DADOS DO IMPORTADOR (CONSIGNEE NO DESTINO) */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#f58220] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. Dados do Importador (Consignee no Porto de Destino)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Empresa titular no Bill of Lading (BL) e recebedora da carga no desembaraço aduaneiro.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
              Desembaraço Aduaneiro
            </span>
          </div>
          
          {/* RAZÃO SOCIAL DO IMPORTADOR */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Razão Social / Nome da Empresa (Consignee) <span className="text-red-500">*</span>
            </label>
            {compradorDiferente ? (
              <input 
                type="text" 
                name="importadorNome"
                required
                value={importadorNome}
                onChange={(e) => setImportadorNome(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder:text-slate-400 shadow-2xs" 
                placeholder="Ex: R S TRIVENI FOODS PVT LTD"
              />
            ) : (
              <div className="relative">
                <input 
                  type="text" 
                  name="clienteFinal"
                  value={clienteFinalVal}
                  onChange={(e) => {
                    setClienteFinalVal(e.target.value);
                    setImportadorNome(e.target.value);
                  }}
                  className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none shadow-2xs" 
                  title="Comprador e Importador unificados - editável"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  Unificado / Editável
                </span>
              </div>
            )}
            <span className="text-[11px] text-slate-400 mt-1 block">
              {compradorDiferente 
                ? 'Nome que constará no Bill of Lading (BL) e Certificado Fitossanitário.'
                : 'Nome registrado no processo. As alterações serão salvas diretamente na base de dados.'}
            </span>
          </div>

          {/* ENDEREÇO UNIVERSAL DO IMPORTADOR */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              <MapPin className="w-3.5 h-3.5 text-[#f58220]" />
              <span>Endereço de Entrega & Desembaraço</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Endereço Principal (Logradouro, Nº, Bairro/Distrito) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="enderecoBuyer" 
                  required
                  value={enderecoBuyerVal}
                  onChange={(e) => setEnderecoBuyerVal(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  placeholder="Ex: 123 Industrial Area, Phase 2, GIDC" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Complemento / Sala / Edifício
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={naoTemComplemento}
                      onChange={(e) => setNaoTemComplemento(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Sem complemento</span>
                  </label>
                </div>
                <input 
                  type="text" 
                  name="complementoBuyer" 
                  disabled={naoTemComplemento}
                  value={naoTemComplemento ? '' : complementoBuyerVal}
                  onChange={(e) => setComplementoBuyerVal(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all font-medium ${
                    naoTemComplemento 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' 
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15'
                  }`}
                  placeholder={naoTemComplemento ? 'Não aplicável (N/A)' : 'Ex: Suite 400 / Building B'} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cidade & Estado / Província <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="cidadeBuyer" 
                  required
                  value={cidadeBuyerVal}
                  onChange={(e) => setCidadeBuyerVal(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  placeholder="Ex: Gandhidham / Gujarat / Rotterdam" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  País & Código Postal (CEP / PIN / ZIP) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="paisBuyer" 
                  required
                  value={paisBuyerVal}
                  onChange={(e) => setPaisBuyerVal(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  placeholder="Ex: India, PIN 370201 / Netherlands, 3011" 
                />
              </div>
            </div>
          </div>

          {/* CÓDIGOS REGULATÓRIOS DO IMPORTADOR */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Identificadores Fiscais & Aduaneiros ({labelsRegiao.titulo})</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Ative &quot;N/A&quot; caso a empresa não possua o registro
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* 1. REGISTRO ADUANEIRO PRINCIPAL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {perfilRegiao === 'INDIA' ? 'IEC Code (Índia)' : perfilRegiao === 'EUROPA' ? 'EORI (Europa)' : 'Reg. Aduaneiro'}
                  </label>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded">
                    Principal
                  </span>
                </div>
                <input 
                  type="text" 
                  name="iecBuyer" 
                  value={iecBuyerVal}
                  onChange={(e) => setIecBuyerVal(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none uppercase transition-all shadow-2xs" 
                  placeholder={labelsRegiao.docPrincipalPlaceholder}
                  title={labelsRegiao.docPrincipalHint}
                />
              </div>

              {/* 2. REGISTRO FISCAL SECUNDÁRIO */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {perfilRegiao === 'INDIA' ? 'PAN NO. (Índia)' : perfilRegiao === 'EUROPA' ? 'VAT NO. (UE)' : 'Tax ID Corporativo'}
                  </label>
                  <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={naoTemSecundario}
                      onChange={(e) => setNaoTemSecundario(e.target.checked)}
                      className="w-3 h-3 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>N/A</span>
                  </label>
                </div>
                <input 
                  type="text" 
                  name="panBuyer" 
                  disabled={naoTemSecundario}
                  value={naoTemSecundario ? '' : panBuyerVal}
                  onChange={(e) => setPanBuyerVal(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-mono outline-none transition-all shadow-2xs ${
                    naoTemSecundario 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' 
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 font-semibold uppercase'
                  }`}
                  placeholder={naoTemSecundario ? 'Não aplicável (N/A)' : labelsRegiao.docSecundarioPlaceholder}
                  title={labelsRegiao.docSecundarioHint}
                />
              </div>

              {/* 3. LICENÇA SANITÁRIA / FITO */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {perfilRegiao === 'INDIA' ? 'FSSAI License' : 'Licença Sanitária / Fito'}
                  </label>
                  <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={naoTemSanitaria}
                      onChange={(e) => setNaoTemSanitaria(e.target.checked)}
                      className="w-3 h-3 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>N/A</span>
                  </label>
                </div>
                <input 
                  type="text" 
                  name="fassaiBuyer" 
                  disabled={naoTemSanitaria}
                  value={naoTemSanitaria ? '' : fassaiBuyerVal}
                  onChange={(e) => setFassaiBuyerVal(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-mono outline-none transition-all shadow-2xs ${
                    naoTemSanitaria 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' 
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 font-semibold'
                  }`}
                  placeholder={naoTemSanitaria ? 'Não aplicável (N/A)' : labelsRegiao.docSanitarioPlaceholder}
                  title={labelsRegiao.docSanitarioHint}
                />
              </div>

              {/* 4. INSCRIÇÃO ESTADUAL / IVA */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {perfilRegiao === 'INDIA' ? 'GSTIN NO. (Índia)' : 'Inscrição Estadual / IVA'}
                  </label>
                  <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={naoTemEstadual}
                      onChange={(e) => setNaoTemEstadual(e.target.checked)}
                      className="w-3 h-3 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>N/A</span>
                  </label>
                </div>
                <input 
                  type="text" 
                  name="gstBuyer" 
                  disabled={naoTemEstadual}
                  value={naoTemEstadual ? '' : gstBuyerVal}
                  onChange={(e) => setGstBuyerVal(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-mono outline-none transition-all shadow-2xs ${
                    naoTemEstadual 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' 
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 font-semibold uppercase'
                  }`}
                  placeholder={naoTemEstadual ? 'Não informado (N/A)' : labelsRegiao.docEstadualPlaceholder}
                  title={labelsRegiao.docEstadualHint}
                />
              </div>

            </div>
          </div>

          {/* CONTATOS DO IMPORTADOR */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Contatos Operacionais (Notice of Arrival / Chegada)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail do Importador <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  name="emailBuyer" 
                  required
                  value={emailBuyerVal}
                  onChange={(e) => setEmailBuyerVal(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  placeholder="import@company.com / clearance@broker.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Telefone do Importador
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={naoTemTelefone}
                      onChange={(e) => setNaoTemTelefone(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Sem telefone</span>
                  </label>
                </div>
                <input 
                  type="text" 
                  name="telefoneBuyer" 
                  disabled={naoTemTelefone}
                  value={naoTemTelefone ? '' : telefoneBuyerVal}
                  onChange={(e) => setTelefoneBuyerVal(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all font-medium ${
                    naoTemTelefone 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' 
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15'
                  }`}
                  placeholder={naoTemTelefone ? 'Não informado (N/A)' : '+91 98250 12345 / +31 10 123 4567'} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CARD 2: DADOS DO COMPRADOR COMERCIAL (BUYER) - SE DIFERENTE */}
        {/* ============================================================== */}
        {compradorDiferente && (
          <div className="bg-slate-50/70 dark:bg-slate-850/60 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-blue-100 dark:border-blue-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    2. Dados do Comprador Comercial (Buyer / Faturamento)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Entidade compradora ou trading contratante para fatura pro-forma e comercial.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-lg">
                Faturamento Comercial
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NOME / RAZÃO SOCIAL DO COMPRADOR */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Nome / Razão Social do Comprador Comercial (Buyer)
                </label>
                <input 
                  type="text" 
                  name="compradorNome"
                  value={compradorNome}
                  onChange={(e) => setCompradorNome(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-all placeholder:text-slate-400" 
                  placeholder="Ex: AGRI FORTUNE PTE LTD / COMMODITIES TRADING LLC"
                />
              </div>

              {/* ENDEREÇO COMERCIAL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Endereço Comercial da Empresa
                </label>
                <input 
                  type="text" 
                  name="compradorEndereco"
                  value={compradorEndereco}
                  onChange={(e) => setCompradorEndereco(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  placeholder="Ex: 10 Marina Boulevard, Tower 2 #28-00" 
                />
              </div>

              {/* COMPLEMENTO COMERCIAL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Complemento / Sala / Edifício
                </label>
                <input 
                  type="text" 
                  name="compradorComplemento"
                  value={compradorComplemento}
                  onChange={(e) => setCompradorComplemento(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  placeholder="Ex: Ocean Financial Centre, Suite 120" 
                />
              </div>

              {/* CIDADE & ESTADO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cidade & Estado / Província
                </label>
                <input 
                  type="text" 
                  name="compradorCidade"
                  value={compradorCidade}
                  onChange={(e) => setCompradorCidade(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  placeholder="Ex: Singapore / Dubai / London" 
                />
              </div>

              {/* PAÍS & CEP / ZIP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  País & Código Postal (ZIP / Postal Code)
                </label>
                <input 
                  type="text" 
                  name="compradorPais"
                  value={compradorPais}
                  onChange={(e) => setCompradorPais(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  placeholder="Ex: Singapore 018983 / UAE" 
                />
              </div>

              {/* TAX ID / REGISTRO FISCAL */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tax ID / Registro Fiscal / Registration No. do Comprador
                </label>
                <input 
                  type="text" 
                  name="compradorTaxId"
                  value={compradorTaxId}
                  onChange={(e) => setCompradorTaxId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-all placeholder:text-slate-400" 
                  placeholder="Ex: UEN 201812345M / VAT GB123456789" 
                />
              </div>

              {/* E-MAIL COMERCIAL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail Comercial do Comprador
                </label>
                <input 
                  type="email" 
                  name="compradorEmail"
                  value={compradorEmail}
                  onChange={(e) => setCompradorEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  placeholder="finance@buyer.com / commercial@trader.com" 
                />
              </div>

              {/* TELEFONE COMERCIAL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Telefone Comercial
                </label>
                <input 
                  type="text" 
                  name="compradorTelefone"
                  value={compradorTelefone}
                  onChange={(e) => setCompradorTelefone(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  placeholder="+65 6123 4567 / +971 4 123 4567" 
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CARD 3: DADOS DO BANCO DE DESTINO (COMPRADOR / CARTA BORDERÔ) */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {compradorDiferente ? '3.' : '2.'} Dados do Banco de Destino (Cobrança CAD / Carta Borderô)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instituição financeira no exterior para remessa de documentos de exportação.
                </p>
              </div>
            </div>

            <a
              href={`/carta-bordero/${processo.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-orange-400" />
              <span>Gerar Carta Borderô ↗</span>
            </a>
          </div>

          {/* CAMPOS DO BANCO DE DESTINO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NOME DO BANCO */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Nome do Banco no Destino (Comprador)
                </label>
                <button
                  type="button"
                  onClick={() => handleBuscarDadosBanco()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 hover:bg-orange-100 text-[#f58220] dark:bg-orange-950/60 dark:hover:bg-orange-900/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800 transition-all shadow-2xs cursor-pointer active:scale-98"
                  title="Buscar endereço e código SWIFT automaticamente com base no nome do banco"
                >
                  <Search className="w-3.5 h-3.5 text-[#f58220]" />
                  <span>Buscar dados do banco</span>
                </button>
              </div>

              <input
                type="text"
                name="bancoNome"
                value={bancoNome}
                onChange={(e) => {
                  setBancoNome(e.target.value);
                  if (feedbackBanco) setFeedbackBanco(null);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none uppercase font-semibold transition-all shadow-2xs"
                placeholder="Ex: TAMILNAD MERCANTILE BANK / STATE BANK OF INDIA"
              />

              {/* Feedback inline caso preenchido */}
              {feedbackBanco && (
                <div className="mt-2 flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 animate-fadeIn">
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
                <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900 rounded-xl shadow-lg animate-fadeIn z-10 relative">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" />
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
                        className="w-full text-left p-2 rounded-lg hover:bg-orange-50/70 dark:hover:bg-slate-800/80 transition-colors flex items-start justify-between gap-2 group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 truncate">
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
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-orange-600 dark:text-orange-400">
                            {banco.swift}
                          </span>
                          <span className="text-[9px] text-orange-600 dark:text-orange-400 block font-semibold mt-0.5">
                            Preencher ↵
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ENDEREÇO DO BANCO */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Endereço Completo da Agência do Banco
              </label>
              <input
                type="text"
                name="bancoEndereco"
                value={bancoEndereco}
                onChange={(e) => setBancoEndereco(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="Ex: 20, GOLAWAR AGRAHARAM ROAD, OLD WASHERMANPET, CHENNAI - 600021, TAMILNADU, INDIA"
              />
            </div>

            {/* CONTA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Conta Corrente / Account No.
              </label>
              <input
                type="text"
                name="bancoConta"
                value={bancoConta}
                onChange={(e) => setBancoConta(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder:text-slate-400"
                placeholder="Ex: 008700150950284"
              />
            </div>

            {/* SWIFT / BIC */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Código SWIFT / BIC
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
                  className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase font-bold outline-none transition-all pr-8 ${
                    isSwiftCompleto
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : isSwiftInvalido
                      ? 'border-amber-500 ring-2 ring-amber-500/20'
                      : 'border-slate-300 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  }`}
                  placeholder="Ex: TMBLINBB / TMBLINBB008"
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
            </div>

            {/* TELEFONE / CONTATO NO BANCO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Telefone / Contato no Banco
              </label>
              <input
                type="text"
                name="bancoTelefone"
                value={bancoTelefone}
                onChange={(e) => setBancoTelefone(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder:text-slate-400"
                placeholder="Ex: (+91) 9444426126 Mr MATHAN"
              />
            </div>

            {/* E-MAIL DO BANCO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                E-mail do Banco / Trade Finance
              </label>
              <input
                type="email"
                name="bancoEmail"
                value={bancoEmail}
                onChange={(e) => setBancoEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder:text-slate-400"
                placeholder="tradefinance@bank.com / collection@bank.com"
              />
            </div>
          </div>

          {/* PARÂMETROS DE COBRANÇA DA CARTA BORDERÔ (COM/SEM PRO-FORMA) */}
          <div className="bg-slate-50 dark:bg-slate-850 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-750 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Condição de Cobrança & Cláusula de Atraso (Carta Borderô)
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Configura o campo &quot;Cobrar juros por atraso&quot;
              </span>
            </div>

            {/* SELETOR DE MODALIDADE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => {
                  setTemProforma(false);
                  if (diasLiquidacao === 10) setDiasLiquidacao(20);
                }}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  !temProforma
                    ? 'bg-white dark:bg-slate-800 border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                    : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="modalidadeProformaRadio"
                  checked={!temProforma}
                  onChange={() => {}}
                  className="mt-1 text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Sem Pro-forma (100% CAD à vista)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Liquidação integral contra apresentação de documentos no banco (padrão: 20 dias).
                  </p>
                </div>
              </label>

              <label
                onClick={() => {
                  setTemProforma(true);
                  if (diasLiquidacao === 20) setDiasLiquidacao(10);
                }}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  temProforma
                    ? 'bg-white dark:bg-slate-800 border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                    : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="modalidadeProformaRadio"
                  checked={temProforma}
                  onChange={() => {}}
                  className="mt-1 text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Com Pro-forma (Adiantamento + Saldo CAD)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Houve adiantamento no carregamento e saldo CAD contra documentos (padrão: 10 dias).
                  </p>
                </div>
              </label>
            </div>

            {/* CAMPOS OCULTOS PARA O FORMULÁRIO */}
            <input type="hidden" name="temProforma" value={temProforma ? 'true' : 'false'} />

            {/* VARIÁVEIS DA CLÁUSULA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              {temProforma && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    % Adiantamento no Carregamento
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="adiantamentoPerc"
                      value={adiantamentoPerc}
                      onChange={(e) => setAdiantamentoPerc(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold pr-7 outline-none focus:border-orange-500"
                      min={1}
                      max={99}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Prazo Máximo de Liquidação
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="diasLiquidacao"
                    value={diasLiquidacao}
                    onChange={(e) => setDiasLiquidacao(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold pr-12 outline-none focus:border-orange-500"
                    min={1}
                    max={120}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">dias</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Multa por Atraso
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="multaAtrasoPerc"
                    value={multaAtrasoPerc}
                    onChange={(e) => setMultaAtrasoPerc(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold pr-7 outline-none focus:border-orange-500"
                    min={0}
                    max={100}
                    step={0.5}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* PRÉVIA DO TEXTO OFICIAL */}
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Prévia do campo &quot;Cobrar juros por atraso&quot; na Carta Borderô:
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                {temProforma
                  ? `Houve o adiantamento de ${adiantamentoPerc}% no momento do carregamento e saldo CAD (liquidação contra apresentação de documentos) a vista com prazo máximo de liquidação de ${diasLiquidacao} dias corridos após entrega dos documentos no banco do comprador. Caso a liquidação aconteça após os ${diasLiquidacao} dias corridos de prazo da data de entrega dos documentos no banco do comprador o valor da Invoice a ser paga deve ser acrescentado de ${multaAtrasoPerc}% de multa pelo atraso.`
                  : `100% CAD (liquidação contra apresentação de documentos) a vista com prazo máximo de liquidação de ${diasLiquidacao} dias corridos após entrega dos documentos no banco do comprador. Caso a liquidação aconteça após os ${diasLiquidacao} dias corridos de prazo da data de entrega dos documentos no banco do comprador o valor da Invoice a ser paga deve ser acrescentado de ${multaAtrasoPerc}% de multa pelo atraso.`}
              </p>
            </div>
          </div>
        </div>

        {/* NOTA EXPLICATIVA UNIVERSAL COMPACTA */}
        <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 rounded-xl p-3 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2.5">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-[11px] leading-relaxed">
            <strong>BL & Certificados</strong> utilizam os dados do <strong>Importador (Consignee)</strong>. Contratos e Faturas Comerciais integram o <strong>Comprador (Buyer)</strong>.
          </span>
        </div>

        {/* BARRA DE AÇÃO / SALVAMENTO DESTACADA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col gap-1">
            {sucesso ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                <Check className="w-4 h-4" />
                Alterações salvas com sucesso no banco de dados!
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                * Campos obrigatórios para emissão documental e conformidade aduaneira
              </span>
            )}

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={sincronizarCatalogo}
                onChange={(e) => setSincronizarCatalogo(e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Sincronizar e salvar alterações também na Central de Cadastros</span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="flex items-center justify-center gap-2 bg-[#f58220] hover:bg-orange-600 active:scale-98 text-white px-7 py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-orange-500/25 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando dados...
              </span>
            ) : (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Salvar Dados de Importador & Comprador</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* MODAL CENTRAL DE CADASTROS */}
      <CentralCadastrosModal
        isOpen={modalImportadorAberto}
        onClose={() => setModalImportadorAberto(false)}
        tipoInicial="IMPORTADOR"
        onEntidadeSelecionada={handleImportadorCriadoModal}
        modoSelecao={true}
      />
    </div>
  );
}
