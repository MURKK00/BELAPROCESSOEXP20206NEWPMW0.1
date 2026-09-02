'use client';

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="print:hidden mb-6 bg-[#F58025] hover:bg-[#d66b1a] text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-colors"
    >
      🖨️ Salvar como PDF / Imprimir
    </button>
  );
}