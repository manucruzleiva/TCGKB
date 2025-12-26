/**
 * Mapping of Pokemon TCG Set Names to PTCGL Codes
 *
 * This mapping allows conversion between:
 * - TCGdex set names (e.g., "Paradox Rift")
 * - PTCGL codes (e.g., "PAR")
 *
 * Used for deck import/export compatibility with PTCGL format
 */

export const SET_NAME_TO_PTCGL = {
  // Scarlet & Violet Series
  'Scarlet & Violet': 'SVI',
  'Paldea Evolved': 'PAL',
  'Obsidian Flames': 'OBF',
  '151': 'MEW',
  'Paradox Rift': 'PAR',
  'Paldean Fates': 'PAF',
  'Temporal Forces': 'TEF',
  'Twilight Masquerade': 'TWM',
  'Shrouded Fable': 'SFA',
  'Stellar Crown': 'SCR',
  'Surging Sparks': 'SSP',
  'Prismatic Evolutions': 'PRE',

  // Sword & Shield Series
  'Sword & Shield': 'SSH',
  'Rebel Clash': 'RCL',
  'Darkness Ablaze': 'DAA',
  'Champion\'s Path': 'CPA',
  'Vivid Voltage': 'VIV',
  'Shining Fates': 'SHF',
  'Battle Styles': 'BST',
  'Chilling Reign': 'CRE',
  'Evolving Skies': 'EVS',
  'Celebrations': 'CEL',
  'Fusion Strike': 'FST',
  'Brilliant Stars': 'BRS',
  'Astral Radiance': 'ASR',
  'Pokémon GO': 'PGO',
  'Lost Origin': 'LOR',
  'Silver Tempest': 'SIT',
  'Crown Zenith': 'CRZ',

  // Sun & Moon Series
  'Sun & Moon': 'SUM',
  'Guardians Rising': 'GRI',
  'Burning Shadows': 'BUS',
  'Shining Legends': 'SLG',
  'Crimson Invasion': 'CIN',
  'Ultra Prism': 'UPR',
  'Forbidden Light': 'FLI',
  'Celestial Storm': 'CES',
  'Dragon Majesty': 'DRM',
  'Lost Thunder': 'LOT',
  'Team Up': 'TEU',
  'Detective Pikachu': 'DET',
  'Unbroken Bonds': 'UNB',
  'Unified Minds': 'UNM',
  'Hidden Fates': 'HIF',
  'Cosmic Eclipse': 'CEC',

  // XY Series
  'XY': 'XY',
  'Flashfire': 'FLF',
  'Furious Fists': 'FFI',
  'Phantom Forces': 'PHF',
  'Primal Clash': 'PRC',
  'Roaring Skies': 'ROS',
  'Ancient Origins': 'AOR',
  'BREAKthrough': 'BKT',
  'BREAKpoint': 'BKP',
  'Generations': 'GEN',
  'Fates Collide': 'FCO',
  'Steam Siege': 'STS',
  'Evolutions': 'EVO',
  'Kalos Starter Set': 'KSS',
  'Double Crisis': 'DCR',

  // Black & White Series
  'Black & White': 'BLW',
  'Emerging Powers': 'EPO',
  'Noble Victories': 'NVI',
  'Next Destinies': 'NXD',
  'Dark Explorers': 'DEX',
  'Dragons Exalted': 'DRX',
  'Dragon Vault': 'DRV',
  'Boundaries Crossed': 'BCR',
  'Plasma Storm': 'PLS',
  'Plasma Freeze': 'PLF',
  'Plasma Blast': 'PLB',
  'Legendary Treasures': 'LTR',

  // HeartGold & SoulSilver Series
  'HeartGold SoulSilver': 'HS',
  'Unleashed': 'UL',
  'Undaunted': 'UD',
  'Triumphant': 'TM',
  'Call of Legends': 'CL',

  // Diamond & Pearl Series
  'Diamond & Pearl': 'DP',
  'Mysterious Treasures': 'MT',
  'Secret Wonders': 'SW',
  'Great Encounters': 'GE',
  'Majestic Dawn': 'MD',
  'Legends Awakened': 'LA',
  'Stormfront': 'SF',

  // Platinum Series
  'Platinum': 'PL',
  'Rising Rivals': 'RR',
  'Supreme Victors': 'SV',
  'Arceus': 'AR',

  // EX Series
  'Ruby & Sapphire': 'RS',
  'Sandstorm': 'SS',
  'Dragon': 'DR',
  'Team Magma vs Team Aqua': 'MA',
  'Hidden Legends': 'HL',
  'FireRed & LeafGreen': 'RG',
  'Team Rocket Returns': 'RR',
  'Deoxys': 'DX',
  'Emerald': 'EM',
  'Unseen Forces': 'UF',
  'Delta Species': 'DS',
  'Legend Maker': 'LM',
  'Holon Phantoms': 'HP',
  'Crystal Guardians': 'CG',
  'Dragon Frontiers': 'DF',
  'Power Keepers': 'PK',

  // E-Card Series
  'Expedition Base Set': 'EX',
  'Aquapolis': 'AQ',
  'Skyridge': 'SK',

  // Neo Series
  'Neo Genesis': 'N1',
  'Neo Discovery': 'N2',
  'Neo Revelation': 'N3',
  'Neo Destiny': 'N4',

  // Gym Series
  'Gym Heroes': 'G1',
  'Gym Challenge': 'G2',

  // Base / Classic Series
  'Base Set': 'BS',
  'Jungle': 'JU',
  'Fossil': 'FO',
  'Base Set 2': 'B2',
  'Team Rocket': 'TR',
  'Legendary Collection': 'LC',

  // Promos
  'Wizards Black Star Promos': 'PR',
  'Nintendo Black Star Promos': 'PR-NP',
  'DP Black Star Promos': 'PR-DPP',
  'HGSS Black Star Promos': 'PR-HS',
  'BW Black Star Promos': 'PR-BLW',
  'XY Black Star Promos': 'PR-XY',
  'SM Black Star Promos': 'PR-SM',
  'SWSH Black Star Promos': 'PR-SW',
  'SVP Black Star Promos': 'PR-SV'
};

/**
 * Reverse mapping: PTCGL Code to Set Name
 */
export const PTCGL_TO_SET_NAME = Object.fromEntries(
  Object.entries(SET_NAME_TO_PTCGL).map(([name, code]) => [code, name])
);

/**
 * Get PTCGL code from set name
 * @param {string} setName - The set name from TCGdex
 * @returns {string|null} - The PTCGL code or null if not found
 */
export function getPTCGLCode(setName) {
  return SET_NAME_TO_PTCGL[setName] || null;
}

/**
 * Get set name from PTCGL code
 * @param {string} ptcglCode - The PTCGL code
 * @returns {string|null} - The set name or null if not found
 */
export function getSetName(ptcglCode) {
  return PTCGL_TO_SET_NAME[ptcglCode] || null;
}
