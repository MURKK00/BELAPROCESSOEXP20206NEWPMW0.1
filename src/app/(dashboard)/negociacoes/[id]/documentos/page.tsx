import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { DocumentosCockpit } from '@/components/documentos/DocumentosCockpit';
import { parseCompradorInfo } from '@/lib/compradorHelper';
import { 
  FileText, 
  Tag, 
  Landmark, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  FileCheck2,
  Clock,
  Printer
} from 'lucide-react';

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [tipos, processo] = await Promise.all([
    prisma.tipoDocumento.findMany({ orderBy: { nome: 'asc' } }),
    prisma.processo.findUnique({
      where: { id },
      include: {
        documentos: {
          include: { tipoDocumento: true, uploadedBy: true },
          orderBy: { uploadedEm: 'desc' },
        },
      },
    }),
  ]);

  if (!processo) notFound();

  // Informações do Comprador e Banco de Destino
  const { comprador, bancoComprador } = parseCompradorInfo(processo.complementoBuyer);
  const temProforma = Boolean(bancoComprador.temProforma);
  const bancoConfigurado = Boolean(bancoComprador.nomeBanco?.trim());

  // Cálculo de valor USD
  const valDeclarado = processo.valorDeclaradoUsd ? Number(processo.valorDeclaradoUsd) : 0;
  const volKg = processo.volumeKg ? Number(processo.volumeKg) : 0;
  let valorTotalUsd = 0;
  if (valDeclarado > 0) {
    if (valDeclarado < 5000 && volKg > 0) {
      valorTotalUsd = (volKg / 1000) * valDeclarado;
    } else {
      valorTotalUsd = valDeclarado;
    }
  }

  const formatUSD = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const serializedDocs = (processo.documentos || []).map((d: any) => ({
    id: d.id,
    processoId: d.processoId,
    tipoDocumentoId: d.tipoDocumentoId,
    tipoDocumento: {
      id: d.tipoDocumento?.id || 'td_unknown',
      nome: d.tipoDocumento?.nome || 'Documento',
      categoria: d.tipoDocumento?.categoria || 'DOCUMENTACAO_EXPORTACAO',
      obrigatorioNoPacoteFinal: Boolean(d.tipoDocumento?.obrigatorioNoPacoteFinal),
    },
    nomeArquivo: d.nomeArquivo || d.nome || 'arquivo.pdf',
    storagePath: d.storagePath || d.url || '/uploads/docs/arquivo.pdf',
    versao: d.versao || 1,
    status: d.status || 'EMITIDO_FINAL',
    uploadedEm: d.uploadedEm ? (typeof d.uploadedEm === 'string' ? d.uploadedEm : d.uploadedEm.toISOString()) : new Date().toISOString(),
    uploadedById: d.uploadedById || 'usr_dev_admin',
    uploadedBy: {
      id: d.uploadedBy?.id || 'usr_dev_admin',
      nome: d.uploadedBy?.nome || 'Admin (Dev)',
      email: d.uploadedBy?.email || 'dev@belacereais.local',
    },
    descricaoOutro: d.descricaoOutro || null,
  }));

  const serializedTipos = tipos.map((t) => ({
    id: t.id,
    nome: t.nome,
    categoria: t.categoria,
    obrigatorioNoPacoteFinal: t.obrigatorioNoPacoteFinal,
  }));

  return (
    <div className="space-y-8">
      {/* SEÇÃO EM DESTAQUE: GERADOR OFICIAL DE DOCUMENTOS DE EXPORTAÇÃO */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        {/* Detalhe de fundo decorativo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  Emissão Imediata
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  Processo {processo.numeroProcesso}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                Gerador de Documentos Oficiais da Negociação
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                Emita em tempo real os documentos operacionais, etiquetas de sacaria e a <strong>Carta Borderô</strong> bancária com todos os dados sincronizados do contrato.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Cliente: <strong className="text-white">{processo.clienteFinal}</strong>
              </span>
            </div>
          </div>

          {/* GRID COM OS 3 CARDS EM ALTA EVIDÊNCIA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 items-stretch">
            
            {/* 1. INSTRUÇÃO DE EMBARQUE */}
            <div className="bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-emerald-500/50 rounded-xl p-4 transition-all flex flex-col justify-between h-full group">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
                    Operacional
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                  Instrução de Embarque
                </h3>
                <p className="text-[11px] text-slate-300 mt-1 h-9 line-clamp-2 leading-relaxed">
                  Dados de estufagem, armador ({processo.armador || 'ONE'}), contêineres, lacres, consignatário e exportador.
                </p>

                <div className="mt-3 p-2 rounded-lg bg-black/25 border border-white/5 flex items-center justify-between text-[11px] text-slate-300">
                  <span className="truncate">Armador: <strong className="text-white">{processo.armador || 'N/D'}</strong></span>
                  <span className="shrink-0 pl-2">Ctns: <strong className="text-white">{processo.containerQtd || 0}</strong></span>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-white/5">
                <a
                  href={`/instrucao-embarque/${processo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Gerar Instrução</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 2. ETIQUETAS DE SACARIA */}
            <div className="bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-amber-500/50 rounded-xl p-4 transition-all flex flex-col justify-between h-full group">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                    Identificação
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                  Etiquetas de Sacaria
                </h3>
                <p className="text-[11px] text-slate-300 mt-1 h-9 line-clamp-2 leading-relaxed">
                  Etiquetas térmicas com padrão oficial: produto, safra, lote, tara, peso e comprador.
                </p>

                <div className="mt-3 p-2 rounded-lg bg-black/25 border border-white/5 flex items-center justify-between text-[11px] text-slate-300">
                  <span className="truncate">Produto: <strong className="text-white">{processo.produto || 'Feijão'}</strong></span>
                  <span className="shrink-0 pl-2">Emb: <strong className="text-white">{processo.embalagemTipo || '30kg'}</strong></span>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-white/5">
                <a
                  href={`/etiquetas/${processo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Gerar Etiquetas</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 3. CARTA BORDERÔ (COBRANÇA CAD) */}
            <div className="bg-white/5 hover:bg-white/[0.08] border border-orange-500/60 hover:border-orange-400 rounded-xl p-4 transition-all flex flex-col justify-between h-full group">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 shrink-0">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500 text-slate-950">
                      Novo
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      bancoConfigurado 
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      {bancoConfigurado ? 'Banco OK' : 'Banco Pendente'}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors truncate">
                  Carta Borderô (Cobrança CAD)
                </h3>
                <p className="text-[11px] text-slate-300 mt-1 h-9 line-clamp-2 leading-relaxed">
                  Carta ao Banco do Brasil para abertura de saque CAD com 9 documentos, courier e juros.
                </p>

                <div className="mt-3 p-2 rounded-lg bg-black/25 border border-white/5 flex items-center justify-between text-[11px] text-slate-300">
                  <span className="truncate">Mod: <strong className="text-white">{temProforma ? 'Com Pro-forma' : '100% CAD'}</strong></span>
                  <span className="shrink-0 pl-2">Total: <strong className="text-emerald-300 font-mono">U$ {formatUSD(valorTotalUsd)}</strong></span>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-white/5">
                <a
                  href={`/carta-bordero/${processo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs transition-colors shadow-sm cursor-pointer"
                >
                  <Landmark className="w-3.5 h-3.5 text-slate-950" />
                  <span>Gerar Carta Borderô</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* SEÇÃO GED E COCKPIT DE DOCUMENTOS EXISTENTE */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Dossiê GED — Arquivos & Comprovantes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload, controle de versões e checklist dos documentos do processo {processo.numeroProcesso}.
          </p>
        </div>

        <DocumentosCockpit
          processo={{
            id: processo.id,
            numeroProcesso: processo.numeroProcesso,
            clienteFinal: processo.clienteFinal,
            enderecoBuyer: processo.enderecoBuyer,
          }}
          tipos={serializedTipos}
          documentosIniciais={serializedDocs}
        />
      </div>
    </div>
  );
}
