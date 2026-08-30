import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_BIN = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

async function test() {
  const tempDir = path.resolve('.chrome_eval_profile');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(BROWSER_BIN, [
    '--headless=new',
    '--remote-debugging-port=9447',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${tempDir}`,
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const targets = await fetch('http://127.0.0.1:9447/json').then(r => r.json());
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

  const evalRes = await sendCDP('Runtime.evaluate', {
    expression: `({
      localKeys: Object.keys(localStorage),
      custom_pin: localStorage.getItem('custom_app_pin_hash'),
      sessionKeys: Object.keys(sessionStorage),
      sessionPin: sessionStorage.getItem('finance_pin_verified')
    })`,
    returnByValue: true
  });

  console.log('Storage evaluation:', evalRes.result.value);

  // Now, what happens if we type the PIN or click the keypad?
  // Let's see what keypad buttons exist!
  const pinButtons = await sendCDP('Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim())`,
    returnByValue: true
  });
  console.log('Buttons on screen:', pinButtons.result.value);

  ws.close();
  chromeProc.kill();
}

test().catch(console.error);
