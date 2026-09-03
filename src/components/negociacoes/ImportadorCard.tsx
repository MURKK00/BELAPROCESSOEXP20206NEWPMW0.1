'use client';

import { useState } from 'react';
import { updateImportadorAction } from '@/server/actions/importadorActions';

type ImportadorProps = {
  processoId: string;
  clienteFinal: string;
  enderecoBuyer: string | null;
  iecBuyer: string | null;
  fassaiBuyer: string | null;
  panBuyer: string | null;
  gstBuyer: string | null;
  emailBuyer: string | null;
  telefoneBuyer: string | null;
};

export function ImportadorCard({ processoId, clienteFinal, ...dados }: ImportadorProps) {
  const [editando, setEditando] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Dados do Importador (Buyer)</h2>
          <p className="text-sm text-gray-500">{clienteFinal}</p>
        </div>
        <button
          onClick={() => setEditando(!editando)}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          {editando ? 'Cancelar' : 'Editar Dados'}
        </button>
      </div>

      {editando ? (
        <form action={async (formData) => {
          await updateImportadorAction(formData);
          setEditando(false);
        }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="hidden" name="id" value={processoId} />
          
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Endereço Completo</label>
            <textarea name="enderecoBuyer" defaultValue={dados.enderecoBuyer || ''} rows={3} className="w-full border rounded-lg p-2 text-sm outline-none focus:border-[#F58025] resize-none" placeholder="Ex: 3 KUMMAL AMMAN KOIL STREET..." />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">IEC</label>
            <input type="text" name="iecBuyer" defaultValue={dados.iecBuyer || ''} className="w-full border rounded-lg p-2 text-sm outline-none focus:border-[#F58025]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">FASSAI</label>
            <input type="text" name="fassaiBuyer" defaultValue={dados.fassaiBuyer || ''} className="w-full border rounded-lg p-2 text-sm outline-none focus:border-[#F58025]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">PAN NO.</label>
            <input type="text" name="panBuyer" defaultValue={dados.panBuyer || ''} className="w-full border rounded-lg p-2 text-sm outline-none focus:border-[#F58025]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">GST NO</label>
            <input type="text" name="gstBuyer" defaultValue={dados.gstBuyer || ''} className="w-full border rounded-lg p-2 text-sm outline-none focus:border-[#F58025]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">E-mail</label>
            <input type="email" name="emailBuyer" defaultValue={dados.emailBuyer || ''} className="w-full border rounded-lg p-2 text-sm outline-none focus:border-[#F58025]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Telefone</label>
            <input type="text" name="telefoneBuyer" defaultValue={dados.telefoneBuyer || ''} className="w-full border rounded-lg p-2 text-sm outline-none focus:border-[#F58025]" />
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end mt-2">
            <button type="submit" className="bg-[#1A7A43] hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
              Salvar Dados
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div className="col-span-1 md:col-span-2">
            <span className="block text-xs font-bold text-gray-400 mb-1">ENDEREÇO</span>
            <p className="text-gray-800 whitespace-pre-wrap">{dados.enderecoBuyer || '—'}</p>
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 mb-1">IEC</span>
            <p className="text-gray-800 font-medium">{dados.iecBuyer || '—'}</p>
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 mb-1">FASSAI</span>
            <p className="text-gray-800 font-medium">{dados.fassaiBuyer || '—'}</p>
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 mb-1">PAN NO.</span>
            <p className="text-gray-800 font-medium">{dados.panBuyer || '—'}</p>
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 mb-1">GST NO</span>
            <p className="text-gray-800 font-medium">{dados.gstBuyer || '—'}</p>
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 mb-1">E-MAIL</span>
            <p className="text-gray-800">{dados.emailBuyer || '—'}</p>
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 mb-1">TELEFONE</span>
            <p className="text-gray-800">{dados.telefoneBuyer || '—'}</p>
          </div>
        </div>
      )}
    </div>
  );
}