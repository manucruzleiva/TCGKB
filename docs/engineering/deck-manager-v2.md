# Deck Manager V2 - Implementation Notes

## Date: 2025-12-20

## Overview
DM-V2 is a major enhancement to the deck management system adding community features, real-time validation, and interactive card management.

## Components Implemented

### 1. Community Decks (#28, #29)

**Backend**: `backend/src/controllers/deck.controller.js`
- `getCommunityDecks()` - Lists public decks with pagination, filtering, sorting
- Query params: `page`, `limit`, `tcg`, `format`, `sort`
- Sort options: `recent` (default), `popular` (viewCount), `votes`
- Aggregates vote counts from DeckVote collection

**Frontend**: `frontend/src/pages/DeckList.jsx`
- Tabbed interface: "Mis Mazos" / "Comunidad"
- Separate data loading for each tab
- Active filters display with clear button
- Pagination with Previous/Next

### 2. Auto-Tagging (#22)

**Component**: `frontend/src/components/decks/DeckAutoTags.jsx`

Generates tags automatically from deck content:
- **Format**: standard, expanded, glc, unlimited
- **Energy Type**: Based on energy cards (fire, water, grass, etc.)
- **Pokemon Type**: Based on Pokemon card types
- **Mechanic**: ex-focused, v-focused, vstar, vmax, single-prize, lost-zone
- **Domain** (Riftbound): fury, calm, mind, body, order, chaos
- **Champion** (Riftbound): Extracted from card names

Uses `TypeIcon` and `DomainIcon` for visual display.

### 3. Card Interactions (#23)

**Component**: `frontend/src/components/decks/DeckCardInteractive.jsx`

Interactive card management:
- **Left click**: +1 quantity
- **Right click**: -1 quantity (with confirmation at 0)
- **Ctrl + click**: Set exact quantity via dialog
- **Drag & drop**: Move cards between zones

Includes `DeckDropZone` component for drag targets.

### 4. Visual Filters (#24)

**Components**:
- `frontend/src/components/icons/TypeIcon.jsx` - TypeFilterBar
- `frontend/src/components/icons/DomainIcon.jsx` - DomainFilterBar

Filter bars with grayscale toggle:
- Active types show in color
- Inactive types show grayscale
- Click to toggle filter
- Multiple selections allowed

### 5. SVG Type Icons (#26, #27)

**Pokemon Types** (`TypeIcon.jsx`):
- 11 types: fire, water, grass, electric, psychic, fighting, dark, steel, dragon, fairy, colorless
- SVG paths with proper colors
- Tailwind sizing classes

**Riftbound Domains** (`DomainIcon.jsx`):
- 6 domains: fury, calm, mind, body, order, chaos
- SVG icons with domain colors
- Same interface as TypeIcon

### 6. Read-Only Mode (#31)

**Component**: `frontend/src/pages/DeckDetail.jsx`

```javascript
const isOwner = user && deck && (deck.userId._id === user._id || deck.userId === user._id)
```

- Non-owners see: Copy, Export buttons only
- Owners/Admins see: Edit, Delete buttons
- Cards display but not editable for non-owners

### 7. Real-Time Updates (#32)

**Backend**: Socket.io broadcasts in deck.controller.js
```javascript
io.emit('deck:vote:updated', { deckId, counts })
```

**Frontend**: Socket listeners in components
- `VoteButtons.jsx`: Listens to `deck:vote:updated`
- Updates vote counts without page refresh
- Works for all viewers of same deck

### 8. Badge "El Primero" (#33)

**Schema**: `isOriginal` field on Deck model

**Display**:
- `DeckList.jsx`: Shows trophy emoji with tooltip
- `DeckDetail.jsx`: Shows badge near deck name

Computed on deck creation based on card hash uniqueness.

### 9. Voting System

**Backend**:
- `voteDeck()` - Toggle vote (up/down)
- `getDeckVotes()` - Get vote counts
- Supports both authenticated and anonymous (fingerprint) voting
- DeckVote model with user/fingerprint reference

**Frontend**: `VoteButtons.jsx`
- Upvote/downvote buttons with counts
- Real-time updates via Socket.io
- Optimistic UI updates

## Architecture

```
DeckList.jsx
├── DeckImportModal.jsx
│   └── DeckValidationIndicator.jsx
├── DeckAutoTags.jsx
│   ├── TypeIcon.jsx
│   └── DomainIcon.jsx
├── TypeFilterBar (from TypeIcon.jsx)
└── VoteButtons.jsx

DeckDetail.jsx
├── DeckAutoTags.jsx
├── VoteButtons.jsx
└── DeckCardInteractive.jsx
    └── DeckDropZone.jsx

DeckBuilder.jsx
├── DeckAutoTags.jsx
├── DeckValidationIndicator.jsx
└── DeckCardInteractive.jsx
```

## i18n Keys

All new strings added to both `es.js` and `en.js`:
- `decks.tabs.*` - Tab labels
- `decks.vote.*` - Voting labels
- `decks.originalBadge.*` - Badge tooltip
- `deckAutoTags.*` - All tag types and values

## Performance

- Community endpoint uses MongoDB aggregation for vote counts
- Batch card fetching for deck import (~5-10x faster)
- Socket.io for real-time without polling
- Type icons use inline SVG (no external requests)

## Security

- isOwner check prevents unauthorized edits
- Anonymous voting uses fingerprint to prevent spam
- Vote toggling prevents double-voting
- Public/private visibility enforced on all endpoints

---

## Sprint 2 Bug Fixes (2025-12-20)

### #85 - Bug Report Button Hidden in Modals

**Problem**: BugReportButton (z-40) was behind DeckImportModal (z-50).

**Fix**: `frontend/src/components/common/BugReportButton.jsx`
```javascript
// Changed from z-40 to z-[60]
className="fixed bottom-4 right-4 z-[60] ..."
```

### #86 - Import Cards Not Showing Thumbnails

**Problem**: handleImport set `imageSmall: null` instead of using enriched data.

**Fix**: `frontend/src/pages/DeckBuilder.jsx`
```javascript
imageSmall: card.imageSmall || null  // Use enriched image from parse
```

### #87 - Bulk Add Input Appends Instead of Replaces

**Problem**: Ctrl+click quantity input showed "13" when typing "3" (appended).

**Fix**: `frontend/src/components/decks/DeckCardInteractive.jsx`
```javascript
<input
  onFocus={(e) => e.target.select()}  // Auto-select for replacement
  ...
/>
```

### #88 - Error Saving Edited Deck

**Problems**:
1. Mongoose quantity validation failed (max: 4, but Energy needs up to 60)
2. `tcgSystem` not being saved on update

**Fixes**:
- `backend/src/models/Deck.js`: Changed `quantity.max` from 4 to 60
- `backend/src/controllers/deck.controller.js`: Added tcgSystem to updateDeck

```javascript
// Model
quantity: { max: 60 }  // Allow up to 60 for Basic Energy

// Controller
const { name, description, cards, isPublic, tags, importString, tcgSystem } = req.body
if (tcgSystem) deck.tcgSystem = tcgSystem
```

### #89 - Export Formatting Wrong

**Problem**: Export was just `quantity cardId` without proper sections.

**Fix**: `frontend/src/services/deckService.js` - Rewrote formatToTCGLive
```javascript
// Output format:
// Pokémon: 12
// 4 Pikachu ex
// ...
// Trainer: 36
// 4 Professor's Research
// ...
// Energy: 12
// 8 Electric Energy
```

### #91 - Filter Bar Not Switching Pokemon/Riftbound

**Problem**: Filter bar showed Pokemon types even for Riftbound decks.

**Fix**: `frontend/src/pages/DeckBuilder.jsx`
- Added `activeDomains` state and `toggleDomainFilter` function
- Conditional rendering based on `tcgSystem`

```jsx
{tcgSystem === 'riftbound' ? (
  <DomainFilterBar domains={ALL_DOMAINS} activeDomains={activeDomains} ... />
) : (
  <TypeFilterBar types={ALL_TYPES} activeTypes={activeTypes} ... />
)}
```

---

## Sprint 3 Fixes (2025-12-20)

### #137 - Right-Click Not Working on Deck Cards

**Problem**: Right-click on cards in deck mode didn't reduce quantity when hover overlay was visible.

**Fix**: `frontend/src/components/decks/DeckCardInteractive.jsx`
```jsx
{/* Hover controls - onContextMenu to handle right-click on overlay */}
<div
  className="absolute inset-0 bg-black/70 ..."
  onContextMenu={handleContextMenu}  // Added
>
```

### #138 - Escape Key for Quantity Input

**Problem**: No way to cancel quantity input without clicking outside.

**Fix**: `frontend/src/components/decks/DeckCardInteractive.jsx`
```javascript
const handleQuantityKeyDown = (e) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    setShowQuantityInput(false)
  }
}

// Added to both inputs
<input onKeyDown={handleQuantityKeyDown} ... />
```

### #124 - Header Navigation Refactor

**Problem**: All navigation hidden in hamburger menu, even on desktop.

**Fix**: `frontend/src/components/layout/Header.jsx`

**Desktop (lg+):**
- Logo is now a direct link to Home
- Visible nav: Cards, Decks, Roadmap
- "More" dropdown for secondary links (Artists, Changelog, Relationship Map)
- Active page highlighting with primary color

**Mobile (<lg):**
- Hamburger menu with all links
- Icon changes to X when open

```jsx
{/* Desktop Navigation */}
<nav className="hidden lg:flex items-center gap-1">
  <Link to="/catalog" className={activeStyles}>Cards</Link>
  <Link to="/decks" className={activeStyles}>Decks</Link>
  <Link to="/roadmap" className={activeStyles}>Roadmap</Link>
  <div>More ▼</div>
</nav>

{/* Mobile Hamburger */}
<div className="lg:hidden">
  <button>☰</button>
</div>
```

---

## Sprint 4 Fixes (2025-12-20)

### #144 - Auto-Name Deck on Import

**Problem**: Importing a deck without providing a name showed an error instead of auto-generating one.

**Fix**: `frontend/src/pages/DeckList.jsx`
```javascript
// Auto-generate name if not provided (#144)
const deckName = importName.trim() || (language === 'es' ? 'Mazo sin título' : 'Untitled Deck')
```

### #145 - Import Only Getting 52/60 Cards

**Problems**:
1. Parser rejected cards with quantity > 4 (energy cards lost)
2. Card IDs generated incorrectly (e.g., "gimmighoul-ssp-97" instead of "ssp-97")

**Fixes**: `backend/src/controllers/deck.controller.js`

```javascript
// 1. Allow up to 60 copies per card (was capped at 4)
if (quantity > 0 && quantity <= 60 && cardId) {
  existing.quantity = Math.min(existing.quantity + quantity, 60)
}

// 2. Properly extract SET-NUMBER format
// "4 Gimmighoul SSP 97" -> cardId: "ssp-97", name: "Gimmighoul"
const setNumberMatch = cardInfo.match(/^(.+?)\s+([A-Z]{2,5})\s+(\d{1,4})$/i)
if (setNumberMatch) {
  name = setNumberMatch[1].trim()
  cardId = setNumberMatch[2].toLowerCase() + '-' + setNumberMatch[3]
}
```

### #146 - Visibility Toggle Button

**Problem**: No quick way to toggle deck visibility (public/private) from the deck list.

**Fix**: `frontend/src/pages/DeckList.jsx`

Added clickable toggle button on "My Decks" tab:
- Shows eye icon (open/closed) with Public/Private label
- Click to toggle visibility without opening deck
- Uses existing `deckService.updateDeck` API

```jsx
{activeTab === 'mine' ? (
  <button onClick={(e) => handleToggleVisibility(e, deck._id, deck.isPublic)}>
    {deck.isPublic ? '👁 Public' : '🚫 Private'}
  </button>
) : (
  <span>{deck.isPublic ? 'Public' : 'Private'}</span>
)}
```

### #147 - Cards Display as 'Other' Instead of Correct Category

**Problem**: Cards imported via deck import were all categorized as "other" instead of Pokemon/Trainer/Energy.

**Root Cause**: `parseTCGLiveFormat` skipped section headers instead of tracking which section cards belong to.

**Fix**: Modified both parsers to track section headers:

`backend/src/controllers/deck.controller.js`:
```javascript
let currentSection = null // Track current section

// Check for section headers and track the section
const sectionMatch = trimmed.match(/^(Pokemon|Pokémon|Trainer|Energy|Total):\s*\d*$/i)
if (sectionMatch) {
  const sectionName = sectionMatch[1].toLowerCase()
  if (sectionName === 'pokemon' || sectionName === 'pokémon') {
    currentSection = 'Pokémon'
  } else if (sectionName === 'trainer') {
    currentSection = 'Trainer'
  } else if (sectionName === 'energy') {
    currentSection = 'Energy'
  }
  continue
}

// When parsing card, assign supertype from current section
const card = { cardId, name, quantity }
if (currentSection) card.supertype = currentSection
cards.push(card)
```

`frontend/src/services/deckService.js`:
- Same section tracking logic added to client-side parser

### #149 - Riftbound Deck Stats Showing Pokemon Structure

**Problem**: When creating a Riftbound deck, the stats window showed Pokemon TCG structure (Pokemon/Trainer/Energy) instead of Riftbound structure.

**Root Cause**: Stats section was hardcoded for Pokemon TCG categories.

**Fix**: `frontend/src/pages/DeckBuilder.jsx`

Added Riftbound-specific stats calculations:
```javascript
// Riftbound TCG stats
const legendCount = cards.filter(c => c.cardType === 'Legend').reduce((sum, c) => sum + c.quantity, 0)
const battlefieldCount = cards.filter(c => c.name?.toLowerCase().includes('battlefield')).reduce((sum, c) => sum + c.quantity, 0)
const runeCount = cards.filter(c => c.name?.toLowerCase().includes('rune')).reduce((sum, c) => sum + c.quantity, 0)
const mainDeckCount = cards.filter(c =>
  !c.name?.toLowerCase().includes('rune') &&
  !c.name?.toLowerCase().includes('battlefield') &&
  c.cardType !== 'Legend'
).reduce((sum, c) => sum + c.quantity, 0)

// Target deck size based on TCG
const targetDeckSize = tcgSystem === 'riftbound' ? 56 : 60
```

Conditional UI rendering:
- Pokemon TCG: Shows Pokemon/Trainer/Energy counts (60 card target)
- Riftbound TCG: Shows Main Deck (40), Legend (1), Battlefields (3), Runes (12) (56 card target)
- Visual bar colors match category colors
- Green highlight when each section reaches target count

### #150 - Riftbound Deck Allowing 4 Copies Instead of 3

**Problem**: When building a Riftbound deck, users could add 4 copies of a card instead of the Riftbound limit of 3.

**Fix**: `frontend/src/pages/DeckBuilder.jsx`

Added TCG-specific copy limit helper:
```javascript
// Get max copies allowed based on TCG system
const getMaxCopies = (card, currentTcg = tcgSystem) => {
  // Energy cards in Pokemon TCG can have up to 60 copies
  if (currentTcg !== 'riftbound' && card?.supertype === 'Energy') {
    return 60
  }
  // Riftbound: 3 copies max for all cards
  if (currentTcg === 'riftbound') {
    return 3
  }
  // Pokemon TCG default: 4 copies
  return 4
}
```

Updated all card quantity handlers to use `getMaxCopies()`:
- `addCard()` - uses getMaxCopies for new and existing cards
- `setCardQuantity()` - uses getMaxCopies for quantity changes
- `DeckCardInteractive` components - pass getMaxCopies(card) as maxQuantity prop

### #152 - Filter Bar Not Working in Deck Builder Search

**Problem**: Type/Domain filter bar icons were not filtering search results in deck builder.

**Root Cause**: The autocomplete search endpoint wasn't returning `types` or `domains` fields.

**Fix**: `backend/src/services/unifiedTCG.service.js`

Added missing fields to search result mapping:
```javascript
.map(card => ({
  id: card.id,
  name: card.name,
  supertype: card.supertype,
  types: card.types || [],     // Added for Pokemon filter
  domains: card.domains || [], // Added for Riftbound filter
  images: card.images,
  // ... rest of fields
}))
```

Fixed in both Level 2 (MongoDB cache) and Level 3 (API fetch) result mappings.
