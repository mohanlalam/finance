export interface ImportRow {
  stock_name: string;
  ticker: string;
  yahoo_symbol: string;
  qty: number;
  avg_price: number;
}

export interface ParseResult {
  parsed: ImportRow[];
  errors: string[];
  detectedFormat: string;
}

export function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export function csvToImportRows(rows: string[][]): ParseResult {
  if (rows.length < 2) return { parsed: [], errors: ['File is empty or has no data rows'], detectedFormat: 'Unknown' };

  const MAX_IMPORT_ROWS = 500;
  if (rows.length - 1 > MAX_IMPORT_ROWS) {
    return { parsed: [], errors: [`CSV import exceeds maximum limit of ${MAX_IMPORT_ROWS} rows.`], detectedFormat: 'Unknown' };
  }

  // Normalize header names
  const rawHeaders = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9_.]/g, ''));

  // Detect broker format
  let format = 'Standard CSV Format';
  if (rawHeaders.some(h => h === 'instrument' || h.includes('avgcost'))) {
    format = 'Zerodha Holdings';
  } else if (rawHeaders.some(h => h.includes('groww') || (rawHeaders.includes('stockname') && rawHeaders.includes('symbol')))) {
    format = 'Groww Holdings';
  } else if (rawHeaders.includes('isin') && rawHeaders.includes('symbol')) {
    format = 'CAS / Demat Statement';
  } else if (rawHeaders.includes('symbol') && rawHeaders.includes('trade_type')) {
    format = 'Zerodha Tradebook';
  } else if (rawHeaders.includes('symbol') && (rawHeaders.includes('avgcost') || rawHeaders.includes('avgprice'))) {
    format = 'AngelOne / Upstox';
  }

  // Dynamic column matching with fallback lookup
  const tickerIdx = rawHeaders.findIndex(h =>
    h === 'symbol' || h === 'ticker' || h === 'instrument' || h === 'tradingsymbol' || h.includes('symbol') || h.includes('ticker')
  );

  const nameIdx = rawHeaders.findIndex(h =>
    h.includes('stockname') || h.includes('companyname') || h.includes('name') || h === 'instrument'
  );

  const qtyIdx = rawHeaders.findIndex(h =>
    h === 'qty.' || h === 'qty' || h === 'quantity' || h === 'units' || h.includes('qty') || h.includes('quantity')
  );

  let priceIdx = rawHeaders.findIndex(h =>
    h === 'avg.cost' || h === 'avgcost' || h === 'averageprice' || h === 'avgprice' || h === 'buyprice' || h === 'costprice' || h === 'purchaseprice'
  );
  if (priceIdx === -1) {
    priceIdx = rawHeaders.findIndex(h =>
      (h.includes('avg') && h.includes('price')) ||
      (h.includes('buy') && h.includes('price')) ||
      (h.includes('cost') && !h.includes('total'))
    );
  }
  if (priceIdx === -1) {
    priceIdx = rawHeaders.findIndex(h =>
      (h.includes('price') || h.includes('cost')) && !h.includes('market') && !h.includes('ltp') && !h.includes('current') && !h.includes('cmp') && !h.includes('total')
    );
  }

  const yahooIdx = rawHeaders.findIndex(h => h.includes('yahoo'));

  if (tickerIdx === -1 || qtyIdx === -1 || priceIdx === -1) {
    return {
      parsed: [],
      errors: ['CSV must contain Ticker/Symbol, Quantity, and Avg Price/Cost columns.'],
      detectedFormat: format
    };
  }

  const parsed: ImportRow[] = [];
  const errors: string[] = [];
  const seenTickers = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const rawTicker = (row[tickerIdx] || '').trim().toUpperCase().replace(/[^A-Z0-9.&_-]/g, '');
    if (!rawTicker) continue;

    if (seenTickers.has(rawTicker)) {
      errors.push(`Row ${i + 1}: Duplicate ticker "${rawTicker}" ignored`);
      continue;
    }

    const rawQty = (row[qtyIdx] || '').replace(/,/g, '').trim();
    const qty = parseFloat(rawQty);
    if (isNaN(qty) || qty <= 0) {
      errors.push(`Row ${i + 1} (${rawTicker}): Invalid quantity "${rawQty}"`);
      continue;
    }

    const rawPrice = (row[priceIdx] || '').replace(/,/g, '').trim();
    const avgPrice = parseFloat(rawPrice);
    if (isNaN(avgPrice) || avgPrice < 0) {
      errors.push(`Row ${i + 1} (${rawTicker}): Invalid price "${rawPrice}"`);
      continue;
    }

    const stockName = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : rawTicker;
    const yahooSymbol = yahooIdx !== -1 && row[yahooIdx] ? row[yahooIdx].trim() : `${rawTicker}.NS`;

    seenTickers.add(rawTicker);
    parsed.push({
      stock_name: stockName,
      ticker: rawTicker,
      yahoo_symbol: yahooSymbol,
      qty,
      avg_price: avgPrice,
    });
  }

  return { parsed, errors, detectedFormat: format };
}
