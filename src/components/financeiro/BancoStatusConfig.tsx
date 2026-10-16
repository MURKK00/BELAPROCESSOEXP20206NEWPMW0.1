"use client";

import { useState, useEffect } from 'react';
import { atualizarFinanceiroConfigAction } from '@/server/actions/financeiroActions';
import { parseRecebimentoProformaInfo, formatBancoDestinoWithProforma } from '@/lib/proformaHelper';
import { 
  Building, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  CreditCard, 
  ShieldCheck, 
  Split, 
  Wallet,
  AlertCircle,
  Percent,
  MinusCircle,
  Info,
  Lock
} from 'lucide-react';
import { formatUSD } from '@/lib/formatters';
import { canEditFinanceiro } from '@/lib/permissions';

interface Props {
  processoId: string;
  bancoInicial: string;
  statusInicial: string;
  dataRecebimentoInicial?: string | Date | null;
  valorTotalUsd?: number;
}

export function BancoStatusConfig({
  processoId,
  bancoInicial,
  statusInicial,
  dataRecebimentoInicial,
  valorTotalUsd = 0,
}: Props) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bela_user');
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
  }, []);

  const podeEditar = !currentUser || canEditFinanceiro(currentUser);

  // Extrai informações persistidas de pro-forma, taxas e banco
  const infoInicial = parseRecebimentoProformaInfo(
    bancoInicial,
    statusInicial,
    dataRecebimentoInicial,
    valorTotalUsd
  );

  const [bancoDestino, setBancoDestino] = useState(infoInicial.bancoLimpo || 'BB BRASIL');
  const [temProforma, setTemProforma] = useState(infoInicial.temProforma);

  // -------------------------------------------------------------
  // Parcela 1: Pro-forma / Entrada Antecipada
  // -------------------------------------------------------------
  const valorProformaPadrao = infoInicial.valorProformaBrutoUsd > 0
    ? infoInicial.valorProformaBrutoUsd
    : Number((valorTotalUsd * 0.2).toFixed(2));

  const [valorProformaBruto, setValorProformaBruto] = useState<number>(valorProformaPadrao);
  const [taxaProforma, setTaxaProforma] = useState<number>(infoInicial.taxaProformaUsd || 0);
  const [statusProforma, setStatusProforma] = useState<'A_RECEBER' | 'RECEBIDO'>(infoInicial.statusProforma);
  const [dataProforma, setDataProforma] = useState<string>(infoInicial.dataProforma || '');

  // -------------------------------------------------------------
  // Parcela 2: Saldo Restante / Pagamento Final
  // -------------------------------------------------------------
  const saldoBrutoCalculado = Math.max(0, valorTotalUsd - (temProforma ? valorProformaBruto : 0));
  const [taxaSaldo, setTaxaSaldo] = useState<number>(infoInicial.taxaSaldoUsd || 0);
  const [statusSaldo, setStatusSaldo] = useState<'A_RECEBER' | 'RECEBIDO'>(infoInicial.statusSaldo);
  const [dataSaldo, setDataSaldo] = useState<string>(infoInicial.dataSaldo || '');

  // -------------------------------------------------------------
  // Modo Pagamento Único (Sem entrada antecipada)
  // -------------------------------------------------------------
  const [valorUnicoBruto, setValorUnicoBruto] = useState<number>(infoInicial.valorUnicoBrutoUsd > 0 ? infoInicial.valorUnicoBrutoUsd : valorTotalUsd);
  const [taxaUnico, setTaxaUnico] = useState<number>(infoInicial.taxaUnicoUsd || 0);
  const [statusUnico, setStatusUnico] = useState<'A_RECEBER' | 'RECEBIDO'>(infoInicial.statusUnico);
  const [dataUnico, setDataUnico] = useState<string>(infoInicial.dataUnico || '');

  const [salvando, setSalvando] = useState(false);
  const [salvoFeedback, setSalvoFeedback] = useState(false);

  // Cálculos dinâmicos de valores líquidos (Bruto - Taxa do Recebimento)
  const proformaLiquido = Math.max(0, valorProformaBruto - taxaProforma);
  const saldoLiquido = Math.max(0, saldoBrutoCalculado - taxaSaldo);
  const unicoLiquido = Math.max(0, valorUnicoBruto - taxaUnico);

  const totalBrutoOperacao = temProforma ? valorProformaBruto + saldoBrutoCalculado : valorUnicoBruto;
  const totalTaxasOperacao = temProforma ? taxaProforma + taxaSaldo : taxaUnico;
  const totalLiquidoOperacao = temProforma ? proformaLiquido + saldoLiquido : unicoLiquido;

  async function handleSalvar(customOverrides?: Partial<{
    banco: string;
    proformaAtiva: boolean;
    valProformaBruto: number;
    txProforma: number;
    stProforma: 'A_RECEBER' | 'RECEBIDO';
    dtProforma: string | null;
    txSaldo: number;
    stSaldo: 'A_RECEBER' | 'RECEBIDO';
    dtSaldo: string | null;
    valUnicoBruto: number;
    txUnico: number;
    stUnico: 'A_RECEBER' | 'RECEBIDO';
    dtUnico: string | null;
  }>) {
    if (!podeEditar) return;
    setSalvando(true);
    setSalvoFeedback(false);

    const b = customOverrides?.banco ?? bancoDestino;
    const isProforma = customOverrides?.proformaAtiva ?? temProforma;
    
    // Proforma
    const vProfBruto = customOverrides?.valProformaBruto ?? valorProformaBruto;
    const txProf = customOverrides?.txProforma ?? taxaProforma;
    const stProf = customOverrides?.stProforma ?? statusProforma;
    let dtProf = customOverrides?.dtProforma !== undefined ? customOverrides.dtProforma : dataProforma;

    // Saldo
    const txSal = customOverrides?.txSaldo ?? taxaSaldo;
    const stSal = customOverrides?.stSaldo ?? statusSaldo;
    let dtSal = customOverrides?.dtSaldo !== undefined ? customOverrides.dtSaldo : dataSaldo;
    const vSalBruto = Math.max(0, valorTotalUsd - (isProforma ? vProfBruto : 0));

    // Único
    const vUniBruto = customOverrides?.valUnicoBruto ?? valorUnicoBruto;
    const txUni = customOverrides?.txUnico ?? taxaUnico;
    const stUni = customOverrides?.stUnico ?? statusUnico;
    let dtUni = customOverrides?.dtUnico !== undefined ? customOverrides.dtUnico : dataUnico;

    const hoje = new Date().toISOString().split('T')[0];

    // Se marcou como recebido e não tinha data, preenche hoje automaticamente
    if (isProforma) {
      if (stProf === 'RECEBIDO' && !dtProf) {
        dtProf = hoje;
        setDataProforma(hoje);
      }
      if (stSal === 'RECEBIDO' && !dtSal) {
        dtSal = hoje;
        setDataSaldo(hoje);
      }
    } else {
      if (stUni === 'RECEBIDO' && !dtUni) {
        dtUni = hoje;
        setDataUnico(hoje);
      }
    }

    const bancoComTag = formatBancoDestinoWithProforma(b, {
      temProforma: isProforma,
      valorProformaBrutoUsd: vProfBruto,
      taxaProformaUsd: txProf,
      statusProforma: stProf,
      dataProforma: dtProf,
      valorSaldoBrutoUsd: vSalBruto,
      taxaSaldoUsd: txSal,
      statusSaldo: stSal,
      dataSaldo: dtSal,
      valorUnicoBrutoUsd: vUniBruto,
      taxaUnicoUsd: txUni,
      statusUnico: stUni,
      dataUnico: dtUni,
    });

    let statusGeral = 'A_RECEBER';
    let dataFinalRecebimento: string | null = null;

    if (isProforma) {
      if (stProf === 'RECEBIDO' && stSal === 'RECEBIDO') {
        statusGeral = 'RECEBIDO';
        dataFinalRecebimento = dtSal || dtProf || hoje;
      } else if (stProf === 'RECEBIDO') {
        statusGeral = 'A_RECEBER';
        dataFinalRecebimento = dtProf;
      } else {
        statusGeral = 'A_RECEBER';
        dataFinalRecebimento = null;
      }
    } else {
      statusGeral = stUni;
      dataFinalRecebimento = stUni === 'RECEBIDO' ? (dtUni || hoje) : null;
    }

    try {
      await atualizarFinanceiroConfigAction(processoId, {
        bancoDestino: bancoComTag,
        statusRecebimento: statusGeral,
        dataRecebimento: dataFinalRecebimento,
      });
      setSalvoFeedback(true);
      setTimeout(() => setSalvoFeedback(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar configuração financeira:', err);
    } finally {
      setSalvando(false);
    }
  }

  function handleSetPercentual(pct: number) {
    if (valorTotalUsd <= 0) return;
    const calc = Number(((valorTotalUsd * pct) / 100).toFixed(2));
    setValorProformaBruto(calc);
    handleSalvar({ valProformaBruto: calc });
  }

  const isBBAmerica = bancoDestino === 'BB AMERICA';

  return (
    <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
      {!podeEditar && (
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Modo Visualização: Alterações de conta bancária, parcelamento pro-forma e recebimentos são restritas aos perfis <strong>Financeiro</strong>, <strong>Diretoria</strong> e <strong>ADMIN</strong>.</span>
        </div>
      )}
      
      {/* LINHA SUPERIOR: BANCO DE DESTINO E MODALIDADE DE RECEBIMENTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* BANCO DE DESTINO */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#f58220]" /> 
            Banco de Destino da Liquidação
          </label>

          <select 
            value={bancoDestino}
            disabled={!podeEditar}
            onChange={(e) => {
              if (!podeEditar) return;
              const val = e.target.value;
              setBancoDestino(val);
              handleSalvar({ banco: val });
            }}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-semibold outline-none transition-colors shadow-2xs ${
              podeEditar ? 'border-gray-300 bg-white cursor-pointer focus:border-[#f58220]' : 'border-gray-200 bg-gray-100/70 text-gray-500 cursor-not-allowed'
            }`}
          >
            <option value="BB BRASIL">Banco do Brasil</option>
            <option value="BB AMERICA">BB América</option>
          </select>
        </div>

        {/* SELETOR DE MODALIDADE: COM ENTRADA PRO-FORMA VS PAGAMENTO ÚNICO */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Split className="w-4 h-4 text-blue-600" /> Condição de Pagamento do Contrato
            </label>
            {salvando ? (
              <span className="text-xs text-orange-600 font-bold animate-pulse">Salvando...</span>
            ) : salvoFeedback ? (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Salvo!
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTemProforma(false);
                handleSalvar({ proformaAtiva: false });
              }}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                !temProforma
                  ? 'bg-white border-[#f58220] text-slate-900 shadow-2xs ring-2 ring-[#f58220]/20 font-bold'
                  : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wallet className={`w-4 h-4 ${!temProforma ? 'text-[#f58220]' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">Pagamento Único</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Sem sinal antecipado</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTemProforma(true);
                handleSalvar({ proformaAtiva: true });
              }}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                temProforma
                  ? 'bg-white border-blue-600 text-slate-900 shadow-2xs ring-2 ring-blue-600/20 font-bold'
                  : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className={`w-4 h-4 ${temProforma ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">Com Entrada Pro-forma</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Entrada + Saldo restante</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CENÁRIO 1: MODALIDADE COM ENTRADA PRO-FORMA (2 PARCELAS) */}
      {/* ============================================================== */}
      {temProforma ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* CARD DA PARCELA 1: ENTRADA / SINAL PRO-FORMA */}
            <div className={`p-5 rounded-2xl border transition-all ${
              statusProforma === 'RECEBIDO' 
                ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs' 
                : 'bg-amber-50/70 border-amber-300 shadow-2xs'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/80 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider bg-white border border-gray-200 text-slate-700">
                    Parcela 1
                  </span>
                  <h4 className="text-xs font-extrabold uppercase text-slate-900">
                    Entrada Pro-forma (Advance)
                  </h4>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  statusProforma === 'RECEBIDO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {statusProforma === 'RECEBIDO' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                  {statusProforma === 'RECEBIDO' ? 'Recebido' : 'Aguardando Entrada'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* VALOR BRUTO & TAXA DO RECEBIMENTO */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                      Valor Bruto Entrada ($):
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 select-none text-xs">
                        $
                      </span>
                      <input 
                        type="number"
                        step="0.01"
                        value={valorProformaBruto || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setValorProformaBruto(val);
                        }}
                        onBlur={() => handleSalvar({ valProformaBruto: valorProformaBruto })}
                        placeholder="0.00"
                        className="w-full bg-white border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 font-bold text-slate-900 text-xs outline-none focus:border-[#f58220] shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1 text-red-700 flex items-center gap-1">
                      <MinusCircle className="w-3 h-3 text-red-500" /> Taxa Bancária ($):
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-red-400 select-none text-xs">
                        $
                      </span>
                      <input 
                        type="number"
                        step="0.01"
                        value={taxaProforma || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setTaxaProforma(val);
                        }}
                        onBlur={() => handleSalvar({ txProforma: taxaProforma })}
                        placeholder="0.00"
                        className="w-full bg-white border border-red-200 rounded-lg pl-6 pr-2 py-1.5 font-bold text-red-600 text-xs outline-none focus:border-red-400 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* DESTAQUE DO VALOR LÍQUIDO CREDITADO */}
                <div className="bg-white/90 border border-emerald-300 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                      Líquido Efetivamente Creditado:
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Bruto ({formatUSD(valorProformaBruto)}) - Taxa ({formatUSD(taxaProforma)})
                    </span>
                  </div>
                  <span className="text-base font-black text-emerald-700">
                    {formatUSD(proformaLiquido)}
                  </span>
                </div>

                {/* ATALHOS RÁPIDOS DE PERCENTUAL */}
                {valorTotalUsd > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Atalhos:</span>
                    {[10, 20, 30, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleSetPercentual(pct)}
                        className="px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-[10px] font-bold rounded shadow-2xs cursor-pointer transition-colors"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                )}

                {/* STATUS DA PRO-FORMA */}
                <div>
                  <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                    Status do Recebimento da Entrada:
                  </label>
                  <select
                    value={statusProforma}
                    onChange={(e) => {
                      const st = e.target.value as 'A_RECEBER' | 'RECEBIDO';
                      setStatusProforma(st);
                      handleSalvar({ stProforma: st });
                    }}
                    className={`w-full border rounded-lg px-3 py-1.5 font-bold text-xs outline-none shadow-2xs cursor-pointer ${
                      statusProforma === 'RECEBIDO' 
                        ? 'bg-white border-emerald-400 text-emerald-900' 
                        : 'bg-white border-amber-400 text-amber-900'
                    }`}
                  >
                    <option value="A_RECEBER">⏳ Aguardando Recebimento da Entrada</option>
                    <option value="RECEBIDO">✓ Entrada Pro-forma Recebida</option>
                  </select>
                </div>

                {/* DATA DO RECEBIMENTO DA ENTRADA PRO-FORMA */}
                <div>
                  <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Data do Recebimento da Entrada:
                  </label>
                  <input
                    type="date"
                    value={dataProforma}
                    onChange={(e) => {
                      const dt = e.target.value;
                      setDataProforma(dt);
                      handleSalvar({ dtProforma: dt });
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#f58220] shadow-2xs cursor-pointer"
                  />
                  {statusProforma === 'RECEBIDO' && dataProforma && (
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                      Entrada creditada em {new Date(dataProforma + 'T12:00:00Z').toLocaleDateString('pt-BR')}.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CARD DA PARCELA 2: SALDO RESTANTE / PAGAMENTO FINAL */}
            <div className={`p-5 rounded-2xl border transition-all ${
              statusSaldo === 'RECEBIDO' 
                ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs' 
                : 'bg-blue-50/70 border-blue-300 shadow-2xs'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/80 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider bg-white border border-gray-200 text-slate-700">
                    Parcela 2
                  </span>
                  <h4 className="text-xs font-extrabold uppercase text-slate-900">
                    Saldo Restante (Balance)
                  </h4>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  statusSaldo === 'RECEBIDO' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {statusSaldo === 'RECEBIDO' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-blue-600" />}
                  {statusSaldo === 'RECEBIDO' ? 'Quitado' : 'Aguardando Saldo'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* VALOR BRUTO DO SALDO & TAXA DO RECEBIMENTO */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                      Valor Bruto Saldo ($):
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 select-none text-xs">
                        $
                      </span>
                      <input 
                        type="text"
                        disabled
                        value={saldoBrutoCalculado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        className="w-full bg-slate-100 border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 font-bold text-slate-800 text-xs outline-none cursor-not-allowed shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1 text-red-700 flex items-center gap-1">
                      <MinusCircle className="w-3 h-3 text-red-500" /> Taxa Bancária ($):
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-red-400 select-none text-xs">
                        $
                      </span>
                      <input 
                        type="number"
                        step="0.01"
                        value={taxaSaldo || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setTaxaSaldo(val);
                        }}
                        onBlur={() => handleSalvar({ txSaldo: taxaSaldo })}
                        placeholder="0.00"
                        className="w-full bg-white border border-red-200 rounded-lg pl-6 pr-2 py-1.5 font-bold text-red-600 text-xs outline-none focus:border-red-400 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* DESTAQUE DO VALOR LÍQUIDO DO SALDO */}
                <div className="bg-white/90 border border-emerald-300 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                      Líquido Efetivamente Creditado:
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Bruto ({formatUSD(saldoBrutoCalculado)}) - Taxa ({formatUSD(taxaSaldo)})
                    </span>
                  </div>
                  <span className="text-base font-black text-emerald-700">
                    {formatUSD(saldoLiquido)}
                  </span>
                </div>

                {/* STATUS DO SALDO */}
                <div>
                  <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                    Status do Recebimento do Saldo:
                  </label>
                  <select
                    value={statusSaldo}
                    onChange={(e) => {
                      const st = e.target.value as 'A_RECEBER' | 'RECEBIDO';
                      setStatusSaldo(st);
                      handleSalvar({ stSaldo: st });
                    }}
                    className={`w-full border rounded-lg px-3 py-1.5 font-bold text-xs outline-none shadow-2xs cursor-pointer ${
                      statusSaldo === 'RECEBIDO' 
                        ? 'bg-white border-emerald-400 text-emerald-900' 
                        : 'bg-white border-blue-400 text-blue-900'
                    }`}
                  >
                    <option value="A_RECEBER">⏳ Aguardando Liquidação do Saldo</option>
                    <option value="RECEBIDO">✓ Saldo Restante Quitado</option>
                  </select>
                </div>

                {/* DATA DO RECEBIMENTO DO SALDO */}
                <div>
                  <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Data do Recebimento do Saldo:
                  </label>
                  <input
                    type="date"
                    value={dataSaldo}
                    onChange={(e) => {
                      const dt = e.target.value;
                      setDataSaldo(dt);
                      handleSalvar({ dtSaldo: dt });
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#f58220] shadow-2xs cursor-pointer"
                  />
                  {statusSaldo === 'RECEBIDO' && dataSaldo && (
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                      Saldo creditado em {new Date(dataSaldo + 'T12:00:00Z').toLocaleDateString('pt-BR')}.
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* BARRA INFORMATIVA DE STATUS CONSOLIDADO DO RECEBIMENTO */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
            statusProforma === 'RECEBIDO' && statusSaldo === 'RECEBIDO'
              ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-bold'
              : statusProforma === 'RECEBIDO'
              ? 'bg-teal-50 border-teal-300 text-teal-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <div className="flex items-center gap-2.5">
              {statusProforma === 'RECEBIDO' && statusSaldo === 'RECEBIDO' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <strong className="block text-sm">
                  {statusProforma === 'RECEBIDO' && statusSaldo === 'RECEBIDO'
                    ? '🎉 Contrato 100% Liquidado & Quitado!'
                    : statusProforma === 'RECEBIDO'
                    ? '⚡ Entrada Pro-forma Liquidada • Aguardando Saldo Final'
                    : '⏳ Aguardando Entrada Pro-forma do Comprador'}
                </strong>
                <span className="text-[11px] opacity-90 block mt-0.5">
                  • <strong>Total Líquido Efetivo:</strong> {formatUSD(totalLiquidoOperacao)} (Bruto: {formatUSD(totalBrutoOperacao)} | Taxas Bancárias Descontadas: {formatUSD(totalTaxasOperacao)})
                  {statusProforma === 'RECEBIDO' && dataProforma && (
                    <> • Entrada em {new Date(dataProforma + 'T12:00:00Z').toLocaleDateString('pt-BR')}</>
                  )}
                  {statusSaldo === 'RECEBIDO' && dataSaldo && (
                    <> • Saldo em {new Date(dataSaldo + 'T12:00:00Z').toLocaleDateString('pt-BR')}</>
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSalvar()}
              disabled={salvando}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
            >
              {salvando ? 'Salvando...' : 'Salvar Recebimentos & Taxas'}
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* CENÁRIO 2: PAGAMENTO ÚNICO COM VALOR BRUTO, TAXA E LÍQUIDO */
        /* ============================================================== */
        <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
            <div>
              <span className="text-xs font-bold uppercase text-slate-800 block">
                Liquidação do Pagamento Único
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                O valor total deste contrato será recebido integralmente em uma única ordem internacional.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select 
                value={statusUnico}
                onChange={(e) => {
                  const novoStatus = e.target.value as 'A_RECEBER' | 'RECEBIDO';
                  setStatusUnico(novoStatus);
                  handleSalvar({ stUnico: novoStatus });
                }}
                className={`border rounded-lg px-3 py-2 text-xs font-bold outline-none shadow-2xs cursor-pointer ${
                  statusUnico === 'RECEBIDO' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                <option value="A_RECEBER">⏳ A Receber</option>
                <option value="RECEBIDO">✓ 100% Recebido</option>
              </select>

              {statusUnico === 'RECEBIDO' && (
                <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <input
                    type="date"
                    value={dataUnico}
                    onChange={(e) => {
                      const dt = e.target.value;
                      setDataUnico(dt);
                      handleSalvar({ dtUnico: dt });
                    }}
                    className="bg-transparent text-xs font-bold text-emerald-950 outline-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* CAMPOS DE BRUTO, TAXA E LÍQUIDO EFETIVO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Valor Bruto a Receber ($):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 select-none text-xs">
                  $
                </span>
                <input 
                  type="number"
                  step="0.01"
                  value={valorUnicoBruto || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setValorUnicoBruto(val);
                  }}
                  onBlur={() => handleSalvar({ valUnicoBruto: valorUnicoBruto })}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-[#f58220] shadow-2xs"
                  placeholder="22500.00"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-red-700 uppercase block mb-1 flex items-center gap-1">
                <MinusCircle className="w-3.5 h-3.5 text-red-500" /> Taxa Bancária / Swift ($):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-red-400 select-none text-xs">
                  $
                </span>
                <input 
                  type="number"
                  step="0.01"
                  value={taxaUnico || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setTaxaUnico(val);
                  }}
                  onBlur={() => handleSalvar({ txUnico: taxaUnico })}
                  className="w-full bg-white border border-red-300 rounded-lg pl-7 pr-3 py-2 text-sm font-bold text-red-600 outline-none focus:border-red-400 shadow-2xs"
                  placeholder="10.00"
                />
              </div>
            </div>

            {/* VALOR LÍQUIDO FINAL COM DESTAQUE */}
            <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                  Valor Líquido Efetivamente Creditado:
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {formatUSD(valorUnicoBruto)} - {formatUSD(taxaUnico)}
                </span>
              </div>
              <span className="text-xl font-black text-emerald-900 mt-1">
                {formatUSD(unicoLiquido)}
              </span>
            </div>
          </div>

          {statusUnico === 'RECEBIDO' ? (
            <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold pt-1 border-t border-emerald-200/50">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" /> 
              {dataUnico 
                ? `Pagamento integral liquidado em ${new Date(dataUnico + 'T12:00:00Z').toLocaleDateString('pt-BR')}. Crédito líquido de ${formatUSD(unicoLiquido)}.`
                : `Pagamento marcado como recebido com crédito líquido de ${formatUSD(unicoLiquido)}.`}
            </p>
          ) : (
            <p className="text-[11px] text-amber-700 flex items-center gap-1 pt-1 border-t border-amber-200/50">
              <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" /> Aguardando liquidação da ordem de pagamento no exterior.
            </p>
          )}
        </div>
      )}

    </div>
  );
}
