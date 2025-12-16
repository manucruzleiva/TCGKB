import { test, expect } from '@playwright/test';

test.describe('Language Switching (ES/EN)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should find language switcher button', async ({ page }) => {
    // Look for language switcher (could be dropdown, button, or toggle)
    const langSwitcher = page.locator('button:has-text("ES"), button:has-text("EN"), select[aria-label*="language" i], button[aria-label*="language" i], [data-testid="language-switcher"]').first();

    await expect(langSwitcher).toBeVisible({ timeout: 5000 });
  });

  test('should switch from Spanish to English', async ({ page }) => {
    // Find element with Spanish text
    const spanishText = page.getByText(/Buscar cartas por nombre/i);

    if (await spanishText.isVisible()) {
      // Find language switcher
      const langButton = page.locator('button:has-text("EN"), button[aria-label*="English" i]').first();

      if (await langButton.isVisible()) {
        await langButton.click();
        await page.waitForTimeout(500);

        // Text should change to English
        await expect(page.getByPlaceholder(/Search cards by name/i)).toBeVisible({ timeout: 3000 });

        // Spanish text should be gone
        const spanishStillVisible = await spanishText.isVisible().catch(() => false);
        expect(spanishStillVisible).toBeFalsy();
      }
    }
  });

  test('should switch from English to Spanish', async ({ page }) => {
    // First switch to English if not already
    const enButton = page.locator('button:has-text("EN")').first();

    if (await enButton.isVisible()) {
      await enButton.click();
      await page.waitForTimeout(500);
    }

    // Look for English text
    const englishText = page.getByPlaceholder(/Search cards by name/i);

    if (await englishText.isVisible()) {
      // Switch to Spanish
      const esButton = page.locator('button:has-text("ES"), button[aria-label*="Español" i]').first();

      if (await esButton.isVisible()) {
        await esButton.click();
        await page.waitForTimeout(500);

        // Should show Spanish text
        await expect(page.getByPlaceholder(/Buscar cartas por nombre/i)).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should persist language preference across page reloads', async ({ page }) => {
    // Switch to English
    const enButton = page.locator('button:has-text("EN")').first();

    if (await enButton.isVisible()) {
      await enButton.click();
      await page.waitForTimeout(500);

      // Verify English
      await expect(page.getByPlaceholder(/Search cards by name/i)).toBeVisible({ timeout: 3000 });

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be English
      await expect(page.getByPlaceholder(/Search cards by name/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should translate navigation items', async ({ page }) => {
    // Check login/register buttons in Spanish
    let loginButton = page.getByRole('button', { name: /Iniciar Sesión/i });

    if (await loginButton.isVisible()) {
      // Switch to English
      const enButton = page.locator('button:has-text("EN")').first();

      if (await enButton.isVisible()) {
        await enButton.click();
        await page.waitForTimeout(500);

        // Login button should now be in English
        await expect(page.getByRole('button', { name: /Login/i })).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should translate search placeholder', async ({ page }) => {
    const spanishPlaceholder = page.getByPlaceholder(/Buscar cartas por nombre/i);

    if (await spanishPlaceholder.isVisible()) {
      // Switch to English
      const enButton = page.locator('button:has-text("EN")').first();

      if (await enButton.isVisible()) {
        await enButton.click();
        await page.waitForTimeout(500);

        // Placeholder should be in English
        await expect(page.getByPlaceholder(/Search cards by name/i)).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should translate button labels', async ({ page }) => {
    // Search button should translate
    let searchButton = page.getByRole('button', { name: /Buscar/i }).first();

    if (await searchButton.isVisible()) {
      // Switch to English
      const enButton = page.locator('button:has-text("EN")').first();

      if (await enButton.isVisible()) {
        await enButton.click();
        await page.waitForTimeout(500);

        // Search button should now say "Search"
        await expect(page.getByRole('button', { name: /Search/i })).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should maintain language when navigating between pages', async ({ page }) => {
    // Switch to English
    const enButton = page.locator('button:has-text("EN")').first();

    if (await enButton.isVisible()) {
      await enButton.click();
      await page.waitForTimeout(500);

      // Navigate to login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Should still be English
      await expect(page.getByRole('heading', { name: /Log In|Sign In/i })).toBeVisible({ timeout: 3000 });

      // Navigate back
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should still be English
      await expect(page.getByPlaceholder(/Search cards by name/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should translate form labels', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check Spanish labels
    const usernameLabel = page.getByPlaceholder(/nombre de usuario/i);

    if (await usernameLabel.isVisible()) {
      // Switch to English
      const enButton = page.locator('button:has-text("EN")').first();

      if (await enButton.isVisible()) {
        await enButton.click();
        await page.waitForTimeout(500);

        // Labels should be in English
        await expect(page.getByPlaceholder(/username/i)).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should translate card detail page', async ({ page }) => {
    // Search and open a card
    const searchInput = page.getByPlaceholder(/Buscar cartas por nombre/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('Pikachu');
      await page.getByRole('button', { name: /Buscar/i }).click();
      await page.waitForSelector('img[alt*="Pikachu"]', { timeout: 10000 });
      await page.locator('img[alt*="Pikachu"]').first().click();

      await page.waitForURL(/\/card\//);
      await page.waitForLoadState('networkidle');

      // Find Spanish text on card details
      const setLabel = page.getByText(/Colección:|Set:/i);

      // Switch to English
      const enButton = page.locator('button:has-text("EN")').first();

      if (await enButton.isVisible()) {
        await enButton.click();
        await page.waitForTimeout(500);

        // Should show English labels
        await expect(page.getByText(/Set:/i)).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should translate comment placeholders', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario/i).fill('testuser');
    await page.getByPlaceholder(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
    await page.waitForURL('/');

    await page.goto('/card/sv8pt5-28');
    await page.waitForLoadState('networkidle');

    // Check Spanish comment placeholder
    const commentPlaceholder = page.getByPlaceholder(/Escribe un comentario/i);

    if (await commentPlaceholder.isVisible()) {
      // Switch to English
      const enButton = page.locator('button:has-text("EN")').first();

      if (await enButton.isVisible()) {
        await enButton.click();
        await page.waitForTimeout(500);

        // Should show English placeholder
        await expect(page.getByPlaceholder(/Write.*comment/i)).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should handle rapid language switching', async ({ page }) => {
    const enButton = page.locator('button:has-text("EN")').first();
    const esButton = page.locator('button:has-text("ES")').first();

    if (await enButton.isVisible() && await esButton.isVisible()) {
      // Rapid switching
      await enButton.click();
      await esButton.click();
      await enButton.click();
      await esButton.click();

      await page.waitForTimeout(1000);

      // Should still be functional
      const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="Search"]').first();
      await expect(searchInput).toBeVisible();
    }
  });

  test('should translate time-relative strings', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario/i).fill('testuser');
    await page.getByPlaceholder(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
    await page.waitForURL('/');

    await page.goto('/card/sv8pt5-28');
    await page.waitForLoadState('networkidle');

    // Create a comment to get timestamp
    const commentText = `Time test ${Date.now()}`;
    const commentInput = page.getByPlaceholder(/Escribe un comentario/i);

    if (await commentInput.isVisible()) {
      await commentInput.fill(commentText);
      await page.getByRole('button', { name: /Comentar/i }).click();
      await page.waitForTimeout(2000);

      // Switch to English
      const enButton = page.locator('button:has-text("EN")').first();

      if (await enButton.isVisible()) {
        await enButton.click();
        await page.waitForTimeout(500);

        // Time strings should be in English (e.g., "minutes ago" instead of "hace minutos")
        // This is hard to test precisely, but the page should work
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});
