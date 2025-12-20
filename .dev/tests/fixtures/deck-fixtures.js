/**
 * Test fixtures for Deck Manager V2 testing
 * Contains sample deck strings for different formats and TCGs
 */

// =============================================================================
// POKEMON TCG - STANDARD FORMAT
// =============================================================================

/**
 * Valid 60-card Standard deck with Pikachu ex
 * - 60 cards total
 * - Max 4 copies per card
 * - 1 ACE SPEC
 * - Has Basic Pokemon
 */
export const POKEMON_STANDARD_VALID = `Pokémon: 12
4 Pikachu ex SVI 057
4 Raichu SVI 026
4 Pichu SVI 025

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
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

/**
 * Invalid deck - exceeds 4 copies of Professor's Research
 */
export const POKEMON_STANDARD_EXCEEDS_COPIES = `Pokémon: 8
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
4 Pokégear 3.0 SVI 186
3 Iono PAL 185

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

/**
 * Invalid deck - has 2 ACE SPEC cards
 */
export const POKEMON_STANDARD_MULTIPLE_ACE_SPEC = `Pokémon: 12
4 Pikachu ex SVI 057
4 Raichu SVI 026
4 Pichu SVI 025

Trainer: 36
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
1 Prime Catcher TEF 157
1 Hero's Cape TEF 152
4 Battle VIP Pass FST 225
4 Pokégear 3.0 SVI 186
2 Iono PAL 185

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

/**
 * Invalid deck - no Basic Pokemon
 */
export const POKEMON_STANDARD_NO_BASIC = `Pokémon: 8
4 Raichu SVI 026
4 Pikachu ex SVI 057

Trainer: 40
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
4 Nest Ball SVI 181
4 Ultra Ball SVI 196
4 Electric Generator SVI 170
4 Switch SVI 194
4 Rare Candy SVI 191
4 Battle VIP Pass FST 225
4 Pokégear 3.0 SVI 186
4 Iono PAL 185

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

/**
 * Invalid deck - only 50 cards
 */
export const POKEMON_STANDARD_INCOMPLETE = `Pokémon: 8
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

/**
 * Deck with reprints - same card from different sets
 */
export const POKEMON_STANDARD_WITH_REPRINTS = `Pokémon: 12
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
4 Pokégear 3.0 SVI 186

Energy: 12
8 Basic Lightning Energy SVE 004
4 Double Turbo Energy BRS 151`;

// =============================================================================
// POKEMON TCG - GLC FORMAT
// =============================================================================

/**
 * Valid GLC Fire deck
 * - 60 cards total
 * - Singleton (1 copy each)
 * - Single Pokemon type (Fire)
 * - No Rule Box Pokemon
 * - No ACE SPEC
 */
export const POKEMON_GLC_VALID_FIRE = `Pokémon: 15
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
1 Computer Search BCR 137
1 Guzma BUS 115
1 N FCO 105
1 Colress PLS 118
1 Rescue Stretcher GRI 130
1 Field Blower GRI 125
1 Enhanced Hammer GRI 124

Energy: 15
15 Basic Fire Energy SVE 002`;

/**
 * Invalid GLC - has Rule Box Pokemon (Charizard ex)
 */
export const POKEMON_GLC_INVALID_RULE_BOX = `Pokémon: 15
1 Charmander SVI 023
1 Charmeleon SVI 024
1 Charizard ex MEW 006
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

/**
 * Invalid GLC - multiple Pokemon types (Fire + Water)
 */
export const POKEMON_GLC_INVALID_MULTI_TYPE = `Pokémon: 15
1 Charmander SVI 023
1 Charmeleon SVI 024
1 Charizard SVI 025
1 Squirtle SVI 007
1 Wartortle SVI 008
1 Blastoise SVI 009
1 Growlithe SVI 058
1 Arcanine SVI 059
1 Ponyta SVI 077
1 Rapidash SVI 078
1 Magmar SVI 096
1 Flareon SVI 136
1 Cyndaquil SVI 155
1 Quilava SVI 156
1 Typhlosion SVI 157

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
10 Basic Fire Energy SVE 002
5 Basic Water Energy SVE 003`;

/**
 * Invalid GLC - not singleton (2 copies of a card)
 */
export const POKEMON_GLC_INVALID_NOT_SINGLETON = `Pokémon: 15
2 Charmander SVI 023
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

Energy: 15
15 Basic Fire Energy SVE 002`;

// =============================================================================
// POKEMON TCG POCKET FORMAT
// =============================================================================

/**
 * Pokemon TCG Pocket format deck
 */
export const POKEMON_POCKET_VALID = `Pikachu ex x2
Raichu x2
Professor's Research x2
Poke Ball x2
Potion x2
Electric Energy x10`;

// =============================================================================
// RIFTBOUND TCG - CONSTRUCTED
// =============================================================================

/**
 * Valid Riftbound deck (Order/Calm domains)
 * - 40 Main Deck cards
 * - 1 Legend
 * - 3 Battlefields
 * - 12 Runes
 */
export const RIFTBOUND_VALID = `1 Leona, Radiant Dawn
3 Clockwork Keeper
3 Stalwart Poro
3 Solari Shieldbearer
3 Sunlit Guardian
3 Fiora, Victorious
3 Sett, Kingpin
3 Brightsteel Formation
3 Rahvun, Daylight's Spear
3 Concerted Strike
3 Defy
3 En Garde
3 Rune Prison
3 Call to Glory
6 Order Rune
6 Calm Rune
1 Grove of the God-Willow
1 Monastery of Hirana
1 Windswept Hillock`;

/**
 * Invalid Riftbound - wrong domain cards
 */
export const RIFTBOUND_INVALID_DOMAIN = `1 Leona, Radiant Dawn
3 Clockwork Keeper
3 Stalwart Poro
3 Solari Shieldbearer
3 Sunlit Guardian
3 Fiora, Victorious
3 Sett, Kingpin
3 Brightsteel Formation
3 Rahvun, Daylight's Spear
3 Concerted Strike
3 Defy
3 En Garde
3 Rune Prison
3 Decimate
6 Fury Rune
6 Chaos Rune
1 Grove of the God-Willow
1 Monastery of Hirana
1 Windswept Hillock`;

/**
 * Invalid Riftbound - exceeds 3 copies
 */
export const RIFTBOUND_INVALID_COPIES = `1 Leona, Radiant Dawn
4 Clockwork Keeper
3 Stalwart Poro
3 Solari Shieldbearer
3 Sunlit Guardian
3 Fiora, Victorious
3 Sett, Kingpin
3 Brightsteel Formation
3 Rahvun, Daylight's Spear
3 Concerted Strike
3 Defy
2 En Garde
3 Rune Prison
3 Call to Glory
6 Order Rune
6 Calm Rune
1 Grove of the God-Willow
1 Monastery of Hirana
1 Windswept Hillock`;

// =============================================================================
// SIMPLE TEST DATA
// =============================================================================

/**
 * Simple deck for basic import testing
 */
export const SIMPLE_POKEMON_DECK = `4 Pikachu SV1 25
3 Raichu SV1 26
4 Professor's Research SVI 189
4 Nest Ball SVI 181
4 Electric Generator SVI 170`;

/**
 * Empty/invalid content
 */
export const INVALID_DECK_GIBBERISH = `this is not a valid deck
random text here
123 456 789`;

/**
 * Empty string
 */
export const EMPTY_DECK = '';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Count total cards in a deck string
 * @param {string} deckString
 * @returns {number}
 */
export function countCards(deckString) {
  let total = 0;
  const lines = deckString.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\d+)\s+/);
    if (match) {
      total += parseInt(match[1], 10);
    }
    // Handle Pocket format: "Card x2"
    const pocketMatch = line.match(/x(\d+)$/);
    if (pocketMatch) {
      total += parseInt(pocketMatch[1], 10);
    }
  }
  return total;
}

/**
 * Test credentials
 */
export const TEST_USER = {
  username: 'testuser',
  password: 'password123'
};

/**
 * API endpoints for testing
 */
export const API_ENDPOINTS = {
  PARSE_DECK: '/api/decks/parse',
  CREATE_DECK: '/api/decks',
  GET_COMMUNITY: '/api/decks/community',
  VOTE: (id) => `/api/decks/${id}/vote`,
  GET_VOTES: (id) => `/api/decks/${id}/votes`
};
