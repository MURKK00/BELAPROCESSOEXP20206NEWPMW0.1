'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, CheckCircle2, Clock } from 'lucide-react';
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
          <div className="col-span-full bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  O Comprador (Buyer) é diferente do Importador (Consignee)?
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Indique se o faturamento comercial e o desembaraço no destino são para entidades separadas. Esta definição já ficará marcada na aba Importador (buyer).
                </p>
              </div>
            </div>

            {/* SELETOR EM BOTÕES RADIO ESTILIZADOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setCompradorDiferente(false)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  !compradorDiferente
                    ? 'bg-white dark:bg-slate-900 border-orange-500/80 ring-2 ring-orange-500/20 shadow-xs'
                    : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Não — Mesma empresa
                  </span>
                  {!compradorDiferente && <CheckCircle2 className="w-4 h-4 text-orange-500" />}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Cliente Final é simultaneamente o Comprador e o Importador (Consignee).
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCompradorDiferente(true)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  compradorDiferente
                    ? 'bg-white dark:bg-slate-900 border-orange-500/80 ring-2 ring-orange-500/20 shadow-xs'
                    : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Sim — Entidades diferentes
                  </span>
                  {compradorDiferente && <CheckCircle2 className="w-4 h-4 text-orange-500" />}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Faturamento para o Comprador (Buyer) e Entrega/BL para o Importador (Consignee).
                </span>
              </button>
            </div>

            {/* CAMPO OCULTO ENVIADO NO FORMDATA */}
            <input
              type="hidden"
              name="compradorDiferente"
              value={compradorDiferente ? 'sim' : 'nao'}
            />

            {/* QUANDO MARCADO SIM: NÃO EXIBE CAMPOS AGORA, SÓ DEIXA MARCADO E PENDENTE NA NEGOCIAÇÃO */}
            {compradorDiferente && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 text-[11px] font-medium text-orange-900 dark:text-orange-200 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-xs">
                      ✓ Definição registrada: Comprador e Importador separados
                    </span>
                    <span className="text-[11px] text-orange-800 dark:text-orange-300 block mt-0.5">
                      Nenhum dado cadastral precisa ser preenchido agora. A negociação será criada com a separação já ativada e os campos de cada empresa ficarão <strong>pendentes para preenchimento na aba &quot;Importador (buyer)&quot;</strong> dentro do processo.
                    </span>
                  </div>
                </div>
              </div>
            )}
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
          <Field label="Preço unitário declarado (USD/TON)" name="valorDeclaradoUsd" type="number" placeholder="Ex: 880" />
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
