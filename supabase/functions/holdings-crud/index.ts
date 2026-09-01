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
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "GET" && action === "list") {
      const [
        { data: portfolios, error: pErr },
        { data: holdings, error: hErr },
        { data: fixed_deposits, error: fdErr },
        { data: rd_accounts, error: rdErr },
        { data: sip_accounts, error: sipErr },
        { data: gold_holdings, error: goldErr },
        { data: real_estate, error: reErr },
        { data: insurances, error: insErr },
        { data: documents, error: docErr },
        { data: priceCache, error: cacheErr },
        { data: net_worth_history, error: nwErr },
      ] = await Promise.all([
        supabase.from("portfolios").select("*").order("name"),
        supabase.from("holdings").select("*").order("sno"),
        supabase.from("fixed_deposits").select("*").order("created_at"),
        supabase.from("rd_accounts").select("*").order("created_at"),
        supabase.from("sip_accounts").select("*").order("created_at"),
        supabase.from("gold_holdings").select("*").order("created_at"),
        supabase.from("real_estate").select("*").order("created_at"),
        supabase.from("insurances").select("*").order("created_at"),
        supabase.from("documents").select("*").order("created_at"),
        supabase.from("market_price_cache").select("*"),
        supabase.from("net_worth_history").select("*").order("snapshot_date"),
      ]);

      if (pErr) throw pErr;
      if (hErr) throw hErr;
      if (fdErr) throw fdErr;
      if (rdErr) throw rdErr;
      if (sipErr) throw sipErr;
      if (goldErr) throw goldErr;
      if (reErr) throw reErr;
      if (insErr) throw insErr;
      if (docErr) throw docErr;
      if (nwErr) throw nwErr;

      // Merge cached prices into holdings
      const holdingsWithCache = (holdings || []).map(h => {
        const cached = (priceCache || []).find(c => c.yahoo_symbol === h.yahoo_symbol);
        return {
          ...h,
          cached_ltp: cached?.ltp ?? null,
          cached_today_pct: cached?.today_pct ?? null
        };
      });

      return new Response(JSON.stringify({ portfolios, holdings: holdingsWithCache, fixed_deposits, rd_accounts, sip_accounts, gold_holdings, real_estate, insurances, documents, net_worth_history }), {
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

      if (!asset_type || asset_type === "stock" || asset_type === "holding" || asset_type === "stocks") {
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
            stock_name: String(payload.stockName || '').slice(0, 150),
            ticker: String(payload.ticker || '').toUpperCase().slice(0, 30),
            yahoo_symbol: String(payload.yahooSymbol || '').slice(0, 50),
            qty: Number(payload.qty),
            avg_price: Number(payload.avgPrice),
            amount_invested: Number(payload.amountInvested),
          })
          .select()
          .single();
        insertData = res.data;
        insertError = res.error;
      } else if (asset_type === "fd" || asset_type === "fixed_deposit") {
        const res = await supabase
          .from("fixed_deposits")
          .insert({
            portfolio_id: portfolio.id,
            bank_name: String(payload.bankName || '').slice(0, 100),
            principal_amount: Number(payload.principalAmount),
            interest_rate: Number(payload.interestRate),
            start_date: payload.startDate,
            maturity_date: payload.maturityDate,
            maturity_amount: Number(payload.maturityAmount),
            status: payload.status || "active",
            fd_type: payload.fdType || "regular",
            contributions: payload.contributions || [],
            mf_scheme_code: payload.mfSchemeCode ? String(payload.mfSchemeCode).slice(0, 50) : null,
            units: payload.units !== undefined && payload.units !== null ? Number(payload.units) : null,
            notes: payload.notes ? String(payload.notes).slice(0, 1000) : null,
            girl_dob: payload.girlDob || null,
            rate_schedule: payload.rateSchedule || null,
          })
          .select()
          .single();
        insertData = res.data;
        insertError = res.error;

      } else if (asset_type === "rd_account" || asset_type === "rd") {
        const res = await supabase
          .from("rd_accounts")
          .insert({
            portfolio_id: portfolio.id,
            bank_name: String(payload.bank_name || '').slice(0, 100),
            monthly_deposit: Number(payload.monthly_deposit),
            interest_rate: Number(payload.interest_rate),
            start_date: payload.start_date,
            maturity_date: payload.maturity_date,
            maturity_amount: Number(payload.maturity_amount),
            status: payload.status || "active",
            contributions: payload.contributions || [],
            notes: payload.notes ? String(payload.notes).slice(0, 1000) : null,
          })
          .select()
          .single();
        insertData = res.data;
        insertError = res.error;
      } else if (asset_type === "sip_account" || asset_type === "sip") {
        const res = await supabase
          .from("sip_accounts")
          .insert({
            portfolio_id: portfolio.id,
            fund_name: String(payload.fund_name || '').slice(0, 150),
            monthly_sip: Number(payload.monthly_sip),
            expected_cagr: Number(payload.expected_cagr),
            units: Number(payload.units ?? 0),
            start_date: payload.start_date,
            next_sip_date: payload.next_sip_date || null,
            fallback_valuation: Number(payload.fallback_valuation ?? 0),
            mf_scheme_code: payload.mf_scheme_code ? String(payload.mf_scheme_code).slice(0, 50) : null,
            notes: payload.notes ? String(payload.notes).slice(0, 1000) : null,
          })
          .select()
          .single();
        insertData = res.data;
        insertError = res.error;
      } else if (asset_type === "gold" || asset_type === "gold_holding") {
        const res = await supabase
          .from("gold_holdings")
          .insert({
            portfolio_id: portfolio.id,
            item_name: String(payload.itemName || '').slice(0, 150),
            purity: payload.purity,
            weight_grams: Number(payload.weightGrams),
            purchase_price: Number(payload.purchasePrice),
            current_valuation: Number(payload.currentValuation ?? payload.purchasePrice),
            purchase_date: payload.purchaseDate,
            notes: payload.notes ? String(payload.notes).slice(0, 1000) : null,
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
            property_name: String(payload.propertyName || '').slice(0, 150),
            property_type: payload.propertyType,
            location: String(payload.location || '').slice(0, 150),
            purchase_price: Number(payload.purchasePrice),
            current_valuation: Number(payload.currentValuation),
            purchase_date: payload.purchaseDate,
            monthly_rent: Number(payload.monthlyRent ?? 0),
            notes: payload.notes ? String(payload.notes).slice(0, 1000) : null,
          })
          .select()
          .single();
        insertData = res.data;
        insertError = res.error;
      } else if (asset_type === "insurance") {
        // Client sends snake_case keys; support both for backward compat
        const ins_type = payload.insurance_type ?? payload.insuranceType;
        const ins_provider = payload.provider;
        const ins_policy_name = payload.policy_name ?? payload.policyName;
        const ins_policy_number = payload.policy_number ?? payload.policyNumber;
        const ins_sum_assured = payload.sum_assured ?? payload.sumAssured;
        const ins_premium_amount = payload.premium_amount ?? payload.premiumAmount;
        const ins_renewal_date = payload.renewal_date ?? payload.renewalDate;
        const res = await supabase
          .from("insurances")
          .insert({
            portfolio_id: portfolio.id,
            insurance_type: ins_type,
            provider: String(ins_provider || '').slice(0, 100),
            policy_name: String(ins_policy_name || '').slice(0, 150),
            policy_number: String(ins_policy_number || '').slice(0, 80),
            sum_assured: ins_sum_assured !== undefined && ins_sum_assured !== null ? Number(ins_sum_assured) : null,
            premium_amount: ins_premium_amount !== undefined && ins_premium_amount !== null ? Number(ins_premium_amount) : null,
            renewal_date: ins_renewal_date || null,
            notes: payload.notes ? String(payload.notes).slice(0, 1000) : null,
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
            name: String(payload.name || '').slice(0, 150),
            file_path: String(payload.filePath || '').slice(0, 500),
            file_type: String(payload.fileType || '').slice(0, 50),
            asset_type: payload.linkedAssetType || "general",
            asset_id: payload.linkedAssetId,
            expiry_date: payload.expiryDate || payload.expiry_date || null,
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

      if (!asset_type || asset_type === "stock" || asset_type === "holding" || asset_type === "stocks") {
        table = "holdings";
        if (payload.qty !== undefined) updates.qty = Number(payload.qty);
        if (payload.avgPrice !== undefined) updates.avg_price = Number(payload.avgPrice);
        if (payload.amountInvested !== undefined) updates.amount_invested = Number(payload.amountInvested);
      } else if (asset_type === "fd" || asset_type === "fixed_deposit") {
        table = "fixed_deposits";
        if (payload.bankName !== undefined) updates.bank_name = payload.bankName;
        if (payload.principalAmount !== undefined) updates.principal_amount = Number(payload.principalAmount);
        if (payload.interestRate !== undefined) updates.interest_rate = Number(payload.interestRate);
        if (payload.startDate !== undefined) updates.start_date = payload.startDate;
        if (payload.maturityDate !== undefined) updates.maturity_date = payload.maturityDate;
        if (payload.maturityAmount !== undefined) updates.maturity_amount = Number(payload.maturityAmount);
        if (payload.status !== undefined) updates.status = payload.status;
        if (payload.fdType !== undefined) updates.fd_type = payload.fdType;
        if (payload.contributions !== undefined) updates.contributions = payload.contributions;
        if (payload.mfSchemeCode !== undefined) updates.mf_scheme_code = payload.mfSchemeCode;
        if (payload.units !== undefined) updates.units = payload.units !== null ? Number(payload.units) : null;
        if (payload.notes !== undefined) updates.notes = payload.notes;

      } else if (asset_type === "rd_account" || asset_type === "rd") {
        table = "rd_accounts";
        if (payload.bank_name !== undefined) updates.bank_name = payload.bank_name;
        if (payload.monthly_deposit !== undefined) updates.monthly_deposit = Number(payload.monthly_deposit);
        if (payload.interest_rate !== undefined) updates.interest_rate = Number(payload.interest_rate);
        if (payload.start_date !== undefined) updates.start_date = payload.start_date;
        if (payload.maturity_date !== undefined) updates.maturity_date = payload.maturity_date;
        if (payload.maturity_amount !== undefined) updates.maturity_amount = Number(payload.maturity_amount);
        if (payload.status !== undefined) updates.status = payload.status;
        if (payload.contributions !== undefined) updates.contributions = payload.contributions;
        if (payload.notes !== undefined) updates.notes = payload.notes;
      } else if (asset_type === "sip_account" || asset_type === "sip") {
        table = "sip_accounts";
        if (payload.fund_name !== undefined) updates.fund_name = payload.fund_name;
        if (payload.monthly_sip !== undefined) updates.monthly_sip = Number(payload.monthly_sip);
        if (payload.expected_cagr !== undefined) updates.expected_cagr = Number(payload.expected_cagr);
        if (payload.units !== undefined) updates.units = Number(payload.units);
        if (payload.start_date !== undefined) updates.start_date = payload.start_date;
        if (payload.next_sip_date !== undefined) updates.next_sip_date = payload.next_sip_date;
        if (payload.fallback_valuation !== undefined) updates.fallback_valuation = Number(payload.fallback_valuation);
        if (payload.mf_scheme_code !== undefined) updates.mf_scheme_code = payload.mf_scheme_code;
        if (payload.notes !== undefined) updates.notes = payload.notes;
      } else if (asset_type === "gold" || asset_type === "gold_holding") {
        table = "gold_holdings";
        if (payload.itemName !== undefined) updates.item_name = payload.itemName;
        if (payload.purity !== undefined) updates.purity = payload.purity;
        if (payload.weightGrams !== undefined) updates.weight_grams = Number(payload.weightGrams);
        if (payload.purchasePrice !== undefined) updates.purchase_price = Number(payload.purchasePrice);
        if (payload.currentValuation !== undefined) updates.current_valuation = Number(payload.currentValuation);
        if (payload.purchaseDate !== undefined) updates.purchase_date = payload.purchaseDate;
        if (payload.notes !== undefined) updates.notes = payload.notes;
      } else if (asset_type === "real_estate") {
        table = "real_estate";
        if (payload.propertyName !== undefined) updates.property_name = payload.propertyName;
        if (payload.propertyType !== undefined) updates.property_type = payload.propertyType;
        if (payload.location !== undefined) updates.location = payload.location;
        if (payload.purchasePrice !== undefined) updates.purchase_price = Number(payload.purchasePrice);
        if (payload.currentValuation !== undefined) updates.current_valuation = Number(payload.currentValuation);
        if (payload.purchaseDate !== undefined) updates.purchase_date = payload.purchaseDate;
        if (payload.monthlyRent !== undefined) updates.monthly_rent = Number(payload.monthlyRent);
        if (payload.notes !== undefined) updates.notes = payload.notes;
      } else if (asset_type === "insurance") {
        table = "insurances";
        // Client sends snake_case; support both for backward compat
        const upd_type = payload.insurance_type ?? payload.insuranceType;
        const upd_policyName = payload.policy_name ?? payload.policyName;
        const upd_policyNumber = payload.policy_number ?? payload.policyNumber;
        const upd_sumAssured = payload.sum_assured ?? payload.sumAssured;
        const upd_premiumAmount = payload.premium_amount ?? payload.premiumAmount;
        const upd_renewalDate = payload.renewal_date ?? payload.renewalDate;
        if (upd_type !== undefined) updates.insurance_type = upd_type;
        if (payload.provider !== undefined) updates.provider = payload.provider;
        if (upd_policyName !== undefined) updates.policy_name = upd_policyName;
        if (upd_policyNumber !== undefined) updates.policy_number = upd_policyNumber;
        if (upd_sumAssured !== undefined) updates.sum_assured = Number(upd_sumAssured);
        if (upd_premiumAmount !== undefined) updates.premium_amount = Number(upd_premiumAmount);
        if (upd_renewalDate !== undefined) updates.renewal_date = upd_renewalDate;
        if (payload.notes !== undefined) updates.notes = payload.notes;
      } else if (asset_type === "document") {
        table = "documents";
        if (payload.name !== undefined) updates.name = payload.name;
        if (payload.expiryDate !== undefined) updates.expiry_date = payload.expiryDate;
        if (payload.expiry_date !== undefined) updates.expiry_date = payload.expiry_date;
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
      if (!asset_type || asset_type === "stock" || asset_type === "holding" || asset_type === "stocks") {
        table = "holdings";
      } else if (asset_type === "fd" || asset_type === "fixed_deposit") {
        table = "fixed_deposits";
      } else if (asset_type === "rd_account" || asset_type === "rd") {
        table = "rd_accounts";
      } else if (asset_type === "sip_account" || asset_type === "sip") {
        table = "sip_accounts";
      } else if (asset_type === "gold" || asset_type === "gold_holding") {
        table = "gold_holdings";
      } else if (asset_type === "real_estate") {
        table = "real_estate";
      } else if (asset_type === "insurance") {
        table = "insurances";
      } else if (asset_type === "document") {
        table = "documents";
      } else if (asset_type === "portfolio") {
        table = "portfolios";
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

    if (req.method === "POST" && action === "upload_file") {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const bucket = (formData.get("bucket") as string) || "investment-documents";
      const rawPath = (formData.get("path") as string) || "";
      if (bucket !== "investment-documents") {
        throw new Error("Invalid storage bucket. Only 'investment-documents' is allowed.");
      }
      const cleanPath = rawPath
        .split("/")
        .map((seg) => seg.trim().replace(/[^\w.-]/g, "_"))
        .filter((seg) => seg.length > 0 && seg !== ".." && seg !== ".")
        .join("/");
      if (!file || !cleanPath) {
        throw new Error("File and valid storage path are required");
      }
      const arrayBuffer = await file.arrayBuffer();
      const { data, error } = await supabase.storage.from(bucket).upload(cleanPath, arrayBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ data, path: cleanPath }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && action === "delete_file") {
      const { bucket = "investment-documents", paths } = await req.json();
      if (bucket !== "investment-documents") {
        throw new Error("Invalid storage bucket. Only 'investment-documents' is allowed.");
      }
      if (!paths || !Array.isArray(paths)) {
        throw new Error("paths array is required");
      }
      const cleanPaths = paths
        .map((p: string) =>
          typeof p === "string"
            ? p
                .split("/")
                .map((seg) => seg.trim().replace(/[^\w.-]/g, "_"))
                .filter((seg) => seg.length > 0 && seg !== ".." && seg !== ".")
                .join("/")
            : ""
        )
        .filter(Boolean);
      if (cleanPaths.length === 0) {
        return new Response(JSON.stringify({ success: true, count: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await supabase.storage.from(bucket).remove(cleanPaths);
      if (error) throw error;
      return new Response(JSON.stringify({ data, success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && action === "get_document_url") {
      const { bucket = "investment-documents", path: rawPath, expiresIn = 300 } = await req.json();
      if (bucket !== "investment-documents") {
        throw new Error("Invalid storage bucket. Only 'investment-documents' is allowed.");
      }
      const cleanPath = (rawPath || "")
        .split("/")
        .map((seg: string) => seg.trim().replace(/[^\w.-]/g, "_"))
        .filter((seg: string) => seg.length > 0 && seg !== ".." && seg !== ".")
        .join("/");
      if (!cleanPath) {
        throw new Error("Valid storage path is required");
      }

      const ttl = Math.min(Math.max(Number(expiresIn) || 300, 60), 3600);
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(cleanPath, ttl);

      if (error) throw error;
      return new Response(JSON.stringify({ signedUrl: data.signedUrl, expiresIn: ttl }), {
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
