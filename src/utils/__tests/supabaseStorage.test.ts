import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { uploadDocumentFile, removeDocumentFiles } from '../supabaseStorage';

vi.mock('../apiClient', () => ({
  getApiAuthHeaders: vi.fn().mockResolvedValue({
    'Authorization': 'Bearer test-anon-key',
    'apikey': 'test-anon-key',
    'X-App-Pin': 'test-pin-hash',
  }),
}));

describe('supabaseStorage', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('uploadDocumentFile', () => {
    it('sanitizes storage paths against directory traversal', async () => {
      let requestedUrl = '';
      let capturedBody: unknown = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
        requestedUrl = url;
        capturedBody = init.body;
        return {
          ok: true,
          status: 200,
          json: async () => ({ path: 'clean_path' }),
        } as Response;
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
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 403,
          json: async () => ({ error: 'Invalid PIN or unauthorized' }),
          text: async () => 'Invalid PIN or unauthorized',
        } as Response;
      });

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
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response;
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
