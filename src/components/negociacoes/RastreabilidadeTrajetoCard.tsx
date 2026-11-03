"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Tractor, 
  MapPin, 
  Warehouse, 
  Check, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Plus, 
  Leaf, 
  Building2,
  FileText
} from 'lucide-react';
import { vincularProdutorTrajetoAction } from '@/server/actions/cadastrosActions';
import { CentralCadastrosModal } from '@/components/cadastros/CentralCadastrosModal';

interface RastreabilidadeTrajetoCardProps {
  processo: any;
}

export function RastreabilidadeTrajetoCard({ processo }: RastreabilidadeTrajetoCardProps) {
  const router = useRouter();

  // Estados dos Produtores e Armazéns cadastrados
  const [produtores, setProdutores] = useState<any[]>([]);
  const [armazens, setArmazens] = useState<any[]>([]);
  const [loadingProdutores, setLoadingProdutores] = useState(false);
  const [modalProdutorAberto, setModalProdutorAberto] = useState(false);
  const [modalArmazemAberto, setModalArmazemAberto] = useState(false);

  // Estados do Produtor
  const [produtorId, setProdutorId] = useState(processo.produtorId || '');
  const [fazendaOrigemNome, setFazendaOrigemNome] = useState(processo.fazendaOrigemNome || '');
  const [produtorCarCache, setProdutorCarCache] = useState(processo.produtorCarCache || '');
  const [produtorIeCache, setProdutorIeCache] = useState(processo.produtorIeCache || '');

  // Estados de Armazenagem
  const [armazemId, setArmazemId] = useState(processo.armazemId || '');
  const [siloArmazemOrigem, setSiloArmazemOrigem] = useState(processo.siloArmazemOrigem || '');
  const [armazemCnpj, setArmazemCnpj] = useState(processo.armazemCnpj || '');
  const [armazemUf, setArmazemUf] = useState(processo.armazemUf || '');
  const [armazemCidade, setArmazemCidade] = useState(processo.armazemCidade || '');
  const [armazemEndereco, setArmazemEndereco] = useState(processo.armazemEndereco || '');

  // Feedback States
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);
  const [msgErro, setMsgErro] = useState<string | null>(null);
  const [copiadoCar, setCopiadoCar] = useState(false);

  // Carrega listas de produtores e armazéns cadastrados
  useEffect(() => {
    carregarProdutores();
    carregarArmazens();
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

  async function carregarArmazens() {
    try {
      const res = await fetch('/api/cadastros?tipo=ARMAZEM');
      if (res.ok) {
        const data = await res.json();
        setArmazens(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Erro ao buscar armazéns:', e);
    }
  }

  function handleSelecionarProdutor(prodId: string) {
    setProdutorId(prodId);
    const p = produtores.find((item) => item.id === prodId);
    if (p) {
      setFazendaOrigemNome(p.nomePropriedade || p.nomeFantasia || p.razaoSocial || '');
      setProdutorCarCache(p.carNumero || '');
      setProdutorIeCache(p.inscricaoEstadual || '');
    }
  }

  function handleSelecionarArmazemCadastrado(armId: string) {
    setArmazemId(armId);
    const a = armazens.find((item) => item.id === armId);
    if (a) {
      setSiloArmazemOrigem(a.razaoSocial || a.nomeFantasia || '');
      setArmazemCnpj(a.documento || '');
      setArmazemUf(a.uf || '');
      setArmazemCidade(a.cidade || a.municipio || '');
      setArmazemEndereco(a.endereco || '');
    }
  }

  function handleProdutorCriado(novoProdutor: any) {
    carregarProdutores().then(() => {
      handleSelecionarProdutor(novoProdutor.id);
    });
  }

  function handleArmazemCriado(novoArmazem: any) {
    carregarArmazens().then(() => {
      handleSelecionarArmazemCadastrado(novoArmazem.id);
    });
  }

  async function handleSalvarRastreabilidade(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMsgErro(null);
    setMsgSucesso(null);

    const res = await vincularProdutorTrajetoAction(processo.id, {
      produtorId: produtorId || null,
      fazendaOrigemNome: fazendaOrigemNome || null,
      produtorCarCache: produtorCarCache || null,
      produtorIeCache: produtorIeCache || null,
      coletaDiretaLavoura: false,
      armazemId: armazemId || null,
      siloArmazemOrigem: siloArmazemOrigem || null,
      armazemCnpj: armazemCnpj || null,
      armazemUf: armazemUf || null,
      armazemCidade: armazemCidade || null,
      armazemEndereco: armazemEndereco || null,
    });

    setSalvando(false);
    if (res.success) {
      setMsgSucesso('Dados de rastreabilidade salvos com sucesso!');
      router.refresh();
      setTimeout(() => setMsgSucesso(null), 4000);
    } else {
      setMsgErro(res.error || 'Erro ao salvar rastreabilidade do grão.');
    }
  }

  function copiarCar() {
    if (!produtorCarCache) return;
    navigator.clipboard.writeText(produtorCarCache);
    setCopiadoCar(true);
    setTimeout(() => setCopiadoCar(false), 2000);
  }

  const produtorSelecionadoObj = produtores.find((p) => p.id === produtorId);

  return (
    <div className="space-y-6">
      {/* HEADER DA ABA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Tractor className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Rastreabilidade
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Processo <strong className="text-slate-800 dark:text-slate-200">{processo.numeroProcesso}</strong> — Vínculo com o Produtor Rural, CAR da Fazenda, Inscrição Estadual e Armazenagem.
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
      </div>

      {/* FORMULÁRIO DE RASTREABILIDADE */}
      <form onSubmit={handleSalvarRastreabilidade} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SEÇÃO 1: PRODUTOR RURAL & FAZENDA DE ORIGEM */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tractor className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  1. Produtor Rural & Fazenda de Origem
                </h4>
              </div>
            </div>

            {/* SELETOR DE PRODUTOR CADASTRADO - SELEÇÃO APENAS PELO NOME */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Selecionar Produtor Rural (por nome)
              </label>
              <div className="flex gap-2">
                <select
                  value={produtorId}
                  onChange={(e) => handleSelecionarProdutor(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#f58220]/40 outline-none font-medium"
                >
                  <option value="">— Selecione o produtor rural pelo nome —</option>
                  {produtores.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.razaoSocial}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setModalProdutorAberto(true)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shrink-0 cursor-pointer"
                  title="Cadastrar ou editar produtores"
                >
                  Gerenciar
                </button>
              </div>
            </div>

            {/* INFORMAÇÕES DO PRODUTOR SELECIONADO APARECENDO LOGO ABAIXO */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  Informações da Origem do Grão
                </span>
                {produtorCarCache && (
                  <button
                    type="button"
                    onClick={copiarCar}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiadoCar ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoCar ? 'Copiado!' : 'Copiar CAR'}</span>
                  </button>
                )}
              </div>

              {/* CAR */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CAR - Cadastro Ambiental Rural
                </label>
                <input
                  type="text"
                  placeholder="CAR da propriedade rural"
                  value={produtorCarCache}
                  onChange={(e) => setProdutorCarCache(e.target.value.toUpperCase())}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 outline-none"
                />
              </div>

              {/* INSCRIÇÃO ESTADUAL & NOME DA FAZENDA / LAVOURA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Inscrição Estadual (IE)
                  </label>
                  <input
                    type="text"
                    placeholder="IE do Produtor"
                    value={produtorIeCache}
                    onChange={(e) => setProdutorIeCache(e.target.value)}
                    className="w-full font-mono text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fazenda / Formação da Lavoura
                  </label>
                  <input
                    type="text"
                    placeholder="Nome da Fazenda / Talhão"
                    value={fazendaOrigemNome}
                    onChange={(e) => setFazendaOrigemNome(e.target.value)}
                    className="w-full text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#f58220]/40 outline-none"
                  />
                </div>
              </div>

              {/* DETALHES ADICIONAIS DO CADASTRO (MUNICÍPIO, GPS, FORMAÇÃO / CERTIFICAÇÕES) */}
              {produtorSelecionadoObj && (
                <div className="pt-2 border-t border-amber-200/50 dark:border-amber-900/30 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400">Município / UF: </span>
                      <strong>{produtorSelecionadoObj.municipio || 'Não informado'} - {produtorSelecionadoObj.uf || 'MT'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">GPS: </span>
                      <strong className="font-mono">{produtorSelecionadoObj.coordenadasGps || 'Não informado'}</strong>
                    </div>
                  </div>

                  {produtorSelecionadoObj.certificacoes && (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                      <Leaf className="w-3.5 h-3.5 shrink-0" />
                      <span><strong>Certificações / Formação:</strong> {produtorSelecionadoObj.certificacoes}</span>
                    </div>
                  )}

                  {produtorSelecionadoObj.observacoes && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      {produtorSelecionadoObj.observacoes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO 2: ARMAZENAGEM */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-blue-500" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  2. Armazenagem & Beneficiamento
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setModalArmazemAberto(true)}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                + Cadastrar Armazém
              </button>
            </div>

            <div className="space-y-4">
              {/* ATALHO SELEÇÃO DE ARMAZÉM CADASTRADO */}
              {armazens.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Selecionar Armazém Cadastrado (opcional)
                  </label>
                  <select
                    value={armazemId}
                    onChange={(e) => handleSelecionarArmazemCadastrado(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                  >
                    <option value="">— Digite abaixo ou selecione um armazém da base —</option>
                    {armazens.map((arm) => (
                      <option key={arm.id} value={arm.id}>
                        {arm.razaoSocial} ({arm.cidade || arm.municipio}/{arm.uf || 'MT'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* SILO / ARMAZÉM */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Silo / Armazém
                </label>
                <input
                  type="text"
                  placeholder="Ex: Silo & Armazéns Grãos Araguaia Ltda"
                  value={siloArmazemOrigem}
                  onChange={(e) => setSiloArmazemOrigem(e.target.value)}
                  className="w-full text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500/40 outline-none font-medium"
                />
              </div>

              {/* CNPJ ARMAZÉM */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CNPJ Armazém
                </label>
                <input
                  type="text"
                  placeholder="Ex: 08.765.432/0001-90"
                  value={armazemCnpj}
                  onChange={(e) => setArmazemCnpj(e.target.value)}
                  className="w-full font-mono text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500/40 outline-none"
                />
              </div>

              {/* UF E CIDADE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    UF
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Ex: MT"
                    value={armazemUf}
                    onChange={(e) => setArmazemUf(e.target.value.toUpperCase())}
                    className="w-full uppercase text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500/40 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Confresa"
                    value={armazemCidade}
                    onChange={(e) => setArmazemCidade(e.target.value)}
                    className="w-full text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500/40 outline-none"
                  />
                </div>
              </div>

              {/* ENDEREÇO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rodovia MT-430, Km 12, Zona Rural"
                  value={armazemEndereco}
                  onChange={(e) => setArmazemEndereco(e.target.value)}
                  className="w-full text-xs px-3 py-2 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500/40 outline-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* BARRA DE AÇÃO / SALVAMENTO */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#f58220] hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gravando Rastreabilidade...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Salvar Rastreabilidade</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* MODAIS DE CADASTRO RÁPIDO */}
      <CentralCadastrosModal
        isOpen={modalProdutorAberto}
        onClose={() => setModalProdutorAberto(false)}
        tipoInicial="PRODUTOR"
        onEntidadeSelecionada={handleProdutorCriado}
        modoSelecao={true}
      />

      <CentralCadastrosModal
        isOpen={modalArmazemAberto}
        onClose={() => setModalArmazemAberto(false)}
        tipoInicial="ARMAZEM"
        onEntidadeSelecionada={handleArmazemCriado}
        modoSelecao={true}
      />
    </div>
  );
}
