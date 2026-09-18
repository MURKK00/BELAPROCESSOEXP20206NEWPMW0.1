"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { atualizarImportadorAction } from '@/server/actions/importadorActions';
import type { Processo } from '@prisma/client';

export function ImportadorCard({ processo }: { processo: Processo }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    formData.append('processoId', processo.id);
    
    try {
      await atualizarImportadorAction(formData);
      router.refresh();
      alert('✅ Dados do importador atualizados com sucesso!');
    } catch (error) {
      alert('❌ Erro ao salvar os dados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Dados do Importador (Buyer)</h3>
      
      <form action={handleSubmit} className="space-y-6">
        
        {/* LINHA 1: ENDEREÇO E COMPLEMENTO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Endereço</label>
            <input 
              type="text" 
              name="enderecoBuyer" 
              defaultValue={processo.enderecoBuyer || ''} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] outline-none" 
              placeholder="Ex: SURVEY NO.-806, VILLAGE-VADALA..." 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Complemento</label>
            <input 
              type="text" 
              name="complementoBuyer" 
              defaultValue={processo.complementoBuyer || ''} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] outline-none" 
              placeholder="Ex: NEAR JETCO ELECTRIC SUB STATION" 
            />
          </div>
        </div>

        {/* LINHA 2: CIDADE E PAÍS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Cidade / Estado</label>
            <input 
              type="text" 
              name="cidadeBuyer" 
              defaultValue={processo.cidadeBuyer || ''} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] outline-none" 
              placeholder="Ex: MUNDRA, KACHCHH, GUJARAT" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">País / CEP</label>
            <input 
              type="text" 
              name="paisBuyer" 
              defaultValue={processo.paisBuyer || ''} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] outline-none" 
              placeholder="Ex: INDIA, 370410" 
            />
          </div>
        </div>

        {/* LINHA 3: CÓDIGOS DE EXPORTAÇÃO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">IEC</label>
            <input 
              type="text" 
              name="iecBuyer" 
              defaultValue={processo.iecBuyer || ''} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] outline-none" 
              placeholder="Ex: ABOFA6762G" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">PAN NO.</label>
            <input 
              type="text" 
              name="panBuyer" 
              defaultValue={processo.panBuyer || ''} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] outline-none" 
              placeholder="Ex: AAVCA0504D" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">FSSAI</label>
            <input 
              type="text" 
              name="fassaiBuyer" 
              defaultValue={processo.fassaiBuyer || ''} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] outline-none" 
              placeholder="Ex: 10019022009383" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">GST NO</label>
            <input 
              type="text" 
              name="gstBuyer" 
              defaultValue={processo.gstBuyer || ''} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] outline-none" 
              placeholder="Ex: 24AAVCA0504D1Z4" 
            />
          </div>
        </div>

        {/* LINHA 4: CONTATO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">E-mail de Contato</label>
            <input 
              type="email" 
              name="emailBuyer" 
              defaultValue={processo.emailBuyer || ''} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Telefone</label>
            <input 
              type="text" 
              name="telefoneBuyer" 
              defaultValue={processo.telefoneBuyer || ''} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] outline-none" 
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading} 
            className="bg-[#1a365d] text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Importador'}
          </button>
        </div>
      </form>
    </div>
  );
}