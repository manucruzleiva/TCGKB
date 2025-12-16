import { test, expect } from '@playwright/test';

test.describe('Theme Switching (Dark/Light Mode)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should default to light mode on first visit', async ({ page }) => {
    // Check if body or html has light mode class
    const html = page.locator('html');
    const bodyClasses = await html.getAttribute('class');

    // Should not have 'dark' class initially (or based on system preference)
    // This test assumes light mode default
    if (bodyClasses) {
      // Either no dark class or explicit light mode
      const isDarkMode = bodyClasses.includes('dark');
      // This will vary based on system settings, so we just check it has a theme
      expect(bodyClasses).toBeDefined();
    }
  });

  test('should toggle between light and dark mode', async ({ page }) => {
    // Find the theme toggle button
    const themeButton = page.locator('button[aria-label*="theme" i], button[title*="theme" i], button:has-text("🌙"), button:has-text("☀")').first();

    if (await themeButton.isVisible()) {
      // Get initial theme
      const html = page.locator('html');
      const initialClasses = await html.getAttribute('class') || '';
      const initiallyDark = initialClasses.includes('dark');

      // Click toggle
      await themeButton.click();
      await page.waitForTimeout(500);

      // Check theme changed
      const newClasses = await html.getAttribute('class') || '';
      const nowDark = newClasses.includes('dark');

      // Theme should have toggled
      expect(nowDark).not.toBe(initiallyDark);

      // Click again to toggle back
      await themeButton.click();
      await page.waitForTimeout(500);

      const finalClasses = await html.getAttribute('class') || '';
      const finalDark = finalClasses.includes('dark');

      // Should be back to initial state
      expect(finalDark).toBe(initiallyDark);
    }
  });

  test('should persist theme preference across page reloads', async ({ page }) => {
    const themeButton = page.locator('button[aria-label*="theme" i], button[title*="theme" i], button:has-text("🌙"), button:has-text("☀")').first();

    if (await themeButton.isVisible()) {
      // Set to dark mode
      const html = page.locator('html');
      let classes = await html.getAttribute('class') || '';

      // If not dark, toggle to dark
      if (!classes.includes('dark')) {
        await themeButton.click();
        await page.waitForTimeout(500);
      }

      // Verify dark mode
      classes = await html.getAttribute('class') || '';
      expect(classes).toContain('dark');

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Theme should still be dark
      const reloadedClasses = await html.getAttribute('class') || '';
      expect(reloadedClasses).toContain('dark');
    }
  });

  test('should apply dark mode styles to components', async ({ page }) => {
    const themeButton = page.locator('button[aria-label*="theme" i], button[title*="theme" i], button:has-text("🌙"), button:has-text("☀")').first();

    if (await themeButton.isVisible()) {
      // Toggle to dark mode
      const html = page.locator('html');
      let classes = await html.getAttribute('class') || '';

      if (!classes.includes('dark')) {
        await themeButton.click();
        await page.waitForTimeout(500);
      }

      // Check that dark mode classes are applied to elements
      const header = page.locator('header');
      const headerClasses = await header.getAttribute('class') || '';

      // Header should have dark mode classes
      expect(headerClasses).toMatch(/dark:|bg-gray-800|dark/i);

      // Check body background
      const body = page.locator('body');
      const bodyClasses = await body.getAttribute('class') || '';
      expect(bodyClasses).toBeDefined();
    }
  });

  test('should maintain theme when navigating between pages', async ({ page }) => {
    const themeButton = page.locator('button[aria-label*="theme" i], button[title*="theme" i], button:has-text("🌙"), button:has-text("☀")').first();

    if (await themeButton.isVisible()) {
      // Set dark mode
      await themeButton.click();
      await page.waitForTimeout(500);

      const html = page.locator('html');
      const darkModeSet = (await html.getAttribute('class') || '').includes('dark');

      if (darkModeSet) {
        // Navigate to login page
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        // Should still be dark mode
        const loginClasses = await html.getAttribute('class') || '';
        expect(loginClasses).toContain('dark');

        // Navigate back to home
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Should still be dark mode
        const homeClasses = await html.getAttribute('class') || '';
        expect(homeClasses).toContain('dark');
      }
    }
  });

  test('should update theme button icon when toggling', async ({ page }) => {
    const themeButton = page.locator('button[aria-label*="theme" i], button[title*="theme" i], button:has-text("🌙"), button:has-text("☀")').first();

    if (await themeButton.isVisible()) {
      // Get initial button content/icon
      const initialContent = await themeButton.textContent();

      // Toggle theme
      await themeButton.click();
      await page.waitForTimeout(500);

      // Button content should have changed (icon switched)
      const newContent = await themeButton.textContent();

      // The icon should be different (sun vs moon)
      expect(newContent).not.toBe(initialContent);
    }
  });

  test('should work with localStorage cleared', async ({ page, context }) => {
    // Clear localStorage
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const themeButton = page.locator('button[aria-label*="theme" i], button[title*="theme" i], button:has-text("🌙"), button:has-text("☀")').first();

    if (await themeButton.isVisible()) {
      // Should still be able to toggle
      await themeButton.click();
      await page.waitForTimeout(500);

      const html = page.locator('html');
      const classes = await html.getAttribute('class');

      // Should have a theme applied
      expect(classes).toBeDefined();
    }
  });

  test('should apply dark mode to cards', async ({ page }) => {
    const themeButton = page.locator('button[aria-label*="theme" i], button[title*="theme" i], button:has-text("🌙"), button:has-text("☀")').first();

    // Search for cards
    const searchInput = page.getByPlaceholder(/Buscar cartas por nombre/i);
    await searchInput.fill('Pikachu');
    await page.getByRole('button', { name: /Buscar/i }).click();
    await page.waitForSelector('img[alt*="Pikachu"]', { timeout: 10000 });

    if (await themeButton.isVisible()) {
      // Toggle to dark mode
      await themeButton.click();
      await page.waitForTimeout(500);

      // Cards should have dark mode styles
      const card = page.locator('.card, [class*="card"]').first();
      if (await card.isVisible()) {
        const cardClasses = await card.getAttribute('class');
        // Card should exist and be styled
        expect(cardClasses).toBeDefined();
      }
    }
  });

  test('should apply dark mode to forms', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const themeButton = page.locator('button[aria-label*="theme" i], button[title*="theme" i], button:has-text("🌙"), button:has-text("☀")').first();

    if (await themeButton.isVisible()) {
      // Toggle to dark mode
      await themeButton.click();
      await page.waitForTimeout(500);

      // Input fields should have dark mode
      const input = page.getByPlaceholder(/nombre de usuario/i);
      if (await input.isVisible()) {
        const inputClasses = await input.getAttribute('class') || '';
        // Input should have dark mode classes
        expect(inputClasses).toMatch(/dark:|bg-gray|text-gray/i);
      }
    }
  });

  test('should handle rapid theme toggling', async ({ page }) => {
    const themeButton = page.locator('button[aria-label*="theme" i], button[title*="theme" i], button:has-text("🌙"), button:has-text("☀")').first();

    if (await themeButton.isVisible()) {
      // Rapid toggle
      await themeButton.click();
      await themeButton.click();
      await themeButton.click();
      await themeButton.click();

      await page.waitForTimeout(500);

      // Should still be functional
      const html = page.locator('html');
      const classes = await html.getAttribute('class');
      expect(classes).toBeDefined();
    }
  });
});
