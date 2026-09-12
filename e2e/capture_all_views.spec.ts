import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const VIEWS = [
  { id: '01-family-overview', route: '/#/all/home' },
  { id: '02-stocks-etfs', route: '/#/all/stocks' },
  { id: '03-fixed-deposits', route: '/#/all/fd' },
  { id: '04-recurring-deposits', route: '/#/all/rd' },
  { id: '05-sip-mutual-funds', route: '/#/all/sip' },
  { id: '06-gold-holdings', route: '/#/all/gold' },
  { id: '07-real-estate', route: '/#/all/real_estate' },
  { id: '08-insurance-cover', route: '/#/all/insurance' },
  { id: '09-document-vault', route: '/#/all/documents' },
  { id: '10-tax-harvesting', route: '/#/all/tax' },
];

async function unlockIfLocked(page: Page) {
  const pinHeading = page.getByRole('heading', { name: 'Enter Passcode' });
  if (await pinHeading.isVisible({ timeout: 4000 }).catch(() => false)) {
    const pin = process.env.E2E_APP_PIN || process.env.VITE_APP_PIN || '3463';
    await page.keyboard.type(pin);
    await expect(pinHeading).not.toBeVisible({ timeout: 15000 });
  }
  await expect(page.locator('header')).toBeVisible({ timeout: 25000 });
}

test.describe.serial('Full-Size Project Screenshots Suite (40 Views)', () => {
  test.setTimeout(300000);

  test('Capture Web Desktop Light Mode (10 Views)', async ({ browser }) => {
    const outDir = path.resolve('screenshots/web/light');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    });

    await page.goto('/');
    await unlockIfLocked(page);
    await page.waitForTimeout(1000);

    for (const view of VIEWS) {
      console.log('Capturing Web Light: ' + view.id);
      await page.goto(view.route);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1500);
      const filePath = path.join(outDir, view.id + '.png');
      await page.screenshot({ path: filePath, fullPage: true });
    }

    await context.close();
  });

  test('Capture Web Desktop Dark Mode (10 Views)', async ({ browser }) => {
    const outDir = path.resolve('screenshots/web/dark');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });

    await page.goto('/');
    await unlockIfLocked(page);
    await page.waitForTimeout(1000);

    for (const view of VIEWS) {
      console.log('Capturing Web Dark: ' + view.id);
      await page.goto(view.route);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1500);
      const filePath = path.join(outDir, view.id + '.png');
      await page.screenshot({ path: filePath, fullPage: true });
    }

    await context.close();
  });

  test('Capture Mobile Light Mode (10 Views)', async ({ browser }) => {
    const outDir = path.resolve('screenshots/mobile/light');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    });

    await page.goto('/');
    await unlockIfLocked(page);
    await page.waitForTimeout(1000);

    for (const view of VIEWS) {
      console.log('Capturing Mobile Light: ' + view.id);
      await page.goto(view.route);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1500);
      const filePath = path.join(outDir, view.id + '.png');
      await page.screenshot({ path: filePath, fullPage: true });
    }

    await context.close();
  });

  test('Capture Mobile Dark Mode (10 Views)', async ({ browser }) => {
    const outDir = path.resolve('screenshots/mobile/dark');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });

    await page.goto('/');
    await unlockIfLocked(page);
    await page.waitForTimeout(1000);

    for (const view of VIEWS) {
      console.log('Capturing Mobile Dark: ' + view.id);
      await page.goto(view.route);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1500);
      const filePath = path.join(outDir, view.id + '.png');
      await page.screenshot({ path: filePath, fullPage: true });
    }

    await context.close();
  });
});