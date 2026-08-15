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
 * Uses Edge Function with service role (admin) as primary route to bypass Storage RLS,
 * and falls back to direct Storage REST API.
 */
export async function uploadDocumentFile(
  bucket: string,
  storagePath: string,
  file: File | Blob
): Promise<StorageUploadResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration missing');
  }

  // Clean path segments
  const cleanPath = storagePath
    .split('/')
    .map((seg) => seg.trim().replace(/[^\w.-]/g, '_'))
    .join('/');

  // 1. Primary: Upload via Edge Function (admin service role bypasses Storage RLS)
  try {
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

    if (res.ok) {
      return { path: cleanPath };
    }
    const errText = await res.text().catch(() => '');
    console.warn('[storage] Edge function upload returned non-OK status:', res.status, errText);
  } catch (edgeErr) {
    console.warn('[storage] Edge function upload attempt failed, falling back to direct REST', edgeErr);
  }

  // 2. Fallback: Direct Storage REST API
  const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
  const url = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;
  const directHeaders = await getApiAuthHeaders(file.type || 'application/octet-stream');
  directHeaders['x-upsert'] = 'true';

  const res = await fetch(url, {
    method: 'POST',
    headers: directHeaders,
    body: file,
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
 */
export async function removeDocumentFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || paths.length === 0) return;

  // 1. Primary: Edge Function delete
  try {
    const headers = await getApiAuthHeaders('application/json');
    const edgeUrl = `${SUPABASE_URL}/functions/v1/holdings-crud?action=delete_file`;
    const res = await fetch(edgeUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bucket, paths }),
    });
    if (res.ok) return;
  } catch (edgeErr) {
    console.warn('[storage] Edge function delete failed, trying direct REST', edgeErr);
  }

  // 2. Fallback: Direct REST API
  const url = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}`;
  const directHeaders = await getApiAuthHeaders('application/json');
  const res = await fetch(url, {
    method: 'DELETE',
    headers: directHeaders,
    body: JSON.stringify({ prefixes: paths }),
  });

  if (!res.ok) {
    console.warn(`[storage] Delete failed with status ${res.status}`);
  }
}
