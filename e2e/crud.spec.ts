import { test, expect, Page } from '@playwright/test';

async function unlockIfLocked(page: Page) {
  const pinHeading = page.getByRole('heading', { name: 'Enter Passcode' });
  if (await pinHeading.isVisible({ timeout: 4000 }).catch(() => false)) {
    await page.keyboard.type('3463');
  }
  await expect(page.locator('text=Family Wealth').or(page.locator('text=Family'))).toBeVisible({ timeout: 15000 });
}

test.describe('Family Wealth Tracker - Deep Asset CRUD Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await unlockIfLocked(page);
  });

  test('Real Estate - Open form, create new property and verify rendering', async ({ page }) => {
    // Navigate to Real Estate via quick shortcut or navigation
    const reNav = page.locator('button[aria-label="Jump to Real Estate"]').or(page.locator('button:has-text("Real Estate")')).first();
    await reNav.click();

    await expect(page.locator('text=Real Estate').first()).toBeVisible({ timeout: 8000 });

    // Click Add Property button
    const addBtn = page.locator('button:has-text("Add Property")').first();
    await addBtn.click();

    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 6000 });

    // Fill form inside dialog
    const uniquePropName = `E2E Palm Heights ${Date.now().toString().slice(-4)}`;
    const nameInput = dialog.locator('input[placeholder*="Palm Heights"]').or(dialog.locator('input[placeholder*="Apartment"]')).or(dialog.locator('input[type="text"]')).first();
    await nameInput.fill(uniquePropName);

    const locationInput = dialog.locator('input[placeholder*="Whitefield"]').or(dialog.locator('input[placeholder*="City"]')).first();
    if (await locationInput.isVisible()) {
      await locationInput.fill('Whitefield, Bangalore');
    }

    const priceInput = dialog.locator('input[placeholder*="5000000"]').or(dialog.locator('input[type="number"]')).first();
    await priceInput.fill('6000000');

    // Submit form with type="submit"
    const submitBtn = dialog.locator('button[type="submit"]:has-text("Add Property")').first();
    await submitBtn.click();

    // Verify property appears in the registry
    await expect(page.locator(`text=${uniquePropName}`).first()).toBeVisible({ timeout: 12000 });
  });

  test('Mutual Fund SIP - Open form, create new SIP and verify rendering', async ({ page }) => {
    // Navigate to SIP view
    const sipNav = page.locator('button[aria-label="Jump to SIP Mutual Funds"]').or(page.locator('button:has-text("SIP")')).first();
    await sipNav.click();

    await expect(page.locator('text=Mutual Funds').or(page.locator('text=SIP')).first()).toBeVisible({ timeout: 8000 });

    // Click Add SIP button
    const addSipBtn = page.locator('button:has-text("Add SIP")').first();
    if (await addSipBtn.isVisible({ timeout: 5000 })) {
      await addSipBtn.click();

      const dialog = page.getByRole('dialog').first();
      await expect(dialog).toBeVisible({ timeout: 6000 });

      const fundNameInput = dialog.locator('input[placeholder*="Parag Parikh"]').or(dialog.locator('input[placeholder*="Fund"]')).first();
      const uniqueFund = `E2E Flexi Cap Fund ${Date.now().toString().slice(-4)}`;
      await fundNameInput.fill(uniqueFund);

      const monthlyInput = dialog.locator('input[placeholder*="5000"]').or(dialog.locator('input[type="number"]')).first();
      await monthlyInput.fill('10000');

      const dateInput = dialog.locator('input[type="date"]').first();
      await dateInput.fill('2025-02-01');

      const submitBtn = dialog.locator('button[type="submit"]:has-text("Create SIP")').first();
      await submitBtn.click();

      // Verify the new SIP is registered
      await expect(page.locator(`text=${uniqueFund}`).first()).toBeVisible({ timeout: 12000 });
    }
  });

  test('Gold Holding - Open form, create gold holding and verify rendering', async ({ page }) => {
    // Navigate to Gold view
    const goldNav = page.locator('button[aria-label="Jump to Gold Holdings"]').or(page.locator('button:has-text("Gold")')).first();
    await goldNav.click();

    await expect(page.locator('text=Gold').first()).toBeVisible({ timeout: 8000 });

    // Click Add Gold button
    const addGoldBtn = page.locator('button:has-text("Add Gold")').first();
    await addGoldBtn.click();

    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 6000 });

    // Verify modal inputs inside dialog
    const itemNameInput = dialog.locator('input[placeholder*="Gold Coin"]').or(dialog.locator('input[placeholder*="24K"]').or(dialog.locator('input[placeholder*="Necklace"]'))).first();
    const uniqueGoldItem = `E2E 24K Sovereign ${Date.now().toString().slice(-4)}`;
    await itemNameInput.fill(uniqueGoldItem);

    const weightInput = dialog.locator('input[placeholder*="55.33"]').or(dialog.locator('input[type="number"]')).first();
    await weightInput.fill('16');

    // Submit form with type="submit" inside dialog
    const submitBtn = dialog.locator('button[type="submit"]:has-text("Add Gold")').first();
    await submitBtn.click();

    // Verify gold item renders in registry
    await expect(page.locator(`text=${uniqueGoldItem}`).first()).toBeVisible({ timeout: 12000 });
  });
});
