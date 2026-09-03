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
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-App-Pin",
  };
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// In-memory rate limiting store for failed PIN attempts (resets on cold start)
const pinFailedAttempts: Map<string, { count: number; firstAttempt: number }> = new Map();
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

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = pinFailedAttempts.get(ip);

  if (!record || (now - record.firstAttempt) > RATE_WINDOW_MS) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.firstAttempt + RATE_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = pinFailedAttempts.get(ip);
  if (!record || (now - record.firstAttempt) > RATE_WINDOW_MS) {
    pinFailedAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
  }
}

function clearRateLimit(ip: string): void {
  pinFailedAttempts.delete(ip);
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
    // FDs compound half-yearly in Indian banking standard
    return p * Math.pow(1 + r / 200, 2 * years);
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

  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp);
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

  const clientPin = req.headers.get("X-App-Pin");
  let isValid = false;
  if (clientPin) {
    if (clientPin === serverPinHash) {
      isValid = true;
    } else {
      try {
        const msgBuffer = new TextEncoder().encode(serverPinHash);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedServerPin = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        if (clientPin === hashedServerPin) {
          isValid = true;
        }
      } catch (e) {
        console.error("Error hashing server PIN:", e);
      }
    }
  }

  if (!isValid) {
    recordFailedAttempt(clientIp);
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid PIN" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Valid PIN: clear failed attempts for this client IP
  clearRateLimit(clientIp);

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
