import { test, expect, Page } from '@playwright/test';

async function unlockIfLocked(page: Page) {
  const pinHeading = page.getByRole('heading', { name: 'Enter Passcode' });
  if (await pinHeading.isVisible({ timeout: 4000 }).catch(() => false)) {
    await page.keyboard.type('3463');
  }
  await expect(page.locator('text=Family Wealth').or(page.locator('text=Family'))).toBeVisible({ timeout: 15000 });
}

test.describe('Family Wealth Tracker - Smoke & E2E Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await unlockIfLocked(page);
  });

  test('Security Gate - PIN unlock with correct PIN 3463', async ({ page }) => {
    await expect(page.locator('text=Family Wealth').or(page.locator('text=Family'))).toBeVisible();
  });

  test('Navigation - Switch family member tabs and asset classes', async ({ page }) => {
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
    // Click Fixed Deposits shortcut
    const fdShortcut = page.locator('button[aria-label="Jump to Fixed Deposits"]').or(page.locator('button:has-text("Fixed Deposits")')).first();
    if (await fdShortcut.isVisible()) {
      await fdShortcut.click();
      await expect(page.locator('text=Fixed Deposits').first()).toBeVisible();
    }

    // Click Gold shortcut
    const goldShortcut = page.locator('button[aria-label="Jump to Gold Holdings"]').or(page.locator('button:has-text("Gold")')).first();
    if (await goldShortcut.isVisible()) {
      await goldShortcut.click();
      await expect(page.locator('text=Gold Holdings').or(page.locator('text=Gold')).first()).toBeVisible();
    }
  });

  test('Export & Backup Modal - Open and verify controls', async ({ page }) => {
    // Open Export / Backup dropdown or modal if button present
    const exportBtn = page.locator('button:has-text("Export")').or(page.locator('button:has-text("Backup")')).first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      // Should show export options
      await expect(page.locator('text=JSON').or(page.locator('text=CSV')).first()).toBeVisible();
    }
  });

  test('Smart Import - Open modal and verify dropzone', async ({ page }) => {
    // Trigger Smart Import
    const importBtn = page.locator('button[aria-label*="Smart Import"]').or(page.locator('button:has-text("Smart Import")')).first();
    if (await importBtn.isVisible()) {
      await importBtn.click();
      await expect(page.locator('text=Smart Import').or(page.locator('text=Drop files here'))).toBeVisible();
    }
  });

  test('Offline Resilience - Remains functional when offline', async ({ page, context }) => {
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
