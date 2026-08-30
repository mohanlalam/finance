import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_BIN = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

async function test() {
  const tempDir = path.resolve('.chrome_pin_profile');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(BROWSER_BIN, [
    '--headless=new',
    '--remote-debugging-port=9448',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${tempDir}`,
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const targets = await fetch('http://127.0.0.1:9448/json').then(r => r.json());
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

  // Let's see what happens if we click the unlock / keypad or if we simulate entering the PIN
  // Or what is the default PIN in the app?
  // Let's check what PIN verifyPin('1234') or verifyPin('0000') does
  console.log('Testing unlock action...');
  
  // Look for any input or button
  const clickRes = await sendCDP('Runtime.evaluate', {
    expression: `
      (async () => {
        // Let's find buttons 1, 2, 3, 4 and click them
        const btns = Array.from(document.querySelectorAll('button'));
        const findBtn = (digit) => btns.find(b => b.innerText.trim().startsWith(digit));
        
        // Try typing '1234'
        findBtn('1')?.click();
        await new Promise(r => setTimeout(r, 100));
        findBtn('2')?.click();
        await new Promise(r => setTimeout(r, 100));
        findBtn('3')?.click();
        await new Promise(r => setTimeout(r, 100));
        findBtn('4')?.click();
        await new Promise(r => setTimeout(r, 1000));

        return {
          bodyText: document.body.innerText.substring(0, 200),
          url: window.location.href
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Result after typing 1234:', clickRes.result.value);

  ws.close();
  chromeProc.kill();
}

test().catch(console.error);
