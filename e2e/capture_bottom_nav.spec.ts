import { test, expect, Page } from '@playwright/test';
import path from 'path';

async function unlockIfLocked(page: Page) {
  const pinHeading = page.getByRole('heading', { name: 'Enter Passcode' });
  if (await pinHeading.isVisible({ timeout: 4000 }).catch(() => false)) {
    const pin = process.env.E2E_APP_PIN || process.env.VITE_APP_PIN || '3463';
    await page.keyboard.type(pin);
    await expect(pinHeading).not.toBeVisible({ timeout: 15000 });
  }
  await expect(page.locator('nav[aria-label="Mobile Navigation"]')).toBeVisible({ timeout: 25000 });
}

test.describe('Mobile Bottom Navigation Screenshot Capture', () => {
  test.setTimeout(120000);

  test('Capture Mobile Bottom Nav in Dark Mode', async ({ browser }) => {
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

    await page.goto('/#/all/home');
    await unlockIfLocked(page);
    await page.waitForTimeout(1500);

    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(bottomNav).toBeVisible();

    // Isolated bottom navigation bar (component crop)
    const darkBarPath = path.resolve('screenshots/mobile/dark/bottom-nav-bar.png');
    await bottomNav.screenshot({ path: darkBarPath });
    console.log('Saved Dark Bottom Nav Bar:', darkBarPath);

    // Docked bottom view (bottom region in context)
    const darkDockPath = path.resolve('screenshots/mobile/dark/bottom-nav-dock.png');
    await page.screenshot({ path: darkDockPath, clip: { x: 0, y: 720, width: 390, height: 124 } });
    console.log('Saved Dark Bottom Nav Dock:', darkDockPath);

    await context.close();
  });

  test('Capture Mobile Bottom Nav in Light Mode', async ({ browser }) => {
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

    await page.goto('/#/all/home');
    await unlockIfLocked(page);
    await page.waitForTimeout(1500);

    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(bottomNav).toBeVisible();

    // Isolated bottom navigation bar (component crop)
    const lightBarPath = path.resolve('screenshots/mobile/light/bottom-nav-bar.png');
    await bottomNav.screenshot({ path: lightBarPath });
    console.log('Saved Light Bottom Nav Bar:', lightBarPath);

    // Docked bottom view (bottom region in context)
    const lightDockPath = path.resolve('screenshots/mobile/light/bottom-nav-dock.png');
    await page.screenshot({ path: lightDockPath, clip: { x: 0, y: 720, width: 390, height: 124 } });
    console.log('Saved Light Bottom Nav Dock:', lightDockPath);

    await context.close();
  });
});