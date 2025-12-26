import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  // Helper function to login before each test
  async function login(page) {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Login/i }).click();
    await page.waitForURL('/');
  }

  test.beforeEach(async ({ page }) => {
    // Login before accessing settings
    await login(page);

    // Navigate to settings via user menu
    await page.locator('[data-testid="user-menu-button"]').click();
    await page.getByRole('link', { name: /Preferencias|Settings/i }).click();
    await page.waitForURL('/settings');
  });

  test.describe('Preferences Section', () => {
    test('should display preferences section with language, theme, and date format options', async ({ page }) => {
      // Check if preferences heading is visible
      await expect(page.getByRole('heading', { name: /Preferencias|Preferences/i })).toBeVisible();

      // Check language options
      await expect(page.getByText(/Español|Spanish/i)).toBeVisible();
      await expect(page.getByText(/Inglés|English/i)).toBeVisible();

      // Check theme options
      await expect(page.getByText(/Claro|Light/i)).toBeVisible();
      await expect(page.getByText(/Oscuro|Dark/i)).toBeVisible();

      // Check date format options
      await expect(page.getByText(/DD\/MM\/YYYY/)).toBeVisible();
      await expect(page.getByText(/MM\/DD\/YYYY/)).toBeVisible();
      await expect(page.getByText(/YYYY\/MM\/DD/)).toBeVisible();

      // Check relative time checkbox
      await expect(page.getByText(/Mostrar tiempo relativo|Show relative time/i)).toBeVisible();
    });

    test('should be able to change language preference', async ({ page }) => {
      // Select English language
      await page.getByText(/Inglés|English/i).click();

      // Save preferences
      await page.getByRole('button', { name: /Guardar|Save/i }).click();

      // Wait for success message
      await expect(page.getByText(/Preferencias guardadas exitosamente|Preferences saved successfully/i)).toBeVisible();
    });

    test('should be able to change theme preference', async ({ page }) => {
      // Select Light theme
      await page.getByText(/Claro|Light/i).click();

      // Save preferences
      await page.getByRole('button', { name: /Guardar|Save/i }).click();

      // Wait for success message
      await expect(page.getByText(/Preferencias guardadas exitosamente|Preferences saved successfully/i)).toBeVisible();
    });

    test('should be able to change date format preference', async ({ page }) => {
      // Select MM/DD/YYYY format
      await page.locator('input[value="MM/DD/YYYY"]').click();

      // Save preferences
      await page.getByRole('button', { name: /Guardar|Save/i }).click();

      // Wait for success message
      await expect(page.getByText(/Preferencias guardadas exitosamente|Preferences saved successfully/i)).toBeVisible();
    });

    test('should be able to toggle relative time display', async ({ page }) => {
      // Click the relative time checkbox
      await page.getByText(/Mostrar tiempo relativo|Show relative time/i).click();

      // Save preferences
      await page.getByRole('button', { name: /Guardar|Save/i }).click();

      // Wait for success message
      await expect(page.getByText(/Preferencias guardadas exitosamente|Preferences saved successfully/i)).toBeVisible();
    });
  });

  test.describe('Account Settings Section', () => {
    test('should display current user information', async ({ page }) => {
      // Check if account heading is visible
      await expect(page.getByRole('heading', { name: /Cuenta|Account/i })).toBeVisible();

      // Check current username and email are displayed
      await expect(page.getByText(/Usuario actual|Current username/i)).toBeVisible();
      await expect(page.getByText(/Email actual|Current email/i)).toBeVisible();
    });

    test('should show validation error when trying to update email without current password', async ({ page }) => {
      // Fill in new email without password
      await page.getByPlaceholder(/Nuevo email|New email/i).fill('newemail@example.com');

      // Click update email button
      await page.getByRole('button', { name: /Actualizar Email|Update Email/i }).click();

      // Button should be disabled (no password provided)
      await expect(page.getByRole('button', { name: /Actualizar Email|Update Email/i })).toBeDisabled();
    });

    test('should show validation error when trying to update username without current password', async ({ page }) => {
      // Fill in new username without password
      await page.getByPlaceholder(/Nuevo usuario|New username/i).fill('newusername');

      // Click update username button
      await page.getByRole('button', { name: /Actualizar Usuario|Update Username/i }).click();

      // Button should be disabled (no password provided)
      await expect(page.getByRole('button', { name: /Actualizar Usuario|Update Username/i })).toBeDisabled();
    });

    test('should show error when new passwords do not match', async ({ page }) => {
      // Fill in password fields with mismatched passwords
      const passwordInputs = page.getByPlaceholder(/contraseña|password/i);

      // Current password
      await passwordInputs.nth(0).fill('password123');

      // New password
      await page.getByPlaceholder(/Nueva contraseña|New password/i).fill('newpassword123');

      // Confirm password (different)
      await page.getByPlaceholder(/Confirmar contraseña|Confirm password/i).fill('differentpassword');

      // Click update password button
      await page.getByRole('button', { name: /Actualizar Contraseña|Update Password/i }).click();

      // Should show error message
      await expect(page.getByText(/Las contraseñas no coinciden|Passwords do not match/i)).toBeVisible();
    });

    test('should require all password fields to be filled', async ({ page }) => {
      // Try to click update password without filling fields
      await expect(page.getByRole('button', { name: /Actualizar Contraseña|Update Password/i })).toBeDisabled();

      // Fill only current password
      await page.getByPlaceholder(/Contraseña actual|Current password/i).nth(2).fill('password123');
      await expect(page.getByRole('button', { name: /Actualizar Contraseña|Update Password/i })).toBeDisabled();

      // Fill new password
      await page.getByPlaceholder(/Nueva contraseña|New password/i).fill('newpass123');
      await expect(page.getByRole('button', { name: /Actualizar Contraseña|Update Password/i })).toBeDisabled();

      // Fill confirm password - button should now be enabled
      await page.getByPlaceholder(/Confirmar contraseña|Confirm password/i).fill('newpass123');
      await expect(page.getByRole('button', { name: /Actualizar Contraseña|Update Password/i })).toBeEnabled();
    });
  });

  test.describe('Navigation', () => {
    test('should redirect to login if not authenticated', async ({ page }) => {
      // Logout first
      await page.goto('/');
      await page.locator('[data-testid="user-menu-button"]').click();
      await page.getByRole('button', { name: /Cerrar Sesión|Logout/i }).click();
      await page.waitForTimeout(500);

      // Try to access settings
      await page.goto('/settings');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should be accessible from user menu when logged in', async ({ page }) => {
      await page.goto('/');

      // Click user menu
      await page.locator('[data-testid="user-menu-button"]').click();

      // Settings link should be visible
      await expect(page.getByRole('link', { name: /Preferencias|Settings/i })).toBeVisible();

      // Click settings
      await page.getByRole('link', { name: /Preferencias|Settings/i }).click();

      // Should navigate to settings page
      await expect(page).toHaveURL(/\/settings/);
    });
  });

  test.describe('Responsive Layout', () => {
    test('should display as two columns on desktop', async ({ page }) => {
      // Set viewport to desktop size
      await page.setViewportSize({ width: 1280, height: 720 });

      // Check if grid layout is present (2 columns on large screens)
      const gridContainer = page.locator('.grid.lg\\:grid-cols-2');
      await expect(gridContainer).toBeVisible();
    });

    test('should stack vertically on mobile', async ({ page }) => {
      // Set viewport to mobile size
      await page.setViewportSize({ width: 375, height: 667 });

      // Grid should still be present but stacked (grid-cols-1 on small screens)
      const gridContainer = page.locator('.grid');
      await expect(gridContainer).toBeVisible();

      // Both sections should be visible
      await expect(page.getByRole('heading', { name: /Cuenta|Account/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Preferencias|Preferences/i })).toBeVisible();
    });
  });
});
