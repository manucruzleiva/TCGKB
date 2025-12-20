import { test, expect } from '@playwright/test';

/**
 * DM2 Epic - Deck Validation Tests
 *
 * Tests for DeckValidationIndicator component including:
 * - Card count validation (60 for Standard/GLC)
 * - Copy limit validation (4 copies max, singleton for GLC)
 * - Special card limits (ACE SPEC, Radiant)
 * - Basic Pokemon requirement
 * - Format-specific rules (GLC Rule Box prohibition)
 */

// Test deck strings with specific validation scenarios
const VALIDATION_TEST_DECKS = {
  // Valid 60-card deck
  valid60: `Pokémon: 12
4 Pikachu VIV 43
4 Raichu VIV 44
4 Pachirisu VIV 46

Trainer: 40
4 Ultra Ball SVI 196
4 Nest Ball SVI 181
4 Switch SVI 194
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Rare Candy SVI 191
4 Energy Retrieval SVI 171
4 Poké Ball SVI 185
4 Great Ball SVI 183
4 Level Ball BST 129

Energy: 8
8 Basic Lightning Energy SVE 4`,

  // Under 60 cards (59)
  under60: `Pokémon: 11
4 Pikachu VIV 43
4 Raichu VIV 44
3 Pachirisu VIV 46

Trainer: 40
4 Ultra Ball SVI 196
4 Nest Ball SVI 181
4 Switch SVI 194
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Rare Candy SVI 191
4 Energy Retrieval SVI 171
4 Poké Ball SVI 185
4 Great Ball SVI 183
4 Level Ball BST 129

Energy: 8
8 Basic Lightning Energy SVE 4`,

  // Over 60 cards (61)
  over60: `Pokémon: 13
4 Pikachu VIV 43
4 Raichu VIV 44
5 Pachirisu VIV 46

Trainer: 40
4 Ultra Ball SVI 196
4 Nest Ball SVI 181
4 Switch SVI 194
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Rare Candy SVI 191
4 Energy Retrieval SVI 171
4 Poké Ball SVI 185
4 Great Ball SVI 183
4 Level Ball BST 129

Energy: 8
8 Basic Lightning Energy SVE 4`,

  // Exceeds copy limit (5 Pikachu)
  exceedsCopyLimit: `Pokémon: 13
5 Pikachu VIV 43
4 Raichu VIV 44
4 Pachirisu VIV 46

Trainer: 39
4 Ultra Ball SVI 196
4 Nest Ball SVI 181
4 Switch SVI 194
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Rare Candy SVI 191
4 Energy Retrieval SVI 171
4 Poké Ball SVI 185
3 Great Ball SVI 183
4 Level Ball BST 129

Energy: 8
8 Basic Lightning Energy SVE 4`,

  // Multiple ACE SPECs (should show error)
  multipleAceSpec: `Pokémon: 12
4 Pikachu VIV 43
4 Raichu VIV 44
4 Pachirisu VIV 46

Trainer: 40
2 Prime Catcher TEF 157
2 Maximum Belt TEF 154
4 Ultra Ball SVI 196
4 Nest Ball SVI 181
4 Switch SVI 194
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Rare Candy SVI 191
4 Energy Retrieval SVI 171
4 Poké Ball SVI 185
4 Great Ball SVI 183

Energy: 8
8 Basic Lightning Energy SVE 4`,

  // No Basic Pokemon
  noBasicPokemon: `Pokémon: 12
4 Raichu VIV 44
4 Magnezone VIV 56
4 Electivire VIV 51

Trainer: 40
4 Ultra Ball SVI 196
4 Nest Ball SVI 181
4 Switch SVI 194
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Rare Candy SVI 191
4 Energy Retrieval SVI 171
4 Poké Ball SVI 185
4 Great Ball SVI 183
4 Level Ball BST 129

Energy: 8
8 Basic Lightning Energy SVE 4`,

  // GLC with duplicates (invalid for singleton format)
  glcWithDuplicates: `Pokémon: 20
2 Charizard VIV 25
1 Charmeleon VIV 24
1 Charmander VIV 23
1 Arcanine SIT 32
1 Growlithe SIT 31
1 Magcargo CRE 22
1 Slugma CRE 21
1 Volcarona PAR 36
1 Larvesta PAR 35
1 Entei V BRS 22
1 Flareon V PR-SW 179
1 Centiskorch V SSH 33
1 Blaziken V CRE 20
1 Cinderace SSH 34
1 Raboot SSH 33
1 Scorbunny SSH 32
1 Infernape LOR 23
1 Monferno LOR 22
1 Chimchar LOR 21

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
};

test.describe('Deck Validation - Card Count', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
    await page.goto('/decks/new');
  });

  test('should show green indicator for exactly 60 cards', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.valid60);
    await page.waitForTimeout(1500);

    // Should show 60/60 in green
    const cardCount = page.getByText('60/60');
    await expect(cardCount).toBeVisible();

    // Should have green coloring
    const validIndicator = page.locator('[class*="green"]').or(
      page.locator('svg[class*="green"]')
    );
    await expect(validIndicator.first()).toBeVisible();
  });

  test('should show yellow indicator for under 60 cards', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.under60);
    await page.waitForTimeout(1500);

    // Should show 59/60 in yellow
    const cardCount = page.getByText('59/60');
    await expect(cardCount).toBeVisible();

    // Should have yellow coloring indicating incomplete
    const warningIndicator = page.locator('[class*="yellow"]');
    await expect(warningIndicator.first()).toBeVisible();
  });

  test('should show red indicator for over 60 cards', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.over60);
    await page.waitForTimeout(1500);

    // Should show 61/60 in red
    const cardCount = page.getByText('61/60');
    await expect(cardCount).toBeVisible();

    // Should have red coloring indicating error
    const errorIndicator = page.locator('[class*="red"]');
    await expect(errorIndicator.first()).toBeVisible();
  });
});

test.describe('Deck Validation - Copy Limits', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
    await page.goto('/decks/new');
  });

  test('should show copy limit error for 5+ copies of same card', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.exceedsCopyLimit);
    await page.waitForTimeout(1500);

    // Expand reprint groups
    await page.getByText(/Reprint Groups|Grupos de Reimpresión/i).click();

    // Should show 5/4 for Pikachu with warning
    await expect(page.getByText('5/4')).toBeVisible();
    await expect(page.getByText('⚠️')).toBeVisible();
  });

  test('should show at limit indicator for 4/4 copies', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.valid60);
    await page.waitForTimeout(1500);

    // Expand reprint groups
    await page.getByText(/Reprint Groups|Grupos de Reimpresión/i).click();

    // Should show 4/4 with checkmark for cards at limit
    await expect(page.getByText('4/4')).toBeVisible();
    await expect(page.getByText('✓')).toBeVisible();
  });

  test('should show unlimited symbol for basic energy', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.valid60);
    await page.waitForTimeout(1500);

    // Expand reprint groups
    await page.getByText(/Reprint Groups|Grupos de Reimpresión/i).click();

    // Should show infinity symbol for basic energy
    await expect(page.getByText('∞')).toBeVisible();
  });
});

test.describe('Deck Validation - Special Card Limits', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
    await page.goto('/decks/new');
  });

  test('should show ACE SPEC limit in validation summary', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.multipleAceSpec);
    await page.waitForTimeout(1500);

    // Should show ACE SPEC count
    // The validation indicator should mention ACE SPEC limit
    const aceSpecIndicator = page.getByText(/ACE SPEC/i);
    await expect(aceSpecIndicator.first()).toBeVisible();
  });
});

test.describe('Deck Validation - GLC Format Rules', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
    await page.goto('/decks/new');
  });

  test('should detect GLC format and apply singleton validation', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.glcWithDuplicates);
    await page.waitForTimeout(1500);

    // Should detect GLC format
    await expect(page.getByText('GLC')).toBeVisible();

    // Should show singleton violation error for Charizard (2 copies)
    const validationErrors = page.locator('[class*="red"]').or(
      page.getByText(/singleton|única copia/i)
    );
    await expect(validationErrors.first()).toBeVisible();
  });
});

test.describe('Deck Validation - Validation Indicator Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
    await page.goto('/decks/new');
  });

  test('should show valid checkmark for legal deck', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.valid60);
    await page.waitForTimeout(1500);

    // Should show valid indicator (green checkmark or "Valid" text)
    const validIndicator = page.getByText(/Valid|Válido/i).or(
      page.locator('svg[class*="green"]')
    );
    await expect(validIndicator.first()).toBeVisible();
  });

  test('should show invalid warning for illegal deck', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.exceedsCopyLimit);
    await page.waitForTimeout(1500);

    // Should show invalid indicator (yellow warning or "Invalid" text)
    const invalidIndicator = page.getByText(/Invalid|Inválido/i).or(
      page.locator('svg[class*="yellow"]')
    );
    await expect(invalidIndicator.first()).toBeVisible();
  });

  test('should list specific errors in validation details', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.over60);
    await page.waitForTimeout(1500);

    // Should show error list
    const errorSection = page.locator('[class*="red"]').or(
      page.getByText(/Errores|Errors/i)
    );
    await expect(errorSection.first()).toBeVisible();
  });
});

test.describe('Deck Validation - Basic Pokemon Requirement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/nombre de usuario|username/i).fill('testuser');
    await page.getByPlaceholder(/contraseña|password/i).fill('password123');
    await page.getByRole('button', { name: /Iniciar Sesión|Log In/i }).click();
    await page.waitForURL('/');
    await page.goto('/decks/new');
  });

  test('should show error when deck has no Basic Pokemon', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.noBasicPokemon);
    await page.waitForTimeout(1500);

    // Should show "No Basic Pokemon" error
    const noBasicError = page.getByText(/no basic|sin básico|pokémon básico/i);
    await expect(noBasicError.first()).toBeVisible();
  });

  test('should show Basic Pokemon count in summary', async ({ page }) => {
    await page.getByRole('button', { name: /Importar|Import/i }).click();
    await page.locator('textarea').fill(VALIDATION_TEST_DECKS.valid60);
    await page.waitForTimeout(1500);

    // Should show Basic Pokemon count in validation summary
    const basicCount = page.getByText(/Basic|Básico/i);
    await expect(basicCount.first()).toBeVisible();
  });
});
