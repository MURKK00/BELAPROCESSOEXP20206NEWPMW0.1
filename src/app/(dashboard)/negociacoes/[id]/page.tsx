import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { InfoOperacaoCard } from '@/components/negociacoes/InfoOperacaoCard';
import { DeadlinesPrazosCard } from '@/components/negociacoes/DeadlinesPrazosCard';
import { CicloOperacionalMarcosBox } from '@/components/negociacoes/CicloOperacionalMarcosBox';
import { 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';
import { isImportadorPendente } from '@/lib/compradorHelper';

export default async function VisaoGeralNegociacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: { 
      produtor: true,
      importador: true,
      etapas: { include: { etapaTemplate: true } },
      containers: true,
      documentos: { include: { tipoDocumento: true } },
      notasFiscais: true,
      financeiro: {
        include: {
          travamentos: true,
          custos: true,
        },
      },
    },
  });

  if (!processo) notFound();

  const pendenteImportador = isImportadorPendente(processo);
  const isEmbarcado = processo.status === 'EMBARCADO' || processo.status === 'FINALIZADO';

  const etapasFormatadas = processo.etapas.map((e) => ({
    id: e.id,
    status: e.status,
    fase: e.etapaTemplate?.fase || 'COMERCIAL',
    etapa: e.etapaTemplate?.etapa || 'Etapa',
  }));

  return (
    <div className="space-y-6">
      
      {/* 1. CICLO OPERACIONAL & MARCOS COM CHECKLIST RESPONSIVO E EDIÇÃO COMPLETA */}
      <CicloOperacionalMarcosBox
        processo={processo}
        etapas={etapasFormatadas}
      />

      {/* 2. ALERTA CRÍTICO DE DADOS DO IMPORTADOR (QUANDO PENDENTE) */}
      {pendenteImportador && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/30 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Dados do Importador (Buyer) Pendentes
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Cadastre o endereço, IEC/Tax ID e dados de faturamento para liberar a emissão do contrato e minutas de BL.
                </p>
              </div>
            </div>
            <Link
              href={`/negociacoes/${id}/importador`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-sm hover:scale-[1.01]"
            >
              <UserCheck className="w-4 h-4" />
              <span>Preencher Importador &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* 3. CARD DE DEADLINES & PRAZOS LIMITES DA CARGA COM BOTÃO DE EDIÇÃO */}
      <DeadlinesPrazosCard
        processoId={processo.id}
        deadlineDraftBl={processo.deadlineDraftBl}
        deadlineDraftVgm={processo.deadlineDraftVgm}
        deadlineCarga={processo.deadlineCarga}
        deadlineEmbarque={processo.deadlineEmbarque}
        navio={processo.navio}
        bookingNumero={processo.bookingNumero}
        isEmbarcado={isEmbarcado}
      />

      {/* 4. FICHA TÉCNICA DA OPERAÇÃO (LARGURA TOTAL E SEÇÕES ESTRUTURADAS) */}
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

    </div>
  );
}
