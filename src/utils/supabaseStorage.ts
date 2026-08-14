const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

function getAuthHeaders(contentType?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
  };
  // Supabase Storage strictly validates Authorization Bearer as a compact JWS (JWT).
  // Only include Authorization header if the key is a valid 3-part JWT (e.g. eyJ...).
  if (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.startsWith('eyJ') && SUPABASE_ANON_KEY.split('.').length === 3) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  return headers;
}

export interface StorageUploadResult {
  path: string;
}

/**
 * Uploads a file directly to Supabase Storage via native REST API.
 */
export async function uploadDocumentFile(
  bucket: string,
  storagePath: string,
  file: File | Blob
): Promise<StorageUploadResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration missing');
  }

  const url = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${storagePath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(file.type || 'application/octet-stream'),
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

  return { path: storagePath };
}

/**
 * Deletes one or more files from Supabase Storage via native REST API.
 */
export async function removeDocumentFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || paths.length === 0) return;

  const url = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders('application/json'),
    body: JSON.stringify({ prefixes: paths }),
  });

  if (!res.ok) {
    console.warn(`[storage] Delete failed with status ${res.status}`);
  }
}
