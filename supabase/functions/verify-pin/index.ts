import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    "http://localhost:5173",
    "https://mohanlalam.github.io"
  ];
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : "https://mohanlalam.github.io";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-App-Pin, X-Session-Token, X-Device-Id",
  };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signSessionToken(payload: Record<string, unknown>, secret: string): Promise<string> {
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

// Persistent rate limiting configuration backed by pin_rate_limits table
const MAX_ATTEMPTS = 5;
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5-minute window

function getClientIp(req: Request): string {
  // 1. Cloudflare Connecting IP (overwritten at edge by Cloudflare, cannot be spoofed by client)
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  // 2. X-Real-IP (set by Supabase Kong API Gateway)
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  // 3. X-Forwarded-For: In the Supabase / Deno Deploy proxy topology, the rightmost IP
  // is appended by the nearest trusted infrastructure reverse proxy (Kong / Deno Edge Gateway).
  // Picking the last entry ensures an attacker cannot spoof an arbitrary client IP by prepending
  // falsified headers. Note: If a custom external CDN is ever placed in front, ensure the CDN's
  // client IP header or trusted hop count is configured accordingly.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1]; // Rightmost proxy-verified IP in Deno Deploy topology
    }
  }

  return "unknown";
}

function getRateLimitKey(req: Request): string {
  const clientIp = getClientIp(req);
  // Composite device/client keying to mitigate Indian mobile CGNAT lockout (Jio/Airtel)
  const deviceId = req.headers.get("x-device-id")?.trim() || req.headers.get("x-client-info")?.trim() || req.headers.get("user-agent")?.trim() || "default-device";
  return `${clientIp}:${deviceId}`;
}

async function checkRateLimit(key: string): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  try {
    const now = Date.now();
    const { data, error } = await supabase
      .from("pin_rate_limits")
      .select("attempt_count, window_start")
      .eq("rate_key", key)
      .maybeSingle();

    if (error || !data) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const windowStart = new Date(data.window_start).getTime();
    if (now - windowStart > RATE_WINDOW_MS) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (data.attempt_count >= MAX_ATTEMPTS) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowStart + RATE_WINDOW_MS - now) / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  } catch (err) {
    console.error("Persistent rate limit check failed:", err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

async function recordFailedAttempt(key: string): Promise<void> {
  try {
    const now = Date.now();
    const { data } = await supabase
      .from("pin_rate_limits")
      .select("attempt_count, window_start")
      .eq("rate_key", key)
      .maybeSingle();

    if (!data || (now - new Date(data.window_start).getTime()) > RATE_WINDOW_MS) {
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
    console.error("Recording failed attempt failed:", err);
  }
}

async function clearRateLimit(key: string): Promise<void> {
  try {
    await supabase
      .from("pin_rate_limits")
      .delete()
      .eq("rate_key", key);
  } catch (err) {
    console.error("Clearing rate limit failed:", err);
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rateLimitKey = getRateLimitKey(req);
  const rateCheck = await checkRateLimit(rateLimitKey);

  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: `Too many attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rateCheck.retryAfterSeconds),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { pin_hash } = body as { pin_hash?: string };

    if (!pin_hash || typeof pin_hash !== "string") {
      return new Response(JSON.stringify({ error: "pin_hash is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serverPinHash = Deno.env.get("APP_PIN_HASH");

    if (!serverPinHash) {
      return new Response(JSON.stringify({ verified: false, error: "Server PIN not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compare: client sends SHA-256 of user input.
    // Server stores either the raw PIN or its SHA-256 hash in APP_PIN_HASH.
    let isValid = false;

    // Direct match (server stores SHA-256 hash)
    if (timingSafeEqual(pin_hash, serverPinHash)) {
      isValid = true;
    } else {
      // Server stores raw PIN — compute its SHA-256 and compare
      try {
        const msgBuffer = new TextEncoder().encode(serverPinHash);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedServerPin = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        if (timingSafeEqual(pin_hash, hashedServerPin)) {
          isValid = true;
        }
      } catch (e) {
        console.error("Error hashing server PIN:", e);
      }
    }

    if (!isValid) {
      await recordFailedAttempt(rateLimitKey);
      return new Response(JSON.stringify({ error: "Incorrect PIN", verified: false }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Success — clear rate limit for this client
    await clearRateLimit(rateLimitKey);

    const expiresAt = Date.now() + 12 * 60 * 60 * 1000; // 12 hours
    const sessionToken = await signSessionToken(
      {
        iat: Date.now(),
        exp: expiresAt,
        scope: "vault-session",
      },
      serverPinHash
    );

    return new Response(
      JSON.stringify({
        verified: true,
        session_token: sessionToken,
        expires_at: expiresAt,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e: unknown) {
    console.error("Error in verify-pin:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
