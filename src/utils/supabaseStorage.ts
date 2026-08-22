import { getApiAuthHeaders } from './apiClient';

function sanitizeEnv(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

const SUPABASE_URL = sanitizeEnv(import.meta.env.VITE_SUPABASE_URL as string | undefined).replace(/\/+$/, '');
const SUPABASE_ANON_KEY = sanitizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

export interface StorageUploadResult {
  path: string;
}

/**
 * Uploads a file to Supabase Storage.
 * Routes exclusively through the holdings-crud Edge Function (service role) to enforce PIN authentication
 * and prevent unauthenticated write access via public anon storage policies.
 */
export async function uploadDocumentFile(
  bucket: string,
  storagePath: string,
  file: File | Blob
): Promise<StorageUploadResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration missing');
  }

  // Clean path segments and prevent directory traversal
  const cleanPath = storagePath
    .split('/')
    .map((seg) => seg.trim().replace(/[^\w.-]/g, '_'))
    .filter((seg) => seg.length > 0 && seg !== '..' && seg !== '.')
    .join('/');

  if (!cleanPath) {
    throw new Error('Invalid storage path');
  }

  const formData = new FormData();
  formData.append('bucket', bucket);
  formData.append('path', cleanPath);
  formData.append('file', file);

  const headers = await getApiAuthHeaders();
  delete headers['Content-Type']; // Let browser set multipart boundary

  const edgeUrl = `${SUPABASE_URL}/functions/v1/holdings-crud?action=upload_file`;
  const res = await fetch(edgeUrl, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    let errorMsg = `Upload failed with status ${res.status}`;
    try {
      const json = await res.json();
      errorMsg = json.error || json.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return { path: cleanPath };
}

/**
 * Deletes one or more files from Supabase Storage.
 * Routes exclusively through the holdings-crud Edge Function to enforce PIN authentication.
 */
export async function removeDocumentFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || paths.length === 0) return;

  const cleanPaths = paths
    .map((p) =>
      p
        .split('/')
        .map((seg) => seg.trim().replace(/[^\w.-]/g, '_'))
        .filter((seg) => seg.length > 0 && seg !== '..' && seg !== '.')
        .join('/')
    )
    .filter(Boolean);

  if (cleanPaths.length === 0) return;

  const headers = await getApiAuthHeaders('application/json');
  const edgeUrl = `${SUPABASE_URL}/functions/v1/holdings-crud?action=delete_file`;
  const res = await fetch(edgeUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ bucket, paths: cleanPaths }),
  });

  if (!res.ok) {
    let errorMsg = `Delete failed with status ${res.status}`;
    try {
      const json = await res.json();
      errorMsg = json.error || json.message || errorMsg;
    } catch {
      // ignore
    }
    console.warn('[storage] Edge function delete failed:', errorMsg);
  }
}
