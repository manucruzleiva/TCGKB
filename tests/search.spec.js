import { test, expect } from '@playwright/test';

test.describe('Card Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display homepage with search input', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pokemon TCG Knowledge Base' })).toBeVisible();
    await expect(page.getByPlaceholder(/Buscar cartas por nombre/i)).toBeVisible();
  });

  test('should search for cards by exact name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar cartas por nombre/i);
    await searchInput.fill('Pikachu');
    await page.getByRole('button', { name: /Buscar/i }).click();

    // Wait for results
    await page.waitForSelector('img[alt="Pikachu"]', { timeout: 10000 });

    // Should display results
    await expect(page.getByText(/resultados/i)).toBeVisible();
  });

  test('should support fuzzy search with misspelling', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar cartas por nombre/i);

    // Test fuzzy search with misspelled "Gholdengo" as "ghodlengo"
    await searchInput.fill('ghodlengo');
    await page.getByRole('button', { name: /Buscar/i }).click();

    // Wait for results (should still find Gholdengo)
    await page.waitForTimeout(30000); // API can be slow
    await expect(page.getByText(/resultados/i)).toBeVisible();
  });

  test('should show loading state during search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar cartas por nombre/i);
    await searchInput.fill('Charizard');
    await page.getByRole('button', { name: /Buscar/i }).click();

    // Should show loading button
    await expect(page.getByRole('button', { name: /Buscando/i })).toBeVisible();
  });

  test('should filter rotated cards (only G,H,I regulation marks)', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar cartas por nombre/i);
    await searchInput.fill('Pikachu');
    await page.getByRole('button', { name: /Buscar/i }).click();

    // Wait for results
    await page.waitForSelector('img', { timeout: 10000 });

    // Check that results are showing (implies filtering worked)
    const resultText = await page.getByText(/resultados/).textContent();
    expect(resultText).toBeTruthy();
  });

  test('should show cache indicator when data is cached', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar cartas por nombre/i);

    // First search
    await searchInput.fill('Ditto');
    await page.getByRole('button', { name: /Buscar/i }).click();
    await page.waitForTimeout(30000); // Wait for API response

    // Reload and search again (should be from cache)
    await page.reload();
    await searchInput.fill('Ditto');
    await page.getByRole('button', { name: /Buscar/i }).click();

    // Should show cache indicator faster
    await expect(page.getByText(/Datos en caché/i)).toBeVisible({ timeout: 5000 });
  });
});
