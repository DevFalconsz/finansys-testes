import { test, expect } from '@playwright/test';

test('deve carregar a página inicial', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page).toHaveTitle(/Finansys/);
});

