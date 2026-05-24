import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

async function fetchQuote(ticker: string, yahooSymbol: string): Promise<QuoteResult> {
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
      return { ticker, ltp: null, todayPct: null, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta) {
      return { ticker, ltp: null, todayPct: null, error: "no meta data" };
    }

    const ltp: number = meta.regularMarketPrice ?? meta.previousClose;
    const prevClose: number = meta.chartPreviousClose ?? meta.previousClose;
    const todayPct = prevClose && ltp ? ((ltp - prevClose) / prevClose) * 100 : null;

    return { ticker, ltp, todayPct };
  } catch (e: unknown) {
    return { ticker, ltp: null, todayPct: null, error: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { symbols }: { symbols: SymbolRequest[] } = await req.json();

    if (!symbols || !Array.isArray(symbols)) {
      return new Response(JSON.stringify({ error: "symbols array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.all(
      symbols.map(({ ticker, yahooSymbol }) => fetchQuote(ticker, yahooSymbol))
    );

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
