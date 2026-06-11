/**
 * Centralized Magic Number Constants & Configuration limits
 */

// Timing and caching configurations
export const VISIBILITY_REFRESH_COOLDOWN = 300_000; // 5 minutes in milliseconds
export const SWR_DEDUPING_INTERVAL = 300_000;       // 5 minutes in milliseconds
export const SWR_ERROR_RETRY_COUNT = 2;
export const STOCK_PRICE_CACHE_TTL = 900_000;       // 15 minutes in milliseconds

// Warning and maturity threshold offsets (in days)
export const FD_MATURITY_WARNING_DAYS = 30;
export const INSURANCE_RENEWAL_WARNING_DAYS = 60;

// Rebalancing algorithms
export const REBALANCING_MIN_ACTION = 5000; // Minimum action value threshold (pure INR)
