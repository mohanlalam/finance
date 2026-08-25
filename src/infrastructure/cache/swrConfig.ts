import { SWR_DEDUPING_INTERVAL, SWR_ERROR_RETRY_COUNT } from '../../utils/constants';

export const swrDefaultConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: SWR_DEDUPING_INTERVAL,
  errorRetryCount: SWR_ERROR_RETRY_COUNT,
  shouldRetryOnError: true,
};
