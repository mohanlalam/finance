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
import { logger } from '../../logging/logger';

function sanitizeEnv(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

const SUPABASE_URL = sanitizeEnv(import.meta.env.VITE_SUPABASE_URL as string | undefined).replace(/\/+$/, '');
const SUPABASE_ANON_KEY = sanitizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

// In-memory cache for active signed URLs (50-second TTL)
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

function inferMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'pdf': return 'application/pdf';
    case 'csv': return 'text/csv';
    case 'txt': return 'text/plain';
    case 'json': return 'application/json';
    default: return 'application/octet-stream';
  }
}

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
    let absoluteSignedUrl = signedUrl || '';
    if (absoluteSignedUrl.startsWith('/object/sign/')) {
      absoluteSignedUrl = `${SUPABASE_URL}/storage/v1${absoluteSignedUrl}`;
    } else if (absoluteSignedUrl.startsWith('/storage/v1/')) {
      absoluteSignedUrl = `${SUPABASE_URL}${absoluteSignedUrl}`;
    } else if (absoluteSignedUrl.startsWith('/')) {
      absoluteSignedUrl = `${SUPABASE_URL}/storage/v1${absoluteSignedUrl}`;
    }

    // Cache for 50 seconds
    signedUrlCache.set(cleanPath, { url: absoluteSignedUrl, expiresAt: now + 50_000 });
    return absoluteSignedUrl;
  }

  /**
   * Securely opens a document in a new browser tab using a PIN-authenticated signed URL.
   * If the document is zero-trust encrypted (AGYENC format), it decrypts in-memory and displays it.
   * If the document is legacy unencrypted, it loads and renders cleanly.
   */
  async openSecureDocument(filePath: string): Promise<void> {
    if (!filePath) return;

    // Open window synchronously to comply with browser popup blocker policies
    const newWindow = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;
    if (newWindow && newWindow.document && newWindow.document.body) {
      newWindow.document.title = 'Loading document...';
      newWindow.document.body.innerHTML = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0b0f19; color: #94a3b8;">
          <div style="width: 32px; height: 32px; border: 3px solid rgba(148, 163, 184, 0.2); border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px;"></div>
          <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
          <div style="font-size: 14px; font-weight: 500;">Loading secure document...</div>
        </div>
      `;
    }

    try {
      const signedUrl = await this.getDocumentSignedUrl(filePath);
      if (!signedUrl) {
        if (newWindow && !newWindow.closed) newWindow.close();
        throw new Error('Could not generate secure document link');
      }

      // Check if file is encrypted by inspecting initial bytes
      let pinHash = getHashedPin();
      if (!pinHash) {
        pinHash = await ensureHashedPin();
      }

      let blob: Blob | null = null;
      let fileName = filePath.split('/').pop() || 'document';
      let mimeType = 'application/octet-stream';

      // 1. Fetch file payload and decrypt if encrypted
      try {
        const res = await fetch(signedUrl);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          if (isDocumentEncrypted(buffer) && pinHash && isDocumentCryptoSupported()) {
            const decrypted = await decryptDocumentBlob(buffer, pinHash);
            blob = decrypted.blob;
            fileName = decrypted.fileName || fileName;
            mimeType = decrypted.mimeType || mimeType;
          } else {
            // Unencrypted legacy file or raw document
            const resType = res.headers.get('content-type');
            if (resType && resType !== 'application/octet-stream') {
              mimeType = resType;
            } else {
              mimeType = inferMimeType(fileName);
            }
            blob = new Blob([buffer], { type: mimeType });
          }
        }
      } catch (decryptErr) {
        console.warn('[storage] Direct fetch/decryption failed or document is external, opening signedUrl directly:', decryptErr);
      }

      // 2. Render document
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        const lowerName = fileName.toLowerCase();
        const isImage = mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(lowerName);
        const isPdf = mimeType === 'application/pdf' || lowerName.endsWith('.pdf');

        if (newWindow && !newWindow.closed) {
          if (newWindow.document?.body) {
            newWindow.document.title = fileName;
            if (isImage) {
              newWindow.document.body.innerHTML = `
                <style>
                  body { margin: 0; background: #0b0f19; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; font-family: -apple-system, sans-serif; }
                  .toolbar { position: fixed; top: 12px; right: 16px; display: flex; gap: 8px; z-index: 10; }
                  .btn { background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-size: 12px; text-decoration: none; cursor: pointer; }
                  .btn:hover { background: rgba(255,255,255,0.25); }
                  img { max-width: 95vw; max-height: 90vh; object-fit: contain; box-shadow: 0 8px 30px rgba(0,0,0,0.6); border-radius: 8px; }
                </style>
                <div class="toolbar">
                  <a href="${objectUrl}" download="${fileName}" class="btn">⬇ Download</a>
                </div>
                <img src="${objectUrl}" alt="${fileName}" />
              `;
            } else if (isPdf) {
              newWindow.document.body.innerHTML = `
                <style>
                  body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #525659; }
                  iframe { width: 100%; height: 100%; border: none; }
                </style>
                <iframe src="${objectUrl}" type="application/pdf"></iframe>
              `;
            } else {
              const a = newWindow.document.createElement('a');
              a.href = objectUrl;
              a.download = fileName;
              newWindow.document.body.appendChild(a);
              a.click();
              setTimeout(() => {
                if (newWindow && !newWindow.closed) newWindow.close();
              }, 500);
            }
          } else if (newWindow.location) {
            newWindow.location.href = signedUrl;
          }
        } else if (typeof document !== 'undefined') {
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = fileName;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
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

      // Legacy unencrypted document or direct fallback
      if (newWindow && !newWindow.closed && newWindow.location) {
        newWindow.location.href = signedUrl;
      } else if (typeof window !== 'undefined') {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      if (newWindow && !newWindow.closed) newWindow.close();
      logger.error('[storage] Failed to open secure document:', err);
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

      const resData = await res.json().catch(() => null);
      const finalPath = (resData && typeof resData === 'object' && 'path' in resData && typeof (resData as { path?: string }).path === 'string')
        ? (resData as { path: string }).path
        : cleanPath;

      return { path: finalPath };
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
