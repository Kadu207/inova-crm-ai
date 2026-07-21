import { test, expect, devices } from '@playwright/test';

test.describe('smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Inova CRM/i })).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('login is usable on mobile viewport 375', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await expect(page.getByLabel('Tenant (slug)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    const box = await page.getByRole('button', { name: 'Entrar' }).boundingBox();
    expect(box?.width).toBeGreaterThan(200);
    await context.close();
  });

  test('login usable on tablet viewport 768', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    const bg = await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor);
    // void #141416 ≈ rgb(20, 20, 22)
    expect(bg).toMatch(/rgb\(\s*20,\s*20,\s*22\s*\)/);
  });
});
