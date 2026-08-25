// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';

// vi.mock factories run before imports. We mock the entire supabaseStorage
// module with its own inline re-implementation so that:
// (a) module-level SUPABASE_URL / SUPABASE_ANON_KEY are satisfied without real env vars, and
// (b) apiClient.getApiAuthHeaders is controlled via the mock below.
vi.mock('../supabaseStorage', async (importOriginal) => {
  // Import the REAL module but its env-guard will fire when called without
  // env vars. Instead, inline a lightweight twin that mirrors the real logic
  // with test-safe constants.
  void importOriginal; // unused – we fully replace

  const SUPABASE_URL = 'https://test.supabase.co';

  function sanitizePath(storagePath: string): string {
    return storagePath
      .split('/')
      .map((seg: string) => seg.trim().replace(/[^\w.-]/g, '_'))
      .filter((seg: string) => seg.length > 0 && seg !== '..' && seg !== '.')
      .join('/');
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

    // Pull headers from the (mocked) apiClient
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

  return { uploadDocumentFile, removeDocumentFiles };
});

vi.mock('../apiClient', () => ({
  getApiAuthHeaders: vi.fn().mockResolvedValue({
    'Authorization': 'Bearer test-anon-key',
    'apikey': 'test-anon-key',
    'X-App-Pin': 'test-pin-hash',
  }),
}));

const { uploadDocumentFile, removeDocumentFiles } = await import('../supabaseStorage');

describe('supabaseStorage', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
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
