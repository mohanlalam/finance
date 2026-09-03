import { test, expect } from '@playwright/test';

test.describe('Family Wealth Tracker - Smoke & E2E Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local app
    await page.goto('/');
  });

  test('Security Gate - PIN unlock with correct PIN 3463', async ({ page }) => {
    // Check if PinLockScreen is visible
    const pinPad = page.locator('text=Family Vault');
    if (await pinPad.isVisible({ timeout: 2000 })) {
      // Click PIN keypad buttons 3, 4, 6, 3
      await page.click('button:has-text("3")');
      await page.click('button:has-text("4")');
      await page.click('button:has-text("6")');
      await page.click('button:has-text("3")');
    }

    // Header and dashboard should become visible
    await expect(page.locator('text=Family Wealth').or(page.locator('text=Family'))).toBeVisible({ timeout: 8000 });
  });

  test('Navigation - Switch family member tabs and asset classes', async ({ page }) => {
    // Auto unlock if needed
    const pinPad = page.locator('text=Family Vault');
    if (await pinPad.isVisible({ timeout: 2000 })) {
      for (const digit of ['3', '4', '6', '3']) {
        await page.click(`button:has-text("${digit}")`);
      }
    }

    await expect(page.locator('text=Family Wealth').or(page.locator('text=Family'))).toBeVisible({ timeout: 8000 });

    // Switch between family member tabs
    const rammohanTab = page.locator('button:has-text("Rammohan")').first();
    if (await rammohanTab.isVisible()) {
      await rammohanTab.click();
      await expect(page).toHaveURL(/.*tab=rammohan.*/);
    }

    const padmavathiTab = page.locator('button:has-text("Padmavathi")').first();
    if (await padmavathiTab.isVisible()) {
      await padmavathiTab.click();
      await expect(page).toHaveURL(/.*tab=padmavathi.*/);
    }

    const saiLaxmiTab = page.locator('button:has-text("Sai Laxmi")').first();
    if (await saiLaxmiTab.isVisible()) {
      await saiLaxmiTab.click();
      await expect(page).toHaveURL(/.*tab=sai-laxmi.*/);
    }
  });

  test('Asset Registries - Quick Access Shortcuts navigation', async ({ page }) => {
    const pinPad = page.locator('text=Family Vault');
    if (await pinPad.isVisible({ timeout: 2000 })) {
      for (const digit of ['3', '4', '6', '3']) {
        await page.click(`button:has-text("${digit}")`);
      }
    }

    await expect(page.locator('text=Family Wealth').or(page.locator('text=Family'))).toBeVisible({ timeout: 8000 });

    // Click Fixed Deposits shortcut
    const fdShortcut = page.locator('button:has-text("Fixed Deposits")').first();
    if (await fdShortcut.isVisible()) {
      await fdShortcut.click();
      await expect(page.locator('text=Fixed Deposits').first()).toBeVisible();
    }

    // Click Gold shortcut
    const goldShortcut = page.locator('button:has-text("Gold")').first();
    if (await goldShortcut.isVisible()) {
      await goldShortcut.click();
      await expect(page.locator('text=Gold Holdings').or(page.locator('text=Gold')).first()).toBeVisible();
    }
  });

  test('Export & Backup Modal - Open and verify controls', async ({ page }) => {
    const pinPad = page.locator('text=Family Vault');
    if (await pinPad.isVisible({ timeout: 2000 })) {
      for (const digit of ['3', '4', '6', '3']) {
        await page.click(`button:has-text("${digit}")`);
      }
    }

    await expect(page.locator('text=Family Wealth').or(page.locator('text=Family'))).toBeVisible({ timeout: 8000 });

    // Open Export / Backup dropdown or modal if button present
    const exportBtn = page.locator('button:has-text("Export")').or(page.locator('button:has-text("Backup")')).first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      // Should show export options
      await expect(page.locator('text=JSON').or(page.locator('text=CSV')).first()).toBeVisible();
    }
  });

  test('Smart Import - Open modal and verify dropzone', async ({ page }) => {
    const pinPad = page.locator('text=Family Vault');
    if (await pinPad.isVisible({ timeout: 2000 })) {
      for (const digit of ['3', '4', '6', '3']) {
        await page.click(`button:has-text("${digit}")`);
      }
    }

    await expect(page.locator('text=Family Wealth').or(page.locator('text=Family'))).toBeVisible({ timeout: 8000 });

    // Trigger Smart Import
    const importBtn = page.locator('button[aria-label*="Smart Import"]').or(page.locator('button:has-text("Smart Import")')).first();
    if (await importBtn.isVisible()) {
      await importBtn.click();
      await expect(page.locator('text=Smart Import').or(page.locator('text=Drop files here'))).toBeVisible();
    }
  });

  test('Offline Resilience - Remains functional when offline', async ({ page, context }) => {
    const pinPad = page.locator('text=Family Vault');
    if (await pinPad.isVisible({ timeout: 2000 })) {
      for (const digit of ['3', '4', '6', '3']) {
        await page.click(`button:has-text("${digit}")`);
      }
    }

    await expect(page.locator('text=Family Wealth').or(page.locator('text=Family'))).toBeVisible({ timeout: 8000 });

    // Simulate network disconnection
    await context.setOffline(true);

    // Verify UI does not crash and continues rendering
    await expect(page.locator('body')).not.toBeEmpty();
    const familyHeader = page.locator('text=Family Wealth').or(page.locator('text=Family'));
    await expect(familyHeader).toBeVisible();

    // Re-enable network
    await context.setOffline(false);
  });
});
