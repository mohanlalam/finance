// Supabase Edge Functions Shared Security & Rate Limiting Module
// Architecture v3.0 - Single-Family Zero-Trust Security Gateway

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export const DEFAULT_RATE_WINDOW_MS = 5 * 60 * 1000; // 5-minute window
export const MAX_DEVICE_ATTEMPTS = 5;
export const MAX_IP_ATTEMPTS = 25;

export const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://mohanlalam.github.io",
];

export function getCorsHeaders(req: Request, extraHeaders: string[] = []): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "https://mohanlalam.github.io";
  
  const defaultHeaders = [
    "Content-Type",
    "Authorization",
    "X-Client-Info",
    "Apikey",
    "X-App-Pin",
    "X-Session-Token",
    "X-Device-Id",
  ];
  const combinedHeaders = Array.from(new Set([...defaultHeaders, ...extraHeaders])).join(", ");

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": combinedHeaders,
  };
}

/**
 * Constant-time string equality check to prevent timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Signs a payload with HMAC-SHA256 to create a session token.
 */
export async function signSessionToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(enc.encode(payloadStr));

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(`vault_session_key:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const sigB64 = base64UrlEncode(new Uint8Array(sigBuffer));

  return `${payloadB64}.${sigB64}`;
}

/**
 * Generates a default HMAC-SHA256 signed session token with 24-hour expiration.
 */
export async function generateSessionToken(secret: string): Promise<string> {
  return signSessionToken(
    {
      sub: "family_vault_session",
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000,
    },
    secret
  );
}

/**
 * Verifies an HMAC-SHA256 session token against the expected secret.
 * Handles both 2-part and 3-part (JWT) token formats.
 */
export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2 && parts.length !== 3) return false;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(`vault_session_key:${secret}`),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    if (parts.length === 3) {
      const [headerB64, payloadB64, sigB64] = parts;
      const dataToVerify = `${headerB64}.${payloadB64}`;
      const sigBytes = base64UrlDecode(sigB64);
      const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(dataToVerify));
      if (!isValid) return false;

      const payloadBytes = base64UrlDecode(payloadB64);
      const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
      if (typeof payload.exp === "number" && payload.exp < Date.now()) {
        return false;
      }
      return true;
    } else {
      const [payloadB64, sigB64] = parts;
      const sigBytes = base64UrlDecode(sigB64);
      const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payloadB64));
      if (!isValid) return false;

      const payloadBytes = base64UrlDecode(payloadB64);
      const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
      if (typeof payload.exp === "number" && payload.exp < Date.now()) {
        return false;
      }
      return true;
    }
  } catch {
    return false;
  }
}

/**
 * Extracts client IP safely using proxy hierarchy (Cloudflare -> X-Real-IP -> rightmost XFF).
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1]; // Rightmost proxy-verified IP in Deno Deploy topology
    }
  }

  return "unknown";
}

/**
 * Generates composite device rate limit key and IP key.
 */
export function getRateLimitKey(req: Request): string {
  const clientIp = getClientIp(req);
  const deviceId = req.headers.get("x-device-id")?.trim() || req.headers.get("x-client-info")?.trim() || req.headers.get("user-agent")?.trim() || "default-device";
  return `${clientIp}:${deviceId}`;
}

export function getRateLimitKeys(req: Request): { deviceKey: string; ipKey: string } {
  const clientIp = getClientIp(req);
  const deviceId = req.headers.get("x-device-id")?.trim() || req.headers.get("x-client-info")?.trim() || req.headers.get("user-agent")?.trim() || "default-device";
  return {
    deviceKey: `${clientIp}:${deviceId}`,
    ipKey: `ip:${clientIp}`,
  };
}

/**
 * Persistent rate limiting check with FAIL-CLOSED security semantics.
 * On database query error or exception, rejects request to prevent brute-force bypass.
 */
export async function checkSingleLimit(
  supabase: SupabaseClient,
  key: string,
  maxAttempts: number = MAX_DEVICE_ATTEMPTS,
  windowMs: number = DEFAULT_RATE_WINDOW_MS
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  try {
    const now = Date.now();
    const { data, error } = await supabase
      .from("pin_rate_limits")
      .select("attempt_count, window_start")
      .eq("rate_key", key)
      .maybeSingle();

    if (error) {
      // FAIL-CLOSED: Database query error must NOT allow brute-force attempts to proceed
      console.error("[RateLimit] Database error while checking limit, failing closed:", error);
      return { allowed: false, retryAfterSeconds: 60 };
    }

    if (!data) {
      // No attempts recorded yet
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const windowStart = new Date(data.window_start).getTime();
    if (now - windowStart > windowMs) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (data.attempt_count >= maxAttempts) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  } catch (err) {
    // FAIL-CLOSED: Internal exception must reject request safely
    console.error("[RateLimit] Unexpected error during rate limit check, failing closed:", err);
    return { allowed: false, retryAfterSeconds: 60 };
  }
}

/**
 * Dual-tier rate limiting checking both device-specific and IP-wide ceilings.
 */
export async function checkDualRateLimit(
  supabase: SupabaseClient,
  keys: { deviceKey: string; ipKey: string },
  deviceMax: number = MAX_DEVICE_ATTEMPTS,
  ipMax: number = MAX_IP_ATTEMPTS,
  windowMs: number = DEFAULT_RATE_WINDOW_MS
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const [deviceCheck, ipCheck] = await Promise.all([
    checkSingleLimit(supabase, keys.deviceKey, deviceMax, windowMs),
    checkSingleLimit(supabase, keys.ipKey, ipMax, windowMs),
  ]);

  if (!deviceCheck.allowed) return deviceCheck;
  if (!ipCheck.allowed) return ipCheck;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Records a failed attempt for a given rate limit key.
 */
export async function recordFailedAttempt(
  supabase: SupabaseClient,
  key: string,
  windowMs: number = DEFAULT_RATE_WINDOW_MS
): Promise<void> {
  try {
    const now = Date.now();
    const { data } = await supabase
      .from("pin_rate_limits")
      .select("attempt_count, window_start")
      .eq("rate_key", key)
      .maybeSingle();

    if (!data || (now - new Date(data.window_start).getTime()) > windowMs) {
      await supabase
        .from("pin_rate_limits")
        .upsert({
          rate_key: key,
          attempt_count: 1,
          window_start: new Date(now).toISOString(),
        });
    } else {
      await supabase
        .from("pin_rate_limits")
        .update({
          attempt_count: (data.attempt_count || 0) + 1,
        })
        .eq("rate_key", key);
    }
  } catch (err) {
    console.error("[RateLimit] Recording failed attempt failed:", err);
  }
}

/**
 * Records failed attempts for both device and IP keys.
 */
export async function recordFailedAttempts(
  supabase: SupabaseClient,
  keys: { deviceKey: string; ipKey: string },
  windowMs: number = DEFAULT_RATE_WINDOW_MS
): Promise<void> {
  await Promise.all([
    recordFailedAttempt(supabase, keys.deviceKey, windowMs),
    recordFailedAttempt(supabase, keys.ipKey, windowMs),
  ]);
}

/**
 * Clears rate limit upon successful authentication.
 */
export async function clearRateLimit(
  supabase: SupabaseClient,
  key: string
): Promise<void> {
  try {
    await supabase
      .from("pin_rate_limits")
      .delete()
      .eq("rate_key", key);
  } catch (err) {
    console.error("[RateLimit] Clearing rate limit failed:", err);
  }
}

/**
 * Clears rate limit for both device and IP keys.
 */
export async function clearRateLimits(
  supabase: SupabaseClient,
  keys: { deviceKey: string; ipKey: string }
): Promise<void> {
  try {
    await supabase
      .from("pin_rate_limits")
      .delete()
      .in("rate_key", [keys.deviceKey, keys.ipKey]);
  } catch (err) {
    console.error("[RateLimit] Clearing dual rate limits failed:", err);
  }
}
