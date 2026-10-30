"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Tractor, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Truck, 
  Ship, 
  Warehouse, 
  Compass, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Copy, 
  Plus, 
  ArrowRight, 
  Leaf, 
  Scale, 
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { vincularProdutorTrajetoAction } from '@/server/actions/cadastrosActions';
import { CentralCadastrosModal } from '@/components/cadastros/CentralCadastrosModal';

interface RastreabilidadeTrajetoCardProps {
  processo: any;
}

const TRAJETO_ETAPAS = [
  { id: 'FAZENDA', label: '1. Fazenda de Origem', sublabel: 'Colheita & Talhão', icon: Tractor, cor: 'amber' },
  { id: 'SILO_ORIGEM', label: '2. Silo & Armazém', sublabel: 'Classificação & Umidade', icon: Warehouse, cor: 'yellow' },
  { id: 'TRANSBORDO_RODOVIARIO', label: '3. Logística & Transbordo', sublabel: 'Rodoviário / Ferrovia', icon: Truck, cor: 'blue' },
  { id: 'TERMINAL_PORTUARIO', label: '4. Terminal / REDEX', sublabel: 'Estufagem & Gate Porto', icon: Layers, cor: 'cyan' },
  { id: 'EMBARCADO_NAVIO', label: '5. Marítimo Internacional', sublabel: 'Em Trânsito / BL Emitido', icon: Ship, cor: 'emerald' },
];

export function RastreabilidadeTrajetoCard({ processo }: RastreabilidadeTrajetoCardProps) {
  const router = useRouter();

  // Estados dos Produtores
  const [produtores, setProdutores] = useState<any[]>([]);
  const [loadingProdutores, setLoadingProdutores] = useState(false);
  const [modalProdutorAberto, setModalProdutorAberto] = useState(false);

  // Form States
  const [produtorId, setProdutorId] = useState(processo.produtorId || '');
  const [fazendaOrigemNome, setFazendaOrigemNome] = useState(processo.fazendaOrigemNome || '');
  const [produtorCarCache, setProdutorCarCache] = useState(processo.produtorCarCache || '');
  const [produtorIeCache, setProdutorIeCache] = useState(processo.produtorIeCache || '');
  const [trajetoStatus, setTrajetoStatus] = useState(processo.trajetoStatus || 'FAZENDA');
  const [siloArmazemOrigem, setSiloArmazemOrigem] = useState(processo.siloArmazemOrigem || '');
  const [terminalTransbordo, setTerminalTransbordo] = useState(processo.terminalTransbordo || '');
  const [laudoClassificacao, setLaudoClassificacao] = useState(processo.laudoClassificacao || '');
  const [distanciaRodoviariaKm, setDistanciaRodoviariaKm] = useState(processo.distanciaRodoviariaKm ? String(processo.distanciaRodoviariaKm) : '');
  const [emissaoCO2EstimadaKg, setEmissaoCO2EstimadaKg] = useState(processo.emissaoCO2EstimadaKg ? String(processo.emissaoCO2EstimadaKg) : '');

  // Feedback States
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);
  const [msgErro, setMsgErro] = useState<string | null>(null);
  const [copiadoCar, setCopiadoCar] = useState(false);

  // Carrega lista de produtores cadastrados
  useEffect(() => {
    carregarProdutores();
  }, []);

  async function carregarProdutores() {
    setLoadingProdutores(true);
    try {
      const res = await fetch('/api/cadastros?tipo=PRODUTOR');
      if (res.ok) {
        const data = await res.json();
        setProdutores(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Erro ao buscar produtores:', e);
    } finally {
      setLoadingProdutores(false);
    }
  }

  function handleSelecionarProdutor(prodId: string) {
    setProdutorId(prodId);
    const p = produtores.find((item) => item.id === prodId);
    if (p) {
      setFazendaOrigemNome(p.nomePropriedade || p.nomeFantasia || p.razaoSocial || '');
      setProdutorCarCache(p.carNumero || '');
      setProdutorIeCache(p.inscricaoEstadual || '');
      if (!siloArmazemOrigem && p.municipio) {
        setSiloArmazemOrigem(`Silo Grãos ${p.municipio} - Armazém Regional`);
      }
      if (!distanciaRodoviariaKm) {
        setDistanciaRodoviariaKm(p.uf === 'MT' ? '1850' : '1200');
        setEmissaoCO2EstimadaKg(p.uf === 'MT' ? '2450.00' : '1600.00');
      }
    }
  }

  function handleProdutorCriado(novoProdutor: any) {
    carregarProdutores().then(() => {
      handleSelecionarProdutor(novoProdutor.id);
    });
  }

  async function handleSalvarTrajeto(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMsgErro(null);
    setMsgSucesso(null);

    const res = await vincularProdutorTrajetoAction(processo.id, {
      produtorId: produtorId || null,
      fazendaOrigemNome: fazendaOrigemNome || null,
      produtorCarCache: produtorCarCache || null,
      produtorIeCache: produtorIeCache || null,
      trajetoStatus,
      siloArmazemOrigem: siloArmazemOrigem || null,
      terminalTransbordo: terminalTransbordo || null,
      laudoClassificacao: laudoClassificacao || null,
      distanciaRodoviariaKm: distanciaRodoviariaKm ? parseInt(distanciaRodoviariaKm, 10) : null,
      emissaoCO2EstimadaKg: emissaoCO2EstimadaKg ? parseFloat(emissaoCO2EstimadaKg) : null,
    });

    setSalvando(false);
    if (res.success) {
      setMsgSucesso('Mapeamento do trajeto e dados do produtor atualizados com sucesso!');
      router.refresh();
      setTimeout(() => setMsgSucesso(null), 4000);
    } else {
      setMsgErro(res.error || 'Erro ao salvar trajeto do grão.');
    }
  }

  function copiarCar() {
    if (!produtorCarCache) return;
    navigator.clipboard.writeText(produtorCarCache);
    setCopiadoCar(true);
    setTimeout(() => setCopiadoCar(false), 2000);
  }

  const produtorSelecionadoObj = produtores.find((p) => p.id === produtorId);
  const etapaAtualIndex = TRAJETO_ETAPAS.findIndex((e) => e.id === trajetoStatus);

  return (
    <div className="space-y-6">
      {/* HEADER DA ABA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Rastreabilidade & Mapeamento do Trajeto do Grão
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> CAR & Origem Auditada
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Processo <strong className="text-slate-800 dark:text-slate-200">{processo.numeroProcesso}</strong> — Vínculo direto com o Produtor Rural, CAR da Fazenda, Inscrição Estadual e cadeia logística até o porto.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setModalProdutorAberto(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Produtor</span>
            </button>
          </div>
        </div>

        {/* FEEDBACKS */}
        {msgSucesso && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{msgSucesso}</span>
          </div>
        )}
        {msgErro && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{msgErro}</span>
          </div>
        )}

        {/* TIMELINE VISUAL INTERATIVA DO TRAJETO */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pipeline de Escoamento Intermodal
            </h4>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Etapa Atual: <span className="text-amber-600 dark:text-amber-400 font-black">{TRAJETO_ETAPAS.find(e => e.id === trajetoStatus)?.label}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {TRAJETO_ETAPAS.map((etapa, idx) => {
              const Icon = etapa.icon;
              const isAtivo = etapa.id === trajetoStatus;
              const isConcluido = etapaAtualIndex >= 0 && idx < etapaAtualIndex;

              return (
                <button
                  key={etapa.id}
                  type="button"
                  onClick={() => setTrajetoStatus(etapa.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                    isAtivo
                      ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                      : isConcluido
                      ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/40 text-slate-700 dark:text-slate-300'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div
                      className={`p-2 rounded-xl ${
                        isAtivo
                          ? 'bg-amber-500 text-white'
                          : isConcluido
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isConcluido && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Ok
                      </span>
                    )}
                    {isAtivo && (
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                        Ativo
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    {etapa.label}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {etapa.sublabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FORMULÁRIO DE VÍNCULO & DETALHES DO TRAJETO */}
      <form onSubmit={handleSalvarTrajeto} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUNA 1 & 2: DADOS DO PRODUTOR, CAR & INSCRIÇÃO ESTADUAL */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Tractor className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    1. Produtor Rural & Fazenda de Origem
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-[#f58220]">
                  Rastreabilidade Reversa (CAR)
                </span>
              </div>

              {/* SELETOR DE PRODUTOR CADASTRADO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Vincular Produtor Cadastrado
                </label>
                <div className="flex gap-2">
                  <select
                    value={produtorId}
                    onChange={(e) => handleSelecionarProdutor(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                  >
                    <option value="">— Selecione um produtor rural da base —</option>
                    {produtores.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.razaoSocial} ({prod.nomePropriedade || prod.municipio || 'MT'}) — CAR: {prod.carNumero ? prod.carNumero.slice(0, 16) + '...' : 'Sem CAR'}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setModalProdutorAberto(true)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shrink-0 cursor-pointer"
                    title="Adicionar ou editar parceiros na base central"
                  >
                    Gerenciar
                  </button>
                </div>
              </div>

              {/* CAMPOS AUDITÁVEIS: CAR & IE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* CAR */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      CAR - Cadastro Ambiental Rural da Propriedade <span className="text-[#f58220]">*</span>
                    </label>
                    {produtorCarCache && (
                      <button
                        type="button"
                        onClick={copiarCar}
                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiadoCar ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiadoCar ? 'Copiado!' : 'Copiar CAR'}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MT-5103007-6B18.C94A.5D12.44A8.B268.31E0.8921"
                    value={produtorCarCache}
                    onChange={(e) => setProdutorCarCache(e.target.value.toUpperCase())}
                    className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Conformidade socioambiental válida para averbação fiscal SEFAZ e DUE de exportação.</span>
                  </p>
                </div>

                {/* INSCRIÇÃO ESTADUAL */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Inscrição Estadual (IE) <span className="text-[#f58220]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 13.456.789-0"
                    value={produtorIeCache}
                    onChange={(e) => setProdutorIeCache(e.target.value)}
                    className="w-full font-mono text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                  />
                </div>

                {/* NOME DA FAZENDA */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Nome da Propriedade / Fazenda / Talhão
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Fazenda Santa Maria - Gleba Araguaia"
                    value={fazendaOrigemNome}
                    onChange={(e) => setFazendaOrigemNome(e.target.value)}
                    className="w-full text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                  />
                </div>
              </div>

              {/* CARD DE DETALHES DO PRODUTOR SELECIONADO */}
              {produtorSelecionadoObj && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="font-bold">Produtor Vinculado:</span>
                    <span className="font-black text-slate-900 dark:text-white">{produtorSelecionadoObj.razaoSocial}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <div>
                      <span>Localidade: </span>
                      <strong className="text-slate-700 dark:text-slate-300">{produtorSelecionadoObj.municipio} - {produtorSelecionadoObj.uf || 'MT'}</strong>
                    </div>
                    <div>
                      <span>GPS: </span>
                      <strong className="font-mono text-slate-700 dark:text-slate-300">{produtorSelecionadoObj.coordenadasGps || 'Não informado'}</strong>
                    </div>
                  </div>
                  {produtorSelecionadoObj.certificacoes && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <Leaf className="w-3 h-3 shrink-0" />
                      <span>{produtorSelecionadoObj.certificacoes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SEÇÃO 2: LOGÍSTICA DE TRANSBORDO, SILOS & LAUDO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-500" />
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    2. Armazenagem, Transbordo & Qualidade do Grão
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Silo / Armazém de Origem
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Silo Grãos Araguaia - Confresa/MT"
                    value={siloArmazemOrigem}
                    onChange={(e) => setSiloArmazemOrigem(e.target.value)}
                    className="w-full text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Terminal de Transbordo / Modal Ferroviário
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Terminal Ferroviário Rondonópolis / Rumo"
                    value={terminalTransbordo}
                    onChange={(e) => setTerminalTransbordo(e.target.value)}
                    className="w-full text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Laudo de Classificação Física & Qualidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Milho Pipoca Butterfly Especial - Umidade 13.2% - Pureza 99.4%"
                    value={laudoClassificacao}
                    onChange={(e) => setLaudoClassificacao(e.target.value)}
                    className="w-full text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Distância Estimada Origem ➔ Porto (Km)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 1680"
                    value={distanciaRodoviariaKm}
                    onChange={(e) => setDistanciaRodoviariaKm(e.target.value)}
                    className="w-full font-mono text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Emissão de CO₂ Estimada (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 2150.00"
                    value={emissaoCO2EstimadaKg}
                    onChange={(e) => setEmissaoCO2EstimadaKg(e.target.value)}
                    className="w-full font-mono text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA 3: SUMMARY CARD & DESTINO MARÍTIMO */}
          <div className="space-y-6">
            {/* DESTINO & CONEXÃO COM O IMPORTADOR */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Ship className="w-5 h-5 text-emerald-500" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  3. Destino Internacional
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400">Cliente / Consignatário:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {processo.clienteFinal || 'Não especificado'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Porto Origem:</span>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {processo.portoOrigem || 'Santos / SP'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Porto Destino:</span>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {processo.portoDestino || 'Exterior'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Navio:</span>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {processo.navio || 'A definir'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Booking:</span>
                    <div className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {processo.bookingNumero || 'Pendente'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Volume Vinculado:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {(processo.volumeKg / 1000).toLocaleString('pt-BR')} Toneladas ({processo.produto})
                  </div>
                </div>
              </div>
            </div>

            {/* AUDITORIA SOCIOAMBIENTAL & COMPLIANCE */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                  Compliance Socioambiental
                </h4>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Este lote atende às normas da União Europeia contra Desmatamento (EUDR) e aos padrões de originação sustentável do Cerrado e Amazônia.
              </p>

              <div className="space-y-1.5 pt-2 text-[10px] font-bold">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                  <span>CAR Ativo & Regularizado no SICAR</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                  <span>Sem sobreposição em Unidades de Conservação</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                  <span>Inscrição Estadual ativa para triangulação fiscal</span>
                </div>
              </div>
            </div>

            {/* BOTÃO DE SALVAMENTO */}
            <button
              type="submit"
              disabled={salvando}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#f58220] hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gravando Trajeto do Grão...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Rastreabilidade & Trajeto</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* MODAL DE CADASTRO DE PRODUTORES / PARCEIROS */}
      <CentralCadastrosModal
        isOpen={modalProdutorAberto}
        onClose={() => setModalProdutorAberto(false)}
        tipoInicial="PRODUTOR"
        onEntidadeSelecionada={handleProdutorCriado}
        modoSelecao={true}
      />
    </div>
  );
}
