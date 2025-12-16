import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to register page via user menu', async ({ page }) => {
    // Click user menu icon
    await page.getByRole('button', { name: /Switch to/i }).or(page.locator('button').filter({ has: page.locator('svg path[d*="M16 7a4 4 0 11-8 0"]') })).first().click();

    // Click Register link in dropdown
    await page.getByRole('link', { name: /Registrarse/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /Crear cuenta/i })).toBeVisible();
  });

  test('should navigate to login page via user menu', async ({ page }) => {
    // Click user menu icon (person icon)
    const userMenuButton = page.locator('button').filter({ hasText: '' }).or(
      page.locator('button svg path[d*="M16 7a4 4 0 11-8 0"]').locator('..')
    );
    await userMenuButton.first().click();

    // Click Login link in dropdown
    await page.getByRole('link', { name: /Iniciar Sesión/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Iniciar Sesión/i })).toBeVisible();
  });

  test('should show validation errors on empty register form', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /Crear cuenta/i }).click();

    // Should show validation errors
    await expect(page.getByText(/requerido/i).first()).toBeVisible();
  });

  test('should show validation errors on empty login form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

    // Should show validation errors
    await expect(page.getByText(/requerido/i).first()).toBeVisible();
  });

  test('should allow user to logout after login via user menu', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Fill login form (using test credentials)
    await page.getByPlaceholder(/nombre de usuario/i).fill('testuser');
    await page.getByPlaceholder(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

    // Wait for redirect to homepage
    await page.waitForURL('/');

    // Click user menu icon to open dropdown
    const userMenuButton = page.locator('button').filter({ hasText: '' }).or(
      page.locator('button svg path[d*="M16 7a4 4 0 11-8 0"]').locator('..')
    );
    await userMenuButton.first().click();

    // Should show username in dropdown
    await expect(page.getByText('testuser')).toBeVisible();

    // Click logout button in dropdown
    await page.getByRole('button', { name: /Cerrar Sesión|Logout/i }).click();

    // Wait a moment for logout to complete
    await page.waitForTimeout(500);

    // Click user menu again to verify logout
    await userMenuButton.first().click();

    // Should show login/register links again in dropdown
    await expect(page.getByRole('link', { name: /Iniciar Sesión/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Registrarse/i })).toBeVisible();
  });
});
