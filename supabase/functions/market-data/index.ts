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

async function fetchQuote(ticker: string, yahooSymbol: string): Promise<Omit<QuoteResult, "ticker">> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`;
    const res = await fetch(url, {
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
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Server-side PIN verification
  const serverPinHash = Deno.env.get("APP_PIN_HASH");
  if (serverPinHash) {
    const clientPin = req.headers.get("X-App-Pin");
    if (clientPin !== serverPinHash) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid PIN" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }

  try {
    const { symbols }: { symbols: SymbolRequest[] } = await req.json();

    if (!symbols || !Array.isArray(symbols)) {
      return new Response(JSON.stringify({ error: "symbols array required" }), {
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
