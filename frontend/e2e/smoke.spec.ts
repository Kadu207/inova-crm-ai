import { test, expect, devices } from '@playwright/test';

test.describe('smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Inova CRM/i })).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('login is usable on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    await page.goto('/login');
    await expect(page.getByLabel('Tenant (slug)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    const box = await page.getByRole('button', { name: 'Entrar' }).boundingBox();
    expect(box?.width).toBeGreaterThan(200);
    await context.close();
  });
});
