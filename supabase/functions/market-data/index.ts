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
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-App-Pin, X-Session-Token",
  };
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

interface SymbolRequest {
  ticker: string;
  yahooSymbol: string;
}

interface QuoteResult {
  ticker: string;
  ltp: number | null;
  todayPct: number | null;
  error?: string;
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

async function fetchQuote(ticker: string, yahooSymbol: string): Promise<Omit<QuoteResult, "ticker">> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      return { ltp: null, todayPct: null, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta) {
      return { ltp: null, todayPct: null, error: "no meta data" };
    }

    const ltp: number = meta.regularMarketPrice ?? meta.previousClose;
    const prevClose: number = meta.chartPreviousClose ?? meta.previousClose;
    const todayPct = prevClose && ltp ? ((ltp - prevClose) / prevClose) * 100 : null;

    return { ltp, todayPct };
  } catch (e: unknown) {
    return { ltp: null, todayPct: null, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timeoutId);
  }
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
      if (clientPin === serverPinHash) {
        isValid = true;
      } else {
        // If serverPinHash is raw (e.g. 4-6 digits) and clientPin is hashed, check SHA-256 hash of serverPinHash
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
    const { symbols }: { symbols: SymbolRequest[] } = await req.json();

    if (!symbols || !Array.isArray(symbols)) {
      return new Response(JSON.stringify({ error: "symbols array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (symbols.length > 100) {
      return new Response(JSON.stringify({ error: "Too many symbols requested (max 100 allowed per request)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const yahooSymbols = symbols.map(s => s.yahooSymbol);

    // Fetch cached prices from database cache table
    const { data: cachedPrices, error: cacheErr } = await supabase
      .from("market_price_cache")
      .select("*")
      .in("yahoo_symbol", yahooSymbols);

    if (cacheErr) {
      console.error("Cache fetch error (falling back to live):", cacheErr);
    }

    const now = Date.now();
    const cacheAgeLimitMs = 2 * 60 * 1000; // 2 minutes cache duration

    const freshCache = (cachedPrices || []).filter(c => {
      const updatedAt = new Date(c.updated_at).getTime();
      return (now - updatedAt) < cacheAgeLimitMs;
    });

    const results: QuoteResult[] = [];
    const symbolsToFetch: SymbolRequest[] = [];

    symbols.forEach(s => {
      const cached = freshCache.find(c => c.yahoo_symbol === s.yahooSymbol);
      if (cached) {
        results.push({
          ticker: s.ticker,
          ltp: Number(cached.ltp),
          todayPct: Number(cached.today_pct),
        });
      } else {
        symbolsToFetch.push(s);
      }
    });

    if (symbolsToFetch.length > 0) {
      const fetchedResults = await Promise.all(
        symbolsToFetch.map(async ({ ticker, yahooSymbol }) => {
          const quote = await fetchQuote(ticker, yahooSymbol);
          return { ticker, yahooSymbol, ...quote };
        })
      );

      // Write valid fetched results to database cache table
      const cacheUpserts = fetchedResults
        .filter(r => r.ltp !== null && r.todayPct !== null)
        .map(r => ({
          yahoo_symbol: r.yahooSymbol,
          ltp: r.ltp,
          today_pct: r.todayPct,
          updated_at: new Date().toISOString()
        }));

      if (cacheUpserts.length > 0) {
        const { error: upsertErr } = await supabase
          .from("market_price_cache")
          .upsert(cacheUpserts, { onConflict: "yahoo_symbol" });

        if (upsertErr) {
          console.error("Failed to upsert cache:", upsertErr);
        }
      }

      fetchedResults.forEach(r => {
        results.push({
          ticker: r.ticker,
          ltp: r.ltp,
          todayPct: r.todayPct,
          ...(r.error ? { error: r.error } : {})
        });
      });
    }

    return new Response(JSON.stringify({ data: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
