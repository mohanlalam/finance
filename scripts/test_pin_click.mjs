import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_BIN = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const pin1234Hash = crypto.createHash('sha256').update('1234').digest('hex');

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
      }
    ],
    fixed_deposits: [],
    rd_accounts: [],
    sip_accounts: [],
    gold_holdings: [],
    real_estate: [],
    insurances: [],
    documents: []
  }
];

const mockNetWorthHistory = [
  { id: 'nw-1', snapshot_date: '2026-08-30', total_net_worth: 358260, equity_value: 358260, fd_value: 0, rd_value: 0, sip_value: 0, gold_value: 0, real_estate_value: 0 }
];

async function test() {
  const tempDir = path.resolve('.chrome_pin_click');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(BROWSER_BIN, [
    '--headless=new',
    '--remote-debugging-port=9453',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${tempDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const targets = await fetch('http://127.0.0.1:9453/json').then(r => r.json());
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

  await sendCDP('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      try {
        localStorage.setItem('custom_app_pin_hash', '${pin1234Hash}');
        localStorage.setItem('custom_app_pin_length', '4');
      } catch (e) {}

      window.__MOCK_DATA__ = {
        portfolios: ${JSON.stringify(mockPortfolios)},
        netWorthHistory: ${JSON.stringify(mockNetWorthHistory)}
      };

      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        const url = String(args[0]);
        if (url.includes('load-portfolios') || url.includes('functions/v1/load-portfolios')) {
          return new Response(JSON.stringify(window.__MOCK_DATA__), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (url.includes('verify-pin') || url.includes('functions/v1/verify-pin')) {
          return new Response(JSON.stringify({ verified: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (url.includes('market-data') || url.includes('functions/v1/market-data')) {
          return new Response(JSON.stringify({
            prices: {
              'RELIANCE.NS': { ltp: 2985.50, todayPct: 1.45 }
            }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return originalFetch.apply(window, args);
      };
    `
  });

  console.log('Navigating to app...');
  await sendCDP('Page.navigate', { url: 'http://localhost:5173/#/all/stocks' });
  await new Promise(r => setTimeout(r, 1500));

  console.log('Typing PIN 1, 2, 3, 4 via keypad click...');
  const unlockRes = await sendCDP('Runtime.evaluate', {
    expression: `
      (async () => {
        const btns = Array.from(document.querySelectorAll('button'));
        const findBtn = (digit) => btns.find(b => b.innerText.trim().startsWith(digit));

        findBtn('1')?.click();
        await new Promise(r => setTimeout(r, 80));
        findBtn('2')?.click();
        await new Promise(r => setTimeout(r, 80));
        findBtn('3')?.click();
        await new Promise(r => setTimeout(r, 80));
        findBtn('4')?.click();
        
        // Wait for unlock transition and MainApp mount
        await new Promise(r => setTimeout(r, 1500));

        return {
          bodyText: document.body.innerText.substring(0, 400),
          hasTable: !!document.querySelector('table'),
          hasReliance: document.body.innerText.includes('Reliance') || document.body.innerText.includes('RELIANCE'),
          isPinScreen: document.body.innerText.includes('Enter Passcode')
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Post-Unlock DOM Info:', unlockRes.result.value);

  const result = await sendCDP('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('test_unlocked_perfect_table.png', Buffer.from(result.data, 'base64'));
  console.log('Saved test_unlocked_perfect_table.png');

  ws.close();
  chromeProc.kill();
}

test().catch(console.error);
