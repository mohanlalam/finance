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
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-App-Pin",
  };
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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

    console.log(`PIN verification: clientPin=${clientPin ? "[provided]" : "[empty]"}, serverPinHash=${serverPinHash ? "[configured]" : "[empty]"}, isValid=${isValid}`);

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid PIN" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "GET" && action === "list") {
      const [
        { data: portfolios, error: pErr },
        { data: holdings, error: hErr },
        { data: fixed_deposits, error: fdErr },
        { data: gold_holdings, error: goldErr },
        { data: real_estate, error: reErr },
        { data: insurances, error: insErr },
        { data: documents, error: docErr },
        { data: priceCache, error: cacheErr },
      ] = await Promise.all([
        supabase.from("portfolios").select("*").order("name"),
        supabase.from("holdings").select("*").order("sno"),
        supabase.from("fixed_deposits").select("*").order("created_at"),
        supabase.from("gold_holdings").select("*").order("created_at"),
        supabase.from("real_estate").select("*").order("created_at"),
        supabase.from("insurances").select("*").order("created_at"),
        supabase.from("documents").select("*").order("created_at"),
        supabase.from("market_price_cache").select("*"),
      ]);

      if (pErr) throw pErr;
      if (hErr) throw hErr;
      if (fdErr) throw fdErr;
      if (goldErr) throw goldErr;
      if (reErr) throw reErr;
      if (insErr) throw insErr;
      if (docErr) throw docErr;

      // Merge cached prices into holdings
      const holdingsWithCache = (holdings || []).map(h => {
        const cached = (priceCache || []).find(c => c.yahoo_symbol === h.yahoo_symbol);
        return {
          ...h,
          cached_ltp: cached?.ltp ?? null,
          cached_today_pct: cached?.today_pct ?? null
        };
      });

      return new Response(JSON.stringify({ portfolios, holdings: holdingsWithCache, fixed_deposits, gold_holdings, real_estate, insurances, documents }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && action === "add_portfolio") {
      const body = await req.json();
      const { name, label } = body;

      if (!name || !label) {
        throw new Error("Portfolio name and label are required");
      }

      const formattedName = name.toLowerCase().trim().replace(/\s+/g, '-');

      const { data, error } = await supabase
        .from("portfolios")
        .insert({
          name: formattedName,
          label: label.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ portfolio: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && action === "add") {
      const body = await req.json();
      const { asset_type, portfolioName, ...payload } = body;

      const { data: portfolio, error: pErr } = await supabase
        .from("portfolios")
        .select("id")
        .eq("name", portfolioName)
        .maybeSingle();

      if (pErr) throw pErr;
      if (!portfolio) throw new Error(`Portfolio '${portfolioName}' not found`);

      let insertData;
      let insertError;

      if (!asset_type || asset_type === "stock") {
        const { data: maxSno } = await supabase
          .from("holdings")
          .select("sno")
          .eq("portfolio_id", portfolio.id)
          .order("sno", { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextSno = (maxSno?.sno ?? 0) + 1;

        const res = await supabase
          .from("holdings")
          .insert({
            portfolio_id: portfolio.id,
            sno: nextSno,
            stock_name: payload.stockName,
            ticker: payload.ticker.toUpperCase(),
            yahoo_symbol: payload.yahooSymbol,
            qty: Number(payload.qty),
            avg_price: Number(payload.avgPrice),
            amount_invested: Number(payload.amountInvested),
            week_low_52: Number(payload.weekLow52 ?? 0),
            week_high_52: Number(payload.weekHigh52 ?? 0),
          })
          .select()
          .single();
        insertData = res.data;
        insertError = res.error;
      } else if (asset_type === "fd") {
        const res = await supabase
          .from("fixed_deposits")
          .insert({
            portfolio_id: portfolio.id,
            bank_name: payload.bankName,
            principal_amount: Number(payload.principalAmount),
            interest_rate: Number(payload.interestRate),
            start_date: payload.startDate,
            maturity_date: payload.maturityDate,
            maturity_amount: Number(payload.maturityAmount),
            status: payload.status || "active",
          })
          .select()
          .single();
        insertData = res.data;
        insertError = res.error;
      } else if (asset_type === "gold") {
        const res = await supabase
          .from("gold_holdings")
          .insert({
            portfolio_id: portfolio.id,
            item_name: payload.itemName,
            purity: payload.purity,
            weight_grams: Number(payload.weightGrams),
            purchase_price: Number(payload.purchasePrice),
            current_valuation: Number(payload.currentValuation ?? payload.purchasePrice),
            purchase_date: payload.purchaseDate,
          })
          .select()
          .single();
        insertData = res.data;
        insertError = res.error;
      } else if (asset_type === "real_estate") {
        const res = await supabase
          .from("real_estate")
          .insert({
            portfolio_id: portfolio.id,
            property_name: payload.propertyName,
            property_type: payload.propertyType,
            location: payload.location,
            purchase_price: Number(payload.purchasePrice),
            current_valuation: Number(payload.currentValuation),
            purchase_date: payload.purchaseDate,
            monthly_rent: Number(payload.monthlyRent ?? 0),
          })
          .select()
          .single();
        insertData = res.data;
        insertError = res.error;
      } else if (asset_type === "insurance") {
        const res = await supabase
          .from("insurances")
          .insert({
            portfolio_id: portfolio.id,
            insurance_type: payload.insuranceType,
            provider: payload.provider,
            policy_name: payload.policyName,
            policy_number: payload.policyNumber,
            sum_assured: Number(payload.sumAssured),
            premium_amount: Number(payload.premiumAmount),
            renewal_date: payload.renewalDate,
          })
          .select()
          .single();
        insertData = res.data;
        insertError = res.error;
      } else if (asset_type === "document") {
        const res = await supabase
          .from("documents")
          .insert({
            portfolio_id: portfolio.id,
            name: payload.name,
            file_path: payload.filePath,
            file_type: payload.fileType,
            asset_type: payload.linkedAssetType || "general",
            asset_id: payload.linkedAssetId,
          })
          .select()
          .single();
        insertData = res.data;
        insertError = res.error;
      } else {
        throw new Error(`Invalid asset type '${asset_type}'`);
      }

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ data: insertData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "PATCH" && action === "update") {
      const body = await req.json();
      const { asset_type, holdingId, id, ...payload } = body;
      const targetId = id || holdingId;

      if (!targetId) throw new Error("ID is required");

      const updates: Record<string, unknown> = {};
      let table = "holdings";

      if (!asset_type || asset_type === "stock") {
        table = "holdings";
        if (payload.qty !== undefined) updates.qty = Number(payload.qty);
        if (payload.avgPrice !== undefined) updates.avg_price = Number(payload.avgPrice);
        if (payload.amountInvested !== undefined) updates.amount_invested = Number(payload.amountInvested);
      } else if (asset_type === "fd") {
        table = "fixed_deposits";
        if (payload.bankName !== undefined) updates.bank_name = payload.bankName;
        if (payload.principalAmount !== undefined) updates.principal_amount = Number(payload.principalAmount);
        if (payload.interestRate !== undefined) updates.interest_rate = Number(payload.interestRate);
        if (payload.startDate !== undefined) updates.start_date = payload.startDate;
        if (payload.maturityDate !== undefined) updates.maturity_date = payload.maturityDate;
        if (payload.maturityAmount !== undefined) updates.maturity_amount = Number(payload.maturityAmount);
        if (payload.status !== undefined) updates.status = payload.status;
      } else if (asset_type === "gold") {
        table = "gold_holdings";
        if (payload.itemName !== undefined) updates.item_name = payload.itemName;
        if (payload.purity !== undefined) updates.purity = payload.purity;
        if (payload.weightGrams !== undefined) updates.weight_grams = Number(payload.weightGrams);
        if (payload.purchasePrice !== undefined) updates.purchase_price = Number(payload.purchasePrice);
        if (payload.currentValuation !== undefined) updates.current_valuation = Number(payload.currentValuation);
        if (payload.purchaseDate !== undefined) updates.purchase_date = payload.purchaseDate;
      } else if (asset_type === "real_estate") {
        table = "real_estate";
        if (payload.propertyName !== undefined) updates.property_name = payload.propertyName;
        if (payload.propertyType !== undefined) updates.property_type = payload.propertyType;
        if (payload.location !== undefined) updates.location = payload.location;
        if (payload.purchasePrice !== undefined) updates.purchase_price = Number(payload.purchasePrice);
        if (payload.currentValuation !== undefined) updates.current_valuation = Number(payload.currentValuation);
        if (payload.purchaseDate !== undefined) updates.purchase_date = payload.purchaseDate;
        if (payload.monthlyRent !== undefined) updates.monthly_rent = Number(payload.monthlyRent);
      } else if (asset_type === "insurance") {
        table = "insurances";
        if (payload.insuranceType !== undefined) updates.insurance_type = payload.insuranceType;
        if (payload.provider !== undefined) updates.provider = payload.provider;
        if (payload.policyName !== undefined) updates.policy_name = payload.policyName;
        if (payload.policyNumber !== undefined) updates.policy_number = payload.policyNumber;
        if (payload.sumAssured !== undefined) updates.sum_assured = Number(payload.sumAssured);
        if (payload.premiumAmount !== undefined) updates.premium_amount = Number(payload.premiumAmount);
        if (payload.renewalDate !== undefined) updates.renewal_date = payload.renewalDate;
      } else if (asset_type === "document") {
        table = "documents";
        if (payload.name !== undefined) updates.name = payload.name;
      } else if (asset_type === "portfolio") {
        table = "portfolios";
        if (payload.label !== undefined) updates.label = payload.label;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error("No fields to update");
      }

      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq("id", targetId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE" && action === "delete") {
      const body = await req.json();
      const { asset_type, holdingId, id } = body;
      const targetId = id || holdingId;

      if (!targetId) throw new Error("ID is required");

      let table = "holdings";
      if (!asset_type || asset_type === "stock") {
        table = "holdings";
      } else if (asset_type === "fd") {
        table = "fixed_deposits";
      } else if (asset_type === "gold") {
        table = "gold_holdings";
      } else if (asset_type === "real_estate") {
        table = "real_estate";
      } else if (asset_type === "insurance") {
        table = "insurances";
      } else if (asset_type === "document") {
        table = "documents";
      }

      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", targetId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    console.error("Error in holdings-crud function:", e);
    let message: string;
    if (e instanceof Error) {
      message = e.message;
    } else if (e && typeof e === 'object') {
      message = (e as any).message || (e as any).error_description || JSON.stringify(e);
    } else {
      message = String(e);
    }

    const details = e && typeof e === 'object' && 'details' in e ? (e as any).details : null;
    const hint = e && typeof e === 'object' && 'hint' in e ? (e as any).hint : null;
    const code = e && typeof e === 'object' && 'code' in e ? (e as any).code : null;

    return new Response(
      JSON.stringify({
        error: message,
        details,
        hint,
        code
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
