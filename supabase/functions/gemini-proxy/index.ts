import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

// In-memory rate limiting store (max 20 requests per 60s window per IP/device)
const requestRateMap: Map<string, { count: number; firstAttempt: number }> = new Map();
const MAX_REQUESTS = 20;
const WINDOW_MS = 60 * 1000;

function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
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

function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = requestRateMap.get(key);

  if (!record || (now - record.firstAttempt) > WINDOW_MS) {
    requestRateMap.set(key, { count: 1, firstAttempt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((record.firstAttempt + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
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
  const { allowed, retryAfterSeconds } = checkRateLimit(rateLimitKey);
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
    const { action, payload, model = "gemini-2.5-flash" } = body;

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
        model,
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash",
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
