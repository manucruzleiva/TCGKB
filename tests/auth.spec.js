import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('button', { name: /Registrarse/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /Crear cuenta/i })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
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

  test('should allow user to logout after login', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Fill login form (using test credentials)
    await page.getByPlaceholder(/nombre de usuario/i).fill('testuser');
    await page.getByPlaceholder(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

    // Wait for redirect to homepage
    await page.waitForURL('/');

    // Should show user greeting
    await expect(page.getByText(/Hola,/i)).toBeVisible();

    // Click logout
    await page.getByRole('button', { name: /Cerrar Sesión/i }).click();

    // Should show login/register buttons again
    await expect(page.getByRole('button', { name: /Iniciar Sesión/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Registrarse/i })).toBeVisible();
  });
});
