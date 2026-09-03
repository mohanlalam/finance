// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleChunkError } from '../chunkReload';

describe('chunkReload helper', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('ignores standard non-chunk errors', () => {
    const error = new Error('Regular validation failure');
    expect(handleChunkError(error)).toBe(false);
  });

  it('detects dynamically imported module failure and triggers reload', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    const chunkError = new TypeError('Failed to fetch dynamically imported module');
    const handled = handleChunkError(chunkError);

    expect(handled).toBe(true);
    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('finance_chunk_error_reload')).toBeTruthy();
  });

  it('rate-limits reloads within 10 seconds', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    sessionStorage.setItem('finance_chunk_error_reload', Date.now().toString());

    const chunkError = new TypeError('Failed to fetch dynamically imported module');
    const handled = handleChunkError(chunkError);

    expect(handled).toBe(false);
    expect(reloadMock).not.toHaveBeenCalled();
  });
});
