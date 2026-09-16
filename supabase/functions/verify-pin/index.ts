import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  getCorsHeaders,
  timingSafeEqual,
  signSessionToken,
  getRateLimitKeys,
  checkDualRateLimit,
  recordFailedAttempts,
  clearRateLimits,
} from "../_shared/auth.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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

  const rateKeys = getRateLimitKeys(req);
  const rateCheck = await checkDualRateLimit(supabase, rateKeys);

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
      await recordFailedAttempts(supabase, rateKeys);
      return new Response(JSON.stringify({ error: "Incorrect PIN", verified: false }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Success — clear rate limit for this client
    await clearRateLimits(supabase, rateKeys);

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
