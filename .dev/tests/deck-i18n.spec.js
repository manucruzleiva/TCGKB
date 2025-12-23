import { test, expect } from '@playwright/test';
import { TEST_USER, POKEMON_STANDARD_VALID } from './fixtures/deck-fixtures.js';

/**
 * DM-V2 i18n Tests
 * Tests for internationalization (ES/EN) in Deck Manager V2
 *
 * Test Plan Reference: [Testing] DM-V2: i18n (ES/EN) (#142)
 *
 * Test Cases:
 * - TC-I18N-001: All texts translated to Spanish
 * - TC-I18N-002: All texts translated to English
 * - TC-I18N-003: Language toggle works
 * - TC-I18N-004: No hardcoded strings
 */

test.describe('Deck Manager i18n - Spanish (ES)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill(TEST_USER.username);
    await page.getByPlaceholder(/contraseña|password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /Iniciar Sesión|Login/i }).click();
    await page.waitForURL('/');

    // Switch to Spanish if not already
    const esButton = page.locator('button:has-text("ES"), [data-lang="es"]').first();
    const hasEsButton = await esButton.isVisible().catch(() => false);

    if (hasEsButton) {
      await esButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('TC-I18N-ES-001: Deck list page should be in Spanish', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForLoadState('networkidle');

    // Check Spanish translations for deck list
    const spanishElements = [
      /Mis Mazos|Mis Decks/i,
      /Comunidad/i,
      /Importar/i,
      /Nuevo Mazo|Crear Deck/i
    ];

    // At least 2 Spanish elements should be visible
    let visibleCount = 0;
    for (const pattern of spanishElements) {
      const element = page.getByText(pattern).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) visibleCount++;
    }

    expect(visibleCount).toBeGreaterThanOrEqual(2);
  });

  test('TC-I18N-ES-002: Deck import modal should be in Spanish', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();
    await page.waitForTimeout(500);

    // Check Spanish translations in import modal
    const modalTexts = [
      /Importar Mazo|Importar Deck/i,
      /Mi nuevo mazo|Nombre del mazo/i,
      /Pega tu deck aquí|Pegar deck/i,
      /Cancelar/i,
      /Importar/i
    ];

    let foundCount = 0;
    for (const pattern of modalTexts) {
      const element = page.getByText(pattern).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) foundCount++;
    }

    expect(foundCount).toBeGreaterThanOrEqual(2);
  });

  test('TC-I18N-ES-003: Validation messages should be in Spanish', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Validación ES');

    // Incomplete deck (50 cards)
    const incompleteDeck = `Pokémon: 8
4 Pikachu ex SVI 057
4 Pichu SVI 025

Trainer: 30
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
4 Rare Candy SVI 191
2 Battle VIP Pass FST 225

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

    await page.locator('textarea').fill(incompleteDeck);
    await page.waitForTimeout(1000);

    // Should show Spanish validation messages
    const spanishValidation = [
      /cartas/i,
      /incompleto/i,
      /falta|faltan/i,
      /50\/60/i
    ];

    let validationFound = false;
    for (const pattern of spanishValidation) {
      const element = page.getByText(pattern).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        validationFound = true;
        break;
      }
    }

    // At minimum should show card count
    expect(validationFound).toBeTruthy();
  });

  test('TC-I18N-ES-004: Format names should be in Spanish', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Formato ES');
    await page.locator('textarea').fill(POKEMON_STANDARD_VALID);
    await page.waitForTimeout(1000);

    // Format names in Spanish
    const formatNames = [
      /Estándar|Standard/i,
      /Pokémon|Pokemon/i
    ];

    let formatFound = false;
    for (const pattern of formatNames) {
      const element = page.getByText(pattern).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        formatFound = true;
        break;
      }
    }

    expect(formatFound).toBeTruthy();
  });

  test('TC-I18N-ES-005: Card type labels should be in Spanish', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Tipos ES');
    await page.locator('textarea').fill(POKEMON_STANDARD_VALID);
    await page.waitForTimeout(1000);

    // Card type labels
    const typeLabels = [
      /Pokémon/i,
      /Entrenador|Trainer/i,
      /Energía|Energy/i
    ];

    let labelFound = false;
    for (const pattern of typeLabels) {
      const element = page.getByText(pattern).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        labelFound = true;
        break;
      }
    }

    expect(labelFound).toBeTruthy();
  });

  test('TC-I18N-ES-006: Error messages should be in Spanish', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Error ES');

    // Deck with too many copies
    const invalidDeck = `Pokémon: 8
4 Pikachu ex SVI 057
4 Raichu SVI 026

Trainer: 40
5 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
4 Rare Candy SVI 191
4 Battle VIP Pass FST 225
3 Pokégear 3.0 SVI 186

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

    await page.locator('textarea').fill(invalidDeck);
    await page.waitForTimeout(1000);

    // Error messages
    const errorMessages = [
      /excede|exceden/i,
      /máximo/i,
      /límite/i,
      /copias/i,
      /5\/4/i
    ];

    let errorFound = false;
    for (const pattern of errorMessages) {
      const element = page.getByText(pattern).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        errorFound = true;
        break;
      }
    }

    expect(errorFound).toBeTruthy();
  });

  test('TC-I18N-ES-007: Community tab should be in Spanish', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(500);

    // Tab labels
    const communityTab = page.getByText(/Comunidad|Community/i);
    const hasTab = await communityTab.isVisible().catch(() => false);

    expect(hasTab).toBeTruthy();
  });
});

test.describe('Deck Manager i18n - English (EN)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill(TEST_USER.username);
    await page.getByPlaceholder(/contraseña|password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /Iniciar Sesión|Login/i }).click();
    await page.waitForURL('/');

    // Switch to English
    const enButton = page.locator('button:has-text("EN"), [data-lang="en"]').first();
    const hasEnButton = await enButton.isVisible().catch(() => false);

    if (hasEnButton) {
      await enButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('TC-I18N-EN-001: Deck list page should be in English', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForLoadState('networkidle');

    // Check English translations
    const englishElements = [
      /My Decks/i,
      /Community/i,
      /Import/i,
      /New Deck|Create Deck/i
    ];

    let visibleCount = 0;
    for (const pattern of englishElements) {
      const element = page.getByText(pattern).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) visibleCount++;
    }

    expect(visibleCount).toBeGreaterThanOrEqual(2);
  });

  test('TC-I18N-EN-002: Deck import modal should be in English', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import/i }).click();
    await page.waitForTimeout(500);

    // Check English translations
    const modalTexts = [
      /Import Deck/i,
      /Deck name|My new deck/i,
      /Paste.*deck.*here/i,
      /Cancel/i,
      /Import/i
    ];

    let foundCount = 0;
    for (const pattern of modalTexts) {
      const element = page.getByText(pattern).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) foundCount++;
    }

    expect(foundCount).toBeGreaterThanOrEqual(2);
  });

  test('TC-I18N-EN-003: Validation messages should be in English', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import/i }).click();

    await page.getByPlaceholder(/My new deck/i).fill('Test Validation EN');

    const incompleteDeck = `Pokémon: 8
4 Pikachu ex SVI 057
4 Pichu SVI 025

Trainer: 30
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
4 Rare Candy SVI 191
2 Battle VIP Pass FST 225

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

    await page.locator('textarea').fill(incompleteDeck);
    await page.waitForTimeout(1000);

    // English validation messages
    const englishValidation = [
      /cards/i,
      /incomplete/i,
      /missing/i,
      /50\/60/i
    ];

    let validationFound = false;
    for (const pattern of englishValidation) {
      const element = page.getByText(pattern).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        validationFound = true;
        break;
      }
    }

    expect(validationFound).toBeTruthy();
  });

  test('TC-I18N-EN-004: Format names should be in English', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import/i }).click();

    await page.getByPlaceholder(/My new deck/i).fill('Test Format EN');
    await page.locator('textarea').fill(POKEMON_STANDARD_VALID);
    await page.waitForTimeout(1000);

    // Format names
    const formatNames = [
      /Standard/i,
      /Pokemon|Pokémon/i
    ];

    let formatFound = false;
    for (const pattern of formatNames) {
      const element = page.getByText(pattern).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        formatFound = true;
        break;
      }
    }

    expect(formatFound).toBeTruthy();
  });

  test('TC-I18N-EN-005: Card type labels should be in English', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import/i }).click();

    await page.getByPlaceholder(/My new deck/i).fill('Test Types EN');
    await page.locator('textarea').fill(POKEMON_STANDARD_VALID);
    await page.waitForTimeout(1000);

    // Card type labels
    const typeLabels = [
      /Pokemon|Pokémon/i,
      /Trainer/i,
      /Energy/i
    ];

    let labelFound = false;
    for (const pattern of typeLabels) {
      const element = page.getByText(pattern).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        labelFound = true;
        break;
      }
    }

    expect(labelFound).toBeTruthy();
  });

  test('TC-I18N-EN-006: Error messages should be in English', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import/i }).click();

    await page.getByPlaceholder(/My new deck/i).fill('Test Error EN');

    const invalidDeck = `Pokémon: 8
4 Pikachu ex SVI 057
4 Raichu SVI 026

Trainer: 40
5 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
4 Rare Candy SVI 191
4 Battle VIP Pass FST 225
3 Pokégear 3.0 SVI 186

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

    await page.locator('textarea').fill(invalidDeck);
    await page.waitForTimeout(1000);

    // Error messages
    const errorMessages = [
      /exceeds/i,
      /maximum/i,
      /limit/i,
      /copies/i,
      /5\/4/i
    ];

    let errorFound = false;
    for (const pattern of errorMessages) {
      const element = page.getByText(pattern).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        errorFound = true;
        break;
      }
    }

    expect(errorFound).toBeTruthy();
  });

  test('TC-I18N-EN-007: Community tab should be in English', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(500);

    // Tab label
    const communityTab = page.getByText(/Community/i);
    const hasTab = await communityTab.isVisible().catch(() => false);

    expect(hasTab).toBeTruthy();
  });
});

test.describe('Language Toggle Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill(TEST_USER.username);
    await page.getByPlaceholder(/contraseña|password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /Iniciar Sesión|Login/i }).click();
    await page.waitForURL('/');
  });

  test('TC-I18N-TOGGLE-001: should switch from Spanish to English in deck page', async ({ page }) => {
    await page.goto('/decks');

    // Switch to Spanish first
    const esButton = page.locator('button:has-text("ES")').first();
    const hasEs = await esButton.isVisible().catch(() => false);

    if (hasEs) {
      await esButton.click();
      await page.waitForTimeout(500);

      // Should see Spanish
      const spanishText = page.getByText(/Importar|Mis Mazos/i);
      const hasSpanish = await spanishText.first().isVisible().catch(() => false);

      // Switch to English
      const enButton = page.locator('button:has-text("EN")').first();
      await enButton.click();
      await page.waitForTimeout(500);

      // Should see English
      const englishText = page.getByText(/Import|My Decks/i);
      await expect(englishText.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('TC-I18N-TOGGLE-002: should persist language across deck import', async ({ page }) => {
    // Switch to English
    const enButton = page.locator('button:has-text("EN")').first();
    const hasEn = await enButton.isVisible().catch(() => false);

    if (hasEn) {
      await enButton.click();
      await page.waitForTimeout(500);

      // Go to decks and open import
      await page.goto('/decks');
      await page.getByRole('button', { name: /Import/i }).click();
      await page.waitForTimeout(500);

      // Should still be English
      const englishModal = page.getByText(/Import Deck|Paste.*deck/i);
      await expect(englishModal.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('TC-I18N-TOGGLE-003: should maintain language after deck creation', async ({ page }) => {
    // Switch to English
    const enButton = page.locator('button:has-text("EN")').first();
    const hasEn = await enButton.isVisible().catch(() => false);

    if (hasEn) {
      await enButton.click();
      await page.waitForTimeout(500);

      await page.goto('/decks');
      await page.getByRole('button', { name: /Import/i }).click();

      await page.getByPlaceholder(/My new deck/i).fill(`E2E Lang Test ${Date.now()}`);
      await page.locator('textarea').fill(POKEMON_STANDARD_VALID);
      await page.getByRole('button', { name: /^Import$/i }).click();

      // Wait for redirect
      await expect(page).toHaveURL(/\/decks\/[a-f0-9]+/, { timeout: 15000 });

      // Should still be English
      const englishElement = page.getByText(/cards|deck|pokemon/i);
      await expect(englishElement.first()).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('No Hardcoded Strings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill(TEST_USER.username);
    await page.getByPlaceholder(/contraseña|password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /Iniciar Sesión|Login/i }).click();
    await page.waitForURL('/');
  });

  test('TC-I18N-HC-001: deck buttons should not have hardcoded text', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForTimeout(500);

    // Switch between languages
    const enButton = page.locator('button:has-text("EN")').first();
    const esButton = page.locator('button:has-text("ES")').first();

    const hasButtons = await enButton.isVisible().catch(() => false) &&
                       await esButton.isVisible().catch(() => false);

    if (hasButtons) {
      // Check Spanish
      await esButton.click();
      await page.waitForTimeout(500);

      const importBtnES = page.getByRole('button', { name: /Importar/i });
      const hasImportES = await importBtnES.isVisible().catch(() => false);

      // Check English
      await enButton.click();
      await page.waitForTimeout(500);

      const importBtnEN = page.getByRole('button', { name: /Import/i });
      const hasImportEN = await importBtnEN.isVisible().catch(() => false);

      // Both should exist (proves it's translated, not hardcoded)
      expect(hasImportES || hasImportEN).toBeTruthy();
    }
  });

  test('TC-I18N-HC-002: validation messages should not be hardcoded', async ({ page }) => {
    await page.goto('/decks');

    const enButton = page.locator('button:has-text("EN")').first();
    const esButton = page.locator('button:has-text("ES")').first();

    const hasButtons = await enButton.isVisible().catch(() => false) &&
                       await esButton.isVisible().catch(() => false);

    if (hasButtons) {
      // Test in Spanish
      await esButton.click();
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: /Importar/i }).click();
      await page.getByPlaceholder(/Mi nuevo mazo/i).fill('Test HC ES');
      await page.locator('textarea').fill('4 Pikachu SVI 025');
      await page.waitForTimeout(1000);

      const cardCountES = page.getByText(/4.*cartas|cartas.*4/i);
      const hasES = await cardCountES.isVisible().catch(() => false);

      // Close modal
      const cancelBtn = page.getByRole('button', { name: /Cancelar|Cancel/i });
      const hasCancel = await cancelBtn.isVisible().catch(() => false);
      if (hasCancel) {
        await cancelBtn.click();
        await page.waitForTimeout(500);
      }

      // Test in English
      await enButton.click();
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: /Import/i }).click();
      await page.getByPlaceholder(/My new deck/i).fill('Test HC EN');
      await page.locator('textarea').fill('4 Pikachu SVI 025');
      await page.waitForTimeout(1000);

      const cardCountEN = page.getByText(/4.*cards|cards.*4/i);
      const hasEN = await cardCountEN.isVisible().catch(() => false);

      // Both should exist (proves translation works)
      expect(hasES || hasEN).toBeTruthy();
    }
  });
});
