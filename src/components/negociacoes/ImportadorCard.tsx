"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  Landmark,
  FileSpreadsheet
} from 'lucide-react';

interface ImportadorCardProps {
  processo: Processo;
}

export function ImportadorCard({ processo }: ImportadorCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [salvandoToggle, setSalvandoToggle] = useState(false);
  const [toggleMsg, setToggleMsg] = useState<string | null>(null);

  // Extrai informações salvas de Comprador e Banco de Destino
  const { complementoLimpo, comprador, bancoComprador } = parseCompradorInfo(processo.complementoBuyer);

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

  // Estado dos Dados do Banco de Destino (Comprador)
  const [bancoNome, setBancoNome] = useState(bancoComprador.nomeBanco || '');
  const [bancoEndereco, setBancoEndereco] = useState(bancoComprador.enderecoBanco || '');
  const [bancoConta, setBancoConta] = useState(bancoComprador.conta || '');
  const [bancoSwift, setBancoSwift] = useState(bancoComprador.swift || '');
  const [bancoTelefone, setBancoTelefone] = useState(bancoComprador.telefone || '');
  const [bancoEmail, setBancoEmail] = useState(bancoComprador.email || '');

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
    <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-7 shadow-2xs space-y-6">
      
      {/* CABEÇALHO GLOBAL UNIVERSAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#f58220]" />
            <h3 className="text-lg font-bold text-gray-900">
              {compradorDiferente 
                ? 'Identificação: Importador (Consignee) & Comprador (Buyer)' 
                : 'Dados do Importador (Buyer / Consignee)'}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Padrão universal compatível com qualquer país de destino. 
            Estes dados integram automaticamente a emissão do <strong>Draft BL, Certificado Fitossanitário e Fatura Comercial</strong>.
          </p>
        </div>

        {sucesso && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-fadeIn shrink-0">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Dados salvos com sucesso!</span>
          </div>
        )}
      </div>

      {/* BOX DE SEPARAÇÃO: COMPRADOR É DIFERENTE DO IMPORTADOR? */}
      <div className={`p-4 rounded-xl border transition-all ${
        compradorDiferente 
          ? 'bg-orange-50/80 border-orange-200 text-orange-950 shadow-xs' 
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2 rounded-lg ${compradorDiferente ? 'bg-orange-200 text-[#f58220]' : 'bg-slate-200 text-slate-600'}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  O Comprador (Buyer) é diferente do Importador (Consignee)?
                </span>
                <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                  compradorDiferente ? 'bg-orange-200 text-orange-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {compradorDiferente ? 'Duas Entidades Separadas' : 'Mesma Empresa'}
                </span>
                {salvandoToggle && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Salvando no sistema...
                  </span>
                )}
                {toggleMsg && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold animate-fadeIn">
                    <Check className="w-3 h-3 text-emerald-600" />
                    {toggleMsg}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                Marque esta opção quando o faturamento comercial for emitido para uma Trading/Comprador diferente da empresa que desembaraça e recebe a carga no porto de destino. Esta informação reflete automaticamente no documento de <strong>Instrução de Embarque</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <a
              href={`/instrucao-embarque/${processo.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Abrir a Instrução de Embarque em nova aba para conferência"
            >
              <span>📄 Ver Instrução de Embarque</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={compradorDiferente}
                disabled={salvandoToggle}
                onChange={(e) => handleToggleDiferente(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f58220]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* AVISO DE CADASTRO PENDENTE QUANDO COMPRADOR DIFERENTE E DADOS AINDA NÃO PREENCHIDOS */}
      {compradorDiferente && !compradorNome && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs shadow-2xs animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-sm text-amber-900">
              ⚠️ Cadastro Pendente: Comprador e Importador definidos como entidades separadas
            </span>
            <span className="text-[11px] text-amber-800 block">
              Esta negociação foi registrada na abertura com a separação entre <strong>Comprador (Buyer)</strong> e <strong>Importador (Consignee)</strong>. Preencha os dados de cada entidade abaixo e clique em &quot;Salvar Dados do Importador / Comprador&quot; para atualizar a emissão de documentos.
            </span>
          </div>
        </div>
      )}

      {/* SELETOR DE PRESET / CONTEXTO REGIONAL DO IMPORTADOR */}
      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-[#f58220] shrink-0" />
          <div>
            <span className="text-xs font-bold text-gray-800 block">
              Regras Aduaneiras do Destino: {labelsRegiao.titulo}
            </span>
            <span className="text-[11px] text-gray-500 block">
              Adequa exemplos e identificadores fiscais ao porto de destino ({processo.portoDestino || 'Porto não definido'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 self-start sm:self-auto">
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
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                perfilRegiao === item.id
                  ? 'bg-[#f58220] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <input type="hidden" name="compradorDiferente" value={compradorDiferente ? 'true' : 'false'} />

        {/* ============================================================== */}
        {/* BLOCO 1: DADOS DO IMPORTADOR (CONSIGNEE NO DESTINO) */}
        {/* ============================================================== */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <Building2 className="w-4 h-4 text-[#f58220]" />
            <h4 className="text-sm font-black uppercase tracking-wider text-gray-900">
              1. Dados do Importador (Consignee no Porto de Destino)
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
              Recebedor da Carga na Alfândega
            </span>
          </div>
          
          {/* RAZÃO SOCIAL DO IMPORTADOR */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nome / Razão Social do Importador (Consignee) <span className="text-red-500">*</span>
            </label>
            {compradorDiferente ? (
              <input 
                type="text" 
                name="importadorNome"
                required
                value={importadorNome}
                onChange={(e) => setImportadorNome(e.target.value)}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]/20 outline-none" 
                placeholder="Ex: R S TRIVENI FOODS PVT LTD"
              />
            ) : (
              <input 
                type="text" 
                value={processo.clienteFinal}
                disabled
                className="w-full bg-gray-50 text-gray-700 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold cursor-not-allowed" 
                title="Comprador e Importador unificados"
              />
            )}
            <span className="text-[11px] text-gray-400 mt-1 block">
              {compradorDiferente 
                ? 'Nome da empresa que receberá o BL e fará o desembaraço aduaneiro no porto de destino.'
                : 'Nome registrado na abertura da negociação. Para alterar a razão social quando unificados, edite os dados gerais do processo.'}
            </span>
          </div>

          {/* ENDEREÇO UNIVERSAL DO IMPORTADOR */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#f58220]" />
              <span>Endereço de Entrega & Desembaraço (Destino)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Endereço Principal (Logradouro, Número, Bairro/Distrito) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="enderecoBuyer" 
                  required
                  defaultValue={processo.enderecoBuyer || ''} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]/20 outline-none" 
                  placeholder="Ex: 123 Rue de la Loi / Industrial Area, Phase 2" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">
                    Complemento / Sala / Edifício / Ponto de Referência
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-500 font-normal cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={naoTemComplemento}
                      onChange={(e) => setNaoTemComplemento(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-[#f58220] focus:ring-[#f58220] cursor-pointer"
                    />
                    <span>Sem complemento</span>
                  </label>
                </div>
                <input 
                  type="text" 
                  name="complementoBuyer" 
                  disabled={naoTemComplemento}
                  defaultValue={naoTemComplemento ? '' : complementoLimpo} 
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
                    naoTemComplemento 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'border-gray-300 focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]/20'
                  }`}
                  placeholder={naoTemComplemento ? 'Não aplicável (N/A)' : 'Ex: Suite 400 / Building B'} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Cidade & Estado / Província <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="cidadeBuyer" 
                  required
                  defaultValue={processo.cidadeBuyer || ''} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]/20 outline-none" 
                  placeholder="Ex: Rotterdam / Antwerp / Gujarat" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  País & Código Postal (CEP / ZIP / Postal Code / PIN) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="paisBuyer" 
                  required
                  defaultValue={processo.paisBuyer || ''} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]/20 outline-none" 
                  placeholder="Ex: Netherlands, 3011 / India, PIN 370410" 
                />
              </div>
            </div>
          </div>

          {/* CÓDIGOS REGULATÓRIOS DO IMPORTADOR */}
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Identificadores Fiscais, Sanitários & Aduaneiros do Importador</span>
              </div>
              <span className="text-[11px] text-gray-400">
                Marque caso o importador não possua ou o registro não seja aplicável
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. REGISTRO ADUANEIRO PRINCIPAL */}
              <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-900 uppercase">
                      {perfilRegiao === 'INDIA' ? 'IEC (Índia)' : perfilRegiao === 'EUROPA' ? 'EORI (Europa)' : 'Reg. Aduaneiro / Tax ID'}
                    </label>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 rounded">
                      Principal
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                    {labelsRegiao.docPrincipalHint}
                  </p>
                </div>
                <input 
                  type="text" 
                  name="iecBuyer" 
                  defaultValue={processo.iecBuyer || ''} 
                  className="w-full bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-xs font-mono font-semibold focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]/20 outline-none uppercase" 
                  placeholder={labelsRegiao.docPrincipalPlaceholder}
                />
              </div>

              {/* 2. REGISTRO FISCAL SECUNDÁRIO */}
              <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-900 uppercase">
                      {perfilRegiao === 'INDIA' ? 'PAN NO. (Índia)' : perfilRegiao === 'EUROPA' ? 'VAT NO. (UE)' : 'Tax ID Corporativo'}
                    </label>
                    <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={naoTemSecundario}
                        onChange={(e) => setNaoTemSecundario(e.target.checked)}
                        className="w-3 h-3 rounded border-gray-300 text-[#f58220] focus:ring-[#f58220] cursor-pointer"
                      />
                      <span>N/A</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                    {labelsRegiao.docSecundarioHint}
                  </p>
                </div>
                <input 
                  type="text" 
                  name="panBuyer" 
                  disabled={naoTemSecundario}
                  defaultValue={naoTemSecundario ? '' : (processo.panBuyer || '')} 
                  className={`w-full border rounded-md px-2.5 py-1.5 text-xs font-mono outline-none transition-colors ${
                    naoTemSecundario 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-white border-gray-300 focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]/20 font-semibold uppercase'
                  }`}
                  placeholder={naoTemSecundario ? 'Não aplicável (N/A)' : labelsRegiao.docSecundarioPlaceholder}
                />
              </div>

              {/* 3. LICENÇA SANITÁRIA / FITO */}
              <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-900 uppercase">
                      {perfilRegiao === 'INDIA' ? 'FSSAI License' : 'Licença Sanitária / Fito'}
                    </label>
                    <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={naoTemSanitaria}
                        onChange={(e) => setNaoTemSanitaria(e.target.checked)}
                        className="w-3 h-3 rounded border-gray-300 text-[#f58220] focus:ring-[#f58220] cursor-pointer"
                      />
                      <span>N/A</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                    {labelsRegiao.docSanitarioHint}
                  </p>
                </div>
                <input 
                  type="text" 
                  name="fassaiBuyer" 
                  disabled={naoTemSanitaria}
                  defaultValue={naoTemSanitaria ? '' : (processo.fassaiBuyer || '')} 
                  className={`w-full border rounded-md px-2.5 py-1.5 text-xs font-mono outline-none transition-colors ${
                    naoTemSanitaria 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-white border-gray-300 focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]/20 font-semibold'
                  }`}
                  placeholder={naoTemSanitaria ? 'Não aplicável (N/A)' : labelsRegiao.docSanitarioPlaceholder}
                />
              </div>

              {/* 4. INSCRIÇÃO ESTADUAL / IVA */}
              <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-900 uppercase">
                      {perfilRegiao === 'INDIA' ? 'GSTIN NO. (Índia)' : 'Inscrição Estadual / IVA'}
                    </label>
                    <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={naoTemEstadual}
                        onChange={(e) => setNaoTemEstadual(e.target.checked)}
                        className="w-3 h-3 rounded border-gray-300 text-[#f58220] focus:ring-[#f58220] cursor-pointer"
                      />
                      <span>N/A</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                    {labelsRegiao.docEstadualHint}
                  </p>
                </div>
                <input 
                  type="text" 
                  name="gstBuyer" 
                  disabled={naoTemEstadual}
                  defaultValue={naoTemEstadual ? '' : (processo.gstBuyer || '')} 
                  className={`w-full border rounded-md px-2.5 py-1.5 text-xs font-mono outline-none transition-colors ${
                    naoTemEstadual 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-white border-gray-300 focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]/20 font-semibold uppercase'
                  }`}
                  placeholder={naoTemEstadual ? 'Não informado (N/A)' : labelsRegiao.docEstadualPlaceholder}
                />
              </div>

            </div>
          </div>

          {/* CONTATOS DO IMPORTADOR */}
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>Contatos Operacionais do Importador (Aviso de Chegada / Notice of Arrival)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  E-mail do Importador <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  name="emailBuyer" 
                  required
                  defaultValue={processo.emailBuyer || ''} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]/20 outline-none" 
                  placeholder="import@company.com / clearance@broker.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">
                    Telefone do Importador
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-500 font-normal cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={naoTemTelefone}
                      onChange={(e) => setNaoTemTelefone(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-[#f58220] focus:ring-[#f58220] cursor-pointer"
                    />
                    <span>Sem telefone</span>
                  </label>
                </div>
                <input 
                  type="text" 
                  name="telefoneBuyer" 
                  disabled={naoTemTelefone}
                  defaultValue={naoTemTelefone ? '' : (processo.telefoneBuyer || '')} 
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
                    naoTemTelefone 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'border-gray-300 focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]/20'
                  }`}
                  placeholder={naoTemTelefone ? 'Não informado (N/A)' : '+91 98250 12345 / +31 10 123 4567'} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BLOCO 2: DADOS DO COMPRADOR (BUYER) - SE DIFERENTE */}
        {/* ============================================================== */}
        {compradorDiferente && (
          <div className="space-y-5 pt-6 border-t-2 border-dashed border-orange-300 animate-fadeIn bg-orange-50/30 p-5 rounded-2xl border border-orange-200">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-orange-200">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-700" />
                <h4 className="text-sm font-black uppercase tracking-wider text-blue-950">
                  2. Dados do Comprador Comercial (Buyer / Faturamento)
                </h4>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full">
                Empresa Contratante / Pagadora
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Preencha os dados comerciais da empresa que está comprando e pagando pelo contrato (Trading, Matriz ou Intermediária comercial).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NOME / RAZÃO SOCIAL DO COMPRADOR */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nome / Razão Social do Comprador Comercial (Buyer)
                </label>
                <input 
                  type="text" 
                  name="compradorNome"
                  value={compradorNome}
                  onChange={(e) => setCompradorNome(e.target.value)}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 outline-none" 
                  placeholder="Pendente de preenchimento — Ex: AGRI FORTUNE PTE LTD"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Razão social da empresa compradora que constará no contrato de venda e fatura pro-forma.
                </span>
              </div>

              {/* ENDEREÇO COMERCIAL */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Endereço Comercial da Empresa Compradora
                </label>
                <input 
                  type="text" 
                  name="compradorEndereco"
                  value={compradorEndereco}
                  onChange={(e) => setCompradorEndereco(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 outline-none" 
                  placeholder="Ex: 10 Marina Boulevard, Tower 2 #28-00" 
                />
              </div>

              {/* COMPLEMENTO COMERCIAL */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Complemento / Sala / Edifício
                </label>
                <input 
                  type="text" 
                  name="compradorComplemento"
                  value={compradorComplemento}
                  onChange={(e) => setCompradorComplemento(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 outline-none" 
                  placeholder="Ex: Ocean Financial Centre" 
                />
              </div>

              {/* CIDADE & ESTADO */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Cidade & Estado / Província
                </label>
                <input 
                  type="text" 
                  name="compradorCidade"
                  value={compradorCidade}
                  onChange={(e) => setCompradorCidade(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 outline-none" 
                  placeholder="Ex: Singapore / Dubai / London" 
                />
              </div>

              {/* PAÍS & CEP / ZIP */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  País & Código Postal (ZIP / Postal Code)
                </label>
                <input 
                  type="text" 
                  name="compradorPais"
                  value={compradorPais}
                  onChange={(e) => setCompradorPais(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 outline-none" 
                  placeholder="Ex: Singapore 018983 / UAE" 
                />
              </div>

              {/* TAX ID / REGISTRO FISCAL */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Tax ID / Registro Fiscal / CNPJ Internacional do Comprador
                </label>
                <input 
                  type="text" 
                  name="compradorTaxId"
                  value={compradorTaxId}
                  onChange={(e) => setCompradorTaxId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 outline-none" 
                  placeholder="Ex: UEN 201812345M / VAT GB123456789 / Registration No." 
                />
              </div>

              {/* E-MAIL COMERCIAL */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  E-mail Comercial do Comprador
                </label>
                <input 
                  type="email" 
                  name="compradorEmail"
                  value={compradorEmail}
                  onChange={(e) => setCompradorEmail(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 outline-none" 
                  placeholder="finance@buyer.com / commercial@trader.com" 
                />
              </div>

              {/* TELEFONE COMERCIAL */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Telefone Comercial
                </label>
                <input 
                  type="text" 
                  name="compradorTelefone"
                  value={compradorTelefone}
                  onChange={(e) => setCompradorTelefone(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 outline-none" 
                  placeholder="+65 6123 4567 / +971 4 123 4567" 
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* BLOCO 3: DADOS DO BANCO DE DESTINO (COMPRADOR / CARTA BORDERÔ) */}
        {/* ============================================================== */}
        <div className="space-y-5 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  3. Dados do Banco de Destino (Comprador / Cobrança CAD)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dados bancários no exterior utilizados para a remessa de documentos e emissão da <strong>Carta Borderô</strong>.
                </p>
              </div>
            </div>

            <a
              href={`/carta-bordero/${processo.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-orange-400" />
              <span>Gerar Carta Borderô ↗</span>
            </a>
          </div>

          {/* CAMPOS DO BANCO DE DESTINO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NOME DO BANCO */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Nome do Banco no Destino (Comprador)
              </label>
              <input
                type="text"
                name="bancoNome"
                value={bancoNome}
                onChange={(e) => setBancoNome(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none uppercase font-semibold"
                placeholder="Ex: TAMILNAD MERCANTILE BANK / STATE BANK OF INDIA"
              />
            </div>

            {/* ENDEREÇO DO BANCO */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Endereço Completo da Agência do Banco
              </label>
              <input
                type="text"
                name="bancoEndereco"
                value={bancoEndereco}
                onChange={(e) => setBancoEndereco(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none"
                placeholder="Ex: 20, GOLAWAR AGRAHARAM ROAD, OLD WASHERMANPET, CHENNAI - 600021, TAMILNADU, INDIA"
              />
            </div>

            {/* CONTA */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Conta Corrente / Account No.
              </label>
              <input
                type="text"
                name="bancoConta"
                value={bancoConta}
                onChange={(e) => setBancoConta(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none"
                placeholder="Ex: 008700150950284"
              />
            </div>

            {/* SWIFT / BIC */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Código SWIFT / BIC
              </label>
              <input
                type="text"
                name="bancoSwift"
                value={bancoSwift}
                onChange={(e) => setBancoSwift(e.target.value.toUpperCase())}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none uppercase font-bold"
                placeholder="Ex: TMBLINBB / SBININBB"
              />
            </div>

            {/* TELEFONE / CONTATO NO BANCO */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Telefone / Contato no Banco
              </label>
              <input
                type="text"
                name="bancoTelefone"
                value={bancoTelefone}
                onChange={(e) => setBancoTelefone(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none"
                placeholder="Ex: (+91) 9444426126 Mr MATHAN"
              />
            </div>

            {/* E-MAIL DO BANCO */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                E-mail do Banco / Trade Finance
              </label>
              <input
                type="email"
                name="bancoEmail"
                value={bancoEmail}
                onChange={(e) => setBancoEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none"
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
                      className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold pr-7 outline-none focus:border-orange-500"
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
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold pr-12 outline-none focus:border-orange-500"
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
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold pr-7 outline-none focus:border-orange-500"
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

        {/* NOTA EXPLICATIVA UNIVERSAL */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Equivalências & Documentos no Comércio Internacional:</span>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              • <strong>Importador (Consignee)</strong>: Constará no conhecimento de embarque (BL), certificados fitossanitários do MAPA e desembaraço aduaneiro.<br/>
              • <strong>Comprador (Buyer / Notify / Applicant)</strong>: Constará nos contratos comerciais, faturas pro-forma e invoice comercial quando houver faturamento para trading.
            </p>
          </div>
        </div>

        {/* BOTÃO DE SALVAMENTO */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={loading} 
            className="flex items-center gap-2 bg-[#1a365d] hover:bg-blue-900 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Salvando dados...</span>
            ) : (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Salvar Dados de Importador & Comprador</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
