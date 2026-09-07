import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    "http://localhost:5173",
    "https://mohanlalam.github.io"
  ];
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : "https://mohanlalam.github.io";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Persistent rate limiting store backed by pin_rate_limits table
const MAX_FAILED_ATTEMPTS = 5;
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5-minute window

function getClientIp(req: Request): string {
  // 1. Cloudflare Connecting IP (overwritten at edge by Cloudflare, cannot be spoofed by client)
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  // 2. X-Real-IP (set by Supabase Kong API Gateway)
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  // 3. X-Forwarded-For: Take the LAST entry (appended by the closest trusted reverse proxy),
  //    never the first entry which is attacker-controlled and easily spoofed.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1]; // Rightmost proxy-verified IP
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

    if (data.attempt_count >= MAX_FAILED_ATTEMPTS) {
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

function getFDEffectiveValue(f: any, upToDate: Date = new Date()): number {
  const p = Number(f.principal_amount);
  const r = Number(f.interest_rate);
  const s = new Date(f.start_date);
  
  if (f.status === 'matured') {
    return Number(f.maturity_amount || 0);
  }
  
  const end = f.maturity_date && new Date(f.maturity_date).getTime() < upToDate.getTime()
    ? new Date(f.maturity_date)
    : upToDate;
    
  const timeDiff = end.getTime() - s.getTime();
  const years = timeDiff / (1000 * 3600 * 24 * 365.25);
  
  if (years > 0 && !isNaN(p) && !isNaN(r) && !isNaN(s.getTime())) {
    // FDs compound quarterly in Indian banking standard
    return p * Math.pow(1 + r / 400, 4 * years);
  }
  return p;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Server-side PIN verification (Fail Closed) with rate-limiting
  const serverPinHash = Deno.env.get("APP_PIN_HASH");
  if (!serverPinHash) {
    return new Response(JSON.stringify({ error: "Server PIN configuration missing" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const rateLimitKey = getRateLimitKey(req);
  const rateCheck = await checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: `Too many failed attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
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

  let isValid = false;

  // 1. Check ephemeral signed session token
  const sessionToken = req.headers.get("X-Session-Token") || req.headers.get("x-session-token");
  if (sessionToken) {
    isValid = await verifySessionToken(sessionToken, serverPinHash);
  }

  // 2. Fallback to direct X-App-Pin check for backward compatibility
  if (!isValid) {
    const clientPin = req.headers.get("X-App-Pin");
    if (clientPin) {
      if (timingSafeEqual(clientPin, serverPinHash)) {
        isValid = true;
      } else {
        try {
          const msgBuffer = new TextEncoder().encode(serverPinHash);
          const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashedServerPin = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
          if (timingSafeEqual(clientPin, hashedServerPin)) {
            isValid = true;
          }
        } catch (e) {
          console.error("Error hashing server PIN:", e);
        }
      }
    }
  }

  if (!isValid) {
    await recordFailedAttempt(rateLimitKey);
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid PIN" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Valid PIN: clear failed attempts for this composite client key
  await clearRateLimit(rateLimitKey);

  try {
    // 1. Fetch current assets to compute total net worth
    const [
      { data: holdings, error: hErr },
      { data: fixed_deposits, error: fdErr },
      { data: rd_accounts, error: rdErr },
      { data: sip_accounts, error: sipErr },
      { data: gold_holdings, error: goldErr },
      { data: real_estate, error: reErr },
      { data: priceCache, error: cacheErr },
    ] = await Promise.all([
      supabase.from("holdings").select("*"),
      supabase.from("fixed_deposits").select("*"),
      supabase.from("rd_accounts").select("*"),
      supabase.from("sip_accounts").select("*"),
      supabase.from("gold_holdings").select("*"),
      supabase.from("real_estate").select("*"),
      supabase.from("market_price_cache").select("*"),
    ]);

    if (hErr) throw hErr;
    if (fdErr) throw fdErr;
    if (rdErr) throw rdErr;
    if (sipErr) throw sipErr;
    if (goldErr) throw goldErr;
    if (reErr) throw reErr;

    // Stocks Value
    const stocksValue = (holdings || []).reduce((sum, h) => {
      const cached = (priceCache || []).find(c => c.yahoo_symbol === h.yahoo_symbol);
      const ltp = cached?.ltp !== undefined && cached?.ltp !== null ? Number(cached.ltp) : Number(h.avg_price);
      return sum + (Number(h.qty) * ltp);
    }, 0);

    // FD Value
    const fdValue = (fixed_deposits || []).reduce((sum, f) => sum + getFDEffectiveValue(f), 0);

    // RD Value
    const rdValue = (rd_accounts || []).reduce((sum, r) => {
      if (r.status === 'matured') return sum + Number(r.maturity_amount || 0);
      if (Array.isArray(r.contributions) && r.contributions.length > 0) {
        const cSum = r.contributions.reduce((s: number, c: { amount?: number }) => s + Math.max(0, Number(c?.amount) || 0), 0);
        return sum + cSum;
      }
      return sum + Number(r.monthly_deposit || 0);
    }, 0);

    // SIP Value
    const sipValue = (sip_accounts || []).reduce((sum, s) => {
      return sum + Number(s.fallback_valuation || (Number(s.monthly_sip || 0) * 12));
    }, 0);

    // Gold Value
    const goldValue = (gold_holdings || []).reduce((sum, g) => sum + Number(g.current_valuation || g.purchase_price || 0), 0);

    // Real Estate Value
    const reValue = (real_estate || []).reduce((sum, r) => sum + Number(r.current_valuation || r.purchase_price || 0), 0);

    // Timeline Net Worth encompasses Stocks & ETFs + FDs only
    const totalValue = stocksValue + fdValue;
    const snapshotDate = new Date().toISOString().split('T')[0];

    // 2. Upsert snapshot
    const { data: upsertData, error: upsertErr } = await supabase
      .from("net_worth_history")
      .upsert({
        snapshot_date: snapshotDate,
        total_value: totalValue,
        stocks_value: stocksValue,
        fd_value: fdValue,
        rd_value: rdValue,
        sip_value: sipValue,
        gold_value: goldValue,
        real_estate_value: reValue,
      }, { onConflict: "snapshot_date" })
      .select()
      .single();

    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ success: true, data: upsertData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    console.error("Error in snapshot-net-worth function:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
