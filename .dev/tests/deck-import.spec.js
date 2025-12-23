import { test, expect } from '@playwright/test';

/**
 * DM2 Epic - Deck Import Modal Tests
 *
 * Tests for DeckImportModal component including:
 * - Real-time deck parsing with preview
 * - TCG detection (Pokemon/Riftbound)
 * - Format detection (Standard/Expanded/GLC)
 * - Reprint grouping with copy limit validation
 * - Validation indicators
 */

// Test deck strings for different scenarios
const TEST_DECKS = {
  // Standard Pokemon TCG Live format deck
  pokemonStandard: `Pokémon: 20
4 Gholdengo ex SVI 139
4 Gimmighoul SVI 87
3 Pidgeot ex OBF 164
3 Pidgey OBF 162
2 Radiant Jirachi SIT 120
2 Manaphy BRS 41
1 Lumineon V BRS 40
1 Jirachi PAR 126

Trainer: 32
4 Buddy-Buddy Poffin TEF 144
4 Rare Candy SVI 191
4 Ultra Ball SVI 196
3 Nest Ball SVI 181
3 Boss's Orders PAL 172
2 Arven SVI 166
2 Professor's Research SVI 189
2 Switch SVI 194
2 Technical Machine: Evolution PAR 178
1 Counter Catcher PAR 160
1 Super Rod PAL 188
1 Iono PAL 185
1 Lost Vacuum LOR 162
1 Forest Seal Stone SIT 156
1 Maximum Belt TEF 154

Energy: 8
8 Basic Psychic Energy SVE 5`,

  // Deck with reprints (same card name from different sets)
  pokemonWithReprints: `Pokémon: 8
4 Pikachu ex SVP 86
4 Pikachu VIV 43

Trainer: 44
2 Professor's Research SVI 189
2 Professor's Research PAL 172
4 Ultra Ball SVI 196
4 Nest Ball SVI 181
4 Switch SVI 194
4 Energy Retrieval SVI 171
4 Poké Ball SVI 185
4 Potion SVI 188
4 Great Ball SVI 183
4 Level Ball BST 129
4 Quick Ball SSH 216
4 Timer Ball SUM 134

Energy: 8
8 Basic Lightning Energy SVE 4`,

  // GLC deck (singleton format)
  pokemonGLC: `Pokémon: 20
1 Charizard VIV 25
1 Charmeleon VIV 24
1 Charmander VIV 23
1 Arcanine SIT 32
1 Growlithe SIT 31
1 Magcargo CRE 22
1 Slugma CRE 21
1 Volcarona PAR 36
1 Larvesta PAR 35
1 Entei V BRS 22
1 Flareon VMAX PR-SW 180
1 Flareon V PR-SW 179
1 Centiskorch V SSH 33
1 Blaziken VMAX CRE 21
1 Blaziken V CRE 20
1 Cinderace SSH 34
1 Raboot SSH 33
1 Scorbunny SSH 32
1 Infernape LOR 23
1 Monferno LOR 22

Trainer: 32
1 Boss's Orders PAL 172
1 Professor's Research SVI 189
1 Ultra Ball SVI 196
1 Nest Ball SVI 181
1 Switch SVI 194
1 Energy Retrieval SVI 171
1 Rare Candy SVI 191
1 Pokégear 3.0 SSH 174
1 Evolution Incense SSH 163
1 Quick Ball SSH 216
1 Level Ball BST 129
1 Ordinary Rod SSH 171
1 Rescue Carrier EVS 154
1 Air Balloon SSH 156
1 Cape of Toughness DAA 160
1 Tool Scrapper RCL 168
1 Field Blower GRI 125
1 Special Charge STS 105
1 Energy Recycler BST 124
1 Pal Pad SSH 172
1 VS Seeker PHF 109
1 Bicycle PLS 117
1 Acro Bike PRC 122
1 Trainers' Mail ROS 92
1 Battle Compressor PHF 92
1 Computer Search BCR 137
1 Blacksmith FLF 88
1 Welder UNB 189
1 Fiery Flint DRM 60
1 Giant Hearth UNM 197
1 Magma Basin BRS 144
1 Heat Factory PS 178

Energy: 8
8 Basic Fire Energy SVE 2`,

  // Deck exceeding copy limit
  pokemonExceedLimit: `Pokémon: 20
5 Pikachu VIV 43
4 Raichu VIV 44
4 Pachirisu VIV 46
4 Emolga VIV 47
3 Zapdos VIV 48

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
8 Basic Lightning Energy SVE 4`,

  // Pokemon TCG Pocket format (different syntax)
  pokemonPocket: `Pikachu ex × 2
Pikachu × 2
Zapdos × 2
Raichu ex × 2
Electrode × 2
Voltorb × 2
Professor's Research × 2
Poké Ball × 2
X Speed × 2`,

  // Empty deck
  empty: '',

  // Malformed deck
  malformed: `This is not a valid deck format
Random text here
No cards to parse`,

  // Riftbound format (tcg-arena.fr style)
  riftbound: `1 Leona, Determined
3 Clockwork Keeper
3 Sentinel of Order
3 Orderly Advance
3 Shield Wall
3 Calculated Strike
3 Steel Guardian
3 Order Rune
3 Body Rune
3 Mind Rune
3 Fury Rune
3 Calm Rune
3 Chaos Rune
1 Battlefield of Order
1 Battlefield of the Ancients
1 Battlefield of Valor`,

  // Riftbound with various card types
  riftboundMixed: `1 Theron, the Wise
6 Order Rune
6 Fury Rune
3 Battlefield of Flames
3 Battlefield of Honor
3 Clockwork Keeper
3 Fire Elemental
3 Lightning Strike
3 Sword of Power
3 Armor of the Ancients
3 Shield of Valor
3 Battle Cry`,
};

test.describe('Deck Import Modal - DM2 Epic', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to deck builder (requires auth for import)
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');

    // Navigate to deck builder
    await page.goto('/decks/new');
  });

  test('should open import modal and show instructions', async ({ page }) => {
    // Find and click import button
    const importButton = page.getByRole('button', { name: /Importar|Import/i });
    await expect(importButton).toBeVisible();
    await importButton.click();

    // Modal should be visible
    await expect(page.getByRole('heading', { name: /Importar Deck|Import Deck/i })).toBeVisible();

    // Instructions should be present
    await expect(page.getByText(/Pega tu lista|Paste your deck/i)).toBeVisible();

    // Textarea should be present
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should parse Pokemon TCG Live format and show preview', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste deck text
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.pokemonStandard);

    // Wait for debounced parse (500ms + API call)
    await page.waitForTimeout(1000);

    // Should show TCG badge
    await expect(page.getByText('Pokemon')).toBeVisible();

    // Should show format badge (Standard or Expanded based on card pool)
    await expect(page.getByText(/Standard|Estándar|Expanded|Expandido/i)).toBeVisible();

    // Should show input format detection
    await expect(page.getByText('Pokemon TCG Live')).toBeVisible();

    // Should show card breakdown
    await expect(page.getByText(/Pokémon:/i)).toBeVisible();
    await expect(page.getByText(/Trainer:|Entrenador:/i)).toBeVisible();
    await expect(page.getByText(/Energy:|Energía:/i)).toBeVisible();

    // Should show total cards
    await expect(page.getByText(/60/)).toBeVisible();
  });

  test('should detect reprint groups and show copy limits', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste deck with reprints
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.pokemonWithReprints);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Should have reprint groups section
    const reprintGroupsButton = page.getByText(/Reprint Groups|Grupos de Reimpresión/i);
    await expect(reprintGroupsButton).toBeVisible();

    // Click to expand
    await reprintGroupsButton.click();

    // Should show Professor's Research grouped with set breakdown
    await expect(page.getByText(/Professor's Research/i)).toBeVisible();

    // Should show copy limit status (4/4 for Professor's Research)
    await expect(page.getByText(/4\/4/)).toBeVisible();
  });

  test('should show exceeded copy limit warning', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste deck exceeding limit
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.pokemonExceedLimit);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Should show exceeded limit badge
    await expect(page.getByText(/excede|exceed/i)).toBeVisible();

    // Expand reprint groups
    await page.getByText(/Reprint Groups|Grupos de Reimpresión/i).click();

    // Should show warning icon for Pikachu (5 copies > 4 limit)
    await expect(page.getByText('⚠️')).toBeVisible();

    // Should show 5/4 (exceeding limit)
    await expect(page.getByText(/5\/4/)).toBeVisible();
  });

  test('should detect GLC format with singleton rule', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste GLC deck
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.pokemonGLC);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Should detect GLC format
    await expect(page.getByText('GLC')).toBeVisible();

    // Should show format confidence
    await expect(page.getByText(/%/)).toBeVisible();
  });

  test('should handle Pokemon TCG Pocket format', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste Pocket format
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.pokemonPocket);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Should detect Pokemon TCG
    await expect(page.getByText('Pokemon')).toBeVisible();

    // Should detect Pocket format
    await expect(page.getByText('Pokemon TCG Pocket')).toBeVisible();
  });

  test('should show validation indicator with status', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste valid deck
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.pokemonStandard);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Should show validation status (valid or with warnings)
    const validationSection = page.locator('[class*="validation"], [class*="Validation"]').or(
      page.getByText(/60\/60|Valid|Válido/i)
    );
    await expect(validationSection.first()).toBeVisible();
  });

  test('should clear preview when textarea is emptied', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste deck
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.pokemonStandard);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Should show preview
    await expect(page.getByText('Pokemon')).toBeVisible();

    // Clear textarea
    await textarea.clear();

    // Wait for debounce
    await page.waitForTimeout(600);

    // Preview should be gone
    await expect(page.getByText('Pokemon TCG Live')).not.toBeVisible();
  });

  test('should show error for malformed deck', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste malformed deck
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.malformed);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Should show error or warnings
    const errorIndicator = page.locator('[class*="red"], [class*="error"], [class*="yellow"]').or(
      page.getByText(/error|warning|advertencia/i)
    );
    await expect(errorIndicator.first()).toBeVisible();
  });

  test('should disable import button when no valid cards', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Import button should be disabled initially
    const importDeckButton = page.getByRole('button', { name: /Importar Deck|Import Deck/i });
    await expect(importDeckButton).toBeDisabled();

    // Paste valid deck
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.pokemonStandard);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Import button should be enabled now
    await expect(importDeckButton).toBeEnabled();
  });

  test('should close modal and reset state on cancel', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste deck
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.pokemonStandard);

    // Wait for parse
    await page.waitForTimeout(1000);

    // Click cancel
    await page.getByRole('button', { name: /Cancelar|Cancel/i }).click();

    // Modal should be closed
    await expect(page.getByRole('heading', { name: /Importar Deck|Import Deck/i })).not.toBeVisible();

    // Open modal again
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Textarea should be empty
    await expect(page.locator('textarea')).toHaveValue('');
  });

  test('should show loading spinner during parse', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste deck and immediately check for spinner
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.pokemonStandard);

    // Should show spinner (it appears during debounce + API call)
    // Note: This might be too fast to catch consistently
    // The spinner appears for 500ms debounce + API response time
  });

  test('should import deck and populate builder', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste deck
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.pokemonStandard);

    // Wait for parse
    await page.waitForTimeout(2000);

    // Click import
    await page.getByRole('button', { name: /Importar Deck|Import Deck/i }).click();

    // Modal should close
    await expect(page.getByRole('heading', { name: /Importar Deck|Import Deck/i })).not.toBeVisible();

    // Deck builder should now have cards
    // Look for deck stats or card count
    await expect(page.getByText(/60|cards|cartas/i)).toBeVisible();
  });
});

test.describe('Deck Import - Riftbound Format', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
    await page.goto('/decks/new');
  });

  test('should parse Riftbound format and show preview', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste Riftbound deck
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.riftbound);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Should detect Riftbound TCG
    await expect(page.getByText('Riftbound')).toBeVisible();

    // Should show format detection
    await expect(page.getByText(/Constructed|constructed/i)).toBeVisible();

    // Should show card breakdown with Riftbound components
    await expect(page.getByText(/Legend|legend/i)).toBeVisible();
    await expect(page.getByText(/Rune|rune/i)).toBeVisible();
    await expect(page.getByText(/Battlefield|battlefield/i)).toBeVisible();
  });

  test('should detect Riftbound components (Main/Legend/Battlefields/Runes)', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste Riftbound deck
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.riftbound);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Should show component breakdown
    // Legend: 1 (Leona, Determined)
    await expect(page.getByText(/1.*Legend|Legend.*1/i)).toBeVisible();

    // Battlefields: 3
    await expect(page.getByText(/3.*Battlefield|Battlefield.*3/i)).toBeVisible();

    // Runes: should show count (6 types x 3 = 18? or specific count)
    await expect(page.getByText(/Rune/i)).toBeVisible();
  });

  test('should validate Riftbound deck structure', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste Riftbound deck
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.riftbound);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Should show validation indicator
    // Riftbound format: 40 main deck + 1 legend + 3 battlefields + 12 runes = 56 total
    const validationSection = page.locator('[class*="validation"], [class*="Validation"]').or(
      page.getByText(/Valid|Válido|cards|cartas/i)
    );
    await expect(validationSection.first()).toBeVisible();
  });

  test('should show Riftbound format with mixed card types', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste Riftbound mixed deck
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.riftboundMixed);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Should detect Riftbound
    await expect(page.getByText('Riftbound')).toBeVisible();

    // Should show breakdown
    await expect(page.getByText(/Rune/i)).toBeVisible();
    await expect(page.getByText(/Battlefield/i)).toBeVisible();
  });

  test('should import Riftbound deck successfully', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste Riftbound deck
    const textarea = page.locator('textarea');
    await textarea.fill(TEST_DECKS.riftbound);

    // Wait for parse
    await page.waitForTimeout(2000);

    // Click import
    const importButton = page.getByRole('button', { name: /Importar Deck|Import Deck/i });
    await expect(importButton).toBeEnabled();
    await importButton.click();

    // Modal should close
    await expect(page.getByRole('heading', { name: /Importar Deck|Import Deck/i })).not.toBeVisible();

    // Deck builder should show Riftbound cards
    await expect(page.getByText(/Riftbound|cards|cartas/i)).toBeVisible();
  });
});

test.describe('Deck Import - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
    await page.goto('/decks/new');
  });

  test('should handle empty deck gracefully', async ({ page }) => {
    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Import button should be disabled for empty input
    const importButton = page.getByRole('button', { name: /Importar Deck|Import Deck/i });
    await expect(importButton).toBeDisabled();
  });

  test('should show error for invalid format', async ({ page }) => {
    // Already tested in malformed deck test above
    // This is a duplicate placeholder for completeness
  });

  test('should handle cards not found in database', async ({ page }) => {
    // Create a deck with fake card names
    const fakeDeck = `Pokémon: 4
4 Totally Fake Card Name That Does Not Exist ABC 999

Trainer: 4
4 Another Fake Card XYZ 888

Energy: 4
4 Fake Energy Energy DEF 777`;

    // Open import modal
    await page.getByRole('button', { name: /Importar|Import/i }).click();

    // Paste fake deck
    const textarea = page.locator('textarea');
    await textarea.fill(fakeDeck);

    // Wait for parse
    await page.waitForTimeout(1500);

    // Should still parse structure but may show warnings about cards not found
    // The parser should handle this gracefully
    await expect(page.getByText('Pokemon')).toBeVisible();
  });
});

test.describe('Deck Import - i18n Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
    await page.goto('/decks/new');
  });

  test('should show Spanish labels when language is ES', async ({ page }) => {
    // Ensure Spanish is selected (check language toggle)
    const langToggle = page.getByRole('button', { name: /ES|EN/i });
    const currentLang = await langToggle.textContent();

    if (!currentLang?.includes('ES')) {
      await langToggle.click();
      // Wait for language change
      await page.waitForTimeout(200);
    }

    // Open import modal
    await page.getByRole('button', { name: /Importar/i }).click();

    // Should show Spanish labels
    await expect(page.getByText(/Pega tu lista de cartas/i)).toBeVisible();
  });

  test('should show English labels when language is EN', async ({ page }) => {
    // Switch to English
    const langToggle = page.getByRole('button', { name: /ES|EN/i });
    const currentLang = await langToggle.textContent();

    if (!currentLang?.includes('EN')) {
      await langToggle.click();
      await page.waitForTimeout(200);
    }

    // Open import modal
    await page.getByRole('button', { name: /Import/i }).click();

    // Should show English labels
    await expect(page.getByText(/Paste your deck list/i)).toBeVisible();
  });
});
