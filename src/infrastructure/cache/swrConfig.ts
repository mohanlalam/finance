import { SWR_DEDUPING_INTERVAL, SWR_ERROR_RETRY_COUNT } from '../../utils/constants';

export const swrDefaultConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  // Don't auto-revalidate stale cache — rely on explicit refresh flow
  // (manual ↻ button, pull-to-refresh, keyboard shortcut Ctrl+Shift+R)
  revalidateIfStale: false,
  dedupingInterval: SWR_DEDUPING_INTERVAL,
  errorRetryCount: SWR_ERROR_RETRY_COUNT,
  shouldRetryOnError: true,
};
