import { test, expect } from '@playwright/test';

const SHELL_TEXT = /cargando|login|usuario|email|password|yuanto/i;

test('app bootstraps and renders login shell', async ({ page }) => {
  const runtimeErrors = [];
  page.on('pageerror', (err) => runtimeErrors.push(String(err)));
  await page.goto('/');
  await expect(page.locator('body')).toContainText(SHELL_TEXT);
  expect(runtimeErrors).toEqual([]);
});

test('app still renders in offline mode', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (err) => runtimeErrors.push(String(err)));
  await page.goto('/');
  await expect(page.locator('body')).toContainText(SHELL_TEXT);
  await context.setOffline(true);
  await expect.poll(async () => page.evaluate(() => navigator.onLine)).toBe(false);
  await expect(page.locator('body')).toContainText(SHELL_TEXT);
  await context.setOffline(false);
  await expect.poll(async () => page.evaluate(() => navigator.onLine)).toBe(true);
  expect(runtimeErrors).toEqual([]);
});

test('pwa manifest exposes install essentials', async ({ page }) => {
  const manifest = await page.request.get('/manifest.json');
  expect(manifest.ok()).toBeTruthy();
  const data = await manifest.json();
  expect(data.icons?.some((icon) => icon.src === '/icon-192.png')).toBeTruthy();
  expect(data.icons?.some((icon) => icon.src === '/icon-512.png')).toBeTruthy();
  expect(Array.isArray(data.shortcuts)).toBeTruthy();
});
