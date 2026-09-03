const CHUNK_ERROR_KEY = 'finance_chunk_error_reload';
const RELOAD_DEBOUNCE_MS = 10000;

/**
 * Detects dynamic chunk import failures and stale PWA service worker cache errors.
 * Safely reloads the page at most once every 10 seconds to break stale cache states
 * without creating infinite reload loops.
 */
export function handleChunkError(error: Error): boolean {
  if (!error || !error.message) return false;

  const isChunkError =
    error.message.includes('dynamically imported module') ||
    error.message.includes('chunk load') ||
    error.message.includes('Loading chunk') ||
    error.message.includes('loading chunk') ||
    error.message.includes('Importing a module script failed') ||
    error.message.includes('module script failed');

  const isStaleCache =
    error instanceof ReferenceError &&
    error.message.includes('is not defined');

  if (isChunkError || isStaleCache) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const lastReload = sessionStorage.getItem(CHUNK_ERROR_KEY);
        const now = Date.now();

        if (!lastReload || now - parseInt(lastReload, 10) > RELOAD_DEBOUNCE_MS) {
          sessionStorage.setItem(CHUNK_ERROR_KEY, now.toString());
          if (typeof window !== 'undefined' && window.location) {
            window.location.reload();
            return true;
          }
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }

  return false;
}
