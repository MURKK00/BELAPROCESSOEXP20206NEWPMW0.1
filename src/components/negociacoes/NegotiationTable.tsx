"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from './StatusBadge';
import { formatDateBR } from '@/lib/formatters';
import { atualizarStatusAction } from '@/server/actions/editarProcessoAction';
import type { Processo, ProcessoEtapa } from '@prisma/client';

type ProcessoComEtapas = Processo & { etapas: ProcessoEtapa[] };

const STATUS_OPTIONS = [
  { value: 'TODOS', label: 'Todos os status' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_NEGOCIACAO', label: 'Em negociação' },
  { value: 'EM_EXECUCAO', label: 'Em execução' },
  { value: 'EMBARCADO', label: 'Embarcado' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export function NegotiationTable({ processos }: { processos: ProcessoComEtapas[] }) {
  const router = useRouter();
  const [statusFiltro, setStatusFiltro] = useState('TODOS');

  const processosFiltrados =
    statusFiltro === 'TODOS' ? processos : processos.filter((p) => p.status === statusFiltro);

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
      <div className="flex justify-end mb-4">
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold outline-none hover:bg-gray-50 focus:border-blue-500 bg-white shadow-sm cursor-pointer"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
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