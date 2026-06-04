import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };
}

// In-memory rate limiting store (resets on cold start, which is acceptable for Edge Functions)
const attempts: Map<string, { count: number; firstAttempt: number }> = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5-minute window

function getRateLimitKey(req: Request): string {
  // Use X-Forwarded-For or fall back to a generic key
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || (now - record.firstAttempt) > WINDOW_MS) {
    // Window expired or no record — reset
    attempts.set(key, { count: 1, firstAttempt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.firstAttempt + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function clearRateLimit(key: string): void {
  attempts.delete(key);
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
  const rateCheck = checkRateLimit(rateLimitKey);

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
      // No PIN configured server-side — allow access (open mode)
      return new Response(JSON.stringify({ verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compare: client sends SHA-256 of user input.
    // Server stores either the raw PIN or its SHA-256 hash in APP_PIN_HASH.
    let isValid = false;

    // Direct match (server stores SHA-256 hash)
    if (pin_hash === serverPinHash) {
      isValid = true;
    } else {
      // Server stores raw PIN — compute its SHA-256 and compare
      try {
        const msgBuffer = new TextEncoder().encode(serverPinHash);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedServerPin = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        if (pin_hash === hashedServerPin) {
          isValid = true;
        }
      } catch (e) {
        console.error("Error hashing server PIN:", e);
      }
    }

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Incorrect PIN", verified: false }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Success — clear rate limit for this IP
    clearRateLimit(rateLimitKey);

    return new Response(JSON.stringify({ verified: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
