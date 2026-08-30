import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_BIN = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const mockDbData = {
  portfolios: [
    { id: 'port-1', name: 'Self', label: 'Self (Ram)' },
    { id: 'port-2', name: 'Father', label: 'Father (K. Sharma)' },
    { id: 'port-3', name: 'Mother', label: 'Mother (S. Sharma)' }
  ],
  holdings: [
    {
      id: 'h-1',
      portfolio_id: 'port-1',
      sno: 1,
      stock_name: 'Reliance Industries Ltd',
      ticker: 'RELIANCE',
      yahoo_symbol: 'RELIANCE.NS',
      qty: 120,
      avg_price: 2450.00,
      cached_ltp: 2985.50,
      cached_today_pct: 1.45,
      amount_invested: 294000,
      week_low_52: 2220.00,
      week_high_52: 3024.90
    },
    {
      id: 'h-2',
      portfolio_id: 'port-1',
      sno: 2,
      stock_name: 'Tata Consultancy Services',
      ticker: 'TCS',
      yahoo_symbol: 'TCS.NS',
      qty: 75,
      avg_price: 3520.00,
      cached_ltp: 4180.25,
      cached_today_pct: 0.85,
      amount_invested: 264000,
      week_low_52: 3310.00,
      week_high_52: 4590.00
    },
    {
      id: 'h-3',
      portfolio_id: 'port-1',
      sno: 3,
      stock_name: 'HDFC Bank Ltd',
      ticker: 'HDFCBANK',
      yahoo_symbol: 'HDFCBANK.NS',
      qty: 250,
      avg_price: 1510.00,
      cached_ltp: 1680.00,
      cached_today_pct: -0.42,
      amount_invested: 377500,
      week_low_52: 1363.55,
      week_high_52: 1794.00
    },
    {
      id: 'h-f1',
      portfolio_id: 'port-2',
      sno: 1,
      stock_name: 'State Bank of India',
      ticker: 'SBIN',
      yahoo_symbol: 'SBIN.NS',
      qty: 400,
      avg_price: 560.00,
      cached_ltp: 825.00,
      cached_today_pct: 0.65,
      amount_invested: 224000,
      week_low_52: 543.20,
      week_high_52: 912.00
    }
  ],
  fixed_deposits: [
    {
      id: 'fd-1',
      portfolio_id: 'port-1',
      bank_name: 'HDFC Bank',
      principal_amount: 500000,
      interest_rate: 7.25,
      start_date: '2023-06-15',
      maturity_date: '2026-06-15',
      maturity_amount: 619500,
      status: 'active',
      fd_type: 'regular',
      notes: 'Tax Saver 3-Yr Cumulative FD'
    }
  ],
  rd_accounts: [
    {
      id: 'rd-1',
      portfolio_id: 'port-1',
      bank_name: 'State Bank of India',
      monthly_deposit: 25000,
      interest_rate: 6.80,
      start_date: '2023-09-01',
      maturity_date: '2025-09-01',
      maturity_amount: 645000,
      status: 'active',
      contributions: [
        { date: '2023-09-01', amount: 25000 },
        { date: '2023-10-01', amount: 25000 }
      ],
      notes: 'Target Vacation Fund'
    }
  ],
  sip_accounts: [
    {
      id: 'sip-1',
      portfolio_id: 'port-1',
      fund_name: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
      monthly_sip: 20000,
      expected_cagr: 15.5,
      units: 4850.45,
      start_date: '2021-04-05',
      next_sip_date: '2026-09-05',
      fallback_valuation: 345000,
      mf_scheme_code: '122639',
      liveNav: 78.42,
      notes: 'Core long term compounding compounder'
    }
  ],
  gold_holdings: [
    {
      id: 'gold-1',
      portfolio_id: 'port-1',
      item_name: 'MMTC-PAMP 24K 999.9 Gold Bar (50g)',
      purity: '24K',
      weight_grams: 50,
      purchase_price: 310000,
      current_valuation: 375000,
      purchase_date: '2023-03-20',
      liveRatePerGram: 7500,
      isLiveValuation: true,
      notes: 'Bullion safe custody'
    }
  ],
  real_estate: [
    {
      id: 're-1',
      portfolio_id: 'port-1',
      property_name: '3BHK Luxury Highrise, Sector 45 Gurgaon',
      property_type: 'apartment',
      location: 'Golf Course Extension, Gurgaon',
      purchase_price: 14500000,
      current_valuation: 21000000,
      purchase_date: '2020-11-15',
      monthly_rent: 62000,
      notes: 'Leased to corporate MNC tenant @ 4.2% gross yield'
    }
  ],
  insurances: [
    {
      id: 'ins-1',
      portfolio_id: 'port-1',
      insurance_type: 'health',
      provider: 'HDFC ERGO Health Insurance',
      policy_name: 'Optima Secure Family Floater',
      policy_number: 'POL-HDFC-889104',
      sum_assured: 2500000,
      premium_amount: 32500,
      premium_frequency: 'yearly',
      start_date: '2022-04-01',
      next_premium_date: '2027-04-01',
      nominee: 'Priya Sharma (Spouse)',
      status: 'active',
      notes: '2X cover with restoration benefit'
    }
  ],
  documents: [
    {
      id: 'doc-1',
      portfolio_id: 'port-1',
      document_name: 'Sector 45 Sale Deed & Registry Copy.pdf',
      category: 'property',
      document_tag: 'title_deed',
      file_size_bytes: 4200000,
      mime_type: 'application/pdf',
      uploaded_at: '2023-01-15',
      expiry_date: null,
      notes: 'Original registered deed in bank locker'
    }
  ],
  net_worth_history: [
    { id: 'nw-1', snapshot_date: '2026-08-30', total_net_worth: 23168260, equity_value: 1293260, fd_value: 500000, rd_value: 0, sip_value: 0, gold_value: 375000, real_estate_value: 21000000 }
  ]
};

async function test() {
  const tempDir = path.resolve('.chrome_cdp_complete');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(BROWSER_BIN, [
    '--headless=new',
    '--remote-debugging-port=9456',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${tempDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const targets = await fetch('http://127.0.0.1:9456/json').then(r => r.json());
  const pageTarget = targets.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(resolve => ws.onopen = resolve);

  let msgId = 1;
  const pendingRequests = new Map();

  function sendCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = async (evt) => {
    const data = JSON.parse(evt.data);
    
    if (data.method === 'Fetch.requestPaused') {
      const { requestId, request } = data.params;
      const url = request.url;
      console.log('[CDP INTERCEPT]', url);

      let responseBody = null;

      if (url.includes('holdings-crud') || url.includes('action=list')) {
        responseBody = JSON.stringify(mockDbData);
      } else if (url.includes('verify-pin')) {
        responseBody = JSON.stringify({ verified: true });
      } else if (url.includes('market-data')) {
        responseBody = JSON.stringify({
          prices: {
            'RELIANCE.NS': { ltp: 2985.50, todayPct: 1.45 },
            'TCS.NS': { ltp: 4180.25, todayPct: 0.85 },
            'HDFCBANK.NS': { ltp: 1680.00, todayPct: -0.42 },
            'SBIN.NS': { ltp: 825.00, todayPct: 0.65 }
          }
        });
      }

      if (responseBody) {
        await sendCDP('Fetch.fulfillRequest', {
          requestId,
          responseCode: 200,
          responseHeaders: [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'Access-Control-Allow-Origin', value: '*' },
            { name: 'Access-Control-Allow-Headers', value: '*' }
          ],
          body: Buffer.from(responseBody).toString('base64')
        });
      } else {
        await sendCDP('Fetch.continueRequest', { requestId });
      }
      return;
    }

    if (data.id && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await sendCDP('Page.enable');
  await sendCDP('Runtime.enable');
  await sendCDP('Fetch.enable', {
    patterns: [{ urlPattern: '*functions/v1/*' }, { urlPattern: '*holdings-crud*' }]
  });

  // Navigate to application
  console.log('Navigating to app with full mock data...');
  await sendCDP('Page.navigate', { url: 'http://localhost:5173/#/all/stocks' });
  await new Promise(r => setTimeout(r, 2500));

  const domInfo = await sendCDP('Runtime.evaluate', {
    expression: `({
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 400),
      hasTable: !!document.querySelector('table'),
      stockRows: document.querySelectorAll('tbody tr').length,
      hasReliance: document.body.innerText.includes('Reliance') || document.body.innerText.includes('RELIANCE'),
      isPinScreen: document.body.innerText.includes('Enter Passcode')
    })`,
    returnByValue: true
  });

  console.log('DOM Info:', domInfo.result.value);

  const screenshot = await sendCDP('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('test_unlocked_cdp_complete.png', Buffer.from(screenshot.data, 'base64'));
  console.log('Saved test_unlocked_cdp_complete.png');

  ws.close();
  chromeProc.kill();
}

test().catch(console.error);
