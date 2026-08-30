import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_BIN = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const OUT_DIR = path.resolve('screenshots');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

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
      id: 'h-4',
      portfolio_id: 'port-1',
      sno: 4,
      stock_name: 'Infosys Ltd',
      ticker: 'INFY',
      yahoo_symbol: 'INFY.NS',
      qty: 150,
      avg_price: 1480.00,
      cached_ltp: 1845.60,
      cached_today_pct: 1.12,
      amount_invested: 222000,
      week_low_52: 1358.35,
      week_high_52: 1991.45
    },
    {
      id: 'h-5',
      portfolio_id: 'port-1',
      sno: 5,
      stock_name: 'Tata Motors Ltd',
      ticker: 'TATAMOTORS',
      yahoo_symbol: 'TATAMOTORS.NS',
      qty: 300,
      avg_price: 680.00,
      cached_ltp: 985.40,
      cached_today_pct: 2.10,
      amount_invested: 204000,
      week_low_52: 593.50,
      week_high_52: 1179.05
    },
    {
      id: 'h-6',
      portfolio_id: 'port-1',
      sno: 6,
      stock_name: 'ITC Ltd',
      ticker: 'ITC',
      yahoo_symbol: 'ITC.NS',
      qty: 500,
      avg_price: 410.00,
      cached_ltp: 485.20,
      cached_today_pct: -0.15,
      amount_invested: 205000,
      week_low_52: 399.30,
      week_high_52: 528.50
    },
    {
      id: 'h-7',
      portfolio_id: 'port-1',
      sno: 7,
      stock_name: 'Larsen & Toubro Ltd',
      ticker: 'LT',
      yahoo_symbol: 'LT.NS',
      qty: 60,
      avg_price: 3100.00,
      cached_ltp: 3650.00,
      cached_today_pct: 0.95,
      amount_invested: 186000,
      week_low_52: 2850.00,
      week_high_52: 3919.90
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
    },
    {
      id: 'h-f2',
      portfolio_id: 'port-2',
      sno: 2,
      stock_name: 'Life Insurance Corporation of India',
      ticker: 'LICI',
      yahoo_symbol: 'LICI.NS',
      qty: 180,
      avg_price: 840.00,
      cached_ltp: 1045.00,
      cached_today_pct: 1.20,
      amount_invested: 151200,
      week_low_52: 600.00,
      week_high_52: 1222.00
    },
    {
      id: 'h-m1',
      portfolio_id: 'port-3',
      sno: 1,
      stock_name: 'Hindustan Unilever Ltd',
      ticker: 'HINDUNILVR',
      yahoo_symbol: 'HINDUNILVR.NS',
      qty: 80,
      avg_price: 2380.00,
      cached_ltp: 2810.00,
      cached_today_pct: 0.35,
      amount_invested: 190400,
      week_low_52: 2170.25,
      week_high_52: 3034.50
    },
    {
      id: 'h-m2',
      portfolio_id: 'port-3',
      sno: 2,
      stock_name: 'Asian Paints Ltd',
      ticker: 'ASIANPAINT',
      yahoo_symbol: 'ASIANPAINT.NS',
      qty: 50,
      avg_price: 2900.00,
      cached_ltp: 3120.00,
      cached_today_pct: -0.20,
      amount_invested: 145000,
      week_low_52: 2685.85,
      week_high_52: 3422.90
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
    },
    {
      id: 'fd-2',
      portfolio_id: 'port-1',
      bank_name: 'ICICI Bank',
      principal_amount: 300000,
      interest_rate: 7.10,
      start_date: '2024-01-10',
      maturity_date: '2027-01-10',
      maturity_amount: 369800,
      status: 'active',
      fd_type: 'regular',
      notes: 'Emergency Reserve FD'
    },
    {
      id: 'fd-f1',
      portfolio_id: 'port-2',
      bank_name: 'State Bank of India',
      principal_amount: 1500000,
      interest_rate: 7.75,
      start_date: '2022-10-01',
      maturity_date: '2027-10-01',
      maturity_amount: 2198000,
      status: 'active',
      fd_type: 'regular',
      notes: 'Senior Citizen Special Care FD (0.50% extra)'
    },
    {
      id: 'fd-m1',
      portfolio_id: 'port-3',
      bank_name: 'ICICI Bank',
      principal_amount: 1000000,
      interest_rate: 7.75,
      start_date: '2023-02-14',
      maturity_date: '2028-02-14',
      maturity_amount: 1468000,
      status: 'active',
      fd_type: 'regular',
      notes: 'Senior Citizen Golden Years FD'
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
        { date: '2023-10-01', amount: 25000 },
        { date: '2023-11-01', amount: 25000 },
        { date: '2023-12-01', amount: 25000 },
        { date: '2024-01-01', amount: 25000 },
        { date: '2024-02-01', amount: 25000 },
        { date: '2024-03-01', amount: 25000 },
        { date: '2024-04-01', amount: 25000 }
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
    },
    {
      id: 'sip-2',
      portfolio_id: 'port-1',
      fund_name: 'Mirae Asset Large Cap Fund - Direct Plan - Growth',
      monthly_sip: 15000,
      expected_cagr: 13.0,
      units: 2980.12,
      start_date: '2022-01-10',
      next_sip_date: '2026-09-10',
      fallback_valuation: 275000,
      mf_scheme_code: '118834',
      liveNav: 104.15,
      notes: 'Large cap stability foundation'
    },
    {
      id: 'sip-3',
      portfolio_id: 'port-1',
      fund_name: 'Quant Small Cap Fund - Direct Plan - Growth',
      monthly_sip: 10000,
      expected_cagr: 18.0,
      units: 1450.80,
      start_date: '2022-08-15',
      next_sip_date: '2026-09-15',
      fallback_valuation: 210000,
      mf_scheme_code: '120828',
      liveNav: 245.80,
      notes: 'Alpha generation bucket'
    },
    {
      id: 'sip-f1',
      portfolio_id: 'port-2',
      fund_name: 'SBI Balanced Advantage Fund - Direct Plan - Growth',
      monthly_sip: 10000,
      expected_cagr: 11.5,
      units: 4200.00,
      start_date: '2022-03-01',
      next_sip_date: '2026-09-01',
      fallback_valuation: 180000,
      mf_scheme_code: '149176',
      liveNav: 48.90,
      notes: 'Conservative hybrid fund'
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
    },
    {
      id: 'gold-2',
      portfolio_id: 'port-1',
      item_name: 'Tanishq 22K Sovereign Hallmark Coins (20g)',
      purity: '22K',
      weight_grams: 20,
      purchase_price: 118000,
      current_valuation: 137500,
      purchase_date: '2023-10-24',
      liveRatePerGram: 6875,
      isLiveValuation: true,
      notes: 'Dhanteras festive investment'
    },
    {
      id: 'gold-f1',
      portfolio_id: 'port-2',
      item_name: '24K Sovereign Bullion Coin (50g)',
      purity: '24K',
      weight_grams: 50,
      purchase_price: 290000,
      current_valuation: 375000,
      purchase_date: '2021-11-04',
      liveRatePerGram: 7500,
      isLiveValuation: true,
      notes: 'Gold legacy asset'
    },
    {
      id: 'gold-m1',
      portfolio_id: 'port-3',
      item_name: '22K Traditional Temple Jewellery Set (65g)',
      purity: '22K',
      weight_grams: 65,
      purchase_price: 360000,
      current_valuation: 446875,
      purchase_date: '2018-05-12',
      liveRatePerGram: 6875,
      isLiveValuation: true,
      notes: 'BIS 916 Hallmarked heirloom jewelry'
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
    },
    {
      id: 'ins-2',
      portfolio_id: 'port-1',
      insurance_type: 'term',
      provider: 'Max Life Insurance',
      policy_name: 'Smart Secure Plus Term Plan',
      policy_number: 'POL-MAX-441029',
      sum_assured: 20000000,
      premium_amount: 24800,
      premium_frequency: 'yearly',
      start_date: '2021-08-12',
      next_premium_date: '2026-08-12',
      nominee: 'Priya Sharma (Spouse)',
      status: 'active',
      notes: 'Cover till age 65 with critical illness rider'
    },
    {
      id: 'ins-f1',
      portfolio_id: 'port-2',
      insurance_type: 'health',
      provider: 'Star Health Senior Citizens Red Carpet',
      policy_name: 'Senior Citizen Comprehensive Cover',
      policy_number: 'POL-STAR-77192',
      sum_assured: 1000000,
      premium_amount: 48000,
      premium_frequency: 'yearly',
      start_date: '2023-07-15',
      next_premium_date: '2026-07-15',
      nominee: 'Ram Sharma (Son)',
      status: 'active',
      notes: 'Pre-existing diseases covered with OPD benefit'
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
    },
    {
      id: 'doc-2',
      portfolio_id: 'port-1',
      document_name: 'HDFC ERGO Policy Schedule 2026-27.pdf',
      category: 'insurance',
      document_tag: 'policy_schedule',
      file_size_bytes: 1850000,
      mime_type: 'application/pdf',
      uploaded_at: '2026-04-02',
      expiry_date: '2027-04-01',
      notes: 'Annual policy renewal receipt'
    }
  ],
  net_worth_history: [
    { id: 'nw-1', snapshot_date: '2024-01-01', total_net_worth: 21500000, equity_value: 1200000, fd_value: 3200000, rd_value: 150000, sip_value: 450000, gold_value: 950000, real_estate_value: 15550000 },
    { id: 'nw-2', snapshot_date: '2024-06-01', total_net_worth: 24200000, equity_value: 1500000, fd_value: 3500000, rd_value: 220000, sip_value: 620000, gold_value: 1080000, real_estate_value: 17280000 },
    { id: 'nw-3', snapshot_date: '2025-01-01', total_net_worth: 27100000, equity_value: 1850000, fd_value: 3800000, rd_value: 310000, sip_value: 790000, gold_value: 1210000, real_estate_value: 18940000 },
    { id: 'nw-4', snapshot_date: '2025-08-01', total_net_worth: 30400000, equity_value: 2150000, fd_value: 4100000, rd_value: 420000, sip_value: 980000, gold_value: 1350000, real_estate_value: 21400000 },
    { id: 'nw-5', snapshot_date: '2026-01-01', total_net_worth: 33200000, equity_value: 2420000, fd_value: 4300000, rd_value: 510000, sip_value: 1180000, gold_value: 1490000, real_estate_value: 23300000 },
    { id: 'nw-6', snapshot_date: '2026-08-30', total_net_worth: 36850000, equity_value: 2750000, fd_value: 4500000, rd_value: 645000, sip_value: 1390000, gold_value: 1565000, real_estate_value: 26000000 }
  ]
};

async function run() {
  console.log('🚀 Starting Full Chrome CDP Screenshot Capture Suite...');
  const tempDir = path.resolve('.chrome_full_profile');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(BROWSER_BIN, [
    '--headless=new',
    '--remote-debugging-port=9457',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${tempDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const targets = await fetch('http://127.0.0.1:9457/json').then(r => r.json());
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
    
    // Handle CDP Network Interception
    if (data.method === 'Fetch.requestPaused') {
      const { requestId, request } = data.params;
      const url = request.url;

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
            'INFY.NS': { ltp: 1845.60, todayPct: 1.12 },
            'TATAMOTORS.NS': { ltp: 985.40, todayPct: 2.10 },
            'ITC.NS': { ltp: 485.20, todayPct: -0.15 },
            'LT.NS': { ltp: 3650.00, todayPct: 0.95 },
            'SBIN.NS': { ltp: 825.00, todayPct: 0.65 },
            'LICI.NS': { ltp: 1045.00, todayPct: 1.20 },
            'HINDUNILVR.NS': { ltp: 2810.00, todayPct: 0.35 },
            'ASIANPAINT.NS': { ltp: 3120.00, todayPct: -0.20 }
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

  async function takeScreenshot(filename, width = 1440, height = 900, dpr = 2) {
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: dpr,
      mobile: width < 768
    });
    await new Promise(r => setTimeout(r, 700));
    const result = await sendCDP('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });
    const filePath = path.join(OUT_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(result.data, 'base64'));
    console.log(`  ✓ Saved: ${filename} (${width}x${height}@${dpr}x)`);
    return filePath;
  }

  async function navigate(hash) {
    await sendCDP('Runtime.evaluate', {
      expression: `window.location.hash = '${hash}';`
    });
    await new Promise(r => setTimeout(r, 1000));
  }

  async function setTheme(theme) {
    await sendCDP('Runtime.evaluate', {
      expression: `
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add('${theme}');
        localStorage.setItem('finance_theme', '${theme}');
      `
    });
    await new Promise(r => setTimeout(r, 400));
  }

  // 1. PIN Lock Screen (Rendered cleanly on Desktop & Mobile)
  console.log('\n🔒 1. Capturing PIN Lock Screen...');
  await sendCDP('Page.navigate', { url: 'http://localhost:5173' });
  await new Promise(r => setTimeout(r, 1200));
  await setTheme('dark');

  // Trigger lock gate for screenshot
  await sendCDP('Runtime.evaluate', {
    expression: `
      localStorage.setItem('custom_app_pin_hash', 'mock_hash');
      sessionStorage.removeItem('finance_pin_verified');
      window.location.reload();
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  await takeScreenshot('01_desktop_dark_pin_lock_screen.png');
  await takeScreenshot('21_mobile_dark_pin_lock.png', 390, 844, 3);

  // Now clear custom pin hash so the entire rest of the app stays completely unlocked!
  await sendCDP('Runtime.evaluate', {
    expression: `
      localStorage.removeItem('custom_app_pin_hash');
      sessionStorage.setItem('finance_pin_verified', 'true');
      window.location.reload();
    `
  });
  await new Promise(r => setTimeout(r, 2000));

  console.log('\n📸 2. Capturing Desktop Dark Mode Views (1440x900)...');
  await setTheme('dark');

  // 02. Stocks & Holdings Table
  await navigate('#/all/stocks');
  await takeScreenshot('02_desktop_dark_stocks_holdings.png');

  // 03. Summary & Analytics Widgets
  await navigate('#/all/widgets');
  await takeScreenshot('03_desktop_dark_summary_analytics_widgets.png');

  // 04. Fixed Deposits
  await navigate('#/all/fd');
  await takeScreenshot('04_desktop_dark_fixed_deposits.png');

  // 05. Recurring Deposits
  await navigate('#/all/rd');
  await takeScreenshot('05_desktop_dark_recurring_deposits.png');

  // 06. SIP & Mutual Funds
  await navigate('#/all/sip');
  await takeScreenshot('06_desktop_dark_sip_mutual_funds.png');

  // 07. Gold & Bullion Vault
  await navigate('#/all/gold');
  await takeScreenshot('07_desktop_dark_gold_bullion_vault.png');

  // 08. Real Estate Registry
  await navigate('#/all/real_estate');
  await takeScreenshot('08_desktop_dark_real_estate_registry.png');

  // 09. Insurance Policies
  await navigate('#/all/insurance');
  await takeScreenshot('09_desktop_dark_insurance_policies.png');

  // 10. Document Vault
  await navigate('#/all/documents');
  await takeScreenshot('10_desktop_dark_document_vault.png');

  // 11. Tax Loss Harvesting
  await navigate('#/all/tax');
  await takeScreenshot('11_desktop_dark_tax_harvesting.png');

  // 12. Family Member Breakdown (Father's portfolio)
  await navigate('#/Father/stocks');
  await takeScreenshot('12_desktop_dark_family_member_father.png');

  // 13. AI Portfolio Assistant Drawer
  await navigate('#/all/stocks');
  await sendCDP('Runtime.evaluate', {
    expression: `
      const allBtns = Array.from(document.querySelectorAll('button'));
      const assistantBtn = allBtns.find(b => b.textContent?.includes('AI') || b.title?.includes('Assistant') || b.getAttribute('aria-label')?.includes('Assistant'));
      if (assistantBtn) assistantBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 700));
  await takeScreenshot('13_desktop_dark_ai_assistant_panel.png');

  // Close assistant drawer
  await sendCDP('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape' });
  await sendCDP('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape' });
  await new Promise(r => setTimeout(r, 400));

  // 14. Add Holding Modal
  await sendCDP('Runtime.evaluate', {
    expression: `
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Add Holding') || b.textContent?.includes('Add Stock'));
      if (addBtn) addBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 700));
  await takeScreenshot('14_desktop_dark_modal_add_holding.png');
  await sendCDP('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape' });
  await sendCDP('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape' });
  await new Promise(r => setTimeout(r, 400));

  // 15. Add Gold Modal
  await navigate('#/all/gold');
  await sendCDP('Runtime.evaluate', {
    expression: `
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Add Gold') || b.textContent?.includes('Add'));
      if (addBtn) addBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 700));
  await takeScreenshot('15_desktop_dark_modal_add_gold.png');
  await sendCDP('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape' });
  await sendCDP('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape' });
  await new Promise(r => setTimeout(r, 400));

  console.log('\n☀️ 3. Capturing Desktop Light Mode Views (1440x900)...');
  await setTheme('light');
  await navigate('#/all/stocks');
  await takeScreenshot('16_desktop_light_stocks_holdings.png');

  await navigate('#/all/widgets');
  await takeScreenshot('17_desktop_light_summary_analytics_widgets.png');

  await navigate('#/all/gold');
  await takeScreenshot('18_desktop_light_gold_bullion.png');

  await navigate('#/all/fd');
  await takeScreenshot('19_desktop_light_fixed_deposits.png');

  await navigate('#/all/sip');
  await takeScreenshot('20_desktop_light_sip_mutual_funds.png');

  console.log('\n📱 4. Capturing Mobile Views (iPhone 14 Pro — 390x844)...');
  await setTheme('dark');

  // Mobile Home Summary
  await navigate('#/all/home');
  await takeScreenshot('22_mobile_dark_home_summary.png', 390, 844, 3);

  // Mobile Stocks List
  await navigate('#/all/stocks');
  await takeScreenshot('23_mobile_dark_stocks_holdings.png', 390, 844, 3);

  // Mobile Fixed Deposits
  await navigate('#/all/fd');
  await takeScreenshot('24_mobile_dark_fixed_deposits.png', 390, 844, 3);

  // Mobile SIPs
  await navigate('#/all/sip');
  await takeScreenshot('25_mobile_dark_sip_mutual_funds.png', 390, 844, 3);

  // Mobile Gold
  await navigate('#/all/gold');
  await takeScreenshot('26_mobile_dark_gold_holdings.png', 390, 844, 3);

  // Mobile Light Mode
  await setTheme('light');
  await navigate('#/all/home');
  await takeScreenshot('27_mobile_light_home_summary.png', 390, 844, 3);

  await navigate('#/all/stocks');
  await takeScreenshot('28_mobile_light_stocks.png', 390, 844, 3);

  console.log('\n🎉 ALL 28 REAL APP SCREENSHOTS CAPTURED PERFECTLY!');
  ws.close();
  chromeProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error capturing screenshots:', err);
  process.exit(1);
});
