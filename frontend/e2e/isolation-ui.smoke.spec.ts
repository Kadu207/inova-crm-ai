import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';

/**
 * Visual/API isolation smoke against a running CRM (prod or staging).
 *
 *   CI=1 PLAYWRIGHT_BASE_URL=https://crm.inovatitech.com.br \
 *     INOVA_ADMIN_PASSWORD=... CLIENTE_DEMO_PASSWORD=... \
 *     npx playwright test e2e/isolation-ui.smoke.spec.ts
 *
 * Skips when passwords are missing (local gate stays green).
 */

const INOVA_PASSWORD = process.env.INOVA_ADMIN_PASSWORD ?? '';
const DEMO_PASSWORD = process.env.CLIENTE_DEMO_PASSWORD ?? '';
const SHOT_DIR = path.join('..', 'reports', 'ui-smoke');

const hasCreds = Boolean(INOVA_PASSWORD && DEMO_PASSWORD);

async function login(page: Page, input: { slug: string; email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('Tenant (slug)').fill(input.slug);
  await page.getByLabel('E-mail').fill(input.email);
  await page.getByLabel('Senha').fill(input.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
}

async function collectLeadTitles(page: Page): Promise<string[]> {
  await page.goto('/leads');
  await expect(page.getByRole('heading', { name: 'Leads' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Carregando/i)).toHaveCount(0, { timeout: 30_000 });
  const ignore = new Set(['Detalhe', 'Qualificar', 'Converter', '+ Novo lead', 'Novo lead']);
  const fromLinks = await page.locator('table a[href^="/leads/"]').allTextContents();
  const fromCards = await page.locator('article h3').allTextContents();
  return [
    ...new Set(
      [...fromLinks, ...fromCards]
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && !ignore.has(t)),
    ),
  ];
}

test.describe('UI isolation smoke (inova vs cliente-demo)', () => {
  test.skip(!hasCreds, 'Set INOVA_ADMIN_PASSWORD and CLIENTE_DEMO_PASSWORD to run');

  test('tenants show isolated lead lists', async ({ page }, testInfo) => {
    await login(page, {
      slug: 'inova',
      email: 'admin@inovatitech.com.br',
      password: INOVA_PASSWORD,
    });
    await page.goto('/');
    await page.screenshot({
      path: path.join(SHOT_DIR, 'inova-home.png'),
      fullPage: true,
    });

    const inovaLeads = await collectLeadTitles(page);
    await page.screenshot({
      path: path.join(SHOT_DIR, 'inova-leads.png'),
      fullPage: true,
    });
    expect(
      inovaLeads.some((t) => t.includes('[cliente-demo]')),
      `inova must not show cliente-demo marker; got: ${inovaLeads.join(' | ')}`,
    ).toBe(false);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /Admin SaaS/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.screenshot({
      path: path.join(SHOT_DIR, 'inova-admin.png'),
      fullPage: true,
    });

    // Fresh context for second tenant (clear localStorage session)
    const demo = await page.context().browser()!.newContext();
    const demoPage = await demo.newPage();
    await login(demoPage, {
      slug: 'cliente-demo',
      email: 'admin@cliente-demo.example',
      password: DEMO_PASSWORD,
    });
    const demoLeads = await collectLeadTitles(demoPage);
    await demoPage.screenshot({
      path: path.join(SHOT_DIR, 'cliente-demo-leads.png'),
      fullPage: true,
    });
    expect(
      demoLeads.some((t) => t.includes('[cliente-demo]')),
      `cliente-demo should show isolation sample; got: ${demoLeads.join(' | ')}`,
    ).toBe(true);

    await demoPage.goto('/empresas');
    await expect(demoPage.getByRole('heading', { name: /Empresas/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      demoPage.getByRole('link', { name: /\[cliente-demo\] Empresa Isolada/i }),
    ).toBeVisible();
    await demoPage.screenshot({
      path: path.join(SHOT_DIR, 'cliente-demo-empresas.png'),
      fullPage: true,
    });

    // inova must not see demo company marker
    await page.goto('/empresas');
    await expect(page.getByRole('heading', { name: /Empresas/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('link', { name: /\[cliente-demo\]/ })).toHaveCount(0);
    await page.screenshot({
      path: path.join(SHOT_DIR, 'inova-empresas.png'),
      fullPage: true,
    });

    // Cross-check: no shared title between tenants when demo marker present
    const overlap = inovaLeads.filter((t) => demoLeads.includes(t));
    expect(overlap, `unexpected shared lead titles: ${overlap.join(' | ')}`).toEqual([]);

    testInfo.annotations.push({
      type: 'isolation',
      description: `inova=${inovaLeads.length} leads; demo=${demoLeads.length} leads; overlap=0`,
    });

    await demo.close();
  });
});
