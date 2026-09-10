"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateBR, STATUS_NEGOCIACAO_MAP } from '@/lib/formatters';
import { atualizarStatusAction } from '@/server/actions/editarProcessoAction';
import type { Processo, ProcessoEtapa } from '@prisma/client';

type ProcessoComEtapas = Processo & { etapas: ProcessoEtapa[] };

const STATUS_OPTIONS = [
  { value: 'TODOS', label: 'Todos os status' },
  ...Object.entries(STATUS_NEGOCIACAO_MAP).map(([value, label]) => ({ value, label }))
];

// Função que devolve a cor dependendo do status (mesma lógica do seu StatusBadge)
function getStatusColor(status: string) {
  switch (status) {
    case 'EMBARCADO': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'EM_EXECUCAO': return 'bg-[#f58220]/10 text-[#c25e13] border-[#f58220]/30';
    case 'CONCLUIDO': return 'bg-green-50 text-green-700 border-green-200';
    case 'CANCELADO':
    case 'CANCELADA': return 'bg-red-50 text-red-700 border-red-200';
    case 'CRIADO':
    case 'PENDENTE': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export function NegotiationTable({ processos }: { processos: ProcessoComEtapas[] }) {
  const router = useRouter();
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  const [ocultarCanceladas, setOcultarCanceladas] = useState(true);

  const processosFiltrados = processos.filter((p) => {
    if (statusFiltro !== 'TODOS' && p.status !== statusFiltro) return false;
    if (ocultarCanceladas && (p.status === 'CANCELADO' || p.status === 'CANCELADA')) return false;
    return true;
  });

  const handleStatusChange = async (id: string, novoStatus: string, numeroProcesso: string) => {
    const confirmacao = window.confirm(`Tem certeza que deseja alterar o status do processo ${numeroProcesso} para ${STATUS_NEGOCIACAO_MAP[novoStatus] || novoStatus}?`);
    if (confirmacao) {
      const formData = new FormData();
      formData.set('processoId', id);
      formData.set('status', novoStatus);
      await atualizarStatusAction(formData);
      router.refresh();
    }
  };

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
      <div className="flex justify-end items-center mb-4 gap-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
          <input
            type="checkbox"
            checked={ocultarCanceladas}
            onChange={(e) => setOcultarCanceladas(e.target.checked)}
            className="w-4 h-4 text-[#f58220] rounded border-gray-300 focus:ring-[#f58220] cursor-pointer"
          />
          Ocultar canceladas
        </label>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold outline-none hover:bg-gray-50 focus:border-[#f58220] bg-white shadow-sm cursor-pointer"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="text-left px-6 py-4 font-semibold">Nº Processo</th>
              <th className="text-left px-6 py-4 font-semibold whitespace-nowrap">Status</th>
              <th className="text-left px-6 py-4 font-semibold">Cliente</th>
              <th className="text-left px-6 py-4 font-semibold">Produto</th>
              <th className="text-left px-6 py-4 font-semibold whitespace-nowrap">Nº Booking</th>
              <th className="text-left px-6 py-4 font-semibold">Deadline</th>
              <th className="text-center px-6 py-4 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {processosFiltrados.map((p) => (
              <tr key={p.id} className={`border-t border-border hover:bg-gray-50 transition-colors ${p.status === 'CANCELADO' || p.status === 'CANCELADA' ? 'bg-red-50/50' : 'bg-white'}`}>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                  <Link href={`/negociacoes/${p.id}`} className="hover:text-blue-600 transition-colors">{p.numeroProcesso}</Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={p.status}
                    onChange={(e) => handleStatusChange(p.id, e.target.value, p.numeroProcesso)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider outline-none cursor-pointer appearance-none ${getStatusColor(p.status)}`}
                  >
                    {STATUS_OPTIONS.filter(o => o.value !== 'TODOS').map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700">
                  <Link href={`/negociacoes/${p.id}`} className="hover:text-blue-600 transition-colors">{p.clienteFinal}</Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.produto}</td>
                <td className="px-6 py-4 text-sm text-gray-500 font-medium">{p.bookingNumero || '-'}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600">{formatDateBR(p.deadlineEmbarque)}</td>
                <td className="px-6 py-4 text-sm text-center">
                  <button
                    onClick={() => handleCancelar(p.id)}
                    title="Cancelar Negociação"
                    className="hover:scale-110 transition-transform opacity-60 hover:opacity-100"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {processosFiltrados.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500 bg-white">
            Nenhuma negociação encontrada com esses filtros.
          </div>
        )}
      </div>
    </div>
  );
}