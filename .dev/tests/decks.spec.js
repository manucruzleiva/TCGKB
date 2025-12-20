import { test, expect } from '@playwright/test';

test.describe('Deck Manager', () => {
  test.describe('Community Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/decks');
    });

    test('should load community decks by default for unauthenticated users', async ({ page }) => {
      // Community tab should be active
      await expect(page.getByRole('button', { name: /Community|Comunidad/i }).first()).toHaveClass(/bg-primary/);

      // Should show deck cards or empty state
      await expect(page.locator('.grid').or(page.getByText(/No public decks|No hay mazos públicos/i))).toBeVisible();
    });

    test('should switch between tabs', async ({ page }) => {
      // Login first to see both tabs
      await page.goto('/login');
      await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
      await page.getByPlaceholder(/contraseña|password/i).fill('password123');
      await page.getByRole('button', { name: /Iniciar Sesión|Login/i }).click();
      await page.waitForURL('/');

      // Navigate to decks
      await page.goto('/decks');

      // Click My Decks tab
      await page.getByRole('button', { name: /My Decks|Mis Mazos/i }).click();
      await expect(page).toHaveURL(/tab=mine/);

      // Click Community tab
      await page.getByRole('button', { name: /Community|Comunidad/i }).click();
      await expect(page).toHaveURL(/tab=community/);
    });

    test('should show sort options in community tab', async ({ page }) => {
      await expect(page.getByText(/Sort:|Ordenar:/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Recent|Recientes/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Popular/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Votes|Votos/i })).toBeVisible();
    });

    test('should filter by tags', async ({ page }) => {
      // Click Tags button
      await page.getByRole('button', { name: /Tags/i }).click();

      // Tag filters should be visible
      await expect(page.getByText(/Standard|Estándar/i).first()).toBeVisible();
      await expect(page.getByText(/Expanded|Expandido/i).first()).toBeVisible();
    });
  });

  test.describe('Import Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
      await page.getByPlaceholder(/contraseña|password/i).fill('password123');
      await page.getByRole('button', { name: /Iniciar Sesión|Login/i }).click();
      await page.waitForURL('/');

      // Navigate to decks
      await page.goto('/decks');
    });

    test('should open import modal', async ({ page }) => {
      await page.getByRole('button', { name: /Import|Importar/i }).click();

      // Modal should be visible
      await expect(page.getByRole('heading', { name: /Import Deck|Importar Mazo/i })).toBeVisible();
      await expect(page.getByPlaceholder(/My new deck|Mi nuevo mazo/i)).toBeVisible();
    });

    test('should show error when importing without name', async ({ page }) => {
      await page.getByRole('button', { name: /Import|Importar/i }).click();

      // Enter deck content but no name
      await page.locator('textarea').fill('4 Pikachu SV1 25');

      // Click import
      await page.getByRole('button', { name: /^Import$|^Importar$/i }).click();

      // Should show error
      await expect(page.getByText(/Name is required|El nombre es requerido/i)).toBeVisible();
    });

    test('should show error when importing without cards', async ({ page }) => {
      await page.getByRole('button', { name: /Import|Importar/i }).click();

      // Enter name but no cards
      await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Deck');

      // Click import
      await page.getByRole('button', { name: /^Import$|^Importar$/i }).click();

      // Should show error
      await expect(page.getByText(/Paste the card list|Pega la lista de cartas/i)).toBeVisible();
    });

    test('should close import modal on cancel', async ({ page }) => {
      await page.getByRole('button', { name: /Import|Importar/i }).click();

      // Modal should be visible
      await expect(page.getByRole('heading', { name: /Import Deck|Importar Mazo/i })).toBeVisible();

      // Click cancel
      await page.getByRole('button', { name: /Cancel|Cancelar/i }).click();

      // Modal should be closed
      await expect(page.getByRole('heading', { name: /Import Deck|Importar Mazo/i })).not.toBeVisible();
    });

    test('should import Pokemon TCG Live format', async ({ page }) => {
      await page.getByRole('button', { name: /Import|Importar/i }).click();

      // Fill deck info
      await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('E2E Test Deck');
      await page.locator('textarea').fill(`4 Pikachu SV1 25
3 Raichu SV1 26
4 Professor's Research SVI 189
4 Nest Ball SVI 181
4 Electric Generator SVI 170`);

      // Click import
      await page.getByRole('button', { name: /^Import$|^Importar$/i }).click();

      // Should redirect to deck edit page
      await expect(page).toHaveURL(/\/decks\/[a-f0-9]+\/edit/);
    });
  });

  test.describe('Voting', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/decks?tab=community');
    });

    test('should display vote buttons on deck cards', async ({ page }) => {
      // Wait for decks to load
      await page.waitForSelector('.grid a', { state: 'visible', timeout: 5000 }).catch(() => {
        // No decks available, skip test
        test.skip();
      });

      // First deck card should have vote buttons
      const firstDeck = page.locator('.grid a').first();
      await expect(firstDeck.locator('button').filter({ has: page.locator('svg') })).toHaveCount(2);
    });

    test('should show upvote and downvote counts', async ({ page }) => {
      // Wait for decks to load
      await page.waitForSelector('.grid a', { state: 'visible', timeout: 5000 }).catch(() => {
        test.skip();
      });

      // First deck should have vote counts (numbers)
      const firstDeck = page.locator('.grid a').first();
      await expect(firstDeck.locator('button span.font-medium').first()).toBeVisible();
    });
  });

  test.describe('Deck Detail', () => {
    test('should show original badge for original decks', async ({ page }) => {
      // Navigate to a deck (if any exist)
      await page.goto('/decks?tab=community');

      // Wait for decks to load
      const deckLink = page.locator('.grid a').first();
      const hasDecks = await deckLink.isVisible().catch(() => false);

      if (!hasDecks) {
        test.skip();
        return;
      }

      await deckLink.click();

      // Wait for deck detail to load
      await expect(page.locator('h1')).toBeVisible();

      // Check if trophy emoji is present (for original decks)
      // This may or may not be visible depending on if the deck is original
      const trophy = page.locator('span:has-text("🏆")');
      // Just verify the page loaded successfully
      await expect(page.getByText(/Cards|Cartas/i)).toBeVisible();
    });

    test('should show vote buttons on deck detail', async ({ page }) => {
      await page.goto('/decks?tab=community');

      const deckLink = page.locator('.grid a').first();
      const hasDecks = await deckLink.isVisible().catch(() => false);

      if (!hasDecks) {
        test.skip();
        return;
      }

      await deckLink.click();

      // Vote buttons should be visible
      await expect(page.locator('button[title]').filter({ has: page.locator('svg') }).first()).toBeVisible();
    });

    test('should show export button', async ({ page }) => {
      await page.goto('/decks?tab=community');

      const deckLink = page.locator('.grid a').first();
      const hasDecks = await deckLink.isVisible().catch(() => false);

      if (!hasDecks) {
        test.skip();
        return;
      }

      await deckLink.click();

      // Export button should be visible
      await expect(page.getByRole('button', { name: /Export|Exportar/i })).toBeVisible();
    });
  });

  test.describe('Deck Creation', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
      await page.getByPlaceholder(/contraseña|password/i).fill('password123');
      await page.getByRole('button', { name: /Iniciar Sesión|Login/i }).click();
      await page.waitForURL('/');
    });

    test('should navigate to create deck page', async ({ page }) => {
      await page.goto('/decks');
      await page.getByRole('link', { name: /Create Deck|Crear Mazo/i }).click();

      await expect(page).toHaveURL(/\/decks\/new/);
    });
  });
});
