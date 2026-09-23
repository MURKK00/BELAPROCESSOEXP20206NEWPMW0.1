import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { InfoOperacaoCard } from '@/components/negociacoes/InfoOperacaoCard';
import { ResumoTopoCard } from '@/components/negociacoes/ResumoTopoCard';
import { Ship, DollarSign, Container, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

const FASES_STATUS: { fase: string; label: string }[] = [
  { fase: 'BOOKING_TRANSPORTE', label: 'Booking / Transporte Internacional' },
  { fase: 'ADMINISTRATIVO', label: 'Administrativo' },
  { fase: 'CARREGAMENTO_REDEX', label: 'Carregamento e REDEX' },
  { fase: 'DOCUMENTACAO_EXPORTACAO', label: 'Documentos' },
  { fase: 'FECHAMENTO_BANCARIO', label: 'Fechamento Bancário/Documental' },
];

export default async function VisaoGeralNegociacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: { 
      etapas: { include: { etapaTemplate: true } },
      containers: true,
      financeiro: {
        include: {
          travamentos: true,
          custos: true,
        },
      },
    },
  });

  if (!processo) notFound();

  const pendentesPorFase = FASES_STATUS.map((f) => {
    const etapasDaFase = processo.etapas.filter((e) => e.etapaTemplate.fase === f.fase);
    const pendentes = etapasDaFase.filter((e) => e.status !== 'CONCLUIDA').length;
    
    return {
      ...f,
      pendentes,
      total: etapasDaFase.length,
    };
  });

  // Métricas rápidas para os cards integrados do Cockpit 360
  const fin = processo.financeiro;
  const volumeKg = Number(processo.volumeKg);
  const precoUsd = fin ? Number(fin.precoUsd) : (processo.valorDeclaradoUsd ? Number(processo.valorDeclaradoUsd) : 0);
  const pesoRealKg = processo.containers.reduce((acc, c) => acc + (c.pesoLiquido ? Number(c.pesoLiquido) : 0), 0);
  const pesoFinalKg = pesoRealKg > 0 ? pesoRealKg : volumeKg;
  const pesoFinalTon = pesoFinalKg / 1000;
  const valorTotalUsd = pesoFinalTon * precoUsd;

  const travamentos = fin?.travamentos || [];
  const totalUsdTravado = travamentos.reduce((acc, t) => acc + Number(t.valorUsdParcial), 0);
  const saldoUsdParaTravar = Math.max(0, valorTotalUsd - totalUsdTravado);
  let somatorioReais = 0;
  for (const t of travamentos) {
    somatorioReais += Number(t.valorUsdParcial) * Number(t.ptax);
  }
  const ptaxMedia = totalUsdTravado > 0 ? somatorioReais / totalUsdTravado : 0;
  const receitaBrutaBRL = totalUsdTravado * ptaxMedia;
  const custos = fin?.custos || [];
  const totalCustosBRL = custos.reduce((acc, c) => acc + Number(c.valor), 0);
  const resultadoBRL = receitaBrutaBRL - totalCustosBRL;
  const margem = receitaBrutaBRL > 0 ? (resultadoBRL / receitaBrutaBRL) * 100 : 0;

  const containersPreenchidos = processo.containers.filter((c) => Boolean(c.numeroContainer?.trim())).length;

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6">
      
      {/* CARD COMPACTO EDITÁVEL DE LOGÍSTICA (BOOKING, NAVIO, ESTUFAGEM, 3 DEADLINES) */}
      <ResumoTopoCard
        processoId={processo.id}
        bookingNumero={processo.bookingNumero ?? ''}
        navio={processo.navio ?? ''}
        estufagemInicio={processo.estufagemInicio ? processo.estufagemInicio.toISOString() : null}
        estufagemFim={processo.estufagemFim ? processo.estufagemFim.toISOString() : null}
        deadlineEmbarque={processo.deadlineEmbarque ? processo.deadlineEmbarque.toISOString() : null}
        deadlineDraftBl={processo.deadlineDraftBl ? processo.deadlineDraftBl.toISOString() : null}
        deadlineDraftVgm={processo.deadlineDraftVgm ? processo.deadlineDraftVgm.toISOString() : null}
        deadlineCarga={processo.deadlineCarga ? processo.deadlineCarga.toISOString() : null}
      />

      {/* 3 CARDS DE ATALHO RÁPIDO PARA O COCKPIT 360 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD FINANCEIRO */}
        <Link
          href={`/negociacoes/${id}/financeiro`}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs hover:border-secondary/50 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>DRE & Câmbio</span>
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-xl font-extrabold text-gray-900 mb-1">
            {formatBRL(resultadoBRL)}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Margem: <strong className={margem >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{margem.toFixed(1)}%</strong></span>
            <span>{saldoUsdParaTravar <= 0.01 ? '🔒 Câmbio 100%' : `⚠️ US$ ${Math.round(saldoUsdParaTravar).toLocaleString()} aberto`}</span>
          </div>
        </Link>

        {/* CARD CONTÊINERES */}
        <Link
          href={`/negociacoes/${id}/containers`}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs hover:border-secondary/50 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Container className="w-4 h-4 text-blue-600" />
              <span>Contêineres & Lacre</span>
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-xl font-extrabold text-gray-900 mb-1">
            {containersPreenchidos} de {processo.containerQtd || processo.containers.length || 0}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Tipo: <strong>{processo.containerTipo || "20' DRY"}</strong></span>
            <span>Peso: <strong>{(pesoFinalTon).toFixed(2)} t</strong></span>
          </div>
        </Link>

        {/* CARD DOCUMENTAÇÃO & INSTRUÇÃO */}
        <Link
          href={`/negociacoes/${id}/documentos`}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs hover:border-secondary/50 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-secondary" />
              <span>Documentos & Packing</span>
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-xl font-extrabold text-gray-900 mb-1">
            {processo.ruc ? 'RUC Gerada' : 'Pendente RUC'}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Free Time: <strong>{processo.freeTimeDestino || '14 dias'}</strong></span>
            <span className="text-secondary font-semibold">Emitir Docs →</span>
          </div>
        </Link>

      </div>

      {/* GRID INFERIOR: INFO OPERAÇÃO + CHECKLIST POR FASES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Informações da Operação ocupando 2 colunas */}
        <InfoOperacaoCard
          processoId={processo.id}
          clienteFinal={processo.clienteFinal}
          produto={processo.produto}
          volumeKg={Number(processo.volumeKg)}
          incoterm={processo.incoterm ?? 'FOB'}
          portoOrigem={processo.portoOrigem ?? ''}
          portoDestino={processo.portoDestino ?? ''}
          redex={processo.redex ?? ''}
          valorDeclaradoUsd={processo.valorDeclaradoUsd ? Number(processo.valorDeclaradoUsd) : null}
          containerQtd={processo.containerQtd}
          containerTipo={processo.containerTipo ?? "20' DRY"}
          sacasPorContainer={processo.sacasPorContainer}
          freeTimeDestino={processo.freeTimeDestino ?? ''}
          ruc={processo.ruc ?? ''}
          contratoInterno={processo.contratoInterno ?? ''}
        />

        {/* Status da Operação na coluna da direita */}
        <div className="lg:col-span-1 bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-2xs w-full">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-gray-900">Etapas do Checklist</h2>
            <Link 
              href={`/negociacoes/${id}/checklist`}
              className="text-xs font-semibold text-secondary hover:underline"
            >
              Abrir
            </Link>
          </div>
          <p className="text-xs text-gray-500 mb-5">Acompanhamento das 5 fases operacionais.</p>

          <div className="space-y-2.5 mb-5">
            {pendentesPorFase.map((f) => {
              const concluido = f.total > 0 && f.pendentes === 0;
              
              return (
                <div
                  key={f.fase}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 gap-3"
                >
                  <span className="text-xs font-semibold text-gray-700 truncate" title={f.label}>
                    {f.label}
                  </span>

                  {f.total === 0 ? (
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 uppercase">
                      Sem tarefas
                    </span>
                  ) : concluido ? (
                    <span className="text-[10px] font-bold bg-[#1A7A43]/10 text-[#1A7A43] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 uppercase">
                      Concluído
                    </span>
                  ) : (
                    <span className="text-xs font-bold bg-[#F58025]/10 text-[#c25e13] border border-[#F58025]/20 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      {f.pendentes}/{f.total} pend.
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <Link
            href={`/negociacoes/${id}/checklist`}
            className="block w-full text-center bg-gray-900 hover:bg-black text-white font-semibold text-xs py-2.5 rounded-lg transition-colors shadow-2xs"
          >
            Gerenciar Checklist Completo →
          </Link>
        </div>
      </div>
    </div>
  );
}