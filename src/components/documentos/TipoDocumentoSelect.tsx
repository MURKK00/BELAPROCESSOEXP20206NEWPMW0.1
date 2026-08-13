'use client';

import { useState } from 'react';

export function TipoDocumentoSelect({ tipos }: { tipos: { id: string; nome: string }[] }) {
  const [outroSelecionado, setOutroSelecionado] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500">Tipo de documento</label>
        <select
          name="tipoDocumentoId"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          defaultValue=""
          required
          onChange={(e) => {
            const selecionado = tipos.find((t) => t.id === e.target.value);
            setOutroSelecionado(selecionado?.nome === 'Outro');
          }}
        >
          <option value="" disabled>Selecione um item...</option>
          {tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nome}
            </option>
          ))}
        </select>
      </div>

      {outroSelecionado && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Descreva do que se trata</label>
          <input
            type="text"
            name="descricaoOutro"
            required
            placeholder="Ex: Carta de crédito complementar"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
          />
        </div>
      )}
    </>
  );
}