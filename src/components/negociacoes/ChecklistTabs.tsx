'use client';

import { useState } from 'react';
import { marcarEtapaAction } from '@/server/actions/etapaActions';

const FASE_LABEL: Record<string, string> = {
  COMERCIAL: 'Comercial',
  PRODUTOR_VENDEDOR: 'Produtor/Vendedor',
  ADMINISTRATIVO: 'Administrativo',
  INDUSTRIA_BENEFICIAMENTO: 'Indústria de Beneficiamento',
  BOOKING_TRANSPORTE: 'Booking / Transporte Internacional',
  CARREGAMENTO: 'Carregamento',
  CARREGAMENTO_REDEX: 'Carregamento e REDEX',
  DOCUMENTACAO_EXPORTACAO: 'Documentos Emitidos',
  TERMINAL_PORTO: 'Terminal/Porto',
  FECHAMENTO_BANCARIO: 'Fechamento Bancário/Documental',
};

type EtapaSimplificada = {
  id: string;
  status: string;
  fase: string;
  etapa: string;
};

export function ChecklistTabs({
  processoId,
  fases,
  etapas,
}: {
  processoId: string;
  fases: string[];
  etapas: EtapaSimplificada[];
}) {
  const [activeTab, setActiveTab] = useState(fases[0]);

  // Filtra as etapas para mostrar apenas as da aba clicada
  const etapasDaFase = etapas.filter((e) => e.fase === activeTab);

  return (
    <div>
      {/* Navegação das Mini Abas - Usando flex-wrap para quebra automática inteligente */}
      <div className="flex flex-wrap gap-2 mb-6">
        {fases.map((fase) => {
          const isActive = activeTab === fase;
          
          // LÓGICA DO CONTADOR: Calcula concluídas vs total desta aba
          const etapasFaseAtual = etapas.filter((e) => e.fase === fase);
          const total = etapasFaseAtual.length;
          const concluidas = etapasFaseAtual.filter((e) => e.status === 'CONCLUIDA').length;
          const todasConcluidas = total > 0 && concluidas === total;

          return (
            <button
              key={fase}
              onClick={() => setActiveTab(fase)}
              // Removido o bloqueio de quebra. Ajustado padding para ficar mais compacto.
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg border transition-all ${
                isActive
                  ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <span>{FASE_LABEL[fase] ?? fase}</span>
              
              {/* MINI PREVIEW (Contador) */}
              <span 
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                  todasConcluidas 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : isActive 
                      ? 'bg-blue-200 text-blue-800' 
                      : 'bg-gray-100 text-gray-500' 
                }`}
              >
                {concluidas}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Caixa Única de Conteúdo */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">
            {FASE_LABEL[activeTab] ?? activeTab}
          </h3>
        </div>
        
        <ul className="space-y-2">
          {etapasDaFase.map((e) => {
            const done = e.status === 'CONCLUIDA';
            return (
              <li key={e.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                <form action={marcarEtapaAction}>
                  <input type="hidden" name="etapaId" value={e.id} />
                  <input type="hidden" name="processoId" value={processoId} />
                  <input type="hidden" name="novoStatus" value={done ? 'PENDENTE' : 'CONCLUIDA'} />
                  <button
                    type="submit"
                    className={`w-6 h-6 flex-shrink-0 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                      done ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-300 hover:border-blue-500 bg-white'
                    }`}
                  >
                    {done && <span className="text-sm font-bold">✓</span>}
                  </button>
                </form>
                <span className={`text-base font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {e.etapa}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}