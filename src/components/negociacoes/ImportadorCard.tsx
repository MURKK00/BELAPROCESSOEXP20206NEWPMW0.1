"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { atualizarImportadorAction } from '@/server/actions/importadorActions';
import type { Processo } from '@prisma/client';
import { 
  Building2, 
  MapPin, 
  FileText, 
  Mail, 
  Phone, 
  Check, 
  Globe2, 
  ShieldCheck, 
  Info,
  Sparkles
} from 'lucide-react';

interface ImportadorCardProps {
  processo: Processo;
}

export function ImportadorCard({ processo }: { processo: Processo }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  // Perfil / Região de destino para pré-configurar rótulos e placeholders internacionais
  // Detecta se o porto de destino ou país sugere Índia, Europa, China/Leste Asiático ou Geral
  const destinoUpper = ((processo.portoDestino || '') + ' ' + (processo.paisBuyer || '')).toUpperCase();
  const perfilInicial = destinoUpper.includes('INDIA') || destinoUpper.includes('MUNDRA') || destinoUpper.includes('NHAVA') || destinoUpper.includes('CHENNAI') || destinoUpper.includes('KOLKATA')
    ? 'INDIA'
    : destinoUpper.includes('ROTTERDAM') || destinoUpper.includes('HAMBURG') || destinoUpper.includes('ANTWERP') || destinoUpper.includes('VALENCIA') || destinoUpper.includes('GENOA') || destinoUpper.includes('EUROPA')
    ? 'EUROPA'
    : destinoUpper.includes('CHINA') || destinoUpper.includes('QINGDAO') || destinoUpper.includes('SHANGHAI') || destinoUpper.includes('NINGBO') || destinoUpper.includes('VIETNAM') || destinoUpper.includes('TURKEY')
    ? 'ASIA_ORIENTAL'
    : 'GLOBAL';

  const [perfilRegiao, setPerfilRegiao] = useState<'GLOBAL' | 'INDIA' | 'EUROPA' | 'ASIA_ORIENTAL'>(perfilInicial);

  // Checkboxes "Não aplicável / Não informado" para flexibilidade total
  const [naoTemComplemento, setNaoTemComplemento] = useState(
    processo.complementoBuyer === 'N/A' || processo.complementoBuyer === 'NÃO APLICÁVEL'
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
      alert('❌ Erro ao salvar os dados do importador.');
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
            <Building2 className="w-5 h-5 text-secondary" />
            <h3 className="text-lg font-bold text-gray-900">Dados do Importador (Buyer / Consignee)</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Padrão universal compatível com qualquer país da <strong className="text-gray-700">Ásia, Europa, Oriente Médio e Américas</strong>. 
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

      {/* SELETOR DE PRESET / CONTEXTO REGIONAL */}
      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-secondary shrink-0" />
          <div>
            <span className="text-xs font-bold text-gray-800 block">
              Contexto do Destino: {labelsRegiao.titulo}
            </span>
            <span className="text-[11px] text-gray-500 block">
              Altera as orientações e exemplos dos campos para se adequar ao destino da carga ({processo.portoDestino || 'Porto não definido'})
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
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                perfilRegiao === item.id
                  ? 'bg-secondary text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SEÇÃO 1: RAZÃO SOCIAL */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Nome / Razão Social do Comprador (Buyer / Consignee)
          </label>
          <input 
            type="text" 
            value={processo.clienteFinal}
            disabled
            className="w-full bg-gray-50 text-gray-700 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold cursor-not-allowed" 
            title="Definido na abertura da negociação"
          />
          <span className="text-[11px] text-gray-400 mt-1 block">
            Nome oficial do comprador registrado no contrato de exportação. Para alterar a razão social, edite a negociação principal.
          </span>
        </div>

        {/* SEÇÃO 2: ENDEREÇO UNIVERSAL */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-secondary" />
            <span>Endereço Comercial & Entrega (Destino)</span>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none" 
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
                    className="w-3.5 h-3.5 rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer"
                  />
                  <span>Sem complemento</span>
                </label>
              </div>
              <input 
                type="text" 
                name="complementoBuyer" 
                disabled={naoTemComplemento}
                defaultValue={naoTemComplemento ? '' : (processo.complementoBuyer || '')} 
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
                  naoTemComplemento 
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                    : 'border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary/20'
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none" 
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none" 
                placeholder="Ex: Netherlands, 3011 / India, PIN 370410" 
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: CÓDIGOS REGULATÓRIOS, FISCAIS E ADUANEIROS (UNIVERSAL) */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Identificadores Fiscais, Sanitários & Aduaneiros</span>
            </div>
            <span className="text-[11px] text-gray-400">
              Marque as caixas de seleção caso a empresa não possua ou o registro não seja exigido
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. REGISTRO ADUANEIRO PRINCIPAL (IEC / EORI / USCI / TAX ID) */}
            <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-900 uppercase">
                    {perfilRegiao === 'INDIA' ? 'IEC (Índia)' : perfilRegiao === 'EUROPA' ? 'EORI (Europa)' : 'Reg. Aduaneiro / Tax ID'}
                  </label>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 rounded">
                    Fundamental
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
                className="w-full bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-xs font-mono font-semibold focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none uppercase" 
                placeholder={labelsRegiao.docPrincipalPlaceholder}
              />
            </div>

            {/* 2. REGISTRO FISCAL SECUNDÁRIO / CORPORATIVO (PAN / VAT / CNPJ LOCAL) */}
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
                      className="w-3 h-3 rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer"
                    />
                    <span>Não possui / N/A</span>
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
                    : 'bg-white border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary/20 font-semibold uppercase'
                }`}
                placeholder={naoTemSecundario ? 'Não aplicável (N/A)' : labelsRegiao.docSecundarioPlaceholder}
              />
            </div>

            {/* 3. LICENÇA SANITÁRIA / ALIMENTAR (FSSAI / TRACES / FDA / MINISTÉRIO DA AGRICULTURA) */}
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
                      className="w-3 h-3 rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer"
                    />
                    <span>Não possui / N/A</span>
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
                    : 'bg-white border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary/20 font-semibold'
                }`}
                placeholder={naoTemSanitaria ? 'Não aplicável (N/A)' : labelsRegiao.docSanitarioPlaceholder}
              />
            </div>

            {/* 4. INSCRIÇÃO ESTADUAL / IMPOSTO DE CONSUMO (GSTIN / VAT LOCAL / COMERCIAL) */}
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
                      className="w-3 h-3 rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer"
                    />
                    <span>Não informado</span>
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
                    : 'bg-white border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary/20 font-semibold uppercase'
                }`}
                placeholder={naoTemEstadual ? 'Não informado (N/A)' : labelsRegiao.docEstadualPlaceholder}
              />
            </div>

          </div>
        </div>

        {/* SEÇÃO 4: CONTATO OPERACIONAL UNIVERSAL */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Mail className="w-4 h-4 text-emerald-600" />
            <span>Contatos Operacionais para Aviso de Chegada (Notice of Arrival / Consignee Notice)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                E-mail Operacional / Notificação <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" 
                name="emailBuyer" 
                required
                defaultValue={processo.emailBuyer || ''} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none" 
                placeholder="operations@buyer.com / import@company.com"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                E-mail que constará nos rascunhos de BL, fatura comercial e certificados internacionais
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase">
                  Telefone Internacional (com DDI e DDD)
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-500 font-normal cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={naoTemTelefone}
                    onChange={(e) => setNaoTemTelefone(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer"
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
                    : 'border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary/20'
                }`}
                placeholder={naoTemTelefone ? 'Não informado (N/A)' : '+31 10 123 4567 / +91 98250 12345'} 
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Ex: +31 (Holanda), +49 (Alemanha), +91 (Índia), +86 (China), +971 (Emirados)
              </span>
            </div>
          </div>
        </div>

        {/* NOTA EXPLICATIVA UNIVERSAL */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3 text-xs text-blue-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Equivalências Aduaneiras Internacionais:</span>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              • <strong>União Europeia / UK</strong>: O identificador principal é o número <strong>EORI</strong> + número <strong>VAT</strong> intracomunitário.<br/>
              • <strong>Índia</strong>: O identificador aduaneiro é o <strong>IEC</strong> + <strong>PAN</strong> + licença alimentar <strong>FSSAI</strong>.<br/>
              • <strong>China e Extremo Oriente</strong>: Utiliza-se o código unificado <strong>USCI</strong> (18 dígitos) e registro alfandegário GACC.<br/>
              • <strong>Américas e Demais Países</strong>: Utiliza-se o <strong>Tax ID / EIN / RFC / RUT</strong> corporativo nacional.
            </p>
          </div>
        </div>

        {/* BOTÃO DE SALVAMENTO */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={loading} 
            className="flex items-center gap-2 bg-[#1a365d] hover:bg-blue-900 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Salvando dados do importador...</span>
            ) : (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Salvar Dados do Importador</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
