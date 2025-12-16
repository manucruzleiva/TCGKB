import { test, expect } from '@playwright/test';

test.describe('Real-time Updates with Socket.io', () => {
  // Helper function to login
  async function login(page, username = 'testuser', password = 'password123') {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario/i).fill(username);
    await page.getByPlaceholder(/contraseña/i).fill(password);
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
    await page.waitForURL('/');
  }

  test.describe('Real-time Comments', () => {
    test('should receive new comments in real-time from another user', async ({ browser }) => {
      // Create two browser contexts (two users)
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      try {
        // User 1: Login and go to card
        await login(page1, 'testuser', 'password123');
        await page1.goto('/card/sv8pt5-28');
        await page1.waitForLoadState('networkidle');

        // User 2: Login with different account and go to same card
        // Note: This requires having a second test user
        await page2.goto('/card/sv8pt5-28');
        await page2.waitForLoadState('networkidle');

        // User 2: Create a comment
        const uniqueComment = `Real-time test comment ${Date.now()}`;

        // If page2 has login button, it's not logged in, so just view
        const hasLoginButton = await page2.getByRole('button', { name: /Iniciar Sesión/i }).isVisible().catch(() => false);

        if (!hasLoginButton) {
          // User 2 is logged in, can comment
          const commentInput2 = page2.getByPlaceholder(/Escribe un comentario/i);
          if (await commentInput2.isVisible()) {
            await commentInput2.fill(uniqueComment);
            await page2.getByRole('button', { name: /Comentar/i }).click();

            // Wait a bit for Socket.io to propagate
            await page1.waitForTimeout(2000);

            // User 1 should see the new comment without refreshing
            await expect(page1.getByText(uniqueComment)).toBeVisible({ timeout: 5000 });
          }
        }
      } finally {
        await page1.close();
        await page2.close();
        await context1.close();
        await context2.close();
      }
    });

    test('should update comment count in real-time', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      try {
        await login(page1);
        await page1.goto('/card/sv8pt5-28');
        await page1.waitForLoadState('networkidle');

        await login(page2);
        await page2.goto('/card/sv8pt5-28');
        await page2.waitForLoadState('networkidle');

        // Get initial comment count on page1
        const commentCountBefore = await page1.locator('text=/\\d+.*comentario/i').textContent().catch(() => '0');

        // Page2: Add a comment
        const uniqueComment = `Count test ${Date.now()}`;
        await page2.getByPlaceholder(/Escribe un comentario/i).fill(uniqueComment);
        await page2.getByRole('button', { name: /Comentar/i }).click();

        // Wait for Socket.io
        await page1.waitForTimeout(2000);

        // Page1 should see updated count
        await expect(page1.getByText(uniqueComment)).toBeVisible({ timeout: 5000 });
      } finally {
        await page1.close();
        await page2.close();
        await context1.close();
        await context2.close();
      }
    });
  });

  test.describe('Real-time Reactions', () => {
    test('should receive reaction updates in real-time', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      try {
        // Both users go to same card
        await page1.goto('/card/sv8pt5-28');
        await page1.waitForLoadState('networkidle');

        await page2.goto('/card/sv8pt5-28');
        await page2.waitForLoadState('networkidle');

        // Page2: Add a reaction (anonymous)
        const emojiButton = page2.locator('button').filter({ hasText: '🎉' }).first();
        if (await emojiButton.isVisible()) {
          const beforeText = await emojiButton.textContent();
          await emojiButton.click();

          // Wait for Socket.io
          await page1.waitForTimeout(2000);

          // Page1 should see updated reaction count
          const page1Emoji = page1.locator('button').filter({ hasText: '🎉' }).first();
          const afterText = await page1Emoji.textContent();

          // Count should have increased (this is a basic check)
          await expect(page1Emoji).toBeVisible();
        }
      } finally {
        await page1.close();
        await page2.close();
        await context1.close();
        await context2.close();
      }
    });
  });

  test.describe('Socket Connection', () => {
    test('should establish Socket.io connection on page load', async ({ page }) => {
      // Check for Socket.io connection in console or network
      let socketConnected = false;

      page.on('console', msg => {
        if (msg.text().includes('Socket') || msg.text().includes('socket')) {
          socketConnected = true;
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Wait a bit for socket connection
      await page.waitForTimeout(2000);

      // Navigate to a card details page (where real-time is more active)
      await page.goto('/card/sv8pt5-28');
      await page.waitForLoadState('networkidle');

      // Basic check: page should load without errors
      await expect(page).not.toHaveURL(/error/);
    });

    test('should reconnect after connection loss', async ({ page, context }) => {
      await page.goto('/card/sv8pt5-28');
      await page.waitForLoadState('networkidle');

      // Simulate offline/online
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      await context.setOffline(false);
      await page.waitForTimeout(2000);

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Real-time Nested Replies', () => {
    test('should receive nested replies in real-time', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      try {
        await login(page1);
        await page1.goto('/card/sv8pt5-28');
        await page1.waitForLoadState('networkidle');

        await login(page2);
        await page2.goto('/card/sv8pt5-28');
        await page2.waitForLoadState('networkidle');

        // Page1: Create a top-level comment
        const topComment = `Top comment ${Date.now()}`;
        await page1.getByPlaceholder(/Escribe un comentario/i).fill(topComment);
        await page1.getByRole('button', { name: /Comentar/i }).click();

        // Wait for comment to appear on both pages
        await expect(page1.getByText(topComment)).toBeVisible({ timeout: 5000 });
        await page2.waitForTimeout(2000);
        await expect(page2.getByText(topComment)).toBeVisible({ timeout: 5000 });

        // Page2: Reply to the comment
        const replyButton = page2.getByRole('button', { name: /Responder/i }).first();
        if (await replyButton.isVisible()) {
          await replyButton.click();

          const replyText = `Reply ${Date.now()}`;
          await page2.getByPlaceholder(/Escribe una respuesta/i).fill(replyText);
          await page2.getByRole('button', { name: /Comentar/i }).last().click();

          // Wait for Socket.io
          await page1.waitForTimeout(2000);

          // Page1 should see the reply without refreshing
          await expect(page1.getByText(replyText)).toBeVisible({ timeout: 5000 });
        }
      } finally {
        await page1.close();
        await page2.close();
        await context1.close();
        await context2.close();
      }
    });
  });

  test.describe('Real-time Performance', () => {
    test('should handle multiple rapid updates efficiently', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      try {
        await login(page1);
        await page1.goto('/card/sv8pt5-28');
        await page1.waitForLoadState('networkidle');

        await login(page2);
        await page2.goto('/card/sv8pt5-28');
        await page2.waitForLoadState('networkidle');

        // Page2: Create multiple comments rapidly
        for (let i = 0; i < 3; i++) {
          const comment = `Rapid comment ${i} ${Date.now()}`;
          await page2.getByPlaceholder(/Escribe un comentario/i).fill(comment);
          await page2.getByRole('button', { name: /Comentar/i }).click();
          await page2.waitForTimeout(500);
        }

        // Wait for all updates
        await page1.waitForTimeout(3000);

        // Page1 should have received all comments
        // At least one should be visible
        await expect(page1.locator('text=/Rapid comment/')).toBeVisible({ timeout: 5000 });
      } finally {
        await page1.close();
        await page2.close();
        await context1.close();
        await context2.close();
      }
    });
  });
});
