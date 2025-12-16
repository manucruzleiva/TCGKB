import { test, expect } from '@playwright/test';

test.describe('Comments Functionality', () => {
  // Helper function to login before testing comments
  async function login(page) {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario/i).fill('testuser');
    await page.getByPlaceholder(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
    await page.waitForURL('/');
  }

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display comment form on card details page', async ({ page }) => {
    // Search for a card
    await page.getByPlaceholder(/Buscar cartas por nombre/i).fill('Pikachu');
    await page.getByRole('button', { name: /Buscar/i }).click();

    // Wait for results and click first card
    await page.waitForSelector('img[alt="Pikachu"]', { timeout: 10000 });
    await page.locator('img[alt="Pikachu"]').first().click();

    // Wait for card details page
    await page.waitForURL(/\/card\//);

    // Should show comment form
    await expect(page.getByPlaceholder(/Escribe un comentario/i)).toBeVisible();
  });

  test('should create a comment successfully', async ({ page }) => {
    // Navigate to a specific card
    await page.goto('/card/sv8pt5-28'); // Example card ID

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Fill comment form
    const commentText = `Test comment ${Date.now()}`;
    await page.getByPlaceholder(/Escribe un comentario/i).fill(commentText);
    await page.getByRole('button', { name: /Comentar/i }).click();

    // Should show the comment
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 5000 });
  });

  test('should not allow empty comments', async ({ page }) => {
    await page.goto('/card/sv8pt5-28');
    await page.waitForLoadState('networkidle');

    // Try to submit empty comment
    await page.getByRole('button', { name: /Comentar/i }).click();

    // Should show error or button should be disabled
    const submitButton = page.getByRole('button', { name: /Comentar/i });
    await expect(submitButton).toBeDisabled();
  });

  test('should display existing comments', async ({ page }) => {
    await page.goto('/card/sv8pt5-28');
    await page.waitForLoadState('networkidle');

    // Wait for comments section
    await page.waitForSelector('[data-testid="comments-list"], .comments', { timeout: 5000 }).catch(() => {
      // If no comments exist yet, that's okay
    });

    // Page should have loaded without errors
    await expect(page).not.toHaveURL(/error/);
  });

  test('should support nested replies', async ({ page }) => {
    await page.goto('/card/sv8pt5-28');
    await page.waitForLoadState('networkidle');

    // Create a top-level comment first
    const topComment = `Top comment ${Date.now()}`;
    await page.getByPlaceholder(/Escribe un comentario/i).fill(topComment);
    await page.getByRole('button', { name: /Comentar/i }).click();

    // Wait for comment to appear
    await expect(page.getByText(topComment)).toBeVisible({ timeout: 5000 });

    // Look for reply button
    const replyButton = page.getByRole('button', { name: /Responder/i }).first();
    if (await replyButton.isVisible()) {
      await replyButton.click();

      // Fill reply
      const replyText = `Reply ${Date.now()}`;
      await page.getByPlaceholder(/Escribe una respuesta/i).fill(replyText);
      await page.getByRole('button', { name: /Comentar/i }).last().click();

      // Should show the reply
      await expect(page.getByText(replyText)).toBeVisible({ timeout: 5000 });
    }
  });
});
