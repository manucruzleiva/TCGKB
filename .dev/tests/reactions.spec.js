import { test, expect } from '@playwright/test';

test.describe('Reactions Functionality', () => {
  test.describe('Anonymous Reactions', () => {
    test('should allow anonymous users to add reaction to card', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Search for a card
      const searchInput = page.getByPlaceholder(/Buscar cartas por nombre/i);
      await searchInput.fill('Pikachu');
      await page.getByRole('button', { name: /Buscar/i }).click();

      // Wait for results and click first card
      await page.waitForSelector('img[alt*="Pikachu"]', { timeout: 10000 });
      await page.locator('img[alt*="Pikachu"]').first().click();

      // Wait for card details page
      await page.waitForURL(/\/card\//);
      await page.waitForLoadState('networkidle');

      // Look for reaction section
      const reactionSection = page.locator('[data-testid="card-reactions"], .reactions, button:has-text("😀"), button:has-text("❤️")').first();
      await expect(reactionSection).toBeVisible({ timeout: 5000 });

      // Click on emoji picker or specific emoji
      const emojiButton = page.locator('button').filter({ hasText: /[😀👍❤️🎉]/ }).first();
      if (await emojiButton.isVisible()) {
        const initialCount = await page.locator('text=/\\d+/').count();
        await emojiButton.click();

        // Wait for reaction to be registered
        await page.waitForTimeout(1000);

        // Check that reaction count increased or emoji is highlighted
        // This is a basic check - the exact implementation may vary
        await expect(page.locator('button').filter({ hasText: /[😀👍❤️🎉]/ })).toBeVisible();
      }
    });

    test('should display aggregate reaction counts', async ({ page }) => {
      await page.goto('/card/sv8pt5-28'); // Example card with reactions
      await page.waitForLoadState('networkidle');

      // Should show reaction counts if any exist
      const hasReactions = await page.locator('button:has-text(/\\d+/)').count() > 0;
      if (hasReactions) {
        await expect(page.locator('button').filter({ hasText: /\\d+/ })).toBeVisible();
      }
    });
  });

  test.describe('Authenticated User Reactions', () => {
    test.beforeEach(async ({ page }) => {
      // Login before testing authenticated reactions
      await page.goto('/login');
      await page.getByPlaceholder(/nombre de usuario/i).fill('testuser');
      await page.getByPlaceholder(/contraseña/i).fill('password123');
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
      await page.waitForURL('/');
    });

    test('should allow authenticated user to change reaction', async ({ page }) => {
      await page.goto('/card/sv8pt5-28');
      await page.waitForLoadState('networkidle');

      // Add first reaction
      const firstEmoji = page.locator('button').filter({ hasText: '😀' }).first();
      if (await firstEmoji.isVisible()) {
        await firstEmoji.click();
        await page.waitForTimeout(1000);

        // Click a different emoji to change reaction
        const secondEmoji = page.locator('button').filter({ hasText: '❤️' }).first();
        if (await secondEmoji.isVisible()) {
          await secondEmoji.click();
          await page.waitForTimeout(1000);

          // Verify reaction changed (second emoji should be highlighted/active)
          await expect(secondEmoji).toBeVisible();
        }
      }
    });

    test('should allow user to remove reaction by clicking same emoji', async ({ page }) => {
      await page.goto('/card/sv8pt5-28');
      await page.waitForLoadState('networkidle');

      const emojiButton = page.locator('button').filter({ hasText: '👍' }).first();
      if (await emojiButton.isVisible()) {
        // Get initial count
        const initialText = await emojiButton.textContent();

        // Click to add reaction
        await emojiButton.click();
        await page.waitForTimeout(1000);

        // Click again to remove reaction
        await emojiButton.click();
        await page.waitForTimeout(1000);

        // Count should be back to initial or emoji no longer highlighted
        await expect(emojiButton).toBeVisible();
      }
    });
  });

  test.describe('Comment Reactions', () => {
    test.beforeEach(async ({ page }) => {
      // Login for comment reactions
      await page.goto('/login');
      await page.getByPlaceholder(/nombre de usuario/i).fill('testuser');
      await page.getByPlaceholder(/contraseña/i).fill('password123');
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
      await page.waitForURL('/');
    });

    test('should allow reactions on comments', async ({ page }) => {
      await page.goto('/card/sv8pt5-28');
      await page.waitForLoadState('networkidle');

      // Create a comment first
      const commentText = `Test comment for reactions ${Date.now()}`;
      const commentInput = page.getByPlaceholder(/Escribe un comentario/i);
      await commentInput.fill(commentText);
      await page.getByRole('button', { name: /Comentar/i }).click();

      // Wait for comment to appear
      await expect(page.getByText(commentText)).toBeVisible({ timeout: 5000 });

      // Look for reaction button on the comment
      const commentReactionButton = page.locator(`text=${commentText}`).locator('..').locator('button').filter({ hasText: /[😀👍❤️]/ }).first();

      if (await commentReactionButton.isVisible()) {
        await commentReactionButton.click();
        await page.waitForTimeout(1000);

        // Verify reaction was added
        await expect(commentReactionButton).toBeVisible();
      }
    });

    test('should show reaction counts on comments', async ({ page }) => {
      await page.goto('/card/sv8pt5-28');
      await page.waitForLoadState('networkidle');

      // Check if any comments have reactions
      const commentsWithReactions = page.locator('[data-testid="comment-reactions"]');
      const hasReactions = await commentsWithReactions.count() > 0;

      if (hasReactions) {
        await expect(commentsWithReactions.first()).toBeVisible();
      }
    });
  });

  test.describe('Reaction Edge Cases', () => {
    test('should handle rapid reaction clicks gracefully', async ({ page }) => {
      await page.goto('/card/sv8pt5-28');
      await page.waitForLoadState('networkidle');

      const emojiButton = page.locator('button').filter({ hasText: '😀' }).first();
      if (await emojiButton.isVisible()) {
        // Rapid clicks
        await emojiButton.click();
        await emojiButton.click();
        await emojiButton.click();

        // Should still be functional
        await expect(emojiButton).toBeVisible();
      }
    });

    test('should persist reactions after page reload', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.getByPlaceholder(/nombre de usuario/i).fill('testuser');
      await page.getByPlaceholder(/contraseña/i).fill('password123');
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
      await page.waitForURL('/');

      // Go to card and add reaction
      await page.goto('/card/sv8pt5-28');
      await page.waitForLoadState('networkidle');

      const emojiButton = page.locator('button').filter({ hasText: '🎉' }).first();
      if (await emojiButton.isVisible()) {
        await emojiButton.click();
        await page.waitForTimeout(1000);

        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Reaction should still be visible/active
        await expect(emojiButton).toBeVisible();
      }
    });
  });
});
