# PTCGL Import Format Support

**Date**: 2025-12-26
**Status**: Implemented ✅
**Related Issues**: Deck import enhancement

## Overview

Added support for Pokemon TCG Live (PTCGL) import format, which uses 3-letter set codes instead of TCGdex IDs.

## Format Specification

### PTCGL Format
```
<quantity> <card name> <PTCGL code> <card number>
```

**Example**:
```
1 Gholdengo ex PAR 139
4 Pikachu ex SVI 057
2 Miraidon ex PAR 121
```

### TCGdex Format (Internal)
```
<tcgdex set id>-<card number>
```

**Example**:
```
sv04-139  (Gholdengo ex)
sv01-057  (Pikachu ex)
sv04-121  (Miraidon ex)
```

## Implementation

### 1. Set Code Mapping

**File**: `backend/src/utils/setCodeMapping.js`

Created comprehensive mapping between set names and PTCGL codes:

```javascript
const SET_NAME_TO_PTCGL = {
  'Scarlet & Violet': 'SVI',
  'Paldea Evolved': 'PAL',
  'Obsidian Flames': 'OBF',
  '151': 'MEW',
  'Paradox Rift': 'PAR',
  // ... 100+ more sets
}
```

**Functions**:
- `getPTCGLCode(setName)` - Get PTCGL code from set name
- `getSetName(ptcglCode)` - Get set name from PTCGL code

### 2. Cache Enhancement

**File**: `scripts/sync-pokemon-cache.js`

Modified `transformCard()` to populate `set.tcgOnline` field:

```javascript
function transformCard(card) {
  // Get PTCGL code from set name if tcgOnline is null
  const ptcglCode = card.set?.tcgOnline ||
                    (card.set?.name ? getPTCGLCode(card.set.name) : null)

  return {
    ...card,
    set: {
      ...card.set,
      tcgOnline: ptcglCode  // Now contains PTCGL code
    }
  }
}
```

**Behavior**:
- If TCGdex provides `tcgOnline` → use it
- If `tcgOnline` is null → lookup from set name via mapping
- Applies to all cards during sync

### 3. Card Enrichment

**File**: `backend/src/services/cardEnricher.service.js`

Updated `getNormalizedCardIds()` to support PTCGL codes:

```javascript
function getNormalizedCardIds(cardId, setCode = null, number = null) {
  const variations = []

  // Try original cardId
  if (cardId) {
    variations.push(cardId.toLowerCase())
  }

  // Convert PTCGL code to TCGdex ID
  if (setCode && number) {
    const upperSetCode = setCode.toUpperCase()
    if (DECK_CODE_TO_TCGDEX[upperSetCode]) {
      const tcgdexCode = DECK_CODE_TO_TCGDEX[upperSetCode]
      variations.push(`${tcgdexCode}-${number}`)  // e.g., "sv04-139"
    }
  }

  return variations
}
```

**Card Lookup Flow**:
1. Parser extracts: `setCode: "PAR"`, `number: "139"`
2. Enricher creates variations: `["par-139", "sv04-139"]`
3. Cache query searches both variations
4. Returns matching card data

### 4. Parser Support

**File**: `backend/src/services/deckParser.service.js`

Already supported PTCGL format via regex:

```javascript
// Standard PTCGL format: "4 Pikachu ex SVI 057"
const cardMatch = line.match(/^(\d+)\s+(.+?)\s+([A-Z]{2,4})\s+(\d{1,4})$/i)
```

Extracts:
- `cardMatch[1]` → quantity (4)
- `cardMatch[2]` → name ("Pikachu ex")
- `cardMatch[3]` → setCode ("SVI")
- `cardMatch[4]` → number ("057")

## Code Mappings

### Scarlet & Violet Era

| PTCGL Code | TCGdex ID | Set Name |
|------------|-----------|----------|
| SVI | sv01 | Scarlet & Violet |
| PAL | sv02 | Paldea Evolved |
| OBF | sv03 | Obsidian Flames |
| MEW | sv03.5 | 151 |
| PAR | sv04 | Paradox Rift |
| PAF | sv04.5 | Paldean Fates |
| TEF | sv05 | Temporal Forces |
| TWM | sv06 | Twilight Masquerade |
| SFA | sv06.5 | Shrouded Fable |
| SCR | sv07 | Stellar Crown |
| SSP | sv08 | Surging Sparks |
| PRE | sv08.5 | Prismatic Evolutions |
| JTG | sv09 | Journey Together |

### Sword & Shield Era

| PTCGL Code | TCGdex ID | Set Name |
|------------|-----------|----------|
| SSH | swsh1 | Sword & Shield |
| RCL | swsh2 | Rebel Clash |
| DAA | swsh3 | Darkness Ablaze |
| VIV | swsh4 | Vivid Voltage |
| SHF | swsh4.5 | Shining Fates |
| BST | swsh5 | Battle Styles |
| CRE | swsh6 | Chilling Reign |
| EVS | swsh7 | Evolving Skies |
| FST | swsh8 | Fusion Strike |
| BRS | swsh9 | Brilliant Stars |
| ASR | swsh10 | Astral Radiance |
| PGO | swsh10.5 | Pokémon GO |
| LOR | swsh11 | Lost Origin |
| SIT | swsh12 | Silver Tempest |
| CRZ | swsh12.5 | Crown Zenith |

*See `backend/src/utils/setCodeMapping.js` for complete list (100+ sets)*

## Testing

**Test File**: `test-ptcgl-import.mjs`

Sample test deck with PTCGL format:
```
Pokemon: 12
4 Pikachu ex SVI 057
2 Miraidon ex PAR 121
3 Raichu TWM 055

Trainer: 36
4 Iono PAL 185
4 Professor's Research SVI 189
...
```

**Test Results**: ✅ All cards parsed correctly
- `SVI 057` → `sv01-057` ✅
- `PAR 121` → `sv04-121` ✅
- `TWM 055` → `sv06-055` ✅
- `ASR 046` → `swsh10-046` ✅

## Migration

### Running the Sync

To populate `set.tcgOnline` in existing cache:

```bash
node scripts/sync-pokemon-cache.js
```

This will:
1. Fetch all cards from TCGdex
2. For each card, set `set.tcgOnline` to PTCGL code
3. Update MongoDB cache

**Note**: Requires MongoDB credentials in `.env`

### Backwards Compatibility

✅ **Fully backwards compatible**:
- Old format (`sv04-139`) still works
- New format (`PAR 139`) also works
- Both resolve to same card via variations

## Benefits

1. **User-Friendly**: Users can copy/paste directly from PTCGL
2. **Standard Format**: PTCGL is the official format
3. **No Breaking Changes**: Old imports still work
4. **Comprehensive**: Supports 100+ sets from all eras

## Future Enhancements

- [ ] Auto-detect and suggest PTCGL codes during manual card entry
- [ ] Export decks in PTCGL format
- [ ] Show PTCGL code in card display UI
- [ ] Add PTCGL code to API responses

## Related Files

- `backend/src/utils/setCodeMapping.js` - Set code mappings
- `scripts/sync-pokemon-cache.js` - Cache sync with PTCGL codes
- `backend/src/services/cardEnricher.service.js` - Card lookup with variations
- `backend/src/services/deckParser.service.js` - PTCGL format parsing
- `test-ptcgl-import.mjs` - Test suite

## Author

@raj - Developer
Reviewed by: (pending CAG review)
