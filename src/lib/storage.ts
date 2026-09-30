import { createClient } from '@supabase/supabase-js';

const BUCKET = process.env.DOCUMENTOS_BUCKET || 'documentos';
const memoryFiles = new Map<string, { buffer: Buffer; contentType: string }>();

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

/**
 * Remove acentos, caracteres especiais e não-ASCII de qualquer caminho de storage,
 * prevenindo o erro "Invalid key" no Supabase Storage e AWS S3.
 */
export function sanitizeStoragePath(path: string): string {
  return path
    .split('/')
    .map((seg) =>
      seg
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
    )
    .filter(Boolean)
    .join('/');
}

export async function uploadDocumentToStorage(path: string, file: Blob): Promise<string> {
  const safePath = sanitizeStoragePath(path);
  const supabase = getClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || 'application/octet-stream';

  if (!supabase) {
    memoryFiles.set(safePath, { buffer, contentType });
    return safePath;
  }

  const { error } = await supabase.storage.from(BUCKET).upload(safePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Falha no upload: ${error.message}`);
  return safePath;
}

export async function getDocumentSignedUrl(path: string, opts?: { download?: boolean }): Promise<string> {
  const safePath = sanitizeStoragePath(path);
  const supabase = getClient();
  if (!supabase) {
    const file = memoryFiles.get(safePath);
    if (file) {
      return `data:${file.contentType};base64,${file.buffer.toString('base64')}`;
    }
    return '#';
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(safePath, 60 * 5, { download: opts?.download ?? false });

  if (error || !data?.signedUrl) {
    throw new Error(`Falha ao gerar link do documento: ${error?.message}`);
  }
  return data.signedUrl;
}

export async function deleteDocumentFromStorage(path: string): Promise<void> {
  const safePath = sanitizeStoragePath(path);
  const supabase = getClient();
  if (!supabase) {
    memoryFiles.delete(safePath);
    return;
  }

  const { error } = await supabase.storage.from(BUCKET).remove([safePath]);
  if (error) throw new Error(`Falha ao excluir arquivo: ${error.message}`);
}
