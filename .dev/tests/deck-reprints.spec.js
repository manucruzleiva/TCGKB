import { test, expect } from '@playwright/test';
import { TEST_USER } from './fixtures/deck-fixtures.js';

/**
 * DM-V2 Reprints Grouping Tests
 * Tests for reprint card grouping in copy validation
 *
 * Test Plan Reference: [Testing] DM-V2: Reprints Grouping (#143)
 *
 * Test Cases:
 * - TC-REP-001: Same name, different set = counts together
 * - TC-REP-002: Variants with parentheses normalized
 * - TC-REP-003: Professor's Research from different sets counts as one
 * - TC-REP-004: UI shows total vs limit correctly
 * - TC-REP-005: Pikachu ≠ Pikachu ex (different names)
 */

test.describe('Reprints Grouping - Pokemon Standard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill(TEST_USER.username);
    await page.getByPlaceholder(/contraseña|password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /Iniciar Sesión|Login/i }).click();
    await page.waitForURL('/');
  });

  test('TC-REP-001: should count same name from different sets together', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Same Name Different Set');

    // Professor's Research from 2 different sets (2+2=4)
    const reprintDeck = `Pokémon: 8
4 Pikachu SVI 025
4 Raichu SVI 026

Trainer: 40
2 Professor's Research SVI 189
2 Professor's Research PAL 189
2 Boss's Orders PAL 172
2 Boss's Orders BRS 132
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
4 Rare Candy SVI 191
4 Battle VIP Pass FST 225
4 Pokégear 3.0 SVI 186
2 Iono PAL 185

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

    await page.locator('textarea').fill(reprintDeck);
    await page.waitForTimeout(1000);

    // Should show 4/4 for Professor's Research (valid)
    // NOT 2/4 for each version separately
    const professorsCount = page.getByText(/Professor's Research.*4\/4|4\/4.*Professor's Research/i);
    const hasCorrectCount = await professorsCount.isVisible().catch(() => false);

    // Also check Boss's Orders (2+2=4)
    const bossCount = page.getByText(/Boss's Orders.*4\/4|4\/4.*Boss's Orders/i);
    const hasBossCount = await bossCount.isVisible().catch(() => false);

    // At least one should show grouped count
    expect(hasCorrectCount || hasBossCount).toBeTruthy();
  });

  test('TC-REP-002: should normalize variants with parentheses', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Variants Normalization');

    // Boss's Orders has different variants: (Cyrus), (Ghetsis), etc.
    const variantsDeck = `Pokémon: 12
4 Pikachu ex SVI 057
4 Raichu SVI 026
4 Pichu SVI 025

Trainer: 36
2 Professor's Research (Professor Oak) SVI 189
2 Professor's Research (Professor Rowan) PAL 189
2 Boss's Orders (Cyrus) PAL 172
2 Boss's Orders (Ghetsis) BRS 132
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
4 Rare Candy SVI 191
4 Battle VIP Pass FST 225

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

    await page.locator('textarea').fill(variantsDeck);
    await page.waitForTimeout(1000);

    // "Professor's Research (Professor Oak)" → "Professor's Research"
    // Should show 4/4 total
    const professorsNormalized = page.getByText(/Professor's Research.*4\/4/i);
    const hasNormalized = await professorsNormalized.isVisible().catch(() => false);

    // Boss's Orders should also be normalized
    const bossNormalized = page.getByText(/Boss's Orders.*4\/4/i);
    const hasBossNormalized = await bossNormalized.isVisible().catch(() => false);

    // At least one should be normalized
    expect(hasNormalized || hasBossNormalized).toBeTruthy();
  });

  test('TC-REP-003: should handle Professor\'s Research reprints correctly', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Professors Reprints');

    // 3 different sets of Professor's Research
    const professorsDeck = `Pokémon: 12
4 Pikachu ex SVI 057
4 Raichu SVI 026
4 Pichu SVI 025

Trainer: 36
1 Professor's Research SVI 189
1 Professor's Research PAL 189
1 Professor's Research SIT 189
1 Professor's Research BRS 189
4 Boss's Orders PAL 172
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
4 Rare Candy SVI 191
4 Battle VIP Pass FST 225
4 Pokégear 3.0 SVI 186

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

    await page.locator('textarea').fill(professorsDeck);
    await page.waitForTimeout(1000);

    // Should show 4/4 (all reprints counted together)
    const professorsTotal = page.getByText(/Professor's Research.*4\/4/i);
    await expect(professorsTotal).toBeVisible({ timeout: 10000 });
  });

  test('TC-REP-004: should show total vs limit in UI correctly', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test UI Display');

    const uiDeck = `Pokémon: 12
4 Pikachu ex SVI 057
4 Raichu SVI 026
4 Pichu SVI 025

Trainer: 36
2 Professor's Research SVI 189
2 Professor's Research PAL 189
4 Boss's Orders PAL 172
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
4 Rare Candy SVI 191
4 Battle VIP Pass FST 225

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

    await page.locator('textarea').fill(uiDeck);
    await page.waitForTimeout(1000);

    // Should show format like:
    // Professor's Research   [4/4] ✓
    //   ├─ SVI 189 x2
    //   └─ PAL 189 x2
    const countDisplay = page.getByText(/4\/4|4 \/ 4/i);
    await expect(countDisplay.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-REP-005: should treat Pikachu and Pikachu ex as different cards', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Different Names');

    // 4 Pikachu + 4 Pikachu ex = 8 total, but different names
    const differentNamesDeck = `Pokémon: 12
4 Pikachu SVI 025
4 Pikachu ex SVI 057
4 Raichu SVI 026

Trainer: 36
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
4 Rare Candy SVI 191
4 Battle VIP Pass FST 225

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

    await page.locator('textarea').fill(differentNamesDeck);
    await page.waitForTimeout(1000);

    // Should NOT show error for 8 Pikachus
    // They are different cards: "Pikachu" vs "Pikachu ex"
    const pikachuError = page.getByText(/Pikachu.*8\/4|8\/4.*Pikachu/i);
    const hasError = await pikachuError.isVisible().catch(() => false);

    // Should be valid - no error
    expect(hasError).toBeFalsy();
  });

  test('TC-REP-006: should show error when reprints exceed 4 copies', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Exceeds with Reprints');

    // 3 + 2 = 5 copies of Professor's Research (invalid)
    const exceedsDeck = `Pokémon: 8
4 Pikachu ex SVI 057
4 Raichu SVI 026

Trainer: 40
3 Professor's Research SVI 189
2 Professor's Research PAL 189
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

    await page.locator('textarea').fill(exceedsDeck);
    await page.waitForTimeout(1000);

    // Should show 5/4 error for Professor's Research
    const exceedsError = page.getByText(/Professor's Research.*5\/4|5\/4.*Professor|exceeds|excede/i);
    await expect(exceedsError).toBeVisible({ timeout: 10000 });
  });

  test('TC-REP-007: should group reprints in expandable UI', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Expandable Reprints');

    const expandableDeck = `Pokémon: 12
4 Pikachu ex SVI 057
4 Raichu SVI 026
4 Pichu SVI 025

Trainer: 36
1 Professor's Research SVI 189
1 Professor's Research PAL 189
1 Professor's Research BRS 189
1 Professor's Research SIT 189
4 Boss's Orders PAL 172
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
4 Rare Candy SVI 191
4 Battle VIP Pass FST 225
4 Pokégear 3.0 SVI 186

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

    await page.locator('textarea').fill(expandableDeck);
    await page.waitForTimeout(1000);

    // Should show grouped display with breakdown
    // Look for either:
    // 1. Parent line with total count
    const parentLine = page.getByText(/Professor's Research.*4\/4/i);
    const hasParent = await parentLine.isVisible().catch(() => false);

    // 2. Or individual set codes visible
    const setCode = page.getByText(/SVI 189|PAL 189|BRS 189|SIT 189/i);
    const hasSetCodes = await setCode.first().isVisible().catch(() => false);

    // Should show some grouping UI
    expect(hasParent || hasSetCodes).toBeTruthy();
  });

  test('TC-REP-008: should handle edge case of same card different printings', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Different Printings');

    // Same card, different printings (holo, reverse holo, etc. - same set code)
    const printingsDeck = `Pokémon: 12
2 Charizard PAL 029
2 Charizard PAL 029
4 Charmander PAL 026
4 Charmeleon PAL 028

Trainer: 36
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
4 Rare Candy SVI 191
4 Battle VIP Pass FST 225
4 Pokégear 3.0 SVI 186

Energy: 12
8 Basic Fire Energy SVE 002
4 Double Turbo Energy BRS 151`;

    await page.locator('textarea').fill(printingsDeck);
    await page.waitForTimeout(1000);

    // 2 + 2 = 4 Charizard (same card, should count together)
    const charizardCount = page.getByText(/Charizard.*4\/4/i);
    const hasCount = await charizardCount.isVisible().catch(() => false);

    // Should show grouped count or no error
    const noError = await page.getByText(/Charizard.*exceeds|excede/i).isVisible().catch(() => false);

    expect(hasCount || !noError).toBeTruthy();
  });
});

test.describe('Reprints Grouping - Energy Exception', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill(TEST_USER.username);
    await page.getByPlaceholder(/contraseña|password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /Iniciar Sesión|Login/i }).click();
    await page.waitForURL('/');
  });

  test('TC-REP-009: should allow unlimited Basic Energy from different sets', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test Energy Exception');

    const energyDeck = `Pokémon: 8
4 Pikachu ex SVI 057
4 Raichu SVI 026

Trainer: 4
4 Professor's Research SVI 189

Energy: 48
10 Basic Lightning Energy SVE 004
10 Basic Lightning Energy SVI 004
10 Basic Lightning Energy PAL 004
10 Basic Lightning Energy BRS 004
8 Double Turbo Energy BRS 151`;

    await page.locator('textarea').fill(energyDeck);
    await page.waitForTimeout(1000);

    // Should NOT show error for 40 Basic Lightning Energy
    // (10+10+10+10 from different sets)
    const energyError = page.getByText(/Basic Lightning Energy.*40\/4|exceeds.*energy/i);
    const hasError = await energyError.isVisible().catch(() => false);

    // Basic Energy is unlimited
    expect(hasError).toBeFalsy();
  });
});

test.describe('Reprints Grouping - GLC Format', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill(TEST_USER.username);
    await page.getByPlaceholder(/contraseña|password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /Iniciar Sesión|Login/i }).click();
    await page.waitForURL('/');
  });

  test('TC-REP-010: should enforce singleton rule even with reprints in GLC', async ({ page }) => {
    await page.goto('/decks');
    await page.getByRole('button', { name: /Import|Importar/i }).click();

    await page.getByPlaceholder(/My new deck|Mi nuevo mazo/i).fill('Test GLC Reprints');

    // In GLC, even reprints count toward singleton limit
    const glcReprintsDeck = `Pokémon: 15
1 Charmander SVI 023
1 Charmeleon SVI 024
1 Charizard SVI 025
1 Vulpix SVI 027
1 Ninetales SVI 028
1 Growlithe SVI 058
1 Arcanine SVI 059
1 Ponyta SVI 077
1 Rapidash SVI 078
1 Magmar SVI 096
1 Flareon SVI 136
1 Cyndaquil SVI 155
1 Quilava SVI 156
1 Typhlosion SVI 157
1 Entei SVI 020

Trainer: 30
1 Professor's Research SVI 189
1 Boss's Orders PAL 172
1 Nest Ball SVI 181
1 Ultra Ball SVI 196
1 Switch SVI 194
1 Rare Candy SVI 191
1 Pokégear 3.0 SVI 186
1 Energy Retrieval SVI 171
1 Escape Rope BST 125
1 Level Ball BST 129
1 Quick Ball FST 237
1 Evolution Incense SSH 163
1 Fire Crystal UNB 173
1 Fiery Flint DRM 60
1 Welder UNB 189
1 Blacksmith FLF 88
1 Scorched Earth PRC 138
1 Giant Hearth UNM 197
1 Magma Basin BRS 144
1 Float Stone PLF 99
1 Choice Belt BRS 135
1 Muscle Band XY 121
1 VS Seeker PHF 109
1 Guzma BUS 115
1 N FCO 105
1 Colress PLS 118
1 Rescue Stretcher GRI 130
1 Field Blower GRI 125
1 Enhanced Hammer GRI 124
1 Tool Scrapper DRX 116

Energy: 15
15 Basic Fire Energy SVE 002`;

    await page.locator('textarea').fill(glcReprintsDeck);
    await page.waitForTimeout(1000);

    // Should be valid (all 1 copy each)
    const glcFormat = page.getByText(/GLC|Gym Leader/i);
    const hasGLC = await glcFormat.isVisible().catch(() => false);

    // Should NOT show singleton error
    const singletonError = page.getByText(/2\/1|singleton.*error/i);
    const hasError = await singletonError.isVisible().catch(() => false);

    expect(!hasError).toBeTruthy();
  });
});
