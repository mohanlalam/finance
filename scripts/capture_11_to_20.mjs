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
      total_deposited: 300000,
      status: 'active',
      notes: 'Child Higher Education Goal'
    },
    {
      id: 'rd-2',
      portfolio_id: 'port-1',
      bank_name: 'HDFC Bank',
      monthly_deposit: 15000,
      interest_rate: 7.00,
      start_date: '2024-03-01',
      maturity_date: '2026-03-01',
      maturity_amount: 386500,
      total_deposited: 90000,
      status: 'active',
      notes: 'Annual Vacation Reserve'
    }
  ],
  sip_accounts: [
    {
      id: 'sip-1',
      portfolio_id: 'port-1',
      fund_name: 'Parag Parikh Flexi Cap Fund - Direct Growth',
      monthly_investment: 25000,
      sip_day: 5,
      start_date: '2021-04-05',
      units: 7420.55,
      nav: 72.85,
      invested_amount: 1025000,
      current_value: 1540607,
      status: 'active',
      amfi_code: '122639',
      notes: 'Core global equity compounder'
    },
    {
      id: 'sip-2',
      portfolio_id: 'port-1',
      fund_name: 'Mirae Asset Large & Midcap Fund - Direct Growth',
      monthly_investment: 15000,
      sip_day: 10,
      start_date: '2022-01-10',
      units: 4120.30,
      nav: 128.40,
      invested_amount: 480000,
      current_value: 529046,
      status: 'active',
      amfi_code: '107560',
      notes: 'Alpha wealth compounder'
    },
    {
      id: 'sip-f1',
      portfolio_id: 'port-2',
      fund_name: 'SBI Bluechip Fund - Direct Growth',
      monthly_investment: 20000,
      sip_day: 15,
      start_date: '2020-08-15',
      units: 8950.40,
      nav: 88.25,
      invested_amount: 980000,
      current_value: 1389873,
      status: 'active',
      amfi_code: '119598',
      notes: 'Retirement cash generation'
    }
  ],
  gold_holdings: [
    {
      id: 'gold-1',
      portfolio_id: 'port-1',
      item_name: 'MMTC-PAMP 24K 999.9 Sovereign Gold Bar (100g)',
      purity: '24K',
      weight_grams: 100,
      purchase_price: 610000,
      current_valuation: 750000,
      purchase_date: '2023-03-20',
      liveRatePerGram: 7500,
      isLiveValuation: true,
      notes: 'Certified Swiss Assayed bullion bar kept in private bank vault'
    },
    {
      id: 'gold-2',
      portfolio_id: 'port-1',
      item_name: 'Tanishq 22K Hallmarked Bridal Necklace & Bangle Set',
      purity: '22K',
      weight_grams: 85,
      purchase_price: 485000,
      current_valuation: 584375,
      purchase_date: '2022-10-24',
      liveRatePerGram: 6875,
      isLiveValuation: true,
      notes: 'Family heirloom hallmarked jewellery'
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
    { id: 'nw-1', snapshot_date: '2026-06-01', total_net_worth: 28500000, equity_value: 1800000, fd_value: 3600000, rd_value: 250000, sip_value: 650000, gold_value: 1100000, real_estate_value: 21100000 },
    { id: 'nw-2', snapshot_date: '2026-06-15', total_net_worth: 29800000, equity_value: 1950000, fd_value: 3700000, rd_value: 290000, sip_value: 750000, gold_value: 1150000, real_estate_value: 21960000 },
    { id: 'nw-3', snapshot_date: '2026-07-01', total_net_worth: 31200000, equity_value: 2100000, fd_value: 3900000, rd_value: 340000, sip_value: 880000, gold_value: 1250000, real_estate_value: 22730000 },
    { id: 'nw-4', snapshot_date: '2026-07-15', total_net_worth: 33400000, equity_value: 2350000, fd_value: 4100000, rd_value: 410000, sip_value: 1050000, gold_value: 1350000, real_estate_value: 24140000 },
    { id: 'nw-5', snapshot_date: '2026-08-01', total_net_worth: 35100000, equity_value: 2550000, fd_value: 4300000, rd_value: 520000, sip_value: 1220000, gold_value: 1450000, real_estate_value: 25060000 },
    { id: 'nw-6', snapshot_date: '2026-08-30', total_net_worth: 36850000, equity_value: 2750000, fd_value: 4500000, rd_value: 645000, sip_value: 1390000, gold_value: 1565000, real_estate_value: 26000000 }
  ]
};

async function run() {
  console.log('🚀 Starting Chrome CDP Session for Screenshots 11 to 20...');
  const tempDir = path.resolve('.chrome_capture_11_20');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(BROWSER_BIN, [
    '--headless=new',
    '--remote-debugging-port=9460',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${tempDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const targets = await fetch('http://127.0.0.1:9460/json').then(r => r.json());
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

  async function takeScreenshot(num, descriptiveName, width = 1440, height = 900, dpr = 2) {
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: dpr,
      mobile: width < 768
    });
    await new Promise(r => setTimeout(r, 800));
    const result = await sendCDP('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });
    const buf = Buffer.from(result.data, 'base64');
    
    // Save as num.png (e.g. 11.png)
    const numPath = path.join(OUT_DIR, `${num}.png`);
    fs.writeFileSync(numPath, buf);

    // Also save as num_descriptiveName.png (e.g. 11_gold_view.png)
    const descPath = path.join(OUT_DIR, `${num}_${descriptiveName}.png`);
    fs.writeFileSync(descPath, buf);

    console.log(`  ✓ Saved: ${num}.png & ${num}_${descriptiveName}.png (${width}x${height}@${dpr}x)`);
  }

  async function navigate(hash) {
    await sendCDP('Runtime.evaluate', {
      expression: `window.location.hash = '${hash}';`
    });
    // Wait for route change & any dynamic import/suspense
    await new Promise(r => setTimeout(r, 2000));
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

  // Pre-warm / unlock
  await sendCDP('Page.navigate', { url: 'http://localhost:5173' });
  await new Promise(r => setTimeout(r, 1500));
  await sendCDP('Runtime.evaluate', {
    expression: `
      localStorage.removeItem('custom_app_pin_hash');
      sessionStorage.setItem('finance_pin_verified', 'true');
      window.location.reload();
    `
  });
  await new Promise(r => setTimeout(r, 2000));
  await setTheme('dark');

  // ==========================================
  // DESKTOP VIEWS (1440x900)
  // ==========================================
  console.log('\n🖥️ Capturing Desktop Views (11-14)...');

  // 11. Gold View (#/all/gold)
  console.log('Capturing #11 Gold View...');
  await navigate('#/all/gold');
  // Poll until skeleton is gone or 3 seconds
  await sendCDP('Runtime.evaluate', {
    expression: `
      new Promise(resolve => {
        let attempts = 0;
        const check = () => {
          attempts++;
          const shimmer = document.querySelector('.animate-shimmer');
          if (!shimmer || attempts > 20) resolve(true);
          else setTimeout(check, 150);
        };
        check();
      });
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 500));
  await takeScreenshot('11', 'gold_view', 1440, 900, 2);

  // 12. Insurance View (#/all/insurance)
  console.log('Capturing #12 Insurance View...');
  await navigate('#/all/insurance');
  await new Promise(r => setTimeout(r, 800));
  await takeScreenshot('12', 'insurance_view', 1440, 900, 2);

  // 13. Documents Vault View (#/all/documents)
  console.log('Capturing #13 Documents Vault View...');
  await navigate('#/all/documents');
  await new Promise(r => setTimeout(r, 800));
  await takeScreenshot('13', 'documents_vault_view', 1440, 900, 2);

  // 14. Tax Harvesting View (#/all/tax)
  console.log('Capturing #14 Tax Harvesting View...');
  await navigate('#/all/tax');
  await new Promise(r => setTimeout(r, 800));
  await takeScreenshot('14', 'tax_harvesting_view', 1440, 900, 2);

  // ==========================================
  // MOBILE VIEWS (390x844)
  // ==========================================
  console.log('\n📱 Capturing Mobile Views (15-20)...');

  // 15. Mobile PIN Lock Screen
  console.log('Capturing #15 Mobile PIN Lock Screen...');
  await sendCDP('Runtime.evaluate', {
    expression: `
      localStorage.setItem('custom_app_pin_hash', 'mock_hash');
      sessionStorage.removeItem('finance_pin_verified');
      window.location.reload();
    `
  });
  await new Promise(r => setTimeout(r, 2000));
  await takeScreenshot('15', 'mobile_pin_lock_screen', 390, 844, 3);

  // Unlock again for remaining mobile screens
  await sendCDP('Runtime.evaluate', {
    expression: `
      localStorage.removeItem('custom_app_pin_hash');
      sessionStorage.setItem('finance_pin_verified', 'true');
      window.location.reload();
    `
  });
  await new Promise(r => setTimeout(r, 2000));
  await setTheme('dark');

  // 16. Mobile Home — Summary & Assets tab
  console.log('Capturing #16 Mobile Home — Summary & Assets tab...');
  await navigate('#/all/home');
  await sendCDP('Runtime.evaluate', {
    expression: `window.scrollTo(0, 0);`
  });
  await new Promise(r => setTimeout(r, 800));
  await takeScreenshot('16', 'mobile_home_summary_assets', 390, 844, 3);

  // 17. Mobile Home — Charts & AI tab
  console.log('Capturing #17 Mobile Home — Charts & AI tab...');
  await sendCDP('Runtime.evaluate', {
    expression: `
      const charts = document.querySelector('.space-y-4.pt-1');
      if (charts) {
        charts.scrollIntoView({ behavior: 'instant', block: 'start' });
      } else {
        window.scrollTo(0, 680);
      }
    `
  });
  await new Promise(r => setTimeout(r, 1200));
  await takeScreenshot('17', 'mobile_home_charts_ai', 390, 844, 3);

  // 18. Mobile any asset view (e.g. Stocks)
  console.log('Capturing #18 Mobile Stocks View...');
  await navigate('#/all/stocks');
  await sendCDP('Runtime.evaluate', {
    expression: `window.scrollTo(0, 0);`
  });
  await new Promise(r => setTimeout(r, 1000));
  await takeScreenshot('18', 'mobile_stocks_view', 390, 844, 3);

  // 19. Mobile bottom nav bar
  console.log('Capturing #19 Mobile bottom nav bar...');
  // Ensure we are on home/stocks and drawer is closed, showcasing the docked bottom navigation bar
  await sendCDP('Runtime.evaluate', {
    expression: `
      const closeBtn = document.querySelector('button[aria-label="Close drawer"]');
      if (closeBtn) closeBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 600));
  await takeScreenshot('19', 'mobile_bottom_nav_bar', 390, 844, 3);

  // 20. Mobile FAB / Add modal
  console.log('Capturing #20 Mobile FAB / Add modal...');
  await sendCDP('Runtime.evaluate', {
    expression: `
      const fabBtn = document.querySelector('button[aria-label="Open quick add menu"]') || Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.includes('quick add'));
      if (fabBtn) fabBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 800));
  await takeScreenshot('20', 'mobile_fab_add_modal', 390, 844, 3);

  console.log('\n🎉 ALL SCREENSHOTS 11 TO 20 CAPTURED SUCCESSFULLY!');
  ws.close();
  chromeProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error capturing screenshots:', err);
  process.exit(1);
});
