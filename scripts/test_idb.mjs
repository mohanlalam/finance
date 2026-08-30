import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_BIN = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

// Rich mock data
const mockPortfolios = [
  {
    id: 'port-1',
    name: 'Self',
    label: 'Self (Ram)',
    holdings: [
      {
        id: 'h-1',
        sno: 1,
        stockName: 'Reliance Industries Ltd',
        ticker: 'RELIANCE',
        yahooSymbol: 'RELIANCE.NS',
        qty: 120,
        avgPrice: 2450.00,
        ltp: 2985.50,
        amountInvested: 294000,
        unrealizedPnL: 64260,
        pnlPercent: 21.86,
        todayPnLPercent: 1.45,
        currentValue: 358260,
        weekLow52: 2220.00,
        weekHigh52: 3024.90
      },
      {
        id: 'h-2',
        sno: 2,
        stockName: 'Tata Consultancy Services',
        ticker: 'TCS',
        yahooSymbol: 'TCS.NS',
        qty: 75,
        avgPrice: 3520.00,
        ltp: 4180.25,
        amountInvested: 264000,
        unrealizedPnL: 49518.75,
        pnlPercent: 18.76,
        todayPnLPercent: 0.85,
        currentValue: 313518.75,
        weekLow52: 3310.00,
        weekHigh52: 4590.00
      },
      {
        id: 'h-3',
        sno: 3,
        stockName: 'HDFC Bank Ltd',
        ticker: 'HDFCBANK',
        yahooSymbol: 'HDFCBANK.NS',
        qty: 250,
        avgPrice: 1510.00,
        ltp: 1680.00,
        amountInvested: 377500,
        unrealizedPnL: 42500,
        pnlPercent: 11.26,
        todayPnLPercent: -0.42,
        currentValue: 420000,
        weekLow52: 1363.55,
        weekHigh52: 1794.00
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
    rd_accounts: [],
    sip_accounts: [],
    gold_holdings: [],
    real_estate: [],
    insurances: [],
    documents: []
  }
];

const mockNetWorthHistory = [
  { id: 'nw-1', snapshot_date: '2026-08-30', total_net_worth: 1091778, equity_value: 1091778, fd_value: 500000, rd_value: 0, sip_value: 0, gold_value: 0, real_estate_value: 0 }
];

async function test() {
  console.log('Testing browser and IDB hydration...');
  const tempDir = path.resolve('.chrome_test_profile');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(BROWSER_BIN, [
    '--headless=new',
    '--remote-debugging-port=9445',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${tempDir}`,
    'http://localhost:5173/#/all/stocks'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const targets = await fetch('http://127.0.0.1:9445/json').then(r => r.json());
  const pageTarget = targets.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(resolve => ws.onopen = resolve);

  let msgId = 1;
  const pendingRequests = new Map();

  ws.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
    if (data.id && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  function sendCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCDP('Page.enable');
  await sendCDP('Runtime.enable');

  const payload = {
    portfolios: mockPortfolios,
    netWorthHistory: mockNetWorthHistory,
    cachedAt: new Date().toISOString()
  };

  const evalRes = await sendCDP('Runtime.evaluate', {
    expression: `
      new Promise((resolve, reject) => {
        localStorage.removeItem('custom_app_pin_hash');
        sessionStorage.setItem('finance_pin_verified', 'true');
        
        const openReq = indexedDB.open('keyval-store', 1);
        openReq.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('keyval')) {
            db.createObjectStore('keyval');
          }
        };
        openReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('keyval', 'readwrite');
          const store = tx.objectStore('keyval');
          store.put(${JSON.stringify(JSON.stringify(payload))}, 'family_portfolios_offline_cache');
          tx.oncomplete = () => resolve('IDB_SAVED');
          tx.onerror = (err) => reject(err);
        };
        openReq.onerror = (err) => reject(err);
      })
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('IDB injection result:', evalRes.result.value);

  // Reload page
  await sendCDP('Page.reload');
  await new Promise(r => setTimeout(r, 2000));

  // Check DOM state
  const domInfo = await sendCDP('Runtime.evaluate', {
    expression: `({
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 300),
      hasTable: !!document.querySelector('table'),
      stockRows: document.querySelectorAll('tbody tr').length,
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean).slice(0, 10)
    })`,
    returnByValue: true
  });

  console.log('DOM Info after reload:', domInfo.result.value);

  ws.close();
  chromeProc.kill();
}

test().catch(console.error);
