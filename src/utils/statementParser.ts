export interface ParsedHoldingRow {
  symbol: string;
  shares: number;
  avg_cost: number;
  portfolio_name?: string;
  notes?: string;
  source: 'zerodha' | 'groww' | 'cams' | 'generic';
}

export interface ParseResult {
  rows: ParsedHoldingRow[];
  errors: string[];
  broker: string;
}

/**
 * Universal broker statement CSV / text parser for Zerodha, Groww, CAMS, and Generic formats
 */
export function parseBrokerStatement(csvContent: string, defaultPortfolio: string = 'default'): ParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ['File is empty'], broker: 'Unknown' };
  }

  // Find header row (some broker exports have metadata in top 1-5 lines)
  let headerIndex = -1;
  let brokerType: 'zerodha' | 'groww' | 'cams' | 'generic' = 'generic';

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lowerLine = lines[i].toLowerCase();
    if (lowerLine.includes('instrument') && (lowerLine.includes('isin') || lowerLine.includes('avg. cost') || lowerLine.includes('qty'))) {
      headerIndex = i;
      brokerType = 'zerodha';
      break;
    }
    if ((lowerLine.includes('stock name') || lowerLine.includes('company name')) && (lowerLine.includes('shares') || lowerLine.includes('avg price') || lowerLine.includes('buy price'))) {
      headerIndex = i;
      brokerType = 'groww';
      break;
    }
    if (lowerLine.includes('scheme') && (lowerLine.includes('folio') || lowerLine.includes('units') || lowerLine.includes('nav'))) {
      headerIndex = i;
      brokerType = 'cams';
      break;
    }
    if (lowerLine.includes('symbol') || lowerLine.includes('ticker') || lowerLine.includes('shares') || lowerLine.includes('qty')) {
      headerIndex = i;
      brokerType = 'generic';
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0; // fallback to line 0
  }

  const rawHeaders = parseCsvLine(lines[headerIndex]);
  const headers = rawHeaders.map((h) => h.toLowerCase().trim().replace(/['"]/g, ''));

  // Column index finders (prioritize exact symbol/ticker over company name)
  let symbolIdx = headers.findIndex((h) =>
    h === 'symbol' || h === 'ticker' || h === 'tradingsymbol' || h === 'instrument'
  );
  if (symbolIdx === -1) {
    symbolIdx = headers.findIndex((h) =>
      h === 'stock name' || h === 'scheme name' || h.includes('symbol') || h.includes('ticker') || h.includes('name')
    );
  }

  const qtyIdx = headers.findIndex((h) =>
    h === 'qty.' || h === 'qty' || h === 'quantity' || h === 'shares' || h === 'units' || h.includes('quantity') || h.includes('shares')
  );
  const priceIdx = headers.findIndex((h) =>
    h === 'avg. cost' || h === 'avg cost' || h === 'avg price' || h === 'average price' || h === 'buy price' || h === 'purchase price' || h === 'nav' || h.includes('avg') || h.includes('price')
  );
  const isinIdx = headers.findIndex((h) => h === 'isin');

  const rows: ParsedHoldingRow[] = [];
  const errors: string[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine || rawLine.startsWith('#') || rawLine.toLowerCase().startsWith('total')) continue;

    const cols = parseCsvLine(rawLine);
    if (cols.length < 2) continue;

    const rawSymbol = cols[symbolIdx] || '';
    const rawQty = cols[qtyIdx] || '0';
    const rawPrice = cols[priceIdx] || '0';

    // Clean numeric values (remove currency symbols, commas, quotes)
    const cleanQty = parseFloat(rawQty.replace(/[₹$,]/g, '').trim());
    const cleanPrice = parseFloat(rawPrice.replace(/[₹$,]/g, '').trim());
    let cleanSymbol = rawSymbol.replace(/['"]/g, '').trim().toUpperCase();

    // Remove common exchange suffixes e.g. "RELIANCE-EQ" -> "RELIANCE"
    if (cleanSymbol.endsWith('-EQ') || cleanSymbol.endsWith('-BE')) {
      cleanSymbol = cleanSymbol.replace(/-EQ$|-BE$/, '');
    }

    if (!cleanSymbol || cleanSymbol === 'TOTAL' || cleanSymbol === 'SUBTOTAL') {
      continue;
    }

    if (isNaN(cleanQty) || cleanQty <= 0) {
      errors.push(`Row ${i + 1}: Invalid quantity "${rawQty}" for ${cleanSymbol}`);
      continue;
    }

    if (isNaN(cleanPrice) || cleanPrice < 0) {
      errors.push(`Row ${i + 1}: Invalid purchase price "${rawPrice}" for ${cleanSymbol}`);
      continue;
    }

    const isin = isinIdx !== -1 ? cols[isinIdx]?.trim() : undefined;

    rows.push({
      symbol: cleanSymbol,
      shares: cleanQty,
      avg_cost: cleanPrice,
      portfolio_name: defaultPortfolio,
      notes: isin ? `ISIN: ${isin}` : undefined,
      source: brokerType,
    });
  }

  const brokerName =
    brokerType === 'zerodha'
      ? 'Zerodha Console'
      : brokerType === 'groww'
      ? 'Groww Investments'
      : brokerType === 'cams'
      ? 'CAMS / MF Statement'
      : 'Standard CSV';

  return {
    rows,
    errors,
    broker: brokerName,
  };
}

/**
 * Robust CSV Line Parser respecting double quotes and commas within quotes
 */
function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let curr = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(curr.trim());
      curr = '';
    } else {
      curr += char;
    }
  }
  result.push(curr.trim());
  return result;
}
