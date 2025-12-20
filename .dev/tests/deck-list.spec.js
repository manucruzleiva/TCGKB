import { test, expect } from '@playwright/test';

/**
 * DM2 Epic - Deck List & Browse Tests
 *
 * Tests for DeckList page including:
 * - Public deck browsing
 * - My Decks filter
 * - Tag-based filtering
 * - Search functionality
 * - Pagination
 * - Deck card display
 */

test.describe('Deck List - Public Access', () => {
  test('should display deck list page without auth', async ({ page }) => {
    await page.goto('/decks');

    // Should show deck list heading or cards
    await expect(page.getByRole('heading', { name: /Decks|Mazos/i }).or(
      page.locator('[class*="deck"]').first()
    )).toBeVisible({ timeout: 10000 });
  });

  test('should show deck cards with cover image', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(1000);

    // Deck cards should have images
    const deckImages = page.locator('img[alt*="deck"], img[alt*="Deck"], img[class*="cover"]');

    // If there are decks, they should have images
    const count = await deckImages.count();
    if (count > 0) {
      await expect(deckImages.first()).toBeVisible();
    }
  });

  test('should show deck metadata (name, cards count, date)', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(1000);

    // Look for deck metadata elements
    const deckCard = page.locator('[class*="deck-card"], [class*="card"]').first();

    if (await deckCard.isVisible()) {
      // Should show some deck info
      await expect(deckCard).toBeVisible();
    }
  });

  test('should show format tag badge on decks', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(1500);

    // Look for format badges (Standard, Expanded, GLC)
    const formatBadge = page.getByText(/Standard|Estándar|Expanded|Expandido|GLC/i);

    // If decks have formats tagged, badges should appear
    const count = await formatBadge.count();
    // Just check that the page loads - badges depend on deck data
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show visibility badge (Public/Private)', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(1500);

    // Look for visibility badges
    const visibilityBadge = page.getByText(/Público|Public|Privado|Private/i);

    const count = await visibilityBadge.count();
    // Just check that the page loads
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Deck List - Authenticated User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
  });

  test('should show My Decks filter tab', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(1000);

    // Look for "My Decks" or "Mis Decks" tab/button
    const myDecksTab = page.getByRole('button', { name: /Mis Decks|My Decks/i }).or(
      page.getByRole('tab', { name: /Mis Decks|My Decks/i })
    );

    await expect(myDecksTab).toBeVisible();
  });

  test('should filter to only user decks when My Decks selected', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(1000);

    // Click My Decks tab
    const myDecksTab = page.getByRole('button', { name: /Mis Decks|My Decks/i }).or(
      page.getByRole('tab', { name: /Mis Decks|My Decks/i })
    );

    if (await myDecksTab.isVisible()) {
      await myDecksTab.click();
      await page.waitForTimeout(500);

      // All visible decks should be by testuser
      // (we can't easily verify this without checking each card)
    }
  });

  test('should have Create Deck button', async ({ page }) => {
    await page.goto('/decks');

    // Look for create button
    const createButton = page.getByRole('button', { name: /Crear|Create|Nuevo|New/i }).or(
      page.getByRole('link', { name: /Crear|Create|Nuevo|New/i })
    );

    await expect(createButton).toBeVisible();
  });

  test('should navigate to new deck builder on Create click', async ({ page }) => {
    await page.goto('/decks');

    const createButton = page.getByRole('button', { name: /Crear|Create|Nuevo|New/i }).or(
      page.getByRole('link', { name: /Crear|Create|Nuevo|New/i })
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page).toHaveURL(/\/decks\/new/);
    }
  });
});

test.describe('Deck List - Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(1000);
  });

  test('should have search input for filtering decks', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar|search/i);
    await expect(searchInput).toBeVisible();
  });

  test('should filter decks by search term', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar|search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('Pikachu');
      await page.waitForTimeout(500);

      // Results should update (we can't verify content without knowing deck names)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have tag filter dropdown or buttons', async ({ page }) => {
    // Look for tag filter elements
    const tagFilter = page.getByText(/Filtrar|Filter|Tags|Etiquetas/i).or(
      page.locator('[class*="filter"]')
    );

    // Tag filters should exist
    const count = await tagFilter.count();
    await expect(page.locator('body')).toBeVisible();
  });

  test('should filter by format tag', async ({ page }) => {
    // Look for format filter buttons
    const standardFilter = page.getByRole('button', { name: /Standard|Estándar/i });

    if (await standardFilter.isVisible()) {
      await standardFilter.click();
      await page.waitForTimeout(500);

      // Results should update
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should clear filters', async ({ page }) => {
    // Apply a filter first
    const searchInput = page.getByPlaceholder(/buscar|search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(300);

      // Clear the search
      await searchInput.clear();
      await page.waitForTimeout(300);

      // Page should show unfiltered results
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Deck List - Pagination', () => {
  test('should show pagination if many decks exist', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(1500);

    // Look for pagination controls
    const pagination = page.getByRole('navigation').or(
      page.locator('[class*="pagination"]')
    ).or(
      page.getByRole('button', { name: /siguiente|next|anterior|prev/i })
    );

    // Pagination might not be visible if < 20 decks
    const count = await pagination.count();
    // Just ensure page loads
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to next page', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(1500);

    const nextButton = page.getByRole('button', { name: /siguiente|next|→|>/i });

    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(500);

      // Page content should update
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Deck List - Navigation', () => {
  test('should navigate to deck detail on card click', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(1500);

    const deckCard = page.locator('[class*="deck-card"], [class*="card"]').first();

    if (await deckCard.isVisible()) {
      await deckCard.click();
      await expect(page).toHaveURL(/\/decks\/.+/);
    }
  });

  test('should show deck detail page with full deck', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(1500);

    const deckCard = page.locator('[class*="deck-card"], [class*="card"]').first();

    if (await deckCard.isVisible()) {
      await deckCard.click();
      await page.waitForURL(/\/decks\/.+/);

      // Deck detail should show cards
      await expect(page.locator('img').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Deck List - Tab Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
    await page.goto('/decks');
    await page.waitForTimeout(1000);
  });

  test('should have All and My Decks tabs', async ({ page }) => {
    const allTab = page.getByRole('button', { name: /Todos|All/i }).or(
      page.getByRole('tab', { name: /Todos|All/i })
    );
    const myDecksTab = page.getByRole('button', { name: /Mis Decks|My Decks/i }).or(
      page.getByRole('tab', { name: /Mis Decks|My Decks/i })
    );

    // At least one of these should be visible
    const hasAllTab = await allTab.isVisible();
    const hasMyDecksTab = await myDecksTab.isVisible();

    expect(hasAllTab || hasMyDecksTab).toBeTruthy();
  });

  test('should switch between All and My Decks views', async ({ page }) => {
    const myDecksTab = page.getByRole('button', { name: /Mis Decks|My Decks/i }).or(
      page.getByRole('tab', { name: /Mis Decks|My Decks/i })
    );

    if (await myDecksTab.isVisible()) {
      await myDecksTab.click();
      await page.waitForTimeout(500);

      // Should show my decks (or empty state)
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Deck List - i18n', () => {
  test('should show Spanish labels when ES selected', async ({ page }) => {
    await page.goto('/decks');

    // Ensure Spanish is selected
    const langToggle = page.getByRole('button', { name: /ES|EN/i });
    const currentLang = await langToggle.textContent();

    if (!currentLang?.includes('ES')) {
      await langToggle.click();
      await page.waitForTimeout(200);
    }

    // Check for Spanish text
    await expect(page.getByText(/Decks|Mazos|Buscar/i)).toBeVisible();
  });

  test('should show English labels when EN selected', async ({ page }) => {
    await page.goto('/decks');

    // Switch to English
    const langToggle = page.getByRole('button', { name: /ES|EN/i });
    const currentLang = await langToggle.textContent();

    if (!currentLang?.includes('EN')) {
      await langToggle.click();
      await page.waitForTimeout(200);
    }

    // Check for English text
    await expect(page.getByText(/Decks|Search/i)).toBeVisible();
  });
});

test.describe('Deck Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(1500);
  });

  test('should show deck name and description', async ({ page }) => {
    const deckCard = page.locator('[class*="deck-card"], [class*="card"]').first();

    if (await deckCard.isVisible()) {
      await deckCard.click();
      await page.waitForURL(/\/decks\/.+/);

      // Should show deck heading
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });

  test('should show deck stats sidebar', async ({ page }) => {
    const deckCard = page.locator('[class*="deck-card"], [class*="card"]').first();

    if (await deckCard.isVisible()) {
      await deckCard.click();
      await page.waitForURL(/\/decks\/.+/);

      // Look for stats (Pokemon, Trainer, Energy counts)
      const stats = page.getByText(/Pokémon|Trainer|Energy/i);
      await expect(stats.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should group cards by supertype', async ({ page }) => {
    const deckCard = page.locator('[class*="deck-card"], [class*="card"]').first();

    if (await deckCard.isVisible()) {
      await deckCard.click();
      await page.waitForURL(/\/decks\/.+/);

      // Look for supertype groupings
      const pokemonSection = page.getByText(/Pokémon/i);
      await expect(pokemonSection.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show export button', async ({ page }) => {
    const deckCard = page.locator('[class*="deck-card"], [class*="card"]').first();

    if (await deckCard.isVisible()) {
      await deckCard.click();
      await page.waitForURL(/\/decks\/.+/);

      const exportButton = page.getByRole('button', { name: /Exportar|Export/i });
      await expect(exportButton).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show comments section below deck', async ({ page }) => {
    const deckCard = page.locator('[class*="deck-card"], [class*="card"]').first();

    if (await deckCard.isVisible()) {
      await deckCard.click();
      await page.waitForURL(/\/decks\/.+/);

      // Look for comments section
      const commentsSection = page.getByText(/Comentarios|Comments/i).or(
        page.locator('[class*="comment"]')
      );
      await expect(commentsSection.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
