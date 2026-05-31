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
    return p * Math.pow(1 + r / 400, 4 * years);
  }
  return p;
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
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid PIN" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }

  try {
    // 1. Fetch current assets to compute total net worth
    const [
      { data: holdings, error: hErr },
      { data: fixed_deposits, error: fdErr },
      { data: gold_holdings, error: goldErr },
      { data: real_estate, error: reErr },
      { data: priceCache, error: cacheErr },
    ] = await Promise.all([
      supabase.from("holdings").select("*"),
      supabase.from("fixed_deposits").select("*"),
      supabase.from("gold_holdings").select("*"),
      supabase.from("real_estate").select("*"),
      supabase.from("market_price_cache").select("*"),
    ]);

    if (hErr) throw hErr;
    if (fdErr) throw fdErr;
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

    // Gold Value
    const goldValue = (gold_holdings || []).reduce((sum, g) => sum + Number(g.current_valuation || g.purchase_price || 0), 0);

    // Real Estate Value
    const reValue = (real_estate || []).reduce((sum, r) => sum + Number(r.current_valuation || r.purchase_price || 0), 0);

    const totalValue = stocksValue + fdValue + goldValue + reValue;
    const snapshotDate = new Date().toISOString().split('T')[0];

    // 2. Upsert snapshot
    const { data: upsertData, error: upsertErr } = await supabase
      .from("net_worth_history")
      .upsert({
        snapshot_date: snapshotDate,
        total_value: totalValue,
        stocks_value: stocksValue,
        fd_value: fdValue,
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
