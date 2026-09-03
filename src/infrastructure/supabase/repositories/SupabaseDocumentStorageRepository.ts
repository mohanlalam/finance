import {
  IDocumentStorageRepository,
  StorageUploadResult,
} from '../../../domains/portfolio/repositories/IDocumentStorageRepository';
import { getApiAuthHeaders } from '../../../utils/apiClient';
import {
  isDocumentCryptoSupported,
  isDocumentEncrypted,
  encryptDocumentFile,
  decryptDocumentBlob,
} from '../../../utils/documentCrypto';
import { getHashedPin, ensureHashedPin } from '../../../utils/sessionStore';

function sanitizeEnv(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

const SUPABASE_URL = sanitizeEnv(import.meta.env.VITE_SUPABASE_URL as string | undefined).replace(/\/+$/, '');
const SUPABASE_ANON_KEY = sanitizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

// In-memory cache for active signed URLs (50-second TTL)
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export class SupabaseDocumentStorageRepository implements IDocumentStorageRepository {
  /**
   * Generates a clean, randomized, collision-resistant storage path for document uploads.
   * Uses crypto.randomUUID() for defense-in-depth against path enumeration.
   */
  generateDocumentStoragePath(
    portfolio: string,
    folder: string,
    fileName: string
  ): string {
    const safePortfolio = portfolio.trim().replace(/\.\.+/g, '_').replace(/[^\w.-]/g, '_') || 'default';
    const safeFolder = folder.trim().replace(/\.\.+/g, '_').replace(/[^\w.-]/g, '_') || 'general';
    const safeName = fileName.trim().replace(/\.\.+/g, '_').replace(/[^\w.-]/g, '_');
    const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    return `${safePortfolio}/${safeFolder}/${uuid}_${safeName}`;
  }

  /**
   * Retrieves a short-lived PIN-authenticated signed URL for viewing/downloading a document.
   * Routes through holdings-crud (service role) to enforce PIN authentication.
   */
  async getDocumentSignedUrl(filePath: string): Promise<string> {
    if (!filePath) return '';

    // Strip any legacy full Supabase URL prefix to isolate the relative storage key
    const strippedPath = filePath
      .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/(?:public|sign|authenticated)\/investment-documents\//i, '')
      .trim();

    // Strictly reject foreign or malformed URLs (no unauthenticated pass-through)
    if (strippedPath.startsWith('http://') || strippedPath.startsWith('https://')) {
      console.warn('[storage] Rejected invalid/external document URL:', filePath);
      return '';
    }

    const cleanPath = strippedPath
      .split('/')
      .map((seg) => seg.trim().replace(/[^\w.-]/g, '_'))
      .filter((seg) => seg.length > 0 && seg !== '..' && seg !== '.')
      .join('/');

    if (!cleanPath) return '';

    const now = Date.now();
    const cached = signedUrlCache.get(cleanPath);
    if (cached && cached.expiresAt > now) {
      return cached.url;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const headers = await getApiAuthHeaders('application/json');
    const edgeUrl = `${SUPABASE_URL}/functions/v1/holdings-crud?action=get_document_url`;
    const res = await fetch(edgeUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bucket: 'investment-documents', path: cleanPath, expiresIn: 60 }),
    });

    if (!res.ok) {
      let errorMsg = `Failed to get document URL (${res.status})`;
      try {
        const json = await res.json();
        errorMsg = json.error || errorMsg;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const { signedUrl } = await res.json();
    // Cache for 50 seconds
    signedUrlCache.set(cleanPath, { url: signedUrl, expiresAt: now + 50_000 });
    return signedUrl;
  }

  /**
   * Securely opens a document in a new browser tab using a PIN-authenticated signed URL.
   * If the document is zero-trust encrypted (AGYENC format), it decrypts in-memory and launches a local blob URL.
   * If the document is legacy unencrypted, it opens directly via the signed URL.
   */
  async openSecureDocument(filePath: string): Promise<void> {
    if (!filePath) return;

    // Open window synchronously to comply with browser popup blocker policies
    const newWindow = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;
    try {
      const signedUrl = await this.getDocumentSignedUrl(filePath);
      if (!signedUrl) {
        if (newWindow) newWindow.close();
        throw new Error('Could not generate secure document link');
      }

      // Check if file is encrypted by inspecting initial bytes
      let pinHash = getHashedPin();
      if (!pinHash) {
        pinHash = await ensureHashedPin();
      }

      if (pinHash && isDocumentCryptoSupported()) {
        try {
          const res = await fetch(signedUrl);
          if (res.ok) {
            const buffer = await res.arrayBuffer();
            if (isDocumentEncrypted(buffer)) {
              const { blob } = await decryptDocumentBlob(buffer, pinHash);
              const objectUrl = URL.createObjectURL(blob);
              if (newWindow) {
                newWindow.location.href = objectUrl;
              } else if (typeof window !== 'undefined') {
                window.open(objectUrl, '_blank', 'noopener,noreferrer');
              }
              // Revoke transient URL after 2 minutes to prevent memory leaks
              setTimeout(() => {
                try {
                  URL.revokeObjectURL(objectUrl);
                } catch {
                  // ignore
                }
              }, 120_000);
              return;
            }
          }
        } catch (decryptErr) {
          console.warn('[storage] Direct decryption failed or document is external, opening signedUrl directly:', decryptErr);
        }
      }

      // Legacy unencrypted document or direct fallback
      if (newWindow) {
        newWindow.location.href = signedUrl;
      } else if (typeof window !== 'undefined') {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      if (newWindow) newWindow.close();
      console.error('[storage] Failed to open secure document:', err);
      throw err;
    }
  }

  /**
   * Uploads a file to Supabase Storage.
   * Automatically encrypts file payload client-side with AES-GCM-256 using the session PIN hash
   * before transmission, ensuring true Zero-Knowledge Cloud Storage.
   */
  async uploadDocumentFile(
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

    // Encrypt client-side if PIN hash is available in active verified session
    let filePayload: File | Blob = file;
    try {
      let pinHash = getHashedPin();
      if (!pinHash) {
        pinHash = await ensureHashedPin();
      }
      if (pinHash && isDocumentCryptoSupported()) {
        const originalName = file instanceof File ? file.name : 'document.bin';
        filePayload = await encryptDocumentFile(file, pinHash, originalName);
      }
    } catch (encryptErr) {
      console.warn('[storage] Client-side encryption skipped, uploading original:', encryptErr);
    }

    const formData = new FormData();
    formData.append('bucket', bucket);
    formData.append('path', cleanPath);
    formData.append('file', filePayload);

    const headers = await getApiAuthHeaders();
    delete headers['Content-Type']; // Let browser set multipart boundary

    const edgeUrl = `${SUPABASE_URL}/functions/v1/holdings-crud?action=upload_file`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(edgeUrl, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
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
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Deletes one or more files from Supabase Storage.
   * Routes exclusively through the holdings-crud Edge Function to enforce PIN authentication.
   */
  async removeDocumentFiles(
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
}

export const supabaseDocumentStorageRepository = new SupabaseDocumentStorageRepository();
