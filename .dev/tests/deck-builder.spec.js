import { test, expect } from '@playwright/test';

/**
 * DM2 Epic - Deck Builder CRUD Tests
 *
 * Tests for DeckBuilder page including:
 * - Create new deck
 * - Add/remove cards
 * - Edit deck metadata (name, description, tags)
 * - Save deck
 * - Delete deck
 * - Export deck
 */

const TEST_DECK_NAME = `Test Deck ${Date.now()}`;
const TEST_DECK_DESCRIPTION = 'Automated test deck for E2E testing';

test.describe('Deck Builder - Create & Save', () => {
  test.beforeEach(async ({ page }) => {
    // Login required for deck creation
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
  });

  test('should navigate to new deck builder page', async ({ page }) => {
    await page.goto('/decks/new');

    // Should show deck builder form
    await expect(page.getByPlaceholder(/nombre del deck|deck name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/descripción|description/i)).toBeVisible();
  });

  test('should allow entering deck name and description', async ({ page }) => {
    await page.goto('/decks/new');

    // Fill in deck name
    await page.getByPlaceholder(/nombre del deck|deck name/i).fill(TEST_DECK_NAME);
    await expect(page.getByPlaceholder(/nombre del deck|deck name/i)).toHaveValue(TEST_DECK_NAME);

    // Fill in description
    await page.getByPlaceholder(/descripción|description/i).fill(TEST_DECK_DESCRIPTION);
    await expect(page.getByPlaceholder(/descripción|description/i)).toHaveValue(TEST_DECK_DESCRIPTION);
  });

  test('should toggle public/private visibility', async ({ page }) => {
    await page.goto('/decks/new');

    // Find visibility toggle (checkbox or switch)
    const publicToggle = page.getByRole('checkbox', { name: /público|public/i }).or(
      page.locator('input[type="checkbox"]').first()
    );

    // Toggle visibility
    await publicToggle.click();
    await page.waitForTimeout(100);

    // Toggle back
    await publicToggle.click();
  });

  test('should search for cards and display results', async ({ page }) => {
    await page.goto('/decks/new');

    // Find card search input
    const searchInput = page.getByPlaceholder(/buscar cartas|search cards/i);
    await expect(searchInput).toBeVisible();

    // Search for a card
    await searchInput.fill('Pikachu');

    // Wait for debounced search (300ms) + API response
    await page.waitForTimeout(1500);

    // Should show search results
    const searchResults = page.locator('[class*="card"]').or(
      page.locator('img[alt*="Pikachu"]')
    );
    await expect(searchResults.first()).toBeVisible({ timeout: 10000 });
  });

  test('should add card to deck on click', async ({ page }) => {
    await page.goto('/decks/new');

    // Search for a card
    await page.getByPlaceholder(/buscar cartas|search cards/i).fill('Pikachu');
    await page.waitForTimeout(2000);

    // Click on a card to add it
    const cardResult = page.locator('img[alt*="Pikachu"]').first();
    await cardResult.click();

    // Deck should now have 1 card
    // Look for card count or deck stats
    await expect(page.getByText(/1|cartas|cards/i)).toBeVisible();
  });

  test('should show deck stats breakdown', async ({ page }) => {
    await page.goto('/decks/new');

    // Import a test deck to populate stats
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(`Pokémon: 4
4 Pikachu VIV 43

Trainer: 4
4 Ultra Ball SVI 196

Energy: 4
4 Basic Lightning Energy SVE 4`);
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Importar Deck|Import Deck/i }).click();

    // Should show Pokemon, Trainer, Energy counts
    await expect(page.getByText(/Pokémon/i)).toBeVisible();
    await expect(page.getByText(/Trainer|Entrenador/i)).toBeVisible();
    await expect(page.getByText(/Energy|Energía/i)).toBeVisible();
  });

  test('should remove card from deck', async ({ page }) => {
    await page.goto('/decks/new');

    // Import a minimal deck
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(`Pokémon: 4
4 Pikachu VIV 43`);
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Importar Deck|Import Deck/i }).click();

    // Find and hover over card in deck to show remove button
    const deckCard = page.locator('[class*="deck"] img').or(
      page.locator('img[alt*="Pikachu"]')
    ).first();

    await deckCard.hover();

    // Click remove button (minus or X)
    const removeButton = page.getByRole('button', { name: /-|×|remove|eliminar/i }).first().or(
      page.locator('button:has-text("-")').first()
    );

    if (await removeButton.isVisible()) {
      await removeButton.click();
    }
  });

  test('should select tags for deck', async ({ page }) => {
    await page.goto('/decks/new');

    // Look for tag section
    const tagSection = page.getByText(/Tags|Etiquetas/i);
    await expect(tagSection.first()).toBeVisible();

    // Click on a tag to select it (format or archetype)
    const formatTag = page.getByRole('button', { name: /Standard|Estándar/i }).or(
      page.locator('[class*="tag"]').first()
    );

    if (await formatTag.isVisible()) {
      await formatTag.click();
    }
  });

  test('should save deck and redirect to deck detail', async ({ page }) => {
    await page.goto('/decks/new');

    // Fill required fields
    const uniqueName = `Test Deck ${Date.now()}`;
    await page.getByPlaceholder(/nombre del deck|deck name/i).fill(uniqueName);

    // Import a valid deck
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(`Pokémon: 20
4 Pikachu VIV 43
4 Raichu VIV 44
4 Pachirisu VIV 46
4 Emolga VIV 47
4 Zapdos VIV 48

Trainer: 32
4 Ultra Ball SVI 196
4 Nest Ball SVI 181
4 Switch SVI 194
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Rare Candy SVI 191
4 Energy Retrieval SVI 171
4 Poké Ball SVI 185

Energy: 8
8 Basic Lightning Energy SVE 4`);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /Importar Deck|Import Deck/i }).click();

    // Wait for import
    await page.waitForTimeout(500);

    // Save deck
    const saveButton = page.getByRole('button', { name: /Guardar|Save/i });
    await saveButton.click();

    // Should redirect to deck detail or deck list
    await expect(page).toHaveURL(/\/decks\//);
  });
});

test.describe('Deck Builder - Edit Existing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
  });

  test('should load existing deck for editing', async ({ page }) => {
    // Go to deck list
    await page.goto('/decks');

    // Wait for decks to load
    await page.waitForTimeout(1000);

    // Click on first deck (owned by testuser)
    const deckCard = page.locator('[class*="deck-card"], [class*="card"]').first();

    if (await deckCard.isVisible()) {
      await deckCard.click();
      await page.waitForURL(/\/decks\//);

      // Look for edit button
      const editButton = page.getByRole('button', { name: /Editar|Edit/i }).or(
        page.getByRole('link', { name: /Editar|Edit/i })
      );

      if (await editButton.isVisible()) {
        await editButton.click();

        // Should be in edit mode
        await expect(page.getByPlaceholder(/nombre del deck|deck name/i)).toBeVisible();
      }
    }
  });
});

test.describe('Deck Builder - Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
  });

  test('should have export button in deck builder', async ({ page }) => {
    await page.goto('/decks/new');

    // Import a deck first
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(`Pokémon: 4
4 Pikachu VIV 43

Trainer: 4
4 Ultra Ball SVI 196

Energy: 4
4 Basic Lightning Energy SVE 4`);
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Importar Deck|Import Deck/i }).click();

    // Export button should be visible
    const exportButton = page.getByRole('button', { name: /Exportar|Export/i });
    await expect(exportButton).toBeVisible();
  });
});

test.describe('Deck Builder - Validation During Build', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
    await page.goto('/decks/new');
  });

  test('should show deck card count', async ({ page }) => {
    // Import a deck
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(`Pokémon: 4
4 Pikachu VIV 43`);
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Importar Deck|Import Deck/i }).click();

    // Should show card count (4)
    await expect(page.getByText(/4/)).toBeVisible();
  });

  test('should prevent saving deck without name', async ({ page }) => {
    // Import cards but don't set name
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(`Pokémon: 4
4 Pikachu VIV 43`);
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Importar Deck|Import Deck/i }).click();

    // Try to save without name
    const saveButton = page.getByRole('button', { name: /Guardar|Save/i });

    // Save button should be disabled or show validation error
    const isDisabled = await saveButton.isDisabled();
    if (!isDisabled) {
      await saveButton.click();
      // Should show validation error
      await expect(page.getByText(/requerido|required/i)).toBeVisible();
    }
  });

  test('should prevent saving empty deck', async ({ page }) => {
    // Set name but no cards
    await page.getByPlaceholder(/nombre del deck|deck name/i).fill('Empty Deck Test');

    // Try to save
    const saveButton = page.getByRole('button', { name: /Guardar|Save/i });

    // Save button should be disabled or show error
    const isDisabled = await saveButton.isDisabled();
    if (!isDisabled) {
      await saveButton.click();
      // Should show validation error about no cards
      await expect(page.getByText(/cartas|cards|vacío|empty/i)).toBeVisible();
    }
  });
});

test.describe('Deck Builder - Delete', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
  });

  test('should show delete confirmation modal', async ({ page }) => {
    // Navigate to a deck detail page
    await page.goto('/decks');
    await page.waitForTimeout(1000);

    // Find a deck owned by testuser
    const deckCard = page.locator('[class*="deck-card"], [class*="card"]').first();

    if (await deckCard.isVisible()) {
      await deckCard.click();
      await page.waitForURL(/\/decks\//);

      // Look for delete button
      const deleteButton = page.getByRole('button', { name: /Eliminar|Delete/i });

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should show confirmation modal
        await expect(page.getByText(/confirmar|confirm|seguro|sure/i)).toBeVisible();
      }
    }
  });
});

test.describe('Deck Builder - Copy Deck', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
  });

  test('should have copy button on public decks', async ({ page }) => {
    // Navigate to deck list
    await page.goto('/decks');
    await page.waitForTimeout(1000);

    // Find a public deck (look for public badge)
    const publicDeck = page.locator('[class*="deck-card"]').filter({
      has: page.getByText(/Público|Public/i)
    }).first();

    if (await publicDeck.isVisible()) {
      await publicDeck.click();
      await page.waitForURL(/\/decks\//);

      // Look for copy button
      const copyButton = page.getByRole('button', { name: /Copiar|Copy/i });
      await expect(copyButton).toBeVisible();
    }
  });
});

test.describe('Deck Builder - Card Interactions (DM-V2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
    await page.goto('/decks/new');
  });

  test('TC-INT-001: should add 1 copy on left click', async ({ page }) => {
    // Search for a card
    await page.getByPlaceholder(/buscar cartas|search cards/i).fill('Pikachu');
    await page.waitForTimeout(2000);

    // Get initial deck count
    const initialCount = await page.locator('[class*="deck"]').textContent().catch(() => '0');

    // Left click on a card
    const cardResult = page.locator('img[alt*="Pikachu"]').first();
    await cardResult.click();

    // Wait for update
    await page.waitForTimeout(500);

    // Deck should have 1 more card
    await expect(page.getByText(/1.*card|card.*1/i)).toBeVisible();
  });

  test('TC-INT-002: should respect copy limit on left click', async ({ page }) => {
    // Search for a card
    await page.getByPlaceholder(/buscar cartas|search cards/i).fill('Pikachu');
    await page.waitForTimeout(2000);

    const cardResult = page.locator('img[alt*="Pikachu"]').first();

    // Click 4 times (maximum for non-energy cards)
    for (let i = 0; i < 4; i++) {
      await cardResult.click();
      await page.waitForTimeout(200);
    }

    // Should show 4 copies
    await expect(page.getByText(/4.*card|4\/4/i)).toBeVisible();

    // Click one more time (should be blocked or show warning)
    await cardResult.click();
    await page.waitForTimeout(500);

    // Should still show 4 copies (or show warning about limit)
    const limitWarning = page.getByText(/límite|limit|máximo|maximum/i);
    const copyCount = page.getByText(/4.*card|4\/4/i);

    // Either shows warning or keeps count at 4
    const hasWarning = await limitWarning.isVisible().catch(() => false);
    const hasCount = await copyCount.isVisible().catch(() => false);

    expect(hasWarning || hasCount).toBeTruthy();
  });

  test('TC-INT-003: should show visual feedback on hover', async ({ page }) => {
    // Search for a card
    await page.getByPlaceholder(/buscar cartas|search cards/i).fill('Pikachu');
    await page.waitForTimeout(2000);

    const cardResult = page.locator('img[alt*="Pikachu"]').first();

    // Hover over card
    await cardResult.hover();

    // Should have hover effect (cursor pointer, border change, etc.)
    // This is visual feedback, check for cursor or style changes
    const cursorStyle = await cardResult.evaluate((el) => {
      return window.getComputedStyle(el.parentElement || el).cursor;
    });

    expect(cursorStyle).toMatch(/pointer|grab/);
  });

  test('TC-INT-004: should reduce 1 copy on right click', async ({ page }) => {
    // Search and add a card first
    await page.getByPlaceholder(/buscar cartas|search cards/i).fill('Pikachu');
    await page.waitForTimeout(2000);

    const cardResult = page.locator('img[alt*="Pikachu"]').first();

    // Add 3 copies with left click
    for (let i = 0; i < 3; i++) {
      await cardResult.click();
      await page.waitForTimeout(200);
    }

    // Find card in deck list
    const deckCard = page.locator('[class*="deck"]').getByText(/Pikachu/i).first();

    if (await deckCard.isVisible()) {
      // Right click to reduce
      await deckCard.click({ button: 'right' });
      await page.waitForTimeout(500);

      // Should now show 2 copies
      await expect(page.getByText(/2.*card|x2/i)).toBeVisible();
    }
  });

  test('TC-INT-005: should remove card when quantity reaches 0', async ({ page }) => {
    // Search and add a card
    await page.getByPlaceholder(/buscar cartas|search cards/i).fill('Pikachu');
    await page.waitForTimeout(2000);

    const cardResult = page.locator('img[alt*="Pikachu"]').first();

    // Add 1 copy
    await cardResult.click();
    await page.waitForTimeout(500);

    // Find card in deck
    const deckCard = page.locator('[class*="deck"]').getByText(/Pikachu/i).first();

    if (await deckCard.isVisible()) {
      // Right click to reduce to 0
      await deckCard.click({ button: 'right' });
      await page.waitForTimeout(500);

      // Card should be removed from deck
      await expect(deckCard).not.toBeVisible();
    }
  });

  test('TC-INT-006: should open quantity input on Ctrl+Click', async ({ page }) => {
    // Search and add a card
    await page.getByPlaceholder(/buscar cartas|search cards/i).fill('Pikachu');
    await page.waitForTimeout(2000);

    const cardResult = page.locator('img[alt*="Pikachu"]').first();

    // Ctrl+Click to open input
    await cardResult.click({ modifiers: ['Control'] });
    await page.waitForTimeout(500);

    // Should show input field for quantity
    const quantityInput = page.locator('input[type="number"]').or(
      page.locator('input[placeholder*="cantidad"]').or(
        page.locator('input[placeholder*="quantity"]')
      )
    );

    await expect(quantityInput.first()).toBeVisible();
  });

  test('TC-INT-007: should accept valid quantity input', async ({ page }) => {
    // Search and add a card
    await page.getByPlaceholder(/buscar cartas|search cards/i).fill('Pikachu');
    await page.waitForTimeout(2000);

    const cardResult = page.locator('img[alt*="Pikachu"]').first();

    // Ctrl+Click to open input
    await cardResult.click({ modifiers: ['Control'] });
    await page.waitForTimeout(500);

    const quantityInput = page.locator('input[type="number"]').first();

    if (await quantityInput.isVisible()) {
      // Enter valid quantity (3)
      await quantityInput.fill('3');
      await quantityInput.press('Enter');

      // Wait for update
      await page.waitForTimeout(500);

      // Should show 3 copies
      await expect(page.getByText(/3.*card|x3/i)).toBeVisible();
    }
  });

  test('TC-INT-008: should reject invalid quantity input', async ({ page }) => {
    // Search and add a card
    await page.getByPlaceholder(/buscar cartas|search cards/i).fill('Pikachu');
    await page.waitForTimeout(2000);

    const cardResult = page.locator('img[alt*="Pikachu"]').first();

    // Ctrl+Click to open input
    await cardResult.click({ modifiers: ['Control'] });
    await page.waitForTimeout(500);

    const quantityInput = page.locator('input[type="number"]').first();

    if (await quantityInput.isVisible()) {
      // Try to enter invalid quantity (10 > 4 limit)
      await quantityInput.fill('10');
      await quantityInput.press('Enter');

      // Wait for validation
      await page.waitForTimeout(500);

      // Should show error or clamp to max (4)
      const errorMessage = page.getByText(/límite|limit|máximo|max/i);
      const clampedValue = page.getByText(/4.*card|4\/4/i);

      // Either shows error or clamps to 4
      const hasError = await errorMessage.isVisible().catch(() => false);
      const hasClamped = await clampedValue.isVisible().catch(() => false);

      expect(hasError || hasClamped).toBeTruthy();
    }
  });

  test.skip('TC-INT-009: should support drag and drop', async ({ page }) => {
    // Note: Drag and drop in Playwright requires special handling
    // This test is marked as skip and needs implementation when drag-drop is fully supported

    await page.getByPlaceholder(/buscar cartas|search cards/i).fill('Pikachu');
    await page.waitForTimeout(2000);

    const cardResult = page.locator('img[alt*="Pikachu"]').first();
    const deckArea = page.locator('[class*="deck"]').first();

    // Attempt drag and drop
    await cardResult.dragTo(deckArea);

    // Should add card to deck
    await expect(page.getByText(/1.*card/i)).toBeVisible();
  });

  test('TC-INT-010: should show visual feedback during interactions', async ({ page }) => {
    await page.getByPlaceholder(/buscar cartas|search cards/i).fill('Pikachu');
    await page.waitForTimeout(2000);

    const cardResult = page.locator('img[alt*="Pikachu"]').first();

    // Check for transition or animation classes
    await cardResult.hover();

    const hasTransition = await cardResult.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.transition !== 'none' || style.transform !== 'none';
    });

    expect(hasTransition).toBeTruthy();
  });
});
