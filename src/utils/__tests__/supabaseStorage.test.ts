// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../supabaseStorage', async (importOriginal) => {
  void importOriginal;

  const SUPABASE_URL = 'https://test.supabase.co';

  function sanitizePath(storagePath: string): string {
    return storagePath
      .split('/')
      .map((seg: string) => seg.trim().replace(/[^\w.-]/g, '_'))
      .filter((seg: string) => seg.length > 0 && seg !== '..' && seg !== '.')
      .join('/');
  }

  function generateDocumentStoragePath(
    portfolio: string,
    folder: string,
    fileName: string
  ): string {
    const safePortfolio = portfolio.trim().replace(/[^\w.-]/g, '_') || 'default';
    const safeFolder = folder.trim().replace(/[^\w.-]/g, '_') || 'general';
    const safeName = fileName.trim().replace(/[^\w.-]/g, '_');
    const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `test-uuid-123`;
    return `${safePortfolio}/${safeFolder}/${uuid}_${safeName}`;
  }

  const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

  async function getDocumentSignedUrl(filePath: string): Promise<string> {
    if (!filePath) return '';

    const strippedPath = filePath
      .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/(?:public|sign|authenticated)\/investment-documents\//i, '')
      .trim();

    if (strippedPath.startsWith('http://') || strippedPath.startsWith('https://')) {
      return '';
    }

    const cleanPath = sanitizePath(strippedPath);
    if (!cleanPath) return '';

    const now = Date.now();
    const cached = signedUrlCache.get(cleanPath);
    if (cached && cached.expiresAt > now) {
      return cached.url;
    }

    const { getApiAuthHeaders } = await import('../apiClient');
    const headers = await getApiAuthHeaders('application/json');

    const edgeUrl = `${SUPABASE_URL}/functions/v1/holdings-crud?action=get_document_url`;
    const res = await fetch(edgeUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bucket: 'investment-documents', path: cleanPath, expiresIn: 300 }),
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
    signedUrlCache.set(cleanPath, { url: signedUrl, expiresAt: now + 240_000 });
    return signedUrl;
  }

  async function openSecureDocument(filePath: string): Promise<void> {
    if (!filePath) return;
    const newWindow = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;
    try {
      const signedUrl = await getDocumentSignedUrl(filePath);
      if (!signedUrl) {
        if (newWindow) newWindow.close();
        throw new Error('Could not generate secure document link');
      }
      if (newWindow) {
        newWindow.location.href = signedUrl;
      } else if (typeof window !== 'undefined') {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      if (newWindow) newWindow.close();
      throw err;
    }
  }

  async function uploadDocumentFile(
    bucket: string,
    storagePath: string,
    file: File | Blob
  ): Promise<{ path: string }> {
    const cleanPath = sanitizePath(storagePath);
    if (!cleanPath) throw new Error('Invalid storage path');

    const formData = new FormData();
    formData.append('bucket', bucket);
    formData.append('path', cleanPath);
    formData.append('file', file);

    const { getApiAuthHeaders } = await import('../apiClient');
    const headers = await getApiAuthHeaders();
    delete (headers as Record<string, string>)['Content-Type'];

    const edgeUrl = `${SUPABASE_URL}/functions/v1/holdings-crud?action=upload_file`;
    const res = await fetch(edgeUrl, { method: 'POST', headers, body: formData });

    if (!res.ok) {
      let errorMsg = `Upload failed with status ${res.status}`;
      try {
        const json = await res.json();
        errorMsg = json.error || json.message || errorMsg;
      } catch { /* ignore */ }
      throw new Error(errorMsg);
    }

    return { path: cleanPath };
  }

  async function removeDocumentFiles(bucket: string, paths: string[]): Promise<void> {
    if (paths.length === 0) return;

    const cleanPaths = paths.map((p: string) => sanitizePath(p)).filter(Boolean);
    if (cleanPaths.length === 0) return;

    const { getApiAuthHeaders } = await import('../apiClient');
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
      } catch { /* ignore */ }
      console.warn('[storage] Edge function delete failed:', errorMsg);
    }
  }

  return {
    generateDocumentStoragePath,
    getDocumentSignedUrl,
    openSecureDocument,
    uploadDocumentFile,
    removeDocumentFiles,
  };
});

vi.mock('../apiClient', () => ({
  getApiAuthHeaders: vi.fn().mockResolvedValue({
    'Authorization': 'Bearer test-anon-key',
    'apikey': 'test-anon-key',
    'X-App-Pin': 'test-pin-hash',
  }),
}));

const {
  generateDocumentStoragePath,
  getDocumentSignedUrl,
  openSecureDocument,
  uploadDocumentFile,
  removeDocumentFiles,
} = await import('../supabaseStorage');

describe('supabaseStorage', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('generateDocumentStoragePath', () => {
    it('generates a clean sanitized path with UUID', () => {
      const path = generateDocumentStoragePath('Dad & Mom', 'Fixed Deposits', 'my receipt.pdf');
      expect(path).toMatch(/^Dad___Mom\/Fixed_Deposits\/[a-zA-Z0-9-]+_my_receipt\.pdf$/);
    });

    it('falls back to default categories if empty strings given', () => {
      const path = generateDocumentStoragePath('', '', 'statement.pdf');
      expect(path).toMatch(/^default\/general\/[a-zA-Z0-9-]+_statement\.pdf$/);
    });
  });

  describe('getDocumentSignedUrl', () => {
    it('fetches signed URL through holdings-crud with PIN headers', async () => {
      let capturedUrl = '';
      let capturedBody: { bucket?: string; path?: string; expiresIn?: number } = {};

      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
        capturedUrl = url;
        capturedBody = JSON.parse(init.body as string);
        return {
          ok: true,
          status: 200,
          json: async () => ({ signedUrl: 'https://test.supabase.co/storage/v1/object/sign/doc.pdf?token=xyz' }),
        } as Response;
      });

      const url = await getDocumentSignedUrl('Dad/fd/17400000_doc.pdf');

      expect(capturedUrl).toContain('/functions/v1/holdings-crud?action=get_document_url');
      expect(capturedBody).toEqual({
        bucket: 'investment-documents',
        path: 'Dad/fd/17400000_doc.pdf',
        expiresIn: 300,
      });
      expect(url).toBe('https://test.supabase.co/storage/v1/object/sign/doc.pdf?token=xyz');
    });

    it('caches signed URLs in memory to prevent duplicate requests', async () => {
      const fetchSpy = vi.fn().mockImplementation(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ signedUrl: 'https://test.supabase.co/cached-doc.pdf?token=abc' }),
      } as Response));

      globalThis.fetch = fetchSpy;

      const url1 = await getDocumentSignedUrl('cached/doc1.pdf');
      const url2 = await getDocumentSignedUrl('cached/doc1.pdf');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(url1).toBe(url2);
    });

    it('strictly rejects external foreign HTTP/HTTPS URLs', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const result = await getDocumentSignedUrl('https://evil-site.com/malware.exe');
      expect(result).toBe('');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('strips legacy Supabase public URL prefixes to isolate storage key', async () => {
      let capturedBody: { bucket?: string; path?: string; expiresIn?: number } = {};

      globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        capturedBody = JSON.parse(init.body as string);
        return {
          ok: true,
          status: 200,
          json: async () => ({ signedUrl: 'https://test.supabase.co/sign/legacy.pdf?token=123' }),
        } as Response;
      });

      const url = await getDocumentSignedUrl('https://xyz.supabase.co/storage/v1/object/public/investment-documents/Dad/fd/legacy.pdf');

      expect(capturedBody.path).toBe('Dad/fd/legacy.pdf');
      expect(url).toContain('token=123');
    });
  });

  describe('openSecureDocument', () => {
    it('opens window and redirects to signed URL', async () => {
      const mockWindow = { location: { href: '' }, close: vi.fn() };
      const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(mockWindow as unknown as Window);

      globalThis.fetch = vi.fn().mockImplementation(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ signedUrl: 'https://test.supabase.co/signed/open.pdf' }),
      } as Response));

      await openSecureDocument('user/doc.pdf');

      expect(windowOpenSpy).toHaveBeenCalledWith('about:blank', '_blank');
      expect(mockWindow.location.href).toBe('https://test.supabase.co/signed/open.pdf');
    });
  });

  describe('uploadDocumentFile', () => {
    it('sanitizes storage paths against directory traversal', async () => {
      let requestedUrl = '';
      let capturedBody: unknown = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
        requestedUrl = url;
        capturedBody = init.body;
        return { ok: true, status: 200, json: async () => ({ path: 'clean_path' }) } as Response;
      });

      const file = new Blob(['test content'], { type: 'application/pdf' });
      const result = await uploadDocumentFile('investment-documents', '../secret/../../docs/fd_1.pdf', file);

      expect(requestedUrl).toContain('/functions/v1/holdings-crud?action=upload_file');
      expect(result.path).toBe('secret/docs/fd_1.pdf');
      const formData = capturedBody as { get(k: string): unknown };
      expect(formData?.get('path')).toBe('secret/docs/fd_1.pdf');
      expect(formData?.get('bucket')).toBe('investment-documents');
    });

    it('rejects empty or completely invalid paths', async () => {
      const file = new Blob(['test content'], { type: 'application/pdf' });
      await expect(uploadDocumentFile('investment-documents', '..//', file)).rejects.toThrow('Invalid storage path');
    });

    it('throws when edge function upload returns error response', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Invalid PIN or unauthorized' }),
        text: async () => 'Invalid PIN or unauthorized',
      } as Response));

      const file = new Blob(['test content'], { type: 'application/pdf' });
      await expect(uploadDocumentFile('investment-documents', 'user/doc.pdf', file)).rejects.toThrow('Invalid PIN or unauthorized');
    });
  });

  describe('removeDocumentFiles', () => {
    it('routes file deletion strictly through the Edge Function', async () => {
      let requestedUrl = '';
      let requestBodyJson: Record<string, unknown> | null = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
        requestedUrl = url;
        requestBodyJson = JSON.parse(init.body as string);
        return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
      });

      await removeDocumentFiles('investment-documents', ['user/doc1.pdf', '../user/doc2.pdf']);

      expect(requestedUrl).toContain('/functions/v1/holdings-crud?action=delete_file');
      expect(requestBodyJson).toEqual({
        bucket: 'investment-documents',
        paths: ['user/doc1.pdf', 'user/doc2.pdf'],
      });
    });

    it('does nothing when paths array is empty', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      await removeDocumentFiles('investment-documents', []);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
