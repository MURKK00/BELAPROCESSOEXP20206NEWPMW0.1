"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from './StatusBadge';
import { formatDateBR } from '@/lib/formatters';
import { atualizarStatusAction } from '@/server/actions/editarProcessoAction';
import type { Processo, ProcessoEtapa } from '@prisma/client';

type ProcessoComEtapas = Processo & { etapas: ProcessoEtapa[] };

export function NegotiationTable({ processos }: { processos: ProcessoComEtapas[] }) {
  const router = useRouter();
  
  // Controle do nosso filtro: começa escondendo os cancelados (false)
  const [mostrarCancelados, setMostrarCancelados] = useState(false);

  // Filtra a lista com base no botão
  const processosFiltrados = mostrarCancelados
    ? processos 
    : processos.filter(p => p.status !== 'CANCELADO');

  // Função lixeira
  const handleCancelar = async (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar esta negociação?')) {
      const formData = new FormData();
      formData.set('processoId', id);
      formData.set('status', 'CANCELADO');
      await atualizarStatusAction(formData);
      router.refresh();
    }
  };

  if (processos.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-10 text-center text-gray-500 text-sm">
        Nenhum processo ainda.{' '}
        <Link href="/negociacoes/nova" className="text-secondary font-semibold">
          Criar o primeiro
        </Link>
        .
      </div>
    );
  }

  return (
    <div>
      {/* Botão de Filtro */}
      <div className="flex justify-end mb-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-600">
          <input 
            type="checkbox" 
            checked={mostrarCancelados}
            onChange={(e) => setMostrarCancelados(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          Mostrar negociações canceladas
        </label>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="text-left px-6 py-4 font-semibold">Nº Processo</th>
              <th className="text-left px-6 py-4 font-semibold">Cliente</th>
              <th className="text-left px-6 py-4 font-semibold">Produto</th>
              <th className="text-left px-6 py-4 font-semibold whitespace-nowrap">Status</th>
              <th className="text-left px-6 py-4 font-semibold">Deadline</th>
              <th className="text-center px-6 py-4 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {processosFiltrados.map((p) => (
              <tr key={p.id} className={`border-t border-border hover:bg-gray-50 ${p.status === 'CANCELADO' ? 'bg-red-100' : 'bg-white'}`}>
                <td className="px-6 py-4 text-sm font-semibold">
                  <Link href={`/negociacoes/${p.id}`}>{p.numeroProcesso}</Link>
                </td>
                <td className="px-6 py-4 text-sm">
                  <Link href={`/negociacoes/${p.id}`}>{p.clienteFinal}</Link>
                </td>
                <td className="px-6 py-4 text-sm">{p.produto}</td>
                
                {/* Aqui está o segredo: whitespace-nowrap impede o texto de quebrar */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={p.status} />
                </td>
                
                <td className="px-6 py-4 text-sm text-gray-500">{formatDateBR(p.deadlineEmbarque)}</td>
                <td className="px-6 py-4 text-sm text-center">
                  <button 
                    onClick={() => handleCancelar(p.id)}
                    title="Cancelar Negociação"
                    className="hover:scale-110 transition-transform"
                  > 
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}