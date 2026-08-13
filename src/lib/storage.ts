import { createClient } from '@supabase/supabase-js';

const BUCKET = process.env.DOCUMENTOS_BUCKET || 'documentos';

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase não configurado: preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.');
  }
  return createClient(url, key);
}

export async function uploadDocumentToStorage(path: string, file: Blob): Promise<void> {
  const supabase = getClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
  });
  if (error) throw new Error(`Falha no upload: ${error.message}`);
}

export async function getDocumentSignedUrl(path: string, opts?: { download?: boolean }): Promise<string> {
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 5, { download: opts?.download ?? false });

  if (error || !data?.signedUrl) {
    throw new Error(`Falha ao gerar link do documento: ${error?.message}`);
  }
  return data.signedUrl;
}

export async function deleteDocumentFromStorage(path: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Falha ao excluir arquivo: ${error.message}`);
}