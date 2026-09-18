"use client";

export function PrintButton() {
  return (
    <div className="mb-6 print:hidden text-center">
      <button
        onClick={() => window.print()}
        className="bg-[#1a365d] text-white px-8 py-3 rounded-lg font-bold text-lg shadow-md hover:bg-blue-900 transition-colors"
      >
        🖨️ Imprimir / Salvar PDF
      </button>
      <p className="text-xs text-gray-500 mt-2">
        Dica: Nas opções de impressão, desmarque "Cabeçalhos e rodapés" para um PDF mais limpo.
      </p>
    </div>
  );
}