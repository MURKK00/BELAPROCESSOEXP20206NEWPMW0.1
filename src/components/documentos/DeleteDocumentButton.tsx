'use client';

import { useRouter } from 'next/navigation';
import { excluirDocumentoAction } from '@/server/actions/documentoActions';

export function DeleteDocumentButton({
  documentoId,
  processoId,
}: {
  documentoId: string;
  processoId: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este documento? Essa ação não pode ser desfeita.')) return;

    const formData = new FormData();
    formData.set('documentoId', documentoId);
    formData.set('processoId', processoId);
    await excluirDocumentoAction(formData);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      title="Excluir documento"
      className="text-red-500 hover:text-red-700 text-sm font-semibold"
    >
      Excluir
    </button>
  );
}