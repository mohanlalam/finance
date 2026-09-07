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
    "http://127.0.0.1:5173",
    "https://mohanlalam.github.io"
  ];
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : "https://mohanlalam.github.io";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-App-Pin, X-Session-Token, X-Gemini-Key, X-Device-Id",
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

function base64UrlDecode(str: string): Uint8Array {
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

async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [payloadB64, sigB64] = parts;
    const enc = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(`vault_session_key:${secret}`),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlDecode(sigB64);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      enc.encode(payloadB64)
    );

    if (!isValid) return false;

    const payloadBytes = base64UrlDecode(payloadB64);
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));

    if (typeof payload.exp === "number" && payload.exp < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Persistent rate limiting store backed by pin_rate_limits table (max 20 requests per 60s window per IP/device)
const MAX_REQUESTS = 20;
const WINDOW_MS = 60 * 1000;

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
      await supabase.from("pin_rate_limits").upsert({
        rate_key: key,
        attempt_count: 1,
        window_start: new Date(now).toISOString(),
      });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const windowStart = new Date(data.window_start).getTime();
    if (now - windowStart > WINDOW_MS) {
      await supabase.from("pin_rate_limits").upsert({
        rate_key: key,
        attempt_count: 1,
        window_start: new Date(now).toISOString(),
      });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (data.attempt_count >= MAX_REQUESTS) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowStart + WINDOW_MS - now) / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    await supabase
      .from("pin_rate_limits")
      .update({
        attempt_count: data.attempt_count + 1,
      })
      .eq("rate_key", key);

    return { allowed: true, retryAfterSeconds: 0 };
  } catch (err) {
    console.error("Persistent rate limit check failed in gemini-proxy:", err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limiting check
  const rateLimitKey = getRateLimitKey(req);
  const { allowed, retryAfterSeconds } = await checkRateLimit(rateLimitKey);
  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSeconds),
        },
      }
    );
  }

  // Server-side PIN verification (Fail Closed)
  const serverPinHash = Deno.env.get("APP_PIN_HASH");
  if (!serverPinHash) {
    return new Response(JSON.stringify({ error: "Server PIN configuration missing" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let isValidPin = false;

  // 1. Check ephemeral signed session token
  const sessionToken = req.headers.get("X-Session-Token") || req.headers.get("x-session-token");
  if (sessionToken) {
    isValidPin = await verifySessionToken(sessionToken, serverPinHash);
  }

  // 2. Fallback to direct X-App-Pin check for backward compatibility
  if (!isValidPin) {
    const clientPin = req.headers.get("X-App-Pin");
    if (clientPin) {
      if (timingSafeEqual(clientPin, serverPinHash)) {
        isValidPin = true;
      } else {
        try {
          const msgBuffer = new TextEncoder().encode(serverPinHash);
          const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashedServerPin = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
          if (timingSafeEqual(clientPin, hashedServerPin)) {
            isValidPin = true;
          }
        } catch (e) {
          console.error("Error hashing server PIN:", e);
        }
      }
    }
  }

  if (!isValidPin) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid PIN" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, payload, model = "gemini-2.0-flash" } = body;

    // Resolve API key: prefer server-side secret, fallback to client-supplied header/body key
    const serverKey = Deno.env.get("GEMINI_API_KEY")?.trim();
    const clientKey = req.headers.get("X-Gemini-Key")?.trim() || body.apiKey?.trim();
    const apiKey = serverKey || clientKey;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Gemini API Key is not configured on server or client.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Action: models
    if (action === "models") {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: generate
    if (action === "generate" && payload) {
      const candidateModels = [
        model || "gemini-2.0-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-pro",
      ];
      const uniqueModels = [...new Set(candidateModels)];

      let lastResponse: Response | null = null;
      let lastData: Record<string, unknown> | null = null;

      for (const m of uniqueModels) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await res.json();
          lastResponse = res;
          lastData = data;

          if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return new Response(JSON.stringify(data), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          if (res.status === 429) {
            return new Response(JSON.stringify(data), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch (_err) {
          // Try next model
        }
      }

      return new Response(
        JSON.stringify(lastData || { error: "Failed to generate content with available models." }),
        {
          status: lastResponse?.status || 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Supported: 'models', 'generate'" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
