'use client';

import { useState, useEffect } from 'react';
import { criarProcessoAction } from '@/server/actions/criarProcessoAction';
import { Section, Field, SelectField, PRODUTOS_FEIJAO, TIPOS_FUMIGACAO } from '@/components/negociacoes/FormFields';
import { IncotermSelectField } from '@/components/negociacoes/IncotermSelectField';

export const PORTOS_ORIGEM_OPTIONS = [
  { value: 'SANTOS (Santos - BRSSZ)', label: 'SANTOS (Santos - BRSSZ)' },
  { value: 'PARANAGUA (Paranaguá - BRPNG)', label: 'PARANAGUA (Paranaguá - BRPNG)' },
];

export const EMBALAGENS_OPTIONS = [
  { value: 'Sacaria 30kg', label: 'Sacaria 30kg (Padrão 30 KG / Bag)' },
  { value: 'Sacaria 25kg', label: 'Sacaria 25kg (25 KG / Bag)' },
  { value: 'Sacaria 50kg', label: 'Sacaria 50kg (50 KG / Bag)' },
  { value: 'Big Bag 1000kg', label: 'Big Bag 1000kg (1 TON / Big Bag)' },
];

export default function NovaNegociacaoPage() {
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
      <h2 className="text-2xl font-bold mb-6">Nova negociação</h2>
      <form action={criarProcessoAction} className="space-y-6">

        <Section title="Dados do contrato">
          <Field label="Cliente final" name="clienteFinal" placeholder="Ex: AKSHAR AGRI INDIA PRIVATE LIMITED" required />
          <Field label="Trader / Intermédio" name="traderIntermedio" placeholder="Ex: AgriTrading Partners SA" />
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
